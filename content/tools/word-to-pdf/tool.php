<?php

return [
    'id' => 'word-to-pdf',
    'slug' => 'word-to-pdf',
    'cluster' => 'documents',
    'status' => 'live',
    'engine' => 'office-convert',
    'processing' => 'browser',
    'title' => 'Word to PDF',
    'promise' => 'Convert a DOCX to PDF in your browser, keeping tables, bold, and font style.',
    'seo_title' => 'Convert Word DOCX to PDF in your browser',
    'seo_description' => 'Turn a DOCX into a selectable PDF locally in your browser. Tables, bold, and font family are preserved. No upload.',
    'related' => ['pdf-to-word', 'merge-pdf', 'images-to-pdf'],
    'limits' => [
        'max_bytes' => 26214400,
        'max_pages' => 100,
        'max_edge' => 8192,
    ],
    'faq' => [
        ['question' => 'Is my Word file uploaded?', 'answer' => 'No. Conversion runs in this tab. We do not receive the document.'],
        ['question' => 'Will complex layouts look perfect?', 'answer' => 'Tables, bold, italic, sizes, and font family are kept. Fonts map to standard PDF faces, so Calibri becomes Helvetica and Cambria becomes Times. Text boxes, columns, and floating shapes may not match Word.'],
        ['question' => 'Does .doc (old Word) work?', 'answer' => 'Only .docx is accepted. Save as DOCX in Word or LibreOffice first.'],
    ],
    'suffix' => 'converted',
];
