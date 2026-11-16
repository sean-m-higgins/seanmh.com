---
name: site-craft
description: Universal craft rules for seanmh.com UI work — motion curves and reduced motion, interaction states, accessibility, copy realism, and the ship checklist. Use whenever building, editing, styling, animating, or reviewing any page, section, component, game UI, or version of seanmh.com, even when the request does not mention design. Does not set a visual style; each version keeps its own.
---

# Site craft

seanmh.com is a museum of deliberately different versions: a scroll essay, a
terminal, a Gaudí house, two arcade games, a 3D portal, a systems map, a travel
atlas. **This skill never decides how a version looks.** Typography, palette,
layout, and personality come from the version itself and from `.inspiration`
(read it before design work and cite the entry a decision echoes).

What this skill does decide is the craft floor every version must clear.

## 1. Before you design

- Read the branch's `AGENTS.md`, its wiki page, and `.inspiration`.
- Find the version's existing tokens (CSS custom properties, Tailwind theme,
  `tuning.ts`, design docs) and reuse them. A new value needs a reason.
- Show, don't describe. When matching a reference, break down what it does
  (pacing, where the first motion lands, how text enters, when the payoff
  hits) and work from that spec, not from adjectives.
- Change one section at a time. Never rebuild a whole page per iteration.

## 2. Motion

Read the `motion-design` skill for timing, easing, and choreography decisions.
The floor:

- **One personality per version, stated once.** Record its signature curve and
  three durations (quick / standard / slow) in the version's CSS or design doc
  and use them everywhere in that version.
- **Default when a version has none:** `cubic-bezier(0.22, 1, 0.36, 1)` at
  500ms for position and layout, 200–300ms for colour and opacity on hover.
- Never ship a browser default curve (`ease`, `linear`, `ease-in-out`) for
  spatial movement. Linear is for spinners, progress, and scrubbed timelines.
- Animate `transform` and `opacity`. Do not animate `top`, `left`, `width`,
  or `height`.
- Scroll reveals use `IntersectionObserver`, GSAP ScrollTrigger, or a scroll
  handler throttled through `requestAnimationFrame`. Never an unthrottled
  `scroll` listener. Reveal once; do not replay on scroll back up.
- Staggers stay under 500ms total, however long the list.
- **`prefers-reduced-motion: reduce`** replaces movement with a plain opacity
  change or no change, and stops ambient loops. WebGL scenes render a still
  frame. Test it; do not assume it.
- Deterministic animation (films, canvases that render to video) takes time
  from the frame index, never from `requestAnimationFrame` or `Date.now()`.

## 3. Interaction states

Every interactive element ships all of them:

- **Hover** — background shift, slight scale, or translate
- **Active** — `scale(0.98)` or `translateY(1px)`
- **Focus** — a visible `:focus-visible` ring with at least 3:1 contrast
- **Loading** — a skeleton shaped like the real layout, not a bare spinner
- **Empty** — a composed view, never a blank panel
- **Error** — inline and specific; never `window.alert()`
- **Disabled** — visibly disabled; no link points at `#`

Games and canvases also need: a keyboard path, a pause or quiet state, and a
visible way out back to the rest of the site.

## 4. Layout and type

- Headings use `text-wrap: balance`; body copy uses `text-wrap: pretty`.
- On Tailwind branches, new sizes use the default type and spacing scales.
  Do not add arbitrary values (`text-[19px]`, `mt-[13px]`) without a reason.
- Nested radii: when a shape sits inside another with a gap under 32px,
  `inner radius = outer radius − gap` (skip when the result is 2px or less).
- Borders go all the way round a card or not at all.
- Check 375px, 768px, and 1440px widths. No horizontal scroll at 375px.
- Long hero lines break where the thought breaks, not where the box ends.

## 5. Copy

- Real copy only: no lorem ipsum, no "Your headline here".
- Specific beats vague. "Built a 4×8 ft coffee table from rough walnut" beats
  "crafted beautiful furniture".
- Do not write: revolutionize, supercharge, cutting edge, effortless,
  seamless, transform your workflow, next level, harness the power,
  world class.
- Facts about Sean (dates, employers, projects, places) come from
  `src/content/*.ts` or from Sean. Never invent them.
- System messages are calm and specific: "Score saved", "Couldn't reach the
  leaderboard. Your best is kept on this device." No exclamation marks.

## 6. Ship checklist

Before calling a page done:

- [ ] `<title>`, meta description, canonical URL, `og:image`, social tags
- [ ] One `<h1>`; semantic `<nav>`, `<main>`, `<section>`, `<article>`
- [ ] Skip-to-content link for keyboard users
- [ ] Alt text on every meaningful image; `alt=""` on decorative ones
- [ ] Colour contrast ≥ 4.5:1 for body text, 3:1 for large text and UI
- [ ] Works without JavaScript (content readable, links work)
- [ ] Reduced motion honoured
- [ ] No console errors or failed requests
- [ ] Version switcher present and the way back to other versions works
- [ ] Favicon and a branded 404 on any page a visitor can land on
- [ ] `noindex` on Pages origins and unpublished drafts; indexed pages in the
      sitemap

Then run the `verify-version` skill.

---

Adapted from a community `landing-page-design` skill (itself drawing on
[taste-skill](https://github.com/Leonxlnx/taste-skill), MIT). Its landing-page
structure, font bans, and fixed palettes were left out on purpose: they would
flatten the differences between versions that this site exists to show.
