import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import mammoth from 'mammoth';
import {
    assertMaxBytes,
    isDocxFile,
    isLegacyDocFile,
    isPdfFile,
    readFileBytes,
} from './shared/document.js';

export function defaultOptions() {
    return {};
}

/**
 * @param {{ files: File[], tool: string, limits: object }} input
 */
export async function process(input) {
    const { files, tool, limits } = input;
    const file = files?.[0];

    if (! file) {
        throw new Error('Add a file to convert.');
    }

    if (tool === 'word-to-pdf') {
        return wordToPdf(file, limits);
    }

    if (tool === 'pdf-to-word') {
        return pdfToWord(file, limits);
    }

    throw new Error('Unknown conversion tool.');
}

async function wordToPdf(file, limits) {
    if (isLegacyDocFile(file)) {
        throw new Error('Old .doc files are not supported. Save as .docx and try again.');
    }

    if (! isDocxFile(file)) {
        throw new Error('Drop a .docx Word file.');
    }

    assertMaxBytes(file, limits);

    let text;

    try {
        const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        text = (result.value || '').replace(/\r\n/g, '\n').trim();
    } catch {
        throw new Error('Could not read this DOCX. Try re-saving it from Word or LibreOffice.');
    }

    if (! text) {
        throw new Error('No readable text was found in this document.');
    }

    const paragraphs = text.split(/\n+/).filter(Boolean);
    const maxPages = limits?.max_pages ?? 100;
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontSize = 11;
    const lineHeight = 14;
    const margin = 56;
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const maxWidth = pageWidth - margin * 2;

    let page = pdf.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const ensurePage = () => {
        if (pdf.getPageCount() > maxPages) {
            throw new Error(`This document is too long for conversion (max about ${maxPages} pages).`);
        }

        page = pdf.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
    };

    for (const paragraph of paragraphs) {
        const lines = wrapText(paragraph, font, fontSize, maxWidth);

        for (const line of lines) {
            if (y < margin + lineHeight) {
                ensurePage();
            }

            page.drawText(line, {
                x: margin,
                y,
                size: fontSize,
                font,
                color: rgb(0.1, 0.1, 0.1),
            });
            y -= lineHeight;
        }

        y -= lineHeight * 0.6;
    }

    const bytes = await pdf.save();

    return {
        blob: new Blob([bytes], { type: 'application/pdf' }),
        mime: 'application/pdf',
        extension: 'pdf',
        meta: {
            pageCount: pdf.getPageCount(),
            note: 'Text-focused conversion. Complex Word layouts may not match.',
        },
    };
}

async function pdfToWord(file, limits) {
    if (! isPdfFile(file)) {
        throw new Error('Drop a PDF file.');
    }

    assertMaxBytes(file, limits);

    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
    ).toString();

    let pdf;

    try {
        pdf = await pdfjs.getDocument({ data: await readFileBytes(file) }).promise;
    } catch {
        throw new Error('Could not open this PDF. It may be damaged or password-protected.');
    }

    const maxPages = limits?.max_pages ?? 100;

    if (pdf.numPages > maxPages) {
        throw new Error(`This PDF has too many pages (max ${maxPages}).`);
    }

    const paragraphs = [];

    for (let i = 1; i <= pdf.numPages; i += 1) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item) => ('str' in item ? item.str : '')).filter(Boolean);
        const pageText = strings.join(' ').replace(/\s+/g, ' ').trim();

        if (pageText) {
            paragraphs.push(pageText);
        }
    }

    if (paragraphs.length === 0) {
        throw new Error('No text layer found. Scanned PDFs need OCR elsewhere before conversion.');
    }

    const doc = new Document({
        sections: [{
            children: paragraphs.map((text) => new Paragraph({
                children: [new TextRun(text)],
                spacing: { after: 200 },
            })),
        }],
    });

    const blob = await Packer.toBlob(doc);

    return {
        blob,
        mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        extension: 'docx',
        meta: {
            pageCount: pdf.numPages,
            paragraphCount: paragraphs.length,
            note: 'Editable text extraction. Layout will be simpler than the PDF.',
        },
    };
}

function wrapText(text, font, fontSize, maxWidth) {
    const words = text.split(/\s+/);
    const lines = [];
    let current = '';

    for (const word of words) {
        const next = current ? `${current} ${word}` : word;
        const width = font.widthOfTextAtSize(next, fontSize);

        if (width > maxWidth && current) {
            lines.push(current);
            current = word;
        } else {
            current = next;
        }
    }

    if (current) {
        lines.push(current);
    }

    return lines.length ? lines : [''];
}
