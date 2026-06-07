export default class ARController {
  constructor(mod, core, width, height) {
    this.mod = mod;
    this.core = core;
    this.width = width;
    this.height = height;

    this.patternMarkers = {}; // maps pattId -> marker state
    this.defaultMarkerWidth = 1.0;
  }

  /**
   * Register a pattern marker ID and its physical width.
   */
  trackMarker(pattId, markerWidth) {
    this.patternMarkers[pattId] = {
      id: pattId,
      markerWidth: markerWidth || this.defaultMarkerWidth,
      inPrevious: false,
      inCurrent: false,
      matrix: new Float64Array(12),
      matrixGL: new Float32Array(16)
    };
  }

  /**
   * Process a new video frame, runs marker detection, and updates tracked matrices.
   * Returns an array of detected pattern markers in the current frame.
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
    for (const marker of Object.values(this.patternMarkers)) {
      marker.inPrevious = marker.inCurrent;
      marker.inCurrent = false;
    }

    const detected = [];

    // Loop through all detected squares
    for (let i = 0; i < markerNum; i++) {
      const markerInfo = this.core.getMarkerInfo(i);

      // Check if it's a registered pattern marker
      if (markerInfo.id > -1 && this.patternMarkers[markerInfo.id]) {
        const tracked = this.patternMarkers[markerInfo.id];
        tracked.inCurrent = true;

        // Calculate transform matrix (continuous tracking if visible previously)
        if (tracked.inPrevious) {
          this.core.getTransMatSquareCont(i, tracked.markerWidth);
        } else {
          this.core.getTransMatSquare(i, tracked.markerWidth);
        }

        // Copy transform matrix from WASM heap
        const ptr = this.core.getTransform();
        const heapIndex = ptr >> 3;
        const heapMatrix = this.mod.HEAPF64.subarray(heapIndex, heapIndex + 12);
        tracked.matrix.set(heapMatrix);

        // Convert to 4x4 GL matrix
        this.transMatToGLMat(tracked.matrix, tracked.matrixGL);

        detected.push(tracked);
      }
    }

    return detected;
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
