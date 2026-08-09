import { execSync } from "node:child_process";
import process from "node:process";

const cwd = process.cwd().replace(/\\/g, "/");
const image = process.env.EMSDK_IMAGE || "emscripten/emsdk:4.0.17";
const buildType = process.env.BUILD_TYPE || "Release";
const interactive = process.env.CI ? "" : "-it";
const debugFlags = process.env.DEBUG ? "-DENABLE_WASM_DEBUG_FLAGS=ON" : "";

// Pre-fetch all required Emscripten ports before the parallel build to avoid
// a race condition where multiple concurrent compile jobs all try to download
// the same port (e.g. zlib) simultaneously and one fails with ECONNREFUSED.
const cmd =
    `docker run --rm ${interactive} ` +
    `-v "${cwd}:/src" -w /src ` +
    `${image} bash -lc ` +
    `"embuilder build zlib libjpeg && emcmake cmake -S . -B build -DCMAKE_BUILD_TYPE=${buildType} ${debugFlags} && cmake --build build -j"`;

console.log(cmd);
execSync(cmd, { stdio: "inherit" });
