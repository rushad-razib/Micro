@php
    $canonical = url('/'.$tool->slug);
    $jsonLd = [
        [
            '@context' => 'https://schema.org',
            '@type' => 'WebApplication',
            'name' => $tool->title,
            'url' => $canonical,
            'description' => $tool->seoDescription,
            'applicationCategory' => 'MultimediaApplication',
            'offers' => ['@type' => 'Offer', 'price' => '0', 'priceCurrency' => 'USD'],
        ],
        [
            '@context' => 'https://schema.org',
            '@type' => 'BreadcrumbList',
            'itemListElement' => array_values(array_filter([
                ['@type' => 'ListItem', 'position' => 1, 'name' => 'Home', 'item' => url('/')],
                $cluster ? ['@type' => 'ListItem', 'position' => 2, 'name' => $cluster->title, 'item' => url('/'.$cluster->slug)] : null,
                ['@type' => 'ListItem', 'position' => $cluster ? 3 : 2, 'name' => $tool->title, 'item' => $canonical],
            ])),
        ],
    ];

    if ($tool->faq !== []) {
        $jsonLd[] = [
            '@context' => 'https://schema.org',
            '@type' => 'FAQPage',
            'mainEntity' => array_map(fn ($item) => [
                '@type' => 'Question',
                'name' => $item->question,
                'acceptedAnswer' => ['@type' => 'Answer', 'text' => $item->answer],
            ], $tool->faq),
        ];
    }

    $defaultFrame = $tool->defaultFrame();
@endphp

<x-layouts.app
    :document-title="$tool->seoTitle"
    :meta-description="$tool->seoDescription"
    :canonical="$canonical"
    :json-ld="$jsonLd"
>
    <nav class="type-label" aria-label="Breadcrumb">
        <a href="{{ url('/') }}">Home</a>
        @if ($cluster)
            <span aria-hidden="true"> / </span>
            <a href="{{ url('/'.$cluster->slug) }}">{{ $cluster->title }}</a>
        @endif
        <span aria-hidden="true"> / </span>
        <span>{{ $tool->title }}</span>
    </nav>

    <div class="mt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-8">
        <div>
            <h1 class="type-h1">{{ $tool->title }}</h1>
            <p class="mt-2 text-muted">{{ $tool->promise }}</p>

            <div
                class="mt-6 rounded-card border border-line bg-surface p-4 sm:p-6"
                data-engine="{{ $tool->engine }}"
                data-tool="{{ $tool->id }}"
                data-suffix="{{ $tool->suffix }}"
                data-preset="{{ $defaultFrame?->key }}"
                data-limits="{{ json_encode($tool->limits) }}"
            >
                @if ($tool->cluster === 'documents')
                    <x-document-island :tool="$tool" />
                @else
                    <x-tool-island :tool="$tool" :default-frame="$defaultFrame" />
                @endif
                <div class="mt-4">
                    <x-privacy-sentence :kind="$tool->cluster === 'documents' ? 'document' : 'image'" />
                </div>
            </div>
        </div>

        <x-ad-slot class="mt-6 hidden lg:mt-0 lg:block" />
    </div>

    <x-ad-slot class="mt-6 lg:hidden" />

    <article class="prose-site mt-10 max-w-3xl space-y-3">
        {!! $tool->guideHtml !!}
    </article>

    @if ($tool->faq !== [])
        <section class="mt-10 max-w-3xl">
            <h2 class="type-section">Questions</h2>
            <dl class="mt-4 space-y-4">
                @foreach ($tool->faq as $item)
                    <div>
                        <dt class="font-semibold text-ink">{{ $item->question }}</dt>
                        <dd class="mt-1 text-muted">{{ $item->answer }}</dd>
                    </div>
                @endforeach
            </dl>
        </section>
    @endif

    @if ($related !== [])
        <nav class="mt-10 type-label" aria-label="Related">
            <p class="mb-2">Related</p>
            <ul class="space-y-1">
                @foreach ($related as $link)
                    <li><a href="{{ url($link->href) }}">{{ $link->title }}</a></li>
                @endforeach
            </ul>
        </nav>
    @endif
</x-layouts.app>
