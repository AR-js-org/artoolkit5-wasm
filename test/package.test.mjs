import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

import { missingEntryPoints, missingFiles } from "../scripts/release-check.mjs";

// The real package, as npm would publish it: every entry point package.json
// declares must be inside the tarball.
test("every entry point declared in package.json is in the published tarball", () => {
    const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
    const root = new URL("..", import.meta.url);
    const packed = JSON.parse(execSync("npm pack --dry-run --json --ignore-scripts", { cwd: root, encoding: "utf8" }));
    const paths = packed[0].files.map((f) => f.path);
    assert.deepEqual(missingEntryPoints(manifest, paths), []);
});

// Every file package.json lists in `files` (the wasm, its glue, the maps, the typings)
// must really be in the tarball, not only the entry points.
test("every file listed in package.json 'files' is in the published tarball", () => {
    const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
    const root = new URL("..", import.meta.url);
    const packed = JSON.parse(execSync("npm pack --dry-run --json --ignore-scripts", { cwd: root, encoding: "utf8" }));
    const paths = packed[0].files.map((f) => f.path);
    assert.deepEqual(missingFiles(manifest, paths), []);
});
