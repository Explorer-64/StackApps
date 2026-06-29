import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { noscriptPrerenderPlugin } from "./script/noscript-prerender-plugin";

export default defineConfig({
  plugins: [
    react(),
    noscriptPrerenderPlugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Merge the entry and its dynamic `import()` into one IIFE. Otherwise Vite
        // emits app-entry → import(./index) and breaks mobile Safari (circular graph).
        inlineDynamicImports: true,
      },
    },
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
