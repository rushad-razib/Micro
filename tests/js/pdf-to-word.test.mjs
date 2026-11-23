import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import JSZip from 'jszip';
import { layoutPdf, openPdf } from '../../resources/js/engines/pdf-to-docx.js';

const fontDir = `${path.join(path.dirname(fileURLToPath(import.meta.url)), '../../node_modules/pdfjs-dist/standard_fonts').replaceAll('\\', '/')}/`;

const PNG = Uint8Array.from(Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC',
    'base64',
));

test('a centered short line stays centered and a left line does not', async () => {
    const xml = await convert(await alignedPdf());
    const cover = paragraphWith(xml, 'CoverLine');
    const body = paragraphWith(xml, 'LeftBody');

    assert.match(cover, /w:jc w:val="center"/);
    assert.doesNotMatch(body, /w:jc w:val="center"/);
});

test('a bold run stays bold and the second page starts with a page break', async () => {
    const xml = await convert(await boldPagedPdf());
    const bold = paragraphWith(xml, 'BoldWord');

    assert.match(bold, /<w:b(?:\s|>|\/>)/);
    assert.match(xml, /w:type="page"|w:pageBreakBefore/);
    assert.match(xml, /SecondPage/);
});

test('a full-page rectangle on page 1 does not border the next section', async () => {
    const xml = await convert(await framedPdf());
    const sections = [...xml.matchAll(/<w:sectPr[\s\S]*?<\/w:sectPr>/g)].map((match) => match[0]);

    assert.equal(sections.length, 2);
    assert.equal(sections.filter((section) => section.includes('w:pgBorders')).length, 1);
    assert.match(sections[0], /w:pgBorders/);
    assert.doesNotMatch(sections[1], /w:pgBorders/);
});

test('a ruled 2 by 2 grid becomes a table with both cell strings', async () => {
    const xml = await convert(await tablePdf());
    const table = xml.match(/<w:tbl[\s\S]*?<\/w:tbl>/)?.[0] || '';

    assert.match(table, /Alpha/);
    assert.match(table, /Beta/);
});

test('a small PNG is stored under word/media', async () => {
    const zip = await convertZip(await imagePdf());
    const media = Object.keys(zip.files).filter((name) => name.startsWith('word/media/') && ! name.endsWith('/'));

    assert.ok(media.length > 0);
});

/**
 * @param {Uint8Array} bytes
 */
async function convert(bytes) {
    const zip = await convertZip(bytes);

    return zip.file('word/document.xml').async('string');
}

/**
 * @param {Uint8Array} bytes
 */
async function convertZip(bytes) {
    const source = new Uint8Array(bytes);
    const pdf = await openPdf(source.slice(), {
        disableWorker: true,
        standardFontDataUrl: fontDir,
    });
    const result = await layoutPdf(pdf, source);

    return JSZip.loadAsync(await result.blob.arrayBuffer());
}

/**
 * @param {string} xml
 * @param {string} text
 */
function paragraphWith(xml, text) {
    const paragraph = xml.split(/<w:p[\s>]/).find((entry) => entry.includes(text));

    assert.ok(paragraph, text);

    return paragraph;
}

async function alignedPdf() {
    const doc = await PDFDocument.create();
    const page = doc.addPage([595.28, 841.89]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const size = 18;
    const width = font.widthOfTextAtSize('CoverLine', size);

    page.drawText('CoverLine', {
        x: (page.getWidth() - width) / 2,
        y: 760,
        size,
        font,
    });
    page.drawText('LeftBody', {
        x: 72,
        y: 720,
        size: 12,
        font,
    });

    return doc.save();
}

async function boldPagedPdf() {
    const doc = await PDFDocument.create();
    const regular = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const first = doc.addPage([595.28, 841.89]);

    first.drawText('BoldWord', {
        x: 72,
        y: 720,
        size: 12,
        font: bold,
    });

    const second = doc.addPage([595.28, 841.89]);

    second.drawText('SecondPage', {
        x: 72,
        y: 720,
        size: 12,
        font: regular,
    });

    return doc.save();
}

async function framedPdf() {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const first = doc.addPage([595.28, 841.89]);

    first.drawRectangle({
        x: 24,
        y: 24,
        width: first.getWidth() - 48,
        height: first.getHeight() - 48,
        borderWidth: 3,
        borderColor: rgb(0, 0, 0),
    });
    first.drawText('Framed', {
        x: 72,
        y: 720,
        size: 12,
        font,
    });

    const second = doc.addPage([595.28, 841.89]);

    second.drawText('Open', {
        x: 72,
        y: 720,
        size: 12,
        font,
    });

    return doc.save();
}

async function tablePdf() {
    const doc = await PDFDocument.create();
    const page = doc.addPage([595.28, 841.89]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const xs = [72, 192, 312];
    const ys = [400, 430, 460];

    for (const x of xs) {
        page.drawLine({
            start: { x, y: ys[0] },
            end: { x, y: ys[2] },
            thickness: 1,
            color: rgb(0, 0, 0),
        });
    }

    for (const y of ys) {
        page.drawLine({
            start: { x: xs[0], y },
            end: { x: xs[2], y },
            thickness: 1,
            color: rgb(0, 0, 0),
        });
    }

    page.drawText('Alpha', { x: 80, y: 438, size: 12, font });
    page.drawText('Beta', { x: 200, y: 438, size: 12, font });

    return doc.save();
}

async function imagePdf() {
    const doc = await PDFDocument.create();
    const page = doc.addPage([595.28, 841.89]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const image = await doc.embedPng(PNG);

    page.drawImage(image, { x: 250, y: 640, width: 40, height: 40 });
    page.drawText('Caption', { x: 72, y: 600, size: 12, font });

    return doc.save();
}
