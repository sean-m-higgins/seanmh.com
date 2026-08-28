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
| `version/g-travel` | Interactive travel atlas at `/travel/` | seanmh-travel.pages.dev |

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
Blueprint and G Travel use stable `/systems/*` and `/travel/*` namespaces;
`/?v=g-travel` is a convenience redirect to the canonical Travel path.
Use Node 22.12 or newer (see `.nvmrc`), then run `npm test` and
`npm run check:shared`. Validate a deployment bundle with
`npx wrangler deploy --dry-run` before deploying.

### Stable paths

Some paths the Worker owns outright, resolved before `?v=`/cookie version
selection so they never vary with a visitor's preference:

| Path | Behaviour |
|------|-----------|
| `/card` | 302 to `/?v=b-card`. The short URL printed on stickers and business cards. |
| `/systems/` | Proxies the Blueprint Pages project, prefix stripped. |
| `/api/*` | Answered by the Worker directly: `/api/ask`, `/api/score`, `/api/score/boxing`. |
| `/robots.txt`, `/sitemap-index.xml`, `/sitemap-0.xml` | Served at the edge. |

`/card` exists because print is unforgiving: it encodes into a 29x29 QR symbol
where `/?v=b-card` needed 33x33, a 12% larger module at the same physical size.
It carries any query string across, so a tracking param printed on one run of
stickers survives the redirect, and it is deliberately a 302 — printed codes
outlive routing decisions, and a permanent redirect would be cached by every
browser that ever scanned an old sticker. The artwork and print files live in
`qr-codes/` on `version/b-card`.
