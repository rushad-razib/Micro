export function basename(name) {
    return String(name || 'file').replace(/\.[^.]+$/, '') || 'file';
}

export function formatBytes(bytes) {
    const n = Number(bytes) || 0;

    if (n < 1024) {
        return `${n} B`;
    }

    if (n < 1024 * 1024) {
        return `${(n / 1024).toFixed(n < 10 * 1024 ? 1 : 0)} KB`;
    }

    const mb = n / (1024 * 1024);

    return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}

export function assertMaxBytes(file, limits) {
    const max = limits?.max_bytes ?? 52428800;

    if (file.size > max) {
        throw new Error(`This file is too large (max ${formatBytes(max)}).`);
    }
}

export function assertTotalBytes(files, limits) {
    const max = limits?.max_bytes ?? 52428800;
    const total = files.reduce((sum, file) => sum + file.size, 0);

    if (total > max) {
        throw new Error(`These files total more than ${formatBytes(max)}.`);
    }
}

export async function readFileBytes(file) {
    return new Uint8Array(await file.arrayBuffer());
}

export function isPdfFile(file) {
    const name = (file.name || '').toLowerCase();

    return file.type === 'application/pdf' || name.endsWith('.pdf');
}

export function isDocxFile(file) {
    const name = (file.name || '').toLowerCase();

    return (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        || name.endsWith('.docx')
    );
}

export function isLegacyDocFile(file) {
    const name = (file.name || '').toLowerCase();

    return name.endsWith('.doc') && ! name.endsWith('.docx');
}

export function isImageFile(file) {
    if (file.type?.startsWith('image/')) {
        return true;
    }

    return /\.(jpe?g|png|webp|gif|avif|bmp)$/i.test(file.name || '');
}
