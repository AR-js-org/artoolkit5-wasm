/*
 *  release-check.mjs
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

import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

async function readJson(dir, name, errors) {
    try {
        return JSON.parse(await readFile(join(dir, name), "utf8"));
    } catch (err) {
        errors.push(`${name} could not be read: ${err.message.split("\n")[0]}`);
        return undefined;
    }
}

/**
 * Checks that everything a release depends on names `version`. Returns the
 * errors found, one human-readable line each; an empty array means the release
 * may go ahead. Only local files are checked: npm, tag and GitHub state are the
 * workflow's job, since they need the network.
 */
export async function checkRelease({ dir, version }) {
    // Anything but plain MAJOR.MINOR.PATCH: a leading "v", a pre-release suffix,
    // a multi-line string. Nothing else is worth checking against a bad version.
    if (!SEMVER.test(version)) {
        return [
            `${JSON.stringify(version)} is not a valid stable semver version. ` +
                `Give it without a leading v or pre-release suffix, e.g. 1.1.0.`,
        ];
    }

    const errors = [];

    const pkg = await readJson(dir, "package.json", errors);
    if (pkg && pkg.version !== version) {
        errors.push(
            `package.json is at ${pkg.version} but the requested release is ${version}. ` +
                `Merge the release PR (version bump, changelog, dist/) first.`,
        );
    }

    const lock = await readJson(dir, "package-lock.json", errors);
    if (lock) {
        const top = lock.version;
        const root = lock.packages?.[""]?.version;
        if (top !== version || root !== version) {
            errors.push(
                `package-lock.json is at ${top} (root package: ${root}) but the requested release is ` +
                    `${version}. Run 'npm install --package-lock-only' in the release PR.`,
            );
        }
    }

    try {
        const changelog = await readFile(join(dir, "CHANGELOG.md"), "utf8");
        const heading = new RegExp(`^## \\[${version.replace(/\./g, "\\.")}\\]`, "m");
        if (!heading.test(changelog)) {
            errors.push(`CHANGELOG.md has no '## [${version}]' section. Promote [Unreleased] in the release PR.`);
        }
    } catch (err) {
        errors.push(`CHANGELOG.md could not be read: ${err.message.split("\n")[0]}`);
    }

    // Import the built wrapper and read the version it reports. Searching the file
    // for the version string is not enough: artoolkit5-constants is bundled into
    // dist/index.js, and its own version literal can equal the one being released.
    try {
        const built = await import(pathToFileURL(join(dir, "dist", "index.js")).href);
        if (built.ARTOOLKIT5_WASM_VERSION !== version) {
            errors.push(
                `dist/index.js exports ARTOOLKIT5_WASM_VERSION ${JSON.stringify(built.ARTOOLKIT5_WASM_VERSION)} ` +
                    `but the requested release is ${version}. Run 'npm run build:wrap' and commit dist/.`,
            );
        }
    } catch (err) {
        errors.push(`dist/index.js could not be loaded: ${err.message.split("\n")[0]}`);
    }

    return errors;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
    const version = process.argv[2] ?? "";
    const dir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
    const errors = await checkRelease({ dir, version });
    if (errors.length > 0) {
        for (const error of errors) console.log(`::error::${error}`);
        process.exit(1);
    }
    console.log(`package.json, package-lock.json, CHANGELOG.md and dist/index.js all name ${version}.`);
}
