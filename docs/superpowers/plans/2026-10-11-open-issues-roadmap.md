# Open Issues Roadmap (2026-10-11)

The order in which the open issues of `AR-js-org/artoolkit5-wasm` get resolved, grouped by
release. Only #10 has a task-level plan so far:
[`2026-10-11-passvideodata-direct-copy.md`](2026-10-11-passvideodata-direct-copy.md). Each of the
others gets its own plan when it is picked up. They touch different subsystems (build, CI,
binding contract, release workflow) and do not belong in one plan.

Owner's priorities (2026-10-11): **#10 first**. **#16 deferred.**

## Milestones

| Milestone | Issues | Kind |
|---|---|---|
| `0.4.2` | #10 | perf + memory-safety fix, no API change |
| `0.5.0` | #19, #20, #24, #41, #47 | optimised build, CI guard, two **breaking** contract changes, release-on-tag |
| none (deferred) | #16, #29 | multi-marker (owner: later); globalID (blocked on Marker-Creator#2) |

The breaking changes (#24, #41) share one minor bump, so `artoolkit5-ts` adapts once.

## Order and dependencies

1. **#10 → 0.4.2.** See its plan. It also adds `examples/passvideodata.html`, which detects a marker
   from a still image. Without it, #19 cannot be reproduced without a camera.
2. **#47** (independent). Do it after 0.4.2 ships, so 0.5.0 is the first release cut by pushing
   a tag. Port `arjs-plugin-artoolkit`'s tag-triggered `release.yml` + `publish.yml`, keep every
   check `release-check.mjs` runs today (against the pushed tag), keep a verify-only `dry_run`
   dispatch, and rewrite `MAINTAINERS.md`. Do not add `registry-url` to `setup-node`.
3. **#19**, the Release build that breaks `getMarkerInfo`. Reproduce it with
   `examples/passvideodata.html` against a true Release build (`rm -rf build`, then
   `npm run build:wasm` without `DEBUG`). It now reaches `getMarkerInfo` for a detected marker
   without a camera. Bisect `ASSERTIONS` and the link optimisation level, using
   superpowers:systematic-debugging. The fix the issue prefers is `value_object<>` bindings
   instead of building `emscripten::val` by hand. Shipping Release is itself a large speed-up
   (no assertions, optimised glue). Revert to the Release default only once the page passes.
4. **#20** depends on #19. First check whether a Release wasm without `-g2` is byte-identical
   between a local Docker build and CI. If it is, restore the
   `git diff --exit-code dist/artoolkit5.*` step. If not, add a script that diffs the embind
   surface. In both cases, also run `examples/passvideodata.html` headless in CI (Playwright),
   which would have caught #19.
5. **#24 + #41**, the contract changes, released together:
   - #24 item 1 is mostly done (0.4.1 defined the globals once). `static const std::array zeros`
     is still in the header and is unused: delete it. Item 2 needs a decision. **Recommended:**
     `getMarkerInfo` returns `null` out of bounds instead of `-3`, typed downstream as
     `MarkerInfo | null`.
   - #41: **Recommended:** return a `Float64Array` *copy*
     (`val::global("Float64Array").new_(typed_memory_view(16, cameraLens))`), not a view. It gives
     consumers the type they want with none of the view hazards the issue lists. It is still
     breaking (`Array` → `Float64Array`). Coordinate with artoolkit5-ts#77.
6. **Release 0.5.0**, with a `BREAKING CHANGE:` footer and the downstream notes.

## Decisions needed from the owner

- #24: `null` (recommended), throw, or an object with a sentinel `id`.
- #41: a `Float64Array` copy (recommended) or a zero-copy view.
- Whether to open the issues below.

## Proposed new issues (not opened yet)

- **Pattern handle lifetime in `ARToolKitCore`.** `teardown()` frees `arPattHandle` without
  clearing the pointer, and the destructor calls `teardown()` again, so `teardown()` followed by
  `delete()` double-frees it. `loadMarker()` deletes the handle when a pattern file fails to load,
  while it is still attached to `arhandle`, so the next detection reads freed memory. A second
  `setup()` leaks the previous handle. Could join #24's cleanup pass.
- **Enable `-msimd128`.** `WebARKitVideoLuma` has a SIMD path that this build never compiles. Worth
  measuring after #10, where luma conversion becomes most of what is left of `passVideoData`.
  It is a build-configuration change (Wasm SIMD: Chrome 91+, Firefox 89+, Safari 16.4+).
- **Headless wasm check in CI.** If it is not folded into #20 (step 4 above).

## Clarified

- #13 is a merged PR (publish metadata), not an issue. The issue the owner meant to defer is #16.
