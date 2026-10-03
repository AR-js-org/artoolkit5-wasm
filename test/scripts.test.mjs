import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { basename, isAbsolute } from "node:path";

import { buildDockerCommand } from "../scripts/build-wasm-docker.mjs";
import { resolveClangFormat } from "../scripts/clang-format.mjs";

const base = { cwd: "/repo", image: "emscripten/emsdk:4.0.17", buildType: "Release", debug: false };

test("buildDockerCommand omits -it when tty is false", () => {
    const cmd = buildDockerCommand({ ...base, tty: false });
    assert.ok(!cmd.includes(" -it "), cmd);
    assert.ok(cmd.startsWith('docker run --rm -v "/repo:/src" -w /src '), cmd);
});

test("buildDockerCommand passes -it when tty is true", () => {
    const cmd = buildDockerCommand({ ...base, tty: true });
    assert.ok(cmd.startsWith('docker run --rm -it -v "/repo:/src" -w /src '), cmd);
});

test("buildDockerCommand adds -DENABLE_WASM_DEBUG_FLAGS=ON only when debug is true", () => {
    assert.ok(!buildDockerCommand({ ...base, tty: false }).includes("ENABLE_WASM_DEBUG_FLAGS"));
    assert.ok(buildDockerCommand({ ...base, tty: false, debug: true }).includes("-DENABLE_WASM_DEBUG_FLAGS=ON"));
});

test("buildDockerCommand uses the given image and build type", () => {
    const cmd = buildDockerCommand({ ...base, image: "emscripten/emsdk:9.9.9", buildType: "Debug", tty: false });
    assert.ok(cmd.includes("emscripten/emsdk:9.9.9 bash -lc"), cmd);
    assert.ok(cmd.includes("-DCMAKE_BUILD_TYPE=Debug"), cmd);
});

test("resolveClangFormat prefers the binary in node_modules/.bin", () => {
    const bin = resolveClangFormat();
    assert.ok(isAbsolute(bin), `expected the local binary, got ${bin}`);
    assert.match(basename(bin), /^clang-format(\.cmd)?$/);
    assert.ok(existsSync(bin), bin);
});
