/*
 *  clang-format.mjs
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
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { globSync } from "glob";
import process from "node:process";

/**
 * The clang-format to run: the one installed by the `clang-format` devDependency
 * (node_modules/.bin), so the check works after `npm install` with nothing on PATH.
 * Falls back to the bare name, which is then looked up on PATH.
 */
export function resolveClangFormat() {
    const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
    const name = process.platform === "win32" ? "clang-format.cmd" : "clang-format";
    const local = join(root, "node_modules", ".bin", name);
    return existsSync(local) ? local : "clang-format";
}

function main() {
    const clangFormat = resolveClangFormat();

    // Check that it can actually be run
    try {
        execSync(`"${clangFormat}" --version`, { stdio: "ignore" });
    } catch (e) {
        if (clangFormat === "clang-format") {
            console.error("Error: clang-format is not found in PATH.");
            console.error("Please install it or add it to your PATH.");
        } else {
            console.error(`Error: could not run ${clangFormat}.`);
            console.error("Run 'npm install' again, or put a working clang-format on your PATH.");
        }
        process.exit(1);
    }

    const args = process.argv.slice(2);
    const isLint = args.includes("--lint");

    // Find C++ files
    const files = globSync("cpp/**/*.{cpp,h,c,hpp}", { windowsPathsNoEscape: true });

    if (files.length === 0) {
        console.log("No C++ files found.");
        process.exit(0);
    }

    console.log(`Found ${files.length} files.`);

    // Construct command
    const list = files.map(f => `"${f}"`).join(" ");
    const command = isLint
        ? `"${clangFormat}" --dry-run -Werror ${list}`
        : `"${clangFormat}" -i ${list}`;

    try {
        console.log(`Running: ${isLint ? "Linting" : "Formatting"}...`);
        execSync(command, { stdio: "inherit" });
        console.log(isLint ? "Lint passed!" : "Formatting complete!");
    } catch (e) {
        console.error(isLint ? "Lint failed! Run 'npm run format:cpp' to fix." : "Formatting failed.");
        process.exit(1);
    }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) main();
