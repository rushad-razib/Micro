<?php

return [
    'id' => 'resize-facebook',
    'slug' => 'resize-image-for-facebook',
    'cluster' => 'images',
    'status' => 'live',
    'engine' => 'canvas-transform',
    'processing' => 'browser',
    'title' => 'Resize image for Facebook',
    'promise' => 'Fit link-preview art to 1200×630 in the browser before you paste og tags.',
    'seo_title' => 'Resize image for Facebook link preview 1200×630',
    'seo_description' => 'Center-crop to 1200×630 for Facebook sharing images. Local processing, no upload.',
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
        ['question' => 'Why 1200×630 for Facebook?', 'answer' => 'It is the common open-graph link image size Facebook and many CMS fields expect.'],
        ['question' => 'Does Facebook get my file from this page?', 'answer' => 'No. You download and place the image in your site or post.'],
        ['question' => 'How does cropping work?', 'answer' => 'Your image is scaled to cover the frame, then center-cropped to exact pixels.'],
        ['question' => 'Is this the same as LinkedIn’s size?', 'answer' => 'LinkedIn often uses 1200×627—one pixel shorter. Use our LinkedIn preset if you post there too.'],
    ],
    'suffix' => 'facebook',
];
