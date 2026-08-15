import { formatMultiplier, type CombatEvent, type GameState } from "./combat";

const formatScore = (score: number) => Math.round(score).toLocaleString("en-US");

export class Hud {
  private root = document.getElementById("hud");
  private score = document.getElementById("hud-score");
  private chain = document.getElementById("hud-chain");
  private pressure = document.getElementById("hud-pressure-fill");
  private pb = document.getElementById("hud-pb");
  private pbFill = document.getElementById("hud-pb-fill");
  private hint = document.getElementById("hud-hint");
  private popups = document.getElementById("hud-popups");

  show(): void {
    this.root?.classList.remove("hidden");
  }

  setMuted(muted: boolean): void {
    const button = document.getElementById("mute-btn");
    if (button) {
      button.textContent = muted ? "MUTED" : "SOUND";
      button.setAttribute("aria-label", muted ? "Enable sound" : "Mute sound");
    }
  }

  update(state: GameState, best: number): void {
    if (this.score) this.score.textContent = formatScore(state.score);
    if (this.chain) {
      this.chain.textContent = `×${formatMultiplier(state.chain)}`;
      this.chain.classList.toggle("chain-hot", state.chain >= 5);
    }
    if (this.pressure) {
      this.pressure.style.width = `${Math.max(0, state.pressure)}%`;
      this.pressure.classList.toggle("pressure-low", state.pressure < 22);
    }
    if (this.pb && this.pbFill) {
      this.pb.classList.toggle("hidden", best <= 0);
      this.pb.classList.toggle("pb-passed", best > 0 && state.score > best);
      this.pbFill.style.width = `${best > 0 ? Math.min(100, (state.score / best) * 100) : 0}%`;
    }
    if (this.hint) {
      const copy = state.attacks <= 2
        ? "wait for the ring to close · match the arrow"
        : state.counters === 0
          ? "now COUNTER while the opening is live"
          : state.chain < 3
            ? "late counters land PERFECT"
            : "";
      this.hint.textContent = copy;
      this.hint.classList.toggle("hidden", !copy);
    }
  }

  event(event: CombatEvent): void {
    if (!this.popups) return;
    if (event.type === "counter") {
      this.popup(`+${formatScore(event.points)}`, event.quality === "perfect" ? "PERFECT COUNTER" : "COUNTER", event.quality);
      this.chain?.classList.remove("pop");
      void this.chain?.offsetWidth;
      this.chain?.classList.add("pop");
    } else if (event.type === "hit") {
      this.popup("TAGGED", event.reason === "early" ? "moved too soon" : event.reason === "wrong" ? "wrong way" : "too late", "hit");
    } else if (event.type === "miss") {
      this.popup(event.reason === "whiff" ? "WHIFF" : "OPENING LOST", "chain broken", "miss");
    }
  }

  showOver(args: { state: GameState; best: number; prevBest: number; isNewBest: boolean }): void {
    const { state, best, prevBest, isNewBest } = args;
    const over = document.getElementById("screen-over");
    const score = document.getElementById("over-score");
    const delta = document.getElementById("over-delta");
    if (score) score.textContent = formatScore(state.score);
    document.getElementById("over-counters")!.textContent = String(state.counters);
    document.getElementById("over-hits")!.textContent = String(state.hits);
    document.getElementById("over-chain")!.textContent = String(state.maxChain);
    if (delta) {
      delta.classList.toggle("over-delta--best", isNewBest);
      delta.textContent = isNewBest
        ? prevBest > 0 ? `new best · +${formatScore(state.score - prevBest)}` : "your first score is on the card"
        : `best ${formatScore(best)} · ${formatScore(best - state.score)} short`;
    }
    over?.classList.remove("hidden");
    over?.classList.add("flex");
  }

  hideOver(): void {
    const over = document.getElementById("screen-over");
    over?.classList.add("hidden");
    over?.classList.remove("flex");
  }

  showFallback(): void {
    document.getElementById("screen-start")?.classList.add("hidden");
    const fallback = document.getElementById("screen-fallback");
    fallback?.classList.remove("hidden");
    fallback?.classList.add("flex");
  }

  private popup(main: string, sub: string, kind: string): void {
    const element = document.createElement("div");
    element.className = `popup popup--${kind}`;
    const mainLine = document.createElement("div");
    mainLine.className = "popup-main";
    mainLine.textContent = main;
    const subLine = document.createElement("div");
    subLine.className = "popup-sub";
    subLine.textContent = sub;
    element.append(mainLine, subLine);
    this.popups?.appendChild(element);
    window.setTimeout(() => element.remove(), 900);
  }
}
