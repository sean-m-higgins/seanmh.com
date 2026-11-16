---
name: new-version
description: Launch a brand-new version of seanmh.com (a new version/* branch with its own Cloudflare Pages project) and wire it into routing, the dev proxy, tests, the switcher or Nexus, docs, and the shared-file check. Use when Sean wants a new version, a new path app like /systems or /travel, or asks what a new version has to touch.
---

# Launch a new version

A version is a branch, a worktree, a Pages project, and a routing entry. Most
of the work is the wiring; miss one piece and the version is unreachable or
breaks the switcher.

## 0. Decide with Sean first

Ask in one batch, with a recommendation for each:

- **Name and letter.** Next free letter after the existing ones (`a`–`h`).
  Branch `version/<letter>-<slug>`, worktree `wt/<slug>`.
- **Kind.** A `?v=` destination (`VERSIONS` if it may ever be a default, or
  its own constant like `NEXUS`/`GAME` if opt-in only), or a path app with a
  stable prefix (`PATH_APPS`, like `/systems`, `/travel`).
- **Entry point.** Version switcher pill, Nexus orb, a link from another
  version, or none yet.
- **Concept.** Write a plan in `plans/<slug>-plan.html` first, grounded in
  `.inspiration`. Get it approved before building.

## 1. Branch and site

```bash
cd ~/SoftLot/MyWebsite/seanmh.com
git worktree add ../wt/<slug> -b version/<letter>-<slug> content
```

Branching from `content` gives the shared files and a working Astro baseline.
Give it `.nvmrc`, a real `README.md` (what it is, commands, contracts),
`AGENTS.md`, `CLAUDE.md` (`@AGENTS.md`), and `.claude/settings.json` copied
from another version. Set `site: 'https://seanmh.com'` in `astro.config.mjs`
(plus `base: '/<prefix>'` for a path app). Pages origins must be `noindex`.

## 2. Routing on main

Change these together, in one commit:

- `worker.js` — add the origin to the right list, `https://seanmh-<slug>.pages.dev`.
- `scripts/dev-proxy.mjs` — same entry with the next free local port
  (currently 4330) and the port comment at the top.
- `test/worker.test.js` — cover the new route.
- `README.md` — the branch table and, for path apps, the stable-paths table.
- `scripts/check-shared.mjs` — add the branch to every shared file it imports.

Then `npm test` and `npx wrangler deploy --dry-run`.

## 3. Entry points

- Switcher pill: edit `VersionSwitcher.astro` on `content`, then use
  `sync-shared`.
- Nexus orb: change `version/nexus`; see the Nexus wiki page.

## 4. Docs

- `wiki/<Name>.md` page plus links from `Home.md` and `Architecture.md`;
  commit and push on `master` (wiki only publishes `master`).
- Add the branch to the map table in `AGENTS.md` on `main` and to the port
  table in the `verify-version` skill.

## 5. Deploy (Sean confirms each step)

1. Create the `seanmh-<slug>` Pages project, git-connected to the branch,
   build `npm run build`, output `dist`, Node 22.
2. Push the branch; confirm `seanmh-<slug>.pages.dev` serves it.
3. Deploy the Worker from `main`; confirm the public route and the
   `X-Portfolio-Version` header.
4. Run `verify-version` against production.
