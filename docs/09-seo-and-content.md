# SEO and content

## Purpose

This document defines how pages earn search visibility: templates, structured data, internal links, and the duplicate-content rules that keep preset pages legitimate. It implements the intents in [02-market-and-positioning.md](02-market-and-positioning.md) on the URL map in [06-information-architecture.md](06-information-architecture.md).

## Principles

- One URL, one job, one primary heading.
- The first HTML response contains the title, description, H1, guide, and FAQ. The tool works without that text, and the text is not injected only after JavaScript runs.
- Write for the person doing the job. Name formats, pixel sizes, and the privacy behavior. Skip "best tool" claims and keyword lists.
- Preset pages exist only where the intent differs. They carry their own copy.
- Guides teach. Tools perform. They link to each other and do not duplicate each other's full text.

## Document metadata

From the registry, on every tool and preset:

| Element | Rule |
| --- | --- |
| `<title>` | `seo_title`. Unique. Include the job and, for presets, the platform. Keep it readable, roughly under 60 characters |
| Meta description | `seo_description`. Unique. State the job and that processing stays in the browser, roughly under 160 characters |
| H1 | `title`. One per page. Matches the visible job, not a stuffed keyword variant |
| Canonical | Absolute HTTPS URL of that slug on the chosen host |
| Robots | Index, follow, for `live` pages. Drafts are not routed |

Open Graph title and description reuse the SEO fields. OG image is a single site-wide static card at launch (a simple branded frame, no visitor photo). Do not generate OG images from uploads.

## On-page template

Tool and preset pages, after the work area:

1. Guide sections in `guide.md`: what the tool does, how to use it, what the defaults mean, limits and privacy.
2. FAQ, at least three questions, visible as HTML and mirrored in `FAQPage` JSON-LD.
3. Related links from the registry.

Suggested H2s, rewritten per page so they are not identical across the catalog:

- How this tool handles your image
- Default result
- Limits
- Questions

The social preset's "Default result" states the exact pixel size and whether the image is cropped to cover the frame.

## Structured data

Emit JSON-LD in the server HTML.

**Tool and preset**

- `WebApplication` with `name`, `url`, `description`, `applicationCategory` of `MultimediaApplication`, and `offers` with price `0`.
- `BreadcrumbList`: Home, Images, current page.
- `FAQPage` built only from the visible FAQ. Do not add questions that are not on the page.

**Guide**

- `Article` with headline, description, and date modified from the file's front matter (`updated` in YAML at the top of the guide).
- `BreadcrumbList`: Home, Guides, current guide.

**Hub and homepage**

- `BreadcrumbList` as appropriate.
- Do not mark the homepage up as a review or aggregate rating. There is no review program.

Validate new templates in Google's rich results test once the site is deployed. Fix template bugs once, not per page.

## Duplicate content

Allowed:

- The same engine behind `/resize-image` and `/youtube-thumbnail-resizer`.
- Shared UI chrome and the same privacy sentence.

Not allowed:

- The same guide with "Instagram" replaced by "Facebook".
- A canonical tag on a preset that points at `/resize-image`.
- Query parameters (`?preset=`) indexed as extra URLs. If those parameters exist for UI state, canonical is the clean slug and parameters are not linked internally.
- Paginated doorway pages ("compress image 2", "compress image online free 3").

If two drafts read as interchangeable, publish one URL and put the other size on a chip.

## Guides

Front matter:

```yaml
---
title: WebP vs JPEG
seo_title: WebP vs JPEG for photos on the web
seo_description: When to use WebP or JPEG, and how to convert a photo in the browser.
updated: 2026-09-23
---
```

Each launch guide:

- Answers the question in the first short section.
- Uses concrete numbers (quality 80, typical savings are described honestly as "often smaller", not a fake percentage guarantee).
- Links to the tool that does the job.
- Does not embed a second full tool UI.

Minimum launch set is listed in [03-service-catalog.md](03-service-catalog.md).

## Internal linking

Follow the related-tool table in the information architecture. In addition:

- The compress guide links to `/compress-image` and `/convert-image`.
- The WebP guide links to `/convert-image`.
- The EXIF guide links to `/strip-image-metadata`.
- Preset pages link to `/resize-image` and to one neighboring preset.
- The hub links to every live image URL.

Anchor text names the destination job ("compress a JPEG"), not "click here".

## Discovery

- `sitemap.xml` lists every `live` URL from the registry plus guides and policy pages. It omits drafts.
- `robots.txt` allows the public site and points at the sitemap. It does not block CSS or JS.
- After launch, add the property in Google Search Console and submit the sitemap. Bing Webmaster Tools is optional and useful.
- Request indexing for the homepage, hub, and each phase 1 tool first, then presets and guides.
- Set one canonical host (www or apex) and redirect the other.

## Performance and SEO

Core Web Vitals are a ranking and a UX concern. The compress page's codec download must not delay LCP of the heading and drop zone. Load codecs after the first paint, on that page only. Reserve ad height. Details sit with the UX spec and [12-analytics-kpis.md](12-analytics-kpis.md).

## Writing rules

- English, global. Avoid idioms that assume one country. Use pixels, KB, and MB.
- "We" is the site. Do not claim a company size, a user count, or testimonials that do not exist.
- Do not publish scraped competitor text.
- Update `updated` when a guide's meaning changes.
- When a tool's default changes, change its guide in the same commit.

## What a later build must not violate

- Do not render tool copy only in Alpine.
- Do not generate dozens of city or synonym pages ("compress image New York").
- Do not add FAQ schema for questions the visitor cannot see.
- Do not point preset canonicals at the parent tool.
