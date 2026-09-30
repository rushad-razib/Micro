<?php

return [
    'id' => 'resize-youtube',
    'slug' => 'youtube-thumbnail-resizer',
    'cluster' => 'images',
    'status' => 'live',
    'engine' => 'canvas-transform',
    'processing' => 'browser',
    'title' => 'YouTube thumbnail resizer',
    'promise' => 'Lock art to the 1280×720 thumbnail frame YouTube expects—processed locally.',
    'seo_title' => 'YouTube thumbnail resizer 1280×720 in browser',
    'seo_description' => 'Cover-crop to 1280×720 for YouTube thumbnails without uploading your image.',
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
        ['question' => 'What pixel size does YouTube use for thumbnails?', 'answer' => 'This tool exports 1280×720, the standard 16:9 thumbnail dimensions.'],
        ['question' => 'Is my thumbnail uploaded to YouTube here?', 'answer' => 'No. Save the file and upload it in YouTube Studio.'],
        ['question' => 'Will wide photos lose the sides?', 'answer' => 'Cover-crop trims edges to fill 16:9; keep faces near the center.'],
        ['question' => 'Can I make a different aspect ratio?', 'answer' => 'Use crop or resize first, then return here for the exact 1280×720 export.'],
    ],
    'suffix' => 'youtube',
];
