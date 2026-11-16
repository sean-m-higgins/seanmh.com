# AGENTS.md — version/b-card (Card)

Single-screen digital business card over an interactive Three.js contour and Chladni-particle field. Pages project `seanmh-card`; reached at `/?v=b-card` and the printed short path `/card`. Preview port 4322.

## Commands

```bash
npm run dev
npm run check && npm run build
npm audit --omit=dev
npm run preview -- --port 4322
```

## Notes

- WebGL is progressive enhancement: with reduced motion or no WebGL the
  profile and theme controls must still work over the CSS background.
- `qr-codes/` holds printed artwork encoding `https://seanmh.com/card`. Codes
  outlive routing decisions: never change what they encode. Regenerate and
  verify with the Python scripts listed in `README.md`.

Wiki: `Card-Background`.

## Site rules (full map in AGENTS.md on `main`)

- Node ≥ 22.12. `~/SoftLot/MyWebsite/.tool-versions` pins 22.23.2; stop if `node -v` is lower.
- Commit straight to this branch, only when asked; never create feature branches.
- **Pushing this branch deploys it** to its Cloudflare Pages project. Confirm first.
- Never run `wrangler deploy` here; only `main` deploys the router Worker.
- Shared files (`src/content/site.ts`, `experience.ts`, `projects.ts`, `src/assets/images/headshot.jpeg`, `src/components/VersionSwitcher.astro`, `src/styles/transitions.css`) are edited on `content` only, then synced.
- Keep this version's own look. Read `~/SoftLot/MyWebsite/seanmh.com/.inspiration` before design work.
- Stays readable without JavaScript; honours `prefers-reduced-motion`.
- Done means `check`, `test` (if present), `build`, then a browser look (`verify-version` skill).
