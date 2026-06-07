# 🚀 artoolkit5-wasm

A high-performance **WebAssembly (WASM)** port of **WebARKitLib**, utilizing a modified and improved version of **ARToolKit5** tailored for modern JavaScript and TypeScript environments. 🎯 This package delivers fast, modular, and memory-optimized marker tracking, pose estimation, and marker generation directly in the web browser or Node.js.

---

## 📦 Installation

Install the package via `npm`:

```bash
npm install @ar-js-org/artoolkit5-wasm
```

### 🔗 Peer Dependencies
This library relies on `@ar-js-org/artoolkit5-constants` for shared ARToolKit constant values. Ensure it is installed in your project:

```bash
npm install @ar-js-org/artoolkit5-constants
```

---

## 🛠️ Usage & API Reference

### 1. ⚙️ Initialization
Initialize the WebAssembly runtime using the `createARToolKit` factory. You can optionally configure paths for loading the `.wasm` binary:

```javascript
import { createARToolKit } from '@ar-js-org/artoolkit5-wasm';

const { mod, core, constants } = await createARToolKit({
  locateFile: (path, prefix) => `node_modules/@ar-js-org/artoolkit5-wasm/dist/${path}`,
  quiet: false // Set to true to suppress initialization logs
});
```

* **`mod`**: The raw Emscripten module.
* **`core`**: The initialized `ARToolKitCore` instance.
* **`constants`**: An object containing essential marker detection constants.

---

### 2. 📁 URL Loaders
ARToolKit requires camera calibration parameters (`.dat`) and marker pattern (`.hiro` / custom) files. Utility helpers fetch these binaries and load them directly into the Emscripten Virtual File System (`mod.FS`):

```javascript
import { loadCameraFromUrl, addMarkerFromUrl } from '@ar-js-org/artoolkit5-wasm';

// Load camera calibration file
await loadCameraFromUrl(mod, core, 'path/to/camera_para.dat', '/data/camera_para.dat');

// Load pattern marker file
const pattId = await addMarkerFromUrl(mod, core, 'path/to/patt.hiro', '/data/patt.hiro');
```

---

### 3. 📹 Video Frame Processing & Tracking
Pass video frame data to the WebAssembly module and detect markers inside your frame loop (e.g. `requestAnimationFrame`):

```javascript
// Initialize camera tracker dimensions
core.setup(width, height, cameraID);

function processFrame(videoElementData, videoLumaData) {
  // Pass video frames as Uint8Array/typed arrays
  core.passVideoData(videoElementData, videoLumaData, true);

  // Run marker detection
  const numDetected = core.detectMarker();
  if (numDetected > 0) {
    const markerNum = core.getMarkerNum();
    
    for (let i = 0; i < markerNum; i++) {
      const markerInfo = core.getMarkerInfo(i);
      
      // Calculate pose matrix (places calculation result in a shared C++ memory address)
      const markerWidth = 80; // physical width of marker in millimeters
      core.getTransMatSquare(i, markerWidth);

      // Access the 3x4 pose matrix directly from WASM heap to avoid copying overhead
      const ptr = core.getTransform();
      const poseMatrix = mod.HEAPF64.subarray(ptr >> 3, (ptr >> 3) + 12);
      
      console.log(`Detected Marker ID: ${markerInfo.id}`);
      console.log("3x4 Transform Matrix:", poseMatrix);
    }
  }
}
```

---

## 💻 Development & Building

### 📋 Prerequisites
To build the project from source, you need:
* **Node.js** (v22.x or later)
* **Docker** (to compile the C++ source via Emscripten)
* **Git** (for submodule management)

---

### 🔨 Compilation Instructions

First, clone the repository recursively to fetch the nested submodules:
```bash
git clone --recursive https://github.com/kalwalt/artoolkit5-wasm.git
cd artoolkit5-wasm
npm install
```

#### 1. Compile C++ to WebAssembly 🐳
Compiles the C++ source using Emscripten running inside a Docker container:
```bash
npm run build:wasm
```

#### 2. Build TypeScript Wrapper 📦
Bundles the JS/TS wrappers using Vite and compiles the declarations:
```bash
npm run build:wrap
```

#### 3. Build All 🚀
Performs both C++ WebAssembly and JS/TS wrapper builds:
```bash
npm run build
```

---

### 🔍 Code Quality & Linting
Validate C++ code formatting using `clang-format`:

```bash
# Run lint check
npm run lint:cpp

# Automatically format C++ code
npm run format:cpp
```

---

## 🌐 Examples

Check out the included interactive examples in the `examples/` directory:

1. **`examples/smoke.html`**: A simple, raw WebAssembly initialization and basic marker addition test.
2. **`examples/webcam.html`**: A complete real-time camera tracking example showing how to detect pattern markers, compute pose matrices, and output them to the page without flooding the console.

To run the examples locally, start a static file server:
```bash
npx vite
```
Then navigate to `http://localhost:5173/examples/webcam.html` in your web browser.

---

## 📄 License

This library is licensed under the **LGPL-3.0 License**, matching the upstream ARToolKit5 license requirements.