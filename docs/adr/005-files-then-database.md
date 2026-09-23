# ADR 005: Files first, database later

## Status

Accepted

## Context

Launch has no accounts and no stored images. The catalog is dozens of records, each edited rarely and always reviewed. A database would add a server, migrations, and a seed path that can drift from git.

Someone may later need to edit copy in production without a deploy. The table shape should be decided before that day so an admin UI does not invent a loose schema.

## Decision

The source of truth at launch is versioned files under `content/`, loaded by the registry and cached in production. Do not create application tables for clusters, tools, or presets at launch. Do not require a database server in production.

When production editing without a deploy is actually required, add only `clusters`, `tools`, and, if JSON presets become painful, `tool_presets`, using the columns, foreign keys, checks, and indexes in [../08-architecture.md](../08-architecture.md).

Normative constraints:

- Unique slugs and stable keys.
- `tools.cluster_id` is required, `ON DELETE RESTRICT`.
- Status is only `draft` or `live`.
- Preset options live in one JSON value validated by a schema, not a new column per setting.
- Guide body stays markdown.
- Import or publish from the files so git remains the review path until an admin UI replaces it.
- No uploads table and no image blobs.
- Contact mail and analytics do not gain local reporting tables as part of this ADR.

## Consequences

- Adding a launch tool is a commit: a PHP record and a markdown guide.
- Local and production do not need MySQL for the site to serve tools.
- A future migration must match this ADR. Changing the constraints means superseding the ADR.
- Editors without git access are blocked until the database phase is built on purpose.

## Alternatives considered

- **MySQL from day one "for maintainability."** Familiar, and it adds moving parts before there is data that files cannot hold. Rejected for launch.
- **SQLite file in production as a catalog.** Still a second source of truth next to git. Rejected until the editing requirement exists. If a single-file database is chosen then, the same column rules apply.
- **Storing guides as HTML in the database.** Harder to review and easier to break the layout. Markdown stays.
