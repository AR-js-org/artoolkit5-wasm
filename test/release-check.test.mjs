import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { checkRelease, entryPoints, missingEntryPoints, missingFiles } from "../scripts/release-check.mjs";

const VERSION = "0.4.0";

// Writes the four files a release depends on into a fresh temp dir. Every
// field defaults to naming VERSION; a test overrides only the one it breaks.
async function fixture({
    pkg = VERSION,
    lockTop = VERSION,
    lockRoot = VERSION,
    changelog = `## [Unreleased]\n\n## [${VERSION}] - 2026-10-03\n\n## [0.3.0] - 2026-09-09\n`,
    dist = `export const ARTOOLKIT5_WASM_VERSION = "${VERSION}";\n`,
    manifestExtra = {},
} = {}) {
    const dir = await mkdtemp(join(tmpdir(), "release-check-"));
    await mkdir(join(dir, "dist"));
    await writeFile(join(dir, "package.json"), JSON.stringify({ name: "x", version: pkg, type: "module", ...manifestExtra }));
    await writeFile(
        join(dir, "package-lock.json"),
        JSON.stringify({ name: "x", version: lockTop, packages: { "": { name: "x", version: lockRoot } } }),
    );
    await writeFile(join(dir, "CHANGELOG.md"), changelog);
    await writeFile(join(dir, "dist", "index.js"), dist);
    return dir;
}

test("passes when package.json, lockfile, changelog and dist all name the version", async () => {
    const dir = await fixture();
    assert.deepEqual(await checkRelease({ dir, version: VERSION }), []);
});

test("rejects a leading v, a pre-release suffix and a multi-line version", async () => {
    const dir = await fixture();
    for (const bad of ["v0.4.0", "0.4.0-rc.1", "0.4.0\n0.4.1"]) {
        const errors = await checkRelease({ dir, version: bad });
        assert.equal(errors.length, 1, `expected exactly one error for ${JSON.stringify(bad)}: ${errors}`);
        assert.match(errors[0], /semver/i);
    }
});

test("rejects package.json at a different version", async () => {
    const dir = await fixture({ pkg: "0.3.0" });
    const errors = await checkRelease({ dir, version: VERSION });
    assert.equal(errors.length, 1);
    assert.match(errors[0], /package\.json/);
});

test("rejects a lockfile whose top-level or root-package version differs", async () => {
    for (const broken of [{ lockTop: "0.3.0" }, { lockRoot: "0.3.0" }]) {
        const dir = await fixture(broken);
        const errors = await checkRelease({ dir, version: VERSION });
        assert.equal(errors.length, 1, JSON.stringify(broken));
        assert.match(errors[0], /package-lock\.json/);
    }
});

test("rejects a changelog without a section for the version", async () => {
    const dir = await fixture({ changelog: "## [Unreleased]\n\n## [0.3.0] - 2026-09-09\n" });
    const errors = await checkRelease({ dir, version: VERSION });
    assert.equal(errors.length, 1);
    assert.match(errors[0], /CHANGELOG\.md/);
});

test("rejects a dist/index.js that still embeds the previous version", async () => {
    const dir = await fixture({ dist: `export const ARTOOLKIT5_WASM_VERSION = "0.3.0";\n` });
    const errors = await checkRelease({ dir, version: VERSION });
    assert.equal(errors.length, 1);
    assert.match(errors[0], /dist\/index\.js/);
});

// artoolkit5-constants is bundled into dist/index.js and its own version literal can
// equal the version being released (both were 0.4.0). Finding "0.4.0" somewhere in the
// file must not count as the wrapper's version being current.
test("rejects a stale dist even when the new version appears elsewhere in the bundle", async () => {
    const dist = `const ARTOOLKIT_CONSTANTS_VERSION = "${VERSION}";\nexport const ARTOOLKIT5_WASM_VERSION = "0.3.0";\n`;
    const dir = await fixture({ dist });
    const errors = await checkRelease({ dir, version: VERSION });
    assert.equal(errors.length, 1);
    assert.match(errors[0], /dist\/index\.js/);
});

test("reports a dist that cannot be loaded or exports no version, without throwing", async () => {
    for (const dist of ["this is not javascript (", "export const SOMETHING_ELSE = 1;\n"]) {
        const dir = await fixture({ dist });
        const errors = await checkRelease({ dir, version: VERSION });
        assert.equal(errors.length, 1, dist);
        assert.match(errors[0], /dist\/index\.js/);
    }
});

// A declared entry point the tarball does not contain makes `import` fail for every
// consumer, whatever the build did. 0.1.2 to 0.3.0 all declared `./loader`, pointing
// at a dist/loader.js that was never built nor published.
test("entryPoints collects main, types and every exports target, without ./", () => {
    const manifest = {
        main: "./dist/index.js",
        types: "./dist/index.d.ts",
        exports: {
            ".": { types: "./dist/index.d.ts", import: "./dist/index.js" },
            "./loader": { types: "./dist/loader.d.ts", import: "./dist/loader.js" },
            "./package.json": "./package.json",
            "./features/*": "./dist/features/*.js",
        },
    };
    assert.deepEqual(entryPoints(manifest).sort(), [
        "dist/index.d.ts",
        "dist/index.js",
        "dist/loader.d.ts",
        "dist/loader.js",
        "package.json",
    ]);
});

test("missingEntryPoints reports declared files absent from the packed list", () => {
    const manifest = { exports: { ".": "./dist/index.js", "./loader": "./dist/loader.js" } };
    assert.deepEqual(missingEntryPoints(manifest, ["dist/index.js", "package.json"]), ["dist/loader.js"]);
    assert.deepEqual(missingEntryPoints(manifest, ["dist/index.js", "dist/loader.js"]), []);
});

test("rejects a package that declares an export its tarball does not contain", async () => {
    const dir = await fixture({ manifestExtra: { exports: { ".": "./dist/index.js", "./loader": "./dist/loader.js" } } });
    const errors = await checkRelease({ dir, version: VERSION });
    assert.equal(errors.length, 1);
    assert.match(errors[0], /dist\/loader\.js/);
});

test("passes a package whose declared exports are all in the tarball", async () => {
    const dir = await fixture({ manifestExtra: { main: "./dist/index.js", exports: { ".": "./dist/index.js" } } });
    assert.deepEqual(await checkRelease({ dir, version: VERSION }), []);
});

// npm silently leaves out a file listed in `files` that does not exist: no warning, no
// error. The wasm and its glue are listed in `files` but are not entry points, so a release
// commit without them would publish a package that cannot start its engine.
test("missingFiles reports concrete `files` entries absent from the packed list", () => {
    const manifest = { files: ["dist/index.js", "dist/artoolkit5.wasm"] };
    assert.deepEqual(missingFiles(manifest, ["dist/index.js", "package.json"]), ["dist/artoolkit5.wasm"]);
    assert.deepEqual(missingFiles(manifest, ["dist/index.js", "dist/artoolkit5.wasm"]), []);
});

test("missingFiles treats a directory entry as present when anything under it is packed", () => {
    assert.deepEqual(missingFiles({ files: ["dist"] }, ["dist/index.js"]), []);
    assert.deepEqual(missingFiles({ files: ["dist/"] }, ["dist/index.js"]), []);
    assert.deepEqual(missingFiles({ files: ["dist"] }, ["package.json"]), ["dist"]);
});

test("missingFiles ignores globs, negations and a missing `files` field", () => {
    assert.deepEqual(missingFiles({ files: ["dist/*.js", "!dist/skip.js"] }, []), []);
    assert.deepEqual(missingFiles({}, []), []);
});

test("rejects a package whose entry points are fine but a listed binary is not in the tarball", async () => {
    const dir = await fixture({
        manifestExtra: {
            main: "./dist/index.js",
            exports: { ".": "./dist/index.js" },
            files: ["dist/index.js", "dist/artoolkit5.wasm"],
        },
    });
    const errors = await checkRelease({ dir, version: VERSION });
    assert.equal(errors.length, 1);
    assert.match(errors[0], /dist\/artoolkit5\.wasm/);
});

test("passes a package whose listed files are all in the tarball", async () => {
    const dir = await fixture({
        manifestExtra: { main: "./dist/index.js", exports: { ".": "./dist/index.js" }, files: ["dist/index.js"] },
    });
    assert.deepEqual(await checkRelease({ dir, version: VERSION }), []);
});
