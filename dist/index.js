import L from "../dist/artoolkit5.js";
async function r(E) {
  const R = await fetch(E);
  if (!R.ok) throw new Error(`fetch failed ${R.status} ${R.statusText}: ${E}`);
  return new Uint8Array(await R.arrayBuffer());
}
function O(E, R) {
  const _ = R.substring(0, R.lastIndexOf("/")) || "/";
  if (_ !== "/")
    try {
      E.mkdir(_);
    } catch (t) {
      if (t.code !== "EEXIST") throw t;
    }
}
async function o(E, R, _, t = "/data/camera_para.dat") {
  const a = await r(_);
  return O(E.FS, t), E.FS.writeFile(t, a), R.loadCameraFromPath(t);
}
async function c(E, R, _, t = "/data/patt.hiro") {
  const a = await r(_);
  return O(E.FS, t), E.FS.writeFile(t, a), R.addMarker(t);
}
async function N(E = {}) {
  const R = await L({
    locateFile: E.locateFile,
    wasmBinary: E.wasmBinary
  }), _ = new R.ARToolKitCore(), e = Object.freeze({
    ERROR_OK: _.ERROR_OK_(),
    ERROR_NOT_INITIALIZED: _.ERROR_NOT_INITIALIZED_(),
    ERROR_INVALID_ARGUMENT: _.ERROR_INVALID_ARGUMENT_(),
    ERROR_ARCONTROLLER_NOT_FOUND: _.ERROR_ARCONTROLLER_NOT_FOUND_(),
    ERROR_MARKER_INDEX_OUT_OF_BOUNDS: _.ERROR_MARKER_INDEX_OUT_OF_BOUNDS_(),
    AR_DEBUG_DISABLE: _.AR_DEBUG_DISABLE_(),
    AR_DEBUG_ENABLE: _.AR_DEBUG_ENABLE_(),
    AR_LOG_LEVEL_DEBUG: _.AR_LOG_LEVEL_DEBUG_(),
    AR_LOG_LEVEL_INFO: _.AR_LOG_LEVEL_INFO_(),
    AR_LOG_LEVEL_WARN: _.AR_LOG_LEVEL_WARN_(),
    AR_LOG_LEVEL_ERROR: _.AR_LOG_LEVEL_ERROR_(),
    AR_LOG_LEVEL_REL_INFO: _.AR_LOG_LEVEL_REL_INFO_(),
    UNKNOWN_MARKER: -1,
    PATTERN_MARKER: 0,
    BARCODE_MARKER: 1
    // ... (tutte le altre che ti servono)
  });
  return { mod: R, core: _, constants: e };
}
export {
  c as addMarkerFromUrl,
  N as createARToolKit,
  o as loadCameraFromUrl
};
//# sourceMappingURL=index.js.map
