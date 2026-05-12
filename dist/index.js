import s from "../dist/artoolkit5.js";
async function e(t) {
  const r = await fetch(t);
  if (!r.ok) throw new Error(`fetch failed ${r.status} ${r.statusText}: ${t}`);
  return new Uint8Array(await r.arrayBuffer());
}
function c(t, r) {
  const n = r.substring(0, r.lastIndexOf("/")) || "/";
  if (n !== "/")
    try {
      t.analyzePath(n).exists || (console.log(`Creating virtual directory: ${n}`), t.mkdir(n));
    } catch (a) {
      if (a.errno !== 17 && a.code !== "EEXIST")
        throw console.error(`Error creating directory ${n}:`, a), a;
    }
}
async function N(t, r, n, a = "/data/camera_para.dat") {
  const o = await e(n);
  return c(t.FS, a), t.FS.writeFile(a, o), r._loadCamera(a);
}
async function y(t, r, n, a = "/data/patt.hiro") {
  const o = await e(n);
  return c(t.FS, a), t.FS.writeFile(a, o), r.addMarker(a);
}
const E = 2, R = 5, _ = 2, A = 0, L = 1, O = 0, l = 1, d = 2, f = 3, u = 4;
async function M(t = {}) {
  const r = await s({
    locateFile: t.locateFile,
    wasmBinary: t.wasmBinary
  }), n = new r.ARToolKitCore(), i = Object.freeze({
    AR_DEBUG_DISABLE: A,
    AR_DEBUG_ENABLE: L,
    AR_LOG_LEVEL_DEBUG: O,
    AR_LOG_LEVEL_INFO: l,
    AR_LOG_LEVEL_WARN: d,
    AR_LOG_LEVEL_ERROR: f,
    AR_LOG_LEVEL_REL_INFO: u,
    AR_PIXEL_FORMAT_RGBA: E,
    AR_PIXEL_FORMAT_MONO: R,
    AR_MATRIX_CODE_DETECTION: _,
    UNKNOWN_MARKER: -1,
    PATTERN_MARKER: 0,
    BARCODE_MARKER: 1
    // ... (tutte le altre che ti servono)
  });
  return { mod: r, core: n, constants: i };
}
export {
  y as addMarkerFromUrl,
  M as createARToolKit,
  N as loadCameraFromUrl
};
//# sourceMappingURL=index.js.map
