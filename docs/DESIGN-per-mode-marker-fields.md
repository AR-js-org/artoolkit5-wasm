# Per-Mode Marker Fields in `getMarkerInfo()`

**Status:** Implemented and verified against a real camera, 2026-09-09. Tracked in [#23](https://github.com/AR-js-org/artoolkit5-wasm/issues/23).
**Branch:** `feat/bind-per-mode-marker-fields`
**Unblocks:** [artoolkit5-ts#33](https://github.com/AR-js-org/artoolkit5-ts/issues/33) and its [PR #35](https://github.com/AR-js-org/artoolkit5-ts/pull/35), currently held.

## 1. The problem

Both combined detection modes — `AR_TEMPLATE_MATCHING_COLOR_AND_MATRIX` (3) and `AR_TEMPLATE_MATCHING_MONO_AND_MATRIX` (4) — are unusable from JavaScript. Detection appears to fail entirely, or intermittently reports the wrong marker attached to a valid pose, producing geometry that flashes and sits on the wrong square.

`ARMarkerInfo` (`third_party/WebARKitLib/include/AR/ar.h:197-215`) carries three families of result fields, and the header states their validity explicitly:

```c
int  id;        ///< If pattern detection mode is either pattern mode OR matrix but not both, ...
int  idPatt;    ///< If pattern detection mode includes a pattern mode, ...
int  idMatrix;  ///< If pattern detection mode includes a matrix mode, ...
```

`dir`/`dirPatt`/`dirMatrix` and `cf`/`cfPatt`/`cfMatrix` follow the same rule.

This is a **documented API contract, not an upstream bug.** The engine implements it consistently: `arGetMarkerInfo.c` populates `.id`/`.dir`/`.cf` only for the three single modes, and `arDetectMarker.c` handles combined mode as a first-class case in both the tracking-history carryover (`:251-276`) and the confidence cutoff (`:352-363`), operating purely on the per-mode fields.

`ARToolKitCore::getMarkerInfo()` binds only the `.id` family (`cpp/arjs/artoolkit5/ARToolKitCore.cpp:465-467`), so consumers read a field the engine never wrote.

### Why it fails the way it does

`arCreateHandle()` uses `arMalloc` and never initialises `handle->markerInfo` (`arCreateHandle.c:56`), and that array is reused every frame without clearing. So `.id` in combined modes reads either uninitialised heap or a value left by a different square in an earlier frame. On a zero-filled WASM heap it reads `0` — a *valid* marker ID — which is why the symptom is a confident wrong detection rather than a clean failure.

### The symmetric case

The same hazard exists in the other direction, and any fix must account for it:

- In pattern-only modes, `arPattGetID.c:236` skips the matrix block entirely — `*codeMatrix` is never written, so `idMatrix` is uninitialised.
- In matrix-only mode, `arPattGetID.c:279` skips the template block — `*codePatt` is never written.

Binding all six fields unconditionally would therefore trade one instance of this bug for two.

## 2. Understanding summary

- **What:** add `idPatt`, `idMatrix`, `dirPatt`, `dirMatrix`, `cfPatt`, `cfMatrix` to the object returned by `getMarkerInfo()`, and report each family as `-1` in the modes that do not populate it.
- **Why:** combined detection modes cannot be used from JavaScript today, silently and with no error.
- **Who for:** `artoolkit5-ts` immediately, any JS consumer of this package, and `arjs-plugin-artoolkit` downstream.
- **Constraint:** `dist/` artifacts are committed, so the PR carries rebuilt binaries. Docker build, no local emsdk needed.
- **Constraint:** no test infrastructure in this repo; verification is a real camera.
- **Constraint:** no `-s WASM_BIGINT=1`, which is why `globalID` is out of scope.
- **Non-goals:** `globalID`/uint64; `cutoffPhase`; any test harness; any `artoolkit5-ts` change.

## 3. Assumptions

- **Performance:** six extra scalar `val::set` calls per detected square per frame, negligible beside the `line[4][3]` and `vertex[4][2]` arrays the function already builds on every call. No benchmarking planned.
- **Scale / security:** unchanged. Bounded by `AR_SQUARE_MAX` squares per frame; no new inputs, no user data, no I/O.
- **Reliability:** improves. The `-1` normalisation converts silent wrong-marker detection into a clean miss that existing consumers already handle.
- **Compatibility:** single-mode behaviour is byte-identical. Combined-mode `.id` changes from uninitialised memory to `-1`; nothing could have depended on the former.
- **Maintenance:** roughly ten lines in one function, plus the examples.

## 4. Design

### 4.1 Predicates

Transcribed from the engine's own branch conditions (`arPattGetID.c:197-199` and `:239-242`) rather than written independently. Correctness rests on this correspondence.

```cpp
const int mode = this->arhandle->arPatternDetectionMode;

const bool includesPattern =
    mode == AR_TEMPLATE_MATCHING_COLOR ||
    mode == AR_TEMPLATE_MATCHING_MONO ||
    mode == AR_TEMPLATE_MATCHING_COLOR_AND_MATRIX ||
    mode == AR_TEMPLATE_MATCHING_MONO_AND_MATRIX;

const bool includesMatrix =
    mode == AR_MATRIX_CODE_DETECTION ||
    mode == AR_TEMPLATE_MATCHING_COLOR_AND_MATRIX ||
    mode == AR_TEMPLATE_MATCHING_MONO_AND_MATRIX;

const bool isCombined = includesPattern && includesMatrix;
```

`isCombined` is derived rather than listed separately so the three predicates cannot drift apart if a mode is ever added.

### 4.2 Field population

```cpp
info.set("id",  isCombined ? -1   : markerInfo->id);
info.set("dir", isCombined ? -1   : markerInfo->dir);
info.set("cf",  isCombined ? -1.0 : markerInfo->cf);

info.set("idPatt",  includesPattern ? markerInfo->idPatt  : -1);
info.set("dirPatt", includesPattern ? markerInfo->dirPatt : -1);
info.set("cfPatt",  includesPattern ? markerInfo->cfPatt  : -1.0);

info.set("idMatrix",  includesMatrix ? markerInfo->idMatrix  : -1);
info.set("dirMatrix", includesMatrix ? markerInfo->dirMatrix : -1);
info.set("cfMatrix",  includesMatrix ? markerInfo->cfMatrix  : -1.0);
```

`cf` is `ARdouble` and `ar.h` specifies `-1.0` for invalid confidence, so the sentinel is `-1.0`, not `-1` — mixing them would give the ternary branches different types.

Validity by mode:

| family | real value when mode is | otherwise |
|---|---|---|
| `id` / `dir` / `cf` | `COLOR`, `MONO`, `MATRIX` | `-1` |
| `idPatt` / `dirPatt` / `cfPatt` | `COLOR`, `MONO`, `COLOR+MATRIX`, `MONO+MATRIX` | `-1` |
| `idMatrix` / `dirMatrix` / `cfMatrix` | `MATRIX`, `COLOR+MATRIX`, `MONO+MATRIX` | `-1` |

The object shape is stable in every mode, so it types cleanly downstream. No uninitialised field can reach JavaScript.

### 4.3 Edge cases

- **`markerIndex < 0`** takes the `gMarkerInfo` scratch path and deliberately bypasses the bounds check. The same gating applies. Harmless — callers on this path supply their own vertices and ask for a pose, rather than identifying a marker. Arguably an improvement: that struct's `id` is currently a zero-initialised `0`, which reads as a valid ID.
- **Out of bounds** returns the *number* `MARKER_INDEX_OUT_OF_BOUNDS` (`-3`), not an object. Pre-existing polymorphic return, unchanged here.
- **Unknown or unset mode** leaves both predicates false, so every family reports `-1`. Fail-closed by construction: an unrecognised mode yields "nothing detected" rather than leaking struct memory.
- **Null `arhandle`** is unguarded today and would already dereference on line 458. Pre-existing, unchanged.

## 5. Examples

This repo cannot currently exercise combined modes at all, which is a large part of why the bug survived. That is fixed here rather than deferred.

- **`examples/data/marker_05_3x3.jpg`** — copied from `artoolkit5-ts` (4 KB). No generation needed, which matters because nothing in the organisation generates matrix markers.
- **`examples/ARController.js`** — gains barcode registration and reads per-mode fields:

```js
this.patternMarkers = {};   // pattId    -> state
this.barcodeMarkers = {};   // barcodeId -> state

const info = this.core.getMarkerInfo(i);
if (info.idPatt   > -1 && this.patternMarkers[info.idPatt])   { /* pattern hit */ }
if (info.idMatrix > -1 && this.barcodeMarkers[info.idMatrix]) { /* barcode hit */ }
```

Two registries rather than one keyed map is deliberate. Once the per-mode fields are read, pattern IDs and barcode IDs occupy **separate namespaces**: a pattern with ID 5 and a barcode with ID 5 can coexist unambiguously, because each is looked up via the field that produced it. A single map keyed by raw ID cannot express that.

- **`examples/webcam.html`** — a detection-mode `<select>` calling `setPatternDetectionMode` plus `setMatrixCodeType(AR_MATRIX_CODE_3x3)`, and `trackBarcodeMarker(5, 1.0)` alongside the existing Hiro registration.
- **`examples/Nuova cartella`** — stray empty directory, removed.

### Note for the downstream PR

`artoolkit5-ts`'s `registerMarker` throws when an ID is registered under both types (`src/tracking.ts:117-122`). That guard exists only because the single `.id` field made the families ambiguous. Reading per-mode fields removes the ambiguity, so the guard may no longer be needed — worth revisiting deliberately rather than inheriting.

## 6. Build and release

`npm run build` — Docker-based `build:wasm`, then `build:wrap`. CI runs the same steps.

One `feat:` commit carrying `ARToolKitCore.cpp`, the examples, and the rebuilt `dist/artoolkit5.js` and `dist/artoolkit5.wasm`, matching [#18](https://github.com/AR-js-org/artoolkit5-wasm/pull/18), the last comparable binding change. No version bump in the PR; the release is a separate `chore(release):` commit, as 0.2.0 was.

**Reviewing the artifacts:** the `.wasm` is ~263 KB and shows as `Bin` in the diff, so it cannot be reviewed by eye. Two checks stand in for that.

*The glue diff.* Embind field-name literals are compiled into the WASM data section, **not** into `dist/artoolkit5.js`, so the new names do not appear there. What a clean rebuild produces instead is a uniform shift of the inline-JS address table — every changed line the same address moved by the same constant:

```
-  29428: ($0, $1, $2) => {
+  29476: ($0, $1, $2) => {
```

For this change that was 18 lines, all shifted by exactly +48, and nothing else. Any changed emscripten runtime code, version string, or added/removed function means the toolchain drifted from whatever produced the committed artifacts — stop and investigate rather than commit.

*The binary contains the change.* Confirm directly rather than inferring it from the size delta:

```bash
for s in idPatt idMatrix dirPatt dirMatrix cfPatt cfMatrix; do
  printf "%-10s %s\n" "$s" "$(grep -c "$s" dist/artoolkit5.wasm)"
done
```

All six must be present, and absent from `git show HEAD:dist/artoolkit5.wasm`.

**Do not run `build:wrap`.** It regenerates `dist/index.js` from `src/`, which this change does not touch, so it can only add noise. #18 likewise touched only `artoolkit5.js` and `artoolkit5.wasm`.

**Building from a non-TTY shell:** `npm run build:wasm` passes `docker run -it`, which fails when stdin is not a terminal. Under Git Bash on Windows, MSYS additionally rewrites `-w /src` into a Windows path. Both are avoided by invoking Docker directly:

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "$PWD:/src" -w /src emscripten/emsdk:4.0.17 \
  bash -lc "embuilder build zlib libjpeg && emcmake cmake -S . -B build -DCMAKE_BUILD_TYPE=Release && cmake --build build -j"
```

Making `-it` conditional on `process.stdout.isTTY` would fix this properly for CI and agents; not done here to keep the change focused.

**Version when released: 0.3.0**, not 0.2.1. Six new fields is new API surface, and `.id` changes behaviour in combined modes. `artoolkit5-ts` pins `^0.2.0`, so `0.3.0` forces an explicit downstream opt-in instead of a silent pickup — the right direction, since that repo must change its code to read the new fields anyway.

## 7. Verification

No mocked test can catch this class of bug; only a camera can. With the Hiro pattern and the 3x3 ID-5 barcode both physically in frame:

| mode | `id` | `idPatt` | `idMatrix` |
|---|---|---|---|
| `color` / `mono` | Hiro id | Hiro id | **`-1`** |
| `matrix` | `5` | **`-1`** | `5` |
| `mono+matrix` / `color+matrix` | **`-1`** | Hiro id | `5` |

The bolded cells carry the result:

- The combined-mode row is the fix. Both families must be populated **from a single frame with both markers visible** — that is the acceptance criterion for artoolkit5-ts#33.
- The `-1`s in the single-mode rows are the regression check for the symmetric hazard in §1. Those fields hold uninitialised memory today, so a stable `-1` rather than a plausible-looking integer is what proves the gating works.

**Failure signal:** any bolded cell showing a small non-negative integer means the predicate is wrong — not that a marker was detected.

### Result

**Passed, 2026-09-09.** All five modes exercised against a real camera with both markers in frame, via `examples/webcam.html`. Every cell matched the table, including the negative cases: no barcode under `color`/`mono`, no pattern under `matrix`.

One observation closes the causal loop from §1. `patt.hiro` is assigned **ID 0**, and an uninitialised read on a zero-filled WASM heap also yields `0` — so the stale `.id` did not merely return a wrong number, it returned a number that collided with a genuinely registered marker. That is precisely why the original symptom was "it detects the Hiro marker" with a flashing, mispositioned cube, rather than an obvious failure. The theory predicted the specific wrong answer, not just that the answer would be wrong.

## 8. Decision log

| # | Decision | Alternatives | Why |
|---|---|---|---|
| 1 | Bind six per-mode fields only | +`cutoffPhase`; +`globalID`; all | Smallest change that fixes the bug. `globalID` needs a `uint64` answer and is unverifiable — no markers exist to test against |
| 2 | Report `id`/`dir`/`cf` as `-1` in combined modes, read-time only | Leave as-is; synthesise from `idPatt`/`idMatrix` | Turns silent wrong-marker detection into a clean miss. Synthesising invents a precedence policy ARToolKit deliberately declined to define |
| 3 | Validity-aware flat fields | Bind all six unconditionally; conditional presence | Unconditional binding leaks uninitialised memory for the inactive family in single modes — trades one bug for two. Conditional presence gives an unstable object shape |
| 4 | Predicates transcribed from the engine's own branches | Hand-written mode lists | Correctness rests on matching `arPattGetID.c`, not on a parallel interpretation of it |
| 5 | `isCombined = includesPattern && includesMatrix` | A third explicit mode list | Three independent lists can drift if a mode is added |
| 6 | Unknown mode → all families `-1` | Pass raw values through | Fail-closed; an unrecognised mode must not leak struct memory |
| 7 | One `feat:` commit with C++ + rebuilt `dist/` | Separate `chore(build):` commit | Matches #18, the last comparable binding change |
| 8 | Release as **0.3.0**, bumped separately | `0.2.1` | New API surface plus a behaviour change; `^0.2.0` makes `0.3.0` an explicit opt-in |
| 9 | Full in-repo example demo | Verify only via `artoolkit5-ts`; minimal correctness fix | A repo that cannot exercise its own headline capability is how this bug survived |
| 10 | Two registries in `ARController.js` | Single map keyed by raw ID | Per-mode fields make pattern and barcode IDs separate namespaces — ID 5 can legitimately be both |

## 9. Follow-ups

Deliberately not in this PR:

- **`ARToolKitCore` warts**, to be filed as one issue: `gMarkerInfo` is declared `static` at namespace scope in a header, so each translation unit gets a private copy (benign today, fragile); and `getMarkerInfo` returns a number on out-of-bounds but an object otherwise, which consumers survive only because `undefined > -1` is `false`. Fixing the latter is breaking, so it needs discussion.
- **Possible upstream concern (WebARKitLib, not this binding):** `arDetectMarker.c:294-299` saves tracking history gated on `.id` and matches history records by it. That field is never assigned in combined modes, so history behaviour there looks unreliable regardless of what this binding exposes. Worth confirming separately; it does not block this fix.
- **`globalID`** — see the discussion in [#23](https://github.com/AR-js-org/artoolkit5-wasm/issues/23) and [Marker-Creator#2](https://github.com/AR-js-org/Marker-Creator/issues/2).
