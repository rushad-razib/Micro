<div class="grid gap-4" x-data="calculatorIsland()" data-engine="land-calculator">
    <label class="block">
        <span class="type-label">Amount</span>
        <input
            type="text"
            inputmode="decimal"
            autocomplete="off"
            class="mt-1 min-h-11 w-full rounded-control border border-line bg-surface px-3"
            x-model="amount"
            placeholder="15"
        >
    </label>

    <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-end">
        <label class="block">
            <span class="type-label">From</span>
            <select class="mt-1 min-h-11 w-full rounded-control border border-line bg-surface px-3" x-model="from">
                <option value="shotangsho">Shotangsho (শতাংশ)</option>
                <option value="katha">Katha (কাঠা)</option>
                <option value="bigha">Bigha (বিঘা)</option>
                <option value="acre">Acre</option>
                <option value="hectare">Hectare</option>
                <option value="square-foot">Square foot</option>
                <option value="square-meter">Square meter</option>
                <option value="square-yard">Square yard</option>
                <option value="chhatak">Chhatak (ছটাক)</option>
                <option value="ojutangsho">Ojutangsho (অযুতাংশ)</option>
            </select>
        </label>

        <button
            type="button"
            class="inline-flex min-h-11 items-center justify-center rounded-control border border-line px-4"
            @click="swap"
        >
            Swap
        </button>

        <label class="block">
            <span class="type-label">To</span>
            <select class="mt-1 min-h-11 w-full rounded-control border border-line bg-surface px-3" x-model="to">
                <option value="shotangsho">Shotangsho (শতাংশ)</option>
                <option value="katha">Katha (কাঠা)</option>
                <option value="bigha">Bigha (বিঘা)</option>
                <option value="acre">Acre</option>
                <option value="hectare">Hectare</option>
                <option value="square-foot">Square foot</option>
                <option value="square-meter">Square meter</option>
                <option value="square-yard">Square yard</option>
                <option value="chhatak">Chhatak (ছটাক)</option>
                <option value="ojutangsho">Ojutangsho (অযুতাংশ)</option>
            </select>
        </label>
    </div>

    <p class="type-section" aria-live="polite">
        <span x-show="result !== null" x-text="result"></span>
        <span class="type-label" x-show="result === null">Enter an amount to see the result.</span>
    </p>
</div>
