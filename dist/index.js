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
var s = 0, c = 1, l = 2, u = 3, d = 5, ee = 13, f = 12, p = 0, m = 1, h = 2, g = 3, _ = 4, v = 0, y = 3, b = 259, x = 515, S = 4, C = 772, w = 1028, T = 5, E = 1029, D = 1285, O = 6, k = 2830, A = 3, j = 0, M = 1, N = 0, P = 100, F = 0, te = 1, I = 0, L = 5, R = .5, z = 0, B = 1, V = 2, H = 3, U = 4, W = 0, G = 1, K = 2, q = 3, J = 4, Y = 0, X = 0, Z = 1, Q = 2, ne = 3, re = 4, ie = 5, ae = 6, oe = 7, $ = 8, se = 9, ce = /* @__PURE__ */ n({
	AR_DEBUG_DISABLE: () => 0,
	AR_DEBUG_ENABLE: () => 1,
	AR_DEFAULT_DEBUG_MODE: () => 0,
	AR_DEFAULT_IMAGE_PROC_MODE: () => 0,
	AR_DEFAULT_LABELING_THRESH: () => 100,
	AR_DEFAULT_PATTERN_DETECTION_MODE: () => 0,
	AR_IMAGE_PROC_FIELD_IMAGE: () => 1,
	AR_IMAGE_PROC_FRAME_IMAGE: () => 0,
	AR_LABELING_THRESH_MODE_AUTO_ADAPTIVE: () => 3,
	AR_LABELING_THRESH_MODE_AUTO_BRACKETING: () => 4,
	AR_LABELING_THRESH_MODE_AUTO_MEDIAN: () => 1,
	AR_LABELING_THRESH_MODE_AUTO_OTSU: () => 2,
	AR_LABELING_THRESH_MODE_DEFAULT: () => 0,
	AR_LABELING_THRESH_MODE_MANUAL: () => 0,
	AR_LOG_LEVEL_DEBUG: () => 0,
	AR_LOG_LEVEL_ERROR: () => 3,
	AR_LOG_LEVEL_INFO: () => 1,
	AR_LOG_LEVEL_REL_INFO: () => 4,
	AR_LOG_LEVEL_WARN: () => 2,
	AR_LOOP_BREAK_THRESH: () => R,
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
	AR_TEMPLATE_MATCHING_MONO_AND_MATRIX: () => 4
}), le = -1, ue = 0, de = 1;
async function fe(t = {}) {
	t.quiet || console.log("artoolkit5-wasm v0.1.2");
	let n = await e({
		locateFile: t.locateFile,
		wasmBinary: t.wasmBinary
	});
	return {
		mod: n,
		core: new n.ARToolKitCore(),
		constants: Object.freeze({
			...ce,
			UNKNOWN_MARKER: -1,
			PATTERN_MARKER: 0,
			BARCODE_MARKER: 1
		})
	};
}
//#endregion
export { j as AR_DEBUG_DISABLE, M as AR_DEBUG_ENABLE, N as AR_DEFAULT_DEBUG_MODE, I as AR_DEFAULT_IMAGE_PROC_MODE, P as AR_DEFAULT_LABELING_THRESH, v as AR_DEFAULT_PATTERN_DETECTION_MODE, te as AR_IMAGE_PROC_FIELD_IMAGE, F as AR_IMAGE_PROC_FRAME_IMAGE, q as AR_LABELING_THRESH_MODE_AUTO_ADAPTIVE, J as AR_LABELING_THRESH_MODE_AUTO_BRACKETING, G as AR_LABELING_THRESH_MODE_AUTO_MEDIAN, K as AR_LABELING_THRESH_MODE_AUTO_OTSU, Y as AR_LABELING_THRESH_MODE_DEFAULT, W as AR_LABELING_THRESH_MODE_MANUAL, z as AR_LOG_LEVEL_DEBUG, H as AR_LOG_LEVEL_ERROR, B as AR_LOG_LEVEL_INFO, U as AR_LOG_LEVEL_REL_INFO, V as AR_LOG_LEVEL_WARN, R as AR_LOOP_BREAK_THRESH, se as AR_MARKER_INFO_CUTOFF_PHASE_HEURISTIC_TROUBLESOME_MATRIX_CODES, ie as AR_MARKER_INFO_CUTOFF_PHASE_MATCH_BARCODE_EDC_FAIL, re as AR_MARKER_INFO_CUTOFF_PHASE_MATCH_BARCODE_NOT_FOUND, ae as AR_MARKER_INFO_CUTOFF_PHASE_MATCH_CONFIDENCE, ne as AR_MARKER_INFO_CUTOFF_PHASE_MATCH_CONTRAST, Q as AR_MARKER_INFO_CUTOFF_PHASE_MATCH_GENERIC, X as AR_MARKER_INFO_CUTOFF_PHASE_NONE, Z as AR_MARKER_INFO_CUTOFF_PHASE_PATTERN_EXTRACTION, oe as AR_MARKER_INFO_CUTOFF_PHASE_POSE_ERROR, $ as AR_MARKER_INFO_CUTOFF_PHASE_POSE_ERROR_MULTI, y as AR_MATRIX_CODE_3x3, x as AR_MATRIX_CODE_3x3_HAMMING63, b as AR_MATRIX_CODE_3x3_PARITY65, S as AR_MATRIX_CODE_4x4, w as AR_MATRIX_CODE_4x4_BCH_13_5_5, C as AR_MATRIX_CODE_4x4_BCH_13_9_3, T as AR_MATRIX_CODE_5x5, E as AR_MATRIX_CODE_5x5_BCH_22_12_5, D as AR_MATRIX_CODE_5x5_BCH_22_7_7, O as AR_MATRIX_CODE_6x6, h as AR_MATRIX_CODE_DETECTION, k as AR_MATRIX_CODE_GLOBAL_ID, A as AR_MATRIX_CODE_TYPE_DEFAULT, L as AR_MAX_LOOP_COUNT, ee as AR_PIXEL_FORMAT_420f, f as AR_PIXEL_FORMAT_420v, c as AR_PIXEL_FORMAT_BGR, u as AR_PIXEL_FORMAT_BGRA, d as AR_PIXEL_FORMAT_MONO, s as AR_PIXEL_FORMAT_RGB, l as AR_PIXEL_FORMAT_RGBA, p as AR_TEMPLATE_MATCHING_COLOR, g as AR_TEMPLATE_MATCHING_COLOR_AND_MATRIX, m as AR_TEMPLATE_MATCHING_MONO, _ as AR_TEMPLATE_MATCHING_MONO_AND_MATRIX, de as BARCODE_MARKER, ue as PATTERN_MARKER, le as UNKNOWN_MARKER, o as addMarkerFromUrl, fe as createARToolKit, a as loadCameraFromUrl };

//# sourceMappingURL=index.js.map