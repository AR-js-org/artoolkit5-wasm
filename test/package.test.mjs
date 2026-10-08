import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

import { missingEntryPoints } from "../scripts/release-check.mjs";

// The real package, as npm would publish it: every entry point package.json
// declares must be inside the tarball.
test("every entry point declared in package.json is in the published tarball", () => {
    const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
    const root = new URL("..", import.meta.url);
    const packed = JSON.parse(execSync("npm pack --dry-run --json --ignore-scripts", { cwd: root, encoding: "utf8" }));
    const paths = packed[0].files.map((f) => f.path);
    assert.deepEqual(missingEntryPoints(manifest, paths), []);
});

// Consumers import the binary by URL, e.g. Vite's
// `import wasmUrl from '@ar-js-org/artoolkit5-wasm/dist/artoolkit5.wasm?url'`.
// Resolving through the package name goes through "exports" exactly as theirs
// does, so a subpath the map does not list fails here as it fails for them.
test("dist/artoolkit5.wasm is reachable through exports", () => {
    const url = import.meta.resolve("@ar-js-org/artoolkit5-wasm/dist/artoolkit5.wasm");
    assert.equal(url, new URL("../dist/artoolkit5.wasm", import.meta.url).href);
});
