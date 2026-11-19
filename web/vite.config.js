import { defineConfig } from "vite";

// base "./" keeps every URL relative, so the same build works on GitHub Pages
// (/TulpaTutor/), inside the Android/iOS WebView (capacitor://) and from a local file server.
export default defineConfig({
  base: "./",
  build: { target: "es2022", outDir: "dist", assetsInlineLimit: 0, chunkSizeWarningLimit: 900 },
  worker: { format: "es" },
  server: { host: true },
});
