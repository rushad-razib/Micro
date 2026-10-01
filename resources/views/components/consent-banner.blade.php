@if (config('site.consent_provider') === 'first_party')
    <div
        x-data="consentBanner"
        x-cloak
        x-show="open"
        x-transition.opacity
        class="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface shadow-[0_-4px_24px_rgba(0,0,0,0.45)]"
        role="dialog"
        aria-modal="false"
        aria-labelledby="consent-banner-title"
        data-consent-banner
    >
        <div class="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:px-6">
            <div>
                <p id="consent-banner-title" class="type-section">Cookies and ads</p>
                <p class="mt-1 type-label">
                    We use necessary storage for the contact form when you send a message.
                    Analytics and advertising stay off until you choose them.
                    See <a href="{{ url('/cookies') }}">cookies</a> and <a href="{{ url('/privacy') }}">privacy</a>.
                </p>
            </div>

            <div x-show="showDetails" class="space-y-2 rounded-card border border-line bg-canvas p-3" x-cloak>
                <label class="flex min-h-11 items-center gap-3 text-sm text-ink">
                    <input type="checkbox" class="size-4 rounded border-line" checked disabled>
                    <span>Necessary (always on)</span>
                </label>
                <label class="flex min-h-11 items-center gap-3 text-sm text-ink">
                    <input type="checkbox" class="size-4 rounded border-line" x-model="analytics">
                    <span>Analytics</span>
                </label>
                <label class="flex min-h-11 items-center gap-3 text-sm text-ink">
                    <input type="checkbox" class="size-4 rounded border-line" x-model="advertising">
                    <span>Advertising</span>
                </label>
            </div>

            <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <button
                    type="button"
                    class="inline-flex min-h-11 items-center justify-center rounded-control bg-accent px-4 text-on-accent"
                    @click="acceptAll()"
                >
                    Accept all
                </button>
                <button
                    type="button"
                    class="inline-flex min-h-11 items-center justify-center rounded-control border border-line bg-surface px-4 text-ink"
                    @click="rejectNonEssential()"
                >
                    Reject non-essential
                </button>
                <button
                    type="button"
                    class="inline-flex min-h-11 items-center justify-center rounded-control border border-line bg-surface px-4 text-ink"
                    x-show="!showDetails"
                    @click="showDetails = true"
                >
                    Customize
                </button>
                <button
                    type="button"
                    class="inline-flex min-h-11 items-center justify-center rounded-control border border-line bg-surface px-4 text-ink"
                    x-show="showDetails"
                    x-cloak
                    @click="saveChoices()"
                >
                    Save choices
                </button>
            </div>
        </div>
    </div>
@endif
