import L from "../dist/artoolkit5.js";
async function N(R = {}) {
  const E = await L({
    locateFile: R.locateFile,
    wasmBinary: R.wasmBinary
  }), _ = new E.ARToolKitCore(), O = Object.freeze({
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
  return { mod: E, core: _, constants: O };
}
export {
  N as createARToolKit
};
//# sourceMappingURL=index.js.map
