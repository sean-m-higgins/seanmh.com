# seanmh.com

Multi-version portfolio site. Scroll is the canonical default; visitors can explicitly explore alternate portfolio presentations, opt-in games, the Nexus portal world, and the public Blueprint systems map.

| Branch | Version | URL |
|--------|---------|-----|
| `version/a-scroll` | Scrollable single-page | seanmh-scroll.pages.dev |
| `version/b-card` | Digital business card | seanmh-card.pages.dev |
| `version/c-terminal` | Terminal/CLI-themed | seanmh-terminal.pages.dev |
| `version/nexus` | 3D portal world | seanmh-nexus.pages.dev |
| `version/d-3d-game` | Halfpipe arcade game | seanmh-3d-game.pages.dev |
| `version/e-2d-game` | Counter boxing game | seanmh-2d-game.pages.dev |
| `version/f-blueprint` | Living systems map at `/systems/` | seanmh-blueprint.pages.dev |

## Quick Start

```bash
git checkout version/a-scroll  # or another version branch
npm install
npm run dev    # localhost:4321
```

## Docs

See the **[Wiki](https://github.com/sean-m-higgins/seanmh.com/wiki)** for full documentation: architecture, branching strategy, Cloudflare setup, content sync workflow, and more.

## Router Worker

The `main` branch owns the front routing Worker and local multi-version proxy.
Use Node 22.12 or newer (see `.nvmrc`), then run `npm test` and
`npm run check:shared`. Validate a deployment bundle with
`npx wrangler deploy --dry-run` before deploying.
