// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://seanmh.com',
  vite: {
    plugins: [tailwindcss()],
    // Without a target, esbuild assumes evergreen browsers and strips -webkit-
    // prefixes that older iOS Safari still needs (user-select, backdrop-filter).
    build: { cssTarget: 'safari15' }
  },
  integrations: [sitemap()]
});
