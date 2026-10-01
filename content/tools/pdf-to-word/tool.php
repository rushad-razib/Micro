<?php

return [
    'id' => 'pdf-to-word',
    'slug' => 'pdf-to-word',
    'cluster' => 'documents',
    'status' => 'live',
    'engine' => 'office-convert',
    'processing' => 'browser',
    'title' => 'PDF to Word',
    'promise' => 'Extract a PDF text layer into a DOCX on this device—no upload, no OCR.',
    'seo_title' => 'Convert PDF to Word DOCX in your browser',
    'seo_description' => 'Turn a text PDF into an editable DOCX locally. Requires a text layer; scanned pages need OCR elsewhere.',
    'related' => ['word-to-pdf', 'split-pdf', 'merge-pdf'],
    'limits' => [
        'max_bytes' => 26214400,
        'max_pages' => 100,
        'max_edge' => 8192,
    ],
    'faq' => [
        ['question' => 'Is my PDF uploaded?', 'answer' => 'No. Text is extracted in this browser tab and written into a DOCX locally.'],
        ['question' => 'Why did a scanned PDF fail?', 'answer' => 'Scans are pictures without a text layer. This release has no OCR. Use a searchable PDF or OCR tool first.'],
        ['question' => 'Will formatting match the PDF?', 'answer' => 'You get editable paragraphs close to reading order. Exact fonts and multi-column layout are not guaranteed.'],
    ],
    'suffix' => 'converted',
];
