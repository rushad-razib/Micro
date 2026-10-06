import { canvasToBlob } from './shared/canvas.js';

const BLANK_IMAGE = 'This image opened blank, so there is nothing to click. Export it as a PNG or JPEG and try again.';

/**
 * @param {Uint8ClampedArray} data
 * @param {number} width
 * @param {number} height
 * @param {{ x: number, y: number, tolerance?: number }} click
 */
export function floodFillTransparent(data, width, height, click) {
    const x0 = Math.min(width - 1, Math.max(0, Math.round(Number(click.x))));
    const y0 = Math.min(height - 1, Math.max(0, Math.round(Number(click.y))));
    const origin = (y0 * width + x0) * 4;

    if (data[origin + 3] === 0) {
        return;
    }

    const sampleR = data[origin];
    const sampleG = data[origin + 1];
    const sampleB = data[origin + 2];
    const tolerance = Number.isFinite(Number(click.tolerance)) ? Number(click.tolerance) : 32;

    /**
     * @param {number} offset
     */
    const matches = (offset) => data[offset + 3] !== 0
        && Math.abs(data[offset] - sampleR) <= tolerance
        && Math.abs(data[offset + 1] - sampleG) <= tolerance
        && Math.abs(data[offset + 2] - sampleB) <= tolerance;

    const stack = [x0, y0];

    while (stack.length > 0) {
        const y = stack.pop();
        let x = stack.pop();
        let offset = (y * width + x) * 4;

        while (x > 0 && matches(offset - 4)) {
            x -= 1;
            offset -= 4;
        }

        let spanUp = false;
        let spanDown = false;

        while (x < width && matches(offset)) {
            data[offset + 3] = 0;

            if (y > 0) {
                const up = offset - (width * 4);

                if (! spanUp && matches(up)) {
                    stack.push(x, y - 1);
                    spanUp = true;
                } else if (spanUp && ! matches(up)) {
                    spanUp = false;
                }
            }

            if (y + 1 < height) {
                const down = offset + (width * 4);

                if (! spanDown && matches(down)) {
                    stack.push(x, y + 1);
                    spanDown = true;
                } else if (spanDown && ! matches(down)) {
                    spanDown = false;
                }
            }

            x += 1;
            offset += 4;
        }
    }
}

/**
 * Some browsers decode AVIF with every alpha value at 0 while the color is still there.
 * That paints a checkerboard and leaves nothing to click. Restore opacity only when no pixel is visible.
 *
 * @param {Uint8ClampedArray} data
 */
export function restoreDroppedAlpha(data) {
    let colored = false;

    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0) {
            return false;
        }

        if (data[i] !== 0 || data[i + 1] !== 0 || data[i + 2] !== 0) {
            colored = true;
        }
    }

    if (! colored) {
        return false;
    }

    for (let i = 3; i < data.length; i += 4) {
        data[i] = 255;
    }

    return true;
}

/**
 * @param {Uint8ClampedArray} data
 */
function hasVisiblePixel(data) {
    for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 0) {
            return true;
        }
    }

    return false;
}

/**
 * @param {number} width
 * @param {number} height
 */
function readableSurface(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
    const ctx = canvas.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' })
        ?? canvas.getContext('2d', { willReadFrequently: true });

    if (! ctx) {
        throw new Error('Canvas is not available in this browser.');
    }

    ctx.imageSmoothingEnabled = false;

    return { canvas, ctx };
}

/**
 * @param {CanvasImageSource} source
 * @param {number} width
 * @param {number} height
 */
function drawReadable(source, width, height) {
    const surface = readableSurface(width, height);
    surface.ctx.drawImage(source, 0, 0, surface.canvas.width, surface.canvas.height);

    return surface;
}

/**
 * @param {File} file
 */
async function surfaceFromFile(file) {
    const url = URL.createObjectURL(file);

    try {
        const image = new Image();
        image.src = url;
        await image.decode();

        const width = image.naturalWidth;
        const height = image.naturalHeight;

        if (! width || ! height) {
            return null;
        }

        const drawn = drawReadable(image, width, height);
        const imageData = drawn.ctx.getImageData(0, 0, width, height);

        if (! hasVisiblePixel(imageData.data)) {
            try {
                const raw = await createImageBitmap(image, {
                    premultiplyAlpha: 'none',
                    colorSpaceConversion: 'none',
                });
                const rawDrawn = drawReadable(raw, raw.width, raw.height);
                raw.close();
                const rawData = rawDrawn.ctx.getImageData(0, 0, rawDrawn.canvas.width, rawDrawn.canvas.height);
                restoreDroppedAlpha(rawData.data);

                if (hasVisiblePixel(rawData.data)) {
                    return { canvas: rawDrawn.canvas, ctx: rawDrawn.ctx, image: rawData };
                }
            } catch {
                // The element drawing is the remaining source.
            }

            restoreDroppedAlpha(imageData.data);
        }

        return { canvas: drawn.canvas, ctx: drawn.ctx, image: imageData };
    } catch {
        return null;
    } finally {
        URL.revokeObjectURL(url);
    }
}

export function defaultOptions() {
    return {
        tolerance: 32,
        committed: [],
        preview: null,
        outputMime: 'image/png',
    };
}

/**
 * @param {object} ctx
 * @param {ImageBitmap} ctx.bitmap
 * @param {object} ctx.options
 */
export async function process(ctx) {
    const { bitmap, options, file } = ctx;
    let surface = file ? await surfaceFromFile(file) : null;

    if (! surface || ! hasVisiblePixel(surface.image.data)) {
        const drawn = drawReadable(bitmap, bitmap.width, bitmap.height);
        const imageData = drawn.ctx.getImageData(0, 0, drawn.canvas.width, drawn.canvas.height);

        if (! hasVisiblePixel(imageData.data)) {
            restoreDroppedAlpha(imageData.data);
        }

        if (hasVisiblePixel(imageData.data)) {
            surface = { canvas: drawn.canvas, ctx: drawn.ctx, image: imageData };
        }
    }

    if (! surface) {
        throw new Error(BLANK_IMAGE);
    }

    if (! hasVisiblePixel(surface.image.data) && ((options?.committed?.length || 0) > 0 || options?.preview)) {
        throw new Error(BLANK_IMAGE);
    }

    const canvas = surface.canvas;
    const drawCtx = surface.ctx;
    const image = surface.image;
    const committed = Array.isArray(options?.committed) ? options.committed : [];

    for (const click of committed) {
        floodFillTransparent(image.data, canvas.width, canvas.height, click);
    }

    if (options?.preview) {
        floodFillTransparent(image.data, canvas.width, canvas.height, {
            ...options.preview,
            tolerance: options.preview.tolerance ?? options.tolerance,
        });
    }

    drawCtx.putImageData(image, 0, 0);
    const blob = await canvasToBlob(canvas, 'image/png');

    return {
        blob,
        mime: 'image/png',
        width: canvas.width,
        height: canvas.height,
        canvas,
    };
}
