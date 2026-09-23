# Vision and goals

## Purpose

This document states why the site exists, what a successful launch looks like, and which outcomes are out of bounds. Later product and engineering choices are tested against this page.

## Vision

A person with an image and a job — make it smaller, fit a frame, change the format, crop it, turn it, or remove hidden details — finishes that job on one page. The page is calm, current, and obvious. The file never leaves their browser.

The same site can later hold other small tools. Those tools inherit the same page, the same privacy promise for browser work, and the same rule: the visitor can finish without help.

## Who it is for

- People searching in English from anywhere in the world.
- Visitors who arrived from a specific query ("compress jpeg", "youtube thumbnail size", "remove exif") and want the result, not a product tour.
- A single maintainer who will add tools over time and needs each addition to be a registry entry plus copy, not a redesign.

Country-specific tax, visa-photo rules, and local-language UI are outside v1. Pixels and KB/MB are the units on every control.

## Goals

1. **Rank for image-tool queries** in English by publishing a tight cluster of unique, useful pages.
2. **Earn with AdSense** once the site has original content, required policies, and steady search traffic. Income is a lagging result. A new domain usually needs months of indexation before ads matter.
3. **Keep operating cost near the price of a small host and a CDN**, because image bytes are processed locally.
4. **Make every launch tool completable in one motion:** drop, paste, or browse a file, accept the defaults, download.
5. **Leave a contract for the next tool** so a later service does not fork the layout, navigation, sitemap, or ad shell.

## Success definition

Launch is successful when all of the following are true:

- The phase 1 tools and their preset pages in [03-service-catalog.md](03-service-catalog.md) are live, indexable HTML.
- A first-time visitor can finish each launch tool without an account, an email, a wizard, or instructions beyond the labels on the page.
- Each tool page has a unique title, H1, guide, and FAQ. Preset pages are not copies of the parent tool with the name swapped.
- Images are processed in the browser. The privacy page states that plainly.
- Core Web Vitals on a tool page stay in the "good" range on a mid-range phone, with ad slots reserved so they do not shove the drop zone after load.
- The add-a-service checklist in [15-adding-a-service.md](15-adding-a-service.md) can be followed to introduce one new tool without changing the shared layout.

AdSense approval and a target RPM are not launch criteria. They are tracked in [12-analytics-kpis.md](12-analytics-kpis.md) after the site has content.

## Non-goals

- A distributed microservices platform, a queue, or a worker fleet.
- An account system, saved history, or cloud library of visitor images.
- A full photo editor (layers, masks, brushes).
- Background removal, AI upscale, or any paid image API at launch.
- A broad portal that launches documents, developer utilities, and calculators beside images.
- A native mobile app.
- Multi-language UI at launch. A later locale is allowed only after the English cluster is indexed, and only as a deliberate content project.

## Principles a later change must keep

| Principle | Test |
| --- | --- |
| Tool first | The work area is visible when the page loads, on a phone and on a desktop. |
| One motion | The common case needs no setting changed before download. |
| Privacy by default | Browser tools do not upload the file. |
| One cluster until it ranks | New clusters wait until the image pages are indexed. |
| Registry, not rewrites | A new URL is data plus an engine or a preset. |
| Ads follow the task | The path from file to download contains no ad. |

## What a later build must not violate

- Do not redefine success as "number of tools shipped." A thin catalog of unfinished pages fails the vision even if the count is high.
- Do not add a signup wall, a download countdown, or a "share to unlock" step.
- Do not expand into a second cluster because the framework allows it, before the image cluster has indexed pages and some search traffic.
