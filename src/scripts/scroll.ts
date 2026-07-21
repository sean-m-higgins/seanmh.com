import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

// Matches scroll-padding-top: 5rem in global.css (fixed nav height)
const NAV_OFFSET = -80;

let lenis: Lenis | null = null;
let rafTick: ((time: number) => void) | null = null;
let heroMedia: gsap.MatchMedia | null = null;
let splits: SplitText[] = [];

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

  // The CSS intro uses `forwards` fill, which outranks GSAP's inline styles,
  // and .animate-fade-in itself sets opacity: 0 — so drop the class once each
  // intro lands (with .vt-arrived the 0s animations end immediately).
  hero.querySelectorAll<HTMLElement>(".animate-fade-in").forEach((el) => {
    el.addEventListener(
      "animationend",
      () => el.classList.remove("animate-fade-in"),
      { once: true }
    );
  });

  const heroSplit = new SplitText(name, { type: "words,chars", aria: "auto" });
  splits.push(heroSplit);
  const chars = heroSplit.chars;
  const mid = (chars.length - 1) / 2;

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
      .to("[data-hero-orb-2]", { xPercent: -5, yPercent: -8, duration: 1 }, 0);
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
      SplitText.create(copy.querySelectorAll("p"), {
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
        scrollTrigger: { trigger: q, start: "top 85%", toggleActions: "play none none reverse" },
      }
    );
  });

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

// Magnetic hover for tagged buttons — pointer devices only.
function setupMagnetic() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
    const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
    });
    el.addEventListener("pointerleave", () => {
      xTo(0);
      yTo(0);
    });
  });
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
}

export function destroyScroll() {
  if (!lenis) return;
  document.removeEventListener("click", onAnchorClick);
  heroMedia?.revert();
  heroMedia = null;
  splits.forEach((s) => s.revert());
  splits = [];
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  if (rafTick) gsap.ticker.remove(rafTick);
  rafTick = null;
  lenis.destroy();
  lenis = null;
  gsap.set("#scroll-progress", { scaleX: 0 });
}
