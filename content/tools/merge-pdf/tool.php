<?php

return [
    'id' => 'merge-pdf',
    'slug' => 'merge-pdf',
    'cluster' => 'documents',
    'status' => 'live',
    'engine' => 'pdf-toolkit',
    'processing' => 'browser',
    'title' => 'Merge PDF',
    'promise' => 'Combine PDF files in order on this device—nothing is uploaded.',
    'seo_title' => 'Merge PDF files in your browser',
    'seo_description' => 'Merge multiple PDFs locally in your browser. Choose order by how you add files, then download one PDF.',
    'related' => ['split-pdf', 'rotate-pdf', 'images-to-pdf'],
    'limits' => [
        'max_bytes' => 52428800,
        'max_files' => 20,
        'max_pages' => 200,
        'max_edge' => 8192,
    ],
    'faq' => [
        ['question' => 'Are my PDFs uploaded?', 'answer' => 'No. Merge runs entirely in this tab with pdf-lib. We never receive the files.'],
        ['question' => 'How is page order chosen?', 'answer' => 'Files are merged in the order you add them. Remove and re-add a file to change order.'],
        ['question' => 'What are the limits?', 'answer' => 'Up to 20 files, about 50 MB total, and 200 pages across all inputs.'],
    ],
    'suffix' => 'merged',
];
