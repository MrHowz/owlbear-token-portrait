import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  build: { rollupOptions: { input: { background: "background.html", portrait: "portrait.html", panel: "panel.html" } } },
  server: { host: "127.0.0.1" },
});

