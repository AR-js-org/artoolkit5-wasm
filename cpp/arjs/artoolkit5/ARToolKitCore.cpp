//
// Created by perda on 28/01/2026.
//

#include "ARToolKitCore.h"
#include <iostream>
#include <unordered_map>

namespace arjs
{
    namespace artoolkit5
    {
        std::unordered_map<int, ARParam> cameraParams;

        ARToolKitCore::ARToolKitCore()
            : id(0), paramLT(nullptr), videoFrame(nullptr), videoFrameSize(0),
              videoLuma(nullptr), width(0), height(0),

              arhandle(nullptr), arPattHandle(nullptr), ar3DHandle(nullptr),
              nearPlane(0.0001), farPlane(1000.0),
              patt_id(0) // Running pattern marker id
        {
            ARLOGi("init ARToolKitCore constructor...");
        }

        ARToolKitCore::~ARToolKitCore()
        {
            // Pulizia risorse qui
            teardown();
        }

        int ARToolKitCore::passVideoData(emscripten::val videoFrame,
                                         emscripten::val videoLuma, bool internalLuma)
        {
            auto vf = emscripten::convertJSArrayToNumberVector<uint8_t>(videoFrame);
            auto vl = emscripten::convertJSArrayToNumberVector<uint8_t>(videoLuma);

            if (internalLuma)
            {
                auto vli = webarkit::webarkitVideoLumaInit(this->width, this->height, true);
                if (!vli)
                {
                    webarkitLOGe("Failed to initialize WebARKitLumaInfo.");
                    return -1;
                }

                auto out = webarkit::webarkitVideoLuma(vli, vf.data());
                if (!out)
                {
                    webarkitLOGe("Failed to process video luma.");
                    webarkit::webarkitVideoLumaFinal(&vli);
                    return -1;
                }
                if (this->videoLuma)
                {
                    webarkitLOGd("Copy videoLuma with simd !");
                    std::copy(out, out + this->width * this->height, this->videoLuma.get());
                    webarkit::webarkitVideoLumaFinal(&vli);
                }
            }

            // Copy data instead of just assigning pointers
            if (this->videoFrame)
            {
                std::copy(vf.begin(), vf.end(), this->videoFrame.get());
            }

            if (this->videoLuma)
            {
                if (!internalLuma)
                {
                    webarkitLOGd("Inside videoLuma no simd !");
                    std::copy(vl.begin(), vl.end(), this->videoLuma.get());
                }
            }
            return 0;
        };

        void ARToolKitCore::deleteHandle() {
            if (this->arhandle != nullptr) {
                if (arPattDetach(this->arhandle) != 0) {
                    webarkitLOGe("Error detaching pattern from arhandle.");
                }
                arDeleteHandle(this->arhandle);
                this->arhandle = nullptr;
            }
            if (this->ar3DHandle != nullptr) {
                ar3DDeleteHandle(&(this->ar3DHandle));
                this->ar3DHandle = nullptr;
            }
            if (this->paramLT != nullptr) {
                arParamLTFree(&(this->paramLT));
                this->paramLT = nullptr;
            }
        }

        int ARToolKitCore::teardown() {

            // Reset unique pointers instead of freeing memory
            this->videoFrame.reset();
            this->videoLuma.reset();
            this->videoFrameSize = 0;

            deleteHandle();

            arPattDeleteHandle(this->arPattHandle);

            return 0;
        }

        int ARToolKitCore::setCamera(int cameraID) {

            if (cameraParams.find(cameraID) == cameraParams.end()) {
                return -1;
            }

            this->param = cameraParams[cameraID];

            if (this->param.xsize != this->width || this->param.ysize != this->height) {
                ARLOGw("*** Camera Parameter resized from %d, %d. ***\n", this->param.xsize,
                       this->param.ysize);
                arParamChangeSize(&(this->param), this->width, this->height,
                                  &(this->param));
            }

            ARLOGi("*** Camera Parameter ***\n");
            arParamDisp(&(this->param));

            deleteHandle();
            if (this->paramLT != nullptr) {
                deleteHandle();
            }

            this->paramLT = arParamLTCreate(&(this->param), AR_PARAM_LT_DEFAULT_OFFSET);
            if (!this->paramLT) {
                webarkitLOGe("setCamera(): Error: arParamLTCreate for cameraID %d.", cameraID);
                return -1;
            }

            ARLOGi("setCamera(): arParamLTCreated\n..%d, %d\n", (this->paramLT->param).xsize, (this->paramLT->param).ysize);

            // setup camera
            if ((this->arhandle = arCreateHandle(this->paramLT)) == nullptr) {
                webarkitLOGe("setCamera(): Error: arCreateHandle.");
                return -1;
            }
            // AR_DEFAULT_PIXEL_FORMAT
            int set = arSetPixelFormat(this->arhandle, this->pixFormat);

            this->ar3DHandle = ar3DCreateHandle(&(this->param));
            if (this->ar3DHandle == nullptr) {
                webarkitLOGe("setCamera(): Error creating 3D handle");
                return -1;
            }

            arPattAttach(this->arhandle, this->arPattHandle);
            ARLOGi("setCamera(): Pattern handler attached.\n");

            arglCameraFrustumRH(&((this->paramLT)->param), this->nearPlane,
                                this->farPlane, this->cameraLens);

            return 0;
        }

        void ARToolKitCore::recalculateCameraLens() {
            arglCameraFrustumRH(&((this->paramLT)->param), this->nearPlane,
                                this->farPlane, this->cameraLens);
        }

        int ARToolKitCore::loadCamera(std::string cparam_name) {
            ARParam param;
            if (arParamLoad(cparam_name.c_str(), 1, &param) < 0) {
                webarkitLOGe("loadCamera(): Error loading parameter file %s for camera.",
                             cparam_name.c_str());
                return -1;
            }
            int cameraID = gCameraID++;
            cameraParams[cameraID] = param;

            return cameraID;
        }

        emscripten::val ARToolKitCore::getCameraLens() {
            emscripten::val lens = emscripten::val::array();
            for (const auto& value : this->cameraLens) {
                lens.call<void>("push", value);
            }
            return lens;
        }

        int ARToolKitCore::loadMarker(const char *patt_name, int *patt_id, ARHandle *arhandle, ARPattHandle **pattHandle_p) {
            // Loading only 1 pattern in this example.
            if ((*patt_id = arPattLoad(*pattHandle_p, patt_name)) < 0) {
                ARLOGe("loadMarker(): Error loading pattern file %s.\n", patt_name);
                arPattDeleteHandle(*pattHandle_p);
                return (FALSE);
            }

            return (TRUE);
        }

        int ARToolKitCore::addMarker(std::string patt_name) {
            // const char *patt_name
            // Load marker(s).
            if (!loadMarker(patt_name.c_str(), &(this->patt_id), this->arhandle, &(this->arPattHandle))) {
                ARLOGe("ARToolKitJS(): Unable to set up AR marker.\n");
                return -1;
            }

            return this->patt_id;
        }

        void ARToolKitCore::setLogLevel(int level) { arLogLevel = level; }

        int ARToolKitCore::getLogLevel() { return arLogLevel; }

        void ARToolKitCore::setProjectionNearPlane(const ARdouble projectionNearPlane) {
            this->nearPlane = projectionNearPlane;
        }

        ARdouble ARToolKitCore::getProjectionNearPlane() { return this->nearPlane; }

        void ARToolKitCore::setProjectionFarPlane(const ARdouble projectionFarPlane) {
            this->farPlane = projectionFarPlane;
        }

        ARdouble ARToolKitCore::getProjectionFarPlane() { return this->farPlane; }

        void ARToolKitCore::setThreshold(int threshold) {
            if (threshold < 0 || threshold > 255)
                return;
            if (arSetLabelingThresh(this->arhandle, threshold) == 0) {
                webarkitLOGi("Threshold set to %d", threshold);
            };
            // default 100
            // arSetLabelingThreshMode
            // AR_LABELING_THRESH_MODE_MANUAL, AR_LABELING_THRESH_MODE_AUTO_MEDIAN,
            // AR_LABELING_THRESH_MODE_AUTO_OTSU, AR_LABELING_THRESH_MODE_AUTO_ADAPTIVE
        }

        int ARToolKitCore::getThreshold() {
            int threshold;
            if (arGetLabelingThresh(this->arhandle, &threshold) == 0) {
                return threshold;
            };

            return -1;
        }

        void ARToolKitCore::setThresholdMode(int mode) {
            AR_LABELING_THRESH_MODE thresholdMode = (AR_LABELING_THRESH_MODE)mode;

            if (arSetLabelingThreshMode(this->arhandle, thresholdMode) == 0) {
                webarkitLOGi("Threshold mode set to %d", (int)thresholdMode);
            }
        }

        int ARToolKitCore::getThresholdMode() {
            AR_LABELING_THRESH_MODE thresholdMode;

            if (arGetLabelingThreshMode(this->arhandle, &thresholdMode) == 0) {
                return thresholdMode;
            }

            return -1;
        }

        int ARToolKitCore::setDebugMode(int enable) {
            arSetDebugMode(this->arhandle, enable ? AR_DEBUG_ENABLE : AR_DEBUG_DISABLE);
            webarkitLOGi("Debug mode set to %s", enable ? "on." : "off.");

            return enable;
        }

        int ARToolKitCore::getProcessingImage() {

            if (this->arhandle != nullptr) {
                return reinterpret_cast<int>(this->arhandle->labelInfo.bwImage);
            } else {
                webarkitLOGe("Error: arhandle is null.");
                return -1;
            }
        }

        int ARToolKitCore::getDebugMode() {
            int enable;

            arGetDebugMode(this->arhandle, &enable);
            return enable;
        }

        void ARToolKitCore::setImageProcMode(int mode) {

            int imageProcMode = mode;
            if (arSetImageProcMode(this->arhandle, mode) == 0) {
                webarkitLOGi("Image proc. mode set to %d.", imageProcMode);
            }
        }

        int ARToolKitCore::getImageProcMode() {
            int imageProcMode;
            if (arGetImageProcMode(this->arhandle, &imageProcMode) == 0) {
                return imageProcMode;
            }

            return -1;
        }

        int ARToolKitCore::getTransMatSquare(int markerIndex, int markerWidth) {

            if (this->arhandle->marker_num <= markerIndex) {
                return MARKER_INDEX_OUT_OF_BOUNDS;
            }
            ARMarkerInfo* marker = markerIndex < 0 ? &gMarkerInfo : &((this->arhandle)->markerInfo[markerIndex]);

            arGetTransMatSquare(this->ar3DHandle, marker, markerWidth, gTransform);

            return 0;
        }

        int ARToolKitCore::getTransMatSquareCont(int markerIndex, int markerWidth) {

            if (this->arhandle->marker_num <= markerIndex) {
                return MARKER_INDEX_OUT_OF_BOUNDS;
            }
            ARMarkerInfo* marker = markerIndex < 0 ? &gMarkerInfo : &((this->arhandle)->markerInfo[markerIndex]);

            arGetTransMatSquareCont(this->ar3DHandle, marker, gTransform, markerWidth, gTransform);

            return 0;
        }

        int ARToolKitCore::setMarkerInfoDir(int markerIndex, int dir) {

            if (this->arhandle->marker_num <= markerIndex) {
                return MARKER_INDEX_OUT_OF_BOUNDS;
            }
            ARMarkerInfo* marker = markerIndex < 0 ? &gMarkerInfo : &((this->arhandle)->markerInfo[markerIndex]);

            marker->dir = dir;

            return 0;
        }

        int ARToolKitCore::detectMarker() {

            // Convert video frame to AR2VideoBufferT
            AR2VideoBufferT buff = {0};
            buff.buff = this->videoFrame.get();
            buff.fillFlag = 1;

            buff.buffLuma = this->videoLuma.get();

            return arDetectMarker( this->arhandle, &buff);
        }


        int ARToolKitCore::getMarkerNum() {
            return this->arhandle->marker_num;
        }

        int ARToolKitCore::getMarkerInfo(int markerIndex)
        {
            if (this->arhandle->marker_num <= markerIndex) {
                return MARKER_INDEX_OUT_OF_BOUNDS;
            }
            ARMarkerInfo* markerInfo = markerIndex < 0 ? &gMarkerInfo : &((this->arhandle)->markerInfo[markerIndex]);
            return 0;
        }


        int ARToolKitCore::setup(int width, int height, int cameraID) {
            int id = gARControllerID++;
            this->id = id;

            this->width = width;
            this->height = height;

            this->videoFrameSize = width * height * 4 * sizeof(ARUint8);
            // Use unique_ptr to manage video frame memory, ensuring exclusive ownership and automatic deallocation
            this->videoFrame = std::unique_ptr<ARUint8[]>(new ARUint8[this->videoFrameSize]);
            this->videoLuma = std::unique_ptr<ARUint8[]>(new ARUint8[this->width * this->height]);

            if ((this->arPattHandle = arPattCreateHandle()) == NULL) {
                ARLOGe("setup(): Error: arPattCreateHandle.\n");
            }

            setCamera(cameraID);

            webarkitLOGi("Allocated videoFrameSize %d", this->videoFrameSize);

            return this->id;
        }


    } // artoolkit5
} // arjs
//#include "ARToolKitCore_bindings.cpp"
