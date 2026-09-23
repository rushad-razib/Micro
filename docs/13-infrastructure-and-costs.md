# Infrastructure and costs

## Purpose

This document describes the smallest hosting shape that matches the architecture, what it costs in kind, and which upgrades are unjustified at launch.

## Launch shape

| Piece | Choice | Why |
| --- | --- | --- |
| App | One PHP host running Laravel: a small VPS or a reputable shared PHP host | One app, no workers |
| Web server | HTTPS, HTTP/2, the Laravel public directory as the only web root | Normal Laravel deploy |
| PHP | Version required by the chosen Laravel release | |
| CDN | Put one in front (for example Cloudflare) for static assets and HTML caching of anonymous GET pages | Tool pages are cacheable: they contain no visitor data |
| Database server | None in production | Catalog is files. Contact is email |
| Object storage | None | No images to store |
| Queue / Redis | None | No jobs |
| Build | CI or a local production build that runs Vite and produces `public/build` | Codecs are static assets from the JS bundle's dynamic imports |

HTML for tool pages can be cached briefly at the CDN (minutes, not days) once the registry is part of the deploy. Purge the cache on deploy. Do not cache the contact POST.

## Why cost stays flat

The expensive part of an image site is usually CPU and bandwidth for uploads. Launch tools do that work on the visitor's device. Server bandwidth is HTML, CSS, JS, and the codec WASM files.

Consequences:

- The compress page is the heavy download, because it pulls Squoosh codecs. Other tool pages must not.
- Codec files should be long-cached (`immutable` hashed filenames via Vite).
- A traffic spike adds almost no CPU if HTML is cached. It adds bandwidth. A CDN is the right place to absorb that.

## Sizing

Start with the smallest host that runs current Laravel comfortably (1–2 GB RAM is enough for PHP-FPM and a reverse proxy on a VPS). Scale the host only when PHP itself is busy, which should be rare.

Do not buy a database instance, a GPU, or a conversion microservice in anticipation of phase 2. HEIC and favicon work stay in the browser. Revisit this page before any `server` tool.

## Environments

| Environment | Data | Mail |
| --- | --- | --- |
| Local | File catalog, no database required | Log driver |
| Production | File catalog baked at deploy, HTTPS, CDN | Real SMTP to the public contact address |

Secrets: mail credentials and the app key. No API keys for image vendors. Keep secrets out of the repo. `.env.example` lists keys with empty values when the app exists. This documentation phase does not create that file.

## Deploy

1. Install PHP dependencies and build frontend assets.
2. Warm the registry cache.
3. Point the document root at `public`.
4. Purge the CDN HTML cache.
5. Confirm `/compress-image` returns HTML and the network log of a test run shows no image POST.

There is no migration step at launch.

## Cost risks to refuse

| Idea | Why it is a poor trade at launch |
| --- | --- |
| Per-image paid API | Variable cost against uncertain ad revenue |
| Server-side compress "as a fallback" | Quietly becomes the hot path and the bandwidth bill |
| Multi-region app servers | CDN already places static and cached HTML near visitors |
| Storing files "just for an hour" | Disk, privacy copy, and cleanup jobs |

## What a later build must not violate

- Do not require MySQL, PostgreSQL, or Redis for the site to boot in production at launch.
- Do not add an image upload disk to the deploy.
- Do not put codec WASM behind an uncached dynamic route.
