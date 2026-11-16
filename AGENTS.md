# AGENTS.md — version/e-2d-game (Counter)

Counter, a 2D boxing game: read the punch, slip or duck, then counter. Opt-in at `/?v=e-2d-game`. Pages project `seanmh-2d-game`. Preview port 4326. Global top ten via `/api/score/boxing` on the router Worker.

## Commands

```bash
npm test               # node --experimental-strip-types, test/*.test.mjs
npm run check && npm run build
npm run preview -- --port 4326
```

## Notes

- All balance lives in `src/scripts/game/tuning.ts`. The first 30s ease in on
  elapsed time only, so scores stay comparable; there is no difficulty setting.
- Controls: arrows or A/S/D, Space/J counter, R restart, M sound, plus four
  touch controls. Keep every input path working.
- The leaderboard hides itself when the Worker or KV is unavailable; local
  personal and daily bests always work.

Wiki: `Counter-Game`.

## Site rules (full map in AGENTS.md on `main`)

- Node ≥ 22.12. `~/SoftLot/MyWebsite/.tool-versions` pins 22.23.2; stop if `node -v` is lower.
- Commit straight to this branch, only when asked; never create feature branches.
- **Pushing this branch deploys it** to its Cloudflare Pages project. Confirm first.
- Never run `wrangler deploy` here; only `main` deploys the router Worker.
- Shared files (`src/content/site.ts`, `experience.ts`, `projects.ts`, `src/assets/images/headshot.jpeg`, `src/components/VersionSwitcher.astro`, `src/styles/transitions.css`) are edited on `content` only, then synced.
- Keep this version's own look. Read `~/SoftLot/MyWebsite/seanmh.com/.inspiration` before design work.
- Stays readable without JavaScript; honours `prefers-reduced-motion`.
- Done means `check`, `test` (if present), `build`, then a browser look (`verify-version` skill).
