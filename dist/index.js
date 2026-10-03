import e from "../dist/artoolkit5.js";
//#region \0rolldown/runtime.js
var t = Object.defineProperty, n = (e, n) => {
	let r = {};
	for (var i in e) t(r, i, {
		get: e[i],
		enumerable: !0
	});
	return n || t(r, Symbol.toStringTag, { value: "Module" }), r;
};
//#endregion
//#region src/loader.ts
async function r(e) {
	let t = await fetch(e);
	if (!t.ok) throw Error(`fetch failed ${t.status} ${t.statusText}: ${e}`);
	return new Uint8Array(await t.arrayBuffer());
}
function i(e, t) {
	let n = t.lastIndexOf("/");
	if (n === -1) return;
	let r = t.substring(0, n);
	if (!r || r === "/" || r === ".") return;
	let i = t.startsWith("/"), a = r.split("/").filter(Boolean), o = i ? "" : ".";
	for (let t of a) {
		o += "/" + t;
		try {
			e.analyzePath(o).exists || e.mkdir(o);
		} catch (e) {
			if (e.errno !== 17 && e.code !== "EEXIST") throw e;
		}
	}
}
async function a(e, t, n, a = "/data/camera_para.dat") {
	let o = await r(n);
	return i(e.FS, a), e.FS.writeFile(a, o), t._loadCamera(a);
}
async function o(e, t, n, a = "/data/patt.hiro") {
	let o = await r(n);
	return i(e.FS, a), e.FS.writeFile(a, o), t.addMarker(a);
}
//#endregion
//#region node_modules/@ar-js-org/artoolkit5-constants/dist/generated/artoolkit_constants.js
var s = 0, c = 1, l = 2, u = 3, d = 5, ee = 13, te = 12, ne = 0, re = 1, f = 2, p = 3, m = 4, h = 0, g = 3, _ = 259, v = 515, y = 4, b = 772, x = 1028, S = 5, C = 1029, w = 1285, T = 6, E = 2830, D = 3, O = 0, k = 1, A = 0, j = 0, M = 1, N = 1, P = 100, F = 0, I = 1, L = 0, R = 0, z = 1, B = 2, V = 2, H = 5, U = .5, W = 0, G = 1, K = 2, q = 3, ie = 4, J = 0, Y = 1, ae = 2, oe = 3, se = 4, ce = 0, le = 0, ue = 1, de = 2, fe = 3, pe = 4, me = 5, he = 6, ge = 7, _e = 8, ve = 9, X = "0.4.0", Z = X, ye = /* @__PURE__ */ n({
	ARTOOLKIT_CONSTANTS_VERSION: () => Z,
	AR_DEBUG_DISABLE: () => 0,
	AR_DEBUG_ENABLE: () => 1,
	AR_DEFAULT_DEBUG_MODE: () => 0,
	AR_DEFAULT_IMAGE_PROC_MODE: () => 0,
	AR_DEFAULT_LABELING_MODE: () => 1,
	AR_DEFAULT_LABELING_THRESH: () => 100,
	AR_DEFAULT_MARKER_EXTRACTION_MODE: () => 2,
	AR_DEFAULT_PATTERN_DETECTION_MODE: () => 0,
	AR_IMAGE_PROC_FIELD_IMAGE: () => 1,
	AR_IMAGE_PROC_FRAME_IMAGE: () => 0,
	AR_LABELING_BLACK_REGION: () => 1,
	AR_LABELING_THRESH_MODE_AUTO_ADAPTIVE: () => 3,
	AR_LABELING_THRESH_MODE_AUTO_BRACKETING: () => 4,
	AR_LABELING_THRESH_MODE_AUTO_MEDIAN: () => 1,
	AR_LABELING_THRESH_MODE_AUTO_OTSU: () => 2,
	AR_LABELING_THRESH_MODE_DEFAULT: () => 0,
	AR_LABELING_THRESH_MODE_MANUAL: () => 0,
	AR_LABELING_WHITE_REGION: () => 0,
	AR_LOG_LEVEL_DEBUG: () => 0,
	AR_LOG_LEVEL_ERROR: () => 3,
	AR_LOG_LEVEL_INFO: () => 1,
	AR_LOG_LEVEL_REL_INFO: () => 4,
	AR_LOG_LEVEL_WARN: () => 2,
	AR_LOOP_BREAK_THRESH: () => U,
	AR_MARKER_INFO_CUTOFF_PHASE_HEURISTIC_TROUBLESOME_MATRIX_CODES: () => 9,
	AR_MARKER_INFO_CUTOFF_PHASE_MATCH_BARCODE_EDC_FAIL: () => 5,
	AR_MARKER_INFO_CUTOFF_PHASE_MATCH_BARCODE_NOT_FOUND: () => 4,
	AR_MARKER_INFO_CUTOFF_PHASE_MATCH_CONFIDENCE: () => 6,
	AR_MARKER_INFO_CUTOFF_PHASE_MATCH_CONTRAST: () => 3,
	AR_MARKER_INFO_CUTOFF_PHASE_MATCH_GENERIC: () => 2,
	AR_MARKER_INFO_CUTOFF_PHASE_NONE: () => 0,
	AR_MARKER_INFO_CUTOFF_PHASE_PATTERN_EXTRACTION: () => 1,
	AR_MARKER_INFO_CUTOFF_PHASE_POSE_ERROR: () => 7,
	AR_MARKER_INFO_CUTOFF_PHASE_POSE_ERROR_MULTI: () => 8,
	AR_MATRIX_CODE_3x3: () => 3,
	AR_MATRIX_CODE_3x3_HAMMING63: () => 515,
	AR_MATRIX_CODE_3x3_PARITY65: () => 259,
	AR_MATRIX_CODE_4x4: () => 4,
	AR_MATRIX_CODE_4x4_BCH_13_5_5: () => x,
	AR_MATRIX_CODE_4x4_BCH_13_9_3: () => 772,
	AR_MATRIX_CODE_5x5: () => 5,
	AR_MATRIX_CODE_5x5_BCH_22_12_5: () => C,
	AR_MATRIX_CODE_5x5_BCH_22_7_7: () => w,
	AR_MATRIX_CODE_6x6: () => 6,
	AR_MATRIX_CODE_DETECTION: () => 2,
	AR_MATRIX_CODE_GLOBAL_ID: () => E,
	AR_MATRIX_CODE_TYPE_DEFAULT: () => 3,
	AR_MAX_LOOP_COUNT: () => 5,
	AR_NOUSE_TRACKING_HISTORY: () => 1,
	AR_PIXEL_FORMAT_420f: () => 13,
	AR_PIXEL_FORMAT_420v: () => 12,
	AR_PIXEL_FORMAT_BGR: () => 1,
	AR_PIXEL_FORMAT_BGRA: () => 3,
	AR_PIXEL_FORMAT_MONO: () => 5,
	AR_PIXEL_FORMAT_RGB: () => 0,
	AR_PIXEL_FORMAT_RGBA: () => 2,
	AR_TEMPLATE_MATCHING_COLOR: () => 0,
	AR_TEMPLATE_MATCHING_COLOR_AND_MATRIX: () => 3,
	AR_TEMPLATE_MATCHING_MONO: () => 1,
	AR_TEMPLATE_MATCHING_MONO_AND_MATRIX: () => 4,
	AR_USE_TRACKING_HISTORY: () => 0,
	AR_USE_TRACKING_HISTORY_V2: () => 2,
	VERSION: () => X
}), be = -1, xe = 0, Q = 1, $ = "0.3.0", Se = $, { VERSION: Ce, ARTOOLKIT_CONSTANTS_VERSION: we, ...Te } = ye;
async function Ee(t = {}) {
	t.quiet || console.log(`artoolkit5-wasm v${$}`);
	let n = await e({
		locateFile: t.locateFile,
		wasmBinary: t.wasmBinary
	});
	return {
		mod: n,
		core: new n.ARToolKitCore(),
		constants: Object.freeze({
			...Te,
			UNKNOWN_MARKER: -1,
			PATTERN_MARKER: 0,
			BARCODE_MARKER: 1
		})
	};
}
//#endregion
export { $ as ARTOOLKIT5_WASM_VERSION, Z as ARTOOLKIT_CONSTANTS_VERSION, O as AR_DEBUG_DISABLE, k as AR_DEBUG_ENABLE, A as AR_DEFAULT_DEBUG_MODE, L as AR_DEFAULT_IMAGE_PROC_MODE, N as AR_DEFAULT_LABELING_MODE, P as AR_DEFAULT_LABELING_THRESH, V as AR_DEFAULT_MARKER_EXTRACTION_MODE, h as AR_DEFAULT_PATTERN_DETECTION_MODE, I as AR_IMAGE_PROC_FIELD_IMAGE, F as AR_IMAGE_PROC_FRAME_IMAGE, M as AR_LABELING_BLACK_REGION, oe as AR_LABELING_THRESH_MODE_AUTO_ADAPTIVE, se as AR_LABELING_THRESH_MODE_AUTO_BRACKETING, Y as AR_LABELING_THRESH_MODE_AUTO_MEDIAN, ae as AR_LABELING_THRESH_MODE_AUTO_OTSU, ce as AR_LABELING_THRESH_MODE_DEFAULT, J as AR_LABELING_THRESH_MODE_MANUAL, j as AR_LABELING_WHITE_REGION, W as AR_LOG_LEVEL_DEBUG, q as AR_LOG_LEVEL_ERROR, G as AR_LOG_LEVEL_INFO, ie as AR_LOG_LEVEL_REL_INFO, K as AR_LOG_LEVEL_WARN, U as AR_LOOP_BREAK_THRESH, ve as AR_MARKER_INFO_CUTOFF_PHASE_HEURISTIC_TROUBLESOME_MATRIX_CODES, me as AR_MARKER_INFO_CUTOFF_PHASE_MATCH_BARCODE_EDC_FAIL, pe as AR_MARKER_INFO_CUTOFF_PHASE_MATCH_BARCODE_NOT_FOUND, he as AR_MARKER_INFO_CUTOFF_PHASE_MATCH_CONFIDENCE, fe as AR_MARKER_INFO_CUTOFF_PHASE_MATCH_CONTRAST, de as AR_MARKER_INFO_CUTOFF_PHASE_MATCH_GENERIC, le as AR_MARKER_INFO_CUTOFF_PHASE_NONE, ue as AR_MARKER_INFO_CUTOFF_PHASE_PATTERN_EXTRACTION, ge as AR_MARKER_INFO_CUTOFF_PHASE_POSE_ERROR, _e as AR_MARKER_INFO_CUTOFF_PHASE_POSE_ERROR_MULTI, g as AR_MATRIX_CODE_3x3, v as AR_MATRIX_CODE_3x3_HAMMING63, _ as AR_MATRIX_CODE_3x3_PARITY65, y as AR_MATRIX_CODE_4x4, x as AR_MATRIX_CODE_4x4_BCH_13_5_5, b as AR_MATRIX_CODE_4x4_BCH_13_9_3, S as AR_MATRIX_CODE_5x5, C as AR_MATRIX_CODE_5x5_BCH_22_12_5, w as AR_MATRIX_CODE_5x5_BCH_22_7_7, T as AR_MATRIX_CODE_6x6, f as AR_MATRIX_CODE_DETECTION, E as AR_MATRIX_CODE_GLOBAL_ID, D as AR_MATRIX_CODE_TYPE_DEFAULT, H as AR_MAX_LOOP_COUNT, z as AR_NOUSE_TRACKING_HISTORY, ee as AR_PIXEL_FORMAT_420f, te as AR_PIXEL_FORMAT_420v, c as AR_PIXEL_FORMAT_BGR, u as AR_PIXEL_FORMAT_BGRA, d as AR_PIXEL_FORMAT_MONO, s as AR_PIXEL_FORMAT_RGB, l as AR_PIXEL_FORMAT_RGBA, ne as AR_TEMPLATE_MATCHING_COLOR, p as AR_TEMPLATE_MATCHING_COLOR_AND_MATRIX, re as AR_TEMPLATE_MATCHING_MONO, m as AR_TEMPLATE_MATCHING_MONO_AND_MATRIX, R as AR_USE_TRACKING_HISTORY, B as AR_USE_TRACKING_HISTORY_V2, Q as BARCODE_MARKER, xe as PATTERN_MARKER, be as UNKNOWN_MARKER, Se as VERSION, o as addMarkerFromUrl, Ee as createARToolKit, a as loadCameraFromUrl };

//# sourceMappingURL=index.js.map