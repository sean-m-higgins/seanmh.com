# AGENTS.md — version/h-gaudi (Casa Higgins)

Casa Higgins: a seven-room house, inspired by Gaudí, for Sean's software, woodworking, art, and Eagle Scout project. `/?v=h-gaudi`, listed in the Worker's `VERSIONS` (switchable, not the default). Pages project `seanmh-gaudi`. Preview port 4329. Pins Node 22.23.2.

## Commands

```bash
npm ci
npm run dev
npm run check && npm test && npm run build
npm run preview -- --port 4329
```

## Notes

- Read `docs/design.md` before design changes: narrative, geometry,
  materials, and interaction contracts are recorded there.
- `docs/verification.md` records measured checks. Update it when you verify.
  `@axe-core/playwright` and `lighthouse` are installed for that.
- `docs/photographs.md` explains the photo slots. Original photos stay out of
  the repo.
- Original SVG geometry and five interactive studies; the Three.js lightwell
  loads lazily and is optional.

Wiki: `Gaudi`. Plan: `plans/films-plan.html` on `main` links films to rooms.

## Site rules (full map in AGENTS.md on `main`)

- Node ≥ 22.12. `~/SoftLot/MyWebsite/.tool-versions` pins 22.23.2; stop if `node -v` is lower.
- Commit straight to this branch, only when asked; never create feature branches.
- **Pushing this branch deploys it** to its Cloudflare Pages project. Confirm first.
- Never run `wrangler deploy` here; only `main` deploys the router Worker.
- Shared files (`src/content/site.ts`, `experience.ts`, `projects.ts`, `src/assets/images/headshot.jpeg`, `src/components/VersionSwitcher.astro`, `src/styles/transitions.css`) are edited on `content` only, then synced.
- Keep this version's own look. Read `~/SoftLot/MyWebsite/seanmh.com/.inspiration` before design work.
- Stays readable without JavaScript; honours `prefers-reduced-motion`.
- Done means `check`, `test` (if present), `build`, then a browser look (`verify-version` skill).
