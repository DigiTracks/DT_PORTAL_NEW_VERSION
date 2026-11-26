import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  output: "static",
  site: "https://digitracks.net",
  trailingSlash: "always",
  integrations: [react()],
  devToolbar: { enabled: false },
  vite: {
    ssr: { noExternal: [/^@digitracks\//, /^@fontsource-variable\//] },
    optimizeDeps: { force: true }
  },
  build: { format: "file" }
});
