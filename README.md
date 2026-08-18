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

## QR codes and print files

`qr-codes/` holds the scannable codes for this version and the print-ready
artwork built from them. They encode `https://seanmh.com/card`, a short path
the root Worker on `main` redirects to `/?v=b-card` — short enough to set in
type, and it encodes into a 29x29 symbol where the query string needed 33x33.

Four looks, all standard QR codes: `qr-mono` (plain black on white, the
maximum-compatibility option), `qr-indigo` and `qr-indigo-glyph` (rounded
modules, site accent gradient, the second with the dial's card glyph knocked
into the middle), and `qr-dark` (light modules on `#0a0a0a`). Each ships as
PNG and SVG; `print/` carries nine vector PDFs — 1in/1.5in/2in stickers, a
3.5x2in business card back, a 48-up US Letter sheet, and a geometry proof.

The print files set MediaBox, TrimBox and BleedBox rather than drawing crop
marks, and each symbol is sized so its own four-module quiet zone reaches the
trim line, which doubles as the safe area. Background bleeds 3mm past trim.

Two caveats worth keeping: `qr-dark` is inverted, which iOS and Android read
but some older third-party scanners do not, and the indigo shifts noticeably
under a CMYK press profile (cosmetic only — contrast against white holds).

Regenerating needs `segno`, `pillow`, `opencv-contrib-python-headless`,
`reportlab` and `pymupdf`:

```bash
python3 qr-codes/make_qr.py        # PNG + SVG
python3 qr-codes/make_pdfs.py      # print/*.pdf
python3 qr-codes/verify_qr.py      # decode sweep, two independent decoders
python3 qr-codes/verify_pdfs.py    # page boxes + decode each PDF at 150/300/600dpi
```

Change the artwork and rerun both verifiers before committing: rounding the
finder eyes past a 1-module radius stops decoders recognising the finder
pattern, and the codes stop scanning entirely.
