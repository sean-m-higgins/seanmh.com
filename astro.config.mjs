// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';
import { publishedPhotoTripSlugs } from './src/content/publication.mjs';

const publishedPhotoTrips = new Set(publishedPhotoTripSlugs);

// https://astro.build/config
export default defineConfig({
  site: 'https://seanmh.com',
  base: '/travel',
  vite: {
    build: {
      // Preserve classic max-width media queries. Tailwind's optimizer emits
      // range syntax when minifying; the unminified form keeps Blueprint's
      // mobile fallback working in older browsers too, for a negligible
      // compressed-size difference on this small stylesheet.
      cssMinify: false,
    },
  },
  integrations: [sitemap({
    filter: (page) => {
      const match = new URL(page).pathname.match(/^\/travel\/([^/]+)\/photos\/$/);
      return !match || publishedPhotoTrips.has(match[1]);
    },
  })]
});
