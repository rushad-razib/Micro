<x-layouts.app
    :document-title="$siteName.' — free image tools in your browser'"
    :meta-description="'Free image tools processed in this browser. We do not upload your files.'"
    :canonical="url('/')"
    :json-ld="[[
        '@context' => 'https://schema.org',
        '@type' => 'WebSite',
        'name' => $siteName,
        'url' => url('/'),
    ]]"
>
    <h1 class="type-h1">{{ $siteName }}</h1>
    <p class="mt-2 text-muted">Free image tools, processed in the browser.</p>
    <x-privacy-sentence class="mt-3" />

    @if ($tools->isNotEmpty())
        <section class="mt-8">
            <h2 class="type-section">{{ $cluster?->title ?? 'Image tools' }}</h2>
            <ul class="mt-4 grid gap-3 sm:grid-cols-2">
                @foreach ($tools as $tool)
                    <li class="rounded-card border border-line bg-surface p-4">
                        <a href="{{ url('/'.$tool->slug) }}" class="text-ink no-underline type-section">{{ $tool->title }}</a>
                        <p class="mt-1 type-label">{{ $tool->promise }}</p>
                    </li>
                @endforeach
            </ul>
        </section>
    @endif

    @if ($presets->isNotEmpty())
        <section class="mt-8">
            <h2 class="type-section">Social sizes</h2>
            <ul class="mt-4 grid gap-3 sm:grid-cols-2">
                @foreach ($presets as $tool)
                    <li class="rounded-card border border-line bg-surface p-4">
                        <a href="{{ url('/'.$tool->slug) }}" class="text-ink no-underline type-section">{{ $tool->title }}</a>
                        <p class="mt-1 type-label">{{ $tool->promise }}</p>
                    </li>
                @endforeach
            </ul>
        </section>
    @endif

    @if ($guides->isNotEmpty())
        <section class="mt-8">
            <h2 class="type-section">Guides</h2>
            <ul class="mt-3 space-y-2">
                @foreach ($guides as $guide)
                    <li><a href="{{ url('/guides/'.$guide->slug) }}">{{ $guide->title }}</a></li>
                @endforeach
            </ul>
        </section>
    @endif

    @if ($cluster && $cluster->isLive())
        <p class="mt-8"><a href="{{ url('/'.$cluster->slug) }}">All image tools</a></p>
    @endif
</x-layouts.app>
