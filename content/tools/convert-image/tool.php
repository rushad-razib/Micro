<?php

return [
    'id' => 'convert-image',
    'slug' => 'convert-image',
    'cluster' => 'images',
    'status' => 'live',
    'engine' => 'canvas-transform',
    'processing' => 'browser',
    'title' => 'Convert image',
    'promise' => 'Export to JPEG, PNG, or WebP on your device—pick the format that fits.',
    'seo_title' => 'Convert image to JPEG, PNG, or WebP in browser',
    'seo_description' => 'Change image format with local canvas encoding. No upload; AVIF when your browser supports it.',
    'related' => ['compress-image', 'resize-image', 'remove-background'],
    'limits' => [
        'max_bytes' => 26214400,
        'max_edge' => 8192,
    ],
    'faq' => [
        ['question' => 'Does conversion upload my photo?', 'answer' => 'No. Pixels are re-encoded entirely in this browser.'],
        ['question' => 'What format is selected first?', 'answer' => 'WebP for most inputs; already-WebP files default to JPEG.'],
        ['question' => 'Will EXIF survive conversion?', 'answer' => 'Canvas export typically drops most metadata; use strip metadata if you need a clean file.'],
        ['question' => 'Why is AVIF missing?', 'answer' => 'AVIF appears only when this browser can encode it; otherwise choose WebP or JPEG.'],
    ],
    'suffix' => 'converted',
];
