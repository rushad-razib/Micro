# Risks and open decisions

## Purpose

This document lists decisions still open and the risks that can waste the build. Open decisions are resolved before phase D in the roadmap, and earlier where noted. Risks are watched, not ignored because the architecture is flexible.

## Open decisions

### Brand name

The docs say "the image-tools site" on purpose. Choose a public name before launch copy is final (phase B, policy and about pages).

Criteria:

- Short, spellable, and available as a domain you can actually buy.
- Not easily confused with a well-known editor or a trademark in image software. Search the name before buying.
- Usable after a second cluster exists. A name locked to "JPEG" or "PNG" fights later document or text tools. A name locked to a single verb ("Compresso") fights crop, strip, and future clusters.
- Available as a social handle only if you will use it. Do not block the name on unused networks.

Until the name exists, page titles in specs are job titles ("Compress image"), which remain correct under any brand. The site name is a prefix or suffix, not a replacement for the H1.

### Domain and canonical host

Buy the domain when the name is chosen. Decide apex or `www` before the first production deploy and redirect the other. Set this in the deploy notes and in canonical tags.

### Operator identity

Privacy and terms need a real operator name, contact email, and country. If the site is a personal project, say so. Do not invent a company. Resolve this before phase D, and before phase B if the about page is written then.

### Analytics vendor

Choose one product from the options in [12-analytics-kpis.md](12-analytics-kpis.md) before adding the script. Record the cookie names on `/cookies` at that moment.

### Consent vendor

A managed CMP or a small first-party banner both satisfy the behavior spec. Choose before ad tags exist. The behavior (Consent Mode v2, tool works when ads are denied) is already decided.

### Mail transport

Pick the SMTP provider when the contact form is built. Rate-limit regardless of vendor.

## Risks

| Risk | Why it matters | Response |
| --- | --- | --- |
| Thin content | Tool sites with a widget and a paragraph struggle in search and in AdSense review | Guides, FAQs, and the launch checklist are mandatory. Presets without unique copy are not published |
| Expanding too early | A second cluster before the first is indexed dilutes the site and burns writing time | Phase E stays behind the indexation gate |
| Ads in the work path | Short-term RPM, long-term bounce and policy risk | Placement is fixed in the UX and monetization docs. RPM is not a reason to move the slot |
| Quiet server uploads | A "temporary" fallback breaks the privacy sentence and the cost model | ADR 002. Network check is in the launch checklist and the add-a-service checklist |
| Codec weight | Squoosh on every page hurts LCP | Dynamic import on compress only. Verified in phase B |
| Phone memory | Large images freeze mobile browsers | 25 MB and 8192 px limits, plain errors |
| Duplicate social URLs | Doorway-page pattern | Four presets only, each with its own copy. Further sizes are chips |
| Fake social proof | Invented users, reviews, or company details | Copy rules in the SEO doc. Open decision on the real operator |
| Package sprawl | Random image libraries, paid APIs | Allowlist in the stack doc. New packages edit that doc first |
| Database drift | Two sources of truth | Files only until ADR 005's condition is met |
| Legal overconfidence | These docs are a product policy | Human review of privacy, cookies, and terms before AdSense |
| HEIC demand at launch | iPhone visitors bounce | The page errors clearly, points at JPEG export, and phase 2 can add HEIC in the browser. Do not add a server converter to paper over this |
| AdSense disapproval or low RPM | The project can be correct and still earn little for months | Do not respond by launching unrelated thin tools. Improve the existing pages and vitals |

## Decisions already closed

These are not reopened here. Change them by superseding an ADR or editing the catalog on purpose.

- Launch cluster is images. Audience is global English.
- Blade, Alpine, Tailwind, one Laravel app.
- Browser processing for v1. Named codec allowlist. No paid image APIs.
- File-based catalog. Future tables are specified and not created yet.
- Shared visual system and drop-to-download rule.
- Phase 1 service list and the four preset URLs.

## What a later build must not violate

- Do not fill `[Operator name]` with a fictional brand in production.
- Do not treat an open decision as permission to pick a different architecture.
- Do not answer a stretch of low traffic by shipping the deferred list (background removal, bulk server jobs, extra clusters) in one release.
