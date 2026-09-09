# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2026-09-09

### Added

- Six per-mode marker fields on the object returned by `getMarkerInfo()`: `idPatt`,
  `dirPatt`, `cfPatt` (template matching) and `idMatrix`, `dirMatrix`, `cfMatrix`
  (matrix detection). Each is reported as its real value only in the detection modes
  that populate it, and `-1` otherwise, so `-1` uniformly means "no match" and no
  uninitialised engine memory can reach JavaScript.

### Fixed

- **Combined detection modes are now usable.** `AR_TEMPLATE_MATCHING_COLOR_AND_MATRIX`
  and `AR_TEMPLATE_MATCHING_MONO_AND_MATRIX` previously appeared to detect nothing, or
  intermittently reported the wrong marker on a valid pose. `ar.h` documents `id`/`dir`/
  `cf` as valid only when detection is pattern-only *or* matrix-only, never both; the
  combined modes populate `idPatt`/`idMatrix` instead and never assign `id`. Only the
  invalid family was bound, so consumers read a field the engine never wrote — and since
  `arCreateHandle` never initialises `handle->markerInfo` and that array is reused every
  frame, the value was stale rather than merely wrong. On a zero-filled heap it read `0`,
  which collides with a genuinely registered marker ID, which is why the failure looked
  like a confident wrong detection rather than an error.
  ([#23](https://github.com/AR-js-org/artoolkit5-wasm/issues/23),
  [#25](https://github.com/AR-js-org/artoolkit5-wasm/pull/25))

### Changed

- `id`, `dir` and `cf` are now reported as `-1` in the two combined detection modes,
  where the engine leaves them unassigned. Single modes are unaffected. Nothing could
  have depended on the previous values, which were uninitialised memory.

### Notes

Additive for every existing consumer: the six new fields are new surface, and the only
behavioural change is `id` becoming a defined `-1` in modes where it was previously
garbage. Minor rather than patch because `^0.2.0` would not have picked this up — a 0.x
minor is a breaking bound in semver — and that opt-in is deliberate, since consumers must
read the new fields to benefit.

Unlike `0.2.0`, the Emscripten artifacts **are** rebuilt here, because the C++ changed.
The build configuration is unchanged: `ENABLE_WASM_DEBUG_FLAGS` was `ON` in the cached
cmake configuration, so `dist/artoolkit5.js` and `dist/artoolkit5.wasm` carry the same
`-g2 -s ASSERTIONS=1 --profiling` flags as `0.1.3` and `0.2.0`. This preserves the
existing configuration rather than optimising it — shipping an optimised build is still
blocked on [#19](https://github.com/AR-js-org/artoolkit5-wasm/issues/19), which remains
open. Note that `-DCMAKE_BUILD_TYPE=Release` alone does *not* produce an optimised build
here, since `ENABLE_WASM_DEBUG_FLAGS` is a separate cached option.

Verified against a real camera rather than a mock, with a Hiro pattern marker and a 3x3
barcode marker in frame together across all five detection modes; no mocked test can
reach this class of bug. `examples/webcam.html` gained a detection-mode switcher and
barcode support so the repository can exercise its own combined modes, which it
previously could not.

## [0.2.0] - 2026-08-31

### Added

- Re-exports the seven constants added in
  [`@ar-js-org/artoolkit5-constants@0.3.0`](https://github.com/AR-js-org/artoolkit5-constants/releases/tag/0.3.0):
  the `arLabelingMode` trio (`AR_LABELING_WHITE_REGION`, `AR_LABELING_BLACK_REGION`,
  `AR_DEFAULT_LABELING_MODE`) and the `arMarkerExtractionMode` group
  (`AR_USE_TRACKING_HISTORY`, `AR_NOUSE_TRACKING_HISTORY`, `AR_USE_TRACKING_HISTORY_V2`,
  `AR_DEFAULT_MARKER_EXTRACTION_MODE`).

### Notes

The dependency range moves to `^0.3.0`. A 0.x minor is a breaking bound in semver, so
`^0.2.0` would not have picked this up on `npm install` alone.

Only `dist/index.js` and its map change. The Emscripten artifacts
(`dist/artoolkit5.js`, `dist/artoolkit5.wasm`) are byte-identical to `0.1.3` — this
release rebuilds the TypeScript wrapper only, not the WebAssembly, for the same reason
`0.1.3` was careful to preserve the existing binary: rebuilding it is what silently
switched the shipped artifact from a debug build to a release build in an earlier
revision and broke `examples/webcam.html` (tracked in #19, still open — unrelated to
this release).

## [0.1.3] - 2026-08-15

### Changed

- **Single-sourced constants.** Removed the ~25 ARToolKit5 `constant()` registrations
  from `ARToolKitCore_bindings.cpp`. They duplicated values that
  `@ar-js-org/artoolkit5-constants` generates from the same WebARKitLib headers this
  module compiles against, so the two copies could drift. The constants package is now
  the only source; `src/index.ts` re-exports it in full (55 of 55 constants at the
  time).
- `ERROR_MARKER_INDEX_OUT_OF_BOUNDS` stays bound in the C++ — it is this wrapper's own
  error code, not an ARToolKit5 constant, so nothing upstream generates it.

### Added

- Bound `setMarkerInfoDir`. It was implemented in `ARToolKitCore.cpp` and declared in
  the header, but never exposed to Embind, so it was unreachable from JavaScript
  despite its sibling `setMarkerInfoVertex` — same shape, defined directly below it —
  already being bound.

### Notes

The shipped `dist/artoolkit5.wasm` deliberately stays a **debug** build (`-g2`,
`ASSERTIONS=1`, `--profiling`, unminified). An earlier revision of this release
rebuilt it as a clean Release build, which broke `examples/webcam.html` with
`BindingError: parameter 0 has unknown type` from `getMarkerInfo` — `smoke.html` was
unaffected because it never calls that method. The Release-build regression is real
and is tracked separately in #19; it is not fixed by this release, only avoided by not
triggering it here.

## [0.1.2] - 2026-08-10

### Changed

- Build and publish metadata: package.json fields, the Docker build script, and
  `tsconfig.build.json`, to stabilize the wrapper build.

## [0.1.1] - 2026-06-07

Initial published release.

### Added

- `ARToolKitCore`, bound with Emscripten/Embind (migrated fully from the earlier
  WebIDL approach).
- Camera calibration loading, pattern marker loading, marker detection and
  transformation matrix retrieval (`getTransMatSquare`, `getTransMatSquareCont`,
  `getTransform`).
- `setLabelingMode`/`getLabelingMode`, `setPatternDetectionMode`/
  `getPatternDetectionMode`, `setPattRatio`/`getPattRatio`,
  `setMatrixCodeType`/`getMatrixCodeType`.
- Constants sourced from `@ar-js-org/artoolkit5-constants`.
- `examples/webcam.html` and `examples/smoke.html`.
- CI, and the package published under the `@ar-js-org` npm scope under the MIT
  licence.

[Unreleased]: https://github.com/AR-js-org/artoolkit5-wasm/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/AR-js-org/artoolkit5-wasm/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/AR-js-org/artoolkit5-wasm/compare/v0.1.3...v0.2.0
[0.1.3]: https://github.com/AR-js-org/artoolkit5-wasm/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/AR-js-org/artoolkit5-wasm/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/AR-js-org/artoolkit5-wasm/releases/tag/v0.1.1
