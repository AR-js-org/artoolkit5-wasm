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
  const lastSlashIndex = vpath.lastIndexOf('/');
  if (lastSlashIndex === -1) return;

  const dir = vpath.substring(0, lastSlashIndex);
  if (!dir || dir === '/' || dir === '.') return;

  const isAbsolute = vpath.startsWith('/');
  const parts = dir.split('/').filter(Boolean);
  
  let currentPath = isAbsolute ? '' : '.';
  for (const part of parts) {
    currentPath += '/' + part;
    try {
      if (!fs.analyzePath(currentPath).exists) {
        fs.mkdir(currentPath);
      }
    } catch (e: any) {
      if (e.errno !== 17 && e.code !== 'EEXIST') {
        throw e;
      }
    }
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