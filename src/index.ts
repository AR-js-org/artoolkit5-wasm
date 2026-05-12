// src/index.ts
import createEmscriptenModule from "../dist/artoolkit5.js";
import { loadCameraFromUrl, addMarkerFromUrl } from './loader.js';

export type LocateFile = (path: string, prefix: string) => string;

export interface CreateARToolKitOptions {
    locateFile?: LocateFile;
    wasmBinary?: ArrayBuffer | Uint8Array; // per Node in futuro
}

export async function createARToolKit(opts: CreateARToolKitOptions = {}) {
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
        AR_DEBUG_DISABLE: mod.AR_DEBUG_DISABLE,
        AR_DEBUG_ENABLE: mod.AR_DEBUG_ENABLE,

        AR_LOG_LEVEL_DEBUG: mod.AR_LOG_LEVEL_DEBUG,
        AR_LOG_LEVEL_INFO: mod.AR_LOG_LEVEL_INFO,
        AR_LOG_LEVEL_WARN: mod.AR_LOG_LEVEL_WARN,
        AR_LOG_LEVEL_ERROR: mod.AR_LOG_LEVEL_ERROR,
        AR_LOG_LEVEL_REL_INFO: mod.AR_LOG_LEVEL_REL_INFO,

        UNKNOWN_MARKER,
        PATTERN_MARKER,
        BARCODE_MARKER,

        // ... (tutte le altre che ti servono)
    } as const);

    return { mod, core, constants };
}

export type ARToolKitInstance = Awaited<ReturnType<typeof createARToolKit>>;
export type ARToolKitConstants = ARToolKitInstance["constants"];

export { loadCameraFromUrl, addMarkerFromUrl };