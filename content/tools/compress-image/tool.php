<?php

return [
    'id' => 'compress-image',
    'slug' => 'compress-image',
    'cluster' => 'images',
    'status' => 'draft',
    'engine' => 'squoosh-compress',
    'processing' => 'browser',
    'title' => 'Compress image',
    'promise' => 'Make a JPEG, PNG, or WebP smaller without leaving this page.',
    'seo_title' => 'Compress image',
    'seo_description' => 'Compress a JPEG, PNG, or WebP in your browser. We do not upload the file.',
    'related' => ['resize-image', 'convert-image', 'strip-metadata'],
    'limits' => [
        'max_bytes' => 26214400,
        'max_edge' => 8192,
    ],
    'faq' => [
        ['question' => 'Does compress upload my photo?', 'answer' => 'No. Compression runs in this browser.'],
        ['question' => 'Which formats can I compress?', 'answer' => 'JPEG, PNG, and WebP. GIF uses the first frame.'],
        ['question' => 'What is the file size limit?', 'answer' => '25 MB, and 8192 pixels on the long side.'],
    ],
    'suffix' => 'compressed',
];
