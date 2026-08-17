import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { onTap } from "./tap";

// Matches scroll-padding-top: 5rem in global.css (fixed nav height)
const NAV_OFFSET = -80;

// gsap.getProperty returns transforms with units ("0px"), so the raw value
// cannot be used in arithmetic — parse it back to a number first.
function transformOffset(el: Element, prop: "x" | "y") {
  return parseFloat(String(gsap.getProperty(el, prop))) || 0;
}

// Gap between a magnetic element's edge and its capture ring.
const RING_PAD = 10;
// How far beyond an element's edge the pointer starts pulling it. Measured to
// the element's rect rather than its centre, so a wide button and a small icon
// both engage at the same visual distance.
const MAGNET_RANGE = 115;
// Lean distance as a fraction of the pointer's offset from centre, at contact.
const MAGNET_PULL = 0.32;
// The ring hangs loose at the edge of range and tightens onto the element as
// the pointer arrives — the "capture" the effect is named for.
const RING_LOOSE = 1.16;

// Name repulsion: how close the pointer must get before a letter leans away,
// and how far it leans at closest approach.
const REPEL_RADIUS = 150;
const REPEL_STRENGTH = 26;
// How long a tapped shove holds before the letters settle back. Just past the
// 0.6s outward tween, so the push lands fully before it reverses.
const REPEL_TAP_HOLD = 650;
// The pinned hero timeline starts scrubbing the letters apart the moment the
// page moves, which invalidates the cached letter positions. Repulsion only
// runs while the hero is still at rest.
const REPEL_MAX_SCROLL = 12;

let lenis: Lenis | null = null;
let rafTick: ((time: number) => void) | null = null;
let heroMedia: gsap.MatchMedia | null = null;
let splits: SplitText[] = [];
let magneticRing: HTMLElement | null = null;
let teardownMagnetic: (() => void) | null = null;
let nameChars: HTMLElement[] = [];
let teardownRepel: (() => void) | null = null;

// Lenis replaces native scrolling, so same-page anchor clicks must be routed
// through it or they jump without the nav offset.
function onAnchorClick(event: MouseEvent) {
  if (!lenis) return;
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  const link = (event.target as Element).closest?.("a[href*='#']");
  if (!(link instanceof HTMLAnchorElement)) return;
  if (link.origin !== location.origin || link.pathname !== location.pathname)
    return;
  const target = link.hash && document.querySelector<HTMLElement>(link.hash);
  if (!target) return;
  event.preventDefault();
  history.pushState(null, "", link.hash);
  lenis.scrollTo(target, { offset: NAV_OFFSET });
}

// Pinned hero scene: the section holds for ~1.4 viewport-heights while scroll
// scrubs the transformation — greeting/title/tagline parallax away at
// different rates, the name's letters spread apart as it settles back, and
// the gradient orbs drift oppositely for depth.
function setupHero() {
  const hero = document.querySelector<HTMLElement>("[data-hero]");
  const name = hero?.querySelector<HTMLElement>("[data-hero-name]");
  if (!hero || !name) return;

  // The CSS intro uses `forwards` fill, which outranks GSAP's inline styles.
  // Await the actual CSS animation so late-loading JS cannot miss animationend.
  hero.querySelectorAll<HTMLElement>(".animate-fade-in").forEach((el) => {
    const animations = el.getAnimations();
    if (animations.length === 0) {
      el.classList.remove("animate-fade-in");
      return;
    }
    void Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
      el.classList.remove("animate-fade-in");
    });
  });

  const heroSplit = new SplitText(name, { type: "words,chars", aria: "auto" });
  splits.push(heroSplit);
  const chars = heroSplit.chars;
  const mid = (chars.length - 1) / 2;

  // The scroll timeline below owns `x` on each char (the spread-apart). Give
  // pointer repulsion its own inner span to translate so the two effects
  // compose through nested transforms instead of overwriting one property.
  // SplitText.revert() restores the original markup, dropping these again.
  nameChars = chars.map((char) => {
    const inner = document.createElement("span");
    inner.style.display = "inline-block";
    inner.style.willChange = "transform";
    while (char.firstChild) inner.appendChild(char.firstChild);
    char.appendChild(inner);
    return inner;
  });

  heroMedia = gsap.matchMedia();

  heroMedia.add("(min-width: 768px)", () => {
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "+=140%",
        pin: true,
        scrub: true,
        anticipatePin: 1,
      },
    });
    // fromTo everywhere the CSS intro touches: .to() would capture start
    // values at first render, which happens while the intro still has these
    // elements at opacity 0.
    const from = { y: 0, autoAlpha: 1 };
    tl.fromTo("[data-hero-cue]", { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.08 }, 0)
      .fromTo("[data-hero-greeting]", from, { y: -60, autoAlpha: 0, duration: 0.3 }, 0)
      .fromTo("[data-hero-cta]", from, { y: -40, autoAlpha: 0, duration: 0.35 }, 0.05)
      .fromTo("[data-hero-title]", from, { y: -70, autoAlpha: 0, duration: 0.3 }, 0.1)
      .fromTo("[data-hero-tagline]", from, { y: -110, autoAlpha: 0, duration: 0.3 }, 0.16)
      .to(chars, { x: (i: number) => (i - mid) * 16, duration: 0.85 }, 0.1)
      .fromTo(name, { scale: 1 }, { scale: 0.94, duration: 0.85 }, 0.1)
      .fromTo(name, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.18 }, 0.82)
      .to("[data-hero-orb-1]", { xPercent: 6, yPercent: 10, duration: 1 }, 0)
      .to("[data-hero-orb-2]", { xPercent: -5, yPercent: -8, duration: 1 }, 0)
      .to("[data-hero-blossom]", { xPercent: 8, yPercent: -16, rotate: 5, duration: 1 }, 0);
  });

  // Small screens: no pin (fixed-position pinning fights mobile browser
  // chrome) — just the cue fade and a gentle orb drift.
  heroMedia.add("(max-width: 767px)", () => {
    gsap.to("[data-hero-cue]", {
      autoAlpha: 0,
      ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "25% top", scrub: true },
    });
    gsap.to("[data-hero-orb-1]", {
      yPercent: 10,
      ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
    });
    gsap.to("[data-hero-orb-2]", {
      yPercent: -8,
      ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
    });
    gsap.to("[data-hero-blossom]", {
      yPercent: -16,
      ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
    });
  });
}

// Section choreography: reveals as content enters the viewport — reversible,
// so they re-hide (and replay) when scrolled back above — plus the Experience
// rail that draws with scroll. Initial hidden states are applied here in JS so
// no-JS visitors see everything.
function setupSections() {
  const reveal = { duration: 0.7, ease: "power2.out" } as const;

  // Section headings: text masks up, accent rule draws left→right.
  document.querySelectorAll<HTMLElement>("[data-sh]").forEach((h) => {
    const tl = gsap.timeline({
      scrollTrigger: { trigger: h, start: "top 85%", toggleActions: "play none none reverse" },
    });
    const text = h.querySelector("[data-sh-text]");
    const rule = h.querySelector("[data-sh-rule]");
    if (text) tl.fromTo(text, { yPercent: 110 }, { yPercent: 0, ...reveal }, 0);
    if (rule)
      tl.fromTo(
        rule,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.6, ease: "power2.out", transformOrigin: "0 50%" },
        0.15
      );
  });

  // About: headshot wipes in and drifts gently; copy reveals line by line.
  const photo = document.querySelector<HTMLElement>("[data-about-photo]");
  if (photo) {
    gsap.fromTo(
      photo,
      { clipPath: "inset(0 100% 0 0)" },
      {
        clipPath: "inset(0 0% 0 0)",
        duration: 0.9,
        ease: "power2.inOut",
        scrollTrigger: { trigger: photo, start: "top 80%", toggleActions: "play none none reverse" },
      }
    );
    gsap.to(photo, {
      y: -16,
      ease: "none",
      scrollTrigger: { trigger: "#about", start: "top bottom", end: "bottom top", scrub: true },
    });
  }
  const copy = document.querySelector<HTMLElement>("[data-about-copy]");
  if (copy) {
    splits.push(
      SplitText.create(copy, {
        type: "lines",
        mask: "lines",
        autoSplit: true,
        onSplit: (self) =>
          gsap.fromTo(
            self.lines,
            { yPercent: 110 },
            {
              yPercent: 0,
              stagger: 0.08,
              ...reveal,
              scrollTrigger: { trigger: copy, start: "top 80%", toggleActions: "play none none reverse" },
            }
          ),
      })
    );
  }

  // Experience: each rail segment draws with scroll; dots pop and content
  // rises once as items enter.
  document.querySelectorAll<HTMLElement>("[data-exp-item]").forEach((item) => {
    const line = item.querySelector("[data-exp-line]");
    const dot = item.querySelector("[data-exp-dot]");
    const content = item.querySelector("[data-exp-content]");
    if (line)
      gsap.fromTo(
        line,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          transformOrigin: "50% 0",
          scrollTrigger: { trigger: item, start: "top 80%", end: "bottom 65%", scrub: true },
        }
      );
    if (dot)
      gsap.fromTo(
        dot,
        { scale: 0 },
        {
          scale: 1,
          duration: 0.5,
          ease: "back.out(1.7)",
          scrollTrigger: { trigger: item, start: "top 85%", toggleActions: "play none none reverse" },
        }
      );
    if (content)
      gsap.fromTo(
        content,
        { y: 24, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          ...reveal,
          scrollTrigger: { trigger: item, start: "top 85%", toggleActions: "play none none reverse" },
        }
      );
  });

  // Currently panel: rises in as one beat.
  const currently = document.querySelector<HTMLElement>("[data-currently]");
  if (currently)
    gsap.fromTo(
      currently,
      { y: 24, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        ...reveal,
        scrollTrigger: { trigger: currently, start: "top 85%", toggleActions: "play none none reverse" },
      }
    );

  // Art gallery: each piece slides in from its side and settles into its
  // resting tilt (the CSS class already sets the resting rotation, so the
  // entrance only needs to add extra distance/rotation to unwind from).
  document.querySelectorAll<HTMLElement>("[data-art]").forEach((art, i) => {
    const fromLeft = art.dataset.artSide === "left";
    gsap.fromTo(
      art,
      { x: fromLeft ? -60 : 60, autoAlpha: 0, rotate: fromLeft ? -14 : 14 },
      {
        x: 0,
        autoAlpha: 1,
        rotate: 0,
        duration: 0.8,
        delay: i * 0.12,
        ease: "power2.out",
        scrollTrigger: { trigger: art, start: "top 90%", toggleActions: "play none none reverse" },
      }
    );
  });
  const tablePhoto = document.querySelector<HTMLElement>("[data-table-photo]");
  if (tablePhoto)
    gsap.fromTo(
      tablePhoto,
      { y: 24, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        ...reveal,
        scrollTrigger: { trigger: tablePhoto, start: "top 90%", toggleActions: "play none none reverse" },
      }
    );
  const sunny = document.querySelector<HTMLElement>("[data-sunny]");
  if (sunny)
    gsap.fromTo(
      sunny,
      { scale: 0.6, autoAlpha: 0, rotate: -8 },
      {
        scale: 1,
        autoAlpha: 1,
        rotate: 1,
        duration: 0.6,
        delay: 0.35,
        ease: "back.out(1.6)",
        scrollTrigger: { trigger: tablePhoto ?? sunny, start: "top 90%", toggleActions: "play none none reverse" },
      }
    );

  // Photo accents scattered through the page (flowers, lounging Sunny): each
  // settles onto its perch as it enters view. Any resting tilt comes from a
  // CSS rotate class, which composes with these transforms rather than
  // fighting them.
  document.querySelectorAll<HTMLElement>("[data-bloom]").forEach((el) => {
    gsap.fromTo(
      el,
      { scale: 0.75, autoAlpha: 0, y: 14 },
      {
        scale: 1,
        autoAlpha: 1,
        y: 0,
        duration: 0.7,
        ease: "back.out(1.4)",
        scrollTrigger: { trigger: el, start: "top 92%", toggleActions: "play none none reverse" },
      }
    );
  });

  // Highlights: staggered rise, a beat apart so the number leads the eye.
  const highlights = gsap.utils.toArray<HTMLElement>("[data-highlight]");
  if (highlights.length)
    gsap.fromTo(
      highlights,
      { y: 20, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 0.6,
        ease: "power2.out",
        stagger: 0.08,
        scrollTrigger: { trigger: highlights[0].closest("section"), start: "top 75%", toggleActions: "play none none reverse" },
      }
    );

  // Quotes: handwritten-note interstitials tucked into the dead space between
  // sections; each reveals independently (rotation stays from CSS).
  document.querySelectorAll<HTMLElement>("[data-quote]").forEach((q) => {
    gsap.fromTo(
      q,
      { y: 24, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        ...reveal,
        scrollTrigger: { trigger: q, start: "top 92%", toggleActions: "play none none reverse" },
      }
    );
  });

  // Boxing glove throws a jab when the hobbies line scrolls in, and again on
  // hover — a nod to "boxing ring" without needing a photo.
  const boxing = document.querySelector<HTMLElement>("[data-boxing]");
  const glove = boxing?.querySelector<HTMLElement>("[data-glove]");
  if (boxing && glove) {
    const jab = () =>
      gsap
        .timeline()
        .to(glove, { x: 9, rotate: -24, scale: 1.3, duration: 0.1, ease: "power2.out" })
        .to(glove, { x: 0, rotate: 0, scale: 1, duration: 0.55, ease: "elastic.out(1, 0.45)" });
    ScrollTrigger.create({ trigger: boxing, start: "top 85%", onEnter: jab, onEnterBack: jab });
    boxing.addEventListener("mouseenter", jab);
  }

  // Sunny beside the Contact heading slides + settles in on scroll.
  const sunnyCute = document.querySelector<HTMLElement>("[data-sunny-cute]");
  if (sunnyCute)
    gsap.fromTo(
      sunnyCute,
      { x: 40, autoAlpha: 0, rotate: -6 },
      {
        x: 0,
        autoAlpha: 1,
        rotate: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: { trigger: sunnyCute, start: "top 90%", toggleActions: "play none none reverse" },
      }
    );

  // Contact: the oversized line masks up like the headings.
  const contactLine = document.querySelector<HTMLElement>("[data-contact-line]");
  if (contactLine)
    gsap.fromTo(
      contactLine,
      { yPercent: 110 },
      {
        yPercent: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: { trigger: contactLine, start: "top 88%", toggleActions: "play none none reverse" },
      }
    );
}

// The hero name's letters lean away from the pointer and settle back. Runs
// only while the hero sits at the top of the page — past that the pinned
// timeline is scrubbing the same letters and owns their layout.
function setupNameRepel() {
  const hero = document.querySelector<HTMLElement>("[data-hero]");
  if (!hero || nameChars.length === 0) return;
  const hasHoverPointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const letters = nameChars.map((el) => ({
    el,
    xTo: gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" }),
    yTo: gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" }),
    cx: 0,
    cy: 0,
  }));

  // Letter centres are cached so pointermove never reads layout. The cache is
  // dropped whenever anything that could move them happens, and rebuilt
  // lazily on the next pointer event.
  let cached = false;
  function cache() {
    for (const letter of letters) {
      const offsetX = transformOffset(letter.el, "x");
      const offsetY = transformOffset(letter.el, "y");
      const r = letter.el.getBoundingClientRect();
      letter.cx = r.left - offsetX + r.width / 2;
      letter.cy = r.top - offsetY + r.height / 2;
    }
    cached = true;
  }

  let engaged = false;
  function release() {
    if (!engaged) return;
    engaged = false;
    for (const letter of letters) {
      letter.xTo(0);
      letter.yTo(0);
    }
  }

  function invalidate() {
    cached = false;
  }

  function onScroll() {
    invalidate();
    if (window.scrollY >= REPEL_MAX_SCROLL) release();
  }

  function push(x: number, y: number) {
    if (window.scrollY >= REPEL_MAX_SCROLL) {
      release();
      return;
    }
    if (!cached) cache();
    engaged = true;
    for (const letter of letters) {
      const dx = letter.cx - x;
      const dy = letter.cy - y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      if (d > REPEL_RADIUS) {
        letter.xTo(0);
        letter.yTo(0);
        continue;
      }
      const falloff = 1 - d / REPEL_RADIUS;
      letter.xTo((dx / d) * falloff * REPEL_STRENGTH);
      letter.yTo((dy / d) * falloff * REPEL_STRENGTH);
    }
  }

  function onMove(e: PointerEvent) {
    push(e.clientX, e.clientY);
  }

  let teardownTap: (() => void) | null = null;
  let settleTimer = 0;

  if (hasHoverPointer) {
    hero.addEventListener("pointermove", onMove, { passive: true });
    hero.addEventListener("pointerleave", release);
  } else {
    // No hover to lean away from on touch, so a tap plays the whole gesture:
    // the letters shove away from it and settle back on their own once the
    // outward tween has had time to land.
    teardownTap = onTap(hero, (x, y) => {
      push(x, y);
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(release, REPEL_TAP_HOLD);
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", invalidate, { passive: true });

  teardownRepel = () => {
    window.clearTimeout(settleTimer);
    teardownTap?.();
    hero.removeEventListener("pointermove", onMove);
    hero.removeEventListener("pointerleave", release);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", invalidate);
  };
}

// Magnetic elements — pointer devices only. Attraction is a proximity field,
// not a hover state: the nearest tagged element within MAGNET_RANGE leans
// toward the pointer and its capture ring fades in and tightens as the pointer
// closes, so the pull is already underway before the cursor arrives.
//
// The pointer handler only stores coordinates; all measurement and animation
// happens once per frame on the ticker GSAP is already running for Lenis.
function setupMagnetic() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const els = Array.from(document.querySelectorAll<HTMLElement>("[data-magnetic]"));
  if (els.length === 0) return;

  // One shared ring: only one element can be the nearest at a time.
  const ring = document.createElement("div");
  ring.className = "magnetic-ring";
  ring.setAttribute("aria-hidden", "true");
  document.body.appendChild(ring);
  magneticRing = ring;

  const items = els.map((el) => ({
    el,
    xTo: gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" }),
    yTo: gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" }),
    // Corner radius never changes, so it is read once rather than per measure.
    radius: parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0,
    // Resting geometry in document coordinates, so it survives scrolling.
    docX: 0,
    docY: 0,
    w: 0,
    h: 0,
    visible: true,
  }));

  let px = -99999;
  let py = -99999;
  let dirty = true;
  let active: (typeof items)[number] | null = null;

  // The only layout reads in the whole effect. Reading is driven by the frame
  // loop rather than the pointer event, so a burst of pointermoves still costs
  // at most one measure per frame; when nothing moves it costs nothing.
  // Transform offsets are subtracted so an element that is currently leaning
  // still reports where it rests.
  function measure() {
    dirty = false;
    for (const item of items) {
      const r = item.el.getBoundingClientRect();
      item.docX = r.left + window.scrollX - transformOffset(item.el, "x");
      item.docY = r.top + window.scrollY - transformOffset(item.el, "y");
      item.w = r.width;
      item.h = r.height;
      // Skips elements the hero timeline has faded out from under the pointer.
      item.visible = item.el.checkVisibility
        ? item.el.checkVisibility({ opacityProperty: true, visibilityProperty: true })
        : true;
    }
  }

  function frame() {
    if (dirty) measure();
    const scrollLeft = window.scrollX;
    const scrollTop = window.scrollY;

    let nearest: (typeof items)[number] | null = null;
    let nearestDist = Infinity;
    for (const item of items) {
      if (!item.visible || item.w === 0) continue;
      const left = item.docX - scrollLeft;
      const top = item.docY - scrollTop;
      // Distance from the pointer to the rect itself — zero once inside it.
      const gapX = Math.max(left - px, 0, px - (left + item.w));
      const gapY = Math.max(top - py, 0, py - (top + item.h));
      const dist = Math.sqrt(gapX * gapX + gapY * gapY);
      if (dist < MAGNET_RANGE && dist < nearestDist) {
        nearest = item;
        nearestDist = dist;
      }
    }

    if (nearest !== active) {
      const previous = active;
      active = nearest;
      previous?.xTo(0);
      previous?.yTo(0);
      if (active) {
        // Size is layout, not transform, so it is written only on handover.
        gsap.set(ring, {
          width: active.w + RING_PAD * 2,
          height: active.h + RING_PAD * 2,
          borderRadius: active.radius + RING_PAD,
        });
      } else {
        gsap.to(ring, { opacity: 0, duration: 0.25, ease: "power2.out" });
      }
    }

    if (!active) return;

    const left = active.docX - scrollLeft;
    const top = active.docY - scrollTop;
    const pull = 1 - nearestDist / MAGNET_RANGE;

    // The element eases toward the pointer on its own tween.
    active.xTo((px - (left + active.w / 2)) * MAGNET_PULL * pull);
    active.yTo((py - (top + active.h / 2)) * MAGNET_PULL * pull);

    // The ring is then placed on the element's *rendered* lean rather than its
    // target, so it sits in lockstep instead of racing the element with a
    // second tween. Everything the ring animates is written in one set() call:
    // mixing set() with quickTo on the same transform silently drops whichever
    // property the other one owns.
    gsap.set(ring, {
      x: active.docX - RING_PAD + transformOffset(active.el, "x"),
      y: active.docY - RING_PAD + transformOffset(active.el, "y"),
      // Hangs loose at the edge of range, tight on arrival.
      scale: RING_LOOSE - (RING_LOOSE - 1) * pull,
      // Reaches full opacity just before contact, so it is settled by the
      // time the pointer lands.
      opacity: Math.min(1, pull * 1.7),
    });
  }

  function onPointerMove(e: PointerEvent) {
    px = e.clientX;
    py = e.clientY;
    // Geometry must be re-read on movement too, not just scroll/resize: the
    // first measure happens while the hero's intro is still animating, when
    // the CTA is at opacity 0 and reads as invisible. Without this the effect
    // stays permanently disabled on any element that faded in after load.
    dirty = true;
  }
  function onPointerOut() {
    px = -99999;
    py = -99999;
  }
  function invalidate() {
    dirty = true;
  }

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerleave", onPointerOut, { passive: true });
  window.addEventListener("scroll", invalidate, { passive: true });
  window.addEventListener("resize", invalidate, { passive: true });
  gsap.ticker.add(frame);

  teardownMagnetic = () => {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerleave", onPointerOut);
    window.removeEventListener("scroll", invalidate);
    window.removeEventListener("resize", invalidate);
    gsap.ticker.remove(frame);
  };
}

export function initScroll() {
  // Idempotent: astro:page-load fires after the module's initial call too.
  if (lenis) return;
  // Hard off-switch: reduced motion gets 100% native scrolling, no effects.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  gsap.registerPlugin(ScrollTrigger, SplitText);

  lenis = new Lenis({ autoRaf: false });
  lenis.on("scroll", ScrollTrigger.update);
  rafTick = (time) => lenis?.raf(time * 1000);
  gsap.ticker.add(rafTick);
  gsap.ticker.lagSmoothing(0);

  document.addEventListener("click", onAnchorClick);

  gsap.to("#scroll-progress", {
    scaleX: 1,
    ease: "none",
    scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
  });

  setupHero();
  setupSections();
  setupMagnetic();
  setupNameRepel(); // after setupHero — depends on its split
}

export function destroyScroll() {
  if (!lenis) return;
  document.removeEventListener("click", onAnchorClick);
  teardownRepel?.();
  teardownRepel = null;
  teardownMagnetic?.();
  teardownMagnetic = null;
  magneticRing?.remove();
  magneticRing = null;
  heroMedia?.revert();
  heroMedia = null;
  // revert() restores the pre-split markup, which discards the inner spans
  // setupHero added, so the cached references must go with it.
  splits.forEach((s) => s.revert());
  splits = [];
  nameChars = [];
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  if (rafTick) gsap.ticker.remove(rafTick);
  rafTick = null;
  lenis.destroy();
  lenis = null;
  gsap.set("#scroll-progress", { scaleX: 0 });
}
