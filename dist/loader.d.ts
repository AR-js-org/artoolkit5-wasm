type Mod = {
    FS: any;
    loadCameraFromPath(path: string): number;
    addMarker(path: string): number;
};
export declare function loadCameraFromUrl(mod: Mod, core: any, url: string, vpath?: string): Promise<any>;
export declare function addMarkerFromUrl(mod: Mod, core: any, url: string, vpath?: string): Promise<any>;
export {};
//# sourceMappingURL=loader.d.ts.map