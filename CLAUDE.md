@AGENTS.md

## Claude Code

The `seanmh` plugin (in `plugin/`, enabled by `.claude/settings.json`) adds:

- `site-craft` — motion, states, accessibility, and ship rules for any UI work
- `motion-design` — timing, easing, and choreography (LottieFiles, MIT)
- `verify-version` — check, test, build, preview, and look in a browser
- `sync-shared` — move a shared-file change from `content` to every branch
- `new-version` — everything a brand-new site version has to touch
- `design-reviewer` agent — screenshots a running version and reviews it
- guard hooks — confirm before pushing a `version/*` branch, block
  `wrangler deploy` off `main`, block edits to shared files off `content`,
  warn when Node is below 22

Browser checks use the Playwright MCP server. Cloudflare logs, builds, and
deployments are available through the Cloudflare plugin.
