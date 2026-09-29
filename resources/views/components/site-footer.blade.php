@props(['siteName', 'toolsByCluster', 'clusters', 'guides'])

<footer class="mt-12 border-t border-line bg-surface">
    <div class="mx-auto grid max-w-5xl gap-8 px-4 py-8 sm:grid-cols-3 sm:px-6">
        <div>
            <p class="type-section">{{ $siteName }}</p>
            <p class="mt-2 type-label">Free image tools. Processed in this browser.</p>
        </div>

        <div>
            <p class="type-label">Tools</p>
            @forelse ($toolsByCluster as $clusterId => $tools)
                <p class="mt-3 text-sm font-semibold text-ink">{{ $clusters[$clusterId]->title ?? $clusterId }}</p>
                <ul class="mt-1 space-y-1">
                    @foreach ($tools as $tool)
                        <li><a href="{{ url('/'.$tool->slug) }}">{{ $tool->title }}</a></li>
                    @endforeach
                </ul>
            @empty
                <p class="mt-2 type-label">Tools will appear here when they are live.</p>
            @endforelse

            @if ($guides->isNotEmpty())
                <p class="mt-4 type-label">Guides</p>
                <ul class="mt-1 space-y-1">
                    @foreach ($guides as $guide)
                        <li><a href="{{ url('/guides/'.$guide->slug) }}">{{ $guide->title }}</a></li>
                    @endforeach
                </ul>
            @endif
        </div>

        <div>
            <p class="type-label">Site</p>
            <ul class="mt-2 space-y-1">
                <li><a href="{{ url('/about') }}">About</a></li>
                <li><a href="{{ url('/contact') }}">Contact</a></li>
                <li><a href="{{ url('/privacy') }}">Privacy</a></li>
                <li><a href="{{ url('/cookies') }}">Cookies</a></li>
                <li><a href="{{ url('/terms') }}">Terms</a></li>
                <li><a href="{{ url('/editorial-policy') }}">Editorial policy</a></li>
            </ul>
        </div>
    </div>
</footer>
