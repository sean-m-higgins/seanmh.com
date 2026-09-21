# Casa Higgins — Version H

A seven-room house for Sean Higgins's software, woodworking, art, and Eagle
Scout project, inspired by Gaudí and the
procedural storytelling recorded in the project's `.inspiration` survey.
Branch: `version/h-gaudi`. Planned origin: `seanmh-gaudi.pages.dev`.
Public selection after release: `https://seanmh.com/?v=h-gaudi`.
Current status: local implementation; not deployed.

This is a static Astro site. Cloudflare Pages builds this branch; the front
routing Worker lives only on `main`. Do not deploy this branch over the router.

## Development

Use Node 22.23.2 (see `.nvmrc`; minimum 22.19):

```bash
npm ci
npm run dev
npm run check
npm test
npm run build
npm run preview -- --port 4329
```

Astro renders semantic HTML and original SVG geometry. Small TypeScript modules
drive five interactive Gaudí studies and a customizable mosaic artifact; a lazy Three.js
lightwell adds atmosphere. The document remains readable without JavaScript.

## Design and review

- [Design record](docs/design.md): narrative, references, geometry, materials, and interaction contracts.
- [Verification](docs/verification.md): measured checks, visual revisions, and release status.
- [Adding photographs](docs/photographs.md): the four woodworking, seven artwork, and Eagle project slots.
- `node scripts/studies.mjs`: comparative browser composition studies.
- `node scripts/visual-qa.mjs --all`: Chromium, Firefox, and WebKit checks. Install Chrome and run `npx playwright install firefox webkit` first.
- `node scripts/capture.mjs`: regenerate the social image and local walkthrough recording.
- `node scripts/revision-review.mjs`: individual study captures, frame-overlap checks, and no-JS carousel review.

Review scripts expect the preview on port 4329. Outputs live in gitignored
`artifacts/`; the generated social image lives in `public/`. The main worktree's
local proxy on port 8787 supports `/?v=h-gaudi` for integrated routing checks.

## Release

Provision and verify the H Pages origin before publishing Worker routing,
Nexus, and Blueprint integration changes. H is intentionally discovered through
the Nexus rather than the shared switcher. The canonical
default stays `a-scroll`. The wiki's Gaudi page contains the release order.

## Shared files

The content, headshot, version switcher, and cross-document transition styles
come from the `content` branch. Make shared changes there first and sync them
into every version branch.
