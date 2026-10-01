import { loadEngine } from './engines/index.js';
import {
    basename,
    formatBytes,
    isDocxFile,
    isImageFile,
    isLegacyDocFile,
    isPdfFile,
} from './engines/shared/document.js';

/**
 * Alpine factory for PDF / Office tools (multi-file aware).
 */
export function documentIsland(config) {
    return {
        engineKey: config.engine,
        tool: config.tool,
        suffix: config.suffix,
        limits: config.limits || {},

        error: '',
        busy: false,
        status: '',
        files: [],
        options: {},
        result: null,
        downloadUrl: '',
        downloadFilename: '',
        meta: null,
        engine: null,
        generation: 0,
        sourcePages: null,

        get hasFiles() {
            return this.files.length > 0;
        },

        get isMerge() {
            return this.tool === 'merge-pdf';
        },

        get isSplit() {
            return this.tool === 'split-pdf';
        },

        get isRotate() {
            return this.tool === 'rotate-pdf';
        },

        get isImagesToPdf() {
            return this.tool === 'images-to-pdf';
        },

        get isWordToPdf() {
            return this.tool === 'word-to-pdf';
        },

        get isPdfToWord() {
            return this.tool === 'pdf-to-word';
        },

        get allowsMultiple() {
            return this.isMerge || this.isImagesToPdf;
        },

        get dropHint() {
            if (this.isImagesToPdf) {
                return 'Drop images, or browse';
            }

            if (this.isWordToPdf) {
                return 'Drop a DOCX file, or browse';
            }

            if (this.isMerge) {
                return 'Drop PDF files, or browse';
            }

            return 'Drop a PDF, or browse';
        },

        get acceptAttr() {
            if (this.isImagesToPdf) {
                return 'image/jpeg,image/png,image/webp,image/gif,image/avif,image/bmp,.jpg,.jpeg,.png,.webp,.gif';
            }

            if (this.isWordToPdf) {
                return '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            }

            return 'application/pdf,.pdf';
        },

        get formatHint() {
            if (this.isImagesToPdf) {
                return 'JPEG, PNG, WebP, or GIF. Stays on this device.';
            }

            if (this.isWordToPdf) {
                return 'DOCX only. Text-focused conversion. Stays on this device.';
            }

            if (this.isPdfToWord) {
                return 'PDF with a text layer. No OCR. Stays on this device.';
            }

            return 'PDF files. Stays on this device.';
        },

        get resultSizeLabel() {
            return this.result ? formatBytes(this.result.blob.size) : '';
        },

        async init() {
            this.options = {};
        },

        async ensureEngine() {
            if (! this.engine) {
                this.engine = await loadEngine(this.engineKey);
            }
        },

        onDrop(event) {
            event.preventDefault();
            const list = [...(event.dataTransfer?.files || [])];
            this.addFiles(list);
        },

        onBrowse(event) {
            const list = [...(event.target.files || [])];
            event.target.value = '';
            this.addFiles(list);
        },

        async addFiles(list) {
            this.error = '';

            if (! list.length) {
                return;
            }

            try {
                await this.ensureEngine();

                if (! this.allowsMultiple) {
                    this.files = [list[0]];
                } else {
                    this.files = [...this.files, ...list];
                }

                this.options = this.engine.defaultOptions(this.tool) || {};

                if (this.isSplit) {
                    await this.probeSplitPages();
                }

                await this.run();
            } catch (err) {
                this.error = err?.message || 'Something went wrong.';
            }
        },

        removeFile(index) {
            this.files = this.files.filter((_, i) => i !== index);
            this.error = '';

            if (! this.files.length) {
                this.startOver();

                return;
            }

            this.run();
        },

        async probeSplitPages() {
            const file = this.files[0];

            if (! file || ! isPdfFile(file)) {
                return;
            }

            const { PDFDocument } = await import('pdf-lib');
            const bytes = new Uint8Array(await file.arrayBuffer());
            const src = await PDFDocument.load(bytes, { ignoreEncryption: false });
            this.sourcePages = src.getPageCount();
            this.options = {
                fromPage: 1,
                toPage: this.sourcePages,
            };
        },

        async run() {
            if (! this.files.length) {
                return;
            }

            const generation = ++this.generation;
            this.busy = true;
            this.status = 'Working…';
            this.error = '';

            try {
                await this.ensureEngine();
                this.validateSelection();

                const result = await this.engine.process({
                    files: this.files,
                    tool: this.tool,
                    options: this.options,
                    limits: this.limits,
                });

                if (generation !== this.generation) {
                    return;
                }

                this.revokeDownload();
                this.result = result;
                this.meta = result.meta || null;
                this.downloadUrl = URL.createObjectURL(result.blob);
                const base = this.allowsMultiple
                    ? 'document'
                    : basename(this.files[0].name);
                this.downloadFilename = `${base}-${this.suffix}.${result.extension}`;
            } catch (err) {
                if (generation === this.generation) {
                    this.error = err?.message || 'Something went wrong.';
                    this.result = null;
                    this.revokeDownload();
                }
            } finally {
                if (generation === this.generation) {
                    this.busy = false;
                    this.status = '';
                }
            }
        },

        validateSelection() {
            for (const file of this.files) {
                if (this.isImagesToPdf && ! isImageFile(file)) {
                    throw new Error(`“${file.name}” is not a supported image.`);
                }

                if (this.isWordToPdf) {
                    if (isLegacyDocFile(file)) {
                        throw new Error('Old .doc files are not supported. Save as .docx and try again.');
                    }

                    if (! isDocxFile(file)) {
                        throw new Error(`“${file.name}” is not a DOCX file.`);
                    }
                }

                if ((this.isMerge || this.isSplit || this.isRotate || this.isPdfToWord) && ! isPdfFile(file)) {
                    throw new Error(`“${file.name}” is not a PDF.`);
                }
            }
        },

        setFromPage(value) {
            this.options = { ...this.options, fromPage: Number(value) || 1 };
            this.run();
        },

        setToPage(value) {
            this.options = { ...this.options, toPage: Number(value) || this.sourcePages };
            this.run();
        },

        setAngle(angle) {
            this.options = { ...this.options, angle: Number(angle) };
            this.run();
        },

        startOver() {
            this.generation += 1;
            this.error = '';
            this.busy = false;
            this.status = '';
            this.files = [];
            this.options = {};
            this.result = null;
            this.meta = null;
            this.sourcePages = null;
            this.revokeDownload();
        },

        revokeDownload() {
            if (this.downloadUrl) {
                URL.revokeObjectURL(this.downloadUrl);
            }

            this.downloadUrl = '';
            this.downloadFilename = '';
        },

        formatBytes,
    };
}
