<?php

return [
    'id' => 'word-to-pdf',
    'slug' => 'word-to-pdf',
    'cluster' => 'documents',
    'status' => 'live',
    'engine' => 'office-convert',
    'processing' => 'browser',
    'title' => 'Word to PDF',
    'promise' => 'Convert a DOCX to PDF in your browser. Best for text-heavy documents.',
    'seo_title' => 'Convert Word DOCX to PDF in your browser',
    'seo_description' => 'Turn a DOCX into a PDF locally in your browser. Text-focused conversion with no upload.',
    'related' => ['pdf-to-word', 'merge-pdf', 'images-to-pdf'],
    'limits' => [
        'max_bytes' => 26214400,
        'max_pages' => 100,
        'max_edge' => 8192,
    ],
    'faq' => [
        ['question' => 'Is my Word file uploaded?', 'answer' => 'No. Conversion runs in this tab. We do not receive the document.'],
        ['question' => 'Will complex layouts look perfect?', 'answer' => 'No. This tool focuses on readable text. Fancy tables, text boxes, and macros may not match Microsoft Word.'],
        ['question' => 'Does .doc (old Word) work?', 'answer' => 'Only .docx is accepted. Save as DOCX in Word or LibreOffice first.'],
    ],
    'suffix' => 'converted',
];
