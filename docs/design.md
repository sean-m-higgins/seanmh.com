# Casa Higgins — a house that grows

Version H is a house for the things Sean Higgins makes: software, woodworking, art, and the Eagle Scout ramp project. Seven rooms, still growing. The final line is **Make something worth keeping.** Catenary structure, branching geometry, ceramic fragments, and shaped light supply the visual grammar. This edition deliberately does not repeat Scroll's résumé or personal biography.

## References and original decisions

- The repository's `.inspiration`, surveyed September 19, 2026, is the design brief. Kengo Works' illustrated biographies informed continuity, personal specificity, restrained captions, and a resolved ending. Its gallery informed a finite numbered tour and quiet navigation. Its generative paintings informed a seeded artifact, a themed verb, and a downloadable keepsake.
- Lando Norris informed controlled accent color, strong proportions, and a long settling curve. This site has no commerce funnel or entrance gate.
- [Gaudí and nature](https://sagradafamilia.org/en/antoni-gaudi), [structural branching](https://blog.sagradafamilia.org/en/columns-sagrada-familia-geometry-mechanics-materials-stone-forest/), and [Casa Batlló's light](https://www.casabatllo.es/en/news/casa-batllo-the-house-of-light/) inform the architecture.
- All geometry and illustration code is original. No portrait or stock artwork substitutes for the photographs still to come. Fonts are locally bundled, licensed OFL; package license files are retained in the dependency distribution. No reference-site source or artwork is included.

## Seven rooms

1. **Threshold:** a nested limestone portal, original stained-glass fragments, botanical mullions, and a perspective floor. The complete SVG paints before enhancement; a transparent shader adds a moving light volume.
2. **Structure:** a horizontal, native scroll-snap sketchbook with five interactive studies: gravity/catenary sag, natural branching, ruled surfaces, lightwell color, and trencadís. Each has a labelled range input and an original SVG drawn both at build time and on input. Pager buttons, horizontal scrolling, and focused-track Arrow/Home/End keys work without hijacking vertical wheel input. No autoplay. These are explanatory studies, not engineering or photometric simulations.
3. **Works:** four curated professional exhibits. Gateway uses nested arches; consent a reciprocal rosette; data a converging flow; the portfolio nine openings with one distinct arch. Native disclosures retain the full professional context and explicitly identify employer links.
4. **Growth:** the original branching tree alongside four supplied woodworking photographs: side table, shoe rack, desk, and coffee table, captioned “The freshman piece” through “The senior piece.” Supplied filename order establishes the progression; no dates, wood species, or process claims are invented. Full compositions are retained, with responsive AVIF/WebP delivery and camera metadata removed.
5. **Courtyard:** seven simple canvas floater frames in walnut, oak, and charcoal, varying between portrait, landscape, and square. Thin straight borders and a small shadow gap replace the earlier ornamental picture frames and wide mats. They surround the existing bench, plants, mountain window, and Sunny illustration. This is an imaginative room, not a depiction of Sean's actual home or furniture. Mobile recomposes the wall around Sunny rather than shrinking the desktop arrangement.
6. **Eagle:** a dedicated portable-wheelchair-ramp project. The original illustration now draws from the supplied reference photograph: a long metal deck with traction strips, timber posts, dark handrails, wheels along the base, and a large square upper landing. Facing uphill, the ramp shares the landing's right edge; the square extends to the left. The landing has railings only on the far and right edges, leaving the entrance and left side open, as clarified by Sean. Portability means rolling the structure into place. This is a not-to-scale project study, not an engineering drawing or certification of ADA compliance. The reference photograph is not published.
7. **Light:** six patterns × six glaze palettes × three forms, with seeded fragments within each combination. Visitors choose a composition, regenerate, share, and save it. The final arch echoes the entrance. Contact remains a normal email link.

The studies cite primary sources: [Sagrada Família's branching columns](https://blog.sagradafamilia.org/en/columns-sagrada-familia-geometry-mechanics-materials-stone-forest/), its [hyperboloid model](https://patrimoni.sagradafamilia.org/en/heritageobject/mus8685-hiperboloide-de-la-facana-de-la-gloria/), and Casa Batlló's [graded blue tiles](https://www.casabatllo.es/en/news/5-surprising-colors-at-casa-batllo/) and [trencadís](https://www.casabatllo.es/en/news/10-interesting-facts-casa-batllo/).

Photo slots and their reading order are maintained in `src/content/making.ts`; see [Adding photographs](photographs.md). No AI-generated artwork is presented as Sean's work.

## Materials, type, and motion

Plaster `#f5efdf`; limestone `#e8ddc7`; marine ink `#203e3d`; deep gallery `#153c3f`; sage `#e2e4d2`; courtyard `#efe1c5`; restrained amber `#9a6e32`. Cormorant Garamond supplies display and true italic cuts; Manrope carries body copy and controls. No system-wide dark mode: color changes are authored chapter transitions.

The page uses one measured SVG inlay, rebuilt when text or disclosures change the document height. It follows the margin and opens into an arch at chapter thresholds. Decorative curves avoid text. The continuous line is an architectural joint; project and courtyard motifs echo it locally. Native scrolling and an accessible chapter index preserve direct navigation.

The lightwell caps device pixel ratio at 1.5 and rendering at approximately 30fps. It loads only above 900px with a fine pointer and hover support. Touch and small-screen visitors retain the entire illustration with a lightweight CSS light drift. This is a capability-based performance decision, not user-agent or audit detection. The GPU animation pauses outside the viewport, on hidden tabs, under reduced motion, and when the desktop media query stops matching. Context loss disposes it while preserving the static architecture. Glaze passes happen when exhibits enter view; Sunny's tail rests between small movements. Motion is never required to read or operate the site.

## Architecture and design refinements

Astro renders semantic HTML and compact SVG geometry. Dense permanent artwork is generated at build time. Canvas 2D is used for PNG export; a second tiled-canvas scene layer proved unnecessary for this amount of geometry and would duplicate the accessible/static composition. Three.js is dynamically imported only for the optional lightwell.

The new branch removes the inherited Scroll presentation components and GSAP/Lenis scripts. They remain recoverable from the parent branch. Canonical content, headshot, switcher, and transitions stay under the existing shared-file contract. H uses a native footer version menu for its own quiet frame; the shared switcher copy stays synchronized for infrastructure consistency.

`scripts/studies.mjs` renders three comparative treatments for Threshold, Works, and Courtyard: daylight/asymmetric, axial/symmetric, and nocturne. The daylight treatment was selected after browser capture: it gives professional text and sculpture independent space, lets the marine gallery provide the strongest color change, and keeps the courtyard personal and warm. The axial study compressed the arch and weakened its relationship to the text; nocturne flattened the chapter-to-chapter color rhythm and reduced the distinction of the Works gallery. Review artifacts are generated locally under `artifacts/studies/`.

## Artifact contract

The `seed` query parameter accepts unsigned 32-bit decimal integers, including zero. Invalid or absent values resolve to `190826`. Together, `seed`, `motif`, `glaze`, and `form` reproduce the same composition. All named choices are allowlisted. Seed-only links preserve the first edition's points and colors. “Lay another mosaic” uses browser cryptographic randomness, always changes the pattern, and picks another glaze/form. It replaces the current URL, explicitly selecting `v=h-gaudi` and retaining unrelated parameters. Sharing adds `#light`; it works for recipients without a preference cookie and does not transmit visitor data.

“Keep this tile” exports a 1200×1400 PNG with title, glaze, form, seed, and site credit. It snapshots the SVG and metadata before asynchronous work, so changing choices during a download cannot change the exported piece. Export waits for fonts and image decoding, disables its button while pending, announces failures, and revokes object URLs. Clipboard failure displays the full share address. No network request is needed to generate or export a study.

## Responsive and accessible behavior

The seven rooms recompose below 760px. The fixed chapter rail gives way to the main and footer navigation. The header links directly to the four collections: Work, Craft, Art, and Service, with an explicit Nexus return control at the upper right. At 540px and below the wordmark and Nexus control share the first row while the four collection links occupy a full second row, retaining large touch targets. Casa Higgins is deliberately absent from the shared version switcher and is discovered through the Nexus instead. Real text is never rasterized for the live page. Decorative SVG is hidden from accessibility APIs; the studies, ramp, and mosaic have meaningful labels. No-JS visitors receive all content, native horizontal scrolling, disclosures, links, static art, and no inert enhancement buttons. Reduced motion retains the same composition. Print CSS expands the carousel into successive drawings.

## Quality record

See `verification.md` for actual checks and known limitations. Browser screenshots and a walkthrough are generated by the repository scripts; they are evidence for composition and behavior, not proof of subjective equivalence to another artist. Production release is separately coordinated: first verify the new Pages origin, then publish routing and entry links.
