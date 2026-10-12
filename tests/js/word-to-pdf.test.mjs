import assert from 'node:assert/strict';
import test from 'node:test';
import { inflateSync } from 'node:zlib';
import {
    Document,
    Packer,
    Paragraph,
    Tab,
    TabStopType,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
} from 'docx';
import JSZip from 'jszip';
import { fontGroup } from '../../resources/js/engines/docx-to-pdf.js';
import { process } from '../../resources/js/engines/office-convert.js';

test('font families map to sans, serif, and mono', () => {
    assert.equal(fontGroup('Calibri'), 'sans');
    assert.equal(fontGroup('Aptos'), 'sans');
    assert.equal(fontGroup('Arial'), 'sans');
    assert.equal(fontGroup(null), 'sans');
    assert.equal(fontGroup('Cambria'), 'serif');
    assert.equal(fontGroup('Times New Roman'), 'serif');
    assert.equal(fontGroup('Georgia'), 'serif');
    assert.equal(fontGroup('Courier New'), 'mono');
    assert.equal(fontGroup('Consolas'), 'mono');
});

test('style and theme formatting becomes standard PDF fonts', async () => {
    const bytes = await styledDocx();
    const source = await pdfSource(bytes);

    assert.match(source, /\/Times-Bold(?!Italic)/);
    assert.match(source, /\/Times-Roman(?!Bold)/);
    assert.match(source, /\/Helvetica(?![-A-Za-z])/);
    assert.match(visibleText(source), /StyledHeading/);
    assert.match(visibleText(source), /NotBold/);
    assert.match(visibleText(source), /BodySans/);
});

test('bold runs and table cells survive conversion', async () => {
    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'BoldTimes',
                            bold: true,
                            font: 'Times New Roman',
                            size: 24,
                        }),
                    ],
                }),
                new Table({
                    columnWidths: [4500, 4500],
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    width: { size: 4500, type: WidthType.DXA },
                                    children: [new Paragraph({ children: [new TextRun('Alpha')] })],
                                }),
                                new TableCell({
                                    width: { size: 4500, type: WidthType.DXA },
                                    children: [new Paragraph({ children: [new TextRun('Beta')] })],
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        }],
    });
    const bytes = await Packer.toBuffer(doc);
    const source = await pdfSource(bytes);
    const text = visibleText(source);

    assert.match(source, /\/Times-Bold(?!Italic)/);
    assert.match(text, /BoldTimes/);
    assert.match(text, /Alpha/);
    assert.match(text, /Beta/);
    assert.match(source, /0\.6 w/);
    assert.match(source, /0 0 m/);
});

test('tabs and repeated spaces keep the gap between witness labels', async () => {
    const label = (bold = true) => ({ text: 'Witness 1:', bold, size: 22 });
    const other = () => ({ text: 'Witness 2:', bold: true, size: 22 });
    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({
                    children: [
                        new TextRun(label()),
                        new TextRun({ children: [new Tab()] }),
                        new TextRun(other()),
                    ],
                }),
                new Paragraph({
                    tabStops: [{ type: TabStopType.LEFT, position: 3600 }],
                    children: [
                        new TextRun(label()),
                        new TextRun({ children: [new Tab()] }),
                        new TextRun(other()),
                    ],
                }),
                new Paragraph({
                    children: [new TextRun({ text: 'Witness 1:          Witness 2:', bold: true, size: 22 })],
                }),
            ],
        }],
    });
    const bytes = await Packer.toBuffer(doc);
    const lines = textLines(await pdfSource(bytes));
    const gaps = lines.slice(0, 3).map(witnessGap);

    assert.ok(gaps[0] > 20, `default tab gap was ${gaps[0]}`);
    assert.ok(gaps[1] > 80, `custom tab gap was ${gaps[1]}`);
    assert.ok(gaps[2] > 30, `repeated space gap was ${gaps[2]}`);
});

/**
 * @param {Uint8Array} bytes
 */
async function pdfSource(bytes) {
    const result = await process({
        files: [asFile(bytes, 'sample.docx')],
        tool: 'word-to-pdf',
        limits: { max_bytes: 5_000_000, max_pages: 20 },
    });
    const pdfBytes = new Uint8Array(await result.blob.arrayBuffer());

    assert.equal(result.extension, 'pdf');
    assert.ok(result.meta.pageCount >= 1);
    assert.match(result.meta.note, /Tables, bold, and font family/);

    return inflatePdf(pdfBytes);
}

/**
 * @param {Uint8Array} bytes
 * @param {string} name
 */
function asFile(bytes, name) {
    const copy = Uint8Array.from(bytes);

    return {
        name,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: copy.length,
        arrayBuffer() {
            return copy.buffer.slice(copy.byteOffset, copy.byteOffset + copy.byteLength);
        },
    };
}

/**
 * @param {Uint8Array} bytes
 */
function inflatePdf(bytes) {
    const source = Buffer.from(bytes).toString('latin1');
    const parts = [source];
    const pattern = /stream\r?\n/g;
    let match = pattern.exec(source);

    while (match) {
        const start = match.index + match[0].length;
        const end = source.indexOf('endstream', start);

        if (end < 0) {
            break;
        }

        const payload = Buffer.from(source.slice(start, end), 'latin1');
        const inflated = inflateStream(payload);

        if (inflated) {
            parts.push(inflated);
        }

        match = pattern.exec(source);
    }

    return parts.join('\n');
}

/**
 * @param {Buffer} payload
 */
function inflateStream(payload) {
    const candidates = [
        payload,
        payload.subarray(0, Math.max(payload.length - 1, 0)),
        payload.subarray(0, Math.max(payload.length - 2, 0)),
    ];

    for (const candidate of candidates) {
        try {
            return inflateSync(candidate).toString('latin1');
        } catch {
            // The next slice may exclude a trailing newline that is not part of the stream.
        }
    }

    return '';
}

/**
 * @param {string} source
 */
/**
 * @param {string} source
 */
function textLines(source) {
    const groups = new Map();
    const pattern = /1 0 0 1 ([\d.]+) ([\d.]+) Tm\s*<([0-9A-Fa-f]+)>\s*Tj/g;

    for (const match of source.matchAll(pattern)) {
        const y = Math.round(Number(match[2]));
        const item = {
            x: Number(match[1]),
            text: Buffer.from(match[3], 'hex').toString('latin1'),
        };

        if (! groups.has(y)) {
            groups.set(y, []);
        }

        groups.get(y).push(item);
    }

    return [...groups.keys()].sort((left, right) => right - left).map((y) => groups.get(y));
}

/**
 * @param {{ x: number, text: string }[]} line
 */
function witnessGap(line) {
    const colon = line.find((item) => item.text === '1:');
    const names = line.filter((item) => item.text === 'Witness');

    assert.ok(colon);
    assert.equal(names.length, 2);

    return names[1].x - colon.x;
}

function visibleText(source) {
    let text = '';

    for (const match of source.matchAll(/<([0-9A-Fa-f\s]+)>/g)) {
        const raw = match[1].replace(/\s+/g, '');

        if (raw.length < 2 || raw.length % 2 !== 0) {
            continue;
        }

        text += Buffer.from(raw, 'hex').toString('latin1');
    }

    return text;
}

async function styledDocx() {
    const zip = new JSZip();

    zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:t>StyledHeading</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r>
        <w:rPr><w:b w:val="0"/></w:rPr>
        <w:t>NotBold</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:pStyle w:val="Normal"/></w:pPr>
      <w:r><w:t>BodySans</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`);

    zip.file('word/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:asciiTheme="minorHAnsi"/>
        <w:sz w:val="22"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr>
      <w:rFonts w:asciiTheme="minorHAnsi"/>
      <w:sz w:val="22"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:rPr>
      <w:b/>
      <w:sz w:val="32"/>
      <w:rFonts w:asciiTheme="majorHAnsi"/>
    </w:rPr>
  </w:style>
</w:styles>`);

    zip.file('word/theme/theme1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <a:themeElements>
    <a:fontScheme name="Office">
      <a:majorFont><a:latin typeface="Cambria"/></a:majorFont>
      <a:minorFont><a:latin typeface="Calibri"/></a:minorFont>
    </a:fontScheme>
  </a:themeElements>
</a:theme>`);

    return zip.generateAsync({ type: 'uint8array' });
}
