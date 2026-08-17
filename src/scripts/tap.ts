// Touch has no hover, so the pointer effects need a different trigger there.
// A press on its own is not it: on touch every scroll swipe opens with a
// pointerdown, and firing on that rippled the field each time someone tried to
// scroll the page — the reason those effects were gated to fine pointers in
// the first place. A tap is the press that ends near where it started, soon
// enough that it was never a drag.

const TAP_MS = 500;
const TAP_SLOP = 12;

/**
 * Calls `handler` with viewport coordinates on a coarse-pointer tap. Mouse
 * input is ignored so this never doubles up with the hover-side handlers.
 * Returns a teardown function.
 */
export function onTap(
  target: Window | HTMLElement,
  handler: (x: number, y: number) => void
) {
  let startX = 0;
  let startY = 0;
  let startedAt = 0;
  let tracking = false;

  function onDown(event: Event) {
    const e = event as PointerEvent;
    if (e.pointerType === "mouse" || !e.isPrimary) return;
    startX = e.clientX;
    startY = e.clientY;
    startedAt = performance.now();
    tracking = true;
  }

  function onUp(event: Event) {
    if (!tracking) return;
    tracking = false;
    const e = event as PointerEvent;
    if (performance.now() - startedAt > TAP_MS) return;
    if (Math.hypot(e.clientX - startX, e.clientY - startY) > TAP_SLOP) return;
    handler(e.clientX, e.clientY);
  }

  function onCancel() {
    tracking = false;
  }

  target.addEventListener("pointerdown", onDown, { passive: true });
  target.addEventListener("pointerup", onUp, { passive: true });
  target.addEventListener("pointercancel", onCancel, { passive: true });

  return () => {
    target.removeEventListener("pointerdown", onDown);
    target.removeEventListener("pointerup", onUp);
    target.removeEventListener("pointercancel", onCancel);
  };
}
