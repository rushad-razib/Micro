<?php

return [
    'id' => 'compress-image',
    'slug' => 'compress-image',
    'cluster' => 'images',
    'status' => 'live',
    'engine' => 'squoosh-compress',
    'processing' => 'browser',
    'title' => 'Compress image',
    'promise' => 'Shrink a JPEG, PNG, or WebP on your device with real codecs—no upload.',
    'seo_title' => 'Compress image online in your browser',
    'seo_description' => 'Compress JPEG, PNG, or WebP locally with MozJPEG and related encoders. Files stay in your browser.',
    'related' => ['resize-image', 'convert-image', 'strip-metadata'],
    'limits' => [
        'max_bytes' => 26214400,
        'max_edge' => 8192,
    ],
    'faq' => [
        ['question' => 'Is my photo uploaded to compress it?', 'answer' => 'No. Encoders run entirely in this tab; you download when finished.'],
        ['question' => 'Will compression change the image dimensions?', 'answer' => 'No. Only the encoding changes unless you resize elsewhere first.'],
        ['question' => 'Why did my GIF open as a still?', 'answer' => 'Animation is not preserved; we compress the first frame like a PNG or JPEG.'],
        ['question' => 'What are the size limits?', 'answer' => '25 MB file size and 8192 pixels on the longest edge.'],
    ],
    'suffix' => 'compressed',
];
