import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

// Matches scroll-padding-top: 5rem in global.css (fixed nav height)
const NAV_OFFSET = -80;

let lenis: Lenis | null = null;
let rafTick: ((time: number) => void) | null = null;
let heroMedia: gsap.MatchMedia | null = null;
let heroSplit: SplitText | null = null;

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

  heroSplit = new SplitText(name, { type: "words,chars", aria: "auto" });
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
}

export function destroyScroll() {
  if (!lenis) return;
  document.removeEventListener("click", onAnchorClick);
  heroMedia?.revert();
  heroMedia = null;
  heroSplit?.revert();
  heroSplit = null;
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  if (rafTick) gsap.ticker.remove(rafTick);
  rafTick = null;
  lenis.destroy();
  lenis = null;
  gsap.set("#scroll-progress", { scaleX: 0 });
}
