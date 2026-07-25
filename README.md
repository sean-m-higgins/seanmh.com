# Shared portfolio content

This branch is the canonical source for content and cross-version UI shared by
the standalone portfolio versions. It is not deployed directly.

## Shared contract

Keep these files byte-identical on `content`, `version/a-scroll`,
`version/b-card`, and `version/c-terminal`:

- `src/content/site.ts`
- `src/content/experience.ts`
- `src/assets/images/headshot.jpeg`
- `src/components/VersionSwitcher.astro`
- `src/styles/transitions.css`

`src/content/projects.ts` is also canonical here, but only needs to exist on a
version branch that consumes project data.

Make shared changes here first. Commit them on `content`, then cherry-pick that
commit into each consuming version branch and adapt only the version-specific
rendering around the shared files. Do not edit a shared copy independently on a
version branch.

## Validation

Use Node 22.12 or newer (see `.nvmrc`), then run:

```bash
npm install
npm run check
npm run build
```

The build validates the canonical content against the reference Astro page.
Run the main branch's shared-file check after syncing all worktrees.
