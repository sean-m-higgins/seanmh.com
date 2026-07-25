# Terminal portfolio

`version/c-terminal` is the interactive command-line portfolio variant. It
includes command history and completion, generated Git history, a local
content-grounded `ask` fallback, and a secret-gated streaming AI endpoint.

The Astro site is static. A native Cloudflare Pages Function at
`functions/api/ask.ts` serves local preview and direct-origin API requests. At
`seanmh.com`, the front Worker on `main` owns `/api/ask` and shadows this copy.

## Development

Use Node 22.12 or newer (see `.nvmrc`):

```bash
npm install
cp .dev.vars.example .dev.vars
npm run dev
```

The secrets are optional for UI development. `npm run dev` serves the static
UI, where `ask` falls back to embedded content. Use `npm run preview` to build
the site and exercise the Pages Function with `.dev.vars`.

Before publishing:

```bash
npm run check
npm run build
npm audit --omit=dev
```

`predev` and `prebuild` generate the ignored `src/content/git-log.ts` file.
The connected `seanmh-terminal` Pages project runs `npm run build`; the deploy
script targets that Pages project explicitly and cannot replace the root
router Worker.
