# AGENTS.md — version/nexus (Nexus)

A 3D Three.js portal world: one orb per version, the way into everything. Opt-in at `/?v=nexus`, never a default. Pages project `seanmh-nexus`. Preview port 4325.

## Commands

```bash
npm run dev
npm run check && npm run build
npm run preview -- --port 4325
```

## Notes

- `README.md` here is the untouched Astro starter. The real documentation is
  the `Nexus` wiki page.
- Nexus keeps the shared files in its tree but does **not** import them, and
  its switcher copy has diverged on purpose. It is excluded from
  `check:shared`; leave those copies alone.
- Every new version or path app needs an orb here (see `new-version`). The
  films plan adds one Films orb with film moons; the ring grows from 8 to 9
  once.

Wiki: `Nexus`.

## Site rules (full map in AGENTS.md on `main`)

- Node ≥ 22.12. `~/SoftLot/MyWebsite/.tool-versions` pins 22.23.2; stop if `node -v` is lower.
- Commit straight to this branch, only when asked; never create feature branches.
- **Pushing this branch deploys it** to its Cloudflare Pages project. Confirm first.
- Never run `wrangler deploy` here; only `main` deploys the router Worker.
- Shared files (`src/content/site.ts`, `experience.ts`, `projects.ts`, `src/assets/images/headshot.jpeg`, `src/components/VersionSwitcher.astro`, `src/styles/transitions.css`) are edited on `content` only, then synced.
- Keep this version's own look. Read `~/SoftLot/MyWebsite/seanmh.com/.inspiration` before design work.
- Stays readable without JavaScript; honours `prefers-reduced-motion`.
- Done means `check`, `test` (if present), `build`, then a browser look (`verify-version` skill).
