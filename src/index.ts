/*
 *  index.ts
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
 *  This library wraps a WebAssembly build of ARToolkit5 (WebARKitLib), which
 *  is licensed under the GNU Lesser General Public License v3.0.
 *
 *  Copyright (c) 2026 AR-js-org
 *
 *  Author(s): Walter Perdan @kalwalt https://github.com/kalwalt
 *
 */

// src/index.ts
declare const __VERSION__: string;
import createEmscriptenModule from "../dist/artoolkit5.js";
import { loadCameraFromUrl, addMarkerFromUrl } from './loader.js';
import * as artoolkitConstants from '@ar-js-org/artoolkit5-constants';

/**
 * Every ARToolKit5 constant, re-exported so consumers do not need to take a
 * second dependency on @ar-js-org/artoolkit5-constants just to call a setter.
 *
 * These are the single source of truth for constant values: they are generated
 * from the same WebARKitLib headers this WebAssembly module is compiled against.
 */
export * from '@ar-js-org/artoolkit5-constants';

export type LocateFile = (path: string, prefix: string) => string;

export interface CreateARToolKitOptions {
    locateFile?: LocateFile;
    wasmBinary?: ArrayBuffer | Uint8Array; // per Node in futuro
    quiet?: boolean;
}

/**
 * Marker kind sentinels. These are this wrapper's own values, not ARToolKit5
 * constants, so they are declared here rather than generated upstream.
 */
export const UNKNOWN_MARKER = -1;
export const PATTERN_MARKER = 0;
export const BARCODE_MARKER = 1;

/** The version of this package, injected from package.json at build time. */
export const ARTOOLKIT5_WASM_VERSION: string = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'unknown';

/**
 * Also this package's version. artoolkit5-constants >= 0.4.0 exports its own
 * `VERSION`, which `export *` above would otherwise re-export under this name,
 * so a consumer reading `VERSION` would silently get the constants package's
 * version. A local export takes precedence over `export *`, and the constants
 * package's version stays available as `ARTOOLKIT_CONSTANTS_VERSION`.
 */
export const VERSION: string = ARTOOLKIT5_WASM_VERSION;

// Version strings are not ARToolKit constants, so keep them out of `constants`.
const {
    VERSION: _constantsVersion,
    ARTOOLKIT_CONSTANTS_VERSION: _constantsPackageVersion,
    ...constantValues
} = artoolkitConstants;

export async function createARToolKit(opts: CreateARToolKitOptions = {}) {
    if (!opts.quiet) {
        console.log(`artoolkit5-wasm v${ARTOOLKIT5_WASM_VERSION}`);
    }

    const mod: any = await (createEmscriptenModule as any)({
        locateFile: opts.locateFile,
        wasmBinary: opts.wasmBinary,
    });

    const core = new mod.ARToolKitCore();

    // “freeze” per evitare mutazioni accidentali.
    const constants = Object.freeze({
        ...constantValues,
        UNKNOWN_MARKER,
        PATTERN_MARKER,
        BARCODE_MARKER,
    });

    return { mod, core, constants };
}

export type ARToolKitInstance = Awaited<ReturnType<typeof createARToolKit>>;
export type ARToolKitConstants = ARToolKitInstance["constants"];

export { loadCameraFromUrl, addMarkerFromUrl };
