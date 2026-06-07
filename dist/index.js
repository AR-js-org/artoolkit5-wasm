import _ from "../dist/artoolkit5.js";
async function E(t) {
  const r = await fetch(t);
  if (!r.ok) throw new Error(`fetch failed ${r.status} ${r.statusText}: ${t}`);
  return new Uint8Array(await r.arrayBuffer());
}
function R(t, r) {
  const o = r.lastIndexOf("/");
  if (o === -1) return;
  const n = r.substring(0, o);
  if (!n || n === "/" || n === ".") return;
  const a = r.startsWith("/"), c = n.split("/").filter(Boolean);
  let e = a ? "" : ".";
  for (const i of c) {
    e += "/" + i;
    try {
      t.analyzePath(e).exists || t.mkdir(e);
    } catch (s) {
      if (s.errno !== 17 && s.code !== "EEXIST")
        throw s;
    }
  }
}
async function M(t, r, o, n = "/data/camera_para.dat") {
  const a = await E(o);
  return R(t.FS, n), t.FS.writeFile(n, a), r._loadCamera(n);
}
async function T(t, r, o, n = "/data/patt.hiro") {
  const a = await E(o);
  return R(t.FS, n), t.FS.writeFile(n, a), r.addMarker(n);
}
const A = 2, l = 5, f = 2, L = 0, O = 1, u = 0, d = 1, w = 2, F = 3, N = 4;
async function m(t = {}) {
  t.quiet || console.log("artoolkit5-wasm v0.1.1");
  const r = await _({
    locateFile: t.locateFile,
    wasmBinary: t.wasmBinary
  }), o = new r.ARToolKitCore(), e = Object.freeze({
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
  });
  return { mod: r, core: o, constants: e };
}
export {
  T as addMarkerFromUrl,
  m as createARToolKit,
  M as loadCameraFromUrl
};
//# sourceMappingURL=index.js.map
