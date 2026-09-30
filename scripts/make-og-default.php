<?php

$w = 1200;
$h = 630;
$im = imagecreatetruecolor($w, $h);
$bg = imagecolorallocate($im, 246, 245, 243);
$ink = imagecolorallocate($im, 28, 25, 23);
$accent = imagecolorallocate($im, 15, 118, 110);
imagefilledrectangle($im, 0, 0, $w, $h, $bg);
imagefilledrectangle($im, 0, 0, $w, 16, $accent);
imagefilledrectangle($im, 0, $h - 16, $w, $h, $accent);

$title = 'Image tools';
$sub = 'Free browser image utilities';
$font = 5;
$titleWidth = imagefontwidth($font) * strlen($title);
$subWidth = imagefontwidth($font) * strlen($sub);
imagestring($im, $font, (int) (($w - $titleWidth) / 2), 280, $title, $ink);
imagestring($im, $font, (int) (($w - $subWidth) / 2), 320, $sub, $accent);

$path = __DIR__.'/../public/og-default.png';
imagepng($im, $path);
imagedestroy($im);

echo $path.' '.filesize($path).PHP_EOL;
