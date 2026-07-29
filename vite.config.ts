import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    reactRouter(),
    tsconfigPaths(),
  ],
  esbuild: {
    target: "node16", // Ensures compatibility with top-level await
  },
  optimizeDeps: {
    exclude: ["i18next-fs-backend"], // Prevent Vite from pre-bundling this dependency
  },
  server: {
    fs: {
      allow: ["."], // Allow access to the project directory
    },
  },
});