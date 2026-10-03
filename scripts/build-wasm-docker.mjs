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
