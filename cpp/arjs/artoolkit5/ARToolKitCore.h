/*
 *  ARToolKitCore.h
 *  artoolkit5-wasm
 *
 *  This file is part of artoolkit5-wasm - AR-js-org.
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  artoolkit5-wasm is distributed in the hope that it will be useful, but
 *  WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 *  or FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. See the MIT License
 *  for more details.
 *
 *  You should have received a copy of the MIT License along with
 *  artoolkit5-wasm. If not, see <https://opensource.org/licenses/MIT>.
 *
 *  This file is compiled together with ARToolkit5 (WebARKitLib), which is
 *  licensed under the GNU Lesser General Public License v3.0, into the
 *  WebAssembly binary distributed in this package.
 *
 *  Copyright (c) 2026 AR-js-org
 *
 *  Author(s): Walter Perdan @kalwalt https://github.com/kalwalt
 *
 */

#pragma once

#include <AR/ar.h>
#include <AR/config.h>
#include <AR/paramGL.h>
#include <WebARKitVideoLuma.h>
#include <emscripten.h>
#include <emscripten/val.h>
#include <memory>
#include <string>
#include <unordered_map>

namespace arjs
{
    namespace artoolkit5
    {
        static int gARControllerID = 0;
        static int gCameraID = 0;
        static ARdouble gTransform[3][4];

        static int ARCONTROLLER_NOT_FOUND = -1;
        static int MULTIMARKER_NOT_FOUND = -2;
        static int MARKER_INDEX_OUT_OF_BOUNDS = -3;

        static ARMarkerInfo gMarkerInfo;

        extern std::unordered_map<int, ARParam> cameraParams;

        // Static array of zeros for initializing poses when markers aren't found
        static const std::array<int, 12> zeros = {0};

        class ARToolKitCore
        {
        public:
            // Lifecycle
            ARToolKitCore();
            ~ARToolKitCore();
            int setup(int width, int height, int cameraID);
            int teardown();

            // Camera Management
            int loadCamera(std::string cparam_name);
            int setCamera(int cameraID);
            emscripten::val getCameraLens();
            void recalculateCameraLens();
            void setProjectionNearPlane(const ARdouble projectionNearPlane);
            ARdouble getProjectionNearPlane();
            void setProjectionFarPlane(const ARdouble projectionFarPlane);
            ARdouble getProjectionFarPlane();

            // Video Processing
            int passVideoData(emscripten::val videoFrame, emscripten::val videoLuma, bool internalLuma);

            // Marker Management & Configuration
            int addMarker(std::string patt_name);
            void setPatternDetectionMode(int mode);
            int getPatternDetectionMode();
            void setPattRatio(float ratio);
            ARdouble getPattRatio();
            void setMatrixCodeType(int type);
            int getMatrixCodeType(int id);
            void setLabelingMode(int mode);
            int getLabelingMode();
            void setThresholdMode(int mode);
            int getThresholdMode();
            void setThreshold(int threshold);
            int getThreshold();
            void setImageProcMode(int mode);
            int getImageProcMode();

            // Detection & Tracking
            int detectMarker();
            int getMarkerNum();
            emscripten::val getMarkerInfo(int markerIndex);
            int setMarkerInfoDir(int markerIndex, int dir);
            int setMarkerInfoVertex(int markerIndex);
            int getTransMatSquare(int markerIndex, int markerWidth);
            int getTransMatSquareCont(int markerIndex, int markerWidth);
            std::intptr_t getTransform();

            // Debug & Utils
            void setLogLevel(int level);
            int getLogLevel();
            int setDebugMode(int enable);
            int getDebugMode();
            int getProcessingImage();

        private:
            void deleteHandle();
            int loadMarker(const char* patt_name, int* patt_id, ARHandle* arHandle, ARPattHandle** pattHandle_p);

            int id;

            ARParam param;
            ARParamLT* paramLT;

            std::unique_ptr<ARUint8[]> videoFrame;
            int videoFrameSize;
            std::unique_ptr<ARUint8[]> videoLuma;

            int width;
            int height;

            ARHandle* arhandle;
            ARPattHandle* arPattHandle;
            AR3DHandle* ar3DHandle;

            ARdouble nearPlane;
            ARdouble farPlane;

            int patt_id;

            ARdouble cameraLens[16];
            AR_PIXEL_FORMAT pixFormat = AR_PIXEL_FORMAT_RGBA;
        };
    } // namespace artoolkit5
} // namespace arjs
