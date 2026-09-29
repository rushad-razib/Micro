<?php

return [
    'id' => 'convert-image',
    'slug' => 'convert-image',
    'cluster' => 'images',
    'status' => 'draft',
    'engine' => 'canvas-transform',
    'processing' => 'browser',
    'title' => 'Convert image',
    'promise' => 'Change a photo to JPEG, PNG, or WebP in this browser.',
    'seo_title' => 'Convert image',
    'seo_description' => 'Convert an image to JPEG, PNG, or WebP in your browser. We do not upload the file.',
    'related' => ['compress-image', 'webp-vs-jpeg'],
    'limits' => [
        'max_bytes' => 26214400,
        'max_edge' => 8192,
    ],
    'faq' => [
        ['question' => 'Does convert upload my photo?', 'answer' => 'No. Conversion runs in this browser.'],
        ['question' => 'What format do I get by default?', 'answer' => 'WebP, unless the file is already WebP, in which case JPEG.'],
        ['question' => 'Can I make AVIF?', 'answer' => 'Only when this browser can encode AVIF. Otherwise use WebP or JPEG.'],
    ],
    'suffix' => 'converted',
];
