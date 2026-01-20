import createModule from "../../dist/artoolkit5.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const wasmPath = path.resolve(__dirname, "../../dist/artoolkit5.wasm");
const wasmBinary = fs.readFileSync(wasmPath);

const mod = await createModule({
    // Bypass fetch() entirely
    wasmBinary,

    // Still provide locateFile for completeness (not strictly needed with wasmBinary)
    locateFile(p) {
        if (p.endsWith(".wasm")) return wasmPath;
        return p;
    },
});

console.log("Module loaded");
console.log("HEAPU8 length:", mod.HEAPU8?.length);
console.log("_malloc:", typeof mod._malloc);
console.log("_free:", typeof mod._free);

const nbytes = 16 * 4;
const ptr = mod._malloc(nbytes);
if (!ptr) throw new Error("malloc returned 0");

mod.HEAPU8.fill(0, ptr, ptr + nbytes);
mod._free(ptr);

console.log("malloc/free ok");