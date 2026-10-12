import { DOMParser } from '@xmldom/xmldom';
import JSZip from 'jszip';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 56;
const CELL_PAD = 4;
const PARAGRAPH_GAP = 6;
const LINE_FACTOR = 1.25;
const TEXT_COLOR = rgb(0.1, 0.1, 0.1);
const BORDER_COLOR = rgb(0.25, 0.25, 0.25);

const FACES = {
    sans: {
        regular: StandardFonts.Helvetica,
        bold: StandardFonts.HelveticaBold,
        italic: StandardFonts.HelveticaOblique,
        boldItalic: StandardFonts.HelveticaBoldOblique,
    },
    serif: {
        regular: StandardFonts.TimesRoman,
        bold: StandardFonts.TimesRomanBold,
        italic: StandardFonts.TimesRomanItalic,
        boldItalic: StandardFonts.TimesRomanBoldItalic,
    },
    mono: {
        regular: StandardFonts.Courier,
        bold: StandardFonts.CourierBold,
        italic: StandardFonts.CourierOblique,
        boldItalic: StandardFonts.CourierBoldOblique,
    },
};

const SERIF_FAMILY = /times|cambria|georgia|garamond|caladea|liberation serif/i;
const MONO_FAMILY = /courier|consolas|liberation mono/i;

const BLOCK_CONTAINERS = new Set([
    'tbl',
    'tr',
    'tc',
    'sdt',
    'sdtContent',
    'customXml',
    'ins',
    'del',
    'moveTo',
    'moveFrom',
    'smartTag',
    'txbxContent',
]);

const RUN_CONTAINERS = new Set([
    'hyperlink',
    'ins',
    'del',
    'smartTag',
    'sdt',
    'sdtContent',
    'customXml',
    'moveTo',
    'moveFrom',
]);

/**
 * Map a Word typeface onto a standard PDF font family.
 *
 * @param {string|null|undefined} name
 * @returns {'sans'|'serif'|'mono'}
 */
export function fontGroup(name) {
    const family = String(name || '');

    if (MONO_FAMILY.test(family)) {
        return 'mono';
    }

    if (SERIF_FAMILY.test(family)) {
        return 'serif';
    }

    return 'sans';
}

/**
 * Draw a Mammoth document into a selectable PDF.
 *
 * @param {object} document
 * @param {ArrayBuffer} arrayBuffer
 * @param {{ max_pages?: number }} limits
 */
export async function layoutDocument(document, arrayBuffer, limits = {}) {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const theme = parseTheme(await readZipText(zip, findThemePath(zip)));
    const styles = parseStyles(await readZipText(zip, 'word/styles.xml'), theme);
    const documentXml = await readZipText(zip, 'word/document.xml');
    const xml = readDocumentXml(documentXml, theme);
    const defaultTab = readDefaultTab(await readZipText(zip, 'word/settings.xml'));
    const prepared = prepareDocument(document, xml, styles);

    if (! prepared.hasContent) {
        throw new Error('No readable text was found in this document.');
    }

    const pdf = await PDFDocument.create();
    const layout = new PdfLayout(pdf, limits?.max_pages ?? 100, defaultTab);
    layout.pageMargins = xml.pageMargins;
    layout.pageNumber = await readPageNumber(zip, documentXml);
    layout.sections = prepared.sections;
    layout.preparePieces(document, styles);
    await layout.bindFonts(document);

    await layout.drawDocument(document.children || []);
    await layout.paintPageNumbers();

    const bytes = await pdf.save();

    return {
        blob: new Blob([bytes], { type: 'application/pdf' }),
        mime: 'application/pdf',
        extension: 'pdf',
        meta: {
            pageCount: pdf.getPageCount(),
            note: 'Tables, bold, and font family are kept. Text boxes and exact Word fonts may not match.',
        },
    };
}

class PdfLayout {
    /**
     * @param {PDFDocument} pdf
     * @param {number} maxPages
     */
    constructor(pdf, maxPages, defaultTab = 36) {
        this.pdf = pdf;
        this.maxPages = maxPages;
        this.defaultTab = defaultTab > 0 ? defaultTab : 36;
        this.page = null;
        this.x = MARGIN;
        this.y = PAGE_HEIGHT - MARGIN;
        this.width = PAGE_WIDTH - (MARGIN * 2);
        this.canBreak = true;
        this.images = new Map();
        this.sections = null;
        this.section = null;
        this.pageMargins = null;
        this.pageNumber = null;
        this.pageBorderPainted = false;
        this.pageContent = false;
        this.pageOwner = null;
        this.box = null;
        this.frame = { left: MARGIN, right: MARGIN, top: MARGIN, bottom: MARGIN };
        this.addPage();
    }

    addPage() {
        if (this.pdf.getPageCount() >= this.maxPages) {
            throw new Error(`This document is too long for conversion (max about ${this.maxPages} pages).`);
        }

        this.finishPageBorder();
        this.flushBox();
        this.page = this.pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        this.pageBorderPainted = false;
        this.pageContent = false;
        this.pageOwner = null;
        this.applyFrame(true);
    }

    /**
     * Keep later paragraphs inside the page margins. A line that would sit
     * under the frame starts the next page instead. A page border is drawn
     * around the finished page and does not move this frame.
     *
     * @param {boolean} resetCursor
     */
    applyFrame(resetCursor = false) {
        const margins = this.section?.margins || this.pageMargins || {
            left: MARGIN,
            right: MARGIN,
            top: MARGIN,
            bottom: MARGIN,
        };

        this.frame = { ...margins };
        this.x = this.frame.left;
        this.width = Math.max(PAGE_WIDTH - this.frame.left - this.frame.right, 8);

        const top = PAGE_HEIGHT - this.frame.top;
        const untouched = Math.abs(this.y - (PAGE_HEIGHT - MARGIN)) < 0.5;

        if (resetCursor || untouched || this.y > top) {
            this.y = top;
        }
    }

    /**
     * Draw a footer PAGE field. The number sits in the margin under the body.
     */
    async paintPageNumbers() {
        const spec = this.pageNumber;

        if (! spec) {
            return;
        }

        const font = await this.pdf.embedFont(StandardFonts.TimesRoman);
        const pages = this.pdf.getPages();

        pages.forEach((page, index) => {
            const text = String(spec.start + index);
            const width = font.widthOfTextAtSize(text, spec.size);
            let x = spec.margins.left;

            if (spec.align === 'center' || spec.align === 'both') {
                x = (PAGE_WIDTH - width) / 2;
            } else if (spec.align === 'right' || spec.align === 'end') {
                x = PAGE_WIDTH - spec.margins.right - width;
            }

            page.drawText(text, {
                x,
                y: spec.offset,
                size: spec.size,
                font,
                color: TEXT_COLOR,
            });
        });
    }

    /**
     * @param {object} border
     */
    borderInsets(border) {
        const inset = (side) => {
            const space = border.space[side] ?? 24;

            if (border.offsetFrom === 'text') {
                return Math.max(8, MARGIN - space);
            }

            return Math.max(8, Math.min(space, 140));
        };

        return {
            left: inset('left'),
            right: inset('right'),
            top: inset('top'),
            bottom: inset('bottom'),
        };
    }

    /**
     * An empty page belongs to whichever section starts writing on it.
     * A page that already has body text keeps the section that started it.
     */
    claimPage() {
        if (! this.pageContent) {
            this.pageOwner = this.section;
        }
    }

    markPageContent() {
        if (! this.pageOwner) {
            this.pageOwner = this.section;
        }

        this.pageContent = true;
    }

    /**
     * Paint the decorative page border once the page's owner is known.
     * firstPage and notFirstPage follow w:display. allPages is the default.
     */
    finishPageBorder() {
        if (! this.page || this.pageBorderPainted) {
            return;
        }

        this.pageBorderPainted = true;
        const section = this.pageOwner;
        const border = section?.border;

        if (! section || ! border) {
            return;
        }

        const index = section.pageCount || 0;
        section.pageCount = index + 1;

        if (! borderVisible(border, index)) {
            return;
        }

        const insets = this.borderInsets(border);

        this.page.drawRectangle({
            x: insets.left,
            y: insets.bottom,
            width: Math.max(PAGE_WIDTH - insets.left - insets.right, 8),
            height: Math.max(PAGE_HEIGHT - insets.top - insets.bottom, 8),
            borderColor: border.color,
            borderWidth: border.width,
        });
    }

    flushBox() {
        const box = this.box;
        this.box = null;

        if (! box) {
            return;
        }

        const height = box.top - box.bottom;

        if (height < 8 || box.width < 8) {
            return;
        }

        box.page.drawRectangle({
            x: box.x,
            y: box.bottom,
            width: box.width,
            height,
            borderColor: box.color,
            borderWidth: box.stroke,
        });
    }

    /**
     * @param {object} paragraph
     */
    noteBox(paragraph) {
        const edges = paragraph._edges;

        if (! edges?.left && ! edges?.right) {
            this.flushBox();

            return;
        }

        if (this.section?.border) {
            return;
        }

        const stroke = edges.left?.width || edges.right?.width || 1;
        const key = `${stroke}:${edges.left?.space ?? ''}:${edges.right?.space ?? ''}`;

        if (! this.box || this.box.key !== key || this.box.page !== this.page) {
            this.flushBox();
            const leftSpace = edges.left?.space ?? 6;
            const rightSpace = edges.right?.space ?? 6;
            this.box = {
                key,
                page: this.page,
                x: Math.max(8, this.x - leftSpace),
                width: this.width + leftSpace + rightSpace,
                top: this.y + (edges.top?.space ?? 4),
                bottom: this.y,
                stroke,
                color: edges.left?.color || edges.right?.color || TEXT_COLOR,
            };
        }
    }

    extendBox() {
        if (this.box?.page === this.page) {
            this.box.bottom = this.y;
        }
    }

    /**
     * @param {number} height
     */
    ensureSpace(height) {
        const top = PAGE_HEIGHT - this.frame.top;

        if (this.canBreak && this.y - height < this.frame.bottom && this.y < top - 0.5) {
            this.addPage();
        }
    }

    /**
     * @param {object} document
     * @param {object} styles
     */
    preparePieces(document, styles) {
        const counters = [];

        const visit = (nodes) => {
            for (const node of nodes || []) {
                if (! node || node.type !== 'paragraph') {
                    if (node?.type === 'table') {
                        for (const row of node.children || []) {
                            if (row?.type !== 'tableRow') {
                                continue;
                            }

                            for (const cell of row.children || []) {
                                if (cell?.type === 'tableCell') {
                                    visit(cell.children);
                                }
                            }
                        }
                    }

                    continue;
                }

                if (! node.numbering) {
                    counters.length = 0;
                }

                node._pieces = buildPieces(node, styles, counters);
            }
        };

        visit(document.children || []);
    }

    /**
     * Embed only the standard faces the document uses, then sanitize text.
     *
     * @param {object} document
     */
    async bindFonts(document) {
        const segments = [];
        const faces = new Map();

        const visit = (nodes) => {
            for (const node of nodes || []) {
                if (node?.type === 'paragraph') {
                    for (const piece of node._pieces || []) {
                        for (const segment of piece.segments || []) {
                            segments.push(segment);
                            faces.set(faceKey(segment), standardFace(segment.group, segment.bold, segment.italic));
                        }
                    }
                } else if (node?.type === 'table') {
                    for (const row of node.children || []) {
                        if (row?.type !== 'tableRow') {
                            continue;
                        }

                        for (const cell of row.children || []) {
                            if (cell?.type === 'tableCell') {
                                visit(cell.children);
                            }
                        }
                    }
                }
            }
        };

        visit(document.children || []);

        const embedded = new Map();

        for (const [key, face] of faces) {
            embedded.set(key, await this.pdf.embedFont(face));
        }

        for (const segment of segments) {
            segment.font = embedded.get(faceKey(segment));
            segment.text = sanitize(segment.text, segment.font);
        }
    }

    /**
     * @param {object[]} nodes
     */
    async drawDocument(nodes) {
        const sections = this.sections;

        if (! sections?.length) {
            if (this.pageMargins) {
                this.applyFrame(true);
            }

            await this.drawBlocks(nodes, true);
            this.flushBox();
            this.finishPageBorder();

            return;
        }

        let index = 0;

        for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
            const section = sections[sectionIndex];
            const slice = nodes.slice(index, index + section.blocks);
            index += section.blocks;
            await this.drawSection(slice, section, sectionIndex < sections.length - 1);
        }

        this.flushBox();
        this.finishPageBorder();
    }

    /**
     * @param {object[]} nodes
     * @param {{ blocks: number, breakAfter: boolean, vAlign: string|null, border: object|null }} section
     * @param {boolean} hasMore
     */
    async drawSection(nodes, section, hasMore) {
        this.section = section;
        this.claimPage();
        this.applyFrame();
        const extra = await this.sectionShift(nodes, section);

        for (let index = 0; index < nodes.length; index += 1) {
            await this.drawNode(nodes[index]);

            if (extra && index < nodes.length - 1) {
                this.y -= extra;
            }
        }

        const top = PAGE_HEIGHT - this.frame.top;

        if (section.breakAfter && hasMore && this.canBreak && this.y < top - 0.5) {
            this.flushBox();
            this.section = null;
            this.addPage();
        }
    }

    /**
     * @param {object[]} nodes
     * @param {{ vAlign: string|null }} section
     */
    async sectionShift(nodes, section) {
        if (! section.vAlign || ! nodes.length) {
            return 0;
        }

        let height = 0;

        for (const node of nodes) {
            height += await this.measureBlocks([node], this.width);
        }

        const available = this.y - this.frame.bottom;

        if (height <= 0 || height >= available) {
            return 0;
        }

        const spare = available - height;

        if (section.vAlign === 'center') {
            this.y -= spare / 2;

            return 0;
        }

        if (section.vAlign === 'bottom') {
            this.y -= spare;

            return 0;
        }

        if (section.vAlign === 'both' && nodes.length > 1) {
            return spare / (nodes.length - 1);
        }

        if (section.vAlign === 'both') {
            this.y -= spare / 2;
        }

        return 0;
    }

    /**
     * @param {object} node
     */
    async drawNode(node) {
        if (node?.type === 'paragraph') {
            await this.drawParagraph(node);
        } else if (node?.type === 'table') {
            await this.drawTable(node);
        }
    }

    /**
     * @param {object[]} nodes
     * @param {boolean} canBreak
     */
    async drawBlocks(nodes, canBreak) {
        const previous = this.canBreak;
        this.canBreak = canBreak;

        for (const node of nodes || []) {
            if (node?.type === 'paragraph') {
                await this.drawParagraph(node);
            } else if (node?.type === 'table') {
                await this.drawTable(node);
            }
        }

        this.canBreak = previous;
    }

    /**
     * @param {object} paragraph
     */
    async drawParagraph(paragraph) {
        const top = PAGE_HEIGHT - this.frame.top;

        this.markPageContent();

        if (paragraph._pageBreakBefore && this.canBreak && this.y < top - 0.5) {
            this.addPage();
        }

        const before = paragraph._spacingBefore || 0;

        if (before > this.y - this.frame.bottom && this.canBreak && this.y < top - 0.5) {
            this.addPage();
        }

        if (before > 0) {
            const room = Math.max(this.y - this.frame.bottom, 0);
            this.y -= Math.min(before, room);
        }

        this.noteBox(paragraph);
        const pieces = paragraph._pieces || [];

        for (const piece of pieces) {
            if (piece.type === 'page-break') {
                if (this.canBreak) {
                    this.addPage();
                }

                continue;
            }

            if (piece.type === 'image') {
                await this.drawImage(piece.image, piece.align);
                continue;
            }

            const contentWidth = Math.max(this.width - piece.indent, 8);
            const lines = wrapSegments(piece.segments, contentWidth, {
                tabs: piece.tabs,
                defaultTab: this.defaultTab,
                indent: piece.indent,
            });

            if (! lines.length) {
                this.ensureSpace(11);
                this.markPageContent();
                this.y -= 11;
                continue;
            }

            for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
                const line = lines[lineIndex];
                const size = lineSize(line);
                const lineHeight = size * LINE_FACTOR;
                this.ensureSpace(lineHeight);
                this.markPageContent();
                const baseline = this.y - size;

                if (piece.align === 'distribute' || (piece.align === 'justify' && lineIndex < lines.length - 1)) {
                    justifyLine(line, contentWidth);
                }

                const lineWidth = line.reduce((sum, token) => sum + token.width, 0);
                let x = this.x + piece.indent;

                if (piece.align === 'center') {
                    x += Math.max(this.width - piece.indent - lineWidth, 0) / 2;
                } else if (piece.align === 'right') {
                    x += Math.max(this.width - piece.indent - lineWidth, 0);
                }

                for (const token of line) {
                    if (token.text) {
                        this.page.drawText(token.text, {
                            x,
                            y: baseline,
                            size: token.size,
                            font: token.font,
                            color: TEXT_COLOR,
                        });
                    }

                    if (token.underline && token.width > 0) {
                        this.page.drawLine({
                            start: { x, y: baseline - 1.5 },
                            end: { x: x + token.width, y: baseline - 1.5 },
                            thickness: Math.max(0.6, token.size / 16),
                            color: TEXT_COLOR,
                        });
                    }

                    x += token.width;
                }

                this.y -= lineHeight;
            }
        }

        this.y -= paragraphAfter(paragraph);
        this.extendBox();

        if (paragraph._breakAfter && this.canBreak && this.y < PAGE_HEIGHT - this.frame.top - 0.5) {
            this.addPage();
        }
    }

    /**
     * @param {object} image
     */
    /**
     * @param {object} image
     * @param {string} [align]
     */
    async drawImage(image, align = 'left') {
        const box = await this.imageBox(image, this.width);

        if (! box) {
            return;
        }

        this.ensureSpace(box.height);
        this.markPageContent();
        this.y -= box.height;
        let x = this.x;

        if (align === 'center') {
            x += Math.max(this.width - box.width, 0) / 2;
        } else if (align === 'right') {
            x += Math.max(this.width - box.width, 0);
        }

        this.page.drawImage(box.embedded, {
            x,
            y: this.y,
            width: box.width,
            height: box.height,
        });
        this.y -= 4;
    }

    /**
     * @param {object} table
     */
    async drawTable(table) {
        this.markPageContent();
        this.flushBox();
        const rows = (table.children || []).filter((row) => row?.type === 'tableRow');
        const widths = fitWidths(table._grid || [], columnCount(rows), this.width);
        const measured = await this.measureRows(rows, widths);

        for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
            const rowHeight = measured.rowHeights[rowIndex];
            this.ensureSpace(rowHeight);
            this.markPageContent();
            const rowTop = this.y;

            for (const cell of measured.cells) {
                if (cell.row !== rowIndex) {
                    continue;
                }

                const cellX = this.x + sum(widths.slice(0, cell.col));
                const cellWidth = sum(widths.slice(cell.col, cell.col + cell.colSpan));
                let cellHeight = 0;

                for (let span = 0; span < cell.rowSpan; span += 1) {
                    cellHeight += measured.rowHeights[cell.row + span] || 0;
                }

                this.page.drawRectangle({
                    x: cellX,
                    y: rowTop - cellHeight,
                    width: cellWidth,
                    height: cellHeight,
                    borderColor: BORDER_COLOR,
                    borderWidth: 0.6,
                });

                const saved = this.capture();
                this.x = cellX + CELL_PAD;
                this.y = rowTop - CELL_PAD;
                this.width = Math.max(cellWidth - (CELL_PAD * 2), 8);
                await this.drawBlocks(cell.children, false);
                this.restore(saved);
            }

            this.y = rowTop - rowHeight;
        }

        this.y -= PARAGRAPH_GAP;
    }

    /**
     * @param {object[]} rows
     * @param {number[]} widths
     */
    async measureRows(rows, widths) {
        const rowHeights = rows.map(() => 0);
        const cells = [];

        for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
            let col = 0;

            for (const cell of rows[rowIndex].children || []) {
                if (cell?.type !== 'tableCell') {
                    continue;
                }

                const colSpan = cell.colSpan || 1;
                const rowSpan = cell.rowSpan || 1;
                const innerWidth = Math.max(sum(widths.slice(col, col + colSpan)) - (CELL_PAD * 2), 8);
                const contentHeight = await this.measureBlocks(cell.children || [], innerWidth);
                cells.push({
                    row: rowIndex,
                    col,
                    colSpan,
                    rowSpan,
                    children: cell.children || [],
                    contentHeight,
                });
                col += colSpan;
            }
        }

        for (const cell of cells) {
            if (cell.rowSpan <= 1) {
                rowHeights[cell.row] = Math.max(rowHeights[cell.row], cell.contentHeight + (CELL_PAD * 2));
            }
        }

        for (const cell of cells) {
            if (cell.rowSpan <= 1) {
                continue;
            }

            let spanHeight = 0;
            const last = Math.min(cell.row + cell.rowSpan, rowHeights.length) - 1;

            for (let index = cell.row; index <= last; index += 1) {
                spanHeight += rowHeights[index];
            }

            const needed = cell.contentHeight + (CELL_PAD * 2);

            if (needed > spanHeight) {
                rowHeights[last] += needed - spanHeight;
            }
        }

        for (let index = 0; index < rowHeights.length; index += 1) {
            rowHeights[index] = Math.max(rowHeights[index], 12 + (CELL_PAD * 2));
        }

        return { rowHeights, cells };
    }

    /**
     * @param {object[]} nodes
     * @param {number} width
     */
    async measureBlocks(nodes, width) {
        const saved = this.capture();
        this.width = width;
        let height = 0;

        for (const node of nodes || []) {
            if (node?.type === 'paragraph') {
                height += await this.measureParagraph(node, width);
            } else if (node?.type === 'table') {
                const rows = (node.children || []).filter((row) => row?.type === 'tableRow');
                const widths = fitWidths(node._grid || [], columnCount(rows), width);
                const measured = await this.measureRows(rows, widths);
                height += measured.rowHeights.reduce((sum, rowHeight) => sum + rowHeight, 0) + PARAGRAPH_GAP;
            }
        }

        this.restore(saved);

        return height;
    }

    /**
     * @param {object} paragraph
     * @param {number} width
     */
    async measureParagraph(paragraph, width) {
        let height = 0;
        const pieces = paragraph._pieces || [];

        for (const piece of pieces) {
            if (piece.type === 'image') {
                const box = await this.imageBox(piece.image, width);

                if (box) {
                    height += box.height + 4;
                }

                continue;
            }

            if (piece.type !== 'text') {
                continue;
            }

            const lines = wrapSegments(piece.segments, Math.max(width - piece.indent, 8), {
                tabs: piece.tabs,
                defaultTab: this.defaultTab,
                indent: piece.indent,
            });

            if (! lines.length) {
                height += 11;
                continue;
            }

            for (const line of lines) {
                height += lineSize(line) * LINE_FACTOR;
            }
        }

        height += paragraphAfter(paragraph);

        if (paragraph._spacingBefore) {
            height += paragraph._spacingBefore;
        }

        return height;
    }

    /**
     * @param {object} image
     * @param {number} maxWidth
     */
    async imageBox(image, maxWidth) {
        const embedded = await this.embedImage(image);

        if (! embedded || embedded.width <= 0 || embedded.height <= 0) {
            return null;
        }

        const maxHeight = PAGE_HEIGHT - (MARGIN * 2);
        const scale = Math.min(1, maxWidth / embedded.width, maxHeight / embedded.height);

        return {
            embedded,
            width: embedded.width * scale,
            height: embedded.height * scale,
        };
    }

    /**
     * @param {object} image
     */
    async embedImage(image) {
        if (this.images.has(image)) {
            return this.images.get(image);
        }

        const type = image.contentType || '';
        let embedded = null;

        try {
            const bytes = new Uint8Array(await image.readAsArrayBuffer());

            if (type === 'image/png') {
                embedded = await this.pdf.embedPng(bytes);
            } else if (type === 'image/jpeg' || type === 'image/jpg') {
                embedded = await this.pdf.embedJpg(bytes);
            }
        } catch {
            embedded = null;
        }

        this.images.set(image, embedded);

        return embedded;
    }

    capture() {
        return {
            page: this.page,
            x: this.x,
            y: this.y,
            width: this.width,
            canBreak: this.canBreak,
        };
    }

    /**
     * @param {{ page: object, x: number, y: number, width: number, canBreak: boolean }} cursor
     */
    restore(cursor) {
        this.page = cursor.page;
        this.x = cursor.x;
        this.y = cursor.y;
        this.width = cursor.width;
        this.canBreak = cursor.canBreak;
    }
}

/**
 * @param {object} document
 * @param {{ paragraphs: object[][], grids: number[][] }} xml
 * @param {object} styles
 */
function prepareDocument(document, xml, styles) {
    const paragraphs = [];
    collectParagraphs(document.children || [], paragraphs);
    const useXml = paragraphs.length === xml.paragraphs.length;
    let paragraphIndex = 0;
    let gridIndex = 0;
    let hasContent = false;

    const visit = (nodes) => {
        for (const node of nodes || []) {
            if (! node) {
                continue;
            }

            if (node.type === 'paragraph') {
                const xmlParagraph = useXml ? xml.paragraphs[paragraphIndex] : null;
                paragraphIndex += 1;
                const runCount = countRuns(node.children);
                const xmlRuns = xmlParagraph?.runs;
                node._style = resolveParagraphStyle(styles, node.styleId);
                node._xmlRuns = xmlRuns && xmlRuns.length === runCount ? xmlRuns : null;
                node._tabs = xmlParagraph?.tabs ?? styleTabs(styles, node.styleId);
                const layout = resolveParagraphLayout(styles, node.styleId, xmlParagraph);
                node._spacingBefore = layout.spacingBefore;
                node._spacingAfter = layout.spacingAfter;
                node._pageBreakBefore = layout.pageBreakBefore || !! xmlParagraph?.renderedBreak;
                node._breakAfter = !! xmlParagraph?.breakAfter;
                node._edges = layout.edges;

                if (paragraphHasText(node) || paragraphHasImage(node)) {
                    hasContent = true;
                }

                continue;
            }

            if (node.type === 'table') {
                node._grid = xml.grids[gridIndex] || [];
                gridIndex += 1;
                hasContent = true;

                for (const row of node.children || []) {
                    if (row?.type !== 'tableRow') {
                        continue;
                    }

                    for (const cell of row.children || []) {
                        if (cell?.type === 'tableCell') {
                            visit(cell.children);
                        }
                    }
                }
            }
        }
    };

    visit(document.children || []);

    return {
        hasContent,
        sections: matchSections(document, xml.sections),
    };
}

/**
 * @param {object} paragraph
 */
function paragraphAfter(paragraph) {
    if (paragraph._spacingAfter === null || paragraph._spacingAfter === undefined) {
        return PARAGRAPH_GAP;
    }

    return paragraph._spacingAfter;
}

/**
 * @param {object[]} nodes
 * @param {object[]} paragraphs
 */
function collectParagraphs(nodes, paragraphs) {
    for (const node of nodes || []) {
        if (! node) {
            continue;
        }

        if (node.type === 'paragraph') {
            paragraphs.push(node);
        } else if (node.type === 'table') {
            for (const row of node.children || []) {
                if (row?.type !== 'tableRow') {
                    continue;
                }

                for (const cell of row.children || []) {
                    if (cell?.type === 'tableCell') {
                        collectParagraphs(cell.children, paragraphs);
                    }
                }
            }
        }
    }
}

/**
 * @param {object} paragraph
 * @param {object} styles
 * @param {number[]} counters
 */
function buildPieces(paragraph, styles, counters) {
    const paragraphStyle = paragraph._style || resolveParagraphStyle(styles, paragraph.styleId);
    const matched = paragraph._xmlRuns;
    let runIndex = 0;
    const pieces = [];
    let segments = [];

    const pushText = () => {
        if (! segments.length) {
            return;
        }

        pieces.push({
            type: 'text',
            align: alignment(paragraph.alignment),
            indent: listIndent(paragraph),
            tabs: paragraph._tabs || [],
            segments,
        });
        segments = [];
    };

    const visit = (children) => {
        for (const child of children || []) {
            if (! child) {
                continue;
            }

            if (child.type === 'hyperlink') {
                visit(child.children);
                continue;
            }

            if (child.type !== 'run') {
                continue;
            }

            const xmlRun = matched ? matched[runIndex] : null;
            const look = effectiveRun(child, paragraphStyle, xmlRun, styles);
            runIndex += 1;
            let buffer = '';

            const flush = () => {
                if (! buffer) {
                    return;
                }

                segments.push({
                    text: buffer,
                    group: look.group,
                    bold: look.bold,
                    italic: look.italic,
                    size: look.size,
                    underline: look.underline,
                });
                buffer = '';
            };

            const gap = () => ({
                text: '',
                group: look.group,
                bold: look.bold,
                italic: look.italic,
                size: look.size,
                underline: false,
            });

            for (const part of runParts(child, xmlRun)) {
                if (part?.type === 'text' && part.value) {
                    buffer += part.value;
                } else if (part?.type === 'tab') {
                    flush();
                    segments.push({ ...gap(), tab: true });
                } else if (part?.type === 'ptab') {
                    flush();
                    segments.push({ ...gap(), ptab: positionalAlignment(part.alignment) });
                } else if (part?.type === 'image') {
                    flush();
                    pushText();
                    pieces.push({ type: 'image', image: part, align: alignment(paragraph.alignment) });
                } else if (part?.type === 'break') {
                    flush();
                    pushText();

                    if (part.breakType === 'page') {
                        pieces.push({ type: 'page-break' });
                    }
                }
            }

            flush();
        }
    };

    visit(paragraph.children);

    const prefix = paragraph.numbering ? markerPrefix(paragraph.numbering, counters) : '';

    if (prefix) {
        const look = faceFromStyle(paragraphStyle);
        const marker = {
            text: prefix,
            group: look.group,
            bold: look.bold,
            italic: look.italic,
            size: look.size,
            underline: false,
        };

        if (segments.length || ! pieces.some((piece) => piece.type === 'text')) {
            segments.unshift(marker);
        } else {
            pieces.find((piece) => piece.type === 'text').segments.unshift(marker);
        }
    }

    pushText();

    if (! pieces.length) {
        pieces.push({
            type: 'text',
            align: alignment(paragraph.alignment),
            indent: listIndent(paragraph),
            tabs: paragraph._tabs || [],
            segments: [],
        });
    }

    return pieces;
}

/**
 * @param {object} run
 * @param {object} paragraphStyle
 * @param {object|null} xmlRun
 * @param {object} styles
 */
function effectiveRun(run, paragraphStyle, xmlRun, styles) {
    const base = { ...paragraphStyle };

    if (run.styleId) {
        applyChain(base, styles, run.styleId);
    }

    const fontName = xmlRun?.font || run.font || base.font || null;
    const size = positive(xmlRun?.fontSize) || positive(run.fontSize) || positive(base.fontSize) || 11;
    const bold = resolveToggle(xmlRun?.bold, run.isBold, base.bold);
    const italic = resolveToggle(xmlRun?.italic, run.isItalic, base.italic);
    const underline = resolveToggle(xmlRun?.underline, run.isUnderline, base.underline);

    return {
        group: fontGroup(fontName),
        bold,
        italic,
        size,
        underline,
    };
}

/**
 * @param {boolean|null|undefined} explicit
 * @param {boolean} direct
 * @param {boolean|null|undefined} inherited
 */
function resolveToggle(explicit, direct, inherited) {
    if (explicit !== null && explicit !== undefined) {
        return explicit;
    }

    if (direct) {
        return true;
    }

    return !! inherited;
}

/**
 * @param {object} style
 */
function faceFromStyle(style) {
    return {
        group: fontGroup(style.font),
        bold: !! style.bold,
        italic: !! style.italic,
        size: positive(style.fontSize) || 11,
    };
}

/**
 * @param {{ group: string, bold: boolean, italic: boolean }} segment
 */
function faceKey(segment) {
    return `${segment.group}:${segment.bold ? 1 : 0}:${segment.italic ? 1 : 0}`;
}

/**
 * @param {string} group
 * @param {boolean} bold
 * @param {boolean} italic
 */
function standardFace(group, bold, italic) {
    const family = FACES[group] || FACES.sans;

    if (bold && italic) {
        return family.boldItalic;
    }

    if (bold) {
        return family.bold;
    }

    if (italic) {
        return family.italic;
    }

    return family.regular;
}

/**
 * @param {object} styles
 * @param {string|null|undefined} styleId
 */
function styleTabs(styles, styleId) {
    const seen = new Set();
    let id = styleId || styles.defaultParagraphId;

    while (id && ! seen.has(id) && styles.byId.has(id)) {
        seen.add(id);
        const style = styles.byId.get(id);

        if (style.tabs?.length) {
            return style.tabs;
        }

        id = style.basedOn;
    }

    return [];
}

function resolveParagraphStyle(styles, styleId) {
    const merged = { ...styles.defaults };
    applyChain(merged, styles, styleId || styles.defaultParagraphId);

    return merged;
}

/**
 * @param {object} target
 * @param {object} styles
 * @param {string|null|undefined} styleId
 */
function applyChain(target, styles, styleId) {
    const chain = [];
    const seen = new Set();
    let id = styleId;

    while (id && ! seen.has(id) && styles.byId.has(id)) {
        seen.add(id);
        chain.push(styles.byId.get(id));
        id = styles.byId.get(id).basedOn;
    }

    for (const style of chain.reverse()) {
        applyDefined(target, style.props);
    }
}

/**
 * @param {object} target
 * @param {object} props
 */
function applyDefined(target, props) {
    for (const key of ['font', 'fontSize', 'bold', 'italic', 'underline']) {
        if (props[key] !== null && props[key] !== undefined) {
            target[key] = props[key];
        }
    }
}

/**
 * @param {{ text: string, font: object, size: number, underline: boolean, tab?: boolean, ptab?: string|null, width?: number }[]} segments
 * @param {number} maxWidth
 * @param {{ tabs?: { pos: number, val: string }[], defaultTab?: number, indent?: number }} [options]
 */
function wrapSegments(segments, maxWidth, options = {}) {
    const tabs = options.tabs || [];
    const defaultTab = options.defaultTab > 0 ? options.defaultTab : 36;
    const origin = options.indent || 0;
    const rightEdge = origin + maxWidth;
    const tokens = [];

    for (const segment of segments) {
        if (segment.tab || segment.ptab) {
            tokens.push({
                text: '',
                font: segment.font,
                size: segment.size,
                underline: false,
                width: 0,
                space: false,
                tab: !! segment.tab,
                ptab: segment.ptab || null,
            });
            continue;
        }

        const parts = segment.text.split(/(\s+)/);

        for (const part of parts) {
            if (! part) {
                continue;
            }

            tokens.push({
                text: part,
                font: segment.font,
                size: segment.size,
                underline: segment.underline,
                width: segment.font.widthOfTextAtSize(part, segment.size),
                space: /^\s+$/.test(part),
                tab: false,
                ptab: null,
            });
        }
    }

    const lines = [];
    let line = [];
    let lineWidth = 0;

    const pushLine = () => {
        while (line.length && line[line.length - 1].space) {
            lineWidth -= line.pop().width;
        }

        if (line.length) {
            lines.push(line);
        }

        line = [];
        lineWidth = 0;
    };

    for (let index = 0; index < tokens.length; index += 1) {
        const token = tokens[index];

        if (token.tab || token.ptab) {
            let width = tabAdvance(origin + lineWidth, token, tabs, defaultTab, followingWidth(tokens, index), rightEdge);

            if (width === null && line.length) {
                pushLine();
                width = tabAdvance(origin, token, tabs, defaultTab, followingWidth(tokens, index), rightEdge);
            }

            line.push({ ...token, width: width ?? 0 });
            lineWidth += width ?? 0;
            continue;
        }

        if (token.space && line.length === 0) {
            continue;
        }

        if (! token.space && token.width > maxWidth) {
            if (line.length) {
                pushLine();
            }

            let chunk = '';

            for (const char of token.text) {
                const next = chunk + char;
                const width = token.font.widthOfTextAtSize(next, token.size);

                if (width > maxWidth && chunk) {
                    lines.push([{
                        ...token,
                        text: chunk,
                        width: token.font.widthOfTextAtSize(chunk, token.size),
                        space: false,
                    }]);
                    chunk = char;
                } else {
                    chunk = next;
                }
            }

            if (chunk) {
                const width = token.font.widthOfTextAtSize(chunk, token.size);
                line = [{ ...token, text: chunk, width, space: false }];
                lineWidth = width;
            }

            continue;
        }

        if (! token.space && lineWidth + token.width > maxWidth && line.length) {
            pushLine();
        }

        line.push(token);
        lineWidth += token.width;
    }

    pushLine();

    return lines;
}

/**
 * Spread the leftover width across the spaces on a justified line.
 *
 * @param {{ space?: boolean, width: number }[]} line
 * @param {number} maxWidth
 */
function justifyLine(line, maxWidth) {
    const spaces = line.filter((token) => token.space && token.width > 0);

    if (! spaces.length) {
        return;
    }

    const used = line.reduce((sum, token) => sum + token.width, 0);
    const extra = maxWidth - used;

    if (extra <= 1) {
        return;
    }

    const share = extra / spaces.length;

    for (const token of spaces) {
        token.width += share;
    }
}

/**
 * @param {number} x
 * @param {{ tab?: boolean, ptab?: string|null }} token
 * @param {{ pos: number, val: string }[]} tabs
 * @param {number} defaultTab
 * @param {number} following
 * @param {number} rightEdge
 */
function tabAdvance(x, token, tabs, defaultTab, following, rightEdge) {
    const target = token.ptab
        ? ptabTarget(token.ptab, following, rightEdge)
        : tabTarget(nextTabStop(x, tabs, defaultTab), following);

    if (target > rightEdge && x > 0.5) {
        return null;
    }

    return Math.max(0, Math.min(Math.max(target, x), rightEdge) - x);
}

/**
 * @param {{ pos: number, val: string }} stop
 * @param {number} following
 */
function tabTarget(stop, following) {
    if (stop.val === 'right' || stop.val === 'end') {
        return stop.pos - following;
    }

    if (stop.val === 'center') {
        return stop.pos - (following / 2);
    }

    return stop.pos;
}

/**
 * @param {string} alignment
 * @param {number} following
 * @param {number} rightEdge
 */
function ptabTarget(alignment, following, rightEdge) {
    if (alignment === 'center') {
        return Math.max(0, (rightEdge - following) / 2);
    }

    if (alignment === 'right') {
        return Math.max(0, rightEdge - following);
    }

    return 0;
}

/**
 * Custom stops replace the default half-inch stops up to the last custom stop.
 *
 * @param {number} x
 * @param {{ pos: number, val: string }[]} tabs
 * @param {number} defaultTab
 */
function nextTabStop(x, tabs, defaultTab) {
    const interval = defaultTab > 0 ? defaultTab : 36;
    const custom = (tabs || [])
        .filter((tab) => tab.pos > 0 && tab.val !== 'clear' && tab.val !== 'bar')
        .sort((left, right) => left.pos - right.pos);
    const ahead = custom.find((tab) => tab.pos > x + 0.25);

    if (ahead) {
        return ahead;
    }

    const rightmost = custom.reduce((max, tab) => Math.max(max, tab.pos), 0);
    let stop = Math.ceil((x + 0.25) / interval) * interval;

    if (stop <= rightmost) {
        stop = Math.ceil((rightmost + 0.25) / interval) * interval;
    }

    if (! (stop > x)) {
        stop += interval;
    }

    return { pos: stop, val: 'left' };
}

/**
 * Width of the next word, used to place center and right tabs.
 *
 * @param {{ tab?: boolean, ptab?: string|null, space?: boolean, width: number }[]} tokens
 * @param {number} index
 */
function followingWidth(tokens, index) {
    let width = 0;
    let sawWord = false;

    for (let cursor = index + 1; cursor < tokens.length; cursor += 1) {
        const next = tokens[cursor];

        if (next.tab || next.ptab) {
            break;
        }

        if (next.space && sawWord) {
            break;
        }

        if (! next.space) {
            sawWord = true;
        }

        width += next.width;
    }

    return width;
}

/**
 * @param {{ size: number }[]} line
 */
function lineSize(line) {
    return line.reduce((size, token) => Math.max(size, token.size), 11);
}

/**
 * @param {string} text
 * @param {object} font
 */
function sanitize(text, font) {
    let safe = '';

    for (const char of text) {
        try {
            font.encodeText(char);
            safe += char;
        } catch {
            safe += '?';
        }
    }

    return safe;
}

/**
 * @param {object} paragraph
 */
function listIndent(paragraph) {
    if (! paragraph.numbering) {
        return 0;
    }

    return 12 + ((Number(paragraph.numbering.level) || 0) * 12);
}

/**
 * @param {object} numbering
 * @param {number[]} counters
 */
function markerPrefix(numbering, counters) {
    const level = Number(numbering.level) || 0;

    if (! numbering.isOrdered) {
        return '- ';
    }

    counters[level] = (counters[level] || 0) + 1;

    for (let index = level + 1; index < counters.length; index += 1) {
        counters[index] = 0;
    }

    return `${counters[level]}. `;
}

/**
 * @param {string|null|undefined} value
 */
function alignment(value) {
    if (value === 'center') {
        return 'center';
    }

    if (value === 'right' || value === 'end') {
        return 'right';
    }

    if (value === 'both' || value === 'justify' || value === 'mediumKashida' || value === 'lowKashida' || value === 'highKashida') {
        return 'justify';
    }

    if (value === 'distribute' || value === 'thaiDistribute') {
        return 'distribute';
    }

    return 'left';
}

/**
 * @param {string|null|undefined} value
 */
function positionalAlignment(value) {
    if (value === 'center') {
        return 'center';
    }

    if (value === 'right' || value === 'end') {
        return 'right';
    }

    return 'left';
}

/**
 * @param {object} paragraph
 */
function paragraphHasText(paragraph) {
    const visit = (children) => {
        for (const child of children || []) {
            if (child?.type === 'hyperlink' && visit(child.children)) {
                return true;
            }

            if (child?.type !== 'run') {
                continue;
            }

            for (const part of child.children || []) {
                if (part?.type === 'text' && String(part.value || '').trim()) {
                    return true;
                }
            }
        }

        return false;
    };

    return visit(paragraph.children);
}

/**
 * @param {object} paragraph
 */
function paragraphHasImage(paragraph) {
    const visit = (children) => {
        for (const child of children || []) {
            if (child?.type === 'hyperlink' && visit(child.children)) {
                return true;
            }

            if (child?.type !== 'run') {
                continue;
            }

            if ((child.children || []).some((part) => part?.type === 'image')) {
                return true;
            }
        }

        return false;
    };

    return visit(paragraph.children);
}

/**
 * @param {object[]} children
 */
function countRuns(children) {
    let count = 0;

    for (const child of children || []) {
        if (child?.type === 'run') {
            count += 1;
        } else if (child?.type === 'hyperlink') {
            count += countRuns(child.children);
        }
    }

    return count;
}

/**
 * @param {number[]} widths
 * @param {number} colCount
 * @param {number} maxWidth
 */
function fitWidths(widths, colCount, maxWidth) {
    const count = Math.max(colCount, 1);
    const usable = (widths || []).filter((width) => width > 0);

    if (usable.length !== count) {
        return Array.from({ length: count }, () => maxWidth / count);
    }

    const total = usable.reduce((sum, width) => sum + width, 0);
    const scale = total > maxWidth ? maxWidth / total : 1;

    return usable.map((width) => width * scale);
}

/**
 * @param {object[]} rows
 */
function columnCount(rows) {
    let max = 0;

    for (const row of rows) {
        let count = 0;

        for (const cell of row.children || []) {
            if (cell?.type === 'tableCell') {
                count += cell.colSpan || 1;
            }
        }

        max = Math.max(max, count);
    }

    return max;
}

/**
 * @param {number[]} values
 */
function sum(values) {
    return values.reduce((total, value) => total + value, 0);
}

/**
 * @param {number|string|null|undefined} value
 */
function positive(value) {
    const number = Number(value);

    return Number.isFinite(number) && number > 0 ? number : null;
}

/**
 * @param {object} document
 * @param {object[]|undefined} sections
 */
function matchSections(document, sections) {
    if (! sections?.length) {
        return null;
    }

    const nodes = document.children || [];
    const blocks = nodes.filter((node) => node?.type === 'paragraph' || node?.type === 'table');

    if (blocks.length !== nodes.length) {
        return null;
    }

    const total = sections.reduce((sum, section) => sum + section.blocks, 0);

    return total === blocks.length ? sections : null;
}

/**
 * @param {object|null|undefined} sectPr
 */
function readMargins(sectPr) {
    const mar = firstChild(sectPr, 'pgMar');

    if (! mar) {
        return null;
    }

    const points = (name) => {
        const twips = Number(attr(mar, name));

        return Number.isFinite(twips) && twips >= 0 ? twips / 20 : null;
    };
    const top = points('top');
    const bottom = points('bottom');
    const left = points('left');
    const right = points('right');

    if (top === null && bottom === null && left === null && right === null) {
        return null;
    }

    return {
        top: top ?? MARGIN,
        bottom: bottom ?? MARGIN,
        left: left ?? MARGIN,
        right: right ?? MARGIN,
    };
}

/**
 * A footer that is only a PAGE field. The number is drawn in the bottom margin.
 *
 * @param {JSZip} zip
 * @param {string|null} documentXml
 */
async function readPageNumber(zip, documentXml) {
    if (! zip || ! documentXml) {
        return null;
    }

    const doc = parseXml(documentXml);
    const sects = descendants(doc, 'sectPr');
    const sect = sects[sects.length - 1];
    const footer = elementChildren(sect).find((child) => {
        return localName(child) === 'footerReference' && (attr(child, 'type') || 'default') === 'default';
    }) || firstChild(sect, 'footerReference');
    const id = attr(footer, 'id');

    if (! id) {
        return null;
    }

    const rels = await readZipText(zip, 'word/_rels/document.xml.rels');
    const rel = descendants(parseXml(rels || ''), 'Relationship').find((node) => attr(node, 'Id') === id);
    const target = String(attr(rel, 'Target') || '').replace(/^\/+/, '');

    if (! /footer/i.test(target)) {
        return null;
    }

    const footerXml = await readZipText(zip, target.startsWith('word/') ? target : `word/${target.replace(/^\.\.\//, '')}`);

    if (! footerXml || ! /\bPAGE\b/.test(footerXml)) {
        return null;
    }

    const footerDoc = parseXml(footerXml);
    const paragraph = firstDescendant(footerDoc, 'p');
    const properties = firstChild(paragraph, 'pPr');
    const align = attr(firstChild(properties, 'jc'), 'val') || 'center';
    const size = positive(Number(attr(firstDescendant(footerDoc, 'sz'), 'val')) / 2) || 12;
    const footerTwips = Number(attr(firstChild(sect, 'pgMar'), 'footer'));
    const start = Number(attr(firstChild(sect, 'pgNumType'), 'start'));
    const margins = readMargins(sect) || { left: MARGIN, right: MARGIN, top: MARGIN, bottom: MARGIN };

    return {
        align,
        size,
        offset: Number.isFinite(footerTwips) && footerTwips > 0 ? footerTwips / 20 : 36,
        start: Number.isFinite(start) && start > 0 ? start : 1,
        margins,
    };
}

/**
 * @param {object|null|undefined} body
 */
function readSections(body) {
    if (! body) {
        return { sections: [], pageMargins: null };
    }

    const sections = [];
    let blocks = 0;
    let pageMargins = null;

    const close = (sectPr, isFinal) => {
        const margins = readMargins(sectPr);

        if (margins) {
            pageMargins = margins;
        }

        if (blocks <= 0) {
            return;
        }

        sections.push({
            blocks,
            breakAfter: sectionBreaksPage(sectPr, isFinal),
            vAlign: readVAlign(sectPr),
            border: readPageBorder(sectPr),
            margins,
        });
        blocks = 0;
    };

    const visit = (el) => {
        for (const child of elementChildren(el)) {
            const name = localName(child);

            if (name === 'sectPr') {
                close(child, true);
            } else if (name === 'p') {
                blocks += 1;
                const sectPr = firstChild(firstChild(child, 'pPr'), 'sectPr');

                if (sectPr) {
                    close(sectPr, false);
                }
            } else if (name === 'tbl') {
                blocks += 1;
            } else if (BLOCK_CONTAINERS.has(name) && name !== 'tr' && name !== 'tc') {
                visit(child);
            }
        }
    };

    visit(body);

    return { sections, pageMargins };
}

/**
 * A paragraph sectPr ends the section. The body's final sectPr only describes it.
 *
 * @param {object|null} sectPr
 * @param {boolean} isFinal
 */
function sectionBreaksPage(sectPr, isFinal) {
    if (isFinal || ! sectPr) {
        return false;
    }

    const value = attr(firstChild(sectPr, 'type'), 'val');

    return value !== 'continuous' && value !== 'nextColumn';
}

/**
 * @param {object|null} sectPr
 */
function readVAlign(sectPr) {
    const value = attr(firstChild(sectPr, 'vAlign'), 'val');

    if (value === 'center' || value === 'both' || value === 'bottom') {
        return value;
    }

    return null;
}

/**
 * @param {{ display?: string }} border
 * @param {number} index
 */
function borderVisible(border, index) {
    if (border.display === 'firstPage') {
        return index === 0;
    }

    if (border.display === 'notFirstPage') {
        return index > 0;
    }

    return true;
}

/**
 * @param {object|null} sectPr
 */
function readPageBorder(sectPr) {
    const borders = firstChild(sectPr, 'pgBorders');

    if (! borders) {
        return null;
    }

    const sides = {
        top: readBorderSide(firstChild(borders, 'top')),
        left: readBorderSide(firstChild(borders, 'left')),
        bottom: readBorderSide(firstChild(borders, 'bottom')),
        right: readBorderSide(firstChild(borders, 'right')),
    };

    if (! sides.top && ! sides.left && ! sides.bottom && ! sides.right) {
        return null;
    }

    const sample = sides.top || sides.left || sides.bottom || sides.right;

    const display = attr(borders, 'display');

    return {
        offsetFrom: attr(borders, 'offsetFrom') === 'text' ? 'text' : 'page',
        display: display === 'firstPage' || display === 'notFirstPage' ? display : 'allPages',
        width: sample.width,
        color: sample.color,
        space: {
            top: sides.top?.space ?? sample.space,
            left: sides.left?.space ?? sample.space,
            bottom: sides.bottom?.space ?? sample.space,
            right: sides.right?.space ?? sample.space,
        },
    };
}

/**
 * @param {object|null} el
 */
function readBorderSide(el) {
    if (! el) {
        return null;
    }

    const value = (attr(el, 'val') || 'single').toLowerCase();

    if (value === 'nil' || value === 'none' || value === 'false') {
        return null;
    }

    const size = Number(attr(el, 'sz'));
    const space = Number(attr(el, 'space'));

    return {
        width: Number.isFinite(size) && size > 0 ? Math.max(size / 8, 0.75) : 1,
        space: Number.isFinite(space) && space >= 0 ? space : 24,
        color: rgbFromHex(attr(el, 'color')),
    };
}

/**
 * @param {string|null|undefined} hex
 */
function rgbFromHex(hex) {
    const value = String(hex || '').replace('#', '');

    if (! /^[0-9A-Fa-f]{6}$/.test(value)) {
        return rgb(0, 0, 0);
    }

    return rgb(
        parseInt(value.slice(0, 2), 16) / 255,
        parseInt(value.slice(2, 4), 16) / 255,
        parseInt(value.slice(4, 6), 16) / 255,
    );
}

/**
 * Word stores the last pagination in the first paragraph of each new page.
 *
 * @param {object} paragraph
 */
function paragraphHasRenderedBreak(paragraph) {
    let seenText = false;

    const visit = (el) => {
        for (const child of elementChildren(el)) {
            const name = localName(child);

            if (name === 'lastRenderedPageBreak' && ! seenText) {
                return true;
            }

            if (name === 't' && textOf(child).trim()) {
                seenText = true;
            }

            if ((name === 'r' || RUN_CONTAINERS.has(name)) && visit(child)) {
                return true;
            }
        }

        return false;
    };

    return visit(paragraph);
}

/**
 * @param {object|null} pPr
 */
function readParagraphLayout(pPr) {
    const spacing = firstChild(pPr, 'spacing');

    return {
        spacingBefore: twipsToPoints(attr(spacing, 'before')),
        spacingAfter: twipsToPoints(attr(spacing, 'after')),
        pageBreakBefore: readOnOff(firstChild(pPr, 'pageBreakBefore')),
        edges: readParagraphEdges(pPr),
    };
}

/**
 * @param {object|null} pPr
 */
function readParagraphEdges(pPr) {
    const borders = firstChild(pPr, 'pBdr');

    if (! borders) {
        return null;
    }

    return {
        top: readBorderSide(firstChild(borders, 'top')),
        left: readBorderSide(firstChild(borders, 'left')),
        bottom: readBorderSide(firstChild(borders, 'bottom')),
        right: readBorderSide(firstChild(borders, 'right')),
    };
}

/**
 * @param {object|null|undefined} el
 */
function readOnOff(el) {
    if (! el) {
        return null;
    }

    const value = attr(el, 'val');

    if (value === null || value === '') {
        return true;
    }

    return value !== '0' && value !== 'false' && value !== 'off';
}

/**
 * @param {string|null|undefined} value
 */
function twipsToPoints(value) {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const number = Number(value);

    if (! Number.isFinite(number) || number < 0) {
        return null;
    }

    return Math.min(number / 20, PAGE_HEIGHT - (MARGIN * 2) - 24);
}

/**
 * @param {object} styles
 * @param {string|null|undefined} styleId
 * @param {object|null|undefined} xmlParagraph
 */
function resolveParagraphLayout(styles, styleId, xmlParagraph) {
    const chain = [];
    const seen = new Set();
    let id = styleId || styles.defaultParagraphId;

    while (id && ! seen.has(id) && styles.byId.has(id)) {
        seen.add(id);
        chain.push(styles.byId.get(id));
        id = styles.byId.get(id).basedOn;
    }

    let spacingBefore = null;
    let spacingAfter = null;
    let pageBreakBefore = null;
    let edges = null;

    for (const style of chain.reverse()) {
        if (style.spacingBefore !== null && style.spacingBefore !== undefined) {
            spacingBefore = style.spacingBefore;
        }

        if (style.spacingAfter !== null && style.spacingAfter !== undefined) {
            spacingAfter = style.spacingAfter;
        }

        if (style.pageBreakBefore !== null && style.pageBreakBefore !== undefined) {
            pageBreakBefore = style.pageBreakBefore;
        }

        if (style.edges) {
            edges = style.edges;
        }
    }

    if (xmlParagraph) {
        if (xmlParagraph.spacingBefore !== null && xmlParagraph.spacingBefore !== undefined) {
            spacingBefore = xmlParagraph.spacingBefore;
        }

        if (xmlParagraph.spacingAfter !== null && xmlParagraph.spacingAfter !== undefined) {
            spacingAfter = xmlParagraph.spacingAfter;
        }

        if (xmlParagraph.pageBreakBefore !== null && xmlParagraph.pageBreakBefore !== undefined) {
            pageBreakBefore = xmlParagraph.pageBreakBefore;
        }

        if (xmlParagraph.edges) {
            edges = xmlParagraph.edges;
        }
    }

    return {
        spacingBefore,
        spacingAfter,
        pageBreakBefore: !! pageBreakBefore,
        edges,
    };
}

/**
 * @param {string} xml
 * @param {{ major: string|null, minor: string|null }} theme
 */
function readDocumentXml(xml, theme) {
    const paragraphs = [];
    const grids = [];

    if (! xml) {
        return { paragraphs, grids, sections: [], pageMargins: null };
    }

    const doc = parseXml(xml);
    const body = firstDescendant(doc, 'body') || doc.documentElement;

    if (body) {
        walkBlocks(body, theme, paragraphs, grids);
    }

    const sectionInfo = readSections(body);

    return {
        paragraphs,
        grids,
        sections: sectionInfo.sections,
        pageMargins: sectionInfo.pageMargins,
    };
}

/**
 * @param {object} el
 * @param {{ major: string|null, minor: string|null }} theme
 * @param {object[][]} paragraphs
 * @param {number[][]} grids
 */
function walkBlocks(el, theme, paragraphs, grids) {
    for (const child of elementChildren(el)) {
        const name = localName(child);

        if (name === 'p') {
            const properties = firstChild(child, 'pPr');

            paragraphs.push({
                runs: readParagraphRuns(child, theme),
                tabs: readTabs(child),
                ...readParagraphLayout(properties),
                breakAfter: sectionBreaksPage(firstChild(properties, 'sectPr'), false),
                renderedBreak: paragraphHasRenderedBreak(child),
            });
        } else if (name === 'tbl') {
            grids.push(readGrid(child));
            walkBlocks(child, theme, paragraphs, grids);
        } else if (BLOCK_CONTAINERS.has(name)) {
            walkBlocks(child, theme, paragraphs, grids);
        }
    }
}

/**
 * @param {object} paragraph
 * @param {{ major: string|null, minor: string|null }} theme
 */
function readParagraphRuns(paragraph, theme) {
    const runs = [];

    const walk = (el) => {
        for (const child of elementChildren(el)) {
            const name = localName(child);

            if (name === 'r') {
                runs.push({
                    ...readRPr(firstChild(child, 'rPr'), theme),
                    inlines: readInlines(child),
                });
            } else if (RUN_CONTAINERS.has(name)) {
                walk(child);
            }
        }
    };

    walk(paragraph);

    return runs;
}

/**
 * Prefer the document XML when it agrees with Mammoth, so positional tabs
 * Mammoth drops stay between the same words.
 *
 * @param {object} run
 * @param {object|null} xmlRun
 */
function runParts(run, xmlRun) {
    const children = run.children || [];
    const inlines = xmlRun?.inlines;
    const hasMedia = children.some((part) => part?.type === 'image' || part?.type === 'break');

    if (! hasMedia && inlines && inlineText(inlines) === inlineText(children)) {
        return inlines;
    }

    return children;
}

/**
 * @param {object[]} parts
 */
function inlineText(parts) {
    let text = '';

    for (const part of parts || []) {
        if (part?.type === 'text' && part.value) {
            text += part.value;
        }
    }

    return text;
}

/**
 * @param {object} run
 */
function readInlines(run) {
    const inlines = [];

    const walk = (el) => {
        for (const child of elementChildren(el)) {
            const name = localName(child);

            if (name === 't') {
                inlines.push({ type: 'text', value: textOf(child) });
            } else if (name === 'tab') {
                inlines.push({ type: 'tab' });
            } else if (name === 'ptab') {
                inlines.push({ type: 'ptab', alignment: attr(child, 'alignment') });
            } else if (RUN_CONTAINERS.has(name)) {
                walk(child);
            }
        }
    };

    walk(run);

    return inlines;
}

/**
 * @param {object} el
 */
function textOf(el) {
    let text = '';
    const nodes = el?.childNodes || [];

    for (let index = 0; index < nodes.length; index += 1) {
        const node = nodes[index];

        if (node.nodeType === 3 || node.nodeType === 4) {
            text += node.nodeValue || '';
        }
    }

    return text || el?.textContent || '';
}

/**
 * Tab stops are measured in twips from the left margin. Null means the
 * paragraph does not define its own stops and the style chain should be used.
 *
 * @param {object|null} el
 * @param {boolean} [isProperties]
 */
function readTabs(el, isProperties = false) {
    const properties = isProperties ? el : firstChild(el, 'pPr');
    const tabs = firstChild(properties, 'tabs');

    if (! tabs) {
        return null;
    }

    return elementChildren(tabs)
        .filter((child) => localName(child) === 'tab')
        .map((tab) => {
            const twips = Number(attr(tab, 'pos'));

            return {
                pos: Number.isFinite(twips) ? twips / 20 : 0,
                val: attr(tab, 'val') || 'left',
            };
        })
        .filter((tab) => tab.val === 'clear' || tab.val === 'bar' || tab.pos > 0);
}

/**
 * @param {string} xml
 */
function readDefaultTab(xml) {
    if (! xml) {
        return 36;
    }

    const stop = firstDescendant(parseXml(xml), 'defaultTabStop');
    const twips = Number(attr(stop, 'val'));

    return Number.isFinite(twips) && twips > 0 ? twips / 20 : 36;
}

/**
 * @param {object} table
 */
function readGrid(table) {
    const grid = firstChild(table, 'tblGrid');

    if (! grid) {
        return [];
    }

    return elementChildren(grid)
        .filter((child) => localName(child) === 'gridCol')
        .map((col) => {
            const twips = Number(attr(col, 'w'));

            return Number.isFinite(twips) && twips > 0 ? twips / 20 : 0;
        });
}

/**
 * @param {string} xml
 * @param {{ major: string|null, minor: string|null }} theme
 */
function parseStyles(xml, theme) {
    const styles = {
        defaults: emptyProps(),
        byId: new Map(),
        defaultParagraphId: null,
    };

    if (! xml) {
        return styles;
    }

    const doc = parseXml(xml);
    const defaults = firstDescendant(doc, 'docDefaults');
    const defaultRPr = defaults ? firstDescendant(defaults, 'rPr') : null;
    styles.defaults = readRPr(defaultRPr, theme);

    for (const styleEl of descendants(doc, 'style')) {
        const type = attr(styleEl, 'type');

        if (type !== 'paragraph' && type !== 'character') {
            continue;
        }

        const id = attr(styleEl, 'styleId');

        if (! id || styles.byId.has(id)) {
            continue;
        }

        if (type === 'paragraph' && attr(styleEl, 'default') === '1' && ! styles.defaultParagraphId) {
            styles.defaultParagraphId = id;
        }

        const paragraphProperties = firstChild(styleEl, 'pPr');
        const layout = readParagraphLayout(paragraphProperties);

        styles.byId.set(id, {
            basedOn: attr(firstChild(styleEl, 'basedOn'), 'val'),
            props: readRPr(firstChild(styleEl, 'rPr'), theme),
            tabs: readTabs(paragraphProperties, true),
            spacingBefore: layout.spacingBefore,
            spacingAfter: layout.spacingAfter,
            pageBreakBefore: layout.pageBreakBefore,
            edges: layout.edges,
        });
    }

    return styles;
}

/**
 * @param {string} xml
 */
function parseTheme(xml) {
    const theme = { major: null, minor: null };

    if (! xml) {
        return theme;
    }

    const doc = parseXml(xml);
    theme.major = latinTypeface(firstDescendant(doc, 'majorFont'));
    theme.minor = latinTypeface(firstDescendant(doc, 'minorFont'));

    return theme;
}

/**
 * @param {object|null} font
 */
function latinTypeface(font) {
    if (! font) {
        return null;
    }

    const latin = firstChild(font, 'latin') || firstDescendant(font, 'latin');

    return attr(latin, 'typeface');
}

/**
 * @param {object|null} rPr
 * @param {{ major: string|null, minor: string|null }} theme
 */
function readRPr(rPr, theme) {
    if (! rPr) {
        return emptyProps();
    }

    const rFonts = firstChild(rPr, 'rFonts');
    const ascii = attr(rFonts, 'ascii') || attr(rFonts, 'hAnsi');
    const themeSlot = attr(rFonts, 'asciiTheme') || attr(rFonts, 'hAnsiTheme');
    const size = attr(firstChild(rPr, 'sz'), 'val');

    return {
        font: ascii || themeFace(theme, themeSlot),
        fontSize: /^\d+$/.test(size || '') ? Number(size) / 2 : null,
        bold: readToggle(rPr, 'b'),
        italic: readToggle(rPr, 'i'),
        underline: readUnderline(firstChild(rPr, 'u')),
    };
}

function emptyProps() {
    return {
        font: null,
        fontSize: null,
        bold: null,
        italic: null,
        underline: null,
    };
}

/**
 * @param {object} rPr
 * @param {string} tag
 */
function readToggle(rPr, tag) {
    const el = firstChild(rPr, tag);

    if (! el) {
        return null;
    }

    const value = attr(el, 'val');

    if (value === null || value === '') {
        return true;
    }

    return value !== '0' && value !== 'false' && value !== 'off' && value !== 'none';
}

/**
 * @param {object|null} el
 */
function readUnderline(el) {
    if (! el) {
        return null;
    }

    const value = attr(el, 'val');

    if (value === null || value === '') {
        return true;
    }

    return value !== 'none' && value !== 'false' && value !== '0';
}

/**
 * @param {{ major: string|null, minor: string|null }} theme
 * @param {string|null} slot
 */
function themeFace(theme, slot) {
    if (! slot) {
        return null;
    }

    const name = slot.toLowerCase();

    if (name.startsWith('major')) {
        return theme.major;
    }

    if (name.startsWith('minor')) {
        return theme.minor;
    }

    return null;
}

/**
 * @param {JSZip} zip
 */
function findThemePath(zip) {
    const match = Object.keys(zip.files).find((name) => /word\/theme\/theme\d+\.xml$/i.test(name));

    return match || 'word/theme/theme1.xml';
}

/**
 * @param {JSZip} zip
 * @param {string} path
 */
async function readZipText(zip, path) {
    const file = zip.file(path);

    if (! file) {
        return '';
    }

    return file.async('string');
}

/**
 * @param {string} xml
 */
function parseXml(xml) {
    return new DOMParser().parseFromString(xml, 'text/xml');
}

/**
 * @param {object} el
 */
function elementChildren(el) {
    const children = [];
    const nodes = el?.childNodes || [];

    for (let index = 0; index < nodes.length; index += 1) {
        if (nodes[index].nodeType === 1) {
            children.push(nodes[index]);
        }
    }

    return children;
}

/**
 * @param {object|null|undefined} el
 * @param {string} name
 */
function firstChild(el, name) {
    if (! el) {
        return null;
    }

    return elementChildren(el).find((child) => localName(child) === name) || null;
}

/**
 * @param {object|null|undefined} el
 * @param {string} name
 */
function firstDescendant(el, name) {
    return descendants(el, name)[0] || null;
}

/**
 * @param {object|null|undefined} el
 * @param {string} name
 */
function descendants(el, name) {
    const found = [];

    if (! el || typeof el.getElementsByTagName !== 'function') {
        return found;
    }

    const nodes = el.getElementsByTagName('*');

    for (let index = 0; index < nodes.length; index += 1) {
        if (localName(nodes[index]) === name) {
            found.push(nodes[index]);
        }
    }

    return found;
}

/**
 * @param {object} el
 */
function localName(el) {
    return el.localName || String(el.nodeName || '').split(':').pop();
}

/**
 * @param {object|null|undefined} el
 * @param {string} name
 */
function attr(el, name) {
    if (! el?.attributes) {
        return null;
    }

    const direct = el.getAttribute(`w:${name}`) || el.getAttribute(`a:${name}`) || el.getAttribute(name);

    if (direct) {
        return direct;
    }

    for (let index = 0; index < el.attributes.length; index += 1) {
        const attribute = el.attributes[index];
        const attributeName = attribute.name || attribute.nodeName || '';

        if (attributeName === name || attributeName.endsWith(`:${name}`)) {
            return attribute.value;
        }
    }

    return null;
}
