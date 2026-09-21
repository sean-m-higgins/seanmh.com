// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://seanmh.com",
  image: {
    service: {
      entrypoint: "astro/assets/services/sharp",
      config: {
        // Quality scales differ by codec: avoid oversized high-quality AVIFs.
        avif: { quality: 55, effort: 6 },
        webp: { quality: 80, effort: 6 },
      },
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [sitemap()],
});
