export default class ARController {
  constructor(mod, core, width, height) {
    this.mod = mod;
    this.core = core;
    this.width = width;
    this.height = height;

    // Pattern and barcode IDs live in separate namespaces: each family is looked up via
    // the getMarkerInfo field that produced it, so a pattern with ID 5 and a barcode with
    // ID 5 are different markers and may both be registered.
    this.patternMarkers = {}; // maps idPatt   -> marker state
    this.barcodeMarkers = {}; // maps idMatrix -> marker state
    this.defaultMarkerWidth = 1.0;
  }

  /**
   * Register a pattern marker ID and its physical width.
   */
  trackMarker(pattId, markerWidth) {
    this.patternMarkers[pattId] = this.createMarkerState(pattId, 'pattern', markerWidth);
  }

  /**
   * Register a barcode (matrix code) marker ID and its physical width.
   *
   * Unlike a pattern marker there is nothing to load: the ID is encoded in the marker's
   * geometry. Detection additionally requires a matrix-capable detection mode, set via
   * setPatternDetectionMode with AR_MATRIX_CODE_DETECTION or either combined mode.
   */
  trackBarcodeMarker(barcodeId, markerWidth) {
    this.barcodeMarkers[barcodeId] = this.createMarkerState(barcodeId, 'barcode', markerWidth);
  }

  createMarkerState(id, type, markerWidth) {
    return {
      id,
      type,
      markerWidth: markerWidth || this.defaultMarkerWidth,
      inPrevious: false,
      inCurrent: false,
      matrix: new Float64Array(12),
      matrixGL: new Float32Array(16)
    };
  }

  /**
   * Process a new video frame, runs marker detection, and updates tracked matrices.
   * Returns an array of markers detected in the current frame, of either family.
   */
  process(videoFrame) {
    // Pass video frame directly if supplied
    if (videoFrame) {
      this.core.passVideoData(videoFrame, [], true);
    }

    // Run core marker detection
    this.core.detectMarker();
    const markerNum = this.core.getMarkerNum();

    // Reset current frame states, shift current to previous
    const allMarkers = [...Object.values(this.patternMarkers), ...Object.values(this.barcodeMarkers)];
    for (const marker of allMarkers) {
      marker.inPrevious = marker.inCurrent;
      marker.inCurrent = false;
    }

    const detected = [];

    // Loop through all detected squares
    for (let i = 0; i < markerNum; i++) {
      const markerInfo = this.core.getMarkerInfo(i);

      // Read each family through its own field rather than through markerInfo.id, which
      // the engine only populates when the mode is pattern-only or matrix-only. In a
      // combined mode both checks can match in the same frame; in a single mode the
      // inactive family reports -1.
      if (markerInfo.idPatt > -1 && this.patternMarkers[markerInfo.idPatt]) {
        const tracked = this.patternMarkers[markerInfo.idPatt];
        this.updatePose(i, tracked);
        detected.push(tracked);
      }

      if (markerInfo.idMatrix > -1 && this.barcodeMarkers[markerInfo.idMatrix]) {
        const tracked = this.barcodeMarkers[markerInfo.idMatrix];
        this.updatePose(i, tracked);
        detected.push(tracked);
      }
    }

    return detected;
  }

  /**
   * Computes the pose for one detected square and writes it into the tracked marker's
   * reusable buffers.
   */
  updatePose(candidateIndex, tracked) {
    tracked.inCurrent = true;

    // Calculate transform matrix (continuous tracking if visible previously)
    if (tracked.inPrevious) {
      this.core.getTransMatSquareCont(candidateIndex, tracked.markerWidth);
    } else {
      this.core.getTransMatSquare(candidateIndex, tracked.markerWidth);
    }

    // Copy transform matrix from WASM heap
    const ptr = this.core.getTransform();
    const heapIndex = ptr >> 3;
    const heapMatrix = this.mod.HEAPF64.subarray(heapIndex, heapIndex + 12);
    tracked.matrix.set(heapMatrix);

    // Convert to 4x4 GL matrix
    this.transMatToGLMat(tracked.matrix, tracked.matrixGL);
  }

  /**
   * Helper to convert a 3x4 row-major transform matrix to a 4x4 column-major GL matrix.
   */
  transMatToGLMat(transMat, glMat) {
    if (glMat === undefined) {
      glMat = new Float32Array(16);
    }
    glMat[0] = transMat[0];
    glMat[1] = transMat[4];
    glMat[2] = transMat[8];
    glMat[3] = 0.0;

    glMat[4] = transMat[1];
    glMat[5] = transMat[5];
    glMat[6] = transMat[9];
    glMat[7] = 0.0;

    glMat[8] = transMat[2];
    glMat[9] = transMat[6];
    glMat[10] = transMat[10];
    glMat[11] = 0.0;

    glMat[12] = transMat[3];
    glMat[13] = transMat[7];
    glMat[14] = transMat[11];
    glMat[15] = 1.0;

    return glMat;
  }
}
