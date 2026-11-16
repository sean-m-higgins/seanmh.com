# AGENTS.md — version/c-terminal (Terminal)

Interactive command-line portfolio: command history and completion, generated git history, and an `ask` command that streams Claude answers. Pages project `seanmh-terminal`; `/?v=c-terminal`. Preview port 4323.

## Commands

```bash
cp .dev.vars.example .dev.vars   # optional secrets for preview
npm run dev                      # predev writes src/content/git-log.ts
npm run check && npm run build
npm run preview -- --port 4323   # exercises functions/api/ask.ts
```

## Notes

- `src/content/git-log.ts` is generated and gitignored. Never commit it.
- `functions/api/ask.ts` serves previews only. On `seanmh.com` the router
  Worker on `main` owns `/api/ask`; change the production prompt, model, or
  rate limit there.
- In plain `npm run dev`, `ask` falls back to local content-grounded answers.
- `npm run deploy` targets the Pages project explicitly and is safe; bare
  `wrangler deploy` is not.

Wiki: `Terminal-Command-Engine`, `Terminal-Window-Controls`, `Pretext-Terminal`.

## Site rules (full map in AGENTS.md on `main`)

- Node ≥ 22.12. `~/SoftLot/MyWebsite/.tool-versions` pins 22.23.2; stop if `node -v` is lower.
- Commit straight to this branch, only when asked; never create feature branches.
- **Pushing this branch deploys it** to its Cloudflare Pages project. Confirm first.
- Never run `wrangler deploy` here; only `main` deploys the router Worker.
- Shared files (`src/content/site.ts`, `experience.ts`, `projects.ts`, `src/assets/images/headshot.jpeg`, `src/components/VersionSwitcher.astro`, `src/styles/transitions.css`) are edited on `content` only, then synced.
- Keep this version's own look. Read `~/SoftLot/MyWebsite/seanmh.com/.inspiration` before design work.
- Stays readable without JavaScript; honours `prefers-reduced-motion`.
- Done means `check`, `test` (if present), `build`, then a browser look (`verify-version` skill).
