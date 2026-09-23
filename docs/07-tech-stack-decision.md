# Technology stack

## Purpose

This document locks the stack, the split between custom code and packages, and the image libraries that are allowed. Implementation follows it. A new image package is added here before it is added to the app.

## Application stack

| Layer | Choice | Role |
| --- | --- | --- |
| Language | PHP 8.3 or newer, matching the Laravel release in use | Server |
| Framework | Current stable Laravel | Routing, Blade, mail, config cache |
| HTML | Blade | Server-rendered tool pages, guides, policies |
| Interaction | Alpine.js, plus a Vite entry per engine | Drop zone, options, calling the engine |
| Styling | Tailwind CSS | Tokens in [10-ux-patterns.md](10-ux-patterns.md) |
| Build | Vite | JS and CSS only. No visitor image passes through Vite |
| Catalog | PHP config files and markdown in the repo | See [adr/005-files-then-database.md](adr/005-files-then-database.md) |
| Sitemap | A small Laravel package such as `spatie/laravel-sitemap`, or a short generator if that package is awkward | XML from the registry |

The frontend is Blade on purpose. Each tool URL is indexable HTML with a unique title, H1, guide, and FAQ. The interactive island is the work area only. Rationale and rejected alternatives: [adr/001-blade-not-spa.md](adr/001-blade-not-spa.md).

Livewire is not used for tools. It would send image bytes to PHP. It may be used later for ordinary forms if Blade and a single controller action become awkward. The contact form does not need it at launch.

## Custom code

The product is custom:

- Registry loader and cache
- Tool layout, drop zone, paste, browse, before/after, download names, start over
- Preset application (social frames)
- Canvas steps: decode, resize, crop, rotate, flip, and ordinary JPEG / PNG / WebP conversion via `canvas.toBlob` or `OffscreenCanvas`
- Error copy and limits
- SEO partials: title, description, canonical, JSON-LD

Hand-written codecs are not part of the product. They are hard to keep correct and easy to make larger than a known WASM build.

## Package allowlist

Phase 1, loaded only by the engine that needs them:

| Package | Engine | Why it is allowed |
| --- | --- | --- |
| Squoosh `mozjpeg` | `squoosh-compress` | JPEG files actually get smaller at a chosen quality |
| Squoosh `oxipng` | `squoosh-compress` | PNG compression beyond a canvas re-encode |
| Squoosh `webp` | `squoosh-compress` | WebP encode at a chosen quality |
| `exifr` | `metadata-strip` | Read EXIF so the page can say what it removed. Stripping itself is the canvas re-encode |

Pin versions in the lockfile. Load codecs dynamically from the compress page so resize, crop, rotate, convert, and strip do not download them.

Phase 2, not installed for launch:

| Package | Future engine | Why it waits |
| --- | --- | --- |
| `heic2any` or `libheif-js` | `heic-to-jpeg` | Large WASM. Must not ship in the phase 1 graph |
| `jszip` | `favicon-generator` | Only the favicon tool needs a zip |

A package joins this list only if it runs in the browser, has a maintained release, and replaces code we would otherwise get wrong. Record the addition in this file and in the tool spec before merging it.

### Refused for the product

| Approach | Why it is refused at launch |
| --- | --- |
| Intervention Image, Imagick, GD as the tool engine | Moves bytes to the server. Contradicts [adr/002-client-side-images.md](adr/002-client-side-images.md) |
| TinyPNG, Cloudinary, remove.bg, and similar APIs | Per-image cost and a third party receives the photo |
| A general npm "image editor" framework | Fights the small island and the shared UI |
| jQuery and a second CSS framework | Tailwind and Alpine already cover the UI |

Server libraries may appear later only inside a tool whose registry `processing` is `server` and whose cost note is accepted. They still do not become the default engine.

## Laravel packages

Allowed at launch: the framework, Vite plugin, Tailwind, Alpine, a sitemap package, and whatever Laravel needs for mail. Do not add an admin panel, a CMS, or a permission system for launch.

When a database is eventually introduced, Laravel migrations implement [adr/005-files-then-database.md](adr/005-files-then-database.md). Until then the app can use SQLite only if a Laravel feature demands a connection locally. Production launch does not require a database server. See [13-infrastructure-and-costs.md](13-infrastructure-and-costs.md).

## Browser baseline

Support the current and previous major versions of Chrome, Edge, Firefox, and Safari, including iOS Safari. The file picker, clipboard paste of images, canvas, and `createImageBitmap` are required.

AVIF encode is progressive: use it when `canvas.toBlob` accepts `image/avif`. Otherwise the convert tool offers WebP and JPEG and says why AVIF is missing. Do not polyfill AVIF with a large encoder on the convert page at launch.

## What a later build must not violate

- Do not introduce a React, Vue, or Inertia SPA for the public site.
- Do not import phase 2 packages from a phase 1 engine entry.
- Do not add an image package that is not on the allowlist above.
- Do not send the visitor's bitmap to a Laravel controller.
