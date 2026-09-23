# Legal, privacy, and compliance

## Purpose

This document is the product policy the public pages must reflect. It is not legal advice. Before the site takes AdSense or contact data, a qualified person should review the privacy, cookies, and terms pages against the operator's country and the countries visitors come from.

The global English audience means EU/UK GDPR-style expectations and US state privacy laws are in scope even though the interface is English.

## Operator facts the pages must contain

Fill these in when the brand and owner are known. Until then the templates say `[Operator name]`, `[contact email]`, and `[postal address if required]`.

- Who operates the site.
- A contact email that a human reads.
- The country of the operator, once decided.

Do not invent a company, an address, or a registration number.

## Image handling

Launch tools match this statement, which appears in the work area and in the privacy page:

> Images you open are processed in your browser. We do not upload them, and we do not keep a copy.

Consequences for the build:

- No image POST, no temporary files, no logs of pixel data or of EXIF values.
- Server access logs may contain IP addresses and paths, as any host does. They do not contain file contents. Say that.
- If a server-side tool is ever approved, the privacy page and the tool sentence change in the same release: what is uploaded, the maximum retention (measured in minutes and enforced), and who else receives the file (nobody, unless a vendor is named).

GPS and other EXIF values may be shown on the strip tool as categories ("Location is embedded"), on the device, and then discarded with the page. They are not sent to analytics.

## Personal data the site does process

| Data | When | Purpose | Retention |
| --- | --- | --- | --- |
| Contact form: name, email, message | Visitor writes in | Reply to the message | Keep the mailbox copy only as long as needed to handle the thread, then delete. No separate CRM at launch |
| Server logs: IP, user agent, URL, time | Every request | Security and debugging | Follow the host's log rotation, target 30 days or fewer, and state the real number once the host is chosen |
| Consent record | Visitor chooses cookie categories | Prove the choice | As long as the CMP requires, stated on the cookie page |
| Advertising and analytics identifiers | Only after consent where consent is required | Ads and measurement | Described on the cookie page, not used by the tool engine |

There is no account table and no newsletter list at launch. A later newsletter is a new purpose: separate consent, separate text, never a condition of download.

## Cookies and similar storage

The tool itself does not need cookies.

| Category | Launch contents | Default |
| --- | --- | --- |
| Necessary | None expected. If the framework sets a session cookie for the contact flash message, name it here and keep it strictly necessary | Allowed |
| Preferences | Dark theme later, if it stores a choice | Off until the feature exists |
| Analytics | The product chosen in [12-analytics-kpis.md](12-analytics-kpis.md) | Off until the visitor's region allows it |
| Advertising | AdSense tags, once approved | Off until the visitor's region allows it |

Implement Google Consent Mode v2 signals before ad tags load: `ad_storage`, `analytics_storage`, `ad_user_data`, `ad_personalization`.

Rejecting advertising and analytics does not block the tool.

The cookie page lists each cookie or storage key by name once implementation exists. This document does not invent cookie names.

## Pages to publish

| Path | Must say |
| --- | --- |
| `/privacy` | Operator, image handling, the table above, log retention, contact rights (access and deletion of contact mail), children (the site is not directed at children), changes |
| `/cookies` | Categories, consent, how to change the choice, link to privacy |
| `/terms` | Free use, no warranty that a conversion is lossless, visitor is responsible for rights to the images they open, acceptable use (no abuse of the contact form, no illegal content), limitation of liability in the operator's jurisdiction after legal review |
| `/editorial-policy` | Tools and guides are written by the operator, are not paid placements at launch, and do not accept guest posts that exist to hold links. Corrections go to the contact email |
| `/about` | What the site is, the browser-processing promise, how to get in touch. No fake team |
| `/contact` | Form and email |

Acceptable use includes a plain ban on using the site to process material the visitor has no right to process, and on abusive or illegal content. The server cannot inspect images that never arrive. The term still sets expectations and gives a reason to refuse a future server tool.

## Advertising disclosure

When ads run, the privacy page says ads are served by Google and may use the signals allowed by consent. There is no "support us by clicking ads" language. See [04-monetization-adsense.md](04-monetization-adsense.md).

## Children

The site is a general utility and is not aimed at children. Do not add child-directed design or knowingly collect contact details from children.

## Security basics that support the policy

- HTTPS only.
- Contact form: CSRF protection, rate limit, honeypot or equivalent, and no HTML injection into the mail body.
- Markdown from the repo is rendered without raw HTML.
- Dependencies are pinned. Codec packages come from the allowlist only.
- SVG upload is not a launch feature. When `svg-to-png` is built, rasterize safely and do not inline untrusted SVG into the DOM.

## What a later build must not violate

- Do not log file names in a way that is sent to analytics together with identifiers, and do not log image bytes at all.
- Do not add a marketing tracker that loads before consent in regions that require consent.
- Do not claim "we never process personal data" while running AdSense or a contact form. The privacy page should describe the data that actually exists.
- Do not ship a server upload while the work-area sentence still says the image stays on the device.
