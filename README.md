# Card portfolio

`version/b-card` is the single-screen portfolio variant. It renders a compact
profile over an interactive Three.js contour and Chladni-particle field.

The branch is a static Astro site deployed by the `seanmh-card` Cloudflare
Pages project. It must not be deployed with Wrangler: the root Worker on
`main` owns `seanmh.com` and routes traffic to this Pages origin.

## Development

Use Node 22.12 or newer (see `.nvmrc`):

```bash
npm install
npm run dev
```

Before publishing:

```bash
npm run check
npm run build
npm audit --omit=dev
```

The WebGL layer is progressive enhancement. With reduced motion or without
WebGL, the profile and theme controls remain usable over the CSS background.
