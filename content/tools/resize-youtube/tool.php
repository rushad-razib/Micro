<?php

return [
    'id' => 'resize-youtube',
    'slug' => 'youtube-thumbnail-resizer',
    'cluster' => 'images',
    'status' => 'draft',
    'engine' => 'canvas-transform',
    'processing' => 'browser',
    'title' => 'YouTube thumbnail resizer',
    'promise' => 'Fit a photo to the 1280×720 YouTube thumbnail frame in this browser.',
    'seo_title' => 'YouTube thumbnail resizer',
    'seo_description' => 'Resize a photo to a 1280×720 YouTube thumbnail in your browser. We do not upload the file.',
    'related' => ['resize-image', 'resize-facebook'],
    'limits' => [
        'max_bytes' => 26214400,
        'max_edge' => 8192,
    ],
    'preset_of' => 'resize-image',
    'preset' => [
        ['key' => 'thumbnail', 'label' => 'Thumbnail', 'width' => 1280, 'height' => 720, 'default' => true],
    ],
    'faq' => [
        ['question' => 'What size is the default?', 'answer' => '1280×720, the standard YouTube thumbnail.'],
        ['question' => 'Does this upload my photo?', 'answer' => 'No. The frame is applied in this browser.'],
        ['question' => 'Need a custom size?', 'answer' => 'Use the general resize tool for arbitrary pixels.'],
    ],
    'suffix' => 'youtube',
];
