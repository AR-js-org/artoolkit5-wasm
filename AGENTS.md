# artoolkit5-wasm

WebAssembly build of ARToolKit5 ([WebARKitLib](https://github.com/webarkit/WebARKitLib))
for marker tracking in the browser, published as `@ar-js-org/artoolkit5-wasm`.
It is the lowest layer of the AR-js-org ARToolKit family:

```
artoolkit5-constants   integer constants, extracted from the C headers
  artoolkit5-wasm      this repo: the engine compiled to WASM + a thin JS wrapper
    artoolkit5-ts      typed, function-based API on top of this package
      arjs-plugin-artoolkit
```

A change to the binding surface here is a change to every package above it.
Say so in `CHANGELOG.md`.

## Layout

```
cpp/arjs/artoolkit5/
  ARToolKitCore.{h,cpp}       the C++ class wrapping the engine
  ARToolKitCore_bindings.cpp  Embind registration (what JavaScript can see)
third_party/WebARKitLib       git submodule, LGPLv3, vendored — never edit
CMakeLists.txt                the Emscripten build (pattern + barcode only, no NFT)
src/
  index.ts                    createARToolKit(), re-exports the constants
  loader.ts                   loadCameraFromUrl(), addMarkerFromUrl()
dist/                         COMMITTED build output, see below
scripts/                      build-wasm-docker.mjs, clang-format.mjs
examples/                     smoke.html, webcam.html, node/smoke.mjs (manual checks)
docs/                         design notes, e.g. DESIGN-per-mode-marker-fields.md
```

There is **no automated test suite**. CI lints, compiles and builds; it does not
run anything. Verify a change with the examples, and say plainly when you could
not (the webcam example needs a camera and a printed Hiro marker).

## Setup

```bash
git clone --recursive https://github.com/AR-js-org/artoolkit5-wasm.git
# or, in an existing clone:
git submodule update --init --recursive
npm install
```

Node 22 or later. Docker is required for `build:wasm` only.

## Building

| Command | Does | Needs Docker |
|---|---|---|
| `npm run build:wasm` | compiles C++ to `dist/artoolkit5.js` + `dist/artoolkit5.wasm` inside `emscripten/emsdk:4.0.17` | yes |
| `npm run build:wrap` | `clean`, then `vite build` + `tsc` → `dist/index.js`, `dist/index.d.ts`, `dist/loader.d.ts` (+ maps) | no |
| `npm run build` | both | yes |
| `npm run lint:cpp` / `format:cpp` | clang-format check / rewrite of `cpp/**` | no |

`scripts/build-wasm-docker.mjs` reads `BUILD_TYPE` (default `Release`), `DEBUG`
(any value turns on the debug flags), `EMSDK_IMAGE` and `CI` (drops `-it`).

### Things that bite

- **`dist/` is committed, and two different builds write to it.** `build:wasm`
  owns `artoolkit5.js` and `artoolkit5.wasm`; `build:wrap` owns everything else.
  Do not run `build:wasm` unless the C++ changed. Rebuilding the wasm for no
  reason produces a large binary diff and risks changing the configuration (below).
  The 0.2.0 and 0.3.0 release commits ran `build:wrap` only.
- **`ENABLE_WASM_DEBUG_FLAGS` is a cached CMake option, separate from
  `CMAKE_BUILD_TYPE`.** Passing `-DCMAKE_BUILD_TYPE=Release` into an existing
  `build/` does not turn the debug flags off. Use `rm -rf build` first, or pass
  `-DENABLE_WASM_DEBUG_FLAGS=OFF`. A "Release" rebuild that is really a debug
  build looks like it worked. ([#19](https://github.com/AR-js-org/artoolkit5-wasm/issues/19))
- **The shipped wasm is a debug build** (`-g2`, `ASSERTIONS=1`), and a true
  Release build currently breaks `getMarkerInfo` (`BindingError … unknown type`).
  Do not "fix" this by switching to Release without addressing #19.
- **The wasm is not byte-reproducible across machines**, so CI cannot compare it
  with the committed one and does not
  ([#20](https://github.com/AR-js-org/artoolkit5-wasm/issues/20)). If you change
  C++, you rebuild and commit the artifacts yourself; nothing will tell you if you
  forget. Even a comment-only C++ edit can shift line numbers in the DWARF of a
  `-g2` wasm, so "the wasm is unchanged" is not something to assume.
- **Git Bash on Windows** rewrites `-w /src` into a Windows path and Docker exits
  125. Prefix with `MSYS_NO_PATHCONV=1`. The build script also passes `-it`
  unconditionally unless `CI` is set, so it fails from a non-TTY shell
  ([#27](https://github.com/AR-js-org/artoolkit5-wasm/issues/27)); `clang-format.mjs`
  looks only on `PATH`, not in `node_modules/.bin`.
- **Do not edit `third_party/WebARKitLib`.** It is a pinned submodule of an
  upstream project. Bugs found there get recorded as issues here, not patched.

## The JavaScript surface

`createARToolKit(opts?)` returns `{ mod, core, constants }`: the raw Emscripten
module, an `ARToolKitCore` instance, and a frozen constants object. `core` is
untyped (`any`) on purpose; `artoolkit5-ts` is where it gets types.

### Constants come from artoolkit5-constants, not from here

`src/index.ts` does `export * from '@ar-js-org/artoolkit5-constants'` and spreads
it into `constants`. Never write an ARToolKit constant's value into this repo by
hand, and never copy one from a document, an issue or another project: it is
generated from the same headers this wasm is compiled against. The only values
defined here are the wrapper's own marker-kind sentinels (`UNKNOWN_MARKER`,
`PATTERN_MARKER`, `BARCODE_MARKER`).

Any name the constants package adds is re-exported automatically, which can
collide with a name defined here. A local `export const` wins over `export *`
silently. Check the constants changelog when bumping the dependency.

### `getMarkerInfo()` is easy to misread

- It returns an `emscripten::val` that is **an object for a valid index and the
  number `-3` (`MARKER_INDEX_OUT_OF_BOUNDS`) otherwise.** Callers survive today
  because `undefined > -1` is `false`; do not rely on that in new code
  ([#24](https://github.com/AR-js-org/artoolkit5-wasm/issues/24)).
- `id`/`dir`/`cf` are valid only in the single detection modes. The combined
  modes populate `idPatt`/`idMatrix` (and the `dir*`/`cf*` pairs) instead.
  Each per-mode field reads `-1` in the modes that do not populate it, because
  the engine leaves it uninitialised there. Read
  [`docs/DESIGN-per-mode-marker-fields.md`](docs/DESIGN-per-mode-marker-fields.md)
  before touching this.
- Return-contract changes break callers. Decide them deliberately and ship them
  with a version bump, not inside an unrelated change.

### Adding or changing a binding

1. Implement it in `ARToolKitCore.{h,cpp}`.
2. Register it in `ARToolKitCore_bindings.cpp`.
3. `npm run lint:cpp`.
4. `npm run build:wasm`, then commit the regenerated `dist/artoolkit5.*`.
5. Verify in a browser or Node (`examples/`). Say what you could not exercise.
6. Record it in `CHANGELOG.md` under `## [Unreleased]`, including which consumers
   are affected.

State shared across translation units belongs in the `.cpp`, not in a header:
`static ARMarkerInfo gMarkerInfo;` in `ARToolKitCore.h` gives every including
file its own private copy (#24).

## Conventions

- C++20, formatted by `.clang-format` (LLVM base, 4 spaces). CI fails on a lint error.
- TypeScript is `strict` with `noUncheckedIndexedAccess`, `verbatimModuleSyntax`
  and `isolatedModules`. The `src/` entry points are ES modules; `dist/index.js`
  imports the Emscripten glue as a separate file and must not bundle it.
- `src/index.ts` logs `artoolkit5-wasm v<version>` unless `quiet: true`. The
  version is injected from `package.json` by Vite (`__VERSION__`), so it follows
  the package; a stale value means `dist/index.js` was not rebuilt.
- `CHANGELOG.md` follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
  Entries go under `## [Unreleased]`; a version section exists only once it is released.

## Git

- **Branch from `dev`. Every PR targets `dev`.** `main` holds released code and
  receives `dev` only when a release is cut.
- [Conventional Commits](https://www.conventionalcommits.org/): `feat`, `fix`,
  `perf`, `refactor`, `docs`, `test`, `ci`, `build`, `chore`; `!` before the colon
  for a breaking change. Use the same set as `artoolkit5-ts`.

## Licence

This repository's own code is MIT. `third_party/WebARKitLib` is LGPLv3 and the
published `dist/artoolkit5.wasm` is compiled from it, so say so wherever licensing
is described and never remove that notice.

Source files carry no licence header yet. When they do, the copyright holder is
**`AR-js-org`** (the organisation, as in `artoolkit5-ts` and `artoolkit5-constants`);
individual credit goes on an `Author(s):` line. `LICENSE` currently names an
individual and has not been aligned.

## Releasing

There is no automated release workflow yet. Releases so far were made by hand,
and the published 0.3.0 carries no provenance attestation and has no git tag or
GitHub Release (earlier versions are tagged `v0.1.1` … `v0.2.0`; tags are
`v`-prefixed).

A release commit is `chore(release): X.Y.Z` and contains: the version in
`package.json` and `package-lock.json`, `CHANGELOG.md` with `[Unreleased]`
promoted to `## [X.Y.Z] - YYYY-MM-DD`, and `dist/` rebuilt with `npm run build:wrap`.
It must not change `dist/artoolkit5.js` or `dist/artoolkit5.wasm` unless the C++
changed in the same release.

An OIDC (npm Trusted Publishing) workflow is planned. When it lands, replace this
section with its procedure, in the style of `artoolkit5-constants`.
