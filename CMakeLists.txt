cmake_minimum_required(VERSION 3.22)

project(artoolkit5_wasm LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Output directory for final artifacts.
set(DIST_DIR "${CMAKE_SOURCE_DIR}/dist")
file(MAKE_DIRECTORY "${DIST_DIR}")

# ---- Wrapper sources (your code) ----
set(WRAPPER_SOURCES
        cpp/arjs/artoolkit5/Core.cpp
        cpp/bindings/webidl/glue.cpp
)

# ---- WebARKitLib (git submodule) ----
set(WEBARKITLIB_DIR "${CMAKE_SOURCE_DIR}/third_party/WebARKitLib" CACHE PATH "Path to WebARKitLib checkout (submodule).")
set(WEBARKITLIB_INCLUDE_DIR "${WEBARKITLIB_DIR}/include")
set(WEBARKITLIB_SRC_DIR     "${WEBARKITLIB_DIR}/lib/SRC")

if(NOT EXISTS "${WEBARKITLIB_INCLUDE_DIR}/AR/ar.h")
    message(FATAL_ERROR "Could not find ${WEBARKITLIB_INCLUDE_DIR}/AR/ar.h. Did you init submodules? (git submodule update --init --recursive)")
endif()

if(NOT EXISTS "${WEBARKITLIB_SRC_DIR}/AR")
    message(FATAL_ERROR "Could not find ${WEBARKITLIB_SRC_DIR}/AR. Expected WebARKitLib/lib/SRC/AR.")
endif()

# ---- WebIDL Binder generation ----
set(IDL_FILE "${CMAKE_SOURCE_DIR}/idl/ARToolKitCore.idl")
set(WEBIDL_OUT_DIR "${CMAKE_BINARY_DIR}/webidl")
file(MAKE_DIRECTORY "${WEBIDL_OUT_DIR}")

#set(GENERATED_GLUE_CPP "${WEBIDL_OUT_DIR}/ARToolKitCore_glue.cpp")

find_package(Python3 COMPONENTS Interpreter REQUIRED)

# Allow override from CLI (works well with Docker):
#   -DWEBIDL_BINDER_PY=/emsdk/upstream/emscripten/tools/webidl_binder.py
set(WEBIDL_BINDER_PY "" CACHE FILEPATH "Path to Emscripten webidl_binder.py")

if(NOT WEBIDL_BINDER_PY)
    if(EXISTS "/emsdk/upstream/emscripten/tools/webidl_binder.py")
        set(WEBIDL_BINDER_PY "/emsdk/upstream/emscripten/tools/webidl_binder.py")
    elseif(EXISTS "/emsdk/emscripten/tools/webidl_binder.py")
        set(WEBIDL_BINDER_PY "/emsdk/emscripten/tools/webidl_binder.py")
    endif()
endif()

if(NOT WEBIDL_BINDER_PY OR NOT EXISTS "${WEBIDL_BINDER_PY}")
    message(FATAL_ERROR "Could not locate webidl_binder.py. WEBIDL_BINDER_PY='${WEBIDL_BINDER_PY}'. You can pass -DWEBIDL_BINDER_PY=/path/to/webidl_binder.py")
endif()

message(STATUS "Using WebIDL binder: ${WEBIDL_BINDER_PY}")

# Newer webidl_binder.py interface: webidl_binder.py infile outfile
add_custom_command(
        OUTPUT "${GENERATED_GLUE_CPP}"
        COMMAND "${CMAKE_COMMAND}" -E make_directory "${WEBIDL_OUT_DIR}"
        COMMAND "${Python3_EXECUTABLE}" "${WEBIDL_BINDER_PY}" "${IDL_FILE}" "${GENERATED_GLUE_CPP}"
        DEPENDS "${IDL_FILE}"
        COMMENT "Generating WebIDL binder glue from ${IDL_FILE}"
        VERBATIM
)

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
        "${WEBARKITLIB_SRC_DIR}/ARUtil/*.c"
)

file(GLOB WEBARKIT_VIDEO_SOURCES
        "${WEBARKITLIB_SRC_DIR}/Video/*.c"
)

# Optional: if you hit missing symbols, uncomment this to include multimarker support sources.
# file(GLOB WEBARKIT_ARMULTI_SOURCES
#   "${WEBARKITLIB_SRC_DIR}/ARMulti/*.c"
# )

# Sanity checks (helpful when paths change)
list(LENGTH WEBARKIT_AR_SOURCES WEBARKIT_AR_SOURCES_COUNT)
list(LENGTH WEBARKIT_ARICP_SOURCES WEBARKIT_ARICP_SOURCES_COUNT)
list(LENGTH WEBARKIT_ARUTIL_SOURCES WEBARKIT_ARUTIL_SOURCES_COUNT)
list(LENGTH WEBARKIT_VIDEO_SOURCES WEBARKIT_VIDEO_SOURCES_COUNT)

if(WEBARKIT_AR_SOURCES_COUNT EQUAL 0)
    message(FATAL_ERROR "No sources found in ${WEBARKITLIB_SRC_DIR}/AR. Check WebARKitLib checkout.")
endif()

# ---- Build target ----
add_executable(artoolkit5
        ${WRAPPER_SOURCES}
        ${WEBARKIT_AR_SOURCES}
        ${WEBARKIT_ARICP_SOURCES}
        ${WEBARKIT_ARUTIL_SOURCES}
        ${WEBARKIT_VIDEO_SOURCES}
        # ${WEBARKIT_ARMULTI_SOURCES}
        "${GENERATED_GLUE_CPP}"
)

target_include_directories(artoolkit5 PRIVATE
        "${CMAKE_SOURCE_DIR}/cpp"
        "${WEBARKITLIB_INCLUDE_DIR}"
        "${WEBARKITLIB_SRC_DIR}"
        "${WEBIDL_OUT_DIR}"
)

# If you later need extra internal include dirs (depends on WebARKitLib headers), add them here:
# target_include_directories(artoolkit5 PRIVATE "${WEBARKITLIB_SRC_DIR}/WebARKit")

# ---- Emscripten compile/link flags ----
target_compile_options(artoolkit5 PRIVATE
        -Oz
        -Wno-warn-absolute-paths
)

# If you want easier debugging temporarily:
# target_link_options(artoolkit5 PRIVATE "SHELL:-s ASSERTIONS=1")

target_link_options(artoolkit5 PRIVATE
        # deps (keep if the lib uses them)
        "SHELL:-s USE_ZLIB=1"
        "SHELL:-s USE_LIBJPEG=1"

        # output style
        "SHELL:-s WASM=1"
        "SHELL:-s MODULARIZE=1"
        "SHELL:-s EXPORT_ES6=1"
        "SHELL:-s USE_ES6_IMPORT_META=0"

        # runtime
        "SHELL:-s ALLOW_MEMORY_GROWTH=1"
        "SHELL:-s ASSERTIONS=0"
        "SHELL:-s DISABLE_EXCEPTION_CATCHING=0"
        "SHELL:-s SINGLE_FILE=0"
        "SHELL:-s ENVIRONMENT=web"

        # JS access to heaps + malloc/free (useful for your TS wrapper)
        "SHELL:-s EXPORTED_RUNTIME_METHODS=['HEAPU8','HEAPF32','_malloc','_free']"
)

# If you temporarily rely on Emscripten FS (e.g. writing cparam/patt into MEMFS), export FS too:
# target_link_options(artoolkit5 PRIVATE "SHELL:-s EXPORTED_RUNTIME_METHODS=['FS','HEAPU8','HEAPF32','_malloc','_free']")

set_target_properties(artoolkit5 PROPERTIES
        OUTPUT_NAME "artoolkit5"
        RUNTIME_OUTPUT_DIRECTORY "${DIST_DIR}"
)

# Copy WebIDL glue JS next to dist outputs.
#add_custom_target(copy_webidl_glue ALL
#        COMMAND "${CMAKE_COMMAND}" -E copy_if_different "${GENERATED_GLUE_JS}" "${DIST_DIR}/ARToolKitCore_glue.js"
#        DEPENDS "${GENERATED_GLUE_JS}"
#        COMMENT "Copying WebIDL glue JS to dist/"
#)
add_dependencies(copy_webidl_glue artoolkit5)

message(STATUS "Output: ${DIST_DIR}")
message(STATUS "WebARKitLib: ${WEBARKITLIB_DIR}")
message(STATUS "Sources matched: AR=${WEBARKIT_AR_SOURCES_COUNT}, ARICP=${WEBARKIT_ARICP_SOURCES_COUNT}, ARUtil=${WEBARKIT_ARUTIL_SOURCES_COUNT}, Video=${WEBARKIT_VIDEO_SOURCES_COUNT}")