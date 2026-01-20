#pragma once

#include <cstdint>
#include <vector>
#include <unordered_map>

#include <AR/ar.h>
#include <AR/paramGL.h>
#include <AR/config.h>

#include "Errors.h"
#include "Types.h"

namespace arjs::artoolkit5 {

static int gARControllerID = 0;
static int gCameraID = 0;

static std::unordered_map<int, ARParam> cameraParams;

class Core {
public:
  Core();
  ~Core();

  Core(const Core&) = delete;
  Core& operator=(const Core&) = delete;

  // Allocates internal buffers and initializes core handles.
  // Returns 0 on success, <0 on error.
  int32_t setup(int32_t width, int32_t height, int32_t cameraID);

  // Releases all resources.
  int32_t teardown();

  // ---- Camera ----
  // Recommended: no FS dependency. Returns cameraId >=0, or <0 on error.
  int32_t loadCameraFromBuffer(int dataPtr, int32_t len);

  // Optional legacy path (only if you mount FS and write files).
  int32_t loadCameraFromPath(const char* cparamPath);

  int32_t setCamera(int32_t id, int32_t cameraID);

  // Writes 16 floats (column-major) to out16 (must point to 16 floats).
  void getCameraLens(int outPtr) const;

  // ---- Markers ----
  // Pattern: .patt file contents (ASCII) in memory.
  int32_t addPatternFromBuffer(int pattPtr, int32_t pattLen);
  void setMatrixCodeType(int32_t type);

  // ---- Config ----
  void setThreshold(int32_t threshold);
  int32_t getThreshold() const;

  void setThresholdMode(int32_t mode);
  int32_t getThresholdMode() const;

  void setDebugMode(int32_t enable);
  int32_t getDebugMode() const;

  void setImageProcMode(int32_t mode);
  int32_t getImageProcMode() const;

  void setProjectionNearPlane(float nearPlane);
  float getProjectionNearPlane() const;

  void setProjectionFarPlane(float farPlane);
  float getProjectionFarPlane() const;

  // ---- WASM-owned frame buffers ----
  // Valid until teardown() or setup() is called again.
  int getFrameBufferRGBA() const;
  int getFrameBufferGRAY() const;

  int32_t getFrameWidth() const { return this->width; }
  int32_t getFrameHeight() const { return this->height; }

  // Detect markers using the current internal frame buffer for given format.
  int32_t detect(int fmt);

  // ---- Results ----
  int32_t getMarkerCount() const;

  // 0 on success; negative on error.
  int32_t getMarkerSummary(int32_t index, MarkerSummary* out) const;

  // Writes 16 floats pose matrix (column-major) to out16.
  // 0 on success; negative on error.
  int32_t getMarkerPose44(int32_t index, int outPtr) const;

  // ---- ARToolKit constants (from <AR/ar.h> etc.) ----
  static int32_t ERROR_OK_();
  static int32_t ERROR_NOT_INITIALIZED_();
  static int32_t ERROR_INVALID_ARGUMENT_();
  static int32_t ERROR_ARCONTROLLER_NOT_FOUND_();
  static int32_t ERROR_MARKER_INDEX_OUT_OF_BOUNDS_();

  static int32_t AR_DEBUG_DISABLE_();
  static int32_t AR_DEBUG_ENABLE_();

  static int32_t AR_DEFAULT_LABELING_THRESH_();

  static int32_t AR_IMAGE_PROC_FRAME_IMAGE_();
  static int32_t AR_IMAGE_PROC_FIELD_IMAGE_();
  static int32_t AR_DEFAULT_IMAGE_PROC_MODE_();

  static int32_t AR_MAX_LOOP_COUNT_();
  static int32_t AR_LOOP_BREAK_THRESH_();

  static int32_t AR_LOG_LEVEL_DEBUG_();
  static int32_t AR_LOG_LEVEL_INFO_();
  static int32_t AR_LOG_LEVEL_WARN_();
  static int32_t AR_LOG_LEVEL_ERROR_();
  static int32_t AR_LOG_LEVEL_REL_INFO_();

  static int32_t AR_LABELING_THRESH_MODE_MANUAL_();
  static int32_t AR_LABELING_THRESH_MODE_AUTO_MEDIAN_();
  static int32_t AR_LABELING_THRESH_MODE_AUTO_OTSU_();
  static int32_t AR_LABELING_THRESH_MODE_AUTO_ADAPTIVE_();

  static int32_t AR_MARKER_INFO_CUTOFF_PHASE_NONE_();
  static int32_t AR_MARKER_INFO_CUTOFF_PHASE_PATTERN_EXTRACTION_();
  static int32_t AR_MARKER_INFO_CUTOFF_PHASE_MATCH_GENERIC_();
  static int32_t AR_MARKER_INFO_CUTOFF_PHASE_MATCH_CONTRAST_();
  static int32_t AR_MARKER_INFO_CUTOFF_PHASE_MATCH_BARCODE_NOT_FOUND_();
  static int32_t AR_MARKER_INFO_CUTOFF_PHASE_MATCH_BARCODE_EDC_FAIL_();
  static int32_t AR_MARKER_INFO_CUTOFF_PHASE_MATCH_CONFIDENCE_();
  static int32_t AR_MARKER_INFO_CUTOFF_PHASE_POSE_ERROR_();
  static int32_t AR_MARKER_INFO_CUTOFF_PHASE_POSE_ERROR_MULTI_();
  static int32_t AR_MARKER_INFO_CUTOFF_PHASE_HEURISTIC_TROUBLESOME_MATRIX_CODES_();

private:
  void destroyHandles_();
  int32_t ensureHandles_();
  void updateCameraLens_();
  void deleteHandle();

  // Converts ARToolKit 3x4 transform to column-major 4x4 float matrix.
  static void transform34ToMat44_(const ARdouble src34[3][4], float* out16);

  int32_t width = 0;
  int32_t height = 0;

  std::vector<uint8_t> frameRGBA_;
  std::vector<uint8_t> frameGRAY_;

  float nearPlane = 0.0001f;
  float farPlane = 1000.0f;

  int id;

  // Camera store
  // NOTE: For simplicity we can keep a global camera store in .cpp (unordered_map cameraId->ARParam),
  // similar to the legacy code. Here we store only the active one.
   ARParam param;
   ARParamLT *paramLT = nullptr;

	ARHandle *arHandle = nullptr;
  AR3DHandle* ar3DHandle = nullptr;
  ARPattHandle* pattHandle = nullptr;

  ARdouble cameraLens[16]{};

  AR_PIXEL_FORMAT pixFormat = AR_PIXEL_FORMAT_RGBA;
};

} // namespace arjs::artoolkit5