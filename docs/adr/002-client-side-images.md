# ADR 002: Process images in the browser

## Status

Accepted

## Context

AdSense revenue on a new domain is uncertain and slow. Server-side image work costs CPU and bandwidth on every use, and it requires a privacy story about retention. The launch jobs (compress, resize, convert, crop, rotate, strip metadata) are all possible with canvas and established WASM codecs.

## Decision

Phase 1 tools process images only in the visitor's browser. The server sends HTML and scripts. It does not receive the file.

The tool area states that the image stays on the device. There is no upload disk and no temporary directory for visitor images.

A later tool may set `processing` to `server` only with a written cost note and an explicit privacy sentence. That mode is specified so the contract has a place for it. It is not implemented at launch.

## Consequences

- Hosting cost stays close to static-site cost. See [../13-infrastructure-and-costs.md](../13-infrastructure-and-costs.md).
- Very large files and some phone browsers will fail. The specs set a 25 MB and 8192 px ceiling and tell the visitor what to do.
- Compression quality depends on the allowlisted codecs, not on Imagick.
- HEIC is phase 2 because of WASM size, not because the server will convert it.

## Alternatives considered

- **Intervention Image or Imagick on Laravel.** Capable, and it makes every visit a hot path. Rejected for launch.
- **TinyPNG, Cloudinary, or remove.bg.** Fast to integrate, billed per image, and a third party receives the photo. Rejected.
- **Server fallback when WASM fails.** Likely to become the default path under load or on older browsers. Rejected so the privacy sentence stays true.
