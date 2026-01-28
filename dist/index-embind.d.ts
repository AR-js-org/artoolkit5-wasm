import { loadCameraFromUrl, addMarkerFromUrl } from './loader.js';
export type LocateFile = (path: string, prefix: string) => string;
export interface CreateARToolKitOptions {
    locateFile?: LocateFile;
    wasmBinary?: ArrayBuffer | Uint8Array;
}
export declare function createARToolKit(opts?: CreateARToolKitOptions): Promise<{
    mod: any;
    core: any;
    constants: Readonly<{
        readonly ERROR_OK: any;
        readonly ERROR_NOT_INITIALIZED: any;
        readonly ERROR_INVALID_ARGUMENT: any;
        readonly ERROR_ARCONTROLLER_NOT_FOUND: any;
        readonly ERROR_MARKER_INDEX_OUT_OF_BOUNDS: any;
        readonly AR_DEBUG_DISABLE: any;
        readonly AR_DEBUG_ENABLE: any;
        readonly AR_LOG_LEVEL_DEBUG: any;
        readonly AR_LOG_LEVEL_INFO: any;
        readonly AR_LOG_LEVEL_WARN: any;
        readonly AR_LOG_LEVEL_ERROR: any;
        readonly AR_LOG_LEVEL_REL_INFO: any;
        readonly UNKNOWN_MARKER: -1;
        readonly PATTERN_MARKER: 0;
        readonly BARCODE_MARKER: 1;
    }>;
}>;
export type ARToolKitInstance = Awaited<ReturnType<typeof createARToolKit>>;
export type ARToolKitConstants = ARToolKitInstance["constants"];
export { loadCameraFromUrl, addMarkerFromUrl };
//# sourceMappingURL=index-embind.d.ts.map