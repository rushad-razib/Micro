# Adding a service

## Purpose

This is the checklist for a new tool, a preset page, or a new cluster. Follow it in order. Skipping a step is how the site grows a second layout, a duplicate page, or an upload endpoint.

Read [03-service-catalog.md](03-service-catalog.md) for admission rules and [08-architecture.md](08-architecture.md) for the record shape.

## Before writing code

1. Name the job in the visitor's words and write the slug.
2. Confirm the admission rules: demand, cluster, unique copy, processing mode, AdSense policy, engine reuse, shared UX.
3. If an existing engine plus a preset can do the job, stop and use the preset path below. Do not create an engine.
4. If the job needs a package that is not on the allowlist in [07-tech-stack-decision.md](07-tech-stack-decision.md), add it there first, with why it runs in the browser and which pages will load it.
5. If `processing` is `server`, write `content/cost-notes/{id}.md` covering: what is uploaded, how long it is kept, expected CPU and bandwidth per use, and why a browser engine cannot do it. Do not set status to `live` in the same change that introduces the note unless that note is accepted in review.
6. Set status to `draft` until copy and criteria are finished.

## Add a tool

1. Create `content/tools/{id}/tool.php` and `guide.md` with every required field.
2. Add at least three FAQs and a guide of at least four sections, written for this job.
3. Set `related` to live tool ids a visitor might need next.
4. If the engine key is new, add one module under the front-end engine map and load its heavy dependencies only from that module.
5. Mount it with the shared tool layout. Pass `data-engine` and `data-limits`. Do not copy the layout into a new Blade file.
6. Include the browser privacy line, or the server line if this is an approved server tool.
7. Empty, working, done, and error states match [10-ux-patterns.md](10-ux-patterns.md).
8. Defaults produce a download without a required setting, or the spec explains why identity-plus-obvious-controls is the default (as with rotate and crop).
9. Run the registry validator. Broken records fail CI.
10. Check the phone-width page: drop zone first, no ad between drop and download, no horizontal scroll.
11. Check the network log: a browser tool issues no image upload.
12. Flip status to `live`. Footer, hub, and sitemap pick it up from the registry. Do not hand-edit a menu include.

## Add a preset page

1. Create a tool record with `preset_of` set to the parent id and `engine` set to the parent's engine.
2. Put the default frame in `preset` and any extra chips beside it.
3. Write a new H1, promise, guide, and FAQ. If the draft reads like the parent with a noun swapped, it is not ready.
4. Set the canonical path to the preset slug.
5. Link to the parent tool for the general case.
6. Confirm the export pixel size matches the frame on a large photo, with no extra click.
7. Set `live` only then.

## Add a cluster

1. Prepare the hub and at least four tools that pass the tool checklist, still `draft`.
2. Add `content/clusters/{id}.php`.
3. Publish the tools and the hub together.
4. Add the header link only when four tools are `live`. A smaller cluster may exist in the footer if it was admitted, and it stays out of the header.
5. Update [03-service-catalog.md](03-service-catalog.md) so the catalog and the repo do not disagree.

## Copy and UX gate

Refuse the change if any of these are true:

- The drop zone is below a banner, a guide, or an ad.
- Download requires an account, an email, or an "advanced" panel.
- The page introduces a new hero, a new primary-button style, or a wizard.
- The guide is lorem ipsum, a single sentence, or a copy of another guide.
- A phase 2 package is imported by a phase 1 engine.

## After release

- Request indexing for the new URL.
- Add the URL to the internal-link graph of at least one older page, by editing `related` or a guide, so it is not an orphan.
- Watch errors and Core Web Vitals for that URL as in [12-analytics-kpis.md](12-analytics-kpis.md).

## Worked example: compress image

Compress exists to show the intended shape.

- Record id `compress-image`, cluster `images`, engine `squoosh-compress`, processing `browser`.
- The layout is the shared tool layout. The page-specific code is the engine module and the markdown.
- mozjpeg, oxipng, and webp load only after that module loads.
- Social sizes were not added as compress presets. They are resize presets, because the job is a frame, not a smaller file.
- No table was created. The record is a file.

A later tool should be explainable in the same five lines.

## What a later build must not violate

- Do not add a live homepage card for a draft tool.
- Do not create `routes/tools/{slug}.php` per service.
- Do not merge a server tool without a cost note.
- Do not skip the network check.
