---
title: How to compress images for the web
seo_title: How to compress images for the web
seo_description: When and how to compress photos for the web, using a browser tool.
updated: 2026-09-24
status: live
---

## When to compress

Compress when the photo on disk is bigger than your page needs—hero banners exported at full camera resolution, PNG screenshots with unused alpha, or JPEGs straight from a phone at 4000×3000. Smaller files mean faster loads and less mobile data. Compression does not replace thoughtful dimensions; it removes wasted detail in the bytes you already chose to show.

## How to do it here

Open the [compress image](/compress-image) tool. Your file stays in the browser: encoders run locally and you download the result when it looks right. Pair with [resize image](/resize-image) first if the layout only needs 1600 pixels wide, then compress so you are not throwing quality at pixels nobody sees.

## Quality

A practical starting point is quality 80 for JPEG and WebP. PNG remains lossless here—use it when you need crisp edges or transparency, knowing the file may stay larger. Compare visually at 100% zoom rather than chasing a percentage badge; every photo reacts differently to compression.

## Formats

If the site expects WebP or AVIF but your asset is a giant JPEG, [convert image](/convert-image) after compressing, or read [WebP vs JPEG](/guides/webp-vs-jpeg) to pick a default. [Strip image metadata](/strip-image-metadata) is separate: it removes EXIF but is not a substitute for lowering quality or dimensions.
