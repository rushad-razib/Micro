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
    'seo_description' => 'Measure a walked alignment on your phone. Hold still, walk, and hold still again. A distance is shown when the fixes agree within 5 meters.',
    'related' => [],
    'limits' => [
        'max_bytes' => 0,
        'max_edge' => 0,
    ],
    'faq' => [
        ['question' => 'Is this a survey measurement?', 'answer' => 'No. Hold still for about 30 seconds at each end. A distance is shown only when the fixes agree tightly enough for a combined error of 5 m or less. A jumping fix under trees or against a wall will not lock. A steady fix beside a building can still be shifted. Do not use it as the only figure on an official requirement.'],
        ['question' => 'Why are there two distances?', 'answer' => 'The straight line is the shortest distance between the start mark and the end mark. The walked path follows the track recorded while you walk. Use the walked path when the alignment bends. The straight line is shorter whenever the line bends.'],
        ['question' => 'Why does a mark not lock?', 'answer' => 'The fixes have not stayed inside a few meters for about 20 seconds. Hold still in open sky with the screen on. A fix worse than 20 meters is ignored, and so is a fix that is still moving.'],
        ['question' => 'Are the positions uploaded?', 'answer' => 'No. The measurement runs in this browser. The downloaded record stays on your device.'],
    ],
    'suffix' => 'measurement',
];
