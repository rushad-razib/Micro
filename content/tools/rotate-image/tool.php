<?php

return [
    'id' => 'rotate-image',
    'slug' => 'rotate-image',
    'cluster' => 'images',
    'status' => 'draft',
    'engine' => 'canvas-transform',
    'processing' => 'browser',
    'title' => 'Rotate image',
    'promise' => 'Rotate in 90° steps or flip a photo in this browser.',
    'seo_title' => 'Rotate image',
    'seo_description' => 'Rotate or flip an image in your browser. We do not upload the file.',
    'related' => ['crop-image', 'resize-image'],
    'limits' => [
        'max_bytes' => 26214400,
        'max_edge' => 8192,
    ],
    'faq' => [
        ['question' => 'Does rotate upload my photo?', 'answer' => 'No. Rotate runs in this browser.'],
        ['question' => 'Do I have to rotate before download?', 'answer' => 'No. The original orientation is a valid download.'],
        ['question' => 'Which turns can I apply?', 'answer' => 'Left, right, flip horizontal, and flip vertical. They can stack.'],
    ],
    'suffix' => 'rotated',
];
