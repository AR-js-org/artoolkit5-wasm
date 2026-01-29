//
// Created by perda on 28/01/2026.
//

#pragma once

#include <stdio.h>
#include <AR/ar.h>
#include <emscripten.h>
#include <emscripten/val.h>
#include <string>
#include <vector>
#include <unordered_map>
#include <memory>
#include <AR/config.h>
#include <AR2/tracking.h>
#include <AR/arFilterTransMat.h>
#include <AR/paramGL.h>
#include <KPM/kpm.h>
#include <WebARKit/WebARKitLog.h>
#include <WebARKitVideoLuma.h>

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
            ARToolKitCore();
            ~ARToolKitCore();

            int teardown();

            int passVideoData(emscripten::val videoFrame, emscripten::val videoLuma, bool internalLuma);

            void setLogLevel(int level);
            int getLogLevel();

            int loadCamera(std::string cparam_name);
            int setCamera(int cameraID);
            emscripten::val getCameraLens();
            void recalculateCameraLens();

            int addMarker(std::string patt_name);

            // setters and getters
            void setProjectionNearPlane(const ARdouble projectionNearPlane);
            ARdouble getProjectionNearPlane();

            void setProjectionFarPlane(const ARdouble projectionFarPlane);
            ARdouble getProjectionFarPlane();

            void setPatternDetectionMode(int mode);
            int getPatternDetectionMode();

            void setPattRatio(float ratio);
            ARdouble getPattRatio();

            void setMatrixCodeType(int type);
            int getMatrixCodeType(int id);

            void setThreshold(int threshold);
            int getThreshold();

            void setThresholdMode(int mode);
            int getThresholdMode();

            int setDebugMode(int enable);
            int getDebugMode();

            void setImageProcMode(int mode);
            int getImageProcMode();

            int getTransMatSquare(int markerIndex, int markerWidth);
            int getTransMatSquareCont(int markerIndex, int markerWidth);

            int setMarkerInfoDir(int markerIndex, int dir);
            int setMarkerInfoVertex(int markerIndex);

            int detectMarker();
            int getMarkerNum();
            emscripten::val getMarkerInfo(int markerIndex);
            std::intptr_t getTransform();

            int setup(int width, int height, int cameraID);

        private:
            void deleteHandle();

            int loadMarker(const char* patt_name, int* patt_id, ARHandle* arHandle,
                           ARPattHandle** pattHandle_p);

            int id;

            ARParam param;
            ARParamLT* paramLT;

            std::unique_ptr<ARUint8[]> videoFrame; // Changed from std::shared_ptr
            int videoFrameSize;
            std::unique_ptr<ARUint8[]> videoLuma; // Changed from std::shared_ptr

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
    } // artoolkit5
} // arjs
