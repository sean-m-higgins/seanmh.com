# Verification record

Implementation dates: September 19–21, 2026. Local edition; not deployed.

## Nexus return and discovery posture — September 21

- Replaced the ambiguous upper-right edition mark with an explicit “Nexus” return control. It remains visible on phone layouts, sharing the first masthead row with the wordmark while collection navigation occupies the second.
- Removed Casa Higgins from every shared version-switcher copy. H remains directly routable for Nexus entry, permalinks, and local testing, but its public discovery point is the Nexus portal.
- The final checkpoint verification and publication record is below.

## Ramp alignment and platform openings — September 21

- Applied Sean's geometry clarification: the ramp and square landing share their right edge when facing uphill, with the additional platform width extending left. Shifted the landing's deck, seams, edge face, wheels, and shadow together.
- Removed the left platform railing and its extra entrance-corner post. Only the far and right platform edges have railings; the entrance remains open. The right-hand rail uses the existing shared ramp post.
- All thirteen unit tests pass, including new checks for the shared right edge, square proportions, and the two exact platform railing locations. Astro check reports zero errors, warnings, or hints; production build passes with the existing optional Three.js chunk-size advisory.
- Chromium and WebKit checks pass at 360, 540, 768, and 1440px with no page errors or automated WCAG A/AA violations. Desktop and phone screenshots were visually reviewed. Browser launch required the approved outside-sandbox retry. Report: `artifacts/service-verification.json`.
- The supplied photo is unchanged. No commit or deployment was performed.

## Collection navigation and reference-informed ramp — September 21

- Changed Growth's progression captions to “The freshman piece,” “The sophomore piece,” “The junior piece,” and “The senior piece.”
- Header navigation now links Work, Craft, Art, and Service to their respective sections. Phone layouts place all four links in a second row beneath the wordmark.
- Inspected the supplied `tmp-eagle-scout-ramp.jpeg` and replaced the generic ramp illustration with an original axonometric SVG: long metal deck, traction strips, timber posts, dark handrails, a wheeled base, and a large square upper platform. The illustration is labelled not to scale; no dimensions or compliance claims were inferred. The photograph remains an untouched, unpublished reference.
- Astro check and production build pass. All eleven unit tests pass, including semantic ramp parts, deterministic output, and projected drawing bounds. The existing optional Three.js chunk-size advisory remains.
- Chromium and WebKit pass caption, navigation target, masthead fit, drawing content, and page-width checks at 360, 540, 768, and 1440px. Whole-page automated WCAG A/AA checks report no violations, and neither browser reports page errors. Desktop and phone drawings and phone navigation were visually reviewed. Report: `artifacts/service-verification.json`.
- No commit or deployment was performed. Earlier Lighthouse scores below were not remeasured for this update.

## Canvas frames and woodworking photographs — September 21

- Replaced the seven ornamental picture frames and wide mats with simple rectangular canvas floater borders. Sunny and the room's arrangement remain intact.
- Added the four supplied woodworking photographs in filename order: Side table, Shoe rack, Desk, Coffee table. Full image proportions are retained, including landscape compositions; descriptive alt text accompanies each photograph.
- Preserved camera originals in `incoming/` and added `/incoming/` to `.gitignore`. Verified all four originals are ignored. Processed WebP sources live in `src/assets/images/woodworking/`: 1600px maximum long edge, oriented pixels, no EXIF/GPS/XMP/IPTC metadata. Total source size reduced from 13.23MB to 1.89MB (86%).
- Astro produces responsive AVIF (quality 55) and WebP (quality 80) versions at 240, 400, 640, and 960px. Images are lazy-loaded with intrinsic dimensions. The originals are not copied into the build.
- Typecheck and production build pass; ten unit tests pass, including four photo format/dimension/privacy checks. The existing optional Three.js chunk-size advisory remains.
- Chromium and WebKit both pass photo loading, ordering, alt text, full-aspect display, seven-frame spacing, and page-width overflow checks at 360, 768, and 1440px. The two changed sections have no automated WCAG A/AA violations or page errors. Screenshots were visually reviewed. Report: `artifacts/photos-verification.json`.
- The preview had stopped during the pause; it was restarted before the final browser run. No production deployment or commit was performed. Earlier Lighthouse scores below predate these photographs and were not remeasured for this update.

## Collection revision — September 20

- Refocused H on software, four ordered woodworking projects, seven art frames around Sunny, and a dedicated Eagle Scout wheelchair-ramp project. Removed the rendered career/education timeline and repeated biography. Photo placeholders remain clearly labelled; titles, materials, dates, and project photographs have not been invented.
- Added five native-scroll carousel studies, each with a working range input: catenary, branching, ruled surface, graded lightwell, and trencadís. Individual drawings and phone/tablet/desktop compositions were visually reviewed.
- Expanded the ceramic generator to six patterns, six glaze palettes, and three shapes. Six unit tests pass, including all 108 deterministic combinations, legacy seed-only URLs, validated options, and both control limits of all five studies.
- Final Astro check: 27 files, zero errors/warnings/hints. Production build passes; the existing optional Three.js chunk-size advisory remains.
- Chromium and WebKit both pass all five keyboard-controlled studies, carousel Home/Arrow navigation without vertical displacement, collection counts, mosaic choice/seed reload, PNG export with choice-specific filenames, no-JS, reduced-motion, unavailable-WebGL, and touch GPU-deferral checks. Clipboard sharing verified in Chromium. No page errors or WCAG A/AA automated violations in either engine.
- No page-width overflow at 360, 720, 768, or 1920px. A separate geometry check confirms the seven frames do not overlap at 360, 768, or 1440px; native horizontal carousel scrolling works with JavaScript disabled.
- The first automated study checks sampled before animation-frame updates on this host. Replaced fixed 50ms sleeps with assertions polling actual drawing changes. Standalone event diagnostics confirmed each control updated correctly. Whole-section screenshot capture could disturb the horizontal scroll position; individual-study screenshots now capture the intended study directly.
- Lighthouse caught a best-practice ARIA role mismatch (`article` overridden to `group`) beyond the WCAG-tagged scan. Changed slide wrappers to correctly named `div` groups and reran the audit.
- Final Lighthouse 12.8.2, production preview, simulated mobile: **Performance 97 / Accessibility 100 / Best practices 100 / SEO 100**. FCP 2.1s; LCP 2.1s; total blocking time 0ms; CLS 0.025; speed index 2.1s. Local lab result, not field data. Raw report: `artifacts/lighthouse-revision.json`.
- Updated the social image, seven-room walkthrough, design notes, photograph-entry guide, and local wiki. New photo content lives in `src/content/making.ts`. No deployment or commit was performed.

## First-edition baseline

- Initial H typecheck and production build passed with zero type errors or warnings.
- Three geometry/seed/URL unit tests passed.
- Main Worker suite: 30 tests passed, including H selection, seed preservation, cookie-based assets, and switching back.
- Shared-file checker passed across six presentation branches.
- Initial Chromium review: no page errors or WCAG A/AA axe violations; no horizontal overflow at 360, 768, or 1920px; chain keyboard input changed the curve; a generated seed reproduced after reload; PNG download completed; no-JS and WebGL-unavailable content remained usable; reduced motion hid the light canvas.

## Visual revision log

- Corrected the grain filter so noise is clipped to stone instead of forming a visible rectangle around the portal.
- Reduced page grain strength, added bench grain and architectural linework, and gave Sunny a restrained tail movement.
- Turned the straight margin inlay into a continuous path with arch-shaped joints at chapter thresholds.
- Added the actual italic font face rather than relying on synthetic italics.
- Updated compatible inherited dependencies and pinned a supported Node 22 maintenance release for H.

## First-edition build and performance

- All nine affected presentation worktrees passed their typechecks and production builds. Nexus retains three pre-existing informational hints. Several Three.js builds, including H's optional desktop lightwell, report the standard large-chunk warning.
- Final H check: zero errors, warnings, or hints. Production dependency audit: zero vulnerabilities (`npm audit --omit=dev`, September 20).
- Lighthouse 12.8.2, local production preview, default simulated mobile throttling, Chrome headless on macOS: **Performance 96 / Accessibility 100 / Best practices 100 / SEO 100**. FCP 2.0s; LCP 2.0s; total blocking time 0ms; CLS 0.025; speed index 3.8s. These are lab measurements, not production field data.
- The initial mobile audit measured 10.2s blocking time during optional GPU startup. Limiting WebGL to desktop hover/fine-pointer capability and retaining a CSS light drift on touch/small screens removed the measured blocking. No audit or user-agent detection is used.
- Mosaic geometry coordinates were rounded to subpixel precision, reducing static HTML from roughly 439KB to 337KB before compression without changing the visible composition.
- Artifact URLs now explicitly select H, so recipients without a preference cookie receive the correct edition.

## Browser evidence and limitations

Chromium and WebKit passed automated accessibility, keyboard chain input, seed reload, PNG export, no-JS, reduced-motion, and unavailable-WebGL checks. Final output includes phone, tablet, desktop, and 720px reflow screenshots; 720px represents the layout space of a 1440px viewport at 200% browser zoom, not a claim of physical-device zoom testing. The follow-up suite also verifies touch input never downloads the optional GPU bundle.

Firefox 155 / Playwright build 1543 could not launch on this host: it exits with “Could not find profile folder” before any page loads. Three launch strategies were tried: default temporary profile, `/private/tmp`, and an explicitly created workspace profile. Firefox compatibility is **unverified**, not failed or passed. The harness supports rerunning it on a working host and records engine launch failures separately.

Real iOS/Android hardware, production edge delivery, field Core Web Vitals, and an assistive-technology user review have not been performed. Automated accessibility checks do not substitute for that review.

## Deliverables and visual decisions

- `artifacts/studies/`: nine screenshots comparing daylight, axial, and nocturne treatments for the entrance, work gallery, and courtyard. Daylight selected for silhouette, readable hierarchy, and stronger room-to-room contrast.
- `artifacts/`: per-engine screenshots, exported mosaic PNGs, raw JSON verification reports, the mobile Lighthouse report, and `walkthrough.webm`.
- `public/gaudi-social.png`: generated from the actual architectural entrance, 1200×630.
- Existing Scroll presentation code was removed only from H; it remains recoverable in the parent branch. Existing unrelated files, including `.inspiration` and the US atlas plan on main, were preserved.

No commit, push, Pages provisioning, Worker deployment, or production publication has been performed. Wiki edits are in the local wiki checkout. Release order is documented in the wiki; the current default remains Scroll.
