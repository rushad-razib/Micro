<?php

return [
    'id' => 'resize-linkedin',
    'slug' => 'resize-image-for-linkedin',
    'cluster' => 'images',
    'status' => 'draft',
    'engine' => 'canvas-transform',
    'processing' => 'browser',
    'title' => 'Resize image for LinkedIn',
    'promise' => 'Fit a photo to the 1200×627 LinkedIn link frame in this browser.',
    'seo_title' => 'Resize image for LinkedIn',
    'seo_description' => 'Resize a photo to 1200×627 for LinkedIn in your browser. We do not upload the file.',
    'related' => ['resize-facebook', 'resize-image'],
    'limits' => [
        'max_bytes' => 26214400,
        'max_edge' => 8192,
    ],
    'preset_of' => 'resize-image',
    'preset' => [
        ['key' => 'link', 'label' => 'Link image', 'width' => 1200, 'height' => 627, 'default' => true],
    ],
    'faq' => [
        ['question' => 'What size is the default?', 'answer' => '1200×627, a common LinkedIn link image.'],
        ['question' => 'Does this upload my photo?', 'answer' => 'No. The frame is applied in this browser.'],
        ['question' => 'Need a custom size?', 'answer' => 'Use the general resize tool for arbitrary pixels.'],
    ],
    'suffix' => 'linkedin',
];
