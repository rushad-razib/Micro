<?php

return [
    'id' => 'resize-linkedin',
    'slug' => 'resize-image-for-linkedin',
    'cluster' => 'images',
    'status' => 'live',
    'engine' => 'canvas-transform',
    'processing' => 'browser',
    'title' => 'Resize image for LinkedIn',
    'promise' => 'Export link-card images at 1200×627—the LinkedIn preview size—in your browser.',
    'seo_title' => 'Resize image for LinkedIn link preview 1200×627',
    'seo_description' => 'Cover-crop to 1200×627 for LinkedIn article and link previews without uploading.',
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
        ['question' => 'What size is a LinkedIn link preview image?', 'answer' => 'This preset outputs 1200×627 pixels.'],
        ['question' => 'Is my photo sent to LinkedIn from here?', 'answer' => 'No. Download and upload through LinkedIn or your scheduler.'],
        ['question' => 'How is the crop chosen?', 'answer' => 'Cover scaling fills the frame; excess is trimmed from the center outward.'],
        ['question' => 'I also post on Facebook—do I need another file?', 'answer' => 'Facebook link images are usually 1200×630. Export both presets if you cross-post.'],
    ],
    'suffix' => 'linkedin',
];
