#pragma once
#include <cstdint>

namespace arjs::artoolkit5 {

    // Keep these stable; mirror them in WebIDL "const" or expose getters.
    constexpr int32_t ERROR_OK = 0;
    constexpr int32_t ERROR_NOT_INITIALIZED = -10;
    constexpr int32_t ERROR_INVALID_ARGUMENT = -11;

    // Compatibility-style errors (similar to current artoolkit5-js)
    constexpr int32_t ERROR_ARCONTROLLER_NOT_FOUND = -1;
    constexpr int32_t ERROR_MARKER_INDEX_OUT_OF_BOUNDS = -3;

} // namespace arjs::artoolkit5