## How this tool handles your image

This tool reads EXIF and related metadata from your photo in the browser, shows a short summary on the page, then re-encodes the pixels so embedded tags are dropped. GPS coordinates are never displayed as a street address—if location data exists, you will see that location is embedded before it is removed.

No copy of your file is sent to our servers.

## Default result

Output keeps the same width and height as the source. JPEG and WebP are saved at high quality so the visible picture stays sharp while metadata goes away. The download name uses the `cleaned` suffix.

For a deeper look at what might have been in the file, see [what EXIF data reveals](/guides/what-exif-data-reveals).

## How to use it

Add a JPEG, PNG, or WebP photo. Review the metadata panel for camera model, capture date, software, and location flags. Download the cleaned version when you are ready to share.

Stripping tags can slightly change file size because the binary container is rebuilt. [Compress image](/compress-image) can help afterward if you also need a smaller payload.

## Limits

Files must be under 25 MB with no edge longer than 8192 pixels. Work stays on your device from start to finish.
