# Monetization and AdSense

## Purpose

This document defines how the site is meant to earn, where ads may sit, and which product choices would make ads or approval harder. It is a product policy. It is not a guarantee that Google will approve the site or pay a given rate.

## Model

The site is free to use. The visitor pays with attention on pages that already did the job. There is no account fee, no watermark on the downloaded file, and no "pro" lock on the launch tools.

AdSense is the first network. Affiliates, sponsored tools, and a paid API tier are out of scope until the free tools have search traffic. Adding a paid tier early splits the UX and tempts the page to withhold the download.

Money follows indexation. Plan the build so the site is worth visiting with no ads at all. Apply to AdSense only after the launch checklist in [05-scope-mvp-and-later.md](05-scope-mvp-and-later.md) is done and the phase 1 URLs have been live long enough to be requested for indexing.

## What must exist before an application

- The phase 1 tools, preset pages, and three guides, each with original writing.
- About, contact, privacy, cookies, and editorial pages. See [11-legal-privacy-compliance.md](11-legal-privacy-compliance.md).
- A clear navigation path to those pages from every tool.
- A working contact method that a human answers.
- `ads.txt` once a publisher ID exists. Do not invent a publisher ID in the repo.
- Consent behavior for the global audience, described below.

Thin tool pages (a widget and two sentences) are a known reason tool sites struggle with review. The guide and FAQ under each tool are part of the product, not optional SEO filler.

## Ad placement

The visitor's path is: drop zone → result → download. Ads are outside that path.

| Viewport | Allowed slot | Forbidden |
| --- | --- | --- |
| Wide | One slot beside the tool column, below the header | Any unit between the drop zone and the download button; any unit covering the preview |
| Narrow | One slot after the download area, before the guide | Any unit above the drop zone; sticky units that cover the download button; vignette or other interstitials that fire on the tool action |

Further rules:

- Reserve the slot's height in CSS so a late ad does not push the drop zone.
- At most one ad on a tool page at launch. A second unit is a later experiment, still outside the work path.
- Auto-refresh of ads is off.
- Tool pages must remain usable with the ad blocked or unfilled. Launch before approval already proves this, because slots render nothing until a script is allowed.
- Guides and the cluster hub may carry one in-content unit after the first heading's section. The homepage may carry one unit below the tool list.

## Consent

The audience is global, so the European Economic Area, the United Kingdom, and US state privacy laws are in scope even though the UI is English.

- Load advertising and analytics tags only after the choice the visitor's region requires.
- Support Google Consent Mode v2 signals (`ad_storage`, `analytics_storage`, `ad_user_data`, `ad_personalization`) once ads are enabled.
- The cookie page explains the categories in plain language: necessary, preferences (if any), analytics, advertising.
- Necessary cookies, if the app sets any, are listed by name. Launch should need none for the tool itself, because there is no login and no server session for the image.
- Rejecting ads still leaves the tool working. Consent is not a gate on download.

A consent platform can be a managed CMP later. The behavior above is the requirement. The vendor is an implementation detail recorded in the roadmap when it is chosen.

## What not to build for the sake of revenue

- Tools aimed at sexual content, download circumvention, or scraped media.
- Pages that exist only to hold an ad: empty "coming soon" tools, doorway pages, or social presets with swapped names and the same paragraph.
- Popups that ask for an email before download. A newsletter, if it ever exists, sits in the footer and is optional.
- Incentivized clicks ("click the ad to support us") or any instruction to click ads.
- Image-processing APIs that charge per file. Their cost will exceed a new site's ad revenue, and they contradict the privacy line on the tool.

## Relationship to product metrics

Track RPM, coverage, and viewability after ads run. Do not tune the layout to those numbers by moving an ad into the work path. If a unit underperforms, the allowed response is copy, internal links, and Core Web Vitals, or removing the unit. See [12-analytics-kpis.md](12-analytics-kpis.md).

## What a later build must not violate

- Do not insert an ad slot inside the tool component.
- Do not ship a phase 2 tool that uploads images to a paid API and still calls the site "private" and "free" without stating the new path and its limit.
- Do not apply to AdSense with placeholder guides or lorem ipsum.
