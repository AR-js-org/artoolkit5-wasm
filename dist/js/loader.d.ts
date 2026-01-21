type Mod = {
    FS: any;
    loadCameraFromPath(path: string): number;
    addMarker(path: string): number;
};
declare function fetchBinary(url: string): Promise<Uint8Array>;
declare function ensureDir(fs: any, vpath: string): void;
//# sourceMappingURL=loader.d.ts.map