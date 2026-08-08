// Local-first score keeping: all-time best, today's best, recent runs.

import { todayString } from "./rng";

const KEY = "seanmh:d-3d-game:halfpipe:v1";

export interface Saved {
  best: number;
  dailyBest: number;
  dailyDate: string;
  runs: number[]; // most recent first, capped
  initials: string; // last leaderboard initials used
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

export function getInitials(): string {
  return load().initials;
}

export function setInitials(initials: string): void {
  const data = load();
  data.initials = initials;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Fine — they'll type it again next time.
  }
}

export interface RunOutcome {
  best: number;
  prevBest: number;
  dailyBest: number;
  isNewBest: boolean;
}

export function saveRun(score: number): RunOutcome {
  const data = load();
  const prevBest = data.best;
  const isNewBest = score > data.best;
  data.best = Math.max(data.best, score);
  data.dailyBest = Math.max(data.dailyBest, score);
  data.runs = [score, ...data.runs].slice(0, 5);
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Private mode etc. — the run still played fine.
  }
  return { best: data.best, prevBest, dailyBest: data.dailyBest, isNewBest };
}
