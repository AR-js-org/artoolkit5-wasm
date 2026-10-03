import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { checkRelease } from "../scripts/release-check.mjs";

const VERSION = "0.4.0";

// Writes the four files a release depends on into a fresh temp dir. Every
// field defaults to naming VERSION; a test overrides only the one it breaks.
async function fixture({
    pkg = VERSION,
    lockTop = VERSION,
    lockRoot = VERSION,
    changelog = `## [Unreleased]\n\n## [${VERSION}] - 2026-10-03\n\n## [0.3.0] - 2026-09-09\n`,
    dist = `export const ARTOOLKIT5_WASM_VERSION = "${VERSION}";\n`,
} = {}) {
    const dir = await mkdtemp(join(tmpdir(), "release-check-"));
    await mkdir(join(dir, "dist"));
    await writeFile(join(dir, "package.json"), JSON.stringify({ name: "x", version: pkg, type: "module" }));
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
