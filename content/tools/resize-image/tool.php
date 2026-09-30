<?php

return [
    'id' => 'resize-image',
    'slug' => 'resize-image',
    'cluster' => 'images',
    'status' => 'live',
    'engine' => 'canvas-transform',
    'processing' => 'browser',
    'title' => 'Resize image',
    'promise' => 'Scale by pixels, percent, or max edge—processed locally, never uploaded.',
    'seo_title' => 'Resize image by pixels or percent in browser',
    'seo_description' => 'Resize photos to exact dimensions or fit inside a max edge. Canvas processing stays on your device.',
    'related' => ['crop-image', 'compress-image', 'resize-instagram'],
    'limits' => [
        'max_bytes' => 26214400,
        'max_edge' => 8192,
    ],
    'faq' => [
        ['question' => 'Does resizing upload my file?', 'answer' => 'No. The bitmap is drawn and scaled in your browser only.'],
        ['question' => 'Will a small photo be enlarged by default?', 'answer' => 'No. The default max-edge fit does not upscale.'],
        ['question' => 'Can I set width and height independently?', 'answer' => 'Yes. Use exact pixels or percent; aspect ratio follows the mode you pick.'],
        ['question' => 'Which file types work?', 'answer' => 'JPEG, PNG, WebP, and GIF (first frame).'],
    ],
    'suffix' => 'resized',
];
