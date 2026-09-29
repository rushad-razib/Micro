<?php

return [
    'id' => 'crop-image',
    'slug' => 'crop-image',
    'cluster' => 'images',
    'status' => 'draft',
    'engine' => 'canvas-transform',
    'processing' => 'browser',
    'title' => 'Crop image',
    'promise' => 'Crop a photo with ratio chips, or download the full frame.',
    'seo_title' => 'Crop image',
    'seo_description' => 'Crop an image in your browser. Download works with the full frame selected. We do not upload the file.',
    'related' => ['resize-image', 'resize-instagram', 'rotate-image'],
    'limits' => [
        'max_bytes' => 26214400,
        'max_edge' => 8192,
    ],
    'faq' => [
        ['question' => 'Do I have to crop before download?', 'answer' => 'No. The full frame is a valid result.'],
        ['question' => 'Does crop upload my photo?', 'answer' => 'No. Crop runs in this browser.'],
        ['question' => 'Which ratios are available?', 'answer' => 'Free, 1:1, 4:5, and 16:9. Unique copy ships in Phase B.'],
    ],
    'suffix' => 'cropped',
];
