export const ERRORS = {
    notImage: 'This file is not an image we can open. Use a JPEG, PNG, WebP, or GIF.',
    overBytes: 'This image is over 25 MB. Choose a smaller file so it can be processed on your device.',
    overEdge: 'This image is larger than 8192 pixels on a side. Export a smaller copy and try again.',
    decode: 'This image could not be read. Try another export of the same photo.',
    compress: 'This image could not be compressed. Try another file or the convert tool.',
    strip: 'Location data could not be removed from this file. Try another export or the convert tool.',
};

export const GIF_NOTE = 'Only the first frame of this GIF is used.';

export const ACCEPT_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'image/bmp',
]);

export const ACCEPT_EXTENSIONS = new Set([
    'jpg',
    'jpeg',
    'png',
    'webp',
    'gif',
    'avif',
    'bmp',
]);
