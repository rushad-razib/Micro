# Service catalog

## Purpose

This document is the list of services, the phase each one belongs to, and the rules that decide whether a future service is allowed. The build reads this list. It does not invent a parallel catalog in code comments.

A "service" here is a public tool URL. It is not a separately deployed microservice.

## Admission rules

A service is added only when every rule below is true. The checklist in [15-adding-a-service.md](15-adding-a-service.md) is the operational form of these rules.

1. **Demand.** There is a recognizable English search for the job, or the page is a preset of a parent tool with a distinct intent (a social frame, not a synonym).
2. **Cluster.** It belongs to an existing cluster, or it is part of a new cluster that already has a hub and several sibling tools ready to publish together.
3. **Unique copy.** Title, H1, guide, and FAQ are written for that URL. A find-and-replace of another tool's page is not unique.
4. **Processing mode.** It declares `browser` or `server`. Launch services are `browser`. A `server` service needs a written cost note before status becomes `live`.
5. **Policy.** It is compatible with AdSense: no sexual content, no deceptive downloads, no tool whose purpose is copyright circumvention.
6. **Reuse.** If an existing engine can do the job with a preset, the service is a preset page. A new engine is for a job the current engines cannot perform.
7. **Experience.** It uses the shared layout and the drop-to-download rule in [10-ux-patterns.md](10-ux-patterns.md).

Status values are only `draft` and `live`. Draft pages are not linked and are not in the sitemap.

## Phase 1 — launch cluster

One shared in-browser pipeline. All of these ship before any AdSense application.

| ID | Public job | URL slug | Engine | Notes |
| --- | --- | --- | --- | --- |
| `compress-image` | Compress JPEG, PNG, or WebP | `compress-image` | `squoosh-compress` | Real codecs, not canvas-quality alone |
| `resize-image` | Resize by pixels, percent, or max edge | `resize-image` | `canvas-transform` | Default max edge 1920, aspect kept |
| `convert-image` | Convert to JPEG, PNG, or WebP | `convert-image` | `canvas-transform` | AVIF output only when the browser can encode it |
| `crop-image` | Crop, with ratio chips | `crop-image` | `canvas-transform` | Download works with the full frame selected |
| `rotate-image` | Rotate in 90° steps and flip | `rotate-image` | `canvas-transform` | One control applies immediately |
| `strip-metadata` | Remove EXIF, including GPS | `strip-image-metadata` | `metadata-strip` | Re-encode through canvas; `exifr` reports what was found |

Input formats for every phase 1 tool: JPEG, PNG, WebP, and GIF (first frame only, with a visible note). AVIF and BMP are accepted when the browser can decode them. Limits are in [14-mvp-tool-specifications.md](14-mvp-tool-specifications.md).

### Phase 1 preset pages

These URLs reuse `resize-image` (and crop behavior where a frame must be filled). They are separate documents because the search and the default frame differ. They are not separate engines.

| ID | Public job | URL slug | Parent | Default frame |
| --- | --- | --- | --- | --- |
| `resize-instagram` | Resize for Instagram | `resize-image-for-instagram` | `resize-image` | Feed 1080×1350. Story 1080×1920 is a chip on this page |
| `resize-youtube` | YouTube thumbnail | `youtube-thumbnail-resizer` | `resize-image` | 1280×720 |
| `resize-facebook` | Resize for Facebook | `resize-image-for-facebook` | `resize-image` | 1200×630 |
| `resize-linkedin` | Resize for LinkedIn | `resize-image-for-linkedin` | `resize-image` | 1200×627 |

If a preset would match the parent tool's copy with only the platform name changed, it does not get a URL. Put that size on the parent as a chip instead.

### Phase 1 guides

Guides are content URLs, not tools. Minimum set:

| Slug | Job of the page |
| --- | --- |
| `guides/how-to-compress-images-for-the-web` | When and how to compress, with links to the compress tool |
| `guides/webp-vs-jpeg` | Format choice, with links to convert |
| `guides/what-exif-data-reveals` | Privacy of metadata, with a link to strip metadata |

## Phase 2 — later, same cluster

Ship only after the phase 1 URLs are indexed. Still in the browser.

| ID | Public job | Why it waits |
| --- | --- | --- |
| `favicon-generator` | Multi-size favicon download | Different output (a set of files). Uses `jszip`, which is phase 2 on the allowlist |
| `heic-to-jpeg` | HEIC to JPEG | iPhone demand is real; the WASM payload is large and must not load on unrelated tools |
| `watermark-image` | Text or image watermark | Extra controls; easy to make noisy. Needs the shared option-row pattern first |
| `svg-to-png` | Rasterize an SVG | Different input parsing and security care around untrusted SVG |
| `pick-color` | Colors from an image | Output is values, not a file. The result panel pattern still applies |

Phase 2 does not reopen server uploads.

## Deferred

These stay out until a later review says ads cover the cost, or a policy review says the job is allowed. Neither is assumed.

| Job | Why it is deferred |
| --- | --- |
| Background removal | Model weight or a paid API. Both fight the cost model |
| AI upscale | Same as background removal |
| Bulk ZIP of many images | Memory pressure on phones; easy to push work onto the server |
| NSFW, face swap, watermark stripping | AdSense and legal risk |

## Candidate clusters (not scheduled)

A second cluster is documented so the information architecture has a place to put it. It is not a commitment.

| Cluster | Example services | Why it can wait |
| --- | --- | --- |
| Documents | Merge PDF, split PDF, images to PDF | Heavier engines, crowded queries, different privacy copy if files are parsed in WASM |
| Text and developer utilities | Word count, JSON format, Base64 | Different interaction than a drop zone; still must meet the "no account, one primary action" rule |

A candidate cluster is linked from the homepage only when its hub and at least four live tools exist. One orphan tool stays unlisted on the homepage and can still have a URL if it was admitted.

## Homepage and hub contents at launch

- Homepage: the image cluster only, with the six tools and four preset pages grouped as "Social sizes".
- Cluster hub `/images`: the same list, plus links to the three guides.
- No empty clusters, no "coming soon" tool cards.

## What a later build must not violate

- Do not mark a service `live` if its guide is a placeholder paragraph.
- Do not give near-duplicate social sizes their own URLs beyond the four preset pages above without new, specific copy.
- Do not load HEIC, ZIP, or other phase 2 libraries on phase 1 pages.
- Do not add a deferred job (background removal, upscale, bulk server work, NSFW) under a different name to skip this catalog.
