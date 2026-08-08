// Input: keyboard plus touch. Two verbs — a direction and an action — that
// mean different things on the surface (steer / pump) and in the air
// (spin / grab).

export interface InputState {
  dir: number; // -1..1
  action: boolean;
}

export interface InputHandles {
  state: InputState;
  dispose(): void;
}

interface Options {
  steerZone: HTMLElement; // full-screen layer: horizontal drag steers
  pumpBtn: HTMLElement | null; // touch-only hold button
  onRestart: () => void;
}

export function createInput(opts: Options): InputHandles {
  const state: InputState = { dir: 0, action: false };

  let left = false;
  let right = false;
  const applyKeys = () => {
    state.dir = (right ? 1 : 0) - (left ? 1 : 0);
  };

  const typing = (e: KeyboardEvent) =>
    e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

  const onKeyDown = (e: KeyboardEvent) => {
    if (typing(e)) return; // typing initials, not steering
    switch (e.code) {
      case "ArrowLeft":
      case "KeyA":
        left = true;
        applyKeys();
        e.preventDefault();
        break;
      case "ArrowRight":
      case "KeyD":
        right = true;
        applyKeys();
        e.preventDefault();
        break;
      case "Space":
      case "ArrowUp":
      case "ArrowDown":
        state.action = true;
        e.preventDefault();
        break;
      case "KeyR":
        opts.onRestart();
        break;
    }
  };
  const onKeyUp = (e: KeyboardEvent) => {
    if (typing(e)) return;
    switch (e.code) {
      case "ArrowLeft":
      case "KeyA":
        left = false;
        applyKeys();
        break;
      case "ArrowRight":
      case "KeyD":
        right = false;
        applyKeys();
        break;
      case "Space":
      case "ArrowUp":
      case "ArrowDown":
        state.action = false;
        break;
    }
  };

  // Touch steering: horizontal drag from wherever the finger lands
  let steerId: number | null = null;
  let steerStartX = 0;
  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse" || steerId !== null) return;
    steerId = e.pointerId;
    steerStartX = e.clientX;
    opts.steerZone.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerId !== steerId) return;
    const dx = e.clientX - steerStartX;
    state.dir = Math.max(-1, Math.min(1, dx / 48));
  };
  const onPointerEnd = (e: PointerEvent) => {
    if (e.pointerId !== steerId) return;
    steerId = null;
    state.dir = 0;
  };
  opts.steerZone.addEventListener("pointerdown", onPointerDown);
  opts.steerZone.addEventListener("pointermove", onPointerMove);
  opts.steerZone.addEventListener("pointerup", onPointerEnd);
  opts.steerZone.addEventListener("pointercancel", onPointerEnd);

  // Touch pump/grab button
  const pumpDown = (e: PointerEvent) => {
    state.action = true;
    e.preventDefault();
  };
  const pumpUp = () => {
    state.action = false;
  };
  if (opts.pumpBtn) {
    opts.pumpBtn.addEventListener("pointerdown", pumpDown);
    opts.pumpBtn.addEventListener("pointerup", pumpUp);
    opts.pumpBtn.addEventListener("pointercancel", pumpUp);
    opts.pumpBtn.addEventListener("pointerleave", pumpUp);
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  return {
    state,
    dispose() {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      opts.steerZone.removeEventListener("pointerdown", onPointerDown);
      opts.steerZone.removeEventListener("pointermove", onPointerMove);
      opts.steerZone.removeEventListener("pointerup", onPointerEnd);
      opts.steerZone.removeEventListener("pointercancel", onPointerEnd);
      if (opts.pumpBtn) {
        opts.pumpBtn.removeEventListener("pointerdown", pumpDown);
        opts.pumpBtn.removeEventListener("pointerup", pumpUp);
        opts.pumpBtn.removeEventListener("pointercancel", pumpUp);
        opts.pumpBtn.removeEventListener("pointerleave", pumpUp);
      }
    },
  };
}
