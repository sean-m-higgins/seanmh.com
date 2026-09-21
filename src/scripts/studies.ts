import { studyRenderers } from "../lib/studies.mjs";

export function initStudies() {
  const track = document.querySelector<HTMLElement>("#study-track")!;
  const slides = [...track.querySelectorAll<HTMLElement>(".study-slide")];
  const buttons = [
    ...document.querySelectorAll<HTMLButtonElement>("[data-study-go]"),
  ];
  const prev = document.querySelector<HTMLButtonElement>("[data-study-prev]")!;
  const next = document.querySelector<HTMLButtonElement>("[data-study-next]")!;
  const count = document.querySelector<HTMLElement>("#study-count")!;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let active = 0,
    frame = 0;
  function update() {
    active = slides.reduce(
      (best, slide, i) =>
        Math.abs(slide.offsetLeft - track.scrollLeft) <
        Math.abs(slides[best].offsetLeft - track.scrollLeft)
          ? i
          : best,
      0,
    );
    buttons.forEach((button, i) => {
      if (i === active) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });
    prev.disabled = active === 0;
    next.disabled = active === slides.length - 1;
    count.textContent = `${String(active + 1).padStart(2, "0")} / 05`;
    frame = 0;
  }
  function go(index: number, immediate = false) {
    const i = Math.max(0, Math.min(slides.length - 1, index));
    track.scrollTo({
      left: slides[i].offsetLeft,
      behavior: immediate || reduced.matches ? "instant" : "smooth",
    });
  }
  track.addEventListener(
    "scroll",
    () => {
      if (!frame) frame = requestAnimationFrame(update);
    },
    { passive: true },
  );
  buttons.forEach((button, i) => button.addEventListener("click", () => go(i)));
  prev.addEventListener("click", () => go(active - 1));
  next.addEventListener("click", () => go(active + 1));
  track.addEventListener("keydown", (event) => {
    // Inputs keep their own arrow keys. No wheel handler or vertical scroll trap.
    if (event.target !== track) return;
    const destinations: Record<string, number> = {
      ArrowRight: active + 1,
      ArrowLeft: active - 1,
      Home: 0,
      End: slides.length - 1,
    };
    if (event.key in destinations) {
      event.preventDefault();
      go(destinations[event.key]);
    }
  });
  track.addEventListener("focusin", (event) => {
    const slide = (event.target as Element).closest(".study-slide");
    const i = slides.indexOf(slide as HTMLElement);
    if (i !== -1 && i !== active) go(i, true);
  });
  new ResizeObserver(() => {
    go(active, true);
    update();
  }).observe(track);
  update();

  document
    .querySelectorAll<HTMLInputElement>("[data-study-input]")
    .forEach((input) => {
      const id = input.dataset.studyInput as keyof typeof studyRenderers;
      const drawing = document.querySelector<SVGGElement>(
        `[data-study-art="${id}"]`,
      )!;
      const output = document.querySelector<HTMLOutputElement>(
        `[data-study-output="${id}"]`,
      )!;
      let drawFrame = 0;
      input.addEventListener("input", () => {
        output.value = input.value;
        input.setAttribute(
          "aria-valuetext",
          `${input.value} ${input.dataset.unit}`,
        );
        cancelAnimationFrame(drawFrame);
        drawFrame = requestAnimationFrame(() => {
          drawing.innerHTML = studyRenderers[id](Number(input.value));
        });
      });
    });
}
