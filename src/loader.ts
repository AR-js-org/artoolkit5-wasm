/*
 *  loader.ts
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
 *  This library wraps a WebAssembly build of ARToolkit5 (WebARKitLib), which
 *  is licensed under the GNU Lesser General Public License v3.0.
 *
 *  Copyright (c) 2026 AR-js-org
 *
 *  Author(s): Walter Perdan @kalwalt https://github.com/kalwalt
 *
 */

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