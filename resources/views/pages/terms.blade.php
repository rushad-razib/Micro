@php
    $operator = config('site.operator_name');
@endphp

<x-layouts.article
    :document-title="'Terms — '.$siteName"
    :meta-description="'Terms of use for these image tools.'"
    :canonical="url('/terms')"
>
    <h1 class="type-h1">Terms</h1>
    <div class="mt-6 max-w-3xl space-y-4 text-ink">
        <p>The tools are free to use. There is no warranty that a conversion is lossless or that a result will match a third-party platform's current crop rules.</p>
        <p>You are responsible for the rights to the images you open. Do not use the site to process material you have no right to process, or for abusive or illegal content.</p>
        <p>Do not abuse the contact form or attempt to overload the site.</p>
        <p>Operated by {{ $operator }}. Tools run in your browser; we are not liable for local processing outcomes on your device.</p>
    </div>
</x-layouts.article>
