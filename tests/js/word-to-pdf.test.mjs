import assert from 'node:assert/strict';
import test from 'node:test';
import { inflateSync } from 'node:zlib';
import {
    AlignmentType,
    Document,
    ImageRun,
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

test('a cover section keeps its page border and starts the body on the next page', async () => {
    const bytes = await coverDocx();
    const result = await process({
        files: [asFile(bytes, 'cover.docx')],
        tool: 'word-to-pdf',
        limits: { max_bytes: 5_000_000, max_pages: 20 },
    });
    const source = inflatePdf(new Uint8Array(await result.blob.arrayBuffer()));
    const lines = textLines(source);
    const cover = lines.flat().find((item) => item.text === 'COVER');
    const foundation = lines.flat().find((item) => item.text === 'MARSUS');
    const body = lines.flat().find((item) => item.text === 'BodyStarts');

    assert.equal(result.meta.pageCount, 2);
    assert.match(source, /1\.5 w/);
    assert.ok(cover && cover.y > 700, `cover y was ${cover?.y}`);
    assert.ok(foundation && foundation.y < 250, `foundation y was ${foundation?.y}`);
    assert.ok(body && body.y > 700, `body y was ${body?.y}`);
});

test('a paragraph Word placed on the next page stays off the cover', async () => {
    const bytes = await renderedBreakDocx();
    const result = await process({
        files: [asFile(bytes, 'break.docx')],
        tool: 'word-to-pdf',
        limits: { max_bytes: 5_000_000, max_pages: 20 },
    });
    const source = inflatePdf(new Uint8Array(await result.blob.arrayBuffer()));
    const body = textLines(source).flat().find((item) => item.text === 'BodyStarts');

    assert.equal(result.meta.pageCount, 2);
    assert.ok(body && body.y > 700, `body y was ${body?.y}`);
});

test('a first-page border stays off the following section', async () => {
    const bytes = await firstPageBorderDocx();
    const result = await process({
        files: [asFile(bytes, 'first-page-border.docx')],
        tool: 'word-to-pdf',
        limits: { max_bytes: 5_000_000, max_pages: 20 },
    });
    const streams = contentStreams(new Uint8Array(await result.blob.arrayBuffer()));
    const cover = streams.find((stream) => streamText(stream).includes('CoverLine'));
    const body = streams.find((stream) => streamText(stream).includes('BodyStarts'));
    const bodyLine = textLines(body || '').flat().find((item) => item.text === 'BodyStarts');

    assert.equal(result.meta.pageCount, 2);
    assert.match(cover || '', /3 w/);
    assert.doesNotMatch(body || '', /3 w/);
    assert.ok(bodyLine && bodyLine.y > 700, `body y was ${bodyLine?.y}`);
});

test('a centered picture sits in the middle of the line', async () => {
    const bytes = await centeredImageDocx();
    const result = await process({
        files: [asFile(bytes, 'centered-image.docx')],
        tool: 'word-to-pdf',
        limits: { max_bytes: 5_000_000, max_pages: 20 },
    });
    const source = inflatePdf(new Uint8Array(await result.blob.arrayBuffer()));
    const image = imagePositions(source)[0];

    assert.ok(image && image.x > 200, `image x was ${image?.x}`);
});

test('one-inch page margins keep a full cover from pulling the next paragraph', async () => {
    const bytes = await marginCoverDocx();
    const result = await process({
        files: [asFile(bytes, 'margins.docx')],
        tool: 'word-to-pdf',
        limits: { max_bytes: 5_000_000, max_pages: 20 },
    });
    const source = inflatePdf(new Uint8Array(await result.blob.arrayBuffer()));
    const body = textLines(source).flat().find((item) => item.text === 'BodyStarts');

    assert.equal(result.meta.pageCount, 2);
    assert.ok(body && body.y > 700, `body y was ${body?.y}`);
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
function contentStreams(bytes) {
    const source = Buffer.from(bytes).toString('latin1');
    const streams = [];
    const pattern = /stream\r?\n/g;
    let match = pattern.exec(source);

    while (match) {
        const start = match.index + match[0].length;
        const end = source.indexOf('endstream', start);

        if (end < 0) {
            break;
        }

        const inflated = inflateStream(Buffer.from(source.slice(start, end), 'latin1'));

        if (inflated) {
            streams.push(inflated);
        }

        match = pattern.exec(source);
    }

    return streams;
}

/**
 * @param {string} stream
 */
function streamText(stream) {
    return textLines(stream).flat().map((item) => item.text).join('');
}

/**
 * @param {string} source
 */
function imagePositions(source) {
    const positions = [];
    const pattern = /q\s+([\d.]+) 0 0 ([\d.]+) ([\d.]+) ([\d.]+) cm[\s\S]{0,80}?Do/g;

    for (const match of source.matchAll(pattern)) {
        positions.push({
            width: Number(match[1]),
            height: Number(match[2]),
            x: Number(match[3]),
            y: Number(match[4]),
        });
    }

    return positions;
}

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
            y,
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

async function renderedBreakDocx() {
    const zip = new JSZip();

    zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>COVER TITLE</w:t></w:r></w:p>
    <w:p>
      <w:pPr>
        <w:pBdr>
          <w:top w:val="single" w:sz="12" w:space="4" w:color="000000"/>
          <w:left w:val="single" w:sz="12" w:space="4" w:color="000000"/>
          <w:bottom w:val="single" w:sz="12" w:space="4" w:color="000000"/>
          <w:right w:val="single" w:sz="12" w:space="4" w:color="000000"/>
        </w:pBdr>
      </w:pPr>
      <w:r><w:t>MARSUS Foundation</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:lastRenderedPageBreak/><w:t>BodyStarts</w:t></w:r>
    </w:p>
    <w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr>
  </w:body>
</w:document>`);
    zip.file('word/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
</w:styles>`);
    zip.file('word/theme/theme1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:themeElements>
  <a:fontScheme name="Office"><a:majorFont><a:latin typeface="Calibri"/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/></a:minorFont></a:fontScheme>
</a:themeElements></a:theme>`);

    return zip.generateAsync({ type: 'uint8array' });
}

async function marginCoverDocx() {
    const zip = new JSZip();
    const blanks = Array.from({ length: 41 }, () => '<w:p/>').join('');

    zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${blanks}
    <w:p><w:r><w:t>BodyStarts</w:t></w:r></w:p>
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:bottom="1440" w:left="1440" w:right="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`);

    zip.file('word/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
  </w:style>
</w:styles>`);

    return zip.generateAsync({ type: 'uint8array' });
}

async function firstPageBorderDocx() {
    const zip = new JSZip();

    zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr>
        <w:sectPr>
          <w:pgBorders w:display="firstPage" w:offsetFrom="page">
            <w:top w:val="single" w:sz="24" w:space="24" w:color="000000"/>
            <w:left w:val="single" w:sz="24" w:space="24" w:color="000000"/>
            <w:bottom w:val="single" w:sz="24" w:space="24" w:color="000000"/>
            <w:right w:val="single" w:sz="24" w:space="24" w:color="000000"/>
          </w:pgBorders>
          <w:pgMar w:top="1440" w:bottom="1440" w:left="1440" w:right="1440"/>
          <w:type w:val="nextPage"/>
        </w:sectPr>
      </w:pPr>
      <w:r><w:t>CoverLine</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>BodyStarts</w:t></w:r>
    </w:p>
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:bottom="1440" w:left="1440" w:right="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`);

    zip.file('word/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
  </w:style>
</w:styles>`);

    return zip.generateAsync({ type: 'uint8array' });
}

async function centeredImageDocx() {
    const png = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC',
        'base64',
    );
    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new ImageRun({
                            type: 'png',
                            data: png,
                            transformation: { width: 40, height: 40 },
                        }),
                    ],
                }),
            ],
        }],
    });
    const buffer = await Packer.toBuffer(doc);

    return new Uint8Array(buffer);
}

async function coverDocx() {
    const zip = new JSZip();

    zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:t>COVER TITLE</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:t>AND</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:sectPr>
          <w:pgBorders w:offsetFrom="page">
            <w:top w:val="single" w:sz="12" w:space="36" w:color="000000"/>
            <w:left w:val="single" w:sz="12" w:space="36" w:color="000000"/>
            <w:bottom w:val="single" w:sz="12" w:space="36" w:color="000000"/>
            <w:right w:val="single" w:sz="12" w:space="36" w:color="000000"/>
          </w:pgBorders>
          <w:vAlign w:val="both"/>
          <w:type w:val="nextPage"/>
        </w:sectPr>
      </w:pPr>
      <w:r><w:t>MARSUS Foundation</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>BodyStarts</w:t></w:r>
    </w:p>
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
    </w:sectPr>
  </w:body>
</w:document>`);

    zip.file('word/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
  </w:style>
</w:styles>`);

    zip.file('word/theme/theme1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <a:themeElements>
    <a:fontScheme name="Office">
      <a:majorFont><a:latin typeface="Calibri"/></a:majorFont>
      <a:minorFont><a:latin typeface="Calibri"/></a:minorFont>
    </a:fontScheme>
  </a:themeElements>
</a:theme>`);

    return zip.generateAsync({ type: 'uint8array' });
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
