@props([
    'tool',
    'defaultFrame' => null,
])

@php
    $mount = [
        'engine' => $tool->engine,
        'tool' => $tool->id,
        'suffix' => $tool->suffix,
        'limits' => $tool->limits,
        'preset' => $defaultFrame?->key,
        'presets' => array_map(fn ($frame) => $frame->toArray(), $tool->preset),
        'parentResizeHref' => '/resize-image',
    ];
@endphp

<div
    class="space-y-4"
    x-data="toolIsland(@js($mount))"
    @paste.window="onPaste($event)"
>
    <template x-if="! hasFile">
        <div
            class="rounded-card border border-dashed border-line bg-stage px-4 py-10 text-center sm:px-8"
            @dragover.prevent
            @drop="onDrop($event)"
        >
            <p class="text-ink">Drop an image, paste, or browse</p>
            <p class="mt-2 type-label">JPEG, PNG, WebP, or GIF. Stays on this device.</p>
            <label class="mt-6 inline-flex min-h-11 min-w-44 cursor-pointer items-center justify-center rounded-control bg-accent px-4 text-on-accent">
                <span>Browse files</span>
                <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/bmp"
                    class="sr-only"
                    @change="onBrowse($event)"
                >
            </label>
            <p x-show="error" x-text="error" class="mt-4 text-sm text-ink" x-cloak></p>
        </div>
    </template>

    <template x-if="hasFile">
        <div class="space-y-4">
            <div class="rounded-card border border-line bg-stage p-3 sm:p-4">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <div class="min-w-0 flex-1">
                        <div
                            x-show="isCrop && sourcePreviewUrl"
                            data-crop-stage
                            class="relative mx-auto inline-block max-w-full touch-none select-none"
                            @pointermove.window="onCropMove($event)"
                            @pointerup.window="endCropDrag()"
                            @pointercancel.window="endCropDrag()"
                            x-cloak
                        >
                            <img :src="sourcePreviewUrl" alt="Crop source" class="max-h-80 w-auto max-w-full object-contain">
                            <div
                                class="absolute border-2 border-accent bg-accent/10"
                                :style="cropBoxStyle"
                                @pointerdown="startCropDrag($event, 'move')"
                            >
                                <button type="button" aria-label="Resize from top left" class="absolute -left-2 -top-2 h-5 w-5 rounded-full border-2 border-accent bg-surface" @pointerdown.stop="startCropDrag($event, 'nw')"></button>
                                <button type="button" aria-label="Resize from bottom right" class="absolute -bottom-2 -right-2 h-5 w-5 rounded-full border-2 border-accent bg-surface" @pointerdown.stop="startCropDrag($event, 'se')"></button>
                            </div>
                        </div>
                        <img
                            x-show="! isCrop && previewUrl"
                            :src="previewUrl"
                            alt="Result preview"
                            class="mx-auto max-h-80 w-auto max-w-full object-contain"
                        >
                        <p x-show="gifNote" x-text="gifNote" class="mt-2 type-label" x-cloak></p>
                        <p x-show="status" x-text="status" class="mt-2 type-label" x-cloak></p>
                        <p x-show="error" x-text="error" class="mt-2 text-sm text-ink" x-cloak></p>
                    </div>
                    <div class="type-label shrink-0 space-y-1 sm:text-right">
                        <p x-show="dimensionLabel">
                            <span x-text="dimensionLabel"></span>
                            <template x-if="result?.frameLabel">
                                <span> (<span x-text="result.frameLabel"></span>)</span>
                            </template>
                        </p>
                        <p>
                            <span x-text="sourceSizeLabel"></span>
                            <span x-show="resultSizeLabel"> → <span x-text="resultSizeLabel"></span></span>
                        </p>
                    </div>
                </div>
            </div>

            {{-- Resize options --}}
            <div x-show="isResize" class="grid gap-3 sm:grid-cols-2" x-cloak>
                <label class="block">
                    <span class="type-label">Width</span>
                    <input type="number" inputmode="numeric" class="mt-1 min-h-11 w-full rounded-control border border-line bg-surface px-3" :value="options.width" @change="setWidth($event.target.value)">
                </label>
                <label class="block">
                    <span class="type-label">Height</span>
                    <input type="number" inputmode="numeric" class="mt-1 min-h-11 w-full rounded-control border border-line bg-surface px-3" :value="options.height" @change="setHeight($event.target.value)">
                </label>
                <label class="block">
                    <span class="type-label">Percent</span>
                    <input type="number" inputmode="numeric" class="mt-1 min-h-11 w-full rounded-control border border-line bg-surface px-3" :value="options.percent" @change="setPercent($event.target.value)">
                </label>
                <label class="block">
                    <span class="type-label">Max edge</span>
                    <input type="number" inputmode="numeric" class="mt-1 min-h-11 w-full rounded-control border border-line bg-surface px-3" :value="options.maxEdge" @change="setMaxEdge($event.target.value)">
                </label>
                <label class="flex min-h-11 items-center gap-2 sm:col-span-2">
                    <input type="checkbox" :checked="options.lockAspect" @change="toggleLock()">
                    <span class="type-label">Lock aspect ratio</span>
                </label>
                <label class="block sm:col-span-2">
                    <span class="type-label">Output format</span>
                    <select class="mt-1 min-h-11 w-full rounded-control border border-line bg-surface px-3" :value="options.outputMime" @change="setOutputMime($event.target.value)">
                        <option value="image/jpeg">JPEG</option>
                        <option value="image/png">PNG</option>
                        <option value="image/webp">WebP</option>
                    </select>
                </label>
                <div class="flex flex-wrap gap-2 sm:col-span-2">
                    <a href="/resize-image-for-instagram" class="type-label rounded-control border border-line px-3 py-2 no-underline">Instagram</a>
                    <a href="/youtube-thumbnail-resizer" class="type-label rounded-control border border-line px-3 py-2 no-underline">YouTube</a>
                    <a href="/resize-image-for-facebook" class="type-label rounded-control border border-line px-3 py-2 no-underline">Facebook</a>
                    <a href="/resize-image-for-linkedin" class="type-label rounded-control border border-line px-3 py-2 no-underline">LinkedIn</a>
                </div>
            </div>

            {{-- Convert options --}}
            <div x-show="isConvert" class="grid gap-3 sm:grid-cols-2" x-cloak>
                <label class="block sm:col-span-2">
                    <span class="type-label">Target format</span>
                    <select class="mt-1 min-h-11 w-full rounded-control border border-line bg-surface px-3" :value="options.outputMime" @change="setOutputMime($event.target.value)">
                        <option value="image/jpeg">JPEG</option>
                        <option value="image/png">PNG</option>
                        <option value="image/webp">WebP</option>
                        <option value="image/avif" x-show="avifOk">AVIF</option>
                    </select>
                </label>
                <p x-show="! avifOk" class="type-label sm:col-span-2" x-cloak>This browser cannot create AVIF files. WebP and JPEG are available.</p>
                <label class="block sm:col-span-2" x-show="options.outputMime !== 'image/png'" x-cloak>
                    <span class="type-label">Quality <span x-text="Math.round((options.quality || 0.8) * 100)"></span></span>
                    <input type="range" min="40" max="95" class="mt-2 w-full" :value="Math.round((options.quality || 0.8) * 100)" @input="setQuality($event.target.value)">
                </label>
            </div>

            {{-- Crop options --}}
            <div x-show="isCrop" class="space-y-3" x-cloak>
                <div class="flex flex-wrap gap-2">
                    <template x-for="ratio in ['free', '1:1', '4:5', '16:9']" :key="ratio">
                        <button type="button" class="min-h-11 rounded-control border border-line px-3" :class="options.ratio === ratio ? 'bg-accent text-on-accent' : 'bg-surface'" @click="setCropRatio(ratio)" x-text="ratio === 'free' ? 'Free' : ratio"></button>
                    </template>
                </div>
                <p class="type-label" x-show="options.rect">
                    Crop <span x-text="Math.round(options.rect?.width || 0)"></span> × <span x-text="Math.round(options.rect?.height || 0)"></span>
                </p>
                <label class="block">
                    <span class="type-label">Output format</span>
                    <select class="mt-1 min-h-11 w-full rounded-control border border-line bg-surface px-3" :value="options.outputMime" @change="setOutputMime($event.target.value)">
                        <option value="image/jpeg">JPEG</option>
                        <option value="image/png">PNG</option>
                        <option value="image/webp">WebP</option>
                    </select>
                </label>
            </div>

            {{-- Rotate options --}}
            <div x-show="isRotate" class="flex flex-wrap gap-2" x-cloak>
                <button type="button" class="min-h-11 rounded-control border border-line bg-surface px-4" @click="rotate('left')">Rotate left</button>
                <button type="button" class="min-h-11 rounded-control border border-line bg-surface px-4" @click="rotate('right')">Rotate right</button>
                <button type="button" class="min-h-11 rounded-control border border-line bg-surface px-4" @click="flip('h')">Flip horizontal</button>
                <button type="button" class="min-h-11 rounded-control border border-line bg-surface px-4" @click="flip('v')">Flip vertical</button>
            </div>

            {{-- Preset options --}}
            <div x-show="isPreset" class="space-y-3" x-cloak>
                <div class="flex flex-wrap gap-2" x-show="presets.length > 1">
                    <template x-for="frame in presets" :key="frame.key">
                        <button type="button" class="min-h-11 rounded-control border border-line px-3" :class="options.frameKey === frame.key ? 'bg-accent text-on-accent' : 'bg-surface'" @click="setPresetFrame(frame.key)" x-text="frame.label"></button>
                    </template>
                </div>
                <div class="flex flex-wrap gap-2">
                    <button type="button" class="min-h-11 rounded-control border border-line px-3" :class="options.mode === 'cover' ? 'bg-accent text-on-accent' : 'bg-surface'" @click="setPresetMode('cover')">Fill frame</button>
                    <button type="button" class="min-h-11 rounded-control border border-line px-3" :class="options.mode === 'contain' ? 'bg-accent text-on-accent' : 'bg-surface'" @click="setPresetMode('contain')">Fit inside</button>
                </div>
                <p class="type-label">Need arbitrary dimensions? Use <a :href="parentResizeHref">resize image</a>.</p>
            </div>

            {{-- Compress options --}}
            <div x-show="isCompress" class="space-y-3" x-cloak>
                <p x-show="options.lossless" class="type-label">PNG compression is lossless and may already be small.</p>
                <label class="block" x-show="! options.lossless" x-cloak>
                    <span class="type-label">Quality <span x-text="options.quality"></span></span>
                    <input type="range" min="40" max="95" class="mt-2 w-full" :value="options.quality" @input="setQuality($event.target.value)">
                </label>
            </div>

            {{-- Strip metadata report --}}
            <div x-show="isStrip && meta" class="space-y-2 rounded-card border border-line bg-surface p-3" x-cloak>
                <p class="type-label" x-show="meta?.message" x-text="meta.message"></p>
                <ul class="space-y-1" x-show="meta?.items?.length">
                    <template x-for="item in (meta?.items || [])" :key="item.key">
                        <li class="type-label">
                            <span class="font-semibold text-ink" x-text="item.label"></span>:
                            <span x-text="item.value"></span>
                        </li>
                    </template>
                </ul>
                <p class="type-label" x-show="meta?.sizeNote" x-text="meta.sizeNote"></p>
                <p class="type-label">Read more in <a href="/guides/what-exif-data-reveals">what EXIF data reveals</a>.</p>
            </div>

            <div class="flex flex-col gap-2 sm:flex-row">
                <a
                    x-show="downloadUrl"
                    :href="downloadUrl"
                    :download="downloadFilename"
                    class="inline-flex min-h-11 w-full items-center justify-center rounded-control bg-accent px-4 text-on-accent no-underline sm:flex-1"
                >
                    Download <span class="ml-1 truncate" x-text="downloadFilename"></span>
                </a>
                <button type="button" class="min-h-11 w-full rounded-control border border-line bg-surface px-4 sm:w-auto" @click="startOver()">Start over</button>
            </div>
        </div>
    </template>
</div>
