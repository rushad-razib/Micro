<x-layouts.app
    :document-title="$cluster->title.' — '.$siteName"
    :meta-description="$cluster->promise"
    :canonical="url('/'.$cluster->slug)"
    :json-ld="[[
        '@context' => 'https://schema.org',
        '@type' => 'BreadcrumbList',
        'itemListElement' => [
            ['@type' => 'ListItem', 'position' => 1, 'name' => 'Home', 'item' => url('/')],
            ['@type' => 'ListItem', 'position' => 2, 'name' => $cluster->title, 'item' => url('/'.$cluster->slug)],
        ],
    ]]"
>
    <nav class="type-label" aria-label="Breadcrumb">
        <a href="{{ url('/') }}">Home</a>
        <span aria-hidden="true"> / </span>
        <span>{{ $cluster->title }}</span>
    </nav>

    <h1 class="mt-3 type-h1">{{ $cluster->title }}</h1>
    <p class="mt-2 text-muted">{{ $cluster->promise }}</p>
    <x-privacy-sentence class="mt-3" />

    <ul class="mt-8 grid gap-3 sm:grid-cols-2">
        @foreach ($tools->concat($presets) as $tool)
            <li class="rounded-card border border-line bg-surface p-4">
                <a href="{{ url('/'.$tool->slug) }}" class="text-ink no-underline type-section">{{ $tool->title }}</a>
                <p class="mt-1 type-label">{{ $tool->promise }}</p>
            </li>
        @endforeach
    </ul>

    @if ($guides->isNotEmpty())
        <section class="mt-10">
            <h2 class="type-section">Guides</h2>
            <ul class="mt-3 space-y-2">
                @foreach ($guides as $guide)
                    <li><a href="{{ url('/guides/'.$guide->slug) }}">{{ $guide->title }}</a></li>
                @endforeach
            </ul>
        </section>
    @endif
</x-layouts.app>
