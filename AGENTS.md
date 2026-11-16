# AGENTS.md — seanmh.com (main)

Sean Higgins's personal site: one domain, many independently built versions.
This file is the hub. Every branch has its own `AGENTS.md` with branch facts;
this one holds the map and the rules that apply everywhere.

## The map

One repo, one branch per version, each checked out as a worktree under
`~/SoftLot/MyWebsite/wt/`. `main` (this checkout) owns the front router Worker.

| Branch | Worktree | What it is | Public path | Preview port | Wiki page |
|---|---|---|---|---|---|
| `main` | `seanmh.com/` | Router Worker, `/api/*`, dev proxy, plans | all of `seanmh.com` | 8787 (proxy) | Cloudflare-Worker |
| `content` | `wt/content` | Canonical shared files, not deployed | — | — | Architecture |
| `version/a-scroll` | `wt/a-scroll` | Default long-form scroll (GSAP, Lenis) | `/` (default) | 4321 | Scroll-Experience |
| `version/b-card` | `wt/b-card` | Single-screen card, Three.js field, QR print files | `/?v=b-card`, `/card` | 4322 | Card-Background |
| `version/c-terminal` | `wt/c-terminal` | Interactive CLI, `ask` streams from `/api/ask` | `/?v=c-terminal` | 4323 | Terminal-Command-Engine |
| `version/d-3d-game` | `wt/d-game` | Three.js halfpipe arcade game | `/?v=d-3d-game` | 4324 | Halfpipe-Game |
| `version/nexus` | `wt/nexus` | 3D portal world to every version | `/?v=nexus` | 4325 | Nexus |
| `version/e-2d-game` | `wt/e-game` | Counter boxing game | `/?v=e-2d-game` | 4326 | Counter-Game |
| `version/f-blueprint` | `wt/f-blueprint` | Living systems map (path app) | `/systems/` | 4327 | Blueprint |
| `version/g-travel` | `wt/g-travel` | Travel atlas + globe (path app) | `/travel/` | 4328 | Travel |
| `version/h-gaudi` | `wt/h-gaudi` | Casa Higgins, seven-room house | `/?v=h-gaudi` | 4329 | Gaudi |

Routing truth lives in `worker.js` (`VERSIONS`, `NEXUS`, `GAME`, `GAME_2D`,
`PATH_APPS`) and is mirrored by `scripts/dev-proxy.mjs`. Only `VERSIONS` can be
served by default; `?v=` destinations outside it are opt-in.

## Where knowledge lives

Read before guessing. These are maintained and more accurate than inference.

- `wiki/` — the GitHub wiki, a separate git repo (default branch `master`).
  Architecture, branching, Cloudflare setup, and a page per version.
- `.inspiration` — surveyed reference sites with measured facts. **Read it
  before any design work** and cite the entry a decision echoes.
- `plans/*.html` — project plans. `plans/plan.html` is canonical. New plans
  are written as self-contained HTML here.
- `README.md` on each branch — commands and branch-specific contracts.

## Rules that apply on every branch

**Node.** Every branch needs Node ≥ 22.12 (h-gaudi pins 22.23.2). The machine
default is 17.5 via asdf; `~/SoftLot/MyWebsite/.tool-versions` pins 22.23.2
for every worktree. If `node -v` prints anything below 22, stop and say so.

**Git.** Commit straight to the branch you are on: `main` here, the existing
`version/*` branch in a worktree, `master` in `wiki/`. Never create feature
branches. A new branch exists only for a brand-new site version. Commit only
when asked, and stage only the files the task touched.

**Pushing deploys.** Each `version/*` branch is git-connected to a Cloudflare
Pages project, so pushing one is a production deploy. Confirm before pushing.
`wrangler deploy` runs only from `main`, and only after
`npx wrangler deploy --dry-run` passes. Never run `wrangler deploy` from a
version branch; it would replace the router.

**Shared content contract.** `src/content/site.ts`, `experience.ts`,
`projects.ts`, `src/assets/images/headshot.jpeg`,
`src/components/VersionSwitcher.astro`, and `src/styles/transitions.css` are
canonical on `content`. Change them there first, then cherry-pick into each
consuming branch. Never edit a shared copy on a version branch. Verify with
`npm run check:shared` from this checkout.

**Each version keeps its own look.** Versions are deliberately different
(terminal, Gaudí, arcade, atlas). Do not pull one version's typography,
palette, or layout into another. Universal craft rules (motion, states,
accessibility, ship checklist) still apply everywhere.

**Progressive enhancement.** Every version stays readable without JavaScript
and honours `prefers-reduced-motion`. WebGL and motion are enhancements.

**Done means verified.** Run the branch's `check`, `test` (where present), and
`build`, then look at the result in a browser. Report what you checked and
what you did not.

## This branch (main)

```bash
npm test                         # node --test, router behaviour in test/
npm run check:shared             # shared files byte-identical across worktrees
node scripts/dev-proxy.mjs       # local stand-in for the Worker on :8787
npx wrangler deploy --dry-run    # validate the bundle before any deploy
```

`worker.js` owns routing, the `pv` cookie, `/card`, `/systems/*`, `/travel/*`,
`/api/ask` (Claude-backed, rate-limited, needs `ANTHROPIC_API_KEY` and
`ASK_RL`), and the two score leaderboards (KV). Every routing change updates
`worker.js`, `scripts/dev-proxy.mjs`, `test/worker.test.js`, and the README
stable-paths table together.

`plugin/` is the Claude Code plugin for this site (skills, a review agent,
guard hooks). `.claude-plugin/marketplace.json` publishes it from this repo.
