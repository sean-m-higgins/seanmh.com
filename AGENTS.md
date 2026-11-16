# AGENTS.md — version/a-scroll (Scroll)

The default version: a long-form scroll portfolio. Served at `seanmh.com/` to anyone without a `?v=` or cookie, so it is the first impression for most visitors. Pages project `seanmh-scroll`; preview port 4321.

## Commands

```bash
npm run dev            # :4321
npm run check && npm run build
npm run preview -- --port 4321
```

## Notes

- Motion stack: GSAP ScrollTrigger, SplitText, and Lenis. All of it is
  disabled under reduced motion, and the document reads fully without JS.
- Being the default, regressions here are the most visible. Verify at 375px
  and with reduced motion before every push.

Wiki: `Scroll-Experience`, `Intro-Loader`, `Hero-Constellation`.

## Site rules (full map in AGENTS.md on `main`)

- Node ≥ 22.12. `~/SoftLot/MyWebsite/.tool-versions` pins 22.23.2; stop if `node -v` is lower.
- Commit straight to this branch, only when asked; never create feature branches.
- **Pushing this branch deploys it** to its Cloudflare Pages project. Confirm first.
- Never run `wrangler deploy` here; only `main` deploys the router Worker.
- Shared files (`src/content/site.ts`, `experience.ts`, `projects.ts`, `src/assets/images/headshot.jpeg`, `src/components/VersionSwitcher.astro`, `src/styles/transitions.css`) are edited on `content` only, then synced.
- Keep this version's own look. Read `~/SoftLot/MyWebsite/seanmh.com/.inspiration` before design work.
- Stays readable without JavaScript; honours `prefers-reduced-motion`.
- Done means `check`, `test` (if present), `build`, then a browser look (`verify-version` skill).
