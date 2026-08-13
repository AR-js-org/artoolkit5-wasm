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

export async function createARToolKit(opts: CreateARToolKitOptions = {}) {
    if (!opts.quiet) {
        const version = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'unknown';
        console.log(`artoolkit5-wasm v${version}`);
    }

    const mod: any = await (createEmscriptenModule as any)({
        locateFile: opts.locateFile,
        wasmBinary: opts.wasmBinary,
    });

    const core = new mod.ARToolKitCore();

    // “freeze” per evitare mutazioni accidentali.
    const constants = Object.freeze({
        ...artoolkitConstants,
        UNKNOWN_MARKER,
        PATTERN_MARKER,
        BARCODE_MARKER,
    });

    return { mod, core, constants };
}

export type ARToolKitInstance = Awaited<ReturnType<typeof createARToolKit>>;
export type ARToolKitConstants = ARToolKitInstance["constants"];

export { loadCameraFromUrl, addMarkerFromUrl };
