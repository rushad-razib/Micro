<div class="grid gap-4" x-data="roadMeasureIsland()">
    <p>
        Hold still for about 30 seconds at each end. A distance is shown only when the fixes agree tightly enough for an error of 5 m or less. A jumping fix will not lock. A steady fix beside a building can still be shifted.
    </p>

    <p class="type-label" aria-live="polite" x-text="statusLine"></p>

    <button
        type="button"
        class="inline-flex min-h-14 w-full items-center justify-center rounded-control bg-accent px-4 font-semibold text-on-accent disabled:opacity-40"
        x-show="phase === 'idle' || phase === 'marking-start' || phase === 'unsupported' || phase === 'denied'"
        :disabled="!canMarkStart"
        @click="markStart"
    >
        Mark start
    </button>

    <button
        type="button"
        class="inline-flex min-h-14 w-full items-center justify-center rounded-control bg-accent px-4 font-semibold text-on-accent disabled:opacity-40"
        x-show="phase === 'walking'"
        x-cloak
        :disabled="!canMarkEnd"
        @click="markEnd"
    >
        Mark end
    </button>

    <p class="type-label" x-show="phase === 'walking'" x-cloak x-text="`Kept points: ${keptPointCount}. Keep this page open and the screen on while you walk.`"></p>

    <canvas
        x-ref="plot"
        x-show="start"
        x-cloak
        class="h-48 w-full rounded-control border border-line"
        aria-label="Walked path, north up"
    ></canvas>

    <template x-if="result && result.straightMeters !== null">
        <div aria-live="polite">
            <p class="type-section">
                Straight line: <span x-text="result.straightMeters"></span> m ± <span x-text="result.uncertaintyMeters"></span> m
            </p>
            <p class="type-label">How tightly the phone repeated each mark, not a survey tolerance. A steady fix beside a building can still be shifted.</p>
            <p class="mt-3 type-section" x-show="result.pathMeters !== null">
                Walked path: <span x-text="result.pathMeters"></span> m
            </p>
            <p class="mt-3 type-section" x-show="result.pathMeters === null">Walked path was not recorded.</p>
            <p class="type-label" x-text="`Walked length can still be long if the fix wanders, or short if a bend was sampled sparsely. Worst accuracy on the track: ${Math.round(result.worstAccuracy)} m. Points: ${result.pointCount}.`"></p>
        </div>
    </template>

    <template x-if="result && result.straightMeters === null">
        <div aria-live="polite">
            <p class="type-section">No distance.</p>
            <p class="type-label">
                The fixes on these two marks combine to <span x-text="result.uncertaintyMeters"></span> m. A distance is shown only at 5 m or less.
            </p>
        </div>
    </template>

    <div class="grid gap-3" x-show="phase === 'done'" x-cloak>
        <button
            type="button"
            class="inline-flex min-h-11 w-full items-center justify-center rounded-control border border-line px-4"
            @click="downloadRecord"
        >
            Download record
        </button>
        <button
            type="button"
            class="inline-flex min-h-11 w-full items-center justify-center rounded-control border border-line px-4"
            @click="measureAgain"
        >
            Measure again
        </button>
    </div>
</div>
