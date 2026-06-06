import { loadCameraFromUrl, addMarkerFromUrl } from './loader.js';
export type LocateFile = (path: string, prefix: string) => string;
export interface CreateARToolKitOptions {
    locateFile?: LocateFile;
    wasmBinary?: ArrayBuffer | Uint8Array;
    quiet?: boolean;
}
export declare function createARToolKit(opts?: CreateARToolKitOptions): Promise<{
    mod: any;
    core: any;
    constants: Readonly<{
        readonly AR_DEBUG_DISABLE: number;
        readonly AR_DEBUG_ENABLE: number;
        readonly AR_LOG_LEVEL_DEBUG: number;
        readonly AR_LOG_LEVEL_INFO: number;
        readonly AR_LOG_LEVEL_WARN: number;
        readonly AR_LOG_LEVEL_ERROR: number;
        readonly AR_LOG_LEVEL_REL_INFO: number;
        readonly AR_PIXEL_FORMAT_RGBA: number;
        readonly AR_PIXEL_FORMAT_MONO: number;
        readonly AR_MATRIX_CODE_DETECTION: number;
        readonly UNKNOWN_MARKER: -1;
        readonly PATTERN_MARKER: 0;
        readonly BARCODE_MARKER: 1;
    }>;
}>;
export type ARToolKitInstance = Awaited<ReturnType<typeof createARToolKit>>;
export type ARToolKitConstants = ARToolKitInstance["constants"];
export { loadCameraFromUrl, addMarkerFromUrl };
//# sourceMappingURL=index.d.ts.map