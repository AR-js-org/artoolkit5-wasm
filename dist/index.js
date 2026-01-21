import e from "../dist/artoolkit5.js";
async function t(E) {
  const R = await fetch(E);
  if (!R.ok) throw new Error(`fetch failed ${R.status} ${R.statusText}: ${E}`);
  return new Uint8Array(await R.arrayBuffer());
}
function O(E, R) {
  const _ = R.substring(0, R.lastIndexOf("/")) || "/";
  if (_ !== "/")
    try {
      E.mkdir(_);
    } catch (a) {
      if (a.code !== "EEXIST") throw a;
    }
}
async function n(E, R, _, a = "/data/camera_para.dat") {
  const r = await t(_);
  return O(E.FS, a), E.FS.writeFile(a, r), R.loadCameraFromPath(a);
}
async function o(E, R, _, a = "/data/patt.hiro") {
  const r = await t(_);
  return O(E.FS, a), E.FS.writeFile(a, r), R.addMarker(a);
}
async function i(E = {}) {
  const R = await e({
    locateFile: E.locateFile,
    wasmBinary: E.wasmBinary
  }), _ = new R.ARToolKitCore(), a = Object.freeze({
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
    AR_LOG_LEVEL_REL_INFO: _.AR_LOG_LEVEL_REL_INFO_()
    // ... (tutte le altre che ti servono)
  });
  return { mod: R, core: _, constants: a };
}
export {
  o as addMarkerFromUrl,
  i as createARToolKit,
  n as loadCameraFromUrl
};
//# sourceMappingURL=index.js.map
