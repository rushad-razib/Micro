@props(['tool'])

@php
    $mount = [
        'engine' => $tool->engine,
        'tool' => $tool->id,
        'suffix' => $tool->suffix,
        'limits' => $tool->limits,
    ];
@endphp

<div class="space-y-4" x-data="documentIsland(@js($mount))">
    <template x-if="! hasFiles">
        <div
            class="rounded-card border border-dashed border-line bg-stage px-4 py-10 text-center sm:px-8"
            @dragover.prevent
            @drop="onDrop($event)"
        >
            <p class="text-ink" x-text="dropHint"></p>
            <p class="mt-2 type-label" x-text="formatHint"></p>
            <label class="mt-6 inline-flex min-h-11 min-w-44 cursor-pointer items-center justify-center rounded-control bg-accent px-4 text-on-accent">
                <span>Browse files</span>
                <input
                    type="file"
                    class="sr-only"
                    :accept="acceptAttr"
                    :multiple="allowsMultiple"
                    @change="onBrowse($event)"
                >
            </label>
            <p x-show="error" x-text="error" class="mt-4 text-sm text-ink" x-cloak></p>
        </div>
    </template>

    <template x-if="hasFiles">
        <div class="space-y-4">
            <div class="rounded-card border border-line bg-stage p-4">
                <p class="type-label">Files</p>
                <ul class="mt-2 space-y-2">
                    <template x-for="(file, index) in files" :key="index + '-' + file.name">
                        <li class="flex items-center justify-between gap-3 text-sm text-ink">
                            <span class="min-w-0 truncate" x-text="file.name"></span>
                            <span class="shrink-0 type-label" x-text="formatBytes(file.size)"></span>
                            <button
                                type="button"
                                class="shrink-0 type-label text-accent"
                                @click="removeFile(index)"
                            >
                                Remove
                            </button>
                        </li>
                    </template>
                </ul>

                <template x-if="allowsMultiple">
                    <label class="mt-4 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-control border border-line bg-surface px-4 text-ink">
                        <span>Add more</span>
                        <input
                            type="file"
                            class="sr-only"
                            :accept="acceptAttr"
                            multiple
                            @change="onBrowse($event)"
                        >
                    </label>
                </template>

                <p x-show="busy" class="mt-3 type-label" x-cloak>
                    <span x-text="status || 'Working…'"></span>
                </p>
                <p x-show="error" x-text="error" class="mt-3 text-sm text-ink" x-cloak></p>
            </div>

            <div x-show="isSplit" class="grid gap-3 sm:grid-cols-2" x-cloak>
                <label>
                    <span class="type-label">From page</span>
                    <input
                        type="number"
                        min="1"
                        class="mt-1 min-h-11 w-full rounded-control border border-line bg-surface px-3"
                        :value="options.fromPage"
                        @change="setFromPage($event.target.value)"
                    >
                </label>
                <label>
                    <span class="type-label">To page</span>
                    <input
                        type="number"
                        min="1"
                        class="mt-1 min-h-11 w-full rounded-control border border-line bg-surface px-3"
                        :value="options.toPage"
                        @change="setToPage($event.target.value)"
                    >
                </label>
                <p class="type-label sm:col-span-2" x-show="sourcePages" x-cloak>
                    Source has <span x-text="sourcePages"></span> pages.
                </p>
            </div>

            <div x-show="isRotate" class="flex flex-wrap gap-2" x-cloak>
                <template x-for="angle in [90, 180, 270]" :key="angle">
                    <button
                        type="button"
                        class="min-h-11 rounded-control border border-line px-3"
                        :class="options.angle === angle ? 'bg-accent text-on-accent' : 'bg-surface'"
                        @click="setAngle(angle)"
                        x-text="angle + '°'"
                    ></button>
                </template>
            </div>

            <div x-show="result && downloadUrl" class="space-y-3" x-cloak>
                <p class="type-label">
                    Ready
                    <span x-show="resultSizeLabel"> · <span x-text="resultSizeLabel"></span></span>
                    <span x-show="meta?.pageCount"> · <span x-text="meta.pageCount"></span> pages</span>
                </p>
                <p x-show="meta?.note" class="type-label" x-text="meta.note" x-cloak></p>
                <div class="flex flex-col gap-2 sm:flex-row">
                    <a
                        class="inline-flex min-h-11 w-full items-center justify-center rounded-control bg-accent px-4 text-on-accent no-underline sm:flex-1"
                        :href="downloadUrl"
                        :download="downloadFilename"
                        x-text="'Download ' + downloadFilename"
                    ></a>
                    <button
                        type="button"
                        class="min-h-11 w-full rounded-control border border-line bg-surface px-4 sm:w-auto"
                        @click="startOver()"
                    >
                        Start over
                    </button>
                </div>
            </div>
        </div>
    </template>
</div>
