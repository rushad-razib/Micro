<x-layouts.article
    :document-title="$guide->seoTitle"
    :meta-description="$guide->seoDescription"
    :canonical="url('/guides/'.$guide->slug)"
    :json-ld="[
        [
            '@context' => 'https://schema.org',
            '@type' => 'Article',
            'headline' => $guide->title,
            'description' => $guide->seoDescription,
            'dateModified' => $guide->updated,
        ],
        [
            '@context' => 'https://schema.org',
            '@type' => 'BreadcrumbList',
            'itemListElement' => [
                ['@type' => 'ListItem', 'position' => 1, 'name' => 'Home', 'item' => url('/')],
                ['@type' => 'ListItem', 'position' => 2, 'name' => 'Guides', 'item' => url('/')],
                ['@type' => 'ListItem', 'position' => 3, 'name' => $guide->title, 'item' => url('/guides/'.$guide->slug)],
            ],
        ],
    ]"
>
    <nav class="type-label" aria-label="Breadcrumb">
        <a href="{{ url('/') }}">Home</a>
        <span aria-hidden="true"> / </span>
        <span>Guides</span>
        <span aria-hidden="true"> / </span>
        <span>{{ $guide->title }}</span>
    </nav>

    <h1 class="mt-3 type-h1">{{ $guide->title }}</h1>
    <article class="prose-site mt-6 max-w-3xl space-y-3">
        {!! $guide->bodyHtml !!}
    </article>
</x-layouts.article>
