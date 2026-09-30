import { ACCEPT_EXTENSIONS, ACCEPT_TYPES, ERRORS, GIF_NOTE } from './errors.js';

/**
 * @param {File} file
 * @param {{ max_bytes: number, max_edge: number }} limits
 */
export async function openImageFile(file, limits) {
    if (! file || ! isAcceptedFile(file)) {
        throw new Error(ERRORS.notImage);
    }

    if (file.size > limits.max_bytes) {
        throw new Error(ERRORS.overBytes);
    }

    let bitmap;

    try {
        bitmap = await createImageBitmap(file);
    } catch {
        throw new Error(ERRORS.decode);
    }

    if (bitmap.width > limits.max_edge || bitmap.height > limits.max_edge) {
        bitmap.close();
        throw new Error(ERRORS.overEdge);
    }

    const type = normalizeMime(file.type) || mimeFromName(file.name) || 'image/png';
    const isGif = type === 'image/gif' || /\.gif$/i.test(file.name);

    return {
        file,
        bitmap,
        sourceBytes: file.size,
        sourceType: type,
        basename: sanitizeBasename(file.name),
        gifNote: isGif ? GIF_NOTE : '',
    };
}

/**
 * @param {File} file
 */
export function isAcceptedFile(file) {
    if (ACCEPT_TYPES.has(file.type)) {
        return true;
    }

    const ext = extensionOf(file.name);

    return ACCEPT_EXTENSIONS.has(ext);
}

/**
 * @param {DataTransferItemList|undefined} items
 * @returns {File|null}
 */
export function fileFromClipboardItems(items) {
    if (! items) {
        return null;
    }

    for (const item of items) {
        if (item.type.startsWith('image/')) {
            return item.getAsFile();
        }
    }

    return null;
}

/**
 * @param {string} name
 */
export function sanitizeBasename(name) {
    const base = name.replace(/\.[^.]+$/, '').trim() || 'image';

    return base
        .replace(/[^\w.-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80) || 'image';
}

/**
 * @param {string} basename
 * @param {string} suffix
 * @param {string} mime
 */
export function downloadName(basename, suffix, mime) {
    return `${basename}-${suffix}.${extForMime(mime)}`;
}

/**
 * @param {string} mime
 */
export function extForMime(mime) {
    switch (normalizeMime(mime)) {
        case 'image/jpeg':
            return 'jpg';
        case 'image/webp':
            return 'webp';
        case 'image/avif':
            return 'avif';
        case 'image/png':
        default:
            return 'png';
    }
}

/**
 * @param {string} mime
 */
export function normalizeMime(mime) {
    if (! mime) {
        return '';
    }

    if (mime === 'image/jpg') {
        return 'image/jpeg';
    }

    return mime;
}

/**
 * GIF and exotic decodes become PNG for canvas export.
 * @param {string} sourceType
 */
export function defaultOutputMime(sourceType) {
    const mime = normalizeMime(sourceType);

    if (mime === 'image/jpeg' || mime === 'image/png' || mime === 'image/webp') {
        return mime;
    }

    return 'image/png';
}

/**
 * @param {string} name
 */
function extensionOf(name) {
    const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);

    return match ? match[1] : '';
}

/**
 * @param {string} name
 */
function mimeFromName(name) {
    switch (extensionOf(name)) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'webp':
            return 'image/webp';
        case 'gif':
            return 'image/gif';
        case 'avif':
            return 'image/avif';
        case 'bmp':
            return 'image/bmp';
        default:
            return '';
    }
}

/**
 * @param {number} bytes
 */
export function formatBytes(bytes) {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
