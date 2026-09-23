# UX patterns

## Purpose

This document is the visual system and the interaction contract. Every tool, including tools added later, uses it. A service that needs a tour, a new page layout, or an account has failed this spec.

Ease of use is a release rule, equal to SEO and the module contract.

## Visual system

The interface is calm and current: space over decoration, a short type scale, one accent, soft borders. The image sits on a neutral stage so the photo is not tinted by the chrome.

**Launch theme is light.** People judge skin tones and whites against a light ground. A dark theme may be added later as an optional preference. It is not required for launch, and image previews still sit on a neutral stage if it ships.

**The tool is the hero.** There is no marketing banner, slideshow, or long pitch above the drop zone. The H1 and one sentence sit above the work area. The guide begins below the download.

### Tokens

Implement these as Tailwind theme values so a later tool cannot hard-code a second palette.

| Token | Role | Launch value |
| --- | --- | --- |
| `canvas` | Page background | Warm off-white, near `#f6f5f3` |
| `surface` | Tool card | White |
| `ink` | Primary text | Near-black, not pure `#000` |
| `muted` | Secondary text | Stone gray with contrast at least 4.5:1 on `canvas` for body and on `surface` for labels |
| `accent` | Primary button, focus ring | One deep teal or blue, used only for the primary action and links |
| `line` | Borders | Low-contrast warm gray |
| `stage` | Behind the image preview | Neutral `#eceae6`, never the accent |
| Radius | Cards and controls | One modest radius, about 12px on the card and 8px on controls |
| Space | Stacking | 8px base. The work area has more padding than the guide |
| Type | UI | A single sans family already common on the OS stack, or one webfont with a metric-matched fallback. No display face in the tool |
| Type scale | UI | Four sizes only: H1, section heading, body, label |

Do not add a second accent for success. The download button is the accent. Completed state is communicated with the preview and the size numbers, not a new color system.

### Shared components

| Component | Behavior |
| --- | --- |
| Drop zone | Dashed surface, short instruction ("Drop an image, paste, or browse"), visible on load |
| File button | Inside the drop zone, large enough for a thumb (at least 44px target) |
| Option row | Labeled controls under or beside the preview. Never a modal required to finish |
| Stage | Before/after or single preview on `stage` |
| Size line | Old size and new size in KB or MB, one decimal under 10 MB, whole numbers above |
| Download | One primary button, accent, verb plus filename hint ("Download portrait-compressed.jpg") |
| Start over | Text button, clears memory and revokes object URLs, no reload |
| Related | Text links under the FAQ, not cards competing with download |
| Error | Inline, under the drop zone, plain language and the next step |

A new service skins this set. It does not introduce a new hero, a new button style, or a wizard chrome.

## Interaction

### The path

1. Page loads with the drop zone in view. On a 390px-wide screen the H1, the one-line promise, and the drop zone are visible without scrolling past an ad.
2. The visitor drops a file, pastes an image, or uses the file picker. All three call the same open handler.
3. The tool applies defaults and shows a result. Compress, resize, convert, and crop do this without a required extra click. Rotate applies when a direction is pressed, and the preview updates immediately. Strip metadata finishes as soon as the file is read.
4. Options sit with the result and update it. They never disable download.
5. Download saves a sensible filename. Start over returns to the empty drop zone without a reload.

### Defaults

Empty controls are not a puzzle. Each launch tool's defaults are in [14-mvp-tool-specifications.md](14-mvp-tool-specifications.md). If a default would destroy information (a surprise 90° rotate, a surprise square crop), the default is the identity operation and the controls are obvious. Crop therefore opens with the full frame selected and handles visible. Rotate opens with the original orientation and large rotate buttons.

### Filenames

`{original-basename}-{tool-suffix}.{ext}`

Examples: `portrait-compressed.jpg`, `portrait-resized.webp`, `portrait-instagram.jpg`. If the original name is missing, use `image`. Sanitize to a safe basename. Do not append a random marketing string.

### Errors

| Condition | Message intent |
| --- | --- |
| Not an image | Say the file is not an image and list JPEG, PNG, WebP, and GIF |
| Over the size limit | Say the limit in MB and that smaller files run on the device |
| GIF | Accept the first frame and say so next to the preview |
| Browser cannot encode AVIF | Offer WebP and JPEG. Do not fail the whole tool |
| Decode failure | Say this file could not be read and ask for another export of the same photo |
| Codec still loading | Show a quiet "Preparing compressor…" on the button, only on the compress tool. Other tools do not wait on Squoosh |

Errors do not use browser `alert`.

### Working state

- The preview appears as soon as the bitmap is ready. A compressor may update the "after" size when the codec finishes.
- If work exceeds about 300 ms, show a determinate or calm progress label on the stage ("Compressing…"). Do not cover the page with a modal spinner.
- The visitor can press Start over during work. In-flight results are discarded.

### Accessibility

- The file input is keyboard reachable and has an accessible name.
- Paste works when the tool region is focused; the page listens for paste of image clipboard data without requiring the visitor to find a hidden target.
- Focus ring uses `accent` and is visible on the canvas background.
- Controls have visible labels, not placeholder-only labels.
- Color is not the only signal for errors.
- The before/after control, if present, is a button with an accessible name, not a drag-only handle.
- Respect `prefers-reduced-motion`: no ornamental motion. A short opacity change on the stage is enough.

### Phone

- Single column. Drop zone first.
- Option controls stack. Numeric fields are at least 44px tall and use numeric keyboards where the value is a number (`inputmode="numeric"`).
- The download button is full width under the stage.
- No horizontal page scroll. Previews scale inside the stage.
- The ad slot, when present, is below the download button.

### Ads and copy

Specified in [04-monetization-adsense.md](04-monetization-adsense.md) and repeated here because it is a UX rule: nothing between the drop zone and the download button. The guide and FAQ start after the work area.

## Empty, working, done, error

| State | What the visitor sees |
| --- | --- |
| Empty | Drop zone and the one-line promise. Options hidden until a file exists, except preset pages may show the selected frame name |
| Working | Stage with the original, plus a short progress label if needed |
| Done | Preview, old size, new size, options, Download, Start over |
| Error | Drop zone remains, error text with the next step, no partial download of a failed file |

## What a later build must not violate

- Do not require an account, an email, a rating, or a share before download.
- Do not put the guide, a carousel, or an ad above the drop zone.
- Do not ship a tool with a unique layout "just this once."
- Do not use a pure black page or an accent-colored stage behind photos at launch.
- Do not disable Download until the visitor opens an "advanced" disclosure.
