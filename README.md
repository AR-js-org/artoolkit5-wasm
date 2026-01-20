# artoolkit5-wasm


## Build with docker
docker run --rm -it -v "${PWD}:/src" -w /src emscripten/emsdk:4.0.17 bash -lc "emcmake cmake -S . -B build -DCMAKE_BUILD_TYPE=Release && cmake --build build -j"                           