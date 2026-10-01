import { PDFDocument, degrees } from 'pdf-lib';
import {
    assertMaxBytes,
    assertTotalBytes,
    isImageFile,
    isPdfFile,
    readFileBytes,
} from './shared/document.js';

export function defaultOptions(tool) {
    if (tool === 'split-pdf') {
        return { fromPage: 1, toPage: null };
    }

    if (tool === 'rotate-pdf') {
        return { angle: 90 };
    }

    return {};
}

/**
 * @param {{ files: File[], tool: string, options: object, limits: object }} input
 */
export async function process(input) {
    const { files, tool, options, limits } = input;

    if (! files?.length) {
        throw new Error('Add at least one file.');
    }

    assertTotalBytes(files, limits);

    if (tool === 'merge-pdf') {
        return mergePdfs(files, limits);
    }

    if (tool === 'split-pdf') {
        return splitPdf(files[0], options, limits);
    }

    if (tool === 'rotate-pdf') {
        return rotatePdf(files[0], options, limits);
    }

    if (tool === 'images-to-pdf') {
        return imagesToPdf(files, limits);
    }

    throw new Error('Unknown PDF tool.');
}

async function mergePdfs(files, limits) {
    if (files.length < 2) {
        throw new Error('Add at least two PDF files to merge.');
    }

    const maxFiles = limits?.max_files ?? 20;

    if (files.length > maxFiles) {
        throw new Error(`You can merge up to ${maxFiles} files.`);
    }

    for (const file of files) {
        if (! isPdfFile(file)) {
            throw new Error(`“${file.name}” is not a PDF.`);
        }
    }

    const out = await PDFDocument.create();
    let pages = 0;
    const maxPages = limits?.max_pages ?? 200;

    for (const file of files) {
        assertMaxBytes(file, limits);
        let src;

        try {
            src = await PDFDocument.load(await readFileBytes(file), { ignoreEncryption: false });
        } catch {
            throw new Error(`Could not open “${file.name}”. It may be damaged or password-protected.`);
        }

        pages += src.getPageCount();

        if (pages > maxPages) {
            throw new Error(`Too many pages (max ${maxPages}).`);
        }

        const copied = await out.copyPages(src, src.getPageIndices());
        copied.forEach((page) => out.addPage(page));
    }

    const bytes = await out.save();

    return {
        blob: new Blob([bytes], { type: 'application/pdf' }),
        mime: 'application/pdf',
        extension: 'pdf',
        meta: { pageCount: pages, fileCount: files.length },
    };
}

async function splitPdf(file, options, limits) {
    if (! file || ! isPdfFile(file)) {
        throw new Error('Drop a PDF file.');
    }

    assertMaxBytes(file, limits);

    let src;

    try {
        src = await PDFDocument.load(await readFileBytes(file), { ignoreEncryption: false });
    } catch {
        throw new Error('Could not open this PDF. It may be damaged or password-protected.');
    }

    const total = src.getPageCount();
    const maxPages = limits?.max_pages ?? 200;

    if (total > maxPages) {
        throw new Error(`This PDF has too many pages (max ${maxPages}).`);
    }

    const from = Math.max(1, Number(options.fromPage) || 1);
    const to = Math.min(total, Number(options.toPage) || total);

    if (from > to) {
        throw new Error('The start page must be before the end page.');
    }

    const out = await PDFDocument.create();
    const indices = [];

    for (let i = from - 1; i < to; i += 1) {
        indices.push(i);
    }

    const copied = await out.copyPages(src, indices);
    copied.forEach((page) => out.addPage(page));

    const bytes = await out.save();

    return {
        blob: new Blob([bytes], { type: 'application/pdf' }),
        mime: 'application/pdf',
        extension: 'pdf',
        meta: { pageCount: indices.length, fromPage: from, toPage: to, sourcePages: total },
    };
}

async function rotatePdf(file, options, limits) {
    if (! file || ! isPdfFile(file)) {
        throw new Error('Drop a PDF file.');
    }

    assertMaxBytes(file, limits);

    let src;

    try {
        src = await PDFDocument.load(await readFileBytes(file), { ignoreEncryption: false });
    } catch {
        throw new Error('Could not open this PDF. It may be damaged or password-protected.');
    }

    const maxPages = limits?.max_pages ?? 200;

    if (src.getPageCount() > maxPages) {
        throw new Error(`This PDF has too many pages (max ${maxPages}).`);
    }

    const angle = [90, 180, 270].includes(Number(options.angle)) ? Number(options.angle) : 90;

    src.getPages().forEach((page) => {
        const current = page.getRotation().angle;
        page.setRotation(degrees((current + angle) % 360));
    });

    const bytes = await src.save();

    return {
        blob: new Blob([bytes], { type: 'application/pdf' }),
        mime: 'application/pdf',
        extension: 'pdf',
        meta: { pageCount: src.getPageCount(), angle },
    };
}

async function imagesToPdf(files, limits) {
    const maxFiles = limits?.max_files ?? 30;

    if (files.length > maxFiles) {
        throw new Error(`You can add up to ${maxFiles} images.`);
    }

    for (const file of files) {
        if (! isImageFile(file)) {
            throw new Error(`“${file.name}” is not a supported image.`);
        }
        assertMaxBytes(file, limits);
    }

    const out = await PDFDocument.create();
    const maxEdge = limits?.max_edge ?? 8192;

    for (const file of files) {
        const bitmap = await createImageBitmap(file);

        try {
            if (bitmap.width > maxEdge || bitmap.height > maxEdge) {
                throw new Error(`“${file.name}” is too large (max ${maxEdge}px on an edge).`);
            }

            const { bytes, kind } = await imageFileToEmbedBytes(file, bitmap);
            const image = kind === 'png'
                ? await out.embedPng(bytes)
                : await out.embedJpg(bytes);

            const page = out.addPage([image.width, image.height]);
            page.drawImage(image, {
                x: 0,
                y: 0,
                width: image.width,
                height: image.height,
            });
        } finally {
            bitmap.close();
        }
    }

    if (out.getPageCount() === 0) {
        throw new Error('Add at least one image.');
    }

    const bytes = await out.save();

    return {
        blob: new Blob([bytes], { type: 'application/pdf' }),
        mime: 'application/pdf',
        extension: 'pdf',
        meta: { pageCount: out.getPageCount(), fileCount: files.length },
    };
}

async function imageFileToEmbedBytes(file, bitmap) {
    const type = (file.type || '').toLowerCase();
    const name = (file.name || '').toLowerCase();

    if (type === 'image/jpeg' || name.endsWith('.jpg') || name.endsWith('.jpeg')) {
        return { bytes: await readFileBytes(file), kind: 'jpg' };
    }

    if (type === 'image/png' || name.endsWith('.png')) {
        return { bytes: await readFileBytes(file), kind: 'png' };
    }

    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0);

    const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((value) => (value ? resolve(value) : reject(new Error('Could not encode the image.'))), 'image/jpeg', 0.92);
    });

    return { bytes: new Uint8Array(await blob.arrayBuffer()), kind: 'jpg' };
}
