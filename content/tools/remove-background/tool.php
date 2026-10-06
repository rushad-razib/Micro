<?php

return [
    'id' => 'remove-background',
    'slug' => 'remove-background',
    'cluster' => 'images',
    'status' => 'live',
    'engine' => 'background-remove',
    'processing' => 'browser',
    'title' => 'Remove background',
    'promise' => 'Click a background area to make it transparent, then clear any spots the first pass missed.',
    'seo_title' => 'Remove image background by clicking the color',
    'seo_description' => 'Click a background to make that area transparent, then save and clear holes inside letters. PNG download stays in your browser.',
    'related' => ['crop-image', 'convert-image', 'compress-image'],
    'limits' => [
        'max_bytes' => 26214400,
        'max_edge' => 8192,
    ],
    'faq' => [
        ['question' => 'Does this upload my image?', 'answer' => 'No. Each pass stays in this browser. Nothing is stored on a server.'],
        ['question' => 'Why are the holes inside letters still filled?', 'answer' => 'The first click only clears the connected area you hit. Save and make another area transparent, then click inside the letter.'],
        ['question' => 'Which file should I download?', 'answer' => 'PNG. JPEG cannot keep transparency, so the download is always a PNG.'],
        ['question' => 'Will this cut a person out of a photo?', 'answer' => 'No. It removes the connected color you click. A busy photo where the subject is a similar color will not separate cleanly.'],
    ],
    'suffix' => 'transparent',
];
