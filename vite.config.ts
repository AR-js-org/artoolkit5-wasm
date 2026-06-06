import { defineConfig } from "vite";
import { readFileSync } from "fs";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf-8"));

export default defineConfig({
    define: {
        __VERSION__: JSON.stringify(pkg.version),
    },
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
