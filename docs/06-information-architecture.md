# Information architecture

## Purpose

This document maps URLs, page types, and navigation. The registry is the source of the tool and cluster links. Hand-maintained menus that drift from the registry are a defect.

## URL policy

- English, lowercase, hyphenated slugs.
- Tools live at the root (`/compress-image`), not under `/tools/`, so the slug can match the query language.
- The image hub is `/images`.
- Guides live under `/guides/{slug}`.
- Company and policy pages live at short root paths.
- No trailing slash. One canonical host, HTTPS, decided with the domain in [17-risks-and-open-decisions.md](17-risks-and-open-decisions.md).
- A preset page has its own slug. It does not use a query string as its canonical URL (`/resize-image?preset=instagram` may select a chip, and the canonical remains the preset path when the visitor landed there).

## Launch map

| Path | Type | In sitemap when live |
| --- | --- | --- |
| `/` | Homepage | Yes |
| `/images` | Cluster hub | Yes |
| `/compress-image` | Tool | Yes |
| `/resize-image` | Tool | Yes |
| `/convert-image` | Tool | Yes |
| `/crop-image` | Tool | Yes |
| `/rotate-image` | Tool | Yes |
| `/strip-image-metadata` | Tool | Yes |
| `/resize-image-for-instagram` | Preset tool | Yes |
| `/youtube-thumbnail-resizer` | Preset tool | Yes |
| `/resize-image-for-facebook` | Preset tool | Yes |
| `/resize-image-for-linkedin` | Preset tool | Yes |
| `/guides/how-to-compress-images-for-the-web` | Guide | Yes |
| `/guides/webp-vs-jpeg` | Guide | Yes |
| `/guides/what-exif-data-reveals` | Guide | Yes |
| `/about` | Company | Yes |
| `/contact` | Company | Yes |
| `/privacy` | Policy | Yes |
| `/cookies` | Policy | Yes |
| `/terms` | Policy | Yes |
| `/editorial-policy` | Policy | Yes |
| `/sitemap.xml` | Generated | No |

Phase 2 slugs are not reserved in the launch sitemap. When a phase 2 tool is admitted, its slug is added to the registry and the sitemap follows.

## Page types

### Homepage

- Site name and one sentence: free image tools, processed in the browser.
- The image cluster's live tools, then a "Social sizes" group for preset pages.
- Links to the three guides and to `/images`.
- No empty cluster headings.

### Cluster hub

- H1 is the cluster name ("Image tools").
- Short explanation of the cluster and the privacy line.
- Cards for every live tool in that cluster, including presets.
- Guide links for that cluster.
- This template is reused for a future cluster at `/{cluster-slug}`.

### Tool and preset

One Blade layout. Regions, top to bottom:

1. Header and breadcrumb: Home / Images / tool name.
2. H1 and a single-sentence promise.
3. Work area: drop zone, then result, options, download.
4. On wide screens, the ad slot is beside this column. On narrow screens it is after the download area.
5. Guide (unique).
6. FAQ.
7. Related tools from the registry, as quiet text links.

Preset pages use the same layout. The H1 names the platform job. Options open with that frame already selected.

### Guide

- One H1, several sections, links into the relevant tools.
- FAQ optional.
- No drop zone, unless a short "Open the tool" link is the call to action. The guide is not a second copy of the tool UI.

### Policy and company

- Ordinary article layout, same header and footer.
- Contact includes a form (name, email, message) and the expected response time.

## Navigation

**Header**

- Wordmark to `/`.
- One cluster link, "Images", to `/images`, generated from clusters that have at least one live tool.
- No tool mega-menu at launch. Six tools plus four presets fit on the hub. A mega-menu arrives only when a second cluster is live.

**Footer**

- Live tools, grouped by cluster, from the registry.
- Guides.
- About, contact, privacy, cookies, terms, editorial policy.

**Related links**

Each tool record lists `related` slugs. The page renders those, live records only, in listed order. Suggested launch graph:

| Tool | Related |
| --- | --- |
| Compress | Resize, convert, strip metadata |
| Resize | Crop, compress, Instagram preset |
| Convert | Compress, WebP vs JPEG guide |
| Crop | Resize, Instagram preset, rotate |
| Rotate | Crop, resize |
| Strip metadata | Compress, EXIF guide |
| Instagram preset | Crop, resize, YouTube preset |
| YouTube preset | Resize, Facebook preset |
| Facebook preset | LinkedIn preset, resize |
| LinkedIn preset | Facebook preset, resize |

Breadcrumbs and related links use the registry title, not a hard-coded string in the layout.

## Growth rules

- A new tool URL appears in the footer and on its cluster hub when status is `live`.
- A new cluster appears in the header when it has a hub and at least four live tools. Until then its tools can be live and footered without a header tab.
- Preset pages do not create a new cluster.
- Removed tools are set to `draft` or deleted from the registry, and the URL responds with 410 or a 301 to the closest remaining tool. The choice is recorded in the change that removes them. Silent 404s on previously indexed URLs are avoided.

## Internal link rules

- Every tool links to its cluster hub via the breadcrumb.
- Every guide links to at least one tool.
- The homepage links to every live launch URL in the image cluster.
- Policy pages are one click from the footer on every URL.

## What a later build must not violate

- Do not maintain a second list of tools in a Blade include that can disagree with the registry.
- Do not canonicalize a preset page to `/resize-image`.
- Do not put guides and tools on the same URL.
- Do not add `/tools/` prefixes later for new services while launch tools stay at the root. New services use the same URL policy.
