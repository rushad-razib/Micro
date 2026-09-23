# MVP tool specifications

## Purpose

Acceptance criteria for every phase 1 tool and preset page. A tool is done when its criteria pass, the shared rules below pass, and the page meets [10-ux-patterns.md](10-ux-patterns.md).

## Shared rules

These apply to every tool and preset in this document.

**Inputs**

- Drop, browse, and paste all open the same handler.
- Accept JPEG, PNG, WebP, and GIF. GIF uses the first frame and shows: "Only the first frame of this GIF is used."
- Accept AVIF or BMP when the browser can decode them. If it cannot, use the decode-failure error.
- Reject other types: "This file is not an image we can open. Use a JPEG, PNG, WebP, or GIF."
- `max_bytes` is 25 MB (`26214400`). Over the limit: "This image is over 25 MB. Choose a smaller file so it can be processed on your device."
- `max_edge` is 8192 px. Over the limit: "This image is larger than 8192 pixels on a side. Export a smaller copy and try again."
- One file at a time. A second file replaces the first after the visitor confirms by dropping it (no confirm dialog; the new file wins) and the previous object URL is revoked.

**Output**

- A result appears without a server request containing the image.
- Download uses `{basename}-{suffix}.{ext}` as in the UX spec.
- Start over returns to the empty state without a reload.
- Options never disable the download button once a result exists.
- The privacy line for browser tools is visible in the work area.

**Non-goals for every launch tool**

- No batch, no ZIP, no accounts, no history, no upload progress to the server (there is no upload).

## Compress image

| | |
| --- | --- |
| Id | `compress-image` |
| Slug | `/compress-image` |
| Engine | `squoosh-compress` |
| Suffix | `compressed` |

**Default path.** On open, compress in the same format: JPEG via mozjpeg at quality 80, WebP via the WebP codec at quality 80, PNG via oxipng lossless. Show before and after previews (or a toggle if side-by-side does not fit on a phone) and both byte sizes.

**Options.** Quality slider from 40 to 95 for JPEG and WebP, default 80, updates the result. PNG has no quality slider; the page says compression is lossless and may already be small. Format stays the input format on this tool. Changing format is the convert tool's job, and the guide links there.

**Done when**

- A typical 2 MB JPEG becomes a smaller JPEG at quality 80, or the UI shows the new size even if a source was already tiny.
- A PNG runs through oxipng and remains a PNG.
- The Squoosh modules are not requested on `/resize-image`.
- If the codec fails, the message is "This image could not be compressed. Try another file or the convert tool." The original is not offered as a fake compressed download.

## Resize image

| | |
| --- | --- |
| Id | `resize-image` |
| Slug | `/resize-image` |
| Engine | `canvas-transform` |
| Suffix | `resized` |

**Default path.** Fit inside 1920×1920 px, keep aspect ratio, do not enlarge a smaller image. Output format matches the input (GIF and exotic decodes become PNG). Show the resulting pixel size and both file sizes.

**Options.** Width, height, percent, and max edge. A lock for aspect ratio, on by default. Editing width recalculates height while locked. Percent 100 and max edge are alternatives; the last edited mode wins and the other fields update to match. Output format select: JPEG, PNG, WebP, default original-equivalent.

**Social chips.** Optional chips on this page (Instagram feed, YouTube, Facebook, LinkedIn) set the frame and link to the dedicated preset URL for visitors who want that page. The chips do not replace those URLs.

**Done when**

- A 4000×3000 JPEG becomes 1920×1440 without a setting change.
- A 800×600 image stays 800×600 and the page does not upscale it.
- Unlocking aspect ratio and setting both dimensions stretches as asked.
- Download is available before the visitor touches a field.

## Convert image

| | |
| --- | --- |
| Id | `convert-image` |
| Slug | `/convert-image` |
| Engine | `canvas-transform` |
| Suffix | `converted` |

**Default path.** If the input is not WebP, export WebP at quality 80. If the input is WebP, export JPEG at quality 90. Show both sizes and the format names.

**Options.** Target format JPEG, PNG, or WebP. AVIF appears only when `toBlob('image/avif')` works; otherwise a note: "This browser cannot create AVIF files. WebP and JPEG are available." Quality slider for JPEG and WebP.

**Done when**

- A PNG becomes a WebP download with no extra click.
- A WebP becomes a JPEG download with no extra click.
- Choosing PNG exports PNG and hides the quality slider.
- An unsupported AVIF encode does not block JPEG or WebP.

## Crop image

| | |
| --- | --- |
| Id | `crop-image` |
| Slug | `/crop-image` |
| Engine | `canvas-transform` |
| Suffix | `cropped` |

**Default path.** The full image is selected, handles are visible, and download returns that full frame in the original format (GIF and exotic decodes become PNG). This is a valid result. The visitor is not forced to crop before download.

**Options.** Drag handles and drag the rect. Ratio chips: Free, 1:1, 4:5, 16:9. Choosing a ratio sets a centered rect of that shape, as large as fits. Output format select as on resize.

**Done when**

- Download works immediately and matches the full image dimensions.
- 1:1 produces a centered square and the preview matches the export.
- The crop rect cannot be dragged outside the bitmap.
- On a phone, handles are large enough to drag.

## Rotate and flip

| | |
| --- | --- |
| Id | `rotate-image` |
| Slug | `/rotate-image` |
| Engine | `canvas-transform` |
| Suffix | `rotated` |

**Default path.** The original orientation is shown. Download of the untouched image is allowed (identity), so the tool is never a dead end. The primary controls are rotate left, rotate right, flip horizontal, and flip vertical. Each applies immediately and can stack (rotate right twice is 180°).

**Done when**

- Rotate right on a 1000×600 image yields 600×1000 and the preview matches.
- Four rotate-right actions return to the start.
- Flip horizontal is visually mirrored and the export matches the preview.
- No setting is required before the first download.

## Strip metadata

| | |
| --- | --- |
| Id | `strip-metadata` |
| Slug | `/strip-image-metadata` |
| Engine | `metadata-strip` |
| Suffix | `cleaned` |

**Default path.** On open, read EXIF with `exifr` and list, in plain labels, any of: camera make and model, date taken, GPS (as "Location is embedded", not a map and not raw coordinates shouted in a giant type), software. Then re-encode at the same pixel size and drop metadata. If no EXIF was found, say "No camera details were found. You can still download a cleaned copy."

**Export.** Same format for JPEG, PNG, and WebP. Quality 0.92 for JPEG and WebP. GIF first frame becomes PNG and the note about the first frame is shown.

**Done when**

- A JPEG with GPS produces a download that `exifr` reads as having no GPS.
- The page does not display a precise street address. "Location is embedded" is enough, then "Removed" after processing.
- The network log shows no image upload.
- The guide on the page links to `/guides/what-exif-data-reveals`.

The page states that rewriting the file can change the byte size slightly even when dimensions stay the same.

## Preset pages

All four use engine `canvas-transform`, `preset_of` = `resize-image`, and the crop-to-frame behavior below.

**Frame rule.** Scale the image to cover the frame (no empty bars), then center-crop to the exact pixel size. The visitor can switch to "fit inside" (contain, with no upscale beyond the source) if they want the whole photo and possible empty margins. Default is cover, because social frames are what these pages promise. State the pixel size next to the preview ("1080 × 1350").

| Id | Slug | Default frame | Other chip | Suffix |
| --- | --- | --- | --- | --- |
| `resize-instagram` | `/resize-image-for-instagram` | 1080×1350 feed | 1080×1920 story | `instagram` |
| `resize-youtube` | `/youtube-thumbnail-resizer` | 1280×720 | None required | `youtube` |
| `resize-facebook` | `/resize-image-for-facebook` | 1200×630 | None required | `facebook` |
| `resize-linkedin` | `/resize-image-for-linkedin` | 1200×627 | None required | `linkedin` |

**Done when, for each preset**

- Opening a 4000×3000 photo downloads the default frame's exact pixel size with no extra click.
- The H1 and the first paragraph name that platform and size, and are not the resize tool's text.
- Canonical URL is the preset path.
- A link to `/resize-image` exists for people who want arbitrary dimensions.
- Instagram's story chip changes the export to 1080×1920 without leaving the page.

## Page content minimum

Each tool and preset ships with:

- `promise` of one sentence.
- Guide of at least four short sections (what it does, how to use it, what the defaults mean, limits).
- At least three FAQs with real answers (privacy, quality or dimensions, supported types).

Placeholder headings fail the launch checklist.

## What a later build must not violate

- Do not change limits in one tool only. Change `max_bytes` and `max_edge` together across launch tools unless a spec revision says a tool differs.
- Do not upscale by default.
- Do not preserve GIF animation in v1 and claim that it was preserved.
- Do not skip the EXIF regression check on the strip tool.
