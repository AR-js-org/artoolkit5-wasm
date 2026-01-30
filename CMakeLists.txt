cmake_minimum_required(VERSION 3.22)

project(artoolkit5_wasm LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Output directory for final artifacts.
set(DIST_DIR "${CMAKE_SOURCE_DIR}/dist")
file(MAKE_DIRECTORY "${DIST_DIR}")

option(ENABLE_WASM_DEBUG_FLAGS "Enable Emscripten debug flags" OFF)

# ---- WebARKitLib (git submodule) ----
set(WEBARKITLIB_DIR "${CMAKE_SOURCE_DIR}/third_party/WebARKitLib" CACHE PATH "Path to WebARKitLib checkout (submodule).")
set(WEBARKITLIB_INCLUDE_DIR "${WEBARKITLIB_DIR}/include")
set(WEBARKITLIB_SRC_DIR "${WEBARKITLIB_DIR}/lib/SRC")

if (NOT EXISTS "${WEBARKITLIB_INCLUDE_DIR}/AR/ar.h")
    message(FATAL_ERROR "Could not find ${WEBARKITLIB_INCLUDE_DIR}/AR/ar.h. Did you init submodules? (git submodule update --init --recursive)")
endif ()

if (NOT EXISTS "${WEBARKITLIB_SRC_DIR}/AR")
    message(FATAL_ERROR "Could not find ${WEBARKITLIB_SRC_DIR}/AR. Expected WebARKitLib/lib/SRC/AR.")
endif ()

# ---- WebARKitLib sources (pattern + barcode only) ----
# Keep the build focused: exclude AR2/KPM/NFT. Add ARMulti back only if link errors demand it.
file(GLOB WEBARKIT_AR_SOURCES
        "${WEBARKITLIB_SRC_DIR}/AR/arLabelingSub/*.c"
        "${WEBARKITLIB_SRC_DIR}/AR/*.c"
)

file(GLOB WEBARKIT_ARICP_SOURCES
        "${WEBARKITLIB_SRC_DIR}/ARICP/*.c"
)

file(GLOB WEBARKIT_ARUTIL_SOURCES
        "${WEBARKITLIB_SRC_DIR}/ARUtil/file_utils.c"
        "${WEBARKITLIB_SRC_DIR}/ARUtil/log.c"
        "${WEBARKITLIB_SRC_DIR}/ARUtil/system.c"
        "${WEBARKITLIB_SRC_DIR}/ARUtil/thread_sub.c"
        "${WEBARKITLIB_SRC_DIR}/ARUtil/time.c"
        "${WEBARKITLIB_SRC_DIR}/ARUtil/nftw.c"
)

file(GLOB WEBARKIT_VIDEO_SOURCES
        "${WEBARKITLIB_SRC_DIR}/Video/*.c"
)

file(GLOB WEBARKIT_EXTRA_SOURCES
        "${WEBARKITLIB_SRC_DIR}/WebARKit/*.cpp"
        "${WEBARKITLIB_DIR}/WebARKit/*.cpp")

# Optional: if you hit missing symbols, uncomment this to include multimarker support sources.
# file(GLOB WEBARKIT_ARMULTI_SOURCES
#   "${WEBARKITLIB_SRC_DIR}/ARMulti/*.c"
# )

# Sanity checks (helpful when paths change)
list(LENGTH WEBARKIT_AR_SOURCES WEBARKIT_AR_SOURCES_COUNT)
list(LENGTH WEBARKIT_ARICP_SOURCES WEBARKIT_ARICP_SOURCES_COUNT)
list(LENGTH WEBARKIT_ARUTIL_SOURCES WEBARKIT_ARUTIL_SOURCES_COUNT)
list(LENGTH WEBARKIT_VIDEO_SOURCES WEBARKIT_VIDEO_SOURCES_COUNT)

if (WEBARKIT_AR_SOURCES_COUNT EQUAL 0)
    message(FATAL_ERROR "No sources found in ${WEBARKITLIB_SRC_DIR}/AR. Check WebARKitLib checkout.")
endif ()

set(USE_FLAGS "-s USE_ZLIB=1")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${USE_FLAGS}")
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} ${USE_FLAGS}")

# ---- New Build target (Embind) ----
# Create an embind-based WASM module exposing bindings via cpp/bindings/embind/ARToolKitCore_bindings.cpp
add_executable(artoolkit5-embind
        ${WEBARKIT_AR_SOURCES}
        ${WEBARKIT_ARICP_SOURCES}
        ${WEBARKIT_ARUTIL_SOURCES}
        ${WEBARKIT_VIDEO_SOURCES}
        # ${WEBARKIT_ARMULTI_SOURCES}
        ${WEBARKIT_EXTRA_SOURCES}
        cpp/arjs/artoolkit5/ARToolKitCore.cpp
        cpp/arjs/artoolkit5/ARToolKitCore.h
        cpp/arjs/artoolkit5/ARToolKitCore_bindings.cpp
)

# Reuse include directories
target_include_directories(artoolkit5-embind PRIVATE
        "${CMAKE_SOURCE_DIR}/cpp"
        "${WEBARKITLIB_INCLUDE_DIR}"
        "${WEBARKITLIB_DIR}/WebARKit/include"
        "${WEBARKITLIB_SRC_DIR}"
        "${WEBARKITLIB_SRC_DIR}/Video"     # aggiunto: trova WebARKitVideoLuma.h
        "${WEBARKITLIB_SRC_DIR}/AR"
)

# Compile options similar to the other target
target_compile_options(artoolkit5-embind PRIVATE
        -Oz
        -Wno-warn-absolute-paths
)

# Link options: enable embind (--bind) and similar emscripten flags.
target_link_options(artoolkit5-embind PRIVATE
        "SHELL:-s USE_ZLIB=1"
        "SHELL:-s USE_LIBJPEG=1"

        "SHELL:-s WASM=1"
        "SHELL:-s MODULARIZE=1"
        "SHELL:-s EXPORT_ES6=1"
        "SHELL:-s EXPORT_NAME='createARToolKit5EmbindModule'"

        "SHELL:-s ALLOW_MEMORY_GROWTH=1"
        "SHELL:-s ASSERTIONS=0"
        "SHELL:-s DISABLE_EXCEPTION_CATCHING=0"
        "SHELL:-s SINGLE_FILE=0"
        "SHELL:-s ENVIRONMENT=web"

        "SHELL:-s EXPORTED_RUNTIME_METHODS=['HEAPU8','HEAPF32','FS']"

        "SHELL:--bind"
)

set_target_properties(artoolkit5-embind PROPERTIES
        OUTPUT_NAME "artoolkit5-embind"
        RUNTIME_OUTPUT_DIRECTORY "${DIST_DIR}"
)

message(STATUS "Output: ${DIST_DIR}")
message(STATUS "WebARKitLib: ${WEBARKITLIB_DIR}")
message(STATUS "Sources matched: AR=${WEBARKIT_AR_SOURCES_COUNT}, ARICP=${WEBARKIT_ARICP_SOURCES_COUNT}, ARUtil=${WEBARKIT_ARUTIL_SOURCES_COUNT}, Video=${WEBARKIT_VIDEO_SOURCES_COUNT}")

if (ENABLE_WASM_DEBUG_FLAGS)
    message(STATUS "Enabling WASM debug flags: -g2 -s ASSERTIONS=1 --profiling")

    target_compile_options(artoolkit5-embind PRIVATE -g2)
    target_link_options(artoolkit5-embind PRIVATE
            -g2
            "SHELL:-s ASSERTIONS=1"
            "SHELL:--profiling"
    )
endif ()
