import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  output: "static",
  site: "https://sourcecraft.digitracks.net",
  trailingSlash: "always",
  integrations: [react()],
  devToolbar: { enabled: false },
  vite: {
    ssr: { noExternal: [/^@digitracks\//, /^@fontsource-variable\//, /^@fontsource\//] },
    optimizeDeps: { force: true }
  },
  build: { format: "file" }
});
