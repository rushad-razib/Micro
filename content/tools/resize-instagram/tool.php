<?php

return [
    'id' => 'resize-instagram',
    'slug' => 'resize-image-for-instagram',
    'cluster' => 'images',
    'status' => 'live',
    'engine' => 'canvas-transform',
    'processing' => 'browser',
    'title' => 'Resize image for Instagram',
    'promise' => 'Export Instagram feed 1080×1350 or story 1080×1920 with cover-crop—no upload.',
    'seo_title' => 'Resize image for Instagram feed and story sizes',
    'seo_description' => 'Center-crop to 1080×1350 feed or 1080×1920 story in your browser. File never leaves your device.',
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
        ['question' => 'Which Instagram size is the default?', 'answer' => 'Feed at 1080×1350. Switch the Story chip for 1080×1920.'],
        ['question' => 'Does Instagram receive my file from this site?', 'answer' => 'No. You download locally and upload in the Instagram app yourself.'],
        ['question' => 'How is my photo fitted to the frame?', 'answer' => 'Cover scale plus center crop—no letterboxing on the export.'],
        ['question' => 'Need pixels that are not feed or story?', 'answer' => 'Use the general resize or crop tools for custom dimensions.'],
    ],
    'suffix' => 'instagram',
];
