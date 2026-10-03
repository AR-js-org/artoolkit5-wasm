/*
 *  build-wasm-docker.mjs
 *  artoolkit5-wasm
 *
 *  This file is part of artoolkit5-wasm - AR-js-org.
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  artoolkit5-wasm is distributed in the hope that it will be useful, but
 *  WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 *  or FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. See the MIT License
 *  for more details.
 *
 *  You should have received a copy of the MIT License along with
 *  artoolkit5-wasm. If not, see <https://opensource.org/licenses/MIT>.
 *
 *  Copyright (c) 2026 AR-js-org
 *
 *  Author(s): Walter Perdan @kalwalt https://github.com/kalwalt
 *
 */

import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import process from "node:process";

/**
 * The `docker run` command that builds the wasm. `tty` adds `-it`, which Docker
 * rejects ("cannot attach stdin to a TTY-enabled container") when stdin is not a
 * terminal, so only interactive callers may set it.
 */
export function buildDockerCommand({ cwd, image, buildType, debug, tty }) {
    const debugFlags = debug ? " -DENABLE_WASM_DEBUG_FLAGS=ON" : "";

    // Pre-fetch all required Emscripten ports before the parallel build to avoid
    // a race condition where multiple concurrent compile jobs all try to download
    // the same port (e.g. zlib) simultaneously and one fails with ECONNREFUSED.
    const build =
        "embuilder build zlib libjpeg && " +
        `emcmake cmake -S . -B build -DCMAKE_BUILD_TYPE=${buildType}${debugFlags} && ` +
        "cmake --build build -j";

    return [
        "docker run --rm",
        tty ? "-it" : "",
        `-v "${cwd}:/src" -w /src`,
        image,
        "bash -lc",
        `"${build}"`,
    ]
        .filter(Boolean)
        .join(" ");
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
    const cmd = buildDockerCommand({
        cwd: process.cwd().replace(/\\/g, "/"),
        image: process.env.EMSDK_IMAGE || "emscripten/emsdk:4.0.17",
        buildType: process.env.BUILD_TYPE || "Release",
        debug: Boolean(process.env.DEBUG),
        tty: Boolean(process.stdin.isTTY) && Boolean(process.stdout.isTTY) && !process.env.CI,
    });

    console.log(cmd);
    // MSYS_NO_PATHCONV stops Git Bash on Windows from rewriting `-w /src` into a
    // Windows path, which makes Docker exit 125. It has no effect elsewhere.
    execSync(cmd, { stdio: "inherit", env: { ...process.env, MSYS_NO_PATHCONV: "1" } });
}
