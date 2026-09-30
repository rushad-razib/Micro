<?php

return [
    'id' => 'crop-image',
    'slug' => 'crop-image',
    'cluster' => 'images',
    'status' => 'live',
    'engine' => 'canvas-transform',
    'processing' => 'browser',
    'title' => 'Crop image',
    'promise' => 'Draw a crop with ratio presets or keep the full frame—all in-browser.',
    'seo_title' => 'Crop image online with aspect ratio presets',
    'seo_description' => 'Crop JPEG, PNG, or WebP with freeform or 1:1, 4:5, and 16:9 ratios. No server upload.',
    'related' => ['resize-image', 'resize-instagram', 'rotate-image'],
    'limits' => [
        'max_bytes' => 26214400,
        'max_edge' => 8192,
    ],
    'faq' => [
        ['question' => 'Can I download without cropping?', 'answer' => 'Yes. The initial selection is the full image.'],
        ['question' => 'Is the crop sent to a server?', 'answer' => 'No. Export happens from a canvas in your browser.'],
        ['question' => 'Which aspect ratios are built in?', 'answer' => 'Freeform, 1:1 square, 4:5 portrait, and 16:9 widescreen.'],
        ['question' => 'Does cropping reduce file size?', 'answer' => 'Often, because fewer pixels are encoded, but format and quality matter too.'],
    ],
    'suffix' => 'cropped',
];
