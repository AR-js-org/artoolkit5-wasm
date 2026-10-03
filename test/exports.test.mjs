import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const m = await import("../dist/index.js");

test("ARTOOLKIT5_WASM_VERSION equals package.json version", () => {
    assert.equal(m.ARTOOLKIT5_WASM_VERSION, pkg.version);
});

test("VERSION is this package's version, not constants'", () => {
    assert.equal(m.VERSION, pkg.version);
});

test("constants' own version stays reachable", () => {
    assert.equal(typeof m.ARTOOLKIT_CONSTANTS_VERSION, "string");
    assert.notEqual(m.ARTOOLKIT_CONSTANTS_VERSION, undefined);
});

// The shipped wasm glue is built with ENVIRONMENT=web and cannot be instantiated
// in Node, so the frozen `constants` object cannot be inspected at runtime here.
// Check the source instead: both version keys must be destructured out of the
// constants namespace before it is spread, and the namespace itself never spread.
test("createARToolKit leaves the version keys out of its frozen constants object", () => {
    const src = readFileSync(new URL("../src/index.ts", import.meta.url), "utf8");
    const destructured = src.match(/const\s*\{([^}]*\.\.\.\w+)\s*\}\s*=\s*artoolkitConstants/);
    assert.ok(destructured, "no `const { ..., ...rest } = artoolkitConstants` in src/index.ts");
    assert.match(destructured[1], /\bVERSION\b/);
    assert.match(destructured[1], /\bARTOOLKIT_CONSTANTS_VERSION\b/);
    assert.doesNotMatch(src, /\.\.\.artoolkitConstants\b/);
});
