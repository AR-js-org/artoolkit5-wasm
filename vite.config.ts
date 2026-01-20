// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
    build: {
        lib: {
            entry: "src/index.ts",
            formats: ["es"],
            fileName: () => "index.js",
        },
        sourcemap: true,
        target: "es2020",
        emptyOutDir: false // IMPORTANT: non cancellare dist/artoolkit5.wasm e dist/artoolkit5.js
    },
});