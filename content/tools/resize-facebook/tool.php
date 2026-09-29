<?php

return [
    'id' => 'resize-facebook',
    'slug' => 'resize-image-for-facebook',
    'cluster' => 'images',
    'status' => 'draft',
    'engine' => 'canvas-transform',
    'processing' => 'browser',
    'title' => 'Resize image for Facebook',
    'promise' => 'Fit a photo to the 1200×630 Facebook link frame in this browser.',
    'seo_title' => 'Resize image for Facebook',
    'seo_description' => 'Resize a photo to 1200×630 for Facebook in your browser. We do not upload the file.',
    'related' => ['resize-linkedin', 'resize-image'],
    'limits' => [
        'max_bytes' => 26214400,
        'max_edge' => 8192,
    ],
    'preset_of' => 'resize-image',
    'preset' => [
        ['key' => 'link', 'label' => 'Link image', 'width' => 1200, 'height' => 630, 'default' => true],
    ],
    'faq' => [
        ['question' => 'What size is the default?', 'answer' => '1200×630, a common Facebook link image.'],
        ['question' => 'Does this upload my photo?', 'answer' => 'No. The frame is applied in this browser.'],
        ['question' => 'Need a custom size?', 'answer' => 'Use the general resize tool for arbitrary pixels.'],
    ],
    'suffix' => 'facebook',
];
