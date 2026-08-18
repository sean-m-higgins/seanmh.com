# Version F — Blueprint

The living systems map for seanmh.com. Blueprint explains how the portfolio's
edge routing, independent versions, shared content, optional services, and
fallbacks fit together.

Blueprint is deployed as its own Cloudflare Pages project but is public at the
stable, indexable path `https://seanmh.com/systems/`. The front Worker owns
`/systems/*`, strips that prefix when proxying to this origin, and resolves the
path before any `pv` version cookie. It is not a `?v=` destination and does not
change the visitor's selected portfolio version.

## Development

Use Node 22.12 or newer:

```bash
npm install
npm run dev
npm run check
npm run build
npm run preview -- --port 4327
```

The site is deliberately dependency-light: Astro renders the complete system
record as static HTML, while a small TypeScript module adds the node inspector
and guided request tour. The vertical architecture index remains complete
without JavaScript.

To exercise path routing with the other versions, start this preview on port
4327 and use `node scripts/dev-proxy.mjs` from the main worktree.
