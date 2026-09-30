<?php

return [
    'id' => 'strip-metadata',
    'slug' => 'strip-image-metadata',
    'cluster' => 'images',
    'status' => 'live',
    'engine' => 'metadata-strip',
    'processing' => 'browser',
    'title' => 'Strip image metadata',
    'promise' => 'See what EXIF is present, then save a copy without GPS or camera tags—locally.',
    'seo_title' => 'Remove EXIF and GPS from photos in browser',
    'seo_description' => 'Read and strip photo metadata on your device. Location is never shown as a street address.',
    'related' => ['compress-image', 'convert-image'],
    'limits' => [
        'max_bytes' => 26214400,
        'max_edge' => 8192,
    ],
    'faq' => [
        ['question' => 'Is my photo uploaded to strip EXIF?', 'answer' => 'No. Metadata is parsed and removed in this browser tab.'],
        ['question' => 'Will you display my exact GPS coordinates?', 'answer' => 'No. We only indicate whether location data is embedded, then remove it.'],
        ['question' => 'Do pixel dimensions change?', 'answer' => 'No. Width and height stay the same; the container is rewritten without tags.'],
        ['question' => 'Why is the cleaned file a different size?', 'answer' => 'Re-encoding removes EXIF blocks and may change compression slightly.'],
    ],
    'suffix' => 'cleaned',
];
