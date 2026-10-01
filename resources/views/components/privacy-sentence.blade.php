@props([
    'kind' => 'image',
])

@php
    $message = $kind === 'document'
        ? 'Files you open are processed in your browser. We do not upload them, and we do not keep a copy.'
        : 'Images you open are processed in your browser. We do not upload them, and we do not keep a copy.';
@endphp

<p {{ $attributes->class(['type-label']) }}>{{ $message }}</p>
