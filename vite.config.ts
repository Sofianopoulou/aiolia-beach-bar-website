import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_lazyRouteDiscovery: true, // Opt-in for React Router v7
        v3_singleFetch: true, // Opt-in for React Router v7
      },
    }),
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
