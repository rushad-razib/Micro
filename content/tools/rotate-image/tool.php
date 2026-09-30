<?php

return [
    'id' => 'rotate-image',
    'slug' => 'rotate-image',
    'cluster' => 'images',
    'status' => 'live',
    'engine' => 'canvas-transform',
    'processing' => 'browser',
    'title' => 'Rotate image',
    'promise' => 'Turn in 90° steps or flip horizontally and vertically without uploading.',
    'seo_title' => 'Rotate and flip image in your browser',
    'seo_description' => 'Fix orientation with quarter turns and mirror flips. Processing stays on your device.',
    'related' => ['crop-image', 'resize-image'],
    'limits' => [
        'max_bytes' => 26214400,
        'max_edge' => 8192,
    ],
    'faq' => [
        ['question' => 'Is rotation done on a server?', 'answer' => 'No. Each transform updates a local canvas preview.'],
        ['question' => 'Must I rotate before I can download?', 'answer' => 'No. Original orientation is a valid download.'],
        ['question' => 'Can I combine rotate and flip?', 'answer' => 'Yes. Actions stack until you download or reload.'],
        ['question' => 'Do four right rotations undo the turn?', 'answer' => 'Yes. Four 90° steps in the same direction return to the start.'],
    ],
    'suffix' => 'rotated',
];
