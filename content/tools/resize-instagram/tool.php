<?php

return [
    'id' => 'resize-instagram',
    'slug' => 'resize-image-for-instagram',
    'cluster' => 'images',
    'status' => 'draft',
    'engine' => 'canvas-transform',
    'processing' => 'browser',
    'title' => 'Resize image for Instagram',
    'promise' => 'Fit a photo to the Instagram feed frame of 1080×1350 in this browser.',
    'seo_title' => 'Resize image for Instagram',
    'seo_description' => 'Resize a photo to Instagram feed 1080×1350 in your browser. We do not upload the file.',
    'related' => ['crop-image', 'resize-image', 'resize-youtube'],
    'limits' => [
        'max_bytes' => 26214400,
        'max_edge' => 8192,
    ],
    'preset_of' => 'resize-image',
    'preset' => [
        ['key' => 'feed', 'label' => 'Feed', 'width' => 1080, 'height' => 1350, 'default' => true],
        ['key' => 'story', 'label' => 'Story', 'width' => 1080, 'height' => 1920],
    ],
    'faq' => [
        ['question' => 'What size is the default?', 'answer' => '1080×1350 for the Instagram feed. Story 1080×1920 is a chip on this page.'],
        ['question' => 'Does this upload my photo?', 'answer' => 'No. The frame is applied in this browser.'],
        ['question' => 'Need a custom size?', 'answer' => 'Use the general resize tool for arbitrary pixels.'],
    ],
    'suffix' => 'instagram',
];
