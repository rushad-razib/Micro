<div
    x-data="dropZone"
    @paste.window="onPaste($event)"
    class="rounded-card border border-dashed border-line bg-stage px-4 py-10 text-center sm:px-8"
>
    <p class="text-ink">Drop an image, paste, or browse</p>
    <p class="mt-2 type-label">JPEG, PNG, WebP, or GIF. Stays on this device.</p>
    <label class="mt-6 inline-flex min-h-11 min-w-44 cursor-pointer items-center justify-center rounded-control bg-accent px-4 text-surface">
        <span>Browse files</span>
        <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/bmp"
            class="sr-only"
            @change="open()"
        >
    </label>
    <p x-show="error" x-text="error" class="mt-4 text-sm text-ink" x-cloak></p>
</div>
