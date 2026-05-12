// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
    build: {
        lib: {
            entry: "src/index.ts",
            formats: ["es"],
            fileName: () => "index.js",
        },
        rollupOptions: {
            external: [
                // lascia l'emscripten output come file separato in dist/
                "../dist/artoolkit5.js",
                "./dist/artoolkit5.js"
            ],
        },
        sourcemap: true,
        target: "es2020",
        emptyOutDir: false,
    },
});
