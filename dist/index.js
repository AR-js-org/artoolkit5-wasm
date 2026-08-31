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
var s = 0, c = 1, l = 2, u = 3, d = 5, ee = 13, f = 12, p = 0, m = 1, h = 2, g = 3, _ = 4, v = 0, y = 3, b = 259, x = 515, S = 4, C = 772, w = 1028, T = 5, E = 1029, D = 1285, O = 6, k = 2830, A = 3, j = 0, M = 1, N = 0, P = 0, F = 1, I = 1, L = 100, R = 0, z = 1, te = 0, B = 0, V = 1, H = 2, U = 2, W = 5, G = .5, K = 0, q = 1, J = 2, Y = 3, X = 4, Z = 0, Q = 1, ne = 2, re = 3, ie = 4, ae = 0, oe = 0, se = 1, ce = 2, le = 3, ue = 4, de = 5, fe = 6, pe = 7, $ = 8, me = 9, he = /* @__PURE__ */ n({
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
	AR_LOOP_BREAK_THRESH: () => G,
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
	AR_MATRIX_CODE_4x4_BCH_13_5_5: () => w,
	AR_MATRIX_CODE_4x4_BCH_13_9_3: () => 772,
	AR_MATRIX_CODE_5x5: () => 5,
	AR_MATRIX_CODE_5x5_BCH_22_12_5: () => E,
	AR_MATRIX_CODE_5x5_BCH_22_7_7: () => D,
	AR_MATRIX_CODE_6x6: () => 6,
	AR_MATRIX_CODE_DETECTION: () => 2,
	AR_MATRIX_CODE_GLOBAL_ID: () => k,
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
	AR_USE_TRACKING_HISTORY_V2: () => 2
}), ge = -1, _e = 0, ve = 1;
async function ye(t = {}) {
	t.quiet || console.log("artoolkit5-wasm v0.1.3");
	let n = await e({
		locateFile: t.locateFile,
		wasmBinary: t.wasmBinary
	});
	return {
		mod: n,
		core: new n.ARToolKitCore(),
		constants: Object.freeze({
			...he,
			UNKNOWN_MARKER: -1,
			PATTERN_MARKER: 0,
			BARCODE_MARKER: 1
		})
	};
}
//#endregion
export { j as AR_DEBUG_DISABLE, M as AR_DEBUG_ENABLE, N as AR_DEFAULT_DEBUG_MODE, te as AR_DEFAULT_IMAGE_PROC_MODE, I as AR_DEFAULT_LABELING_MODE, L as AR_DEFAULT_LABELING_THRESH, U as AR_DEFAULT_MARKER_EXTRACTION_MODE, v as AR_DEFAULT_PATTERN_DETECTION_MODE, z as AR_IMAGE_PROC_FIELD_IMAGE, R as AR_IMAGE_PROC_FRAME_IMAGE, F as AR_LABELING_BLACK_REGION, re as AR_LABELING_THRESH_MODE_AUTO_ADAPTIVE, ie as AR_LABELING_THRESH_MODE_AUTO_BRACKETING, Q as AR_LABELING_THRESH_MODE_AUTO_MEDIAN, ne as AR_LABELING_THRESH_MODE_AUTO_OTSU, ae as AR_LABELING_THRESH_MODE_DEFAULT, Z as AR_LABELING_THRESH_MODE_MANUAL, P as AR_LABELING_WHITE_REGION, K as AR_LOG_LEVEL_DEBUG, Y as AR_LOG_LEVEL_ERROR, q as AR_LOG_LEVEL_INFO, X as AR_LOG_LEVEL_REL_INFO, J as AR_LOG_LEVEL_WARN, G as AR_LOOP_BREAK_THRESH, me as AR_MARKER_INFO_CUTOFF_PHASE_HEURISTIC_TROUBLESOME_MATRIX_CODES, de as AR_MARKER_INFO_CUTOFF_PHASE_MATCH_BARCODE_EDC_FAIL, ue as AR_MARKER_INFO_CUTOFF_PHASE_MATCH_BARCODE_NOT_FOUND, fe as AR_MARKER_INFO_CUTOFF_PHASE_MATCH_CONFIDENCE, le as AR_MARKER_INFO_CUTOFF_PHASE_MATCH_CONTRAST, ce as AR_MARKER_INFO_CUTOFF_PHASE_MATCH_GENERIC, oe as AR_MARKER_INFO_CUTOFF_PHASE_NONE, se as AR_MARKER_INFO_CUTOFF_PHASE_PATTERN_EXTRACTION, pe as AR_MARKER_INFO_CUTOFF_PHASE_POSE_ERROR, $ as AR_MARKER_INFO_CUTOFF_PHASE_POSE_ERROR_MULTI, y as AR_MATRIX_CODE_3x3, x as AR_MATRIX_CODE_3x3_HAMMING63, b as AR_MATRIX_CODE_3x3_PARITY65, S as AR_MATRIX_CODE_4x4, w as AR_MATRIX_CODE_4x4_BCH_13_5_5, C as AR_MATRIX_CODE_4x4_BCH_13_9_3, T as AR_MATRIX_CODE_5x5, E as AR_MATRIX_CODE_5x5_BCH_22_12_5, D as AR_MATRIX_CODE_5x5_BCH_22_7_7, O as AR_MATRIX_CODE_6x6, h as AR_MATRIX_CODE_DETECTION, k as AR_MATRIX_CODE_GLOBAL_ID, A as AR_MATRIX_CODE_TYPE_DEFAULT, W as AR_MAX_LOOP_COUNT, V as AR_NOUSE_TRACKING_HISTORY, ee as AR_PIXEL_FORMAT_420f, f as AR_PIXEL_FORMAT_420v, c as AR_PIXEL_FORMAT_BGR, u as AR_PIXEL_FORMAT_BGRA, d as AR_PIXEL_FORMAT_MONO, s as AR_PIXEL_FORMAT_RGB, l as AR_PIXEL_FORMAT_RGBA, p as AR_TEMPLATE_MATCHING_COLOR, g as AR_TEMPLATE_MATCHING_COLOR_AND_MATRIX, m as AR_TEMPLATE_MATCHING_MONO, _ as AR_TEMPLATE_MATCHING_MONO_AND_MATRIX, B as AR_USE_TRACKING_HISTORY, H as AR_USE_TRACKING_HISTORY_V2, ve as BARCODE_MARKER, _e as PATTERN_MARKER, ge as UNKNOWN_MARKER, o as addMarkerFromUrl, ye as createARToolKit, a as loadCameraFromUrl };

//# sourceMappingURL=index.js.map