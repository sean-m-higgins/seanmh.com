# Version G — Travel

Version G of seanmh.com: a static Astro travel journal with a progressively
enhanced Three.js globe. The public canonical namespace is
`https://seanmh.com/travel/`; the Cloudflare Pages origin is intentionally
`noindex` and is proxied by the front Worker.

## Development

Use Node 22.12 or newer:

```bash
npm install
npm run check
npm test
npm run build
npm run preview -- --port 4328
```

Run the main worktree's `node scripts/dev-proxy.mjs` to exercise the complete
`/travel/*` routing contract alongside the other versions.

## Adding a trip

1. Add the trip and its explicitly visited countries to `src/content/trips.ts`.
2. Confirm actual route waypoints before setting `route.published` to `true`.
3. Put source photos in the gitignored `incoming/<trip>/` directory and run
   `npm run photos:prepare -- incoming/<trip> src/assets/trips/<trip>`.
4. Author alt text, captions, and any public location labels in the photo
   manifest. Never derive public location labels from EXIF.

The Norway pre-trip downloads are sanitized historical artifacts. Regenerate
the PDF after editing the HTML with `npm run itinerary:pdf`.
