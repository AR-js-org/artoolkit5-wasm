import { execSync } from "node:child_process";
import process from "node:process";
import path from "node:path";

const cwd = process.cwd();
// Docker su Windows vuole path con backslash? In genere accetta anche con forward slash.
// Convertiamo in formato posix-like per sicurezza.
const volumePath = cwd.replace(/\\/g, "/");

const image = process.env.EMSDK_IMAGE || "emscripten/emsdk:4.0.17";

const cmd =
    `docker run --rm -it ` +
    `-v "${volumePath}:/src" -w /src ` +
    `${image} bash -lc ` +
    `"emcmake cmake -S . -B build -DCMAKE_BUILD_TYPE=Release && cmake --build build -j"`;

console.log(cmd);
execSync(cmd, { stdio: "inherit" });