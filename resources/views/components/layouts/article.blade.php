@props([
    'documentTitle',
    'metaDescription',
    'canonical',
    'jsonLd' => [],
])

<x-layouts.app
    :document-title="$documentTitle"
    :meta-description="$metaDescription"
    :canonical="$canonical"
    :json-ld="$jsonLd"
>
    <div class="max-w-3xl">
        {{ $slot }}
    </div>
</x-layouts.app>
