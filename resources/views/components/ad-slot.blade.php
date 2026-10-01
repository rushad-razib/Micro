@php
    $clientId = config('site.adsense.client_id');
    $slot = config('site.adsense.slot');
@endphp

<aside
    {{ $attributes->class(['ad-slot min-h-[250px] w-full rounded-card border border-dashed border-line bg-canvas lg:w-[300px]']) }}
    data-ad-slot-host
    @if (! filled($clientId) || ! filled($slot))
        aria-hidden="true"
    @endif
></aside>
