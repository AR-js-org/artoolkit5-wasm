#include "Core.h"
#include "Errors.h"
#include <cstdint>
#include <cstring>
#include <unordered_map>

namespace arjs::artoolkit5 {

// Simple camera registry similar to legacy approach.
// (You can replace with a different ownership model later.)
static int32_t gCameraId = 0;
static std::unordered_map<int32_t, ARParam> gCameraParams;

Core::Core() = default;

Core::~Core() {
  teardown();
}

int32_t Core::setup(int32_t width, int32_t height) {
  if (width <= 0 || height <= 0) return ERROR_INVALID_ARGUMENT;

  // Re-init safe.
  teardown();

  width_ = width;
  height_ = height;

  frameRGBA_.resize(static_cast<size_t>(width_) * static_cast<size_t>(height_) * 4u);
  frameGRAY_.resize(static_cast<size_t>(width_) * static_cast<size_t>(height_));

  pattHandle_ = arPattCreateHandle();
  if (!pattHandle_) return ERROR_NOT_INITIALIZED;

  // Camera and handles are created in setCamera(), after a camera is loaded.
  return ERROR_OK;
}

int32_t Core::teardown() {
  destroyHandles_();
  if (pattHandle_) {
    arPattDeleteHandle(pattHandle_);
    pattHandle_ = nullptr;
  }

  frameRGBA_.clear();
  frameGRAY_.clear();
  width_ = 0;
  height_ = 0;
  return ERROR_OK;
}

int32_t Core::loadCameraFromPath(const char* cparamPath) {
  if (!cparamPath) return ERROR_INVALID_ARGUMENT;

  ARParam p;
  if (arParamLoad(cparamPath, 1, &p) < 0) {
    return ERROR_INVALID_ARGUMENT;
  }
  const int32_t id = gCameraId++;
  gCameraParams[id] = p;
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

int32_t Core::setCamera(int32_t cameraId) {
  if (!pattHandle_) return ERROR_NOT_INITIALIZED;

  auto it = gCameraParams.find(cameraId);
  if (it == gCameraParams.end()) return ERROR_INVALID_ARGUMENT;

  param_ = it->second;

  // Resize camera params to match current frame size.
  if (param_.xsize != width_ || param_.ysize != height_) {
    arParamChangeSize(&param_, width_, height_, &param_);
  }

  destroyHandles_();

  paramLT_ = arParamLTCreate(&param_, AR_PARAM_LT_DEFAULT_OFFSET);
  if (!paramLT_) return ERROR_NOT_INITIALIZED;

  arHandle_ = arCreateHandle(paramLT_);
  if (!arHandle_) return ERROR_NOT_INITIALIZED;

  // Default pixel format: we'll set per-detect via AR2VideoBufferT.luma,
  // but arHandle_ still needs a pixel format. Keep RGBA default.
  arSetPixelFormat(arHandle_, AR_PIXEL_FORMAT_RGBA);

  arPattAttach(arHandle_, pattHandle_);

  ar3DHandle_ = ar3DCreateHandle(&param_);
  if (!ar3DHandle_) return ERROR_NOT_INITIALIZED;

  updateCameraLens_();
  return ERROR_OK;
}

void Core::getCameraLens(int outPtr) const {
  //arParamLT_if (!arParamLT_) return;
  if (!outPtr) return;

  auto* out16 = reinterpret_cast<float*>(static_cast<uintptr_t>(outPtr));
  std::memcpy(out16, cameraLens_, sizeof(cameraLens_));
}

void Core::setProjectionNearPlane(float nearPlane) {
  nearPlane_ = nearPlane;
  updateCameraLens_();
}

float Core::getProjectionNearPlane() const {
  return nearPlane_;
}

void Core::setProjectionFarPlane(float farPlane) {
  farPlane_ = farPlane;
  updateCameraLens_();
}

float Core::getProjectionFarPlane() const {
  return farPlane_;
}

void Core::updateCameraLens_() {
  if (!paramLT_) return;
  // Fills 16 doubles; we store as float.
  ARdouble tmp[16];
  arglCameraFrustumRH(&paramLT_->param, nearPlane_, farPlane_, tmp);
  for (int i = 0; i < 16; i++) cameraLens_[i] = static_cast<float>(tmp[i]);
}

int Core::getFrameBufferRGBA() const {
  return frameRGBA_.empty() ? 0 : static_cast<int>(reinterpret_cast<uintptr_t>(frameRGBA_.data()));
}

int Core::getFrameBufferGRAY() const {
  return frameGRAY_.empty() ? 0 : static_cast<int>(reinterpret_cast<uintptr_t>(frameGRAY_.data()));
}

int32_t Core::detect(int fmt) {
  if (!arHandle_) return ERROR_NOT_INITIALIZED;

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

  return arDetectMarker(arHandle_, &buff);
}

int32_t Core::getMarkerCount() const {
  if (!arHandle_) return 0;
  return arHandle_->marker_num;
}

int32_t Core::getMarkerSummary(int32_t index, MarkerSummary* out) const {
  if (!out) return ERROR_INVALID_ARGUMENT;
  if (!arHandle_) return ERROR_NOT_INITIALIZED;
  if (index < 0 || index >= arHandle_->marker_num) return ERROR_MARKER_INDEX_OUT_OF_BOUNDS;

  const ARMarkerInfo& m = arHandle_->markerInfo[index];

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
  if (!arHandle_ || !ar3DHandle_) return ERROR_NOT_INITIALIZED;
  if (index < 0 || index >= arHandle_->marker_num) return ERROR_MARKER_INDEX_OUT_OF_BOUNDS;

  auto* out16 = reinterpret_cast<float*>(static_cast<uintptr_t>(outPtr));

  ARdouble trans34[3][4];
  ARMarkerInfo* marker = &arHandle_->markerInfo[index];

  const ARdouble markerWidth = 80.0;
  arGetTransMatSquare(ar3DHandle_, marker, markerWidth, trans34);

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
  if (!arHandle_) return;
  arSetMatrixCodeType(arHandle_, static_cast<AR_MATRIX_CODE_TYPE>(type));
}

void Core::setThreshold(int32_t threshold) {
  if (!arHandle_) return;
  if (threshold < 0 || threshold > 255) return;
  arSetLabelingThresh(arHandle_, threshold);
}

int32_t Core::getThreshold() const {
  if (!arHandle_) return ERROR_NOT_INITIALIZED;
  int t = -1;
  arGetLabelingThresh(arHandle_, &t);
  return t;
}

void Core::setThresholdMode(int32_t mode) {
  if (!arHandle_) return;
  arSetLabelingThreshMode(arHandle_, static_cast<AR_LABELING_THRESH_MODE>(mode));
}

int32_t Core::getThresholdMode() const {
  if (!arHandle_) return ERROR_NOT_INITIALIZED;
  AR_LABELING_THRESH_MODE m;
  arGetLabelingThreshMode(arHandle_, &m);
  return static_cast<int32_t>(m);
}

void Core::setDebugMode(int32_t enable) {
  if (!arHandle_) return;
  arSetDebugMode(arHandle_, enable ? AR_DEBUG_ENABLE : AR_DEBUG_DISABLE);
}

int32_t Core::getDebugMode() const {
  if (!arHandle_) return ERROR_NOT_INITIALIZED;
  int enable = 0;
  arGetDebugMode(arHandle_, &enable);
  return enable;
}

void Core::setImageProcMode(int32_t mode) {
  if (!arHandle_) return;
  arSetImageProcMode(arHandle_, mode);
}

int32_t Core::getImageProcMode() const {
  if (!arHandle_) return ERROR_NOT_INITIALIZED;
  int mode = 0;
  arGetImageProcMode(arHandle_, &mode);
  return mode;
}

void Core::destroyHandles_() {
  if (arHandle_) {
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