// Bootstrap and game loop. Fixed-step simulation (120 Hz) decoupled from
// render, instant restart on R, pause when the tab is hidden.

import { S_LIP } from "./pipe";
import { T } from "./tuning";
import { newRun, type RunState, type LandingResult } from "./state";
import { stepRiding, stepDown } from "./rider";
import { stepAir } from "./air";
import { trickScore, trickName, formatScore } from "./scoring";
import { createInput } from "./input";
import { Hud } from "./hud";
import { createScene } from "./scene";
import { load, saveRun } from "./storage";
import { showLeaderboardPanel } from "./leaderboard";
import { mulberry32, hashSeed, todayString } from "./rng";

let booted = false;

export function start(): void {
  if (booted) return;
  booted = true;

  const hud = new Hud();
  const canvas = document.getElementById("game-canvas") as HTMLCanvasElement | null;
  if (!canvas) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const rand = mulberry32(hashSeed(todayString()));

  const scene = createScene(canvas, rand, reducedMotion);
  if (!scene) {
    hud.showFallback();
    return;
  }
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    hud.showFallback();
  });

  // --- Run state ---
  let st: RunState = newRun();
  let best = load().best;
  let topChain = 1;
  let newBestShown = false;
  let cleanSpinDone = false;

  const dropIn = () => {
    st = newRun();
    st.s = S_LIP - 0.02; // start at the right lip; gravity does the rest
    topChain = 1;
    newBestShown = false;
    hud.hideOver();
    hud.setScore(0);
    hud.setChain(1);
    hud.setClock(T.CLOCK_START);
    hud.setPbProgress(0, best);
  };

  const input = createInput({
    steerZone: canvas,
    pumpBtn: document.getElementById("pump-btn"),
    onRestart: dropIn,
  });
  void input; // handles stay alive for the page's lifetime

  const overScreen = document.getElementById("screen-over");
  overScreen?.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    if (t.closest("a")) return; // links navigate
    if (t.closest("#over-lb")) return; // leaderboard interaction, not a retry
    dropIn();
  });

  // --- Scoring on touchdown ---
  const onLanding = (res: LandingResult): void => {
    const pts = trickScore(res);
    if (res.quality === "clean") {
      const gained = pts * st.chain;
      st.score += gained;
      st.landings++;
      st.bestTrick = Math.max(st.bestTrick, gained);
      hud.popup(`+${formatScore(gained)}`, `${trickName(res)}  ×${st.chain}`, "clean");
      st.chain++;
      topChain = Math.max(topChain, st.chain);
      st.clock = Math.min(st.clock + T.CLOCK_PER_CLEAN, T.CLOCK_MAX);
      if (res.rotDeg >= 150) cleanSpinDone = true;
    } else if (res.quality === "sketchy") {
      const gained = Math.round(pts * T.SKETCHY_SCORE * st.chain);
      st.score += gained;
      st.landings++;
      st.bestTrick = Math.max(st.bestTrick, gained);
      hud.popup(`+${formatScore(gained)}`, `sketchy · ${trickName(res)}`, "sketchy");
      scene.shake(0.12);
    } else {
      st.bails++;
      st.chain = 1;
      const why = res.flatBail ? "to flat" : res.grabbedAtLanding ? "late grab" : "over-rotated";
      hud.popup("BAIL", why, "bail");
      scene.shake(0.45);
    }
    if (!newBestShown && best > 0 && st.score > best) {
      newBestShown = true;
      hud.popup("NEW BEST", "", "info");
    }
  };

  const runOver = (): void => {
    st.phase = "over";
    const outcome = saveRun(st.score);
    best = outcome.best;
    hud.showHint(null);
    void showLeaderboardPanel(st.score, {
      dur: Math.round(st.time),
      landings: st.landings,
    });
    hud.showOver({
      score: st.score,
      best: outcome.best,
      prevBest: outcome.prevBest,
      isNewBest: outcome.isNewBest,
      dailyBest: outcome.dailyBest,
      landings: st.landings,
      bails: st.bails,
      bestTrick: st.bestTrick,
      topChain,
    });
  };

  // --- Fixed-step simulation ---
  const step = (dt: number): void => {
    if (st.phase === "over") return;
    st.time += dt;
    st.clock -= dt;
    if (st.phase === "riding") {
      stepRiding(st, input.state, dt);
    } else if (st.phase === "air") {
      const res = stepAir(st, input.state, dt);
      if (res) onLanding(res);
    } else if (st.phase === "down") {
      stepDown(st, dt);
    }
    // The clock ends a run, but an airborne trick always gets to land first
    if (st.clock <= 0 && st.phase !== "air") runOver();
  };

  const speedNorm = (): number => {
    const v = st.phase === "air" ? st.launchSpeed : st.phase === "over" ? 0 : Math.abs(st.v);
    return Math.min(v / T.SPEED_CAP, 1);
  };

  const hint = (): string | null => {
    if (st.landings + st.bails === 0) {
      return coarse
        ? "hold PUMP through the curve to build speed"
        : "hold SPACE through the curve to build speed";
    }
    if (!cleanSpinDone) {
      return coarse
        ? "drag to spin in the air · release PUMP before you land"
        : "hold ← or → in the air to spin · release SPACE before you land";
    }
    return null;
  };

  // --- Frame loop ---
  let acc = 0;
  let last = performance.now();
  let paused = false;

  document.addEventListener("visibilitychange", () => {
    paused = document.hidden;
    if (!paused) last = performance.now();
  });

  const frame = (now: number): void => {
    requestAnimationFrame(frame);
    if (paused) return;
    const dt = Math.min((now - last) / 1000, 0.25);
    last = now;
    acc += dt;
    while (acc >= T.DT) {
      step(T.DT);
      acc -= T.DT;
    }
    if (st.phase !== "over") {
      hud.setScore(st.score);
      hud.setChain(st.chain);
      hud.setClock(st.clock);
      hud.setPbProgress(st.score, best);
      hud.showHint(hint());
    }
    scene.update(st, dt, speedNorm());
  };

  // --- Go ---
  hud.hideStart();
  hud.showHudLayer();
  dropIn();
  requestAnimationFrame(frame);

  if (import.meta.env.DEV) {
    // Playtest handle: inspect live state from the console
    (window as unknown as Record<string, unknown>).__hp = {
      st: () => st,
      input: input.state,
      debug: scene.debug,
    };
  }
}
