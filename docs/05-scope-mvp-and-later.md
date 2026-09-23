# Scope: launch, later, and never yet

## Purpose

This document draws the line between what the first build includes, what is designed so it can be added, and what is refused for now. If a task is not listed as launch scope, it waits for [15-adding-a-service.md](15-adding-a-service.md) or an explicit change to this page.

## Launch scope

The first shippable site includes:

**Tools and pages**

- The six phase 1 tools and four social preset pages in [03-service-catalog.md](03-service-catalog.md).
- The image cluster hub, the homepage, and the three guides.
- About, contact, privacy, cookies, terms, and editorial policy.
- A sitemap, `robots.txt`, and unique titles and descriptions from the registry.
- JSON-LD (`WebApplication` on tools, `FAQPage` where FAQs exist, `BreadcrumbList`).

**Product behavior**

- Shared visual system and drop-to-download flow from [10-ux-patterns.md](10-ux-patterns.md).
- Browser processing only. No upload endpoint for images.
- Single-file tools. One image at a time.
- Defaults that produce a downloadable result without a required setting, as specified per tool in [14-mvp-tool-specifications.md](14-mvp-tool-specifications.md).
- Plain-language errors for type, size, and unsupported encode.

**Engineering**

- Laravel app with the file-based registry, one tool layout, and the engine map in [08-architecture.md](08-architecture.md).
- Custom canvas pipeline plus the phase 1 codec allowlist.
- Contact form that sends email. It does not write a ticket database.
- Production host and CDN as in [13-infrastructure-and-costs.md](13-infrastructure-and-costs.md).

**Not required for the first deploy, required before an AdSense application**

- Search Console property and sitemap submission.
- Consent UI wired, even if ad scripts are still absent.
- A pass on Core Web Vitals for the compress page and one preset page, on a phone-sized viewport.

## Designed now, built later

These are specified so launch code does not block them. They are not tasks on the launch checklist.

| Item | Where it is specified | When it becomes work |
| --- | --- | --- |
| Phase 2 image tools | [03-service-catalog.md](03-service-catalog.md) | After phase 1 URLs are indexed |
| Second cluster | Catalog and [06-information-architecture.md](06-information-architecture.md) | After the image cluster has search traffic and at least four new tools are ready together |
| Server processing mode | [08-architecture.md](08-architecture.md) | Only with a written cost note per tool |
| Database tables | [adr/005-files-then-database.md](adr/005-files-then-database.md) | When copy must be edited in production without a deploy |
| Dark theme | [10-ux-patterns.md](10-ux-patterns.md) | After the light UI is the default in production |
| Extra locales | [01-vision-and-goals.md](01-vision-and-goals.md) | After English pages are indexed, as a content project |
| Newsletter | Monetization doc | Optional, footer only, never a download gate |

## Out of scope until a future decision says otherwise

- User accounts, history, and saved files.
- Payments, watermarks, and feature locks.
- Native apps.
- Background removal, AI upscale, bulk ZIP, NSFW, face swap, watermark removal.
- Intervention Image, Imagick, TinyPNG, Cloudinary, remove.bg.
- A separate frontend repository or SPA.
- Kubernetes, queues, or one service per tool.
- A local analytics warehouse.

## Launch checklist

Use this as the gate for calling the site launched. Order follows [16-execution-roadmap.md](16-execution-roadmap.md).

1. Registry lists every phase 1 tool and preset as `live`, and lists nothing else as `live`.
2. Each live URL returns server-rendered HTML with one H1, a guide, and an FAQ.
3. Each tool accepts drop, browse, and paste, shows a result with defaults, and downloads a named file.
4. A 30 MB file and a PDF are rejected with the specified error copy.
5. DevTools network panel shows no image upload while a tool runs.
6. Phone-width layout keeps the drop zone first and the download button visible without an ad between them.
7. Keyboard users can reach the file input, the primary controls, and download.
8. Privacy page matches behavior: images are not uploaded and not retained.
9. Sitemap lists live URLs only. Drafts and non-existent phase 2 slugs are absent.
10. Contact email sends.
11. Lighthouse (or equivalent) on compress and one preset page: LCP and CLS in the good range on mobile, ad slot reserved even while empty.

## What a later build must not violate

- Do not treat "designed now" rows as permission to build them during the launch sprint.
- Do not add a live nav link to a phase 2 tool that fails the admission rules.
- Do not store images "temporarily" on disk as a convenience during launch.
