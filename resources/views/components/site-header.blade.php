@props(['siteName', 'clusters'])

<header class="border-b border-line bg-surface">
    <div class="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <a href="{{ url('/') }}" class="text-ink no-underline type-section">{{ $siteName }}</a>
        <nav aria-label="Primary" class="flex items-center gap-4">
            @foreach ($clusters as $cluster)
                <a href="{{ url('/'.$cluster->slug) }}" class="type-label no-underline text-ink hover:text-accent">{{ $cluster->title }}</a>
            @endforeach
        </nav>
    </div>
</header>
