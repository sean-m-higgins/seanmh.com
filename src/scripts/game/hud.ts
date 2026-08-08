// DOM HUD binding. The canvas draws the world; HTML draws everything you
// read. All elements live in the Astro components — this module only wires
// them.

import { formatScore } from "./scoring";

function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing #${id}`);
  return el;
}

export type PopupKind = "clean" | "sketchy" | "bail" | "info";

export interface OverData {
  score: number;
  best: number;
  prevBest: number;
  isNewBest: boolean;
  dailyBest: number;
  landings: number;
  bails: number;
  bestTrick: number;
  topChain: number;
}

export class Hud {
  private score = $("hud-score");
  private chain = $("hud-chain");
  private clock = $("hud-clock");
  private pb = $("hud-pb");
  private pbFill = $("hud-pb-fill");
  private popups = $("hud-popups");
  private hint = $("hud-hint");
  private hud = $("hud");
  private start = $("screen-start");
  private over = $("screen-over");
  private lastChain = 1;

  setScore(n: number): void {
    this.score.textContent = formatScore(n);
  }

  setChain(n: number): void {
    this.chain.textContent = `×${n}`;
    if (n !== this.lastChain) {
      this.lastChain = n;
      this.chain.classList.toggle("chain-hot", n >= 4);
      this.chain.classList.remove("pop");
      // restart the pop animation
      void this.chain.offsetWidth;
      this.chain.classList.add("pop");
    }
  }

  setClock(sec: number): void {
    const s = Math.max(sec, 0);
    this.clock.textContent = s.toFixed(1);
    this.clock.classList.toggle("clock-low", s < 10);
  }

  /** Progress toward the personal best; hidden when there is no best yet. */
  setPbProgress(score: number, best: number): void {
    if (best <= 0) {
      this.pb.classList.add("hidden");
      return;
    }
    this.pb.classList.remove("hidden");
    const frac = Math.min(score / best, 1);
    this.pbFill.style.width = `${(frac * 100).toFixed(1)}%`;
    this.pb.classList.toggle("pb-passed", score > best);
  }

  popup(main: string, sub: string, kind: PopupKind): void {
    const el = document.createElement("div");
    el.className = `popup popup--${kind}`;
    const strong = document.createElement("div");
    strong.className = "popup-main";
    strong.textContent = main;
    el.appendChild(strong);
    if (sub) {
      const small = document.createElement("div");
      small.className = "popup-sub";
      small.textContent = sub;
      el.appendChild(small);
    }
    this.popups.appendChild(el);
    window.setTimeout(() => el.remove(), 1100);
  }

  showHint(text: string | null): void {
    if (text === null) {
      this.hint.classList.add("hidden");
    } else {
      this.hint.textContent = text;
      this.hint.classList.remove("hidden");
    }
  }

  showHudLayer(): void {
    this.hud.classList.remove("hidden");
  }

  hideStart(): void {
    this.start.classList.add("hidden");
  }

  showOver(d: OverData): void {
    $("over-score").textContent = formatScore(d.score);
    const delta = $("over-delta");
    if (d.isNewBest && d.prevBest > 0) {
      delta.textContent = "new personal best";
      delta.className = "over-delta over-delta--best";
    } else if (d.isNewBest) {
      delta.textContent = "your first line is on the board";
      delta.className = "over-delta";
    } else {
      delta.textContent = `${formatScore(d.best - d.score)} short of your best (${formatScore(d.best)})`;
      delta.className = "over-delta";
    }
    $("over-landings").textContent = String(d.landings);
    $("over-bails").textContent = String(d.bails);
    $("over-trick").textContent = formatScore(d.bestTrick);
    $("over-chain").textContent = `×${d.topChain}`;
    this.over.classList.remove("hidden");
    this.over.classList.add("flex");
  }

  hideOver(): void {
    this.over.classList.add("hidden");
    this.over.classList.remove("flex");
  }

  showFallback(): void {
    this.start.classList.add("hidden");
    this.hud.classList.add("hidden");
    const fb = $("screen-fallback");
    fb.classList.remove("hidden");
    fb.classList.add("flex");
  }
}
