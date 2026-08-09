import e from "../dist/artoolkit5.js";
//#region src/loader.ts
async function t(e) {
	let t = await fetch(e);
	if (!t.ok) throw Error(`fetch failed ${t.status} ${t.statusText}: ${e}`);
	return new Uint8Array(await t.arrayBuffer());
}
function n(e, t) {
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
async function r(e, r, i, a = "/data/camera_para.dat") {
	let o = await t(i);
	return n(e.FS, a), e.FS.writeFile(a, o), r._loadCamera(a);
}
async function i(e, r, i, a = "/data/patt.hiro") {
	let o = await t(i);
	return n(e.FS, a), e.FS.writeFile(a, o), r.addMarker(a);
}
//#endregion
//#region src/index.ts
async function a(t = {}) {
	t.quiet || console.log("artoolkit5-wasm v0.1.2");
	let n = await e({
		locateFile: t.locateFile,
		wasmBinary: t.wasmBinary
	});
	return {
		mod: n,
		core: new n.ARToolKitCore(),
		constants: Object.freeze({
			AR_DEBUG_DISABLE: 0,
			AR_DEBUG_ENABLE: 1,
			AR_LOG_LEVEL_DEBUG: 0,
			AR_LOG_LEVEL_INFO: 1,
			AR_LOG_LEVEL_WARN: 2,
			AR_LOG_LEVEL_ERROR: 3,
			AR_LOG_LEVEL_REL_INFO: 4,
			AR_PIXEL_FORMAT_RGBA: 2,
			AR_PIXEL_FORMAT_MONO: 5,
			AR_MATRIX_CODE_DETECTION: 2,
			UNKNOWN_MARKER: -1,
			PATTERN_MARKER: 0,
			BARCODE_MARKER: 1
		})
	};
}
//#endregion
export { i as addMarkerFromUrl, a as createARToolKit, r as loadCameraFromUrl };

//# sourceMappingURL=index.js.map