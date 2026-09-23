# Analytics and KPIs

## Purpose

This document lists what to measure, which tools may measure it, and which numbers must not steer the layout into blocking the download button.

## Measurement product

Use one external product. Preferred at launch: a privacy-respecting analytics tool that can run with aggregated, cookieless measurement where that meets the need (for example Plausible or an equivalent). GA4 is acceptable if Consent Mode is wired and the cookie page names it.

Do not build a local warehouse, and do not send image contents, EXIF, or full filenames to analytics.

Events are optional and small:

| Event | Why |
| --- | --- |
| `tool_open` | A file was accepted, with the tool id, not the filename |
| `tool_download` | A download was offered, with the tool id and output format |
| `tool_error` | `type`, `size`, `decode`, or `codec`, plus tool id |

If the chosen product makes custom events painful, page views alone are enough until ads exist. Do not delay launch for a perfect funnel.

## Search and ads consoles

| System | Use |
| --- | --- |
| Google Search Console | Index coverage, queries, sitemap status. Primary SEO tool |
| Bing Webmaster Tools | Optional second index |
| AdSense | Requests, coverage, RPM, after approval. Not a launch dependency |
| CrUX or a lab run (Lighthouse) | LCP, INP, CLS on the compress page and one preset page |

Check Search Console weekly in the first three months, then with each batch of new URLs.

## KPIs

### Before ads

| Signal | Healthy direction | Not a target to game |
| --- | --- | --- |
| Indexed phase 1 URLs | All live tool, preset, guide, and policy URLs indexed | Publishing extra thin URLs to raise the count |
| Impressions and clicks in Search Console | Rising over months on the tool queries | Buying traffic |
| `tool_download` / `tool_open` when events exist | Most opens reach download | Forcing a download prompt |
| LCP on mobile, compress and one preset | Good threshold (under 2.5 s at the 75th percentile) | Stripping the guide to fake a faster page |
| CLS | Good (under 0.1), including the reserved ad slot | |
| Contact form delivery | A test message arrives | |

### After ads

| Signal | How to read it |
| --- | --- |
| Ad RPM and coverage | Context for whether phase 2 server costs could ever be justified. Not a reason to move the ad into the work path |
| Revenue per thousand sessions versus host bill | The host bill should stay small. If it grows because of uploads, the architecture has been violated |
| Policy-center flags | Stop and fix the page. Do not route around a disapproval with doorway pages |

There is no promised revenue figure. A new domain can sit for months with impressions and little income. That wait is part of the plan, not a signal to launch ten unrelated clusters.

## Review rhythm

| When | Look at |
| --- | --- |
| Each deploy | A tool still downloads, and the compress codecs are not loaded on resize |
| Weekly, first quarter | Search Console coverage and a sample of queries |
| When adding a service | The new URL is indexed and linked, and its LCP is in the same range as resize |
| Before any server-side tool | Ad revenue and the cost note side by side |

## What a later build must not violate

- Do not add a second analytics product "just to compare" without removing or justifying it in this file and on the cookie page.
- Do not record clipboard contents, pixels, or EXIF in events.
- Do not optimize RPM by inserting an interstitial on download.
- Do not treat paid traffic as evidence the catalog should widen.
