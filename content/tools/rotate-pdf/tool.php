<?php

return [
    'id' => 'rotate-pdf',
    'slug' => 'rotate-pdf',
    'cluster' => 'documents',
    'status' => 'live',
    'engine' => 'pdf-toolkit',
    'processing' => 'browser',
    'title' => 'Rotate PDF',
    'promise' => 'Rotate every page of a PDF in your browser, then download.',
    'seo_title' => 'Rotate PDF pages in your browser',
    'seo_description' => 'Rotate PDF pages by 90°, 180°, or 270° locally. No upload required.',
    'related' => ['merge-pdf', 'split-pdf', 'images-to-pdf'],
    'limits' => [
        'max_bytes' => 52428800,
        'max_pages' => 200,
        'max_edge' => 8192,
    ],
    'faq' => [
        ['question' => 'Is the PDF uploaded to rotate it?', 'answer' => 'No. Rotation is applied in this browser tab.'],
        ['question' => 'What is the default rotation?', 'answer' => '90° clockwise on all pages. Choose 180° or 270° if you need another turn.'],
        ['question' => 'Can I rotate only some pages?', 'answer' => 'This release rotates all pages the same way. Split out pages first if you need mixed orientations.'],
    ],
    'suffix' => 'rotated',
];
