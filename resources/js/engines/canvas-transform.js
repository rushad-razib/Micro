import {
    canEncodeAvif,
    canvasToBlob,
    centeredAspectRect,
    clamp,
    containInFrame,
    coverCenterCrop,
    cropRect,
    drawToCanvas,
    fitInside,
    resolveOutputMime,
    rotateFlip,
} from './shared/canvas.js';
import { defaultOutputMime } from './shared/file.js';

/**
 * @param {object} ctx
 * @param {ImageBitmap} ctx.bitmap
 * @param {string} ctx.sourceType
 * @param {string} ctx.tool
 * @param {object} ctx.options
 * @param {Array<{key:string,label:string,width:number,height:number,default?:boolean}>} ctx.presets
 * @param {string|null} ctx.presetKey
 */
export async function process(ctx) {
    const { tool, bitmap, sourceType, options, presets, presetKey } = ctx;

    if (presets?.length) {
        return processPreset(bitmap, sourceType, options, presets, presetKey);
    }

    switch (tool) {
        case 'resize-image':
            return processResize(bitmap, sourceType, options);
        case 'convert-image':
            return processConvert(bitmap, sourceType, options);
        case 'crop-image':
            return processCrop(bitmap, sourceType, options);
        case 'rotate-image':
            return processRotate(bitmap, sourceType, options);
        default:
            return processResize(bitmap, sourceType, options);
    }
}

export function defaultOptions(tool, sourceType, bitmap, presets, presetKey) {
    if (presets?.length) {
        const frame = presets.find((item) => item.key === presetKey) || presets.find((item) => item.default) || presets[0];

        return {
            mode: 'cover',
            frameKey: frame.key,
            outputMime: defaultOutputMime(sourceType),
            quality: 0.92,
        };
    }

    switch (tool) {
        case 'convert-image': {
            const target = normalizeConvertTarget(sourceType);

            return {
                outputMime: target,
                quality: target === 'image/jpeg' ? 0.9 : 0.8,
            };
        }
        case 'crop-image':
            return {
                ratio: 'free',
                rect: { x: 0, y: 0, width: bitmap.width, height: bitmap.height },
                outputMime: defaultOutputMime(sourceType),
                quality: 0.92,
            };
        case 'rotate-image':
            return {
                turns: 0,
                flipH: false,
                flipV: false,
                outputMime: defaultOutputMime(sourceType),
                quality: 0.92,
            };
        case 'resize-image':
        default: {
            const fitted = fitInside(bitmap.width, bitmap.height, 1920, 1920);

            return {
                editMode: 'max',
                lockAspect: true,
                width: fitted.width,
                height: fitted.height,
                percent: Math.round((fitted.width / bitmap.width) * 100),
                maxEdge: Math.max(fitted.width, fitted.height),
                outputMime: defaultOutputMime(sourceType),
                quality: 0.92,
            };
        }
    }
}

async function processResize(bitmap, sourceType, options) {
    const width = Math.max(1, Math.round(options.width));
    const height = Math.max(1, Math.round(options.height));
    const canvas = drawToCanvas(bitmap, width, height, (ctx) => {
        ctx.drawImage(bitmap, 0, 0, width, height);
    });
    const mime = resolveOutputMime(sourceType, options.outputMime);
    const quality = mime === 'image/jpeg' || mime === 'image/webp' ? options.quality ?? 0.92 : undefined;
    const blob = await canvasToBlob(canvas, mime, quality);

    return {
        blob,
        mime,
        width: canvas.width,
        height: canvas.height,
        canvas,
    };
}

async function processConvert(bitmap, sourceType, options) {
    const mime = resolveOutputMime(sourceType, options.outputMime);
    const quality = mime === 'image/png' ? undefined : (options.quality ?? (mime === 'image/jpeg' ? 0.9 : 0.8));
    const canvas = drawToCanvas(bitmap, bitmap.width, bitmap.height, (ctx) => {
        ctx.drawImage(bitmap, 0, 0);
    });
    const blob = await canvasToBlob(canvas, mime, quality);

    return {
        blob,
        mime,
        width: canvas.width,
        height: canvas.height,
        canvas,
    };
}

async function processCrop(bitmap, sourceType, options) {
    const canvas = cropRect(bitmap, options.rect);
    const mime = resolveOutputMime(sourceType, options.outputMime);
    const blob = await canvasToBlob(canvas, mime, options.quality ?? 0.92);

    return {
        blob,
        mime,
        width: canvas.width,
        height: canvas.height,
        canvas,
    };
}

async function processRotate(bitmap, sourceType, options) {
    const canvas = rotateFlip(bitmap, options.turns ?? 0, options.flipH ?? false, options.flipV ?? false);
    const mime = resolveOutputMime(sourceType, options.outputMime);
    const blob = await canvasToBlob(canvas, mime, options.quality ?? 0.92);

    return {
        blob,
        mime,
        width: canvas.width,
        height: canvas.height,
        canvas,
    };
}

async function processPreset(bitmap, sourceType, options, presets, presetKey) {
    const key = options.frameKey || presetKey;
    const frame = presets.find((item) => item.key === key) || presets[0];
    const canvas = options.mode === 'contain'
        ? containInFrame(bitmap, frame.width, frame.height)
        : coverCenterCrop(bitmap, frame.width, frame.height);
    const mime = resolveOutputMime(sourceType, options.outputMime);
    const blob = await canvasToBlob(canvas, mime, options.quality ?? 0.92);

    return {
        blob,
        mime,
        width: canvas.width,
        height: canvas.height,
        canvas,
        frameLabel: `${frame.width} × ${frame.height}`,
    };
}

function normalizeConvertTarget(sourceType) {
    if (sourceType === 'image/webp') {
        return 'image/jpeg';
    }

    return 'image/webp';
}

export function resizeFromWidth(bitmap, options, width) {
    const next = { ...options, width: Math.max(1, Math.round(width)), editMode: 'size' };

    if (options.lockAspect) {
        next.height = Math.max(1, Math.round((bitmap.height / bitmap.width) * next.width));
    }

    syncDerived(bitmap, next);

    return next;
}

export function resizeFromHeight(bitmap, options, height) {
    const next = { ...options, height: Math.max(1, Math.round(height)), editMode: 'size' };

    if (options.lockAspect) {
        next.width = Math.max(1, Math.round((bitmap.width / bitmap.height) * next.height));
    }

    syncDerived(bitmap, next);

    return next;
}

export function resizeFromPercent(bitmap, options, percent) {
    const p = clamp(Number(percent) || 1, 1, 10000) / 100;
    const next = {
        ...options,
        editMode: 'percent',
        percent: Math.round(p * 100),
        width: Math.max(1, Math.round(bitmap.width * p)),
        height: Math.max(1, Math.round(bitmap.height * p)),
    };

    next.maxEdge = Math.max(next.width, next.height);

    return next;
}

export function resizeFromMaxEdge(bitmap, options, maxEdge) {
    const edge = Math.max(1, Math.round(maxEdge));
    const fitted = fitInside(bitmap.width, bitmap.height, edge, edge);
    const next = {
        ...options,
        editMode: 'max',
        maxEdge: edge,
        width: fitted.width,
        height: fitted.height,
    };

    next.percent = Math.round((next.width / bitmap.width) * 100);

    return next;
}

function syncDerived(bitmap, options) {
    options.percent = Math.round((options.width / bitmap.width) * 100);
    options.maxEdge = Math.max(options.width, options.height);
}

export function applyCropRatio(bitmap, options, ratio) {
    if (ratio === 'free') {
        return {
            ...options,
            ratio: 'free',
            rect: { x: 0, y: 0, width: bitmap.width, height: bitmap.height },
        };
    }

    const [rw, rh] = ratio.split(':').map(Number);
    const rect = centeredAspectRect(bitmap.width, bitmap.height, rw, rh);

    return {
        ...options,
        ratio,
        rect,
    };
}

export { canEncodeAvif, clamp };
