# AGENTS.md — version/i-films (Films)

Short animated films drawn in code from Sean's build photos. A path app at
`seanmh.com/films/` (not live yet); the Pages origin is `noindex`. Pages
project `seanmh-films` (not created yet). Preview port 4330 for Astro, 4340
for the film stage.

## Commands

```bash
npm test
npm run film:preview
npm run film:render -- <slug> [--still t,t | --hash f,f | --release]
npm run check && npm run build
```

## Notes

- Start every film session with `~/SoftLot/MyWebsite/seanmh.com/prompts/00-shared-brief.md`
  and the film's prompt. Follow its gates: storyboard, then style frames, each
  approved by Sean before the next step.
- `README.md` has the film module contract and the measured pipeline facts
  (determinism, speed, bitrate, chroma).
- **Hold the shading, boil the line**, or the film blows the 20 MiB budget.
- Reference photos and storyboards stay in gitignored `incoming/` or in
  `~/SoftLot/MyWebsite/film-refs/`. Never commit them.
- Every frame must be a pure function of the frame index.

Plan: `plans/films-plan.html` on `main`.

## Site rules (full map in AGENTS.md on `main`)

- Node ≥ 22.12. `~/SoftLot/MyWebsite/.tool-versions` pins 22.23.2; stop if `node -v` is lower.
- Commit straight to this branch, only when asked; never create feature branches.
- **Pushing this branch deploys it** to its Cloudflare Pages project (once it exists). Confirm first.
- Never run `wrangler deploy` here; only `main` deploys the router Worker.
- Shared files (`src/content/site.ts`, `experience.ts`, `projects.ts`, `src/assets/images/headshot.jpeg`, `src/components/VersionSwitcher.astro`, `src/styles/transitions.css`) are edited on `content` only, then synced.
- Keep this version's own look. Read `~/SoftLot/MyWebsite/seanmh.com/.inspiration` before design work.
- Stays readable without JavaScript; honours `prefers-reduced-motion`.
- Done means `check`, `test`, `build`, then a browser look (`verify-version` skill).
