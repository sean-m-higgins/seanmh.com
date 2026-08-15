import { todayString } from "./rng.ts";

const KEY = "seanmh:e-2d-game:counter:v1";
const MUTE_KEY = "seanmh:e-2d-game:muted";

export interface Saved {
  best: number;
  dailyBest: number;
  dailyDate: string;
  runs: number[];
  initials: string;
}

function empty(): Saved {
  return { best: 0, dailyBest: 0, dailyDate: todayString(), runs: [], initials: "" };
}

export function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const data = { ...empty(), ...(JSON.parse(raw) as Partial<Saved>) };
    if (data.dailyDate !== todayString()) {
      data.dailyDate = todayString();
      data.dailyBest = 0;
    }
    return data;
  } catch {
    return empty();
  }
}

export function saveRun(score: number) {
  const data = load();
  const prevBest = data.best;
  data.best = Math.max(data.best, score);
  data.dailyBest = Math.max(data.dailyBest, score);
  data.runs = [score, ...data.runs].slice(0, 5);
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* optional */ }
  return { best: data.best, prevBest, dailyBest: data.dailyBest, isNewBest: score > prevBest };
}

export function getInitials(): string { return load().initials; }
export function setInitials(initials: string): void {
  const data = load();
  data.initials = initials;
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* optional */ }
}

export function loadMuted(): boolean {
  try { return localStorage.getItem(MUTE_KEY) === "1"; } catch { return false; }
}

export function saveMuted(muted: boolean): void {
  try { localStorage.setItem(MUTE_KEY, muted ? "1" : "0"); } catch { /* optional */ }
}
