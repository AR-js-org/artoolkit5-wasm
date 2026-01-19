#pragma once

// Make sure the underlying class is visible.
#include "arjs/artoolkit5/Core.h"

// webidl_binder.py expects a C++ type named exactly "ARToolKitCore".
// Map it to your actual implementation type.
using ARToolKitCore = arjs::artoolkit5::Core;