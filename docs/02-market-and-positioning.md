# Market and positioning

## Purpose

This document records who the site serves, which demand it answers first, and how it should be positioned against sites that already rank. It is the reason the launch catalog is images and not a general utility portal.

## Demand

Image chores are persistent, specific, and searched in plain language. People type the job, not the brand: compress an image, resize for Instagram, convert PNG to JPG, crop to a square, remove EXIF, make a YouTube thumbnail. Those queries repeat because every new photo restarts the job.

That demand has three properties that fit this project:

1. **The job is short.** A visitor who finishes in under a minute can still load a page, see an ad, and leave satisfied.
2. **The job can run locally.** Resize, crop, rotate, convert, and compress do not need a server. Hosting cost stays flat as traffic grows.
3. **The queries cluster.** A person who compresses an image often needs a size or a format next. Internal links between tools match real behavior and build topical authority.

Global English is the first market. The same queries exist in many countries, the UI stays in English, and examples use universal sizes (pixels, social frames, KB/MB). Country-specific ID-photo millimetre rules and tax calculators are a different market.

## Why this cluster, and why not a portal on day one

A new domain ranks faster on one topic than on an unrelated catalog. Image tools share an engine, a visual stage, and a privacy sentence ("your image stays in this browser"). Documents, text utilities, and calculators can be later clusters. They do not share that engine, and launching them together would split the site's identity before anything is indexed.

The platform still has clusters, a registry, and a shared page shell, so a second topic is an addition. See [03-service-catalog.md](03-service-catalog.md) and [15-adding-a-service.md](15-adding-a-service.md).

## Competitive frame

Visitors already have choices. The site does not win by claiming to be the only compressor on the internet. It wins by being fast to understand, private by default, and specific about the job.

| Kind of existing product | What people use it for | How this site differs |
| --- | --- | --- |
| All-in-one tool portals | Many unrelated jobs on one domain | Launch stays on images so each page can be deeper and the brand can be about one job |
| Desktop-style editors | Full edits, layers, accounts | One job per URL, no project file, no account |
| Upload-and-process suites | Heavy conversion, including formats a browser cannot encode | Browser processing, a hard file-size ceiling, and an honest message when a format needs a later tool |
| Single-purpose codec demos | Maximum compression control | Sensible defaults, a before/after, and a download. Advanced quality stays one control, not a studio |
| Paid image APIs | Convenience billed per image | No per-image fee and no third-party upload at launch |

Positioning sentence, for internal use until a brand exists:

> Free image tools that finish in the browser. Drop a photo, take the result, leave nothing on our server.

Public pages should sound like that: concrete, short, and free of superlatives ("best", "number one", "AI-powered") unless a sentence is specifically and accurately about a later feature.

## Search intents the launch set answers

| Intent | Page |
| --- | --- |
| Make a JPEG, PNG, or WebP smaller | Compress image |
| Change pixel dimensions or fit a max edge | Resize image |
| Turn a file into JPEG, PNG, or WebP | Convert image |
| Cut a region, including a square or 16:9 | Crop image |
| Turn or mirror a photo | Rotate and flip |
| Remove GPS and camera details | Strip metadata |
| Fit an Instagram feed or story frame | Instagram preset page |
| Make a 1280×720 thumbnail | YouTube thumbnail page |
| Fit a Facebook link image | Facebook preset page |
| Fit a LinkedIn share image | LinkedIn preset page |

Guides support those intents. They do not replace them. A guide such as "WebP versus JPEG" links to convert and compress. It is not a second convert tool with the same interface and thinner copy.

## Audience behavior the product respects

- Most visitors land on a tool URL, not the homepage. The tool must be complete without site orientation.
- Many visitors are on a phone and choose a photo from the camera roll. The file picker and the drop zone are the same action.
- They compare old and new size before they trust a compressor. The result shows both numbers.
- They are wary of upload sites. The page says, near the tool, that the file stays on the device.
- They leave when a page asks them to create an account before download.

## What this positioning excludes

- NSFW tools, face swap, and tools whose purpose is to strip watermarks or circumvent copyright.
- "AI" positioning at launch. Nothing in the launch catalog is a generative model.
- Competing on bulk ZIP processing or on formats that require a server (full HEIC support waits for phase 2 and stays in the browser).

## What a later build must not violate

- Do not broaden the homepage into an unrelated tool directory at launch.
- Do not copy a competitor's page structure so closely that the copy is interchangeable. Each URL needs its own explanation of the job.
- Do not promise offline install, accounts, or pro tiers in launch copy. Those are not in the product.
