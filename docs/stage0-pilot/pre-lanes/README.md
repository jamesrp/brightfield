> Archive notice: Raw, intermediate and superseded review PNGs referenced below are stored outside git. Resolve these repository-relative paths under `BRIGHTFIELD_ART_ARCHIVE`; see [the current pilot README](../README.md) and [source checksums](../source-archive.json). This is a historical process record, not instructions to rerun against the current geometry.

# Brightfield Stage 0 review pilot

This review stops at **four reusable family slabs and eight Stage 0 static tiles**. The remaining 40 tiles continue using the original v0.9 atlases. No actors, travellers, glow layers, Paragons, gameplay changes or deployment are included.

Base branch: `claude/project-thread-8c53rq`, commit `99cd62fcf8821005b260ac3a47c245d78411a7af`. Working branch: `art/stage0-hex-pilot`.

## Review images

- `review/gallery.png`: all 48 tiles, with the eight new Stage 0 tiles labelled NEW.
- `review/closeup-0.png`: the pilot in a dense town.
- `review/board-0.png`: full town and UI.
- `review/stage0-sheet.png`: Stage 0 at gallery size.
- `review/family-slabs.png`: the four reusable materials.

The new artwork covers the board hex instead of leaving the old green rim. The renderer's existing 0.93-radius street gutters remain between tiles. The flat travelling cart visible in the town is the existing inter-tile traveller fallback, not a painted actor in the bases. Those behaviours belong to later renderer/animation work.

## Art and geometry

All 12 new assets were generated separately with built-in imagegen, using the exact slab template and existing atlas style references. Original generated files and verbatim prompts are preserved under `raw/` and `slabs/raw/`. No CLI/API generation was used.

Each output is 1024×1536 RGBA with the spec-v2 pointy hex: centre (512,1040), half-width 480, half-height 354.7, side depth 113. The repository fitter aligns and clips the artwork. Small missing ground-edge wedges are filled behind the painting with the generated earth slab. The well received a targeted imagegen edit first because its initial rear face was too small. No buildings were stretched or repainted procedurally.

Generated side interiors initially had alpha around 253. `slabs/opaque-sides.cjs` makes those interiors opaque before shared-side composition, so the final tiles reuse exactly identical earth side pixels. Antialiased perimeter pixels are preserved. `raw/normalize-utilities.cjs` and `raw/normalize-amenities.cjs` replay the ground infill and shared-side composition from preserved first fits. Prompts, intermediate files, fit and normalization reports, and checksums make the process auditable.

The bases omit the horse/cart, tractor, well bucket, mill wheel and all smoke. The manifest supplies smoke emitter locations for coal plant, cottage and mill. Later painted actors can use the empty routes and attachment points.

## Verification

- `npm run art:check`: eight listed tiles, 100% slab coverage, edges within 1.1 px, all checks pass.
- Four family slabs individually pass, 100% coverage, edges within 1.0 px.
- `npm test`: complete suite, including regression tests for eight loaded pilot images and identical earth side pixels.
- `npm run art:preview`: actual game-renderer gallery and town previews generated.
- Legacy atlas-only tests explicitly use an empty tile manifest so their original footprint and six-image assertions remain valid.
- No gameplay or loader source files changed.

See `qa/` for final logs. Review approval is still required before the next 40 tiles.
