import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  oxc: {
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
