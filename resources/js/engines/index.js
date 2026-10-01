const engines = {
    'canvas-transform': () => import('./canvas-transform.js'),
    'metadata-strip': () => import('./metadata-strip.js'),
    'squoosh-compress': () => import('./squoosh-compress.js'),
    'pdf-toolkit': () => import('./pdf-toolkit.js'),
    'office-convert': () => import('./office-convert.js'),
};

/**
 * @param {string} key
 */
export async function loadEngine(key) {
    const loader = engines[key];

    if (! loader) {
        throw new Error(`Unknown engine: ${key}`);
    }

    return loader();
}
