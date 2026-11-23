<?php

return [
    'id' => 'land-calculator',
    'slug' => 'land-calculator',
    'cluster' => 'calculators',
    'status' => 'live',
    'engine' => 'land-calculator',
    'processing' => 'browser',
    'title' => 'Bangladesh land calculator',
    'promise' => 'Convert shotangsho, katha, bigha, acre, and the other survey units as you type.',
    'seo_title' => 'Bangladesh land calculator — shotangsho to katha',
    'seo_description' => 'Convert Bangladesh land units in your browser. Shotangsho, katha, bigha, acre, and square feet use the national survey factors.',
    'related' => [],
    'limits' => [
        'max_bytes' => 0,
        'max_edge' => 0,
    ],
    'faq' => [
        ['question' => 'Is a shotangsho the same as a decimal?', 'answer' => 'Yes. Shotangsho, shotok, and decimal are one unit: one hundredth of an acre, or 435.6 square feet.'],
        ['question' => 'How many katha are in a bigha?', 'answer' => 'The survey bigha is 20 katha, which is 14,400 square feet, or about 33.06 shotangsho.'],
        ['question' => 'Why might a local bigha differ?', 'answer' => 'Some districts still quote a local bigha. This calculator uses the survey bigha of 20 katha. Kani, gonda, and kora are omitted because their size changes by district.'],
        ['question' => 'Is the amount I type uploaded?', 'answer' => 'No. The conversion runs in this browser.'],
    ],
    'suffix' => 'result',
];
