@props(['siteName', 'clusters', 'toolsByCluster'])

<header class="site-chrome sticky top-0 z-40 border-b" x-data="{ open: null }" @keydown.escape.window="open = null">
    <div class="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <a href="{{ url('/') }}" class="text-lg font-semibold text-chrome-ink no-underline hover:text-white">{{ $siteName }}</a>
        <nav aria-label="Primary" class="flex items-center gap-1 sm:gap-2">
            @foreach ($clusters as $cluster)
                @php
                    $tools = collect($toolsByCluster[$cluster->id] ?? []);
                    $columns = $tools->values()->chunk(5);
                    $columnCount = max(1, $columns->count());
                    // ~14rem per column + padding; cap to viewport in CSS below
                    $panelWidthRem = $columnCount * 14;
                @endphp
                <div class="relative" @mouseenter="open = '{{ $cluster->id }}'" @mouseleave="open = null">
                    <button
                        type="button"
                        class="inline-flex min-h-11 items-center gap-1 rounded-control px-2 text-sm text-chrome-ink hover:bg-black/15 hover:text-white sm:px-3"
                        :aria-expanded="open === '{{ $cluster->id }}' ? 'true' : 'false'"
                        aria-haspopup="true"
                        @click="open = open === '{{ $cluster->id }}' ? null : '{{ $cluster->id }}'"
                    >
                        <span>{{ $cluster->title }}</span>
                        <span aria-hidden="true" class="text-xs">▾</span>
                    </button>

                    <div
                        x-cloak
                        x-show="open === '{{ $cluster->id }}'"
                        x-transition.opacity
                        class="site-chrome absolute right-0 top-full z-50 max-w-[calc(100vw-2rem)] rounded-card border p-3 shadow-lg"
                        style="width: min(calc(100vw - 2rem), {{ $panelWidthRem }}rem);"
                        @click.outside="open = null"
                    >
                        <div
                            class="grid gap-x-4"
                            style="grid-template-columns: repeat({{ $columnCount }}, minmax(12rem, 1fr));"
                        >
                            @foreach ($columns as $column)
                                <ul class="min-w-[12rem] space-y-1">
                                    @foreach ($column as $tool)
                                        <li>
                                            <a
                                                href="{{ url('/'.$tool->slug) }}"
                                                class="block whitespace-nowrap rounded-control px-3 py-2 text-sm text-chrome-ink no-underline hover:bg-black/20 hover:text-white"
                                            >
                                                {{ $tool->title }}
                                            </a>
                                        </li>
                                    @endforeach
                                </ul>
                            @endforeach
                        </div>
                        <p class="mt-2 border-t border-white/20 pt-2">
                            <a href="{{ url('/'.$cluster->slug) }}" class="site-chrome-muted text-sm no-underline hover:text-white">
                                All {{ strtolower($cluster->title) }}
                            </a>
                        </p>
                    </div>
                </div>
            @endforeach
        </nav>
    </div>
</header>
