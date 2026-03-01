# seanmh.com — Multi-Version Portfolio

This repo maintains multiple completely different visual versions of [seanmh.com](https://seanmh.com). Each version lives on its own long-lived branch and is independently deployable.

## Branches

| Branch | Description | Status |
|--------|-------------|--------|
| `main` | This README (not deployed) | — |
| `content` | Staging branch for content-only changes | — |
| `version/a-scroll` | Scrollable single-page portfolio | Production |
| `version/b-card` | Single-viewport digital business card | Preview |
| `version/c-terminal` | Terminal/CLI-themed portfolio | Preview |

## Switching the Live Version

1. Go to **Vercel Dashboard > seanmh.com > Settings > Git > Production Branch**
2. Change to the desired `version/*` branch
3. Vercel triggers a new production build (~30 seconds)

All version branches always have Vercel preview URLs available.

## Content Sync

All versions share the same content files at identical paths:

```
src/content/site.ts          # name, title, tagline, email, social links
src/content/experience.ts    # ExperienceEntry interface + experience array
src/assets/images/headshot.jpeg
```

These files (plus `astro.config.mjs`, `package.json`, `tsconfig.json`) are the **content contract** — identical across all version branches.

### Updating content across all versions

```bash
# 1. Make changes on the content branch
git checkout content
# edit src/content/site.ts or src/content/experience.ts
git add -A && git commit -m "Update job title"

# 2. Cherry-pick to each version branch
git checkout version/a-scroll && git cherry-pick <hash>
git checkout version/b-card   && git cherry-pick <hash>
git checkout version/c-terminal && git cherry-pick <hash>
```

Cherry-pick (not merge) because version branches diverge heavily in components/layouts. Content-only commits cherry-pick cleanly since the content files are identical in path and structure.

## Files That Differ Per Version

```
src/pages/          # each version composes its own pages
src/layouts/        # each version has its own layout
src/components/     # completely different per version
src/styles/         # different theme/typography per version
vercel.json         # version-specific rewrites, or empty
```

## Adding a New Version

```bash
git checkout -b version/d-whatever version/a-scroll
# Rewrite src/pages/, src/layouts/, src/components/, src/styles/
# Keep src/content/ and src/assets/ untouched
# Commit, push, and Vercel will create a preview URL automatically
```

## Development

```bash
npm install
npm run dev      # localhost:4321
npm run build    # production build
npm run preview  # preview production build
```
