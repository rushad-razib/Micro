# Execution roadmap

## Purpose

This document orders the work after these docs. It stops at a site that is ready to apply for AdSense. It does not schedule income.

Documentation in `docs/` is the current phase and is complete when this set is reviewed. The steps below are the build, in order. Do not start a later step by skipping an earlier gate.

## Phase A — Scaffold the shell

**Outcome:** a deployed Laravel app with no live tools yet, or with tools still in `draft`.

1. Create the Laravel app (current stable) with Blade, Tailwind, Alpine, and Vite.
2. Add the design tokens and the shared header, footer, tool layout, and article layout from [10-ux-patterns.md](10-ux-patterns.md). Empty states only.
3. Implement the registry loader and validator for `content/clusters` and `content/tools`.
4. Wire routes: homepage, cluster hub, tool slug, guides, policy stubs.
5. Generate the sitemap and robots file from the registry.
6. Confirm drafts are absent from the sitemap and return 404.
7. Deploy to the host in [13-infrastructure-and-costs.md](13-infrastructure-and-costs.md) with HTTPS and the CDN. No database server.

**Gate:** a draft tool record renders the shell on a phone-width screen with the drop zone first, and a second record does not require a new layout file.

## Phase B — One engine, then the launch tools

**Outcome:** phase 1 tools pass [14-mvp-tool-specifications.md](14-mvp-tool-specifications.md).

1. Build `canvas-transform` (resize first, including the default 1920 fit).
2. Add crop, rotate and flip, and convert on that engine.
3. Add the four preset records on the same engine. Write their copy before marking them `live`.
4. Build `metadata-strip` with `exifr` and the GPS regression check.
5. Build `squoosh-compress` and confirm its WASM is not downloaded on `/resize-image`.
6. Write the three guides.
7. Fill about, contact (mail plus rate limit), privacy, cookies, terms, and editorial policy with operator placeholders replaced once the owner is known.

**Gate:** the launch checklist in [05-scope-mvp-and-later.md](05-scope-mvp-and-later.md) passes. Network inspection shows no image upload.

## Phase C — Indexation

**Outcome:** the site is a real indexable property, still readable with no ads.

1. Choose the canonical host and redirect the other.
2. Add Search Console and submit the sitemap.
3. Request indexing for the hub and the six tools, then presets and guides.
4. Run mobile Lighthouse on `/compress-image` and `/youtube-thumbnail-resizer`. Meet the good range for LCP and CLS with the ad slot's height reserved and empty.
5. Fix content bugs Search Console reports (duplicate titles, excluded drafts, soft 404s).

**Gate:** live URLs are eligible for indexing and the lab metrics pass. Do not open phase 2 tools in this phase.

## Phase D — Consent and AdSense application

**Outcome:** an application submitted, or a written reason it is still too early.

1. Implement the consent behavior in [04-monetization-adsense.md](04-monetization-adsense.md) and [11-legal-privacy-compliance.md](11-legal-privacy-compliance.md).
2. Confirm the tool still downloads when ads and analytics are denied.
3. Apply only when every phase 1 URL has real copy and the policy pages name the real operator.
4. After approval, add the ad slot exactly where the UX spec allows, set `ads.txt`, and enable Consent Mode signals before tags fire.
5. Watch the policy center. If a page is rejected, fix the page. Do not add doorway URLs.

**Gate:** ads, if present, are outside the drop-to-download path, and a denied consent choice still completes the tool.

## Phase E — Expand

Start only when phase 1 URLs are indexed and Search Console shows real queries.

1. Pick the next service from phase 2 in the catalog, or a new preset only if the copy is unique.
2. Follow [15-adding-a-service.md](15-adding-a-service.md).
3. A second cluster waits until four of its tools are ready to publish together and the image cluster is already receiving search traffic.
4. A server-side tool waits on a cost note plus the ad-revenue check in [12-analytics-kpis.md](12-analytics-kpis.md).
5. Database tables wait until someone must edit copy in production without a deploy. Then implement [adr/005-files-then-database.md](adr/005-files-then-database.md) as written.

## Suggested sequence inside a week of build time

This is an order, not a promise of calendar time.

| Order | Work |
| --- | --- |
| 1 | App, tokens, layouts, registry |
| 2 | Resize engine and its page copy |
| 3 | Crop, rotate, convert |
| 4 | Preset pages and unique copy |
| 5 | Strip metadata |
| 6 | Compress and codec splitting |
| 7 | Guides, policies, contact mail |
| 8 | Deploy, Search Console, vitals |
| 9 | Consent, then AdSense when the gate says so |

## What a later build must not violate

- Do not build phase 2 engines during phase B.
- Do not apply to AdSense from phase A.
- Do not add MySQL as part of scaffolding "so it is ready."
- Do not reorder expansion ahead of indexation because the registry makes it easy.
