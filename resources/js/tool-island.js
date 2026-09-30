import { loadEngine } from './engines/index.js';
import { downloadName, fileFromClipboardItems, formatBytes, openImageFile } from './engines/shared/file.js';

/**
 * Alpine factory for the shared tool island.
 */
export function toolIsland(config) {
    return {
        engineKey: config.engine,
        tool: config.tool,
        suffix: config.suffix,
        limits: config.limits,
        presets: config.presets || [],
        presetKey: config.preset || null,
        parentResizeHref: config.parentResizeHref || '/resize-image',

        error: '',
        busy: false,
        status: '',
        gifNote: '',
        source: null,
        options: {},
        result: null,
        previewUrl: '',
        downloadUrl: '',
        downloadFilename: '',
        meta: null,
        avifOk: false,
        showOriginal: false,
        engine: null,
        generation: 0,
        sourcePreviewUrl: '',
        drag: null,

        get hasFile() {
            return this.source !== null;
        },

        get cropBoxStyle() {
            if (! this.source || ! this.options.rect) {
                return {};
            }

            const rect = this.options.rect;
            const w = this.source.bitmap.width;
            const h = this.source.bitmap.height;

            return {
                left: `${(rect.x / w) * 100}%`,
                top: `${(rect.y / h) * 100}%`,
                width: `${(rect.width / w) * 100}%`,
                height: `${(rect.height / h) * 100}%`,
            };
        },


        get isPreset() {
            return this.presets.length > 0;
        },

        get isResize() {
            return this.tool === 'resize-image' && ! this.isPreset;
        },

        get isConvert() {
            return this.tool === 'convert-image';
        },

        get isCrop() {
            return this.tool === 'crop-image';
        },

        get isRotate() {
            return this.tool === 'rotate-image';
        },

        get isCompress() {
            return this.tool === 'compress-image' || this.engineKey === 'squoosh-compress';
        },

        get isStrip() {
            return this.engineKey === 'metadata-strip';
        },

        get sourceSizeLabel() {
            return this.source ? formatBytes(this.source.sourceBytes) : '';
        },

        get resultSizeLabel() {
            return this.result ? formatBytes(this.result.blob.size) : '';
        },

        get dimensionLabel() {
            if (! this.result) {
                return '';
            }

            return `${this.result.width} × ${this.result.height}`;
        },

        async init() {
            // Engines load on first file open so LCP is not blocked by codec chunks.
        },

        async ensureEngine() {
            if (this.engine) {
                return;
            }

            this.engine = await loadEngine(this.engineKey);

            if (this.isConvert && this.engine.canEncodeAvif) {
                this.avifOk = await this.engine.canEncodeAvif();
            }
        },

        onDrop(event) {
            event.preventDefault();
            const file = event.dataTransfer?.files?.[0];

            if (file) {
                this.openFile(file);
            }
        },

        onBrowse(event) {
            const file = event.target.files?.[0];
            event.target.value = '';

            if (file) {
                this.openFile(file);
            }
        },

        onPaste(event) {
            const file = fileFromClipboardItems(event.clipboardData?.items);

            if (file) {
                event.preventDefault();
                this.openFile(file);
            }
        },

        async openFile(file) {
            this.error = '';
            this.busy = true;
            this.status = this.isCompress ? 'Preparing compressor…' : 'Opening…';
            const generation = ++this.generation;

            try {
                await this.ensureEngine();
                this.revokeUrls();
                this.clearSource();

                const source = await openImageFile(file, this.limits);

                if (generation !== this.generation) {
                    source.bitmap.close();

                    return;
                }

                this.source = source;
                this.sourcePreviewUrl = URL.createObjectURL(source.file);
                this.gifNote = source.gifNote;
                this.options = this.engine.defaultOptions(
                    this.tool,
                    source.sourceType,
                    source.bitmap,
                    this.presets,
                    this.presetKey,
                );

                if (this.isPreset && this.presetKey) {
                    this.options.frameKey = this.presetKey;
                }

                await this.run(generation);
            } catch (err) {
                if (generation === this.generation) {
                    this.error = err?.message || 'Something went wrong.';
                    this.clearSource();
                }
            } finally {
                if (generation === this.generation) {
                    this.busy = false;
                    this.status = '';
                }
            }
        },

        async run(generation = this.generation) {
            if (! this.source || ! this.engine) {
                return;
            }

            this.busy = true;
            this.status = this.isCompress ? 'Compressing…' : 'Working…';

            try {
                const result = await this.engine.process({
                    bitmap: this.source.bitmap,
                    sourceType: this.source.sourceType,
                    file: this.source.file,
                    tool: this.tool,
                    options: this.options,
                    presets: this.presets,
                    presetKey: this.presetKey,
                });

                if (generation !== this.generation) {
                    return;
                }

                this.revokeResultUrls();
                this.result = result;
                this.meta = result.meta || null;
                this.downloadUrl = URL.createObjectURL(result.blob);
                this.previewUrl = this.downloadUrl;
                this.downloadFilename = downloadName(this.source.basename, this.suffix, result.mime);
            } catch (err) {
                if (generation === this.generation) {
                    this.error = err?.message || 'Something went wrong.';
                    this.result = null;
                    this.revokeResultUrls();
                }
            } finally {
                if (generation === this.generation) {
                    this.busy = false;
                    this.status = '';
                }
            }
        },

        async updateAndRun(mutator) {
            if (! this.source) {
                return;
            }

            this.options = typeof mutator === 'function' ? mutator(this.options) : { ...this.options, ...mutator };
            await this.run();
        },

        setWidth(value) {
            if (! this.engine.resizeFromWidth || ! this.source) {
                return;
            }

            this.updateAndRun(() => this.engine.resizeFromWidth(this.source.bitmap, this.options, value));
        },

        setHeight(value) {
            if (! this.engine.resizeFromHeight || ! this.source) {
                return;
            }

            this.updateAndRun(() => this.engine.resizeFromHeight(this.source.bitmap, this.options, value));
        },

        setPercent(value) {
            if (! this.engine.resizeFromPercent || ! this.source) {
                return;
            }

            this.updateAndRun(() => this.engine.resizeFromPercent(this.source.bitmap, this.options, value));
        },

        setMaxEdge(value) {
            if (! this.engine.resizeFromMaxEdge || ! this.source) {
                return;
            }

            this.updateAndRun(() => this.engine.resizeFromMaxEdge(this.source.bitmap, this.options, value));
        },

        toggleLock() {
            this.options = { ...this.options, lockAspect: ! this.options.lockAspect };
        },

        setOutputMime(mime) {
            this.updateAndRun({ outputMime: mime });
        },

        setQuality(value) {
            const quality = this.isCompress ? Number(value) : Number(value) / 100;
            this.updateAndRun({ quality });
        },

        setCropRatio(ratio) {
            if (! this.engine.applyCropRatio || ! this.source) {
                return;
            }

            this.updateAndRun(() => this.engine.applyCropRatio(this.source.bitmap, this.options, ratio));
        },

        startCropDrag(event, handle) {
            if (! this.isCrop || ! this.source || ! this.options.rect) {
                return;
            }

            event.preventDefault();
            const stage = event.currentTarget.closest('[data-crop-stage]');
            const bounds = stage.getBoundingClientRect();
            const point = event.touches ? event.touches[0] : event;

            this.drag = {
                handle,
                startX: point.clientX,
                startY: point.clientY,
                origin: { ...this.options.rect },
                stageW: bounds.width,
                stageH: bounds.height,
            };
        },

        onCropMove(event) {
            if (! this.drag || ! this.source) {
                return;
            }

            const point = event.touches ? event.touches[0] : event;
            const dx = ((point.clientX - this.drag.startX) / this.drag.stageW) * this.source.bitmap.width;
            const dy = ((point.clientY - this.drag.startY) / this.drag.stageH) * this.source.bitmap.height;
            const o = this.drag.origin;
            const maxW = this.source.bitmap.width;
            const maxH = this.source.bitmap.height;
            let rect = { ...o };

            if (this.drag.handle === 'move') {
                rect.x = this.engine.clamp(o.x + dx, 0, maxW - o.width);
                rect.y = this.engine.clamp(o.y + dy, 0, maxH - o.height);
            } else if (this.drag.handle === 'se') {
                rect.width = this.engine.clamp(o.width + dx, 20, maxW - o.x);
                rect.height = this.engine.clamp(o.height + dy, 20, maxH - o.y);
            } else if (this.drag.handle === 'nw') {
                const nextX = this.engine.clamp(o.x + dx, 0, o.x + o.width - 20);
                const nextY = this.engine.clamp(o.y + dy, 0, o.y + o.height - 20);
                rect.width = o.width + (o.x - nextX);
                rect.height = o.height + (o.y - nextY);
                rect.x = nextX;
                rect.y = nextY;
            }

            this.options = { ...this.options, ratio: 'free', rect };
        },

        async endCropDrag() {
            if (! this.drag) {
                return;
            }

            this.drag = null;
            await this.run();
        },


        rotate(dir) {
            const delta = dir === 'left' ? -1 : 1;
            this.updateAndRun({ turns: ((this.options.turns || 0) + delta) });
        },

        flip(axis) {
            if (axis === 'h') {
                this.updateAndRun({ flipH: ! this.options.flipH });
            } else {
                this.updateAndRun({ flipV: ! this.options.flipV });
            }
        },

        setPresetFrame(key) {
            this.presetKey = key;
            this.updateAndRun({ frameKey: key });
        },

        setPresetMode(mode) {
            this.updateAndRun({ mode });
        },

        startOver() {
            this.generation += 1;
            this.error = '';
            this.busy = false;
            this.status = '';
            this.gifNote = '';
            this.meta = null;
            this.revokeUrls();
            this.clearSource();
            this.result = null;
            this.options = {};
        },

        clearSource() {
            if (this.source?.bitmap) {
                this.source.bitmap.close();
            }

            this.source = null;
            this.drag = null;
        },

        revokeResultUrls() {
            if (this.downloadUrl) {
                URL.revokeObjectURL(this.downloadUrl);
            }

            this.downloadUrl = '';
            this.previewUrl = '';
            this.downloadFilename = '';
        },

        revokeUrls() {
            this.revokeResultUrls();

            if (this.sourcePreviewUrl) {
                URL.revokeObjectURL(this.sourcePreviewUrl);
                this.sourcePreviewUrl = '';
            }
        },
    };
}
