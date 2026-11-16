# AGENTS.md — version/f-blueprint (Blueprint)

The living systems map: how routing, versions, shared content, services, and fallbacks fit together. A path app at the stable, indexable `seanmh.com/systems/`, not a `?v=` destination. Pages project `seanmh-blueprint`. Preview port 4327.

## Commands

```bash
npm run dev
npm run check && npm run build
npm run preview -- --port 4327   # then node scripts/dev-proxy.mjs on main
```

## Notes

- `base: "/systems"` in `astro.config.mjs`; the Worker strips the prefix when
  proxying. Every internal link must respect the base.
- Dependency-light on purpose: no Tailwind, no framework. Astro renders the
  full record as static HTML; one small TypeScript module adds the inspector
  and the guided tour.
- When routing on `main` changes, this map is out of date until updated here.

Wiki: `Blueprint`, `Cloudflare-Worker`.

## Site rules (full map in AGENTS.md on `main`)

- Node ≥ 22.12. `~/SoftLot/MyWebsite/.tool-versions` pins 22.23.2; stop if `node -v` is lower.
- Commit straight to this branch, only when asked; never create feature branches.
- **Pushing this branch deploys it** to its Cloudflare Pages project. Confirm first.
- Never run `wrangler deploy` here; only `main` deploys the router Worker.
- Shared files (`src/content/site.ts`, `experience.ts`, `projects.ts`, `src/assets/images/headshot.jpeg`, `src/components/VersionSwitcher.astro`, `src/styles/transitions.css`) are edited on `content` only, then synced.
- Keep this version's own look. Read `~/SoftLot/MyWebsite/seanmh.com/.inspiration` before design work.
- Stays readable without JavaScript; honours `prefers-reduced-motion`.
- Done means `check`, `test` (if present), `build`, then a browser look (`verify-version` skill).
