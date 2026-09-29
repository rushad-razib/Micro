<?php

return [
    'id' => 'strip-metadata',
    'slug' => 'strip-image-metadata',
    'cluster' => 'images',
    'status' => 'draft',
    'engine' => 'metadata-strip',
    'processing' => 'browser',
    'title' => 'Strip image metadata',
    'promise' => 'Remove EXIF, including GPS, without uploading the photo.',
    'seo_title' => 'Strip image metadata',
    'seo_description' => 'Remove EXIF and GPS from a photo in your browser. We do not upload the file.',
    'related' => ['compress-image', 'what-exif-data-reveals'],
    'limits' => [
        'max_bytes' => 26214400,
        'max_edge' => 8192,
    ],
    'faq' => [
        ['question' => 'Does this upload my photo?', 'answer' => 'No. Metadata is read and stripped in this browser.'],
        ['question' => 'Will you show my exact location?', 'answer' => 'No. If GPS is present the page says location is embedded, then removed.'],
        ['question' => 'Why might the file size change?', 'answer' => 'Pixels are rewritten to drop EXIF. Dimensions stay the same.'],
    ],
    'suffix' => 'cleaned',
];
