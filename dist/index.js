import o from "../dist/artoolkit5.js";
async function e(a) {
  const t = await fetch(a);
  if (!t.ok) throw new Error(`fetch failed ${t.status} ${t.statusText}: ${a}`);
  return new Uint8Array(await t.arrayBuffer());
}
function R(a, t) {
  const E = t.substring(0, t.lastIndexOf("/")) || "/";
  if (E !== "/")
    try {
      a.mkdir(E);
    } catch (r) {
      if (r.code !== "EEXIST") throw r;
    }
}
async function i(a, t, E, r = "/data/camera_para.dat") {
  const _ = await e(E);
  return R(a.FS, r), a.FS.writeFile(r, _), t._loadCamera(r);
}
async function A(a, t, E, r = "/data/patt.hiro") {
  const _ = await e(E);
  return R(a.FS, r), a.FS.writeFile(r, _), t.addMarker(r);
}
async function s(a = {}) {
  const t = await o({
    locateFile: a.locateFile,
    wasmBinary: a.wasmBinary
  }), E = new t.ARToolKitCore(), n = Object.freeze({
    AR_DEBUG_DISABLE: t.AR_DEBUG_DISABLE,
    AR_DEBUG_ENABLE: t.AR_DEBUG_ENABLE,
    AR_LOG_LEVEL_DEBUG: t.AR_LOG_LEVEL_DEBUG,
    AR_LOG_LEVEL_INFO: t.AR_LOG_LEVEL_INFO,
    AR_LOG_LEVEL_WARN: t.AR_LOG_LEVEL_WARN,
    AR_LOG_LEVEL_ERROR: t.AR_LOG_LEVEL_ERROR,
    AR_LOG_LEVEL_REL_INFO: t.AR_LOG_LEVEL_REL_INFO,
    UNKNOWN_MARKER: -1,
    PATTERN_MARKER: 0,
    BARCODE_MARKER: 1
    // ... (tutte le altre che ti servono)
  });
  return { mod: t, core: E, constants: n };
}
export {
  A as addMarkerFromUrl,
  s as createARToolKit,
  i as loadCameraFromUrl
};
//# sourceMappingURL=index.js.map
