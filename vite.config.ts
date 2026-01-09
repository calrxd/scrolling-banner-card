import { defineConfig } from "vite";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pkg = require("./package.json");

export default defineConfig({
  define: {
    __SBC_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: () => "scrolling-banner-card.js",
    },
    rollupOptions: {
      output: {
        entryFileNames: "scrolling-banner-card.js",
        assetFileNames: "[name][extname]",
      },
    },
  },
});
