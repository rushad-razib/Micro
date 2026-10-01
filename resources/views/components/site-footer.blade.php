@props(['siteName', 'toolsByCluster', 'clusters', 'guides'])

<footer class="site-chrome mt-12 border-t">
    <div class="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        <div class="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div class="max-w-xs">
                <p class="text-lg font-semibold text-chrome-ink">{{ $siteName }}</p>
                <p class="site-chrome-muted mt-2 text-sm">Free image and PDF tools. Processed in this browser.</p>
            </div>

            <div>
                <p class="site-chrome-muted text-sm">Site</p>
                <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 sm:max-w-md">
                    <li><a href="{{ url('/about') }}" class="text-sm text-chrome-ink no-underline hover:text-white hover:underline">About</a></li>
                    <li><a href="{{ url('/contact') }}" class="text-sm text-chrome-ink no-underline hover:text-white hover:underline">Contact</a></li>
                    <li><a href="{{ url('/privacy') }}" class="text-sm text-chrome-ink no-underline hover:text-white hover:underline">Privacy</a></li>
                    <li><a href="{{ url('/cookies') }}" class="text-sm text-chrome-ink no-underline hover:text-white hover:underline">Cookies</a></li>
                    @if (config('site.consent_provider') === 'first_party')
                        <li>
                            <button
                                type="button"
                                class="cursor-pointer bg-transparent p-0 text-left text-sm text-chrome-ink underline-offset-2 hover:text-white hover:underline"
                                data-consent-open
                                onclick="window.dispatchEvent(new Event('site:consent-open'))"
                            >
                                Cookie preferences
                            </button>
                        </li>
                    @endif
                    <li><a href="{{ url('/terms') }}" class="text-sm text-chrome-ink no-underline hover:text-white hover:underline">Terms</a></li>
                    <li><a href="{{ url('/editorial-policy') }}" class="text-sm text-chrome-ink no-underline hover:text-white hover:underline">Editorial policy</a></li>
                </ul>
            </div>
        </div>

        @php
            $clusterOrder = ['images' => 0, 'documents' => 1];
            $orderedToolGroups = collect($toolsByCluster)
                ->sortBy(fn ($tools, $clusterId) => $clusterOrder[$clusterId] ?? 100);
        @endphp

        @if ($orderedToolGroups->isNotEmpty())
            <div class="grid gap-8 border-t border-white/15 pt-8 md:grid-cols-2">
                @foreach ($orderedToolGroups as $clusterId => $tools)
                    @php
                        $toolList = collect($tools)->values();
                        $columns = $toolList->chunk(5);
                        $columnCount = max(1, $columns->count());
                        $cluster = $clusters[$clusterId] ?? null;
                    @endphp
                    <div class="min-w-0">
                        <p class="text-sm font-semibold text-chrome-ink">
                            @if ($cluster)
                                <a href="{{ url('/'.$cluster->slug) }}" class="text-chrome-ink no-underline hover:text-white hover:underline">
                                    {{ $cluster->title }}
                                </a>
                            @else
                                {{ $clusterId }}
                            @endif
                        </p>
                        <div
                            class="mt-3 grid gap-x-6 gap-y-1"
                            style="grid-template-columns: repeat({{ $columnCount }}, minmax(0, 1fr));"
                        >
                            @foreach ($columns as $column)
                                <ul class="min-w-0 space-y-1">
                                    @foreach ($column as $tool)
                                        <li>
                                            <a
                                                href="{{ url('/'.$tool->slug) }}"
                                                class="block truncate text-sm text-chrome-ink no-underline hover:text-white hover:underline"
                                                title="{{ $tool->title }}"
                                            >
                                                {{ $tool->title }}
                                            </a>
                                        </li>
                                    @endforeach
                                </ul>
                            @endforeach
                        </div>
                    </div>
                @endforeach
            </div>
        @endif

        @if ($guides->isNotEmpty())
            <div class="border-t border-white/15 pt-6">
                <p class="site-chrome-muted text-sm">Guides</p>
                <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                    @foreach ($guides as $guide)
                        <li>
                            <a href="{{ url('/guides/'.$guide->slug) }}" class="text-sm text-chrome-ink no-underline hover:text-white hover:underline">
                                {{ $guide->title }}
                            </a>
                        </li>
                    @endforeach
                </ul>
            </div>
        @endif
    </div>
</footer>
