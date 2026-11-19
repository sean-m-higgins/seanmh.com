# AGENTS.md — version/g-travel (Travel)

Travel journal with a progressively enhanced Three.js globe. A path app at `seanmh.com/travel/`; the Pages origin is `noindex`. Pages project `seanmh-travel`. Preview port 4328.

## Commands

```bash
npm test
npm run check && npm run build
npm run preview -- --port 4328
npm run photos:prepare -- incoming/<trip> src/assets/trips/<trip>
npm run itinerary:pdf
```

## Notes

- Adding a trip follows the five steps in `README.md`. A trip stays unlinked,
  `noindex`, and out of the sitemap until its slug is in
  `src/content/publication.mjs`.
- `incoming/` is gitignored source photos. Never commit them.
- **Never derive public location labels from EXIF.** Captions, alt text, and
  places are authored by hand.
- Only set `route.published` after Sean confirms the real waypoints.

Wiki: `Travel` (journeys, the US places layer, photos, and how to add each).

## Site rules (full map in AGENTS.md on `main`)

- Node ≥ 22.12. `~/SoftLot/MyWebsite/.tool-versions` pins 22.23.2; stop if `node -v` is lower.
- Commit straight to this branch, only when asked; never create feature branches.
- **Pushing this branch deploys it** to its Cloudflare Pages project. Confirm first.
- Never run `wrangler deploy` here; only `main` deploys the router Worker.
- Shared files (`src/content/site.ts`, `experience.ts`, `projects.ts`, `src/assets/images/headshot.jpeg`, `src/components/VersionSwitcher.astro`, `src/styles/transitions.css`) are edited on `content` only, then synced.
- Keep this version's own look. Read `~/SoftLot/MyWebsite/seanmh.com/.inspiration` before design work.
- Stays readable without JavaScript; honours `prefers-reduced-motion`.
- Done means `check`, `test` (if present), `build`, then a browser look (`verify-version` skill).
