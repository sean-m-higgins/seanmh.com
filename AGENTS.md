# AGENTS.md — version/d-3d-game (Halfpipe)

Three.js snowboard halfpipe arcade game. Opt-in only: reached by `/?v=d-3d-game` or the switcher's Game pill, never served as a default. Pages project `seanmh-3d-game`. Preview port 4324. Global top ten via `/api/score` on the router Worker.

## Commands

```bash
npm run dev
npm run check && npm run build
npm run preview -- --port 4324
```

## Notes

- `README.md` on this branch is a stale copy of the `content` README. The
  real design, controls, and scoring are in the `Halfpipe-Game` wiki page and
  `version-d-3d-game.html`.
- Scoring: `trick = (rotation° × grab_bonus + 60) × air_time`,
  `run = Σ tricks × landing_chain`. Changing it changes the leaderboard.
- The game must stay playable when `/api/score` is unreachable.

Wiki: `Halfpipe-Game`.

## Site rules (full map in AGENTS.md on `main`)

- Node ≥ 22.12. `~/SoftLot/MyWebsite/.tool-versions` pins 22.23.2; stop if `node -v` is lower.
- Commit straight to this branch, only when asked; never create feature branches.
- **Pushing this branch deploys it** to its Cloudflare Pages project. Confirm first.
- Never run `wrangler deploy` here; only `main` deploys the router Worker.
- Shared files (`src/content/site.ts`, `experience.ts`, `projects.ts`, `src/assets/images/headshot.jpeg`, `src/components/VersionSwitcher.astro`, `src/styles/transitions.css`) are edited on `content` only, then synced.
- Keep this version's own look. Read `~/SoftLot/MyWebsite/seanmh.com/.inspiration` before design work.
- Stays readable without JavaScript; honours `prefers-reduced-motion`.
- Done means `check`, `test` (if present), `build`, then a browser look (`verify-version` skill).
