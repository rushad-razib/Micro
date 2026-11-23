@props([
    'kind' => 'image',
])

@php
    $message = match ($kind) {
        'document' => 'Files you open are processed in your browser. We do not upload them, and we do not keep a copy.',
        'calculator' => 'The calculation runs in this browser. Nothing you type is uploaded.',
        default => 'Images you open are processed in your browser. We do not upload them, and we do not keep a copy.',
    };
@endphp

<p {{ $attributes->class(['type-label']) }}>{{ $message }}</p>
