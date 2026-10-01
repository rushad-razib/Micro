@php
    $operator = config('site.operator_name');
    $email = config('site.contact_email');
    $adsConfigured = filled(config('site.adsense.client_id'));
@endphp

<x-layouts.article
    :document-title="'Privacy — '.$siteName"
    :meta-description="'How this site handles images, contact mail, logs, and advertising.'"
    :canonical="url('/privacy')"
>
    <h1 class="type-h1">Privacy</h1>
    <div class="mt-6 max-w-3xl space-y-4 text-ink">
        <p>Operated by {{ $operator }}. Contact: <a href="mailto:{{ $email }}">{{ $email }}</a>.</p>
        <p>Images you open are processed in your browser. We do not upload them, and we do not keep a copy. There is no image upload endpoint. Server access logs may contain IP addresses and request paths. They do not contain file contents. Host log retention follows the hosting provider’s rotation (target: about 30 days or fewer).</p>
        <p>The contact form collects name, email, and message so we can reply. Messages are emailed to the operator. We keep the mailbox copy only as long as needed to handle the thread. You can ask for access to or deletion of a contact message you sent.</p>
        <p>Consent choices for analytics and advertising are stored in your browser as described on the <a href="{{ url('/cookies') }}">cookies page</a>. Rejecting those categories does not stop the image tools.</p>
        @if ($adsConfigured)
            <p>Ads are served by Google AdSense when advertising is allowed by your consent choice (or by Google’s Privacy &amp; messaging where that is enabled). Google may use the signals permitted by that choice. We do not ask you to click ads.</p>
        @else
            <p>Advertising is not enabled on this deployment yet. When AdSense is turned on, ads will be served by Google only according to your consent choice (or Google Privacy &amp; messaging), and this page will reflect that. We will not ask you to click ads.</p>
        @endif
        <p>Visit counts may be viewed in our CDN dashboard (Cloudflare). That edge measurement is separate from on-site analytics cookies, which are not loaded today.</p>
        <p>This site is not directed at children. If we add a server-side tool later, we will update this page in the same release to say what is uploaded, how long it is kept, and who receives it.</p>
    </div>
</x-layouts.article>
