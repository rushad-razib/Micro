<?php

return [

    'path' => base_path('content'),

    'cache_path' => base_path('bootstrap/cache/registry.php'),

    /*
     * Draft tools, clusters, and guides render only when this is true.
     * Local defaults to true so the Phase A shell can be checked.
     * Production and tests default to false (drafts 404, omitted from sitemap).
     */
    'show_drafts' => env('REGISTRY_SHOW_DRAFTS', env('APP_ENV') === 'local'),

    'engines' => [
        'canvas-transform',
        'background-remove',
        'squoosh-compress',
        'metadata-strip',
        'pdf-toolkit',
        'office-convert',
    ],

    'policy_paths' => [
        'about',
        'contact',
        'privacy',
        'cookies',
        'terms',
        'editorial-policy',
    ],

];
