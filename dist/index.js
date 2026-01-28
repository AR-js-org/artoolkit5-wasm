import R from "../dist/artoolkit5-embind.js";
async function _(t) {
  const r = await fetch(t);
  if (!r.ok) throw new Error(`fetch failed ${r.status} ${r.statusText}: ${t}`);
  return new Uint8Array(await r.arrayBuffer());
}
function o(t, r) {
  const e = r.substring(0, r.lastIndexOf("/")) || "/";
  if (e !== "/")
    try {
      t.mkdir(e);
    } catch (a) {
      if (a.code !== "EEXIST") throw a;
    }
}
async function i(t, r, e, a = "/data/camera_para.dat") {
  const E = await _(e);
  return o(t.FS, a), t.FS.writeFile(a, E), r._loadCamera(a);
}
async function A(t, r, e, a = "/data/patt.hiro") {
  const E = await _(e);
  return o(t.FS, a), t.FS.writeFile(a, E), r.addMarker(a);
}
async function s(t = {}) {
  const r = await R({
    locateFile: t.locateFile,
    wasmBinary: t.wasmBinary
  });
  console.log("mod from index.js:", r);
  const e = new r.ARToolKitCore();
  console.log("core from index.js:", e);
  const n = Object.freeze({
    AR_DEBUG_DISABLE: r.AR_DEBUG_DISABLE,
    AR_DEBUG_ENABLE: r.AR_DEBUG_ENABLE,
    AR_LOG_LEVEL_DEBUG: r.AR_LOG_LEVEL_DEBUG,
    AR_LOG_LEVEL_INFO: r.AR_LOG_LEVEL_INFO,
    AR_LOG_LEVEL_WARN: r.AR_LOG_LEVEL_WARN,
    AR_LOG_LEVEL_ERROR: r.AR_LOG_LEVEL_ERROR,
    AR_LOG_LEVEL_REL_INFO: r.AR_LOG_LEVEL_REL_INFO,
    UNKNOWN_MARKER: -1,
    PATTERN_MARKER: 0,
    BARCODE_MARKER: 1
    // ... (tutte le altre che ti servono)
  });
  return { mod: r, core: e, constants: n };
}
export {
  A as addMarkerFromUrl,
  s as createARToolKit,
  i as loadCameraFromUrl
};
//# sourceMappingURL=index.js.map
