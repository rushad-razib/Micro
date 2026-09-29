<?php

return [
    'id' => 'resize-image',
    'slug' => 'resize-image',
    'cluster' => 'images',
    'status' => 'draft',
    'engine' => 'canvas-transform',
    'processing' => 'browser',
    'title' => 'Resize image',
    'promise' => 'Fit a photo to a max edge or exact pixels in this browser.',
    'seo_title' => 'Resize image',
    'seo_description' => 'Resize an image by pixels, percent, or max edge in your browser. We do not upload the file.',
    'related' => ['crop-image', 'compress-image', 'resize-instagram'],
    'limits' => [
        'max_bytes' => 26214400,
        'max_edge' => 8192,
    ],
    'faq' => [
        ['question' => 'Does resize upload my photo?', 'answer' => 'No. Resize runs in this browser.'],
        ['question' => 'What is the default size?', 'answer' => 'Fit inside 1920 pixels. Smaller images are not enlarged.'],
        ['question' => 'Which types can I open?', 'answer' => 'JPEG, PNG, WebP, and GIF (first frame).'],
    ],
    'suffix' => 'resized',
];
