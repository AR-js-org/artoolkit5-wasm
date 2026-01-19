#pragma once
#include <cstdint>

namespace arjs::artoolkit5 {

    enum class PixelFormat : int32_t {
        RGBA8 = 0,
        GRAY8 = 1
      };

    enum class MarkerKind : int32_t {
        Pattern = 0,
        Barcode = 1
      };

    struct MarkerSummary {
        MarkerKind kind;
        int32_t id;        // patternId OR matrixId
        float confidence;  // cfPatt or cfMatrix (or unified)
        int32_t dir;       // optional, useful for debugging
    };

} // namespace arjs::artoolkit5