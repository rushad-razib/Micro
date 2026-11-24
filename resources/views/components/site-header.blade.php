@props(['siteName', 'clusters', 'toolsByCluster'])

<header
    class="site-chrome sticky top-0 z-40 border-b"
    x-data="{
        open: null,
        canHover: window.matchMedia('(hover: hover) and (pointer: fine)').matches,
        toggle(id) { this.open = this.open === id ? null : id },
        hover(id) { if (this.canHover) this.open = id },
        leave() { if (this.canHover) this.open = null }
    }"
    @keydown.escape.window="open = null"
    @click.outside="open = null"
>
    <div class="relative mx-auto max-w-5xl px-4 py-3 sm:px-6" @mouseleave="leave()">
        <div class="flex flex-col gap-1 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
            <a href="{{ url('/') }}" class="min-w-0 truncate text-lg font-semibold text-chrome-ink no-underline hover:text-white">{{ $siteName }}</a>
            <nav aria-label="Primary" class="flex flex-wrap items-center gap-1 sm:gap-2">
                @foreach ($clusters as $cluster)
                    <button
                        type="button"
                        class="inline-flex min-h-11 items-center gap-1 whitespace-nowrap rounded-control px-2 text-sm text-chrome-ink hover:bg-black/15 hover:text-white sm:px-3"
                        :aria-expanded="open === '{{ $cluster->id }}' ? 'true' : 'false'"
                        aria-haspopup="true"
                        @mouseenter="hover('{{ $cluster->id }}')"
                        @click="toggle('{{ $cluster->id }}')"
                    >
                        <span>{{ $cluster->title }}</span>
                        <span aria-hidden="true" class="text-xs">▾</span>
                    </button>
                @endforeach
            </nav>
        </div>

        @foreach ($clusters as $cluster)
            @php
                $tools = collect($toolsByCluster[$cluster->id] ?? [])->values();
                $columns = $tools->chunk(5);
                $columnCount = max(1, $columns->count());
                $panelWidthRem = $columnCount * 14;
            @endphp
            <div
                x-cloak
                x-show="open === '{{ $cluster->id }}'"
                x-transition.opacity
                class="cluster-menu-panel site-chrome absolute left-0 right-0 top-full z-50 max-h-[min(70vh,calc(100dvh-8rem))] overflow-y-auto border-b p-3 shadow-lg lg:left-auto lg:right-0 lg:rounded-card lg:border"
                style="--panel-width: {{ $panelWidthRem }}rem; --menu-columns: {{ $columnCount }};"
            >
                <div class="cluster-menu-grid grid gap-x-4 gap-y-1">
                    @foreach ($columns as $column)
                        <ul class="min-w-0 space-y-1">
                            @foreach ($column as $tool)
                                <li>
                                    <a
                                        href="{{ url('/'.$tool->slug) }}"
                                        class="block rounded-control px-3 py-2 text-sm text-chrome-ink no-underline hover:bg-black/20 hover:text-white"
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
        @endforeach
    </div>
</header>
