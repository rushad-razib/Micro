import exifr from 'exifr';
import { canvasToBlob, drawToCanvas } from './shared/canvas.js';
import { ERRORS } from './shared/errors.js';
import { defaultOutputMime } from './shared/file.js';

/**
 * @param {File} file
 */
export async function readMetadata(file) {
    let data = null;

    try {
        data = await exifr.parse(file, {
            pick: ['Make', 'Model', 'DateTimeOriginal', 'CreateDate', 'Software', 'GPSLatitude', 'GPSLongitude'],
            gps: true,
        });
    } catch {
        data = null;
    }

    if (! data) {
        return {
            found: false,
            items: [],
            message: 'No camera details were found. You can still download a cleaned copy.',
        };
    }

    const items = [];

    if (data.Make || data.Model) {
        items.push({
            key: 'camera',
            label: 'Camera',
            value: [data.Make, data.Model].filter(Boolean).join(' '),
            removed: false,
        });
    }

    const date = data.DateTimeOriginal || data.CreateDate;

    if (date) {
        items.push({
            key: 'date',
            label: 'Date taken',
            value: date instanceof Date ? date.toISOString().slice(0, 10) : String(date),
            removed: false,
        });
    }

    if (data.latitude != null || data.longitude != null || data.GPSLatitude != null || data.GPSLongitude != null) {
        items.push({
            key: 'gps',
            label: 'Location',
            value: 'Location is embedded',
            removed: false,
        });
    }

    if (data.Software) {
        items.push({
            key: 'software',
            label: 'Software',
            value: String(data.Software),
            removed: false,
        });
    }

    if (items.length === 0) {
        return {
            found: false,
            items: [],
            message: 'No camera details were found. You can still download a cleaned copy.',
        };
    }

    return {
        found: true,
        items,
        message: '',
    };
}

/**
 * @param {object} ctx
 */
export async function process(ctx) {
    const { bitmap, sourceType, file } = ctx;
    const meta = await readMetadata(file);
    const mime = defaultOutputMime(sourceType);
    const canvas = drawToCanvas(bitmap, bitmap.width, bitmap.height, (drawCtx) => {
        drawCtx.drawImage(bitmap, 0, 0);
    });
    const blob = await canvasToBlob(canvas, mime, 0.92);

    // GPS regression: cleaned blob must not report GPS via exifr.
    let gpsGone = true;

    try {
        const after = await exifr.parse(blob, { gps: true });
        if (after && (after.latitude != null || after.longitude != null || after.GPSLatitude != null)) {
            gpsGone = false;
        }
    } catch {
        gpsGone = true;
    }

    if (! gpsGone) {
        throw new Error(ERRORS.strip);
    }

    const cleanedItems = meta.items.map((item) => ({
        ...item,
        value: item.key === 'gps' ? 'Removed' : item.value,
        removed: true,
    }));

    return {
        blob,
        mime,
        width: canvas.width,
        height: canvas.height,
        canvas,
        meta: {
            ...meta,
            items: cleanedItems.length ? cleanedItems : meta.items,
            gpsGone: true,
            sizeNote: 'Rewriting the file can change the byte size slightly even when dimensions stay the same.',
        },
    };
}

export function defaultOptions() {
    return {};
}
