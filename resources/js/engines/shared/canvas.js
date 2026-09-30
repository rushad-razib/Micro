import { defaultOutputMime, normalizeMime } from './file.js';

/**
 * @param {ImageBitmap|HTMLCanvasElement|HTMLImageElement} source
 * @param {number} width
 * @param {number} height
 * @param {(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void} draw
 */
export function drawToCanvas(source, width, height, draw) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
    const ctx = canvas.getContext('2d');

    if (! ctx) {
        throw new Error('Canvas is not available in this browser.');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    draw(ctx, canvas);

    return canvas;
}

/**
 * Fit inside maxW×maxH without upscaling.
 * @param {number} srcW
 * @param {number} srcH
 * @param {number} maxW
 * @param {number} maxH
 */
export function fitInside(srcW, srcH, maxW, maxH) {
    const scale = Math.min(1, maxW / srcW, maxH / srcH);

    return {
        width: Math.max(1, Math.round(srcW * scale)),
        height: Math.max(1, Math.round(srcH * scale)),
    };
}

/**
 * Cover a frame then center-crop to exact size.
 * @param {ImageBitmap} bitmap
 * @param {number} frameW
 * @param {number} frameH
 */
export function coverCenterCrop(bitmap, frameW, frameH) {
    const scale = Math.max(frameW / bitmap.width, frameH / bitmap.height);
    const scaledW = bitmap.width * scale;
    const scaledH = bitmap.height * scale;
    const dx = (frameW - scaledW) / 2;
    const dy = (frameH - scaledH) / 2;

    return drawToCanvas(bitmap, frameW, frameH, (ctx) => {
        ctx.drawImage(bitmap, dx, dy, scaledW, scaledH);
    });
}

/**
 * Fit inside a frame (contain). May leave empty margins; does not upscale beyond source.
 * @param {ImageBitmap} bitmap
 * @param {number} frameW
 * @param {number} frameH
 */
export function containInFrame(bitmap, frameW, frameH) {
    const { width, height } = fitInside(bitmap.width, bitmap.height, frameW, frameH);
    const dx = (frameW - width) / 2;
    const dy = (frameH - height) / 2;

    return drawToCanvas(bitmap, frameW, frameH, (ctx) => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, frameW, frameH);
        ctx.drawImage(bitmap, dx, dy, width, height);
    });
}

/**
 * @param {ImageBitmap} bitmap
 * @param {{ x: number, y: number, width: number, height: number }} rect
 */
export function cropRect(bitmap, rect) {
    const x = clamp(Math.round(rect.x), 0, bitmap.width - 1);
    const y = clamp(Math.round(rect.y), 0, bitmap.height - 1);
    const width = clamp(Math.round(rect.width), 1, bitmap.width - x);
    const height = clamp(Math.round(rect.height), 1, bitmap.height - y);

    return drawToCanvas(bitmap, width, height, (ctx) => {
        ctx.drawImage(bitmap, x, y, width, height, 0, 0, width, height);
    });
}

/**
 * @param {ImageBitmap|HTMLCanvasElement} source
 * @param {number} quarterTurns clockwise 0-3
 * @param {boolean} flipH
 * @param {boolean} flipV
 */
export function rotateFlip(source, quarterTurns, flipH, flipV) {
    const turns = ((quarterTurns % 4) + 4) % 4;
    const srcW = source.width;
    const srcH = source.height;
    const swap = turns % 2 === 1;
    const outW = swap ? srcH : srcW;
    const outH = swap ? srcW : srcH;

    return drawToCanvas(source, outW, outH, (ctx) => {
        ctx.translate(outW / 2, outH / 2);
        ctx.rotate((turns * Math.PI) / 2);
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
        ctx.drawImage(source, -srcW / 2, -srcH / 2);
    });
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {string} mime
 * @param {number} quality 0-1 for jpeg/webp
 * @returns {Promise<Blob>}
 */
export function canvasToBlob(canvas, mime, quality = 0.92) {
    const type = normalizeMime(mime) || 'image/png';

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (! blob) {
                    reject(new Error('This browser could not create that image format.'));
                    return;
                }

                resolve(blob);
            },
            type,
            type === 'image/jpeg' || type === 'image/webp' || type === 'image/avif' ? quality : undefined,
        );
    });
}

/**
 * @returns {Promise<boolean>}
 */
export async function canEncodeAvif() {
    if (typeof HTMLCanvasElement === 'undefined') {
        return false;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;

    try {
        const blob = await canvasToBlob(canvas, 'image/avif', 0.8);

        return blob.type === 'image/avif';
    } catch {
        return false;
    }
}

/**
 * @param {string} sourceType
 * @param {string|null} chosen
 */
export function resolveOutputMime(sourceType, chosen) {
    if (chosen) {
        return normalizeMime(chosen);
    }

    return defaultOutputMime(sourceType);
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 */
export function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

/**
 * Centered rect of given aspect ratio as large as fits.
 * @param {number} imgW
 * @param {number} imgH
 * @param {number} ratioW
 * @param {number} ratioH
 */
export function centeredAspectRect(imgW, imgH, ratioW, ratioH) {
    const target = ratioW / ratioH;
    let width;
    let height;

    if (imgW / imgH > target) {
        height = imgH;
        width = height * target;
    } else {
        width = imgW;
        height = width / target;
    }

    return {
        x: (imgW - width) / 2,
        y: (imgH - height) / 2,
        width,
        height,
    };
}
