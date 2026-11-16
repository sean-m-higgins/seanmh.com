---
name: sync-shared
description: Change a file that is shared across seanmh.com versions (site.ts, experience.ts, projects.ts, headshot, VersionSwitcher.astro, transitions.css) and carry it to every consuming branch. Use whenever content about Sean changes (bio, jobs, projects, links), the version switcher changes, or check:shared reports a mismatch.
---

# Sync a shared file

The contract and the branch list live in `scripts/check-shared.mjs` on `main`.
That file is the source of truth; read it first in case the list has changed.

## Steps

1. **Edit on `content` only** (`~/SoftLot/MyWebsite/wt/content`). Make the
   change, then `npm run check && npm run build` there. Commit on `content`
   if Sean has asked for commits.
2. **Carry it to each consuming branch.** Prefer cherry-picking the
   `content` commit in each worktree:

   ```bash
   cd ~/SoftLot/MyWebsite/wt/<name>
   git cherry-pick <sha>
   ```

   If the commit is not made yet, copy the file byte for byte
   (`cp ../content/<path> <path>`). Never retype or reformat it.
3. **Adapt around it, not in it.** If a version renders the shared data
   differently, change that version's components, not the shared file.
4. **Verify each consuming branch** with `npm run check && npm run build`.
5. **Run the contract check** from the main checkout:

   ```bash
   cd ~/SoftLot/MyWebsite/seanmh.com && npm run check:shared
   ```

## Notes

- `version/nexus` keeps the shared files in its tree but does not import
  them, and its switcher copy has diverged on purpose. Leave it alone unless
  asked.
- A new entry in `VersionSwitcher.astro` is part of launching a version; see
  the `new-version` skill.
- Pushing a version branch deploys it. List the branches you changed and ask
  before pushing.
