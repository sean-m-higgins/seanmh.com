import type { Action } from "./combat";

interface Options {
  onRestart: () => void;
  onMute: () => void;
}

export interface InputHandles {
  take(): Action[];
  dispose(): void;
}

export function createInput(options: Options): InputHandles {
  const queued: Action[] = [];
  const typing = (event: KeyboardEvent) =>
    event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement;

  const keyAction = (code: string): Action | null => {
    if (code === "ArrowLeft" || code === "KeyA") return "left";
    if (code === "ArrowRight" || code === "KeyD") return "right";
    if (code === "ArrowDown" || code === "KeyS") return "duck";
    if (code === "Space" || code === "KeyJ") return "counter";
    return null;
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (typing(event)) return;
    if (event.code === "KeyR") {
      if (!event.repeat) options.onRestart();
      return;
    }
    if (event.code === "KeyM") {
      if (!event.repeat) options.onMute();
      return;
    }
    const action = keyAction(event.code);
    if (!action) return;
    event.preventDefault();
    if (!event.repeat) queued.push(action);
  };

  const controls = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-action]"));
  const onPointerDown = (event: PointerEvent) => {
    const button = event.currentTarget as HTMLButtonElement;
    const action = button.dataset.action as Action | undefined;
    if (!action) return;
    event.preventDefault();
    queued.push(action);
    button.classList.add("pressed");
    button.setPointerCapture(event.pointerId);
  };
  const onPointerEnd = (event: PointerEvent) => {
    (event.currentTarget as HTMLButtonElement).classList.remove("pressed");
  };

  window.addEventListener("keydown", onKeyDown);
  controls.forEach((control) => {
    control.addEventListener("pointerdown", onPointerDown);
    control.addEventListener("pointerup", onPointerEnd);
    control.addEventListener("pointercancel", onPointerEnd);
  });

  return {
    take() {
      return queued.splice(0);
    },
    dispose() {
      window.removeEventListener("keydown", onKeyDown);
      controls.forEach((control) => {
        control.removeEventListener("pointerdown", onPointerDown);
        control.removeEventListener("pointerup", onPointerEnd);
        control.removeEventListener("pointercancel", onPointerEnd);
      });
    },
  };
}
