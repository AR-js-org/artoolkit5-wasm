#include "Core.h"
#include "Errors.h"
#include <cstdint>
#include <cstring>
#include <unordered_map>

namespace arjs::artoolkit5 {

// Simple camera registry similar to legacy approach.
// (You can replace with a different ownership model later.)

Core::Core() = default;

Core::~Core() {
  teardown();
}

int32_t Core::setup(int32_t width, int32_t height, int32_t cameraID) {
  if (width <= 0 || height <= 0) return ERROR_INVALID_ARGUMENT;

  int id = gARControllerID++;
  this->id = id;

  // Re-init safe.
  teardown();

  this->width = width;
  this->height = height;

  this->videoFrameSize = width * height * 4 * sizeof(ARUint8);

  frameRGBA_.resize(static_cast<size_t>(this->width) * static_cast<size_t>(this->height) * 4u);
  frameGRAY_.resize(static_cast<size_t>(this->width) * static_cast<size_t>(this->height));

  if (setCamera(id, cameraID) < 0) {
    ARLOGe("Core::setup(): Error setting camera ID %d.", cameraID);
    return ERROR_INVALID_ARGUMENT;
  };

  ARLOGi("Allocated videoFrameSize %d", this->videoFrameSize);

  // Camera and handles are created in setCamera(), after a camera is loaded.
  return this->id;
}

int32_t Core::teardown() {
  deleteHandle();
  if (this->pattHandle) {
    arPattDeleteHandle(this->pattHandle);
    this->pattHandle = nullptr;
  }

  frameRGBA_.clear();
  frameGRAY_.clear();
  this->width = 0;
  this->height = 0;
  return ERROR_OK;
}

int32_t Core::loadCameraFromPath(const char* cparamPath) {
  if (!cparamPath) return ERROR_INVALID_ARGUMENT;

  ARParam p;
  if (arParamLoad(cparamPath, 1, &p) < 0) {
    ARLOGe("loadCamera(): Error loading parameter file %s for camera.",
                 cparamPath);
    return ERROR_INVALID_ARGUMENT;
  }
  const int32_t id = gCameraID++;
  cameraParams[id] = p;
  return id;
}

int32_t Core::loadCameraFromBuffer(int dataPtr, int32_t len) {
  // NOTE: ARToolKit's arParamLoad expects a file path.
  // To truly avoid FS, you may need:
  // - a library function that loads from memory (if available), OR
  // - implement a small adapter that writes to MEMFS and then calls arParamLoad on that path.
  //
  // For now, treat this as TODO (return invalid).
  (void)dataPtr;
  (void)len;
  return ERROR_INVALID_ARGUMENT;
}

int32_t Core::setCamera(int32_t id, int32_t cameraID) {
  if (cameraParams.find(cameraID) == cameraParams.end()) {
    return -1;
  }

  this->param = cameraParams[cameraID];

  if (this->param.xsize != this->width || this->param.ysize != this->height) {
    ARLOGw("*** Camera Parameter resized from %d, %d. ***\n", this->param.xsize,
           this->param.ysize);
    arParamChangeSize(&(this->param), this->width, this->height,
                      &(this->param));
  }

  ARLOGi("*** Camera Parameter ***\n");
  arParamDisp(&(this->param));

  deleteHandle();
  if (this->paramLT != nullptr) {
    deleteHandle();
  }

  this->paramLT = arParamLTCreate(&(this->param), AR_PARAM_LT_DEFAULT_OFFSET);
  if (!this->paramLT) {
      ARLOGe("setCamera(): Error: arParamLTCreate for cameraID %d.", cameraID);
    return -1;
  }

  ARLOGi("setCamera(): arParamLTCreated: %d, %d\n", (this->paramLT->param).xsize, (this->paramLT->param).ysize);

  // setup camera
  if ((this->arHandle = arCreateHandle(this->paramLT)) == nullptr) {
    ARLOGe("setCamera(): Error: arCreateHandle.");
    return -1;
  }
  // AR_DEFAULT_PIXEL_FORMAT
  int set = arSetPixelFormat(this->arHandle, this->pixFormat);

  this->ar3DHandle = ar3DCreateHandle(&(this->param));
  if (this->ar3DHandle == nullptr) {
    ARLOGe("setCamera(): Error creating 3D handle");
    return -1;
  }

  arglCameraFrustumRH(&(this->paramLT->param), this->nearPlane,
                      this->farPlane, this->cameraLens);

  return 0;
}

int32_t Core::loadMarker(const char *patt_name, int patt_id_ptr, int pattHandle_ptr) {
		// Loading only 1 pattern in this example.
    auto* patt_id = reinterpret_cast<float*>(static_cast<uintptr_t>(patt_id_ptr));
    //auto* arhandle = reinterpret_cast<ARHandle*>(static_cast<uintptr_t>(arhandlePtr));
    auto** pattHandle = reinterpret_cast<ARPattHandle**>(static_cast<uintptr_t>(pattHandle_ptr));
		if ((*patt_id = arPattLoad(*pattHandle, patt_name)) < 0) {
			ARLOGe("loadMarker(): Error loading pattern file %s.\n", patt_name);
			arPattDeleteHandle(*pattHandle);
			return 0;
		}

		return 1;
	}

void Core::getCameraLens(int outPtr) const {
  //arParamLT_if (!arParamLT_) return;
  if (!outPtr) return;

  auto* out16 = reinterpret_cast<float*>(static_cast<uintptr_t>(outPtr));
  std::memcpy(out16, this->cameraLens, sizeof(this->cameraLens));
}

void Core::setProjectionNearPlane(float nearPlane) {
  this->nearPlane = nearPlane;
  updateCameraLens_();
}

float Core::getProjectionNearPlane() const {
  return this->nearPlane;
}

void Core::setProjectionFarPlane(float farPlane) {
  this->farPlane = farPlane;
  updateCameraLens_();
}

float Core::getProjectionFarPlane() const {
  return this->farPlane;
}

void Core::updateCameraLens_() {
  if (!this->paramLT) return;
  // Fills 16 doubles; we store as float.
  ARdouble tmp[16];
  arglCameraFrustumRH(&this->paramLT->param, this->nearPlane, this->farPlane, tmp);
  for (int i = 0; i < 16; i++) this->cameraLens[i] = static_cast<float>(tmp[i]);
}

int Core::getFrameBufferRGBA() const {
  return frameRGBA_.empty() ? 0 : static_cast<int>(reinterpret_cast<uintptr_t>(frameRGBA_.data()));
}

int Core::getFrameBufferGRAY() const {
  return frameGRAY_.empty() ? 0 : static_cast<int>(reinterpret_cast<uintptr_t>(frameGRAY_.data()));
}

int32_t Core::detect(int fmt) {
  if (!this->arHandle) return ERROR_NOT_INITIALIZED;

  AR2VideoBufferT buff{};
  buff.fillFlag = 1;

  auto pf = static_cast<PixelFormat>(fmt);

  switch (pf) {
    case PixelFormat::RGBA8:
      buff.buff = frameRGBA_.data();
      // If you want ARToolKit to compute luma internally, keep buffLuma null.
      // If you precompute luma in TS into frameGRAY_, you can also set:
      // buff.buffLuma = frameGRAY_.data();
      break;
    case PixelFormat::GRAY8:
      // Depending on ARToolKit expectations, you may need to set buff.buff and/or buff.buffLuma.
      // Commonly: put grayscale into buffLuma.
      buff.buff = nullptr;
      buff.buffLuma = frameGRAY_.data();
      break;
    default:
      return ERROR_INVALID_ARGUMENT;
  }

  return arDetectMarker(this->arHandle, &buff);
}

int32_t Core::getMarkerCount() const {
  if (!this->arHandle) return 0;
  return this->arHandle->marker_num;
}

int32_t Core::getMarkerSummary(int32_t index, MarkerSummary* out) const {
  if (!out) return ERROR_INVALID_ARGUMENT;
  if (!this->arHandle) return ERROR_NOT_INITIALIZED;
  if (index < 0 || index >= this->arHandle->marker_num) return ERROR_MARKER_INDEX_OUT_OF_BOUNDS;

  const ARMarkerInfo& m = this->arHandle->markerInfo[index];

  // Determine kind: if a matrix id is present, treat as barcode; else pattern.
  // (You may want a more robust rule based on arHandle configuration.)
  if (m.idMatrix >= 0) {
    out->kind = MarkerKind::Barcode;
    out->id = m.idMatrix;
    out->confidence = static_cast<float>(m.cfMatrix);
    out->dir = m.dirMatrix;
  } else {
    out->kind = MarkerKind::Pattern;
    out->id = m.idPatt;
    out->confidence = static_cast<float>(m.cfPatt);
    out->dir = m.dirPatt;
  }

  return ERROR_OK;
}

int32_t Core::getMarkerPose44(int32_t index, int outPtr) const {
  if (!outPtr) return ERROR_INVALID_ARGUMENT;
  if (!this->arHandle || !this->ar3DHandle) return ERROR_NOT_INITIALIZED;
  if (index < 0 || index >= this->arHandle->marker_num) return ERROR_MARKER_INDEX_OUT_OF_BOUNDS;

  auto* out16 = reinterpret_cast<float*>(static_cast<uintptr_t>(outPtr));

  ARdouble trans34[3][4];
  ARMarkerInfo* marker = &this->arHandle->markerInfo[index];

  const ARdouble markerWidth = 80.0;
  arGetTransMatSquare(this->ar3DHandle, marker, markerWidth, trans34);

  transform34ToMat44_(trans34, out16);
  return ERROR_OK;
}

void Core::transform34ToMat44_(const ARdouble src34[3][4], float* out16) {
  // Column-major 4x4 (WebGL):
  // [ r00 r01 r02 tx ]
  // [ r10 r11 r12 ty ]
  // [ r20 r21 r22 tz ]
  // [  0   0   0  1  ]
  //
  // src34 is row-major 3x4: [ [r00 r01 r02 tx], ... ]
  out16[0]  = static_cast<float>(src34[0][0]);
  out16[1]  = static_cast<float>(src34[1][0]);
  out16[2]  = static_cast<float>(src34[2][0]);
  out16[3]  = 0.0f;

  out16[4]  = static_cast<float>(src34[0][1]);
  out16[5]  = static_cast<float>(src34[1][1]);
  out16[6]  = static_cast<float>(src34[2][1]);
  out16[7]  = 0.0f;

  out16[8]  = static_cast<float>(src34[0][2]);
  out16[9]  = static_cast<float>(src34[1][2]);
  out16[10] = static_cast<float>(src34[2][2]);
  out16[11] = 0.0f;

  out16[12] = static_cast<float>(src34[0][3]);
  out16[13] = static_cast<float>(src34[1][3]);
  out16[14] = static_cast<float>(src34[2][3]);
  out16[15] = 1.0f;
}

int32_t Core::addPatternFromBuffer(int pattPtr, int32_t pattLen) {
  (void)pattPtr;
  (void)pattLen;
  return ERROR_INVALID_ARGUMENT;
}

void Core::setMatrixCodeType(int32_t type) {
  if (!this->arHandle) return;
  arSetMatrixCodeType(this->arHandle, static_cast<AR_MATRIX_CODE_TYPE>(type));
}

void Core::setThreshold(int32_t threshold) {
  if (!this->arHandle) return;
  if (threshold < 0 || threshold > 255) return;
  arSetLabelingThresh(this->arHandle, threshold);
}

int32_t Core::getThreshold() const {
  if (!this->arHandle) return ERROR_NOT_INITIALIZED;
  int t = -1;
  arGetLabelingThresh(this->arHandle, &t);
  return t;
}

void Core::setThresholdMode(int32_t mode) {
  if (!this->arHandle) return;
  arSetLabelingThreshMode(this->arHandle, static_cast<AR_LABELING_THRESH_MODE>(mode));
}

int32_t Core::getThresholdMode() const {
  if (!this->arHandle) return ERROR_NOT_INITIALIZED;
  AR_LABELING_THRESH_MODE m;
  arGetLabelingThreshMode(this->arHandle, &m);
  return static_cast<int32_t>(m);
}

void Core::setDebugMode(int32_t enable) {
  if (!this->arHandle) return;
  arSetDebugMode(this->arHandle, enable ? AR_DEBUG_ENABLE : AR_DEBUG_DISABLE);
}

int32_t Core::getDebugMode() const {
  if (!this->arHandle) return ERROR_NOT_INITIALIZED;
  int enable = 0;
  arGetDebugMode(this->arHandle, &enable);
  return enable;
}

void Core::setImageProcMode(int32_t mode) {
  if (!this->arHandle) return;
  arSetImageProcMode(this->arHandle, mode);
}

int32_t Core::getImageProcMode() const {
  if (!this->arHandle) return ERROR_NOT_INITIALIZED;
  int mode = 0;
  arGetImageProcMode(this->arHandle, &mode);
  return mode;
}

void Core::destroyHandles_() {
  /*if (arHandle_) {
    arPattDetach(arHandle_);
    arDeleteHandle(arHandle_);
    arHandle_ = nullptr;
  }
  if (ar3DHandle_) {
    ar3DDeleteHandle(&ar3DHandle_);
    ar3DHandle_ = nullptr;
  }
  if (paramLT_) {
    arParamLTFree(&paramLT_);
    paramLT_ = nullptr;
  }*/
}

void Core::deleteHandle() {
  if (this->arHandle != nullptr) {
    if (arPattDetach(this->arHandle) != 0) {
      ARLOGe("Error detaching pattern from arhandle.");
    }
    arDeleteHandle(this->arHandle);
    this->arHandle = nullptr;
  }
  if (this->ar3DHandle != nullptr) {
    ar3DDeleteHandle(&(this->ar3DHandle));
    this->ar3DHandle = nullptr;
  }
  if (this->paramLT != nullptr) {
    arParamLTFree(&(this->paramLT));
    this->paramLT = nullptr;
  }
}

int32_t Core::ERROR_OK_() { return ERROR_OK; }
int32_t Core::ERROR_NOT_INITIALIZED_() { return ERROR_NOT_INITIALIZED; }
int32_t Core::ERROR_INVALID_ARGUMENT_() { return ERROR_INVALID_ARGUMENT; }
int32_t Core::ERROR_ARCONTROLLER_NOT_FOUND_() { return ERROR_ARCONTROLLER_NOT_FOUND; }
int32_t Core::ERROR_MARKER_INDEX_OUT_OF_BOUNDS_() { return ERROR_MARKER_INDEX_OUT_OF_BOUNDS; }

int32_t Core::AR_DEBUG_DISABLE_() { return AR_DEBUG_DISABLE; }
int32_t Core::AR_DEBUG_ENABLE_() { return AR_DEBUG_ENABLE; }

int32_t Core::AR_DEFAULT_LABELING_THRESH_() { return AR_DEFAULT_LABELING_THRESH; }

int32_t Core::AR_IMAGE_PROC_FRAME_IMAGE_() { return AR_IMAGE_PROC_FRAME_IMAGE; }
int32_t Core::AR_IMAGE_PROC_FIELD_IMAGE_() { return AR_IMAGE_PROC_FIELD_IMAGE; }
int32_t Core::AR_DEFAULT_IMAGE_PROC_MODE_() { return AR_DEFAULT_IMAGE_PROC_MODE; }

int32_t Core::AR_MAX_LOOP_COUNT_() { return AR_MAX_LOOP_COUNT; }
int32_t Core::AR_LOOP_BREAK_THRESH_() { return AR_LOOP_BREAK_THRESH; }

int32_t Core::AR_LOG_LEVEL_DEBUG_() { return (int32_t)AR_LOG_LEVEL_DEBUG; }
int32_t Core::AR_LOG_LEVEL_INFO_() { return (int32_t)AR_LOG_LEVEL_INFO; }
int32_t Core::AR_LOG_LEVEL_WARN_() { return (int32_t)AR_LOG_LEVEL_WARN; }
int32_t Core::AR_LOG_LEVEL_ERROR_() { return (int32_t)AR_LOG_LEVEL_ERROR; }
int32_t Core::AR_LOG_LEVEL_REL_INFO_() { return (int32_t)AR_LOG_LEVEL_REL_INFO; }

int32_t Core::AR_LABELING_THRESH_MODE_MANUAL_() { return (int32_t)AR_LABELING_THRESH_MODE_MANUAL; }
int32_t Core::AR_LABELING_THRESH_MODE_AUTO_MEDIAN_() { return (int32_t)AR_LABELING_THRESH_MODE_AUTO_MEDIAN; }
int32_t Core::AR_LABELING_THRESH_MODE_AUTO_OTSU_() { return (int32_t)AR_LABELING_THRESH_MODE_AUTO_OTSU; }
int32_t Core::AR_LABELING_THRESH_MODE_AUTO_ADAPTIVE_() { return (int32_t)AR_LABELING_THRESH_MODE_AUTO_ADAPTIVE; }

int32_t Core::AR_MARKER_INFO_CUTOFF_PHASE_NONE_() { return (int32_t)AR_MARKER_INFO_CUTOFF_PHASE_NONE; }
int32_t Core::AR_MARKER_INFO_CUTOFF_PHASE_PATTERN_EXTRACTION_() { return (int32_t)AR_MARKER_INFO_CUTOFF_PHASE_PATTERN_EXTRACTION; }
int32_t Core::AR_MARKER_INFO_CUTOFF_PHASE_MATCH_GENERIC_() { return (int32_t)AR_MARKER_INFO_CUTOFF_PHASE_MATCH_GENERIC; }
int32_t Core::AR_MARKER_INFO_CUTOFF_PHASE_MATCH_CONTRAST_() { return (int32_t)AR_MARKER_INFO_CUTOFF_PHASE_MATCH_CONTRAST; }
int32_t Core::AR_MARKER_INFO_CUTOFF_PHASE_MATCH_BARCODE_NOT_FOUND_() { return (int32_t)AR_MARKER_INFO_CUTOFF_PHASE_MATCH_BARCODE_NOT_FOUND; }
int32_t Core::AR_MARKER_INFO_CUTOFF_PHASE_MATCH_BARCODE_EDC_FAIL_() { return (int32_t)AR_MARKER_INFO_CUTOFF_PHASE_MATCH_BARCODE_EDC_FAIL; }
int32_t Core::AR_MARKER_INFO_CUTOFF_PHASE_MATCH_CONFIDENCE_() { return (int32_t)AR_MARKER_INFO_CUTOFF_PHASE_MATCH_CONFIDENCE; }
int32_t Core::AR_MARKER_INFO_CUTOFF_PHASE_POSE_ERROR_() { return (int32_t)AR_MARKER_INFO_CUTOFF_PHASE_POSE_ERROR; }
int32_t Core::AR_MARKER_INFO_CUTOFF_PHASE_POSE_ERROR_MULTI_() { return (int32_t)AR_MARKER_INFO_CUTOFF_PHASE_POSE_ERROR_MULTI; }
int32_t Core::AR_MARKER_INFO_CUTOFF_PHASE_HEURISTIC_TROUBLESOME_MATRIX_CODES_() { return (int32_t)AR_MARKER_INFO_CUTOFF_PHASE_HEURISTIC_TROUBLESOME_MATRIX_CODES; }

} // namespace arjs::artoolkit5