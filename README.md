# seanmh.com

Multi-version portfolio site. Three visual versions are served from the same domain — visitors are randomly assigned a version, with a switcher to explore the others.

| Branch | Version | URL |
|--------|---------|-----|
| `version/a-scroll` | Scrollable single-page | seanmh-scroll.pages.dev |
| `version/b-card` | Digital business card | seanmh-card.pages.dev |
| `version/c-terminal` | Terminal/CLI-themed | seanmh-terminal.pages.dev |

## Quick Start

```bash
git checkout version/a-scroll  # or b-card, c-terminal
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
