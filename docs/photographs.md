# Adding the work

All twelve project/photo entries live in `src/content/making.ts`:

- `woodworking`: Side table, Shoe rack, Desk, Coffee table, in the supplied filename order.
- `artworks`: seven canvas frames. `frame` chooses a plain walnut, oak, or charcoal border and the canvas shape. There is no mat or decorative moulding.
- `eagle`: the portable wheelchair ramp project; replaces the labelled conceptual drawing.

Add image files to `src/assets/images/`, import them into `making.ts`, and populate the corresponding entry:

```ts
import firstCanvas from "../assets/images/artwork-01.webp";

// Inside artworks, replacing the first placeholder entry:
{ id: "art-01", frame: "walnut portrait", image: firstCanvas,
  title: "Your artwork title", alt: "A concrete description of the canvas",
  caption: "Optional context." }
```

Astro generates responsive, lazy-loaded images. Both art and woodworking photographs retain their full aspect ratio: no forced crop cuts off the furniture or artwork. Supply descriptive `alt` text for every photo.

## Woodworking originals and optimized copies

`incoming/` is ignored by Git and is never part of the published site. Keep camera originals there. `node scripts/prepare-woodworking.mjs` processes the four explicitly named originals into `src/assets/images/woodworking/` without changing the source files. It applies EXIF orientation, caps the long edge at 1600px without upscaling, encodes high-quality WebP, and strips EXIF/GPS and other camera metadata. It does not retouch, crop, or recolor the images.

The four originals total 13.23MB; processed source assets total 1.89MB (86% smaller). Astro's `Picture` generates AVIF and WebP alternatives at 240, 400, 640, and 960px widths; the browser selects the format and size appropriate to the display. Encoding uses AVIF quality 55 and WebP quality 80 because the codecs' quality scales differ. Source assets are not eagerly downloaded at full size.

Tests in `test/photographs.test.mjs` verify format, dimensions, and metadata removal without needing the ignored originals. `node scripts/photos-review.mjs` checks loaded photos, aspect ratios, frame spacing, and accessibility in Chromium and WebKit.

Until a photograph is supplied, the deliberately labelled placeholder remains. Add real titles, materials, dates, or process notes only when provided. There are no fabricated project details to replace.

After adding photos, run `npm run check`, `npm run build`, and the browser review. Inspect the art wall especially: unusually tall or wide art may need a frame-shape or grid-placement adjustment in `src/styles/collections.css`.
