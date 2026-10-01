@props([
    'documentTitle',
    'metaDescription',
    'canonical',
    'jsonLd' => [],
])

@php
    $ogImage = url('/og-default.png');
    $verification = config('site.google_site_verification');
@endphp

<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{{ $documentTitle }}</title>
        <meta name="description" content="{{ $metaDescription }}">
        <link rel="canonical" href="{{ $canonical }}">
        <meta property="og:title" content="{{ $documentTitle }}">
        <meta property="og:description" content="{{ $metaDescription }}">
        <meta property="og:url" content="{{ $canonical }}">
        <meta property="og:image" content="{{ $ogImage }}">
        <meta property="og:type" content="website">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="robots" content="index, follow">
        @if (filled($verification))
            <meta name="google-site-verification" content="{{ $verification }}">
        @endif
        @vite(['resources/css/app.css', 'resources/js/app.js'])
        @isset($jsonLd)
            <x-json-ld :payload="$jsonLd" />
        @endisset
    </head>
    <body
        class="flex min-h-screen flex-col bg-canvas"
        data-consent-provider="{{ config('site.consent_provider') }}"
        data-adsense-client="{{ config('site.adsense.client_id') }}"
        data-adsense-slot="{{ config('site.adsense.slot') }}"
        data-consent-storage-key="{{ config('site.consent_storage_key') }}"
    >
        <x-site-header :site-name="$siteName" :clusters="$headerClusters" />

        <main class="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
            {{ $slot }}
        </main>

        <x-site-footer
            :site-name="$siteName"
            :tools-by-cluster="$footerToolsByCluster"
            :clusters="$footerClusters"
            :guides="$footerGuides"
        />

        <x-consent-banner />
    </body>
</html>
