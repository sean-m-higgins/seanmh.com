import { newBout, stepCombat, type Action, type CombatEvent, type GameState } from "./combat";
import { T } from "./tuning";
import { createInput } from "./input";
import { createScene } from "./scene";
import { Hud } from "./hud";
import { FightAudio } from "./audio";
import { hashSeed, mulberry32, todayString } from "./rng";
import { load, saveRun } from "./storage";
import { showLeaderboard } from "./leaderboard";

let booted = false;

export function start(): void {
  if (booted) return;
  booted = true;
  const canvas = document.getElementById("game-canvas") as HTMLCanvasElement | null;
  if (!canvas) return;

  const hud = new Hud();
  const audio = new FightAudio();
  void audio.start().catch(() => { /* Audio is an optional enhancement. */ });
  hud.setMuted(audio.isMuted());
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scene = createScene(canvas, reducedMotion);
  if (!scene) { hud.showFallback(); return; }

  let runNumber = 0;
  let rand = mulberry32(hashSeed(`${todayString()}:${runNumber}`));
  let state: GameState = newBout(rand);
  let best = load().best;
  let overHandled = false;

  const toggleMute = () => hud.setMuted(audio.toggle());
  const dropIn = () => {
    runNumber++;
    rand = mulberry32(hashSeed(`${todayString()}:${runNumber}`));
    state = newBout(rand);
    overHandled = false;
    hud.hideOver();
    hud.update(state, best);
  };
  const input = createInput({ onRestart: dropIn, onMute: toggleMute });
  const pendingActions: Action[] = [];
  document.getElementById("mute-btn")?.addEventListener("click", toggleMute);

  const overScreen = document.getElementById("screen-over");
  overScreen?.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    if (target.closest("a, form, input, #over-lb")) return;
    dropIn();
  });

  function finishBout(): void {
    if (overHandled) return;
    overHandled = true;
    const outcome = saveRun(state.score);
    best = outcome.best;
    hud.showOver({ state, ...outcome });
    void showLeaderboard(state.score, {
      dur: Math.round(state.time),
      counters: state.counters,
      maxChain: state.maxChain,
      hits: state.hits,
    });
  }

  function handle(event: CombatEvent): void {
    scene?.handle(event);
    hud.event(event);
    audio.event(event);
    if (event.type === "over") finishBout();
  }

  document.getElementById("screen-start")?.classList.add("hidden");
  hud.show();
  dropIn();

  let accumulator = 0;
  let last = performance.now();
  let paused = false;
  document.addEventListener("visibilitychange", () => {
    paused = document.hidden;
    if (!paused) last = performance.now();
  });

  const frame = (now: number) => {
    requestAnimationFrame(frame);
    if (paused) return;
    const delta = Math.min((now - last) / 1000, 0.25);
    last = now;
    accumulator += delta;
    pendingActions.push(...input.take());
    while (accumulator >= T.DT) {
      const events = stepCombat(state, T.DT, pendingActions.splice(0), rand);
      events.forEach(handle);
      scene.update(T.DT);
      accumulator -= T.DT;
    }
    if (state.phase !== "over") {
      hud.update(state, best);
      audio.update(state.pressure);
    }
    scene.render(state);
  };
  requestAnimationFrame(frame);

  if (import.meta.env.DEV) {
    (window as typeof window & { __counter?: unknown }).__counter = { state: () => state, dropIn };
  }
}
