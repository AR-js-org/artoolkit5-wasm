// src/index.ts
declare const __VERSION__: string;
import createEmscriptenModule from "../dist/artoolkit5.js";
import { loadCameraFromUrl, addMarkerFromUrl } from './loader.js';
import {
    AR_DEBUG_DISABLE,
    AR_DEBUG_ENABLE,
    AR_LOG_LEVEL_DEBUG,
    AR_LOG_LEVEL_INFO,
    AR_LOG_LEVEL_WARN,
    AR_LOG_LEVEL_ERROR,
    AR_LOG_LEVEL_REL_INFO,
    AR_PIXEL_FORMAT_RGBA,
    AR_MATRIX_CODE_DETECTION,
    AR_PIXEL_FORMAT_MONO
} from '@ar-js-org/artoolkit5-constants';

export type LocateFile = (path: string, prefix: string) => string;

export interface CreateARToolKitOptions {
    locateFile?: LocateFile;
    wasmBinary?: ArrayBuffer | Uint8Array; // per Node in futuro
    quiet?: boolean;
}

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

    const UNKNOWN_MARKER = -1;
    const PATTERN_MARKER = 0;
    const BARCODE_MARKER = 1;

    // “freeze” per evitare mutazioni accidentali.
    const constants = Object.freeze({
        AR_DEBUG_DISABLE: AR_DEBUG_DISABLE,
        AR_DEBUG_ENABLE: AR_DEBUG_ENABLE,

        AR_LOG_LEVEL_DEBUG: AR_LOG_LEVEL_DEBUG,
        AR_LOG_LEVEL_INFO: AR_LOG_LEVEL_INFO,
        AR_LOG_LEVEL_WARN: AR_LOG_LEVEL_WARN,
        AR_LOG_LEVEL_ERROR: AR_LOG_LEVEL_ERROR,
        AR_LOG_LEVEL_REL_INFO: AR_LOG_LEVEL_REL_INFO,

        AR_PIXEL_FORMAT_RGBA: AR_PIXEL_FORMAT_RGBA,
        AR_PIXEL_FORMAT_MONO: AR_PIXEL_FORMAT_MONO,
        AR_MATRIX_CODE_DETECTION: AR_MATRIX_CODE_DETECTION,

        UNKNOWN_MARKER,
        PATTERN_MARKER,
        BARCODE_MARKER,
    } as const);

    return { mod, core, constants };
}

export type ARToolKitInstance = Awaited<ReturnType<typeof createARToolKit>>;
export type ARToolKitConstants = ARToolKitInstance["constants"];

export { loadCameraFromUrl, addMarkerFromUrl };