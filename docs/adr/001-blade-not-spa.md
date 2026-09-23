# ADR 001: Blade for the public site

## Status

Accepted

## Context

The site earns when search engines index tool URLs and people finish a job on those pages. Every launch URL needs a unique title, H1, guide, FAQ, and internal links in the first HTML response.

The interactive part is a file drop, a few controls, and a download. Image bytes are processed in the browser.

## Decision

Render the public site with Laravel Blade. Use Alpine.js and small Vite-built engine modules for the work area. Style the site with Tailwind CSS.

Do not build the public site as a React, Vue, or Inertia single-page app.

Livewire is not the tool runner. It may be reconsidered later for non-file forms only.

## Consequences

- Crawlable HTML does not depend on a client router or a separate SSR process.
- One PHP deploy contains pages and the engine scripts.
- Highly app-like state stays inside the tool island. The rest of the page is ordinary HTML.
- A future engineer who wants a SPA must replace this ADR, not bolt a second public frontend beside Blade.

## Alternatives considered

- **Inertia or a standalone SPA.** Stronger client architecture, weaker default indexing, and a second stack to operate. Rejected for the public site.
- **Livewire for image work.** Simple PHP, and it uploads every photo. Rejected because of bandwidth, CPU, and the privacy promise.
- **Blade with no JavaScript.** Cannot crop, compress, or preview locally in a useful way.
