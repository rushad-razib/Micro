<?php

return [
    'id' => 'images-to-pdf',
    'slug' => 'images-to-pdf',
    'cluster' => 'documents',
    'status' => 'live',
    'engine' => 'pdf-toolkit',
    'processing' => 'browser',
    'title' => 'Images to PDF',
    'promise' => 'Turn photos into a PDF on this device—one image per page.',
    'seo_title' => 'Convert images to PDF in your browser',
    'seo_description' => 'Build a PDF from JPEG, PNG, or WebP images locally. One image per page, no upload.',
    'related' => ['merge-pdf', 'compress-image', 'convert-image'],
    'limits' => [
        'max_bytes' => 52428800,
        'max_files' => 30,
        'max_edge' => 8192,
    ],
    'faq' => [
        ['question' => 'Are my photos uploaded?', 'answer' => 'No. Images are read in this tab and written into a PDF locally.'],
        ['question' => 'What order are pages in?', 'answer' => 'The same order you add the images. Re-add files to change order.'],
        ['question' => 'Which formats work?', 'answer' => 'JPEG, PNG, WebP, and GIF (first frame). Very large images are rejected.'],
    ],
    'suffix' => 'images',
];
