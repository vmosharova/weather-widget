import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: Infinity, // inline everything
    cssCodeSplit: false, // do not split css
  },
}));
