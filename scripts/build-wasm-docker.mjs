import { execSync } from "node:child_process";
import process from "node:process";

const cwd = process.cwd().replace(/\\/g, "/");
const image = process.env.EMSDK_IMAGE || "emscripten/emsdk:4.0.17";
const buildType = process.env.BUILD_TYPE || "Release";
const interactive = process.env.CI ? "" : "-it";

const cmd =
    `docker run --rm ${interactive} ` +
    `-v "${cwd}:/src" -w /src ` +
    `${image} bash -lc ` +
    `"emcmake cmake -S . -B build -DCMAKE_BUILD_TYPE=${buildType} && cmake --build build -j"`;

console.log(cmd);
execSync(cmd, { stdio: "inherit" });