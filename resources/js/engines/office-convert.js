import { Document, Packer, Paragraph, TextRun } from 'docx';
import mammoth from 'mammoth';
import { layoutDocument } from './docx-to-pdf.js';
import { layoutPdf, openPdf } from './pdf-to-docx.js';
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

    const source = await file.arrayBuffer();
    const bytes = source.slice(0);
    let document = null;

    try {
        // Node's Mammoth reads `buffer`; the browser build reads `arrayBuffer`.
        await mammoth.convertToHtml(
            { arrayBuffer: bytes, buffer: bytes },
            {
                transformDocument(node) {
                    document = node;

                    return node;
                },
            },
        );
    } catch (error) {
        if (! document) {
            throw unreadableDocx(error);
        }
    }

    if (! document) {
        throw unreadableDocx();
    }

    try {
        return await layoutDocument(document, source.slice(0), limits);
    } catch (error) {
        if (isKnownConversionError(error)) {
            throw error;
        }

        throw unreadableDocx(error);
    }
}

async function pdfToWord(file, limits) {
    if (! isPdfFile(file)) {
        throw new Error('Drop a PDF file.');
    }

    assertMaxBytes(file, limits);

    const source = await readFileBytes(file);
    const standardFontFile = new URL(
        'pdfjs-dist/standard_fonts/LiberationSans-Regular.ttf',
        import.meta.url,
    );
    const pdf = await openPdf(source.slice(), {
        workerSrc: new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString(),
        standardFontDataUrl: new URL('./', standardFontFile).href,
    });
    const maxPages = limits?.max_pages ?? 100;

    if (pdf.numPages > maxPages) {
        throw new Error(`This PDF has too many pages (max ${maxPages}).`);
    }

    return layoutPdf(pdf, source);
}

/**
 * @param {unknown} [cause]
 */
function unreadableDocx(cause) {
    const error = new Error('Could not read this DOCX. Try re-saving it from Word or LibreOffice.');

    if (cause) {
        error.cause = cause;
    }

    return error;
}

/**
 * @param {unknown} error
 */
function isKnownConversionError(error) {
    return error instanceof Error && (
        error.message.startsWith('No readable text')
        || error.message.startsWith('This document is too long')
    );
}
