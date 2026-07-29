// react-router.config.ts
import type { Config } from "@react-router/dev/config";

// react-router.config.ts
export default {
  ssr: true,
  future: {
    v8_middleware: true,
    unstable_optimizeDeps: false,
  },
  routeDiscovery: {
    mode: "initial",
  },
} satisfies Config;
