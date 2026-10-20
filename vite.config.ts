import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  build: { rollupOptions: { input: { background: "background.html" } } },
  server: { host: "127.0.0.1" },
});
