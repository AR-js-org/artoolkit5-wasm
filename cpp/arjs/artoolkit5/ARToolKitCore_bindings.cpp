#include <emscripten/bind.h>
#include "ARToolKitCore.h"

using namespace emscripten;
using arjs::artoolkit5::ARToolKitCore;

EMSCRIPTEN_BINDINGS(ARToolKitCore_bindings) {
  //register_vector<std::string>("StringList");
  //register_vector<int>("IntList");
  //register_vector<nftMarker>("nftMarkers");

  class_<ARToolKitCore>("ARToolKitCore")
      .constructor()
      .function("detectMarker", &ARToolKitCore::detectMarker)
      .function("getMarkerInfo", &ARToolKitCore::getMarkerInfo)
      .function("getMarkerNum", &ARToolKitCore::getMarkerNum)
      .function("teardown", &ARToolKitCore::teardown)
      .function("_loadCamera", &ARToolKitCore::loadCamera)
      .function("setup", &ARToolKitCore::setup)
      .function("addMarker", &ARToolKitCore::addMarker)
      //.function("setFiltering", &ARToolKitCore::setFiltering)
      .function("setMarkerInfoVertex", &ARToolKitCore::setMarkerInfoVertex)
      .function("getCameraLens", &ARToolKitCore::getCameraLens)
      .function("recalculateCameraLens", &ARToolKitCore::recalculateCameraLens)
      .function("passVideoData", &ARToolKitCore::passVideoData)

      .function("setLogLevel", &ARToolKitCore::setLogLevel)
      .function("getLogLevel", &ARToolKitCore::getLogLevel)

      .function("setProjectionNearPlane", &ARToolKitCore::setProjectionNearPlane)
      .function("getProjectionNearPlane", &ARToolKitCore::getProjectionNearPlane)

      .function("setProjectionFarPlane", &ARToolKitCore::setProjectionFarPlane)
      .function("getProjectionFarPlane", &ARToolKitCore::getProjectionFarPlane)

      .function("setPattRatio", &ARToolKitCore::setPattRatio)
      .function("getPattRatio", &ARToolKitCore::getPattRatio)

      .function("setMatrixCodeType", &ARToolKitCore::setMatrixCodeType)
      .function("getMatrixCodeType", &ARToolKitCore::getMatrixCodeType)

      .function("setThresholdMode", &ARToolKitCore::setThresholdMode)
      .function("getThresholdMode", &ARToolKitCore::getThresholdMode)

      .function("setThreshold", &ARToolKitCore::setThreshold)
      .function("getThreshold", &ARToolKitCore::getThreshold)

      .function("setImageProcMode", &ARToolKitCore::setImageProcMode)
      .function("getImageProcMode", &ARToolKitCore::getImageProcMode)

      .function("setDebugMode", &ARToolKitCore::setDebugMode)
      .function("getDebugMode", &ARToolKitCore::getDebugMode)

      .function("getProcessingImage", &ARToolKitCore::getProcessingImage)

       .function("getTransMatSquare", &ARToolKitCore::getTransMatSquare)
       .function("getTransMatSquareCont", &ARToolKitCore::getTransMatSquareCont)
        .function("getTransform", &ARToolKitCore::getTransform);

  /* errors */
  constant("ERROR_MARKER_INDEX_OUT_OF_BOUNDS", arjs::artoolkit5::MARKER_INDEX_OUT_OF_BOUNDS);

  /* arDebug */
  constant("AR_DEBUG_DISABLE", AR_DEBUG_DISABLE);
  constant("AR_DEBUG_ENABLE", AR_DEBUG_ENABLE);
  constant("AR_DEFAULT_DEBUG_MODE", AR_DEFAULT_DEBUG_MODE);

  /* for arlabelingThresh */
  constant("AR_DEFAULT_LABELING_THRESH", AR_DEFAULT_LABELING_THRESH);

  /* for arImageProcMode */
  constant("AR_IMAGE_PROC_FRAME_IMAGE", AR_IMAGE_PROC_FRAME_IMAGE);
  constant("AR_IMAGE_PROC_FIELD_IMAGE", AR_IMAGE_PROC_FIELD_IMAGE);
  constant("AR_DEFAULT_IMAGE_PROC_MODE", AR_DEFAULT_IMAGE_PROC_MODE);

  /* for arGetTransMat */
  constant("AR_MAX_LOOP_COUNT", AR_MAX_LOOP_COUNT);
  constant("AR_LOOP_BREAK_THRESH", AR_LOOP_BREAK_THRESH);

  /* Enums */
  constant("AR_LOG_LEVEL_DEBUG", AR_LOG_LEVEL_DEBUG + 0);
  constant("AR_LOG_LEVEL_INFO", AR_LOG_LEVEL_INFO + 0);
  constant("AR_LOG_LEVEL_WARN", AR_LOG_LEVEL_WARN + 0);
  constant("AR_LOG_LEVEL_ERROR", AR_LOG_LEVEL_ERROR + 0);
  constant("AR_LOG_LEVEL_REL_INFO", AR_LOG_LEVEL_REL_INFO + 0);

  constant("AR_LABELING_THRESH_MODE_MANUAL",
           AR_LABELING_THRESH_MODE_MANUAL + 0);
  constant("AR_LABELING_THRESH_MODE_AUTO_MEDIAN",
           AR_LABELING_THRESH_MODE_AUTO_MEDIAN + 0);
  constant("AR_LABELING_THRESH_MODE_AUTO_OTSU",
           AR_LABELING_THRESH_MODE_AUTO_OTSU + 0);
  constant("AR_LABELING_THRESH_MODE_AUTO_ADAPTIVE",
           AR_LABELING_THRESH_MODE_AUTO_ADAPTIVE + 0);

  constant("AR_MARKER_INFO_CUTOFF_PHASE_NONE",
           AR_MARKER_INFO_CUTOFF_PHASE_NONE + 0);
  constant("AR_MARKER_INFO_CUTOFF_PHASE_PATTERN_EXTRACTION",
           AR_MARKER_INFO_CUTOFF_PHASE_PATTERN_EXTRACTION + 0);
  constant("AR_MARKER_INFO_CUTOFF_PHASE_MATCH_GENERIC",
           AR_MARKER_INFO_CUTOFF_PHASE_MATCH_GENERIC + 0);
  constant("AR_MARKER_INFO_CUTOFF_PHASE_MATCH_CONTRAST",
           AR_MARKER_INFO_CUTOFF_PHASE_MATCH_CONTRAST + 0);
  constant("AR_MARKER_INFO_CUTOFF_PHASE_MATCH_BARCODE_NOT_FOUND",
           AR_MARKER_INFO_CUTOFF_PHASE_MATCH_BARCODE_NOT_FOUND + 0);
  constant("AR_MARKER_INFO_CUTOFF_PHASE_MATCH_BARCODE_EDC_FAIL",
           AR_MARKER_INFO_CUTOFF_PHASE_MATCH_BARCODE_EDC_FAIL + 0);
  constant("AR_MARKER_INFO_CUTOFF_PHASE_MATCH_CONFIDENCE",
           AR_MARKER_INFO_CUTOFF_PHASE_MATCH_CONFIDENCE + 0);
  constant("AR_MARKER_INFO_CUTOFF_PHASE_POSE_ERROR",
           AR_MARKER_INFO_CUTOFF_PHASE_POSE_ERROR + 0);
  constant("AR_MARKER_INFO_CUTOFF_PHASE_POSE_ERROR_MULTI",
           AR_MARKER_INFO_CUTOFF_PHASE_POSE_ERROR_MULTI + 0);
  constant("AR_MARKER_INFO_CUTOFF_PHASE_HEURISTIC_TROUBLESOME_MATRIX_CODES",
           AR_MARKER_INFO_CUTOFF_PHASE_HEURISTIC_TROUBLESOME_MATRIX_CODES + 0);
};