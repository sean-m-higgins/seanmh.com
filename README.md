# seanmh.com: Scroll version

The long-form portfolio version served from `seanmh-scroll.pages.dev` and
selected at `seanmh.com/?v=a-scroll`.

This is a static Astro site. Cloudflare Pages builds this branch; the front
routing Worker lives only on `main`. Do not deploy this branch over the router.

## Development

Use Node 22.12 or newer (see `.nvmrc`):

```bash
npm install
npm run dev
npm run check
npm run build
npm run preview
```

The main interaction stack is GSAP ScrollTrigger, SplitText, and Lenis. Motion
is disabled when the visitor requests reduced motion, and the document remains
fully readable without JavaScript.

## Shared files

The content, headshot, version switcher, and cross-document transition styles
come from the `content` branch. Make shared changes there first and sync them
into every version branch.
