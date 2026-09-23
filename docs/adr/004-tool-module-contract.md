# ADR 004: Tool module contract

## Status

Accepted

## Context

The site must gain tools after launch without a new layout, nav, sitemap, or ad shell each time. Social pages must reuse the resize engine. Draft tools must stay out of the sitemap.

## Decision

Every public tool is a registry record plus an engine key plus markdown copy. The fields, engine map, and preset rules are normative in [../08-architecture.md](../08-architecture.md).

One Blade layout renders every tool. Navigation, sitemap, related links, and JSON-LD read the registry. A preset page is a record with `preset_of` set, not a second implementation.

New engines register in the client engine map. They are loaded only on records that name them.

Admission of a record follows [../03-service-catalog.md](../03-service-catalog.md) and the checklist in [../15-adding-a-service.md](../15-adding-a-service.md).

## Consequences

- Adding compress-like tools is mostly content and, when needed, one engine module.
- A tool that needs a radically different page (a multi-step editor, an account) does not fit. It needs a new ADR, not a special case in the layout.
- Registry validation is part of the build. Invalid records fail before deploy.
- `processing: server` remains a reserved mode gated by a cost note.

## Alternatives considered

- **One Blade view and one route per tool, copied forward.** Fast at first, then guaranteed drift in ads, privacy text, and metadata. Rejected.
- **A CMS-only model with no engine key.** Fine for prose, insufficient for choosing a codec bundle per page. Rejected.
- **Query-string presets only, no preset URLs.** Fewer pages, and it throws away distinct search intents such as YouTube thumbnail size. Rejected for the four launch presets. Further sizes stay as chips unless copy is genuinely new.
