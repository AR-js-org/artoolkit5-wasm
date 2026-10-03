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
import { globSync } from "glob";
import process from "node:process";

// Check if clang-format is available
try {
    execSync("clang-format --version", { stdio: "ignore" });
} catch (e) {
    console.error("Error: clang-format is not found in PATH.");
    console.error("Please install it or add it to your PATH.");
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
const command = isLint
    ? `clang-format --dry-run -Werror ${files.map(f => `"${f}"`).join(" ")}`
    : `clang-format -i ${files.map(f => `"${f}"`).join(" ")}`;

try {
    console.log(`Running: ${isLint ? "Linting" : "Formatting"}...`);
    execSync(command, { stdio: "inherit" });
    console.log(isLint ? "Lint passed!" : "Formatting complete!");
} catch (e) {
    console.error(isLint ? "Lint failed! Run 'npm run format:cpp' to fix." : "Formatting failed.");
    process.exit(1);
}
