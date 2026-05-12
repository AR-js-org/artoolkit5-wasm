type Mod = {
  FS: any;
  loadCameraFromPath(path: string): number;
  addMarker(path: string): number;
};

async function fetchBinary(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch failed ${res.status} ${res.statusText}: ${url}`);
  return new Uint8Array(await res.arrayBuffer());
}

function ensureDir(fs: any, vpath: string) {
  const dir = vpath.substring(0, vpath.lastIndexOf('/')) || '/';
  if (dir !== '/') {
    try { fs.mkdir(dir); } catch (e: any) { if (e.code !== 'EEXIST') throw e; }
  }
}

export async function loadCameraFromUrl(mod: Mod, core: any, url: string, vpath = '/data/camera_para.dat') {
  const data = await fetchBinary(url);
  ensureDir(mod.FS, vpath);
  mod.FS.writeFile(vpath, data);
  return core._loadCamera(vpath);
}

export async function addMarkerFromUrl(mod: Mod, core: any, url: string, vpath = '/data/patt.hiro') {
  const data = await fetchBinary(url);
  ensureDir(mod.FS, vpath);
  mod.FS.writeFile(vpath, data);
  return core.addMarker(vpath);
}