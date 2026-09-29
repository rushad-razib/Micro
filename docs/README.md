# Image-tools site documentation

This folder is the scope and execution plan for a global English tools site. The site launches as a cluster of image utilities, earns through AdSense, and is built so later tools and clusters plug into the same pages.

No application code lives in this phase. The working product name is **the image-tools site**. A public brand is an open decision; naming criteria are in [17-risks-and-open-decisions.md](17-risks-and-open-decisions.md).

## How to read this set

Read in order if you are new to the project. If you are about to build, start at the architecture decision records, then [08-architecture.md](08-architecture.md), [10-ux-patterns.md](10-ux-patterns.md), and [14-mvp-tool-specifications.md](14-mvp-tool-specifications.md).

| Doc | What it decides |
| --- | --- |
| [01-vision-and-goals.md](01-vision-and-goals.md) | Why the site exists, what success is, what it will not become |
| [02-market-and-positioning.md](02-market-and-positioning.md) | Who it is for, which searches it answers, how it sits next to existing tools |
| [03-service-catalog.md](03-service-catalog.md) | Every tool, its phase, and the rules for admitting another one |
| [04-monetization-adsense.md](04-monetization-adsense.md) | How ads pay for the site without blocking the tool |
| [05-scope-mvp-and-later.md](05-scope-mvp-and-later.md) | Launch scope, designed-but-unbuilt work, launch checklist |
| [06-information-architecture.md](06-information-architecture.md) | URLs, page types, and how navigation grows from the registry |
| [07-tech-stack-decision.md](07-tech-stack-decision.md) | Laravel, Blade, Alpine, Tailwind, and the codec allowlist |
| [08-architecture.md](08-architecture.md) | Tool modules, the canvas pipeline, file catalog, future tables |
| [09-seo-and-content.md](09-seo-and-content.md) | Page templates, schema, and duplicate-content rules |
| [10-ux-patterns.md](10-ux-patterns.md) | Visual system and the drop-to-download interaction |
| [11-legal-privacy-compliance.md](11-legal-privacy-compliance.md) | Privacy, cookies, file handling, editorial policy |
| [12-analytics-kpis.md](12-analytics-kpis.md) | What to measure before and after ads |
| [13-infrastructure-and-costs.md](13-infrastructure-and-costs.md) | Hosting shape and why launch needs no database server |
| [14-mvp-tool-specifications.md](14-mvp-tool-specifications.md) | Behavior and acceptance criteria for each launch tool |
| [15-adding-a-service.md](15-adding-a-service.md) | Checklist for a tool, a preset page, or a new cluster |
| [16-execution-roadmap.md](16-execution-roadmap.md) | Order of work from these docs through an AdSense application |
| [17-risks-and-open-decisions.md](17-risks-and-open-decisions.md) | Brand, domain, and the risks that can sink the project |

Architecture decision records:

- [adr/001-blade-not-spa.md](adr/001-blade-not-spa.md)
- [adr/002-client-side-images.md](adr/002-client-side-images.md)
- [adr/003-modular-monolith.md](adr/003-modular-monolith.md)
- [adr/004-tool-module-contract.md](adr/004-tool-module-contract.md)
- [adr/005-files-then-database.md](adr/005-files-then-database.md)

## Decision summary

These choices are locked. A later build follows them unless an ADR is superseded.

1. **Product.** A catalog of small tools. Launch is one cluster: images for the web and social. Later clusters use the same shell.
2. **Audience.** English, global search. Units are pixels and KB/MB.
3. **Revenue.** AdSense, after real pages, policies, and original copy exist. Ads never sit between the drop zone and the download button.
4. **Processing.** In the browser for v1. Image bytes are not uploaded. A server tool needs a written cost note before it is allowed.
5. **Stack.** Current stable Laravel, Blade, Alpine.js, Tailwind CSS, Vite. One modular app. A separate SPA is out.
6. **Engines.** Custom canvas code for resize, crop, rotate, flip, and ordinary conversion. Squoosh codecs (`mozjpeg`, `oxipng`, `webp`) for real compression. `exifr` only to report removed metadata. No Intervention Image, Imagick, or paid image APIs.
7. **Data.** The catalog is versioned files. Database tables are specified for later and are not created at launch.
8. **Use.** Every tool is finishable with no account, no email, and no wizard. Drop, paste, or browse, keep the defaults, download.
9. **Expansion.** A new tool is a registry entry, an engine (or a preset of an existing engine), and unique copy. It inherits layout, nav, sitemap, and ad slots.

## What a later build must not violate

- Do not split the site into deployable microservices to match the product word "services." The product is a catalog. The runtime is one Laravel app.
- Do not store visitor images.
- Do not ship a tool that hides the primary action behind an account, a mailing list, or a multi-step wizard.
- Do not add an image-processing package that is absent from the allowlist in [07-tech-stack-decision.md](07-tech-stack-decision.md).
- Do not invent a database schema that contradicts [adr/005-files-then-database.md](adr/005-files-then-database.md).
