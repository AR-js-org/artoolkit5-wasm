#pragma once

#include <cstdint>
#include <vector>

#include <AR/ar.h>
#include <AR/paramGL.h>
#include <AR/config.h>

#include "Errors.h"
#include "Types.h"

namespace arjs::artoolkit5 {

class Core {
public:
  Core();
  ~Core();

  Core(const Core&) = delete;
  Core& operator=(const Core&) = delete;

  // Allocates internal buffers and initializes core handles.
  // Returns 0 on success, <0 on error.
  int32_t setup(int32_t width, int32_t height);

  // Releases all resources.
  int32_t teardown();

  // ---- Camera ----
  // Recommended: no FS dependency. Returns cameraId >=0, or <0 on error.
  int32_t loadCameraFromBuffer(int dataPtr, int32_t len);

  // Optional legacy path (only if you mount FS and write files).
  int32_t loadCameraFromPath(const char* cparamPath);

  int32_t setCamera(int32_t cameraId);

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

  int32_t getFrameWidth() const { return width_; }
  int32_t getFrameHeight() const { return height_; }

  // Detect markers using the current internal frame buffer for given format.
  int32_t detect(int fmt);

  // ---- Results ----
  int32_t getMarkerCount() const;

  // 0 on success; negative on error.
  int32_t getMarkerSummary(int32_t index, MarkerSummary* out) const;

  // Writes 16 floats pose matrix (column-major) to out16.
  // 0 on success; negative on error.
  int32_t getMarkerPose44(int32_t index, int outPtr) const;

static int32_t ERROR_OK_();
static int32_t ERROR_NOT_INITIALIZED_();
static int32_t ERROR_INVALID_ARGUMENT_();
static int32_t ERROR_ARCONTROLLER_NOT_FOUND_();
static int32_t ERROR_MARKER_INDEX_OUT_OF_BOUNDS_();

private:
  void destroyHandles_();
  int32_t ensureHandles_();
  void updateCameraLens_();

  // Converts ARToolKit 3x4 transform to column-major 4x4 float matrix.
  static void transform34ToMat44_(const ARdouble src34[3][4], float* out16);

  int32_t width_ = 0;
  int32_t height_ = 0;

  std::vector<uint8_t> frameRGBA_;
  std::vector<uint8_t> frameGRAY_;

  float nearPlane_ = 0.0001f;
  float farPlane_ = 1000.0f;

  // Camera store
  // NOTE: For simplicity we can keep a global camera store in .cpp (unordered_map cameraId->ARParam),
  // similar to the legacy code. Here we store only the active one.
  ARParam param_{};
  ARParamLT* paramLT_ = nullptr;

  ARHandle* arHandle_ = nullptr;
  AR3DHandle* ar3DHandle_ = nullptr;
  ARPattHandle* pattHandle_ = nullptr;

  float cameraLens_[16]{};
};

} // namespace arjs::artoolkit5