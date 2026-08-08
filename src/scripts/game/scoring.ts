// Trick valuation. Rotation scores continuously — a 630 beats a 540 without
// an authored trick list. Grabs multiply, air time scales everything.

import { T } from "./tuning";
import type { LandingResult } from "./state";

export function trickScore(r: LandingResult): number {
  const grabBonus = 1 + T.GRAB_BONUS_RATE * Math.min(r.grabTime, T.GRAB_MAX);
  return Math.round((r.rotDeg * grabBonus + T.SCORE_AIR_BASE) * r.airTime);
}

/** Display name: rotation rounded to the nearest 180, plus the grab. */
export function trickName(r: LandingResult): string {
  const rounded = Math.round(r.rotDeg / 180) * 180;
  const spin = rounded >= 180 ? String(rounded) : "AIR";
  return r.grabTime > 0.2 ? `${spin} · GRAB` : spin;
}

export function formatScore(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}
