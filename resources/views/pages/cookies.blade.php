@php
    $storageKey = config('site.consent_storage_key');
    $consentProvider = config('site.consent_provider');
@endphp

<x-layouts.article
    :document-title="'Cookies — '.$siteName"
    :meta-description="'Cookie categories used on this site and how to change your choices.'"
    :canonical="url('/cookies')"
>
    <h1 class="type-h1">Cookies</h1>
    <div class="mt-6 max-w-3xl space-y-4 text-ink">
        <p>The image tools do not need cookies. Image bytes never leave your browser for the launch tools.</p>

        <h2 class="type-section">Categories</h2>
        <ul class="list-disc space-y-2 ps-5">
            <li>
                <strong>Necessary.</strong>
                A session cookie may be set when you submit the contact form so we can show a success or error message.
                That cookie is required for the form to work.
            </li>
            <li>
                <strong>Analytics.</strong>
                No on-site analytics product is loaded today.
                Aggregate visit counts may come from our CDN (Cloudflare) at the network edge; that is not an on-site analytics cookie.
                If we add an analytics script later, it stays off until you allow Analytics.
            </li>
            <li>
                <strong>Advertising.</strong>
                Google AdSense tags load only after approval, only when configured on the server, and only when advertising is allowed by your choice (or by Google Privacy &amp; messaging when that provider is enabled).
            </li>
        </ul>

        <h2 class="type-section">Consent record</h2>
        <p>
            When the first-party banner is active, your choice is stored in this browser under the key
            <code>{{ $storageKey }}</code> (localStorage). It records whether Analytics and Advertising are allowed, and when you last saved.
            We use Google Consent Mode signals (<code>ad_storage</code>, <code>analytics_storage</code>, <code>ad_user_data</code>, <code>ad_personalization</code>) so tags do not use those storages until granted.
        </p>

        @if ($consentProvider === 'first_party')
            <p>
                <button
                    type="button"
                    class="inline-flex min-h-11 items-center justify-center rounded-control border border-line bg-surface px-4 text-ink"
                    data-consent-open
                    onclick="window.dispatchEvent(new Event('site:consent-open'))"
                >
                    Change cookie choices
                </button>
            </p>
        @else
            <p>Cookie and ad choices are managed by Google Privacy &amp; messaging on this site.</p>
        @endif

        <p>Rejecting analytics and advertising does not block the tools or downloads. See the <a href="{{ url('/privacy') }}">privacy page</a>.</p>
    </div>
</x-layouts.article>
