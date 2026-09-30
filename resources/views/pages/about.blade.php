@php
    $operator = config('site.operator_name');
    $email = config('site.contact_email');
@endphp

<x-layouts.article
    :document-title="'About — '.$siteName"
    :meta-description="'What this site is and how image tools run in your browser.'"
    :canonical="url('/about')"
>
    <h1 class="type-h1">About</h1>
    <div class="mt-6 max-w-3xl space-y-4 text-ink">
        <p>This site is a set of small image tools. Each page does one job: compress, resize, convert, crop, rotate, or remove hidden metadata.</p>
        <p>Images you open are processed in your browser. We do not upload them, and we do not keep a copy.</p>
        <p>Operated by {{ $operator }}. Write to <a href="mailto:{{ $email }}">{{ $email }}</a>.</p>
        <p><a href="{{ url('/contact') }}">Contact</a></p>
    </div>
</x-layouts.article>
