// examples/utils.js
/*export async function fetchBinary(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed fetch ${url}: ${res.status}`);
    return new Uint8Array(await res.arrayBuffer());
}*/

export async function fetchBinary(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`fetch failed ${res.status} ${res.statusText}: ${url}`);
    return new Uint8Array(await res.arrayBuffer());
}

export function storeDataFile(Module, data, target) {
    Module.FS.writeFile(target, data, { encoding: "binary" });
}

export async function loadCameraFromUrl(mod, core, url) {
    const data = await fetchBinary(url);

    // Crea directory in MEMFS (se non esiste)
    try { mod.FS.mkdir("/data"); } catch (e) { /* EEXIST ok */ }

    const vpath = "/data/camera_para.dat";
    mod.FS.writeFile(vpath, data); // encoding binary implicito con Uint8Array

    return core.loadCameraFromPath(vpath);
}