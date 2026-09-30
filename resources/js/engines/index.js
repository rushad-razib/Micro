const engines = {
    'canvas-transform': () => import('./canvas-transform.js'),
    'metadata-strip': () => import('./metadata-strip.js'),
    'squoosh-compress': () => import('./squoosh-compress.js'),
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
