import _ from "../dist/artoolkit5.js";
async function i(r) {
  const t = await fetch(r);
  if (!t.ok) throw new Error(`fetch failed ${t.status} ${t.statusText}: ${r}`);
  return new Uint8Array(await t.arrayBuffer());
}
function E(r, t) {
  const a = t.lastIndexOf("/");
  if (a === -1) return;
  const n = t.substring(0, a);
  if (!n || n === "/" || n === ".") return;
  const e = t.startsWith("/"), c = n.split("/").filter(Boolean);
  let o = e ? "" : ".";
  for (const R of c) {
    o += "/" + R;
    try {
      r.analyzePath(o).exists || r.mkdir(o);
    } catch (s) {
      if (s.errno !== 17 && s.code !== "EEXIST")
        throw s;
    }
  }
}
async function M(r, t, a, n = "/data/camera_para.dat") {
  const e = await i(a);
  return E(r.FS, n), r.FS.writeFile(n, e), t._loadCamera(n);
}
async function T(r, t, a, n = "/data/patt.hiro") {
  const e = await i(a);
  return E(r.FS, n), r.FS.writeFile(n, e), t.addMarker(n);
}
const A = 2, l = 5, f = 2, L = 0, O = 1, u = 0, d = 1, w = 2, F = 3, N = 4;
async function y(r = {}) {
  const t = await _({
    locateFile: r.locateFile,
    wasmBinary: r.wasmBinary
  }), a = new t.ARToolKitCore(), o = Object.freeze({
    AR_DEBUG_DISABLE: L,
    AR_DEBUG_ENABLE: O,
    AR_LOG_LEVEL_DEBUG: u,
    AR_LOG_LEVEL_INFO: d,
    AR_LOG_LEVEL_WARN: w,
    AR_LOG_LEVEL_ERROR: F,
    AR_LOG_LEVEL_REL_INFO: N,
    AR_PIXEL_FORMAT_RGBA: A,
    AR_PIXEL_FORMAT_MONO: l,
    AR_MATRIX_CODE_DETECTION: f,
    UNKNOWN_MARKER: -1,
    PATTERN_MARKER: 0,
    BARCODE_MARKER: 1
    // ... (tutte le altre che ti servono)
  });
  return { mod: t, core: a, constants: o };
}
export {
  T as addMarkerFromUrl,
  y as createARToolKit,
  M as loadCameraFromUrl
};
//# sourceMappingURL=index.js.map
