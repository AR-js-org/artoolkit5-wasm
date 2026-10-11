# passVideoData Direct Copy Implementation Plan (#10)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `ARToolKitCore::passVideoData` copy each frame once, straight into the engine's own buffers, with no per-frame allocation, and reject buffers of the wrong size instead of overflowing the heap.

**Architecture:** The binding signature and return values stay as they are, so no consumer changes. Inside, the C++ validates lengths first, then fills `videoFrame` (and the external luma) with a single `TypedArray.prototype.set` on a `typed_memory_view` of the destination. The `WebARKitLumaInfo` converter is created in `setup()` and released in `teardown()`, instead of once per frame. A new browser page, `examples/passvideodata.html`, detects a barcode from a still image (no camera needed). It is the test for this change and prints before/after timings.

**Tech Stack:** C++20, Emscripten 4.0.17 (Docker `emscripten/emsdk:4.0.17`), embind `emscripten::val` / `typed_memory_view`, plain ES-module HTML served by `npx vite`.

**Spec:** Issue [#10](https://github.com/AR-js-org/artoolkit5-wasm/issues/10) plus the measurements under Findings. No design doc. The order of the other open issues is in [`2026-10-11-open-issues-roadmap.md`](2026-10-11-open-issues-roadmap.md).

## Findings that shaped this plan

Measured on 2026-10-11 against the committed 0.4.1 build (`dist/`, debug configuration), in Chromium (Claude desktop browser pane), 300 iterations after warm-up:

| 1 call | 640×480 | 1280×720 |
|---|---|---|
| `passVideoData(frame, [], true)` today | 1.03 ms | 3.01 ms |
| `detectMarker()` on a blank frame | 0.26 ms | 0.79 ms |
| one `Uint8Array.set` of the whole frame (lower bound for the copy) | 0.07 ms | 0.15 ms |

- **The issue's diagnosis is out of date, but the cost is real.** In Emscripten 4.0.17,
  `convertJSArrayToNumberVector` already copies with one `typed_memory_view(...).set(...)`, not
  element by element. The time goes to everything around it. On every call it allocates two
  `std::vector`s (the frame, w·h·4, and the luma), zero-fills them, and copies the frame a second
  time into `videoFrame`. With internal luma it also allocates and frees a `WebARKitLumaInfo` and
  copies the converter's output. Uploading the frame costs 4× more than detecting the markers.
- `Uint8ClampedArray` → `Uint8Array` `set` is as fast as a same-type `set` (0.066 vs 0.067 ms), so
  there is no need to rewrap the canvas's `Uint8ClampedArray`.
- **Heap overflow:** a frame of `w·h·4 + 4096` bytes returns `0`. `std::copy` writes 4096 bytes
  past the end of `videoFrame`, into whatever the allocator placed next. A short frame leaves the
  previous frame's tail in place. Before `setup()` and after `teardown()` the call returns `0` and
  does nothing.
- **A still image is enough to detect a marker.** `examples/data/marker_05_3x3.jpg` (252×252) drawn
  at (194, 114) on a white 640×480 canvas, with `AR_MATRIX_CODE_DETECTION` and
  `AR_MATRIX_CODE_3x3`, gives `markerNum 1`, `idMatrix 5`, `cfMatrix 1`, `area 43970`. This is the
  automated check AGENTS.md says the repo lacks. It also reaches `getMarkerInfo` on a detected
  marker, the path #19 says needs a camera.
- `-msimd128` is not passed, so `WebARKitVideoLuma`'s SIMD path is never compiled. Out of scope here
  (it changes the build configuration); see the roadmap.

## Decisions

- **No new binding.** The issue's alternatives (expose the buffer pointers, `HEAPU8.set` from JS)
  would cost the same single bulk copy that the C++ `set` already does. They would also give JS a
  view of wasm memory, with the aliasing and heap-growth hazards #41 describes. The bindings file
  is not touched.
- **Exact lengths, checked before anything is written.** A rejected call returns `-1` and leaves
  the previous frame intact.
- **Internal luma ignores `videoLuma` completely**, so the `[]` that artoolkit5-ts, `ARController.js`
  and the README pass keeps working.
- **Keep the shipped debug configuration** (`DEBUG=1`), per #19. Switching to Release is #19's job.
- **Ship as 0.4.2** (milestone `0.4.2`). The public API is unchanged. The only behaviour change is
  that wrong-size input now gets `-1` instead of memory corruption.

## Global Constraints

- Branch `perf/10-passvideodata-copy` from `origin/dev`; the PR targets `dev`. Conventional Commits.
  Plain `git commit`: never `--author` and never `-c user.*`. End each commit message with
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Never edit `third_party/WebARKitLib`.
- `cpp/arjs/artoolkit5/ARToolKitCore_bindings.cpp` is not modified. The signature
  `int passVideoData(emscripten::val videoFrame, emscripten::val videoLuma, bool internalLuma)` is
  not modified.
- The wasm is rebuilt with `DEBUG=1 npm run build:wasm` (Docker), and the regenerated
  `dist/artoolkit5.js` + `dist/artoolkit5.wasm` are committed in the same PR. `build:wrap` is not
  run (no TypeScript changes).
- `npm run lint:cpp` must pass (CI fails otherwise).
- Examples are served with `npx vite` from the repo root (`http://localhost:5173/examples/...`).

## Review Focus

1. Memory grows between frames: a second `setup()` at a larger size grows the heap, and the frame
   must still land in the new buffers. Task 1, check `re-setup at 1280x720`.
2. A canvas whose size differs from `setup()`: it must get `-1`, not partial or overflowing copies.
   Task 1, checks `oversize frame is rejected` / `undersize frame is rejected`.
3. Existing callers pass `[]` as the luma with `internalLuma = true`. That must not be
   length-checked. Task 1, check `still frame, Uint8ClampedArray, internal luma` passes `[]`.
4. `passVideoData` after `teardown()`. Task 1, check `after teardown is rejected`.
5. Legacy callers passing a plain `Array`. Task 1, check `still frame, plain Array, internal luma`.

---

### Task 1: Still-frame check page

**Files:**
- Create: `examples/passvideodata.html`
- Modify: `AGENTS.md` (the `examples/` line of the layout block, and the "Nothing tests the wasm" paragraph)

**Interfaces:**
- Consumes: `loadCameraFromUrl`, `AR_MATRIX_CODE_DETECTION`, `AR_MATRIX_CODE_3x3` from `./../dist/index.js`; the glue `artoolkit5.js` from `?wasm=<dir>` (default `./../dist/`), loaded exactly as `examples/transmat-width.html` does.
- Produces: one line per check, `PASS <name>` or `FAIL <name>: <detail>`. Then `BENCH passVideoData <w>x<h> internal luma: <ms> ms/frame` for 640x480 and 1280x720, and finally `ALL PASS` or `FAILED (<n>)`. `document.title` becomes `PASS` or `FAIL`. Task 2 runs this page.

- [ ] **Step 1: Keep the current build as the baseline**

```bash
mkdir -p build/baseline && cp dist/artoolkit5.js dist/artoolkit5.wasm build/baseline/
```

`build/` is git-ignored. `?wasm=../build/baseline/` loads it.

- [ ] **Step 2: Write `examples/passvideodata.html`**

Same skeleton as `examples/transmat-width.html`: the `?wasm=` handling, `say()`, title. Add a
comment block at the top saying what the page checks and that it needs no camera. Helpers:

- `freshCore(w, h)`: new module plus `new mod.ARToolKitCore()`, `loadCameraFromUrl(mod, core, "./data/camera_para.dat")`, `setup(w, h, cameraId)`, then `setPatternDetectionMode(AR_MATRIX_CODE_DETECTION)` and `setMatrixCodeType(AR_MATRIX_CODE_3x3)`. Returns `{ mod, core, cameraId }`. Each check uses its own module, because the baseline build corrupts the heap on the oversize check.
- `stillFrame(w, h)`: `Uint8ClampedArray` from an `OffscreenCanvas` filled white, with `./data/marker_05_3x3.jpg` drawn 252×252 at `((w - 252) / 2, (h - 252) / 2)`.
- `detectsBarcode5(core)`: `detectMarker()`, then true if any `getMarkerInfo(i).idMatrix === 5` for `i < getMarkerNum()`.
- `jsLuma(frame, w, h)`: `Uint8Array(w * h)`, `(77 * r + 150 * g + 29 * b) >> 8` per pixel (the CCIR 601 weights `WebARKitVideoLuma` uses).

Checks, with these exact names and pass conditions (`ret` is `passVideoData`'s return value):

| name | call | passes when |
|---|---|---|
| `still frame, Uint8ClampedArray, internal luma` | `passVideoData(frame, [], true)` | `ret === 0 && detectsBarcode5` |
| `still frame, Uint8Array, internal luma` | `new Uint8Array(frame.buffer)`, `[]`, `true` | same |
| `still frame, plain Array, internal luma` | `Array.from(frame)`, `[]`, `true` | same |
| `still frame, external luma` | `frame`, `jsLuma(frame, w, h)`, `false` | same |
| `oversize frame is rejected` | `new Uint8Array(w*h*4 + 4096)`, `[]`, `true` | `ret === -1`, and the next call with `frame` returns 0 and detects 5 |
| `undersize frame is rejected` | `new Uint8Array(w*h*4 - 4)`, `[]`, `true` | same as above |
| `wrong-length external luma is rejected` | `frame`, `new Uint8Array(w*h - 1)`, `false` | `ret === -1` |
| `before setup is rejected` | `new mod.ARToolKitCore()` with no `setup`, then `frame`, `[]`, `true` | `ret === -1` |
| `after teardown is rejected` | `core.teardown()`, then `frame`, `[]`, `true` | `ret === -1` |
| `re-setup at 1280x720` | on one core: detect at 640×480, `teardown()`, `setup(1280, 720, cameraId)`, set both modes again, `stillFrame(1280, 720)` | `ret === 0 && detectsBarcode5` |

All of these use w×h = 640×480 unless the row says otherwise. Never call `core.delete()`: `teardown()` followed by the destructor double-frees the pattern handle (see the roadmap).

Benchmark: for 640×480 and 1280×720, `freshCore`, `stillFrame`, 20 warm-up calls, then time 300
calls of `passVideoData(frame, [], true)` with `performance.now()`. Print the mean as a `BENCH` line.
This is informational, not pass/fail.

- [ ] **Step 3: Run it against the baseline and confirm it fails where it should**

Run: `npx vite`, open `http://localhost:5173/examples/passvideodata.html?wasm=../build/baseline/`
Expected: the four `still frame` checks and `re-setup at 1280x720` PASS. `oversize`,
`undersize`, `wrong-length external luma`, `before setup`, `after teardown` FAIL (the baseline
returns `0`). The page ends `FAILED (5)`. BENCH is roughly 1.0 ms and 3.0 ms. Write down the BENCH
numbers for the PR.

- [ ] **Step 4: Mention the page in `AGENTS.md`**

Layout block: `examples/  smoke.html, webcam.html, transmat-width.html, passvideodata.html, node/smoke.mjs (manual checks)`.
Append to the "Nothing tests the wasm" paragraph:
"`examples/passvideodata.html` detects the barcode in `data/marker_05_3x3.jpg` from a still frame,
so it exercises detection and `getMarkerInfo` on a detected marker without a camera."

- [ ] **Step 5: Commit**

```bash
git add examples/passvideodata.html AGENTS.md
git commit -m "test: add a still-frame passVideoData check page (#10)"
```

---

### Task 2: Copy frames straight into the engine buffers

**Files:**
- Modify: `cpp/arjs/artoolkit5/ARToolKitCore.h` (private member next to `videoLuma`)
- Modify: `cpp/arjs/artoolkit5/ARToolKitCore.cpp` (constructor initialiser list, `setup`, `teardown`, `passVideoData`)
- Regenerate: `dist/artoolkit5.js`, `dist/artoolkit5.wasm`
- Modify: `CHANGELOG.md` (`## [Unreleased]`), `README.md` (section 3, "Video Frame Processing & Tracking")
- Test: `examples/passvideodata.html` (Task 1)

**Interfaces:**
- Consumes: the Task 1 page and its check names.
- Produces: `int passVideoData(emscripten::val videoFrame, emscripten::val videoLuma, bool internalLuma)`, with the same signature. It returns `0` on success. It returns `-1`, and writes nothing, when called before `setup()` or after `teardown()`, when `videoFrame.length != width * height * 4`, or when `internalLuma` is false and `videoLuma.length != width * height`. With `internalLuma` true, `videoLuma` is not read. New private member `webarkit::WebARKitLumaInfo* lumaInfo`, `nullptr` whenever the core is not set up.

- [ ] **Step 1: Hold the luma converter for the lifetime of a setup**

- `ARToolKitCore.h`: add `webarkit::WebARKitLumaInfo* lumaInfo;` after `videoLuma`.
- Constructor: `lumaInfo(nullptr)` in the initialiser list.
- `setup()`: after the two buffers are allocated, call
  `webarkit::webarkitVideoLumaFinal(&this->lumaInfo)` (this frees a converter left by an earlier
  `setup`), then `this->lumaInfo = webarkit::webarkitVideoLumaInit(this->width, this->height, true)`.
  `ARLOGe` if it returns `nullptr`. The `true` (SIMD) argument is what the per-frame call passes
  today; without `-msimd128` it falls back to the scalar path.
- `teardown()`: `webarkit::webarkitVideoLumaFinal(&this->lumaInfo);` next to the buffer resets.
  It accepts `nullptr` and nulls the pointer.

- [ ] **Step 2: Rewrite the body of `passVideoData`**

In this order. The parameters shadow the members, so members are always `this->`:

1. If `!this->videoFrame || !this->videoLuma || !this->lumaInfo`, then `ARLOGe` "passVideoData(): no frame buffer, call setup() first." and return `-1`.
2. If `videoFrame["length"].as<size_t>() != static_cast<size_t>(this->videoFrameSize)`, then `ARLOGe` with the received and expected byte counts and return `-1`.
3. If `!internalLuma` and `videoLuma["length"].as<size_t>() != lumaSize` (`width * height`), then `ARLOGe` the same way and return `-1`.
4. Frame copy: `emscripten::val(emscripten::typed_memory_view(this->videoFrameSize, this->videoFrame.get())).call<void>("set", videoFrame);`
5. With `internalLuma`, call `webarkit::webarkitVideoLuma(this->lumaInfo, this->videoFrame.get())` and `std::copy` its `lumaSize` bytes into `this->videoLuma`. Without it, do the same `typed_memory_view` + `set` into `this->videoLuma` from `videoLuma`.
6. Return `0`.

The view is created and consumed inside one statement, and `set` allocates nothing in wasm memory,
so heap growth cannot detach it in between. Remove the two `ARLOGd` "simd" lines and the
`convertJSArrayToNumberVector` calls.

- [ ] **Step 3: Lint**

Run: `npm run format:cpp && npm run lint:cpp`
Expected: exit 0, and `git diff --stat` touches only the two `cpp/arjs/artoolkit5/ARToolKitCore.*` files.

- [ ] **Step 4: Rebuild the wasm in the shipped configuration**

Run: `DEBUG=1 npm run build:wasm`
Expected: the build succeeds and `dist/artoolkit5.wasm` changes. The glue keeps the 0.4.1
configuration: in `dist/artoolkit5.js`, `grep -o` counts are `ASSERTIONS` 5, `assert(` 101,
`checkStackCookie` 5, `ENVIRONMENT_IS_NODE` 3. `git diff --stat dist/artoolkit5.js` is expected
to be empty, because the bound surface did not change. If it is not empty, the diff must not touch
any `ARToolKitCore` registration, and the PR explains it.

- [ ] **Step 5: Run the check page on the new build**

Run: `npx vite`, open `http://localhost:5173/examples/passvideodata.html` (the new `dist/`), then
again with `?wasm=../build/baseline/` in the same browser session.
Expected: new build `ALL PASS`, with each BENCH value at most half the baseline value at both
sizes. Baseline still `FAILED (5)`. Keep both sets of BENCH numbers for the CHANGELOG and the PR.

- [ ] **Step 6: Regression checks**

Run: `examples/transmat-width.html` gives `ALL PASS`. `examples/smoke.html` loads with no console
error. `npm test` passes. `examples/webcam.html` needs a camera and the printed Hiro / barcode
markers: run it if you have them, otherwise write in the PR that it was not exercised.

- [ ] **Step 7: CHANGELOG and README**

`CHANGELOG.md`, under `## [Unreleased]`:
- `### Changed`: `passVideoData` copies the frame straight into the engine's buffer with one bulk
  `TypedArray.prototype.set`, instead of building a `std::vector` on every call and copying it
  again. The luma converter is created in `setup()` and kept across frames. Give the before/after
  ms per frame at 640×480 and 1280×720 from Step 5 (#10).
- `### Fixed`: `passVideoData` returns `-1` and writes nothing when the frame is not exactly
  `width × height × 4` bytes, or, with `internalLuma` false, when the luma buffer is not
  `width × height`. A larger frame used to be copied past the end of the frame buffer, corrupting
  the wasm heap, and a smaller one kept the previous frame's tail. It also returns `-1` before
  `setup()` and after `teardown()`, where it returned `0`.
- `### Notes`: the wasm is rebuilt because the C++ changed, in the same debug configuration (#19).
  No binding changes. artoolkit5-ts and arjs-plugin-artoolkit are unaffected unless they pass a
  buffer of another size, which now fails with `-1` instead of corrupting memory.

`README.md`, section 3: the frame must be the `width × height` RGBA bytes given to `setup()`
(e.g. `getImageData(0, 0, width, height).data`). The second argument is ignored when the third is
`true`. `passVideoData` returns `-1` on a size mismatch. Change the snippet's call to
`core.passVideoData(imageData.data, [], true)`.

- [ ] **Step 8: Commit**

```bash
git add cpp/arjs/artoolkit5/ARToolKitCore.h cpp/arjs/artoolkit5/ARToolKitCore.cpp dist/artoolkit5.js dist/artoolkit5.wasm CHANGELOG.md README.md
git commit -m "perf: copy video frames straight into the engine buffers (#10)"
```

---

## Delivery

1. Push `perf/10-passvideodata-copy` and open a PR into `dev`, titled
   `perf: copy video frames straight into the engine buffers (#10)`, in milestone `0.4.2`. In the
   body: the before/after BENCH table, the checks run, what was not exercised, and `Closes #10`.
2. After the merge, cut 0.4.2 as described in `MAINTAINERS.md`: release PR `dev` → `main`
   (`chore(release): 0.4.2`, `build:wrap` only, so `dist/artoolkit5.*` do not change in the
   release commit), a dry run, then the release. Dispatching the workflow is the maintainer's call.
3. Downstream: nothing is required. Bumping `artoolkit5-ts` to `^0.4.2` gets the speed-up.
