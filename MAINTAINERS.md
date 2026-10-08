# MAINTAINERS.md

Operational notes for cutting a release of `@ar-js-org/artoolkit5-wasm`.

[`AGENTS.md`](AGENTS.md) covers the day-to-day: layout, builds, conventions and the
branching flow. This file covers what only comes up at release time.

## The release in one paragraph

Releases are cut by dispatching the **Release** workflow by hand, from `main`, with a
version number. It tags the commit (`vX.Y.Z`), publishes to npm with provenance through
OIDC Trusted Publishing (no `NPM_TOKEN`) and creates the GitHub Release. It pushes no
commit. You do not create the tag yourself.

## Cutting a release

1. **Release PR**, `dev` → `main`, merged with a merge commit, titled
   `chore(release): X.Y.Z`. It contains:
   - the version in `package.json` and `package-lock.json`
     (`npm version X.Y.Z --no-git-tag-version`);
   - `CHANGELOG.md` with `## [Unreleased]` promoted to `## [X.Y.Z] - YYYY-MM-DD` and a
     fresh empty `[Unreleased]` above it;
   - `dist/` rebuilt with `npm run build:wrap`. Do not change `dist/artoolkit5.js` or
     `dist/artoolkit5.wasm` unless the C++ changed in the same release.
2. **Dry run.** Dispatch the workflow with `dry_run` set:

   ```bash
   gh workflow run release.yml --repo AR-js-org/artoolkit5-wasm --ref main -f version=X.Y.Z -f dry_run=true
   ```

   Every check runs; nothing is tagged or published. `node scripts/release-check.mjs X.Y.Z`
   runs the file checks locally.
3. **Release.** Dispatch again with `dry_run` false (or omit it).

A dry run cannot cover the `release` job (tag, npm publish, GitHub Release), so a passing
dry run means the release is *prepared*, not that it will *publish*.

## What the workflow refuses

It stops before changing anything unless: it runs from `main`; the version is plain stable
semver (no `v`, no suffix); `package.json`, `package-lock.json`, `CHANGELOG.md` and the
built `dist/index.js` all name it; no tag names a different commit; the version is not
already on npm; the repository is public; every entry point declared in `package.json`
(`main`, `types`, each `exports` target) and every file it lists in `files` (the wasm, its
glue, the typings) is in the tarball `npm pack` would produce; and rebuilding the wrapper
reproduces the committed `dist/` wrapper files.

The tarball check matters because npm silently leaves out a file listed in `files` that does
not exist: no warning, no error. It checks presence only. The wasm is not compared with a
rebuild: it is not byte-reproducible across machines (issue #20), so a stale wasm would still
pass.

## Publishing

The trusted publisher is registered on the package's settings page on npmjs.com:
organisation `AR-js-org`, repository `artoolkit5-wasm`, workflow filename `release.yml`
(the filename alone, not the path). npm does not validate it when saved, so a wrong value
only shows up as a failed publish.

- `repository.url` in `package.json` must match the repository exactly
  (`git+https://github.com/AR-js-org/artoolkit5-wasm.git`) or provenance is rejected.
- Trusted publishing needs npm 11.5.1 or newer; `.nvmrc` pins Node 24, which ships it.
- **Never add `registry-url` to `actions/setup-node` in the workflow.** It writes an
  `.npmrc` line `_authToken=${NODE_AUTH_TOKEN}` that expands to empty, npm decides
  authentication is already configured, and the OIDC exchange never happens
  (403 / `ENEEDAUTH`). npm's own example includes it, so it is easy to reintroduce.
- `publishConfig.provenance` is `true`, which only works inside GitHub Actions or GitLab CI.

## When a run fails part-way

The `release` job is safe to repeat: tagging, pushing the tag and publishing each check
whether they already happened. After a failure past `npm publish` (for example the
GitHub Release step), use **Re-run failed jobs** or **Re-run all jobs** on the original
run; both resume correctly.

Dispatching a **new** run also works while `main` has not moved: `prepare` sees the
version on npm and the tag on this commit, skips the publish, and creates the missing
Release. If `main` has moved since, a new run is refused ("Tag points to … but this run
would release …"); re-run the original run instead.

## Emergency manual publish

If the workflow or the trusted publisher is unavailable, from a clean checkout of the
release commit on `main`:

```bash
npm ci && npm run build:wrap
npm publish --provenance=false   # publishConfig's provenance cannot work outside CI
git tag vX.Y.Z <sha> && git push origin vX.Y.Z
```

Then dispatch the workflow for the same version: it finds the version on npm and the tag,
skips the publish, and only creates the GitHub Release. Without the tag it would refuse
("already published on npm and no tag names this commit"). A manual publish carries no
provenance attestation, which is why `0.3.0` has none.

## Line endings

`.gitattributes` keeps `src/` and `dist/` LF on every platform. The source maps in `dist/`
embed the contents of `src/`, and the workflow rebuilds on Linux; CRLF sources would make
the maps differ and the release be refused with a sync error that does not mention line
endings.

Git only rewrites files that change between commits, so a clone made **before**
`.gitattributes` existed keeps CRLF in files it did not touch. Once, after pulling it
(commit or stash local changes first):

```bash
rm -r src dist && git checkout -- src dist
```

A fresh clone needs nothing. Check with `git ls-files --eol src dist`: the `w/` column
should read `w/lf`.
