<?php

return [
    'id' => 'split-pdf',
    'slug' => 'split-pdf',
    'cluster' => 'documents',
    'status' => 'live',
    'engine' => 'pdf-toolkit',
    'processing' => 'browser',
    'title' => 'Split PDF',
    'promise' => 'Extract a page range into a new PDF without uploading the file.',
    'seo_title' => 'Split PDF and extract pages in your browser',
    'seo_description' => 'Extract a page range from a PDF locally in your browser and download a new file. No upload.',
    'related' => ['merge-pdf', 'rotate-pdf', 'pdf-to-word'],
    'limits' => [
        'max_bytes' => 52428800,
        'max_pages' => 200,
        'max_edge' => 8192,
    ],
    'faq' => [
        ['question' => 'Does split upload my PDF?', 'answer' => 'No. The file stays in this browser tab until you download the result.'],
        ['question' => 'What is the default range?', 'answer' => 'All pages. Narrow the start and end page before download if you only need a section.'],
        ['question' => 'Can I get one file per page?', 'answer' => 'This tool downloads one PDF for the chosen range. Run it again for other ranges, or merge pieces later.'],
    ],
    'suffix' => 'split',
];
