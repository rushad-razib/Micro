import { ERRORS } from './shared/errors.js';
import { defaultOutputMime } from './shared/file.js';

/**
 * @param {object} ctx
 */
export async function process(ctx) {
    const { bitmap, sourceType, options } = ctx;
    const mime = defaultOutputMime(sourceType);

    try {
        if (mime === 'image/jpeg') {
            return compressJpeg(bitmap, options.quality ?? 80);
        }

        if (mime === 'image/webp') {
            return compressWebp(bitmap, options.quality ?? 80);
        }

        // PNG (and GIF/exotic defaults that became PNG)
        return compressPng(bitmap);
    } catch {
        throw new Error(ERRORS.compress);
    }
}

export function defaultOptions(tool, sourceType) {
    const mime = defaultOutputMime(sourceType);

    return {
        quality: 80,
        outputMime: mime,
        lossless: mime === 'image/png',
    };
}

async function compressJpeg(bitmap, quality) {
    const { encode } = await import('@jsquash/jpeg');
    const imageData = bitmapToImageData(bitmap);
    const buffer = await encode(imageData, { quality: clampQuality(quality) });
    const blob = new Blob([buffer], { type: 'image/jpeg' });

    return {
        blob,
        mime: 'image/jpeg',
        width: bitmap.width,
        height: bitmap.height,
    };
}

async function compressWebp(bitmap, quality) {
    const { encode } = await import('@jsquash/webp');
    const imageData = bitmapToImageData(bitmap);
    const buffer = await encode(imageData, { quality: clampQuality(quality) });
    const blob = new Blob([buffer], { type: 'image/webp' });

    return {
        blob,
        mime: 'image/webp',
        width: bitmap.width,
        height: bitmap.height,
    };
}

async function compressPng(bitmap) {
    const { optimise } = await import('@jsquash/oxipng');
    const imageData = bitmapToImageData(bitmap);
    const buffer = await optimise(imageData, { level: 2 });
    const blob = new Blob([buffer], { type: 'image/png' });

    return {
        blob,
        mime: 'image/png',
        width: bitmap.width,
        height: bitmap.height,
    };
}

/**
 * @param {ImageBitmap} bitmap
 */
function bitmapToImageData(bitmap) {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');

    if (! ctx) {
        throw new Error(ERRORS.compress);
    }

    ctx.drawImage(bitmap, 0, 0);

    return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function clampQuality(quality) {
    return Math.min(95, Math.max(40, Math.round(Number(quality) || 80)));
}
