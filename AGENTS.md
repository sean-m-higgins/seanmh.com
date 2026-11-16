# AGENTS.md — content

Canonical source for the files shared across versions. Not deployed; it renders a reference page that validates the shared content at build time.

## Commands

```bash
npm run check && npm run build
```

## Contract

- This is the **only** branch where shared files are edited. Change them here,
  commit, then cherry-pick into each consuming branch (`sync-shared` skill).
- The consuming branch list is `scripts/check-shared.mjs` on `main`; this
  README lists only the original three and is out of date.
- Facts about Sean (jobs, dates, projects, links) live in `src/content/*.ts`.
  Never invent them; ask Sean.
- New version branches are created from this branch.

Wiki: `Architecture`, `Version-Switcher`.

## Site rules (full map in AGENTS.md on `main`)

- Node ≥ 22.12. `~/SoftLot/MyWebsite/.tool-versions` pins 22.23.2; stop if `node -v` is lower.
- Commit straight to this branch, only when asked; never create feature branches.
- **Pushing this branch deploys it** to its Cloudflare Pages project. Confirm first.
- Never run `wrangler deploy` here; only `main` deploys the router Worker.
- Shared files (`src/content/site.ts`, `experience.ts`, `projects.ts`, `src/assets/images/headshot.jpeg`, `src/components/VersionSwitcher.astro`, `src/styles/transitions.css`) are edited on `content` only, then synced.
- Keep this version's own look. Read `~/SoftLot/MyWebsite/seanmh.com/.inspiration` before design work.
- Stays readable without JavaScript; honours `prefers-reduced-motion`.
- Done means `check`, `test` (if present), `build`, then a browser look (`verify-version` skill).
