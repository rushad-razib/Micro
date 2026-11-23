import {
    AlignmentType,
    BorderStyle,
    Document,
    ImageRun,
    Packer,
    PageBorderDisplay,
    PageBorderOffsetFrom,
    PageBreak,
    Paragraph,
    SectionType,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
} from 'docx';
import { fontGroup } from './docx-to-pdf.js';

const WORD_FONTS = {
    sans: 'Arial',
    serif: 'Times New Roman',
    mono: 'Courier New',
};

/**
 * Open a PDF for layout. Node tests pass a filesystem font directory and
 * disable the worker. The browser passes the Vite font URL.
 *
 * @param {Uint8Array} data
 * @param {{ workerSrc?: string, standardFontDataUrl?: string, disableWorker?: boolean }} [options]
 */
export async function openPdf(data, options = {}) {
    const pdfjs = await loadPdfjs(options.disableWorker === true);

    if (options.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = options.workerSrc;
    }

    let standardFontDataUrl = options.standardFontDataUrl;

    if (standardFontDataUrl && ! standardFontDataUrl.endsWith('/')) {
        standardFontDataUrl += '/';
    }

    try {
        return await pdfjs.getDocument({
            data,
            disableWorker: options.disableWorker === true,
            standardFontDataUrl,
            fontExtraProperties: true,
        }).promise;
    } catch {
        throw new Error('Could not open this PDF. It may be damaged or password-protected.');
    }
}

/**
 * Build a DOCX that follows the PDF's lines, pictures, ruled tables, and page frames.
 *
 * @param {object} pdf
 * @param {Uint8Array} source
 */
export async function layoutPdf(pdf, source) {
    const pdfjs = await loadPdfjs(typeof process !== 'undefined' && Boolean(process.versions?.node));
    const fontLists = await readFontLists(source);
    const pages = [];
    let fontCursor = 0;
    let textCount = 0;

    for (let number = 1; number <= pdf.numPages; number += 1) {
        const page = await pdf.getPage(number);
        const viewport = page.getViewport({ scale: 1 });
        const content = await page.getTextContent();
        const rawItems = (content.items || []).filter((item) => item?.str);
        const readable = rawItems.some((item) => item.str.trim());
        const fonts = readable ? fontLists[fontCursor] || [] : [];

        if (readable) {
            fontCursor += 1;
            textCount += 1;
        }

        const drawn = await readDrawings(page, pdfjs.OPS, viewport.width, viewport.height);
        pages.push(buildPage(rawItems, fonts, drawn, viewport.width, viewport.height));
    }

    if (textCount === 0) {
        throw new Error('No text layer found. Scanned PDFs need OCR elsewhere before conversion.');
    }

    const doc = new Document({
        sections: groupSections(pages).map((section, index) => ({
            properties: sectionProperties(section, index > 0),
            children: sectionChildren(section.pages),
        })),
    });
    const blob = await Packer.toBlob(doc);

    return {
        blob,
        mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        extension: 'docx',
        meta: {
            pageCount: pdf.numPages,
            paragraphCount: pages.reduce((sum, page) => sum + page.blocks.length, 0),
            note: 'Lines, alignment, bold, pictures, ruled tables, and a page frame are kept. Columns and scans are not.',
        },
    };
}

/**
 * Font resource names in the order each page first uses them.
 * PDF.js labels those fonts g_d0_f1, g_d0_f2, and so on.
 *
 * @param {Uint8Array} data
 */
async function readFontLists(data) {
    const lists = [];
    const raw = latin1(data);
    const pattern = /stream\r?\n/g;
    let match = pattern.exec(raw);

    while (match) {
        const start = match.index + match[0].length;
        const end = raw.indexOf('endstream', start);

        if (end < 0) {
            break;
        }

        const text = await inflateLatin1(data.subarray(start, end));

        if (text.includes(' Tf')) {
            const names = [];
            const seen = new Set();

            for (const found of text.matchAll(/\/([A-Za-z][A-Za-z0-9+\-]*)\s+[\d.]+\s+Tf/g)) {
                if (! seen.has(found[1])) {
                    seen.add(found[1]);
                    names.push(found[1]);
                }
            }

            if (names.length) {
                lists.push(names);
            }
        }

        match = pattern.exec(raw);
    }

    return lists;
}

/**
 * @param {object} page
 * @param {object} OPS
 * @param {number} pageWidth
 * @param {number} pageHeight
 */
async function readDrawings(page, OPS, pageWidth, pageHeight) {
    const ops = await page.getOperatorList();
    let ctm = [1, 0, 0, 1, 0, 0];
    let lineWidth = 1;
    const stack = [];
    const rules = [];
    const images = [];
    let border = null;

    for (let index = 0; index < ops.fnArray.length; index += 1) {
        const fn = ops.fnArray[index];
        const args = ops.argsArray[index] || [];

        if (fn === OPS.save) {
            stack.push({ ctm: ctm.slice(), lineWidth });
        } else if (fn === OPS.restore) {
            const saved = stack.pop();

            if (saved) {
                ctm = saved.ctm;
                lineWidth = saved.lineWidth;
            }
        } else if (fn === OPS.transform) {
            ctm = multiply(ctm, args);
        } else if (fn === OPS.setLineWidth) {
            lineWidth = Number(args[0]) || lineWidth;
        } else if (fn === OPS.constructPath) {
            const paint = args[0];

            if (paint !== OPS.stroke && paint !== OPS.closeStroke) {
                continue;
            }

            const segments = segmentsFromPath(args[1], ctm);
            const box = segmentBox(segments);

            if (box && isPageFrame(box, pageWidth, pageHeight)) {
                border = border || {
                    width: Math.max(0.5, lineWidth),
                    space: Math.max(0, Math.min(box.x1, pageWidth - box.x2, box.y1, pageHeight - box.y2)),
                };
            } else {
                rules.push(...segments.filter(isRule));
            }
        } else if (fn === OPS.paintImageXObject) {
            images.push({ id: args[0], ctm: ctm.slice() });
        }
    }

    const pictures = [];

    for (const image of images) {
        const decoded = await readPdfObject(page.objs, image.id);
        const png = decoded ? imageToPng(decoded) : null;

        if (! png) {
            continue;
        }

        const [x, y] = applyPoint(image.ctm, 0, 0);
        const [x2, y2] = applyPoint(image.ctm, 1, 1);

        pictures.push({
            x: Math.min(x, x2),
            y: Math.min(y, y2),
            width: Math.max(1, Math.abs(x2 - x)),
            height: Math.max(1, Math.abs(y2 - y)),
            png,
        });
    }

    return { rules, pictures, border };
}

/**
 * @param {object} objects
 * @param {string} id
 */
function readPdfObject(objects, id) {
    return new Promise((resolve) => {
        const timer = setTimeout(() => resolve(null), 4000);

        try {
            objects.get(id, (data) => {
                clearTimeout(timer);
                resolve(data || null);
            });
        } catch {
            clearTimeout(timer);
            resolve(null);
        }
    });
}

/**
 * @param {object[]} rawItems
 * @param {string[]} fonts
 * @param {{ rules: object[], pictures: object[], border: object|null }} drawn
 * @param {number} pageWidth
 * @param {number} pageHeight
 */
function buildPage(rawItems, fonts, drawn, pageWidth, pageHeight) {
    const items = rawItems.map((item) => itemRecord(item, fonts)).filter((item) => item.str.trim());
    const table = tableFromRules(drawn.rules, items);
    const body = items.filter((item) => ! table?.used.has(item));
    const blocks = [
        ...paragraphsFrom(linesFrom(body), pageWidth),
        ...drawn.pictures.map((picture) => pictureBlock(picture, pageWidth)),
    ];

    if (table) {
        blocks.push(table.block);
    }

    blocks.sort((left, right) => right.top - left.top);

    if (! blocks.length) {
        blocks.push({
            type: 'paragraph',
            top: pageHeight,
            align: 'left',
            runs: [{ text: ' ', bold: false, italics: false, size: 12, font: WORD_FONTS.sans }],
        });
    }

    return {
        width: pageWidth,
        height: pageHeight,
        border: drawn.border,
        blocks,
    };
}

/**
 * @param {object} item
 * @param {string[]} fonts
 */
function itemRecord(item, fonts) {
    const transform = item.transform || [1, 0, 0, 1, 0, 0];
    const source = fontSource(item.fontName, fonts);
    const size = Math.max(1, Math.hypot(transform[2], transform[3]) || item.height || 12);

    return {
        str: item.str,
        x: transform[4] || 0,
        y: transform[5] || 0,
        width: item.width || 0,
        size,
        bold: /bold/i.test(source),
        italics: /italic|oblique/i.test(source),
        font: WORD_FONTS[fontGroup(source)] || WORD_FONTS.sans,
    };
}

/**
 * @param {string|undefined} fontName
 * @param {string[]} fonts
 */
function fontSource(fontName, fonts) {
    const match = /_f(\d+)$/.exec(fontName || '');

    return match ? fonts[Number(match[1]) - 1] || '' : '';
}

/**
 * @param {object[]} items
 */
function linesFrom(items) {
    const lines = [];

    for (const item of [...items].sort((left, right) => right.y - left.y || left.x - right.x)) {
        const line = lines.find((entry) => Math.abs(entry.y - item.y) <= Math.max(2, item.size * 0.4));

        if (line) {
            line.items.push(item);
        } else {
            lines.push({ y: item.y, items: [item] });
        }
    }

    for (const line of lines) {
        line.items.sort((left, right) => left.x - right.x);
    }

    return lines.sort((left, right) => right.y - left.y);
}

/**
 * @param {object[]} lines
 * @param {number} pageWidth
 */
function paragraphsFrom(lines, pageWidth) {
    const paragraphs = [];

    for (const line of lines) {
        const runs = lineRuns(line);

        if (! runs.length) {
            continue;
        }

        const align = lineAlign(line, pageWidth);
        const size = line.items.reduce((max, item) => Math.max(max, item.size), 12);
        const right = lineRight(line);
        const previous = paragraphs.at(-1);
        const gap = previous ? previous.baseline - line.y : 0;

        if (previous && previous.align === align && gap > 0 && gap < previous.size * 1.8 && previous.right >= pageWidth - 72) {
            appendRuns(previous.runs, runs);
            previous.baseline = line.y;
            previous.right = right;
            continue;
        }

        paragraphs.push({
            type: 'paragraph',
            align,
            top: line.y + size,
            baseline: line.y,
            right,
            size,
            runs,
        });
    }

    return paragraphs;
}

/**
 * @param {object[]} existing
 * @param {object[]} runs
 */
function appendRuns(existing, runs) {
    const [first, ...rest] = runs;
    const last = existing.at(-1);
    const same = last
        && last.bold === first.bold
        && last.italics === first.italics
        && last.font === first.font
        && Math.abs(last.size - first.size) < 0.5;

    if (same) {
        last.text += ` ${first.text}`;
    } else {
        existing.push({ ...first, text: ` ${first.text}` });
    }

    existing.push(...rest);
}

/**
 * @param {object} line
 */
function lineRuns(line) {
    const runs = [];
    let cursor = null;

    for (const item of line.items) {
        const gap = cursor === null ? 0 : item.x - cursor;
        const prefix = cursor !== null && gap > item.size * 0.15 ? ' ' : '';
        const last = runs.at(-1);
        const same = last
            && last.bold === item.bold
            && last.italics === item.italics
            && last.font === item.font
            && Math.abs(last.size - item.size) < 0.5;

        if (same) {
            last.text += prefix + item.str;
        } else {
            runs.push({
                text: prefix + item.str,
                bold: item.bold,
                italics: item.italics,
                font: item.font,
                size: item.size,
            });
        }

        cursor = item.x + item.width;
    }

    return runs.filter((run) => run.text.trim());
}

/**
 * @param {object} line
 * @param {number} pageWidth
 */
function lineAlign(line, pageWidth) {
    const left = Math.min(...line.items.map((item) => item.x));
    const right = Math.max(...line.items.map((item) => item.x + item.width));
    const middle = (left + right) / 2;

    if (right > pageWidth * 0.85 && left > pageWidth * 0.45) {
        return 'right';
    }

    if (Math.abs(middle - (pageWidth / 2)) <= pageWidth * 0.08 && left > pageWidth * 0.15) {
        return 'center';
    }

    return 'left';
}

/**
 * @param {object} picture
 * @param {number} pageWidth
 */
function pictureBlock(picture, pageWidth) {
    const middle = picture.x + (picture.width / 2);
    let align = 'left';

    if (picture.x + picture.width > pageWidth * 0.85 && picture.x > pageWidth * 0.45) {
        align = 'right';
    } else if (Math.abs(middle - (pageWidth / 2)) <= pageWidth * 0.08 && picture.width < pageWidth * 0.75) {
        align = 'center';
    }

    return {
        type: 'image',
        align,
        top: picture.y + picture.height,
        png: picture.png,
        width: picture.width,
        height: picture.height,
    };
}

/**
 * @param {object[]} rules
 * @param {object[]} items
 */
function tableFromRules(rules, items) {
    const vertical = rules.filter((rule) => Math.abs(rule.x1 - rule.x2) < 1.5 && Math.abs(rule.y2 - rule.y1) > 8);
    const horizontal = rules.filter((rule) => Math.abs(rule.y1 - rule.y2) < 1.5 && Math.abs(rule.x2 - rule.x1) > 8);
    const xs = cluster(vertical.map((rule) => (rule.x1 + rule.x2) / 2));
    const ys = cluster(horizontal.map((rule) => (rule.y1 + rule.y2) / 2)).sort((left, right) => right - left);

    if (xs.length < 3 || ys.length < 3) {
        return null;
    }

    const columns = xs.length - 1;
    const rowCount = ys.length - 1;
    const cells = Array.from({ length: rowCount }, () => Array.from({ length: columns }, () => []));
    const used = new Set();

    for (const item of items) {
        const centerX = item.x + (item.width / 2);
        const centerY = item.y + (item.size * 0.3);
        let column = -1;
        let row = -1;

        for (let index = 0; index < columns; index += 1) {
            if (centerX >= xs[index] - 2 && centerX <= xs[index + 1] + 2) {
                column = index;
            }
        }

        for (let index = 0; index < rowCount; index += 1) {
            if (centerY <= ys[index] + 2 && centerY >= ys[index + 1] - 2) {
                row = index;
            }
        }

        if (column >= 0 && row >= 0) {
            cells[row][column].push(item);
            used.add(item);
        }
    }

    if (! used.size) {
        return null;
    }

    return {
        used,
        block: {
            type: 'table',
            top: ys[0],
            width: xs.at(-1) - xs[0],
            rows: cells.map((row, rowIndex) => row.map((cell, columnIndex) => ({
                width: xs[columnIndex + 1] - xs[columnIndex],
                text: cell.sort((left, right) => left.x - right.x).map((item) => item.str).join(' ').replace(/\s+/g, ' ').trim(),
            }))),
        },
    };
}

/**
 * @param {number[]} values
 */
function cluster(values) {
    const sorted = [...values].sort((left, right) => left - right);
    const groups = [];

    for (const value of sorted) {
        const last = groups.at(-1);

        if (last && Math.abs(last - value) <= 2) {
            continue;
        }

        groups.push(value);
    }

    return groups;
}

/**
 * @param {object[]} pages
 */
function groupSections(pages) {
    const sections = [];

    for (const page of pages) {
        const key = page.border ? 'border' : 'plain';
        const last = sections.at(-1);

        if (! last || last.key !== key || last.width !== page.width || last.height !== page.height) {
            sections.push({
                key,
                width: page.width,
                height: page.height,
                border: page.border,
                pages: [page],
            });
            continue;
        }

        last.pages.push(page);
    }

    return sections;
}

/**
 * @param {object} section
 * @param {boolean} next
 */
function sectionProperties(section, next) {
    const page = {
        size: {
            width: Math.round(section.width * 20),
            height: Math.round(section.height * 20),
        },
        margin: {
            top: 720,
            right: 720,
            bottom: 720,
            left: 720,
        },
    };

    if (section.border) {
        const size = Math.max(4, Math.round(section.border.width * 8));
        const space = Math.max(0, Math.round(section.border.space));
        const side = {
            style: BorderStyle.SINGLE,
            size,
            color: '000000',
            space,
        };

        page.borders = {
            pageBorders: {
                display: PageBorderDisplay.ALL_PAGES,
                offsetFrom: PageBorderOffsetFrom.PAGE,
            },
            pageBorderTop: side,
            pageBorderRight: side,
            pageBorderBottom: side,
            pageBorderLeft: side,
        };
    }

    return next ? { type: SectionType.NEXT_PAGE, page } : { page };
}

/**
 * @param {object[]} pages
 */
function sectionChildren(pages) {
    const children = [];

    pages.forEach((page, pageIndex) => {
        page.blocks.forEach((block, blockIndex) => {
            const pageBreak = pageIndex > 0 && blockIndex === 0;
            children.push(...blockNodes(block, pageBreak));
        });
    });

    return children;
}

/**
 * @param {object} block
 * @param {boolean} pageBreak
 */
function blockNodes(block, pageBreak) {
    if (block.type === 'image') {
        const nodes = [];

        if (pageBreak) {
            nodes.push(new Paragraph({ children: [new PageBreak()] }));
        }

        nodes.push(new Paragraph({
            alignment: alignment(block.align),
            children: [new ImageRun({
                type: 'png',
                data: block.png,
                transformation: {
                    width: Math.max(1, Math.round(block.width * 96 / 72)),
                    height: Math.max(1, Math.round(block.height * 96 / 72)),
                },
            })],
        }));

        return nodes;
    }

    if (block.type === 'table') {
        const nodes = [];

        if (pageBreak) {
            nodes.push(new Paragraph({ children: [new PageBreak()] }));
        }

        nodes.push(new Table({
            width: { size: Math.max(20, Math.round(block.width * 20)), type: WidthType.DXA },
            rows: block.rows.map((row) => new TableRow({
                children: row.map((cell) => new TableCell({
                    width: { size: Math.max(20, Math.round(cell.width * 20)), type: WidthType.DXA },
                    children: [new Paragraph({
                        children: [new TextRun(cell.text || ' ')],
                    })],
                })),
            })),
        }));

        return nodes;
    }

    return [new Paragraph({
        alignment: alignment(block.align),
        pageBreakBefore: pageBreak,
        spacing: { after: 120 },
        children: block.runs.map((run) => new TextRun({
            text: run.text,
            bold: run.bold || undefined,
            italics: run.italics || undefined,
            size: Math.max(2, Math.round(run.size * 2)),
            font: run.font,
        })),
    })];
}

/**
 * @param {string} value
 */
function alignment(value) {
    if (value === 'center') {
        return AlignmentType.CENTER;
    }

    if (value === 'right') {
        return AlignmentType.RIGHT;
    }

    return AlignmentType.LEFT;
}

/**
 * @param {number[]} left
 * @param {ArrayLike<number>} right
 */
function multiply(left, right) {
    const [a1, b1, c1, d1, e1, f1] = left;
    const [a2, b2, c2, d2, e2, f2] = right;

    return [
        (a1 * a2) + (c1 * b2),
        (b1 * a2) + (d1 * b2),
        (a1 * c2) + (c1 * d2),
        (b1 * c2) + (d1 * d2),
        (a1 * e2) + (c1 * f2) + e1,
        (b1 * e2) + (d1 * f2) + f1,
    ];
}

/**
 * @param {number[]} matrix
 * @param {number} x
 * @param {number} y
 */
function applyPoint(matrix, x, y) {
    return [
        (matrix[0] * x) + (matrix[2] * y) + matrix[4],
        (matrix[1] * x) + (matrix[3] * y) + matrix[5],
    ];
}

/**
 * @param {object} path
 * @param {number[]} ctm
 */
function segmentsFromPath(path, ctm) {
    const numbers = pathNumbers(Array.isArray(path) ? path[0] : path);
    const segments = [];
    let cursor = null;
    let start = null;
    let index = 0;

    while (index < numbers.length) {
        const op = numbers[index];
        index += 1;

        if (op === 0 || op === 1) {
            const point = applyPoint(ctm, numbers[index] || 0, numbers[index + 1] || 0);
            index += 2;

            if (op === 0) {
                cursor = point;
                start = point;
            } else if (cursor) {
                segments.push({ x1: cursor[0], y1: cursor[1], x2: point[0], y2: point[1] });
                cursor = point;
            }
        } else if (op === 2) {
            index += 6;
            cursor = null;
        } else if (op === 3) {
            index += 4;
            cursor = null;
        } else if (op === 4 && cursor && start) {
            segments.push({ x1: cursor[0], y1: cursor[1], x2: start[0], y2: start[1] });
            cursor = start;
        }
    }

    return segments;
}

/**
 * @param {object} value
 */
function pathNumbers(value) {
    if (! value) {
        return [];
    }

    if (typeof value.length === 'number' && (value.length === 0 || typeof value[0] === 'number')) {
        return Array.from(value);
    }

    if (typeof value.length === 'number' && value.length) {
        return pathNumbers(value[0]);
    }

    const keys = Object.keys(value);

    if (keys.length && keys.every((key) => /^\d+$/.test(key))) {
        return keys.sort((left, right) => Number(left) - Number(right)).map((key) => Number(value[key]));
    }

    return [];
}

/**
 * @param {object[]} segments
 */
function segmentBox(segments) {
    if (! segments.length) {
        return null;
    }

    const xs = segments.flatMap((segment) => [segment.x1, segment.x2]);
    const ys = segments.flatMap((segment) => [segment.y1, segment.y2]);

    return {
        x1: Math.min(...xs),
        y1: Math.min(...ys),
        x2: Math.max(...xs),
        y2: Math.max(...ys),
    };
}

/**
 * @param {object} box
 * @param {number} pageWidth
 * @param {number} pageHeight
 */
function isPageFrame(box, pageWidth, pageHeight) {
    const width = box.x2 - box.x1;
    const height = box.y2 - box.y1;

    if (width < pageWidth * 0.7 || height < pageHeight * 0.7) {
        return false;
    }

    const insets = [box.x1, pageWidth - box.x2, box.y1, pageHeight - box.y2];

    return insets.every((value) => value >= -1 && value <= 72);
}

/**
 * @param {object} segment
 */
function isRule(segment) {
    const horizontal = Math.abs(segment.y1 - segment.y2) < 1.5 && Math.abs(segment.x2 - segment.x1) > 8;
    const vertical = Math.abs(segment.x1 - segment.x2) < 1.5 && Math.abs(segment.y2 - segment.y1) > 8;

    return horizontal || vertical;
}

/**
 * @param {object} line
 */
function lineRight(line) {
    return line.items.reduce((max, item) => Math.max(max, item.x + (item.width || 0)), 0);
}

/**
 * Encode a pdf.js image. The browser build supplies an ImageBitmap and leaves
 * `data` null; Node supplies the raw pixels.
 *
 * @param {object|null} image
 */
export function imageToPng(image) {
    const width = image?.width || 0;
    const height = image?.height || 0;
    const data = image?.data || pixelsFromBitmap(image?.bitmap, width, height);

    if (! width || ! height || ! data) {
        return null;
    }

    let rgba;

    if (data.length === width * height * 4) {
        rgba = data;
    } else if (data.length === width * height * 3) {
        rgba = new Uint8Array(width * height * 4);

        for (let index = 0; index < width * height; index += 1) {
            rgba[index * 4] = data[index * 3];
            rgba[(index * 4) + 1] = data[(index * 3) + 1];
            rgba[(index * 4) + 2] = data[(index * 3) + 2];
            rgba[(index * 4) + 3] = 255;
        }
    } else if (data.length === width * height) {
        rgba = new Uint8Array(width * height * 4);

        for (let index = 0; index < data.length; index += 1) {
            rgba[index * 4] = data[index];
            rgba[(index * 4) + 1] = data[index];
            rgba[(index * 4) + 2] = data[index];
            rgba[(index * 4) + 3] = 255;
        }
    } else {
        return null;
    }

    return rgbaToPng(width, height, rgba);
}

/**
 * @param {object|undefined} bitmap
 * @param {number} width
 * @param {number} height
 */
function pixelsFromBitmap(bitmap, width, height) {
    if (! bitmap || ! width || ! height) {
        return null;
    }

    const canvas = drawingCanvas(width, height);

    if (! canvas) {
        return null;
    }

    const context = canvas.getContext('2d');

    if (! context) {
        return null;
    }

    context.drawImage(bitmap, 0, 0, width, height);

    return context.getImageData(0, 0, width, height).data;
}

/**
 * @param {number} width
 * @param {number} height
 */
function drawingCanvas(width, height) {
    if (typeof OffscreenCanvas !== 'undefined') {
        return new OffscreenCanvas(width, height);
    }

    if (typeof document !== 'undefined') {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        return canvas;
    }

    return null;
}

/**
 * @param {number} width
 * @param {number} height
 * @param {Uint8Array} rgba
 */
function rgbaToPng(width, height, rgba) {
    const stride = width * 4;
    const raw = new Uint8Array((stride + 1) * height);

    for (let y = 0; y < height; y += 1) {
        const row = y * (stride + 1);
        raw[row] = 0;
        raw.set(rgba.subarray(y * stride, (y + 1) * stride), row + 1);
    }

    const compressed = zlibStore(raw);
    const signature = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const ihdr = new Uint8Array(13);
    const view = new DataView(ihdr.buffer);
    view.setUint32(0, width);
    view.setUint32(4, height);
    ihdr[8] = 8;
    ihdr[9] = 6;

    return concatBytes([
        signature,
        pngChunk('IHDR', ihdr),
        pngChunk('IDAT', compressed),
        pngChunk('IEND', new Uint8Array()),
    ]);
}

/**
 * @param {string} type
 * @param {Uint8Array} data
 */
function pngChunk(type, data) {
    const bytes = new Uint8Array(12 + data.length);
    const view = new DataView(bytes.buffer);
    view.setUint32(0, data.length);
    bytes.set(Uint8Array.from(type, (char) => char.charCodeAt(0)), 4);
    bytes.set(data, 8);
    view.setUint32(8 + data.length, crc32(bytes.subarray(4, 8 + data.length)));

    return bytes;
}

/**
 * @param {Uint8Array[]} parts
 */
function concatBytes(parts) {
    const size = parts.reduce((sum, part) => sum + part.length, 0);
    const bytes = new Uint8Array(size);
    let offset = 0;

    for (const part of parts) {
        bytes.set(part, offset);
        offset += part.length;
    }

    return bytes;
}

/**
 * @param {Uint8Array} data
 */
function zlibStore(data) {
    const chunks = [Uint8Array.from([0x78, 0x01])];
    let offset = 0;

    while (offset < data.length || offset === 0) {
        const size = Math.min(65535, data.length - offset);
        const last = offset + size >= data.length;
        const header = new Uint8Array(5);
        header[0] = last ? 1 : 0;
        header[1] = size & 255;
        header[2] = (size >> 8) & 255;
        header[3] = (~size) & 255;
        header[4] = ((~size) >> 8) & 255;
        chunks.push(header, data.subarray(offset, offset + size));
        offset += size;

        if (data.length === 0) {
            break;
        }
    }

    const sum = adler32(data);
    const tail = new Uint8Array(4);
    tail[0] = (sum >>> 24) & 255;
    tail[1] = (sum >>> 16) & 255;
    tail[2] = (sum >>> 8) & 255;
    tail[3] = sum & 255;
    chunks.push(tail);

    return concatBytes(chunks);
}

/**
 * @param {Uint8Array} data
 */
function adler32(data) {
    let a = 1;
    let b = 0;

    for (const byte of data) {
        a = (a + byte) % 65521;
        b = (b + a) % 65521;
    }

    return ((b << 16) | a) >>> 0;
}

/**
 * @param {Uint8Array} data
 */
function crc32(data) {
    let crc = 0xffffffff;

    for (const byte of data) {
        crc ^= byte;

        for (let bit = 0; bit < 8; bit += 1) {
            const mask = -(crc & 1);
            crc = (crc >>> 1) ^ (0xedb88320 & mask);
        }
    }

    return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Node tests disable the worker and need the legacy build. The browser
 * keeps the modern build, which Vite can see as a static import.
 *
 * @param {boolean} legacy
 */
async function loadPdfjs(legacy) {
    if (legacy) {
        return import(/* @vite-ignore */ 'pdfjs-dist/legacy/build/pdf.mjs');
    }

    return import('pdfjs-dist');
}

/**
 * @param {Uint8Array} bytes
 */
function latin1(bytes) {
    let text = '';

    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
        text += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    }

    return text;
}

/**
 * @param {Uint8Array} bytes
 */
async function inflateLatin1(bytes) {
    const candidates = [bytes];

    if (bytes.length > 1 && (bytes.at(-1) === 10 || bytes.at(-1) === 13)) {
        candidates.push(bytes.subarray(0, -1));
    }

    if (bytes.length > 2 && bytes.at(-2) === 13 && bytes.at(-1) === 10) {
        candidates.push(bytes.subarray(0, -2));
    }

    for (const candidate of candidates) {
        for (const format of ['deflate', 'deflate-raw']) {
            try {
                const stream = new Blob([candidate]).stream().pipeThrough(new DecompressionStream(format));
                const output = await new Response(stream).arrayBuffer();
                const text = new TextDecoder('latin1').decode(output);

                if (text.includes('Tf')) {
                    return text;
                }
            } catch {
                // The next wrapper or slice may be the real flate payload.
            }
        }
    }

    return '';
}
