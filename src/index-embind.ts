// src/index.ts
import createEmscriptenModule from "../dist/artoolkit5-embind.js";
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
        ERROR_OK: core.ERROR_OK_(),
        ERROR_NOT_INITIALIZED: core.ERROR_NOT_INITIALIZED_(),
        ERROR_INVALID_ARGUMENT: core.ERROR_INVALID_ARGUMENT_(),
        ERROR_ARCONTROLLER_NOT_FOUND: core.ERROR_ARCONTROLLER_NOT_FOUND_(),
        ERROR_MARKER_INDEX_OUT_OF_BOUNDS: core.ERROR_MARKER_INDEX_OUT_OF_BOUNDS_(),

        AR_DEBUG_DISABLE: core.AR_DEBUG_DISABLE_(),
        AR_DEBUG_ENABLE: core.AR_DEBUG_ENABLE_(),

        AR_LOG_LEVEL_DEBUG: core.AR_LOG_LEVEL_DEBUG_(),
        AR_LOG_LEVEL_INFO: core.AR_LOG_LEVEL_INFO_(),
        AR_LOG_LEVEL_WARN: core.AR_LOG_LEVEL_WARN_(),
        AR_LOG_LEVEL_ERROR: core.AR_LOG_LEVEL_ERROR_(),
        AR_LOG_LEVEL_REL_INFO: core.AR_LOG_LEVEL_REL_INFO_(),

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