import { loadCameraFromUrl, addMarkerFromUrl } from './loader.js';
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
    wasmBinary?: ArrayBuffer | Uint8Array;
    quiet?: boolean;
}
/**
 * Marker kind sentinels. These are this wrapper's own values, not ARToolKit5
 * constants, so they are declared here rather than generated upstream.
 */
export declare const UNKNOWN_MARKER = -1;
export declare const PATTERN_MARKER = 0;
export declare const BARCODE_MARKER = 1;
export declare function createARToolKit(opts?: CreateARToolKitOptions): Promise<{
    mod: any;
    core: any;
    constants: Readonly<{
        AR_PIXEL_FORMAT_RGB: number;
        AR_PIXEL_FORMAT_BGR: number;
        AR_PIXEL_FORMAT_RGBA: number;
        AR_PIXEL_FORMAT_BGRA: number;
        AR_PIXEL_FORMAT_MONO: number;
        AR_PIXEL_FORMAT_420f: number;
        AR_PIXEL_FORMAT_420v: number;
        AR_TEMPLATE_MATCHING_COLOR: number;
        AR_TEMPLATE_MATCHING_MONO: number;
        AR_MATRIX_CODE_DETECTION: number;
        AR_TEMPLATE_MATCHING_COLOR_AND_MATRIX: number;
        AR_TEMPLATE_MATCHING_MONO_AND_MATRIX: number;
        AR_DEFAULT_PATTERN_DETECTION_MODE: number;
        AR_MATRIX_CODE_3x3: number;
        AR_MATRIX_CODE_3x3_PARITY65: number;
        AR_MATRIX_CODE_3x3_HAMMING63: number;
        AR_MATRIX_CODE_4x4: number;
        AR_MATRIX_CODE_4x4_BCH_13_9_3: number;
        AR_MATRIX_CODE_4x4_BCH_13_5_5: number;
        AR_MATRIX_CODE_5x5: number;
        AR_MATRIX_CODE_5x5_BCH_22_12_5: number;
        AR_MATRIX_CODE_5x5_BCH_22_7_7: number;
        AR_MATRIX_CODE_6x6: number;
        AR_MATRIX_CODE_GLOBAL_ID: number;
        AR_MATRIX_CODE_TYPE_DEFAULT: number;
        AR_DEBUG_DISABLE: number;
        AR_DEBUG_ENABLE: number;
        AR_DEFAULT_DEBUG_MODE: number;
        AR_DEFAULT_LABELING_THRESH: number;
        AR_IMAGE_PROC_FRAME_IMAGE: number;
        AR_IMAGE_PROC_FIELD_IMAGE: number;
        AR_DEFAULT_IMAGE_PROC_MODE: number;
        AR_MAX_LOOP_COUNT: number;
        AR_LOOP_BREAK_THRESH: number;
        AR_LOG_LEVEL_DEBUG: number;
        AR_LOG_LEVEL_INFO: number;
        AR_LOG_LEVEL_WARN: number;
        AR_LOG_LEVEL_ERROR: number;
        AR_LOG_LEVEL_REL_INFO: number;
        AR_LABELING_THRESH_MODE_MANUAL: number;
        AR_LABELING_THRESH_MODE_AUTO_MEDIAN: number;
        AR_LABELING_THRESH_MODE_AUTO_OTSU: number;
        AR_LABELING_THRESH_MODE_AUTO_ADAPTIVE: number;
        AR_LABELING_THRESH_MODE_AUTO_BRACKETING: number;
        AR_LABELING_THRESH_MODE_DEFAULT: number;
        AR_MARKER_INFO_CUTOFF_PHASE_NONE: number;
        AR_MARKER_INFO_CUTOFF_PHASE_PATTERN_EXTRACTION: number;
        AR_MARKER_INFO_CUTOFF_PHASE_MATCH_GENERIC: number;
        AR_MARKER_INFO_CUTOFF_PHASE_MATCH_CONTRAST: number;
        AR_MARKER_INFO_CUTOFF_PHASE_MATCH_BARCODE_NOT_FOUND: number;
        AR_MARKER_INFO_CUTOFF_PHASE_MATCH_BARCODE_EDC_FAIL: number;
        AR_MARKER_INFO_CUTOFF_PHASE_MATCH_CONFIDENCE: number;
        AR_MARKER_INFO_CUTOFF_PHASE_POSE_ERROR: number;
        AR_MARKER_INFO_CUTOFF_PHASE_POSE_ERROR_MULTI: number;
        AR_MARKER_INFO_CUTOFF_PHASE_HEURISTIC_TROUBLESOME_MATRIX_CODES: number;
        UNKNOWN_MARKER: -1;
        PATTERN_MARKER: 0;
        BARCODE_MARKER: 1;
    }>;
}>;
export type ARToolKitInstance = Awaited<ReturnType<typeof createARToolKit>>;
export type ARToolKitConstants = ARToolKitInstance["constants"];
export { loadCameraFromUrl, addMarkerFromUrl };
//# sourceMappingURL=index.d.ts.map