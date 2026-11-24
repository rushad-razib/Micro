<?php

return [
    'id' => 'road-distance',
    'slug' => 'road-distance',
    'cluster' => 'calculators',
    'status' => 'live',
    'engine' => 'road-measure',
    'processing' => 'browser',
    'title' => 'Road distance',
    'promise' => 'Mark a start, walk the alignment, and mark the end. See the straight line and the walked path in meters.',
    'seo_title' => 'Road distance — walked alignment in meters',
    'seo_description' => 'Measure a walked alignment on your phone. Mark a start, walk, and mark the end to see straight-line and walked-path meters.',
    'related' => [],
    'limits' => [
        'max_bytes' => 0,
        'max_edge' => 0,
    ],
    'faq' => [
        ['question' => 'Is this a survey measurement?', 'answer' => 'No. A phone GPS is often several meters off, and it can be worse between buildings or under trees. The ± range is the phone’s own estimate, not a certified tolerance. Do not use it as the only figure on an official requirement.'],
        ['question' => 'Why are there two distances?', 'answer' => 'The straight line is the shortest distance between the start mark and the end mark. The walked path follows the track recorded while you walk. Use the walked path when the alignment bends. The straight line is shorter whenever the line bends.'],
        ['question' => 'Why is a result blocked?', 'answer' => 'The phone reported accuracy worse than 10 meters, or it did not collect five good fixes in a row while you held still. Wait in open sky with the screen on, then mark again.'],
        ['question' => 'Are the positions uploaded?', 'answer' => 'No. The measurement runs in this browser. The downloaded record stays on your device.'],
    ],
    'suffix' => 'measurement',
];
