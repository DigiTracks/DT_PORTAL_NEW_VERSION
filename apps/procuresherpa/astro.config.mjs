import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  output: "static",
  site: "https://procuresherpa.digitracks.net",
  trailingSlash: "never",
  integrations: [react()],
  devToolbar: { enabled: false },
  vite: {
    ssr: { noExternal: [/^@digitracks\//, /^@fontsource-variable\//, /^@fontsource\//] },
    optimizeDeps: { force: true }
  },
  build: { format: "file" }
});
