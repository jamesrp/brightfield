> Archive notice: Raw, intermediate and superseded review PNGs referenced below are stored outside git. Resolve these repository-relative paths under `BRIGHTFIELD_ART_ARCHIVE`; see [the current pilot README](../README.md) and [source checksums](../source-archive.json). This is a historical process record, not instructions to rerun against the current geometry.

> Historical generation record: the original deep slabs described below were superseded by the plots-and-lanes revision. Current final files use 37.8 px kerbs, earth kerbstones and garden mossy logs. See ../README.md and ../kerb-edits/ for the current process. Current SHA256SUMS and checks.txt reflect the revised files.

# Stage 0 pilot reusable family slabs

Four assets were painted with the built-in imagegen tool, one call per family, using the viewed `assets/tiles/_template/base-plain.png` as the geometry reference and `transparent_background: true`. Exact prompts are in `prompts.json`; original generated files are in `raw/`. No CLI image generation was used.

The generated files were decoded by local path and reserialized to PNG using `@napi-rs/canvas` (the `*-normalized.png` files). Each was then processed by the repository's `fit-tile.cjs`; the initial fit reports are `*-fit.json`.

Earth and garden passed directly. Alloy and arcane had small bottom-edge drift after the initial uniform fit. `compose-geometry.cjs` maps their generated top and side surfaces onto spec-v2 polygons without replacing their painted material. The composed surfaces were passed through `fit-tile.cjs --no-align`; final reports are `*-final-fit.json`.

Final outputs: `assets/tiles/_slab/{earth,garden,alloy,arcane}.png`. All are 1024 × 1536 RGBA with transparent surroundings. All pass `check-tiles.cjs` individually, with 100.0% solid slabs and edge deviations of 1.7, 1.0, 0.6 and 0.6 pixels respectively. `checks.txt` records results and `SHA256SUMS` records final and original-raw checksums. The painted surfaces were visually inspected. No buildings, actors, external shadows, manifest changes, publication or deployment are part of this slab work.

## Opaque reusable side correction

`opaque-sides.cjs` preserves the fitted source in `*-before-opaque-sides.png` and makes only side-face interior alpha fully opaque, retaining the antialiased perimeter. This avoids source-over blending differences when the generated sides have alpha near 253. The canonical final slabs and all Stage 0 tiles use this correction; final side interiors are pixel-identical across Stage0. Final hashes in `SHA256SUMS` supersede earlier fit hashes. Re-run individual slab checks after this step.
