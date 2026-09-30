## How this tool handles your image

The compressor reads your file on this device and runs real encoders in the browser—MozJPEG for JPEG, OxiPNG for PNG, and WebP codecs where supported. Nothing is sent to a server; the bytes never leave your tab until you choose to download.

GIF files are treated as a single still frame, then compressed like a PNG or JPEG depending on what you pick.

## Default result

JPEG and WebP exports use quality 80, a practical balance for web use. PNG stays lossless. The output keeps the same format as the source unless you change it in the tool.

The downloaded filename adds the `compressed` suffix so you can tell it apart from the original.

## How to use it

Drop a photo onto the page, paste from the clipboard, or use the file picker. Adjust quality if the preview looks too soft or too heavy, then download when you are happy with the size.

For a smaller file after compression, try [resize image](/resize-image) to reduce dimensions, or [convert image](/convert-image) if another format fits your site better.

## Limits

Files up to 25 MB and 8192 pixels on the longest side are supported. Larger images are rejected before processing. All work happens locally in your browser.
