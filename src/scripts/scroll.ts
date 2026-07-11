import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Matches scroll-padding-top: 5rem in global.css (fixed nav height)
const NAV_OFFSET = -80;

let lenis: Lenis | null = null;
let rafTick: ((time: number) => void) | null = null;

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

export function initScroll() {
  // Idempotent: astro:page-load fires after the module's initial call too.
  if (lenis) return;
  // Hard off-switch: reduced motion gets 100% native scrolling, no effects.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  gsap.registerPlugin(ScrollTrigger);

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
}

export function destroyScroll() {
  if (!lenis) return;
  document.removeEventListener("click", onAnchorClick);
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  if (rafTick) gsap.ticker.remove(rafTick);
  rafTick = null;
  lenis.destroy();
  lenis = null;
  gsap.set("#scroll-progress", { scaleX: 0 });
}
