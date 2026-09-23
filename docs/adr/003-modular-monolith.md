# ADR 003: One modular application

## Status

Accepted

## Context

The product is a catalog of small services that will grow. That word suggests microservices: one deployable unit per tool, a gateway, and separate data stores. The traffic model is the opposite. Most requests are cached HTML. Image work does not touch the server. A solo maintainer has to add a tool without operating a platform.

## Decision

Run one Laravel application. Tools, clusters, and guides are modules inside that app, described by the registry in [004-tool-module-contract.md](004-tool-module-contract.md).

Do not split tools into separately deployed services. Do not add a queue, a service mesh, or a per-tool database.

## Consequences

- One repository, one deploy, one place to change the layout.
- A bad deploy affects every tool. Keep the app small so that risk stays acceptable. Heavy codecs load only on the pages that need them.
- Horizontal scaling, if it is ever required, means more copies of the same app behind the CDN, not a new service boundary.
- Product language may still say "services" for the tools visitors use. Engineering language says "modules" or "tools."

## Alternatives considered

- **Microservices per tool.** Independent scaling that these tools do not need, and a large operational cost. Rejected.
- **A static site plus serverless functions per tool.** Possible for HTML, awkward for the shared registry, mail, and a single layout owned by Laravel, which is the chosen backend. Rejected.
