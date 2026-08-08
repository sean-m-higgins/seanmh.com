import { T } from "./tuning";

// riding: carving the pipe surface, s/v are the live coordinates
// air:    above the lip, x/y/vx/vy are live, spin + grab accumulate
// down:   tumbling after a bail, brief control lockout
// over:   run finished, waiting for restart
export type Phase = "riding" | "air" | "down" | "over";

export interface RunState {
  phase: Phase;

  // On-surface: signed arc-length across the pipe cross-section (0 = center)
  s: number;
  v: number; // ds/dt

  // In-air (cross-section plane; z is purely decorative)
  x: number;
  y: number;
  vx: number;
  vy: number;
  side: 1 | -1; // which wall launched the current air
  launchSpeed: number;

  // Trick accumulators for the current air
  netRot: number; // signed degrees since launch
  spinVel: number; // deg/s
  grabbing: boolean;
  grabTime: number;
  airTime: number;
  peakY: number;

  downTimer: number;

  // Run totals
  score: number;
  chain: number; // multiplier applied to the next trick
  clock: number;
  bails: number;
  landings: number;
  bestTrick: number;
  dist: number; // decorative meters down the pipe
  time: number;
}

export type LandingQuality = "clean" | "sketchy" | "bail";

export interface LandingResult {
  quality: LandingQuality;
  rotDeg: number; // net rotation, unrounded
  grabTime: number;
  airTime: number;
  flatBail: boolean;
  grabbedAtLanding: boolean;
}

export function newRun(): RunState {
  return {
    phase: "riding",
    // Drop in from just below the right lip
    s: 0,
    v: 0,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    side: 1,
    launchSpeed: 0,
    netRot: 0,
    spinVel: 0,
    grabbing: false,
    grabTime: 0,
    airTime: 0,
    peakY: 0,
    downTimer: 0,
    score: 0,
    chain: 1,
    clock: T.CLOCK_START,
    bails: 0,
    landings: 0,
    bestTrick: 0,
    dist: 0,
    time: 0,
  };
}
