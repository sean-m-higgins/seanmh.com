import { T } from "./tuning.ts";

export type AttackKind = "left-straight" | "right-straight" | "hook";
export type Defense = "left" | "right" | "duck";
export type Action = Defense | "counter";
export type CombatPhase = "telegraph" | "counter" | "recover" | "over";

export interface Attack {
  kind: AttackKind;
  defense: Defense;
  cue: "←" | "→" | "↓";
}

export interface GameState {
  phase: CombatPhase;
  phaseTime: number;
  phaseDuration: number;
  attack: Attack;
  score: number;
  chain: number;
  maxChain: number;
  pressure: number;
  counters: number;
  perfects: number;
  hits: number;
  attacks: number;
  heat: number;
  time: number;
  flurryLeft: number;
  lastAttack: AttackKind | null;
}

export type CombatEvent =
  | { type: "attack"; attack: Attack; flurry: boolean }
  | { type: "dodge"; defense: Defense }
  | { type: "counter"; quality: "clean" | "perfect"; points: number }
  | { type: "hit"; reason: "wrong" | "early" | "late" }
  | { type: "miss"; reason: "whiff" | "opening" }
  | { type: "over" };

const ATTACKS: readonly Attack[] = [
  { kind: "left-straight", defense: "right", cue: "→" },
  { kind: "right-straight", defense: "left", cue: "←" },
  { kind: "hook", defense: "duck", cue: "↓" },
];

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const mix = (from: number, to: number, amount: number) => from + (to - from) * clamp01(amount);

function chooseAttack(rand: () => number, last: AttackKind | null): Attack {
  let index = Math.floor(rand() * ATTACKS.length);
  if (ATTACKS[index].kind === last) index = (index + 1 + Math.floor(rand() * 2)) % ATTACKS.length;
  return ATTACKS[index];
}

function telegraphDuration(heat: number): number {
  return mix(T.TELEGRAPH_SLOW, T.TELEGRAPH_FAST, heat);
}

function defenseWindow(heat: number): number {
  return mix(T.DEFENSE_WINDOW_SLOW, T.DEFENSE_WINDOW_FAST, heat);
}

export function defenseIsOpen(state: GameState): boolean {
  return state.phase === "telegraph" && state.phaseTime <= defenseWindow(state.heat);
}

function counterWindow(heat: number): number {
  return mix(T.COUNTER_WINDOW_SLOW, T.COUNTER_WINDOW_FAST, heat);
}

function beginAttack(state: GameState, rand: () => number, flurry: boolean): CombatEvent {
  const attack = chooseAttack(rand, state.lastAttack);
  state.attack = attack;
  state.lastAttack = attack.kind;
  state.phase = "telegraph";
  state.phaseDuration = telegraphDuration(state.heat);
  state.phaseTime = state.phaseDuration;
  state.attacks++;
  return { type: "attack", attack, flurry };
}

export function newBout(rand: () => number): GameState {
  const initial = chooseAttack(rand, null);
  return {
    phase: "telegraph",
    phaseTime: T.TELEGRAPH_SLOW,
    phaseDuration: T.TELEGRAPH_SLOW,
    attack: initial,
    score: 0,
    chain: 0,
    maxChain: 0,
    pressure: T.PRESSURE_START,
    counters: 0,
    perfects: 0,
    hits: 0,
    attacks: 1,
    heat: 0,
    time: 0,
    flurryLeft: 0,
    lastAttack: initial.kind,
  };
}

function loseChain(state: GameState): void {
  state.chain = 0;
}

function takeHit(state: GameState, reason: "wrong" | "early" | "late", events: CombatEvent[]): void {
  state.hits++;
  state.pressure = Math.max(0, state.pressure - T.HIT_DAMAGE);
  state.heat = Math.max(0, state.heat - T.HEAT_HIT_LOSS);
  state.flurryLeft = 0;
  loseChain(state);
  state.phase = "recover";
  state.phaseDuration = T.RECOVER_HIT;
  state.phaseTime = state.phaseDuration;
  events.push({ type: "hit", reason });
}

function miss(state: GameState, reason: "whiff" | "opening", events: CombatEvent[]): void {
  state.pressure = Math.max(0, state.pressure - (reason === "whiff" ? T.WHIFF_DAMAGE : 0));
  state.heat = Math.max(0, state.heat - T.HEAT_MISS_LOSS);
  loseChain(state);
  events.push({ type: "miss", reason });
}

function resolveCounter(state: GameState, events: CombatEvent[]): void {
  const perfect = state.phaseTime >= T.PERFECT_MIN && state.phaseTime <= T.PERFECT_MAX;
  const quality = perfect ? "perfect" : "clean";
  state.chain++;
  state.maxChain = Math.max(state.maxChain, state.chain);
  const multiplier = Math.min(T.CHAIN_CAP, 1 + (state.chain - 1) * T.CHAIN_STEP);
  const points = Math.round(T.SCORE_BASE * (perfect ? 1.5 : 1) * multiplier);
  state.score += points;
  state.counters++;
  if (perfect) state.perfects++;
  state.pressure = Math.min(T.PRESSURE_MAX, state.pressure + (perfect ? T.PERFECT_GAIN : T.CLEAN_GAIN));
  state.heat = Math.min(1, state.heat + (perfect ? T.HEAT_PERFECT : T.HEAT_CLEAN));
  state.phase = "recover";
  state.phaseDuration = state.flurryLeft > 0 ? T.RECOVER_FLURRY : T.RECOVER_NORMAL;
  state.phaseTime = state.phaseDuration;
  events.push({ type: "counter", quality, points });
}

function scheduleNext(state: GameState, rand: () => number, events: CombatEvent[]): void {
  let flurry = state.flurryLeft > 0;
  if (flurry) {
    state.flurryLeft--;
  } else if (state.heat > 0.3 && rand() < 0.12 + state.heat * 0.34) {
    state.flurryLeft = state.heat > 0.72 && rand() < 0.42 ? 2 : 1;
    flurry = true;
    state.flurryLeft--;
  }
  events.push(beginAttack(state, rand, flurry));
}

/** Advances the pure combat state by one fixed simulation step. */
export function stepCombat(state: GameState, dt: number, actions: Action[], rand: () => number): CombatEvent[] {
  if (state.phase === "over") return [];
  const events: CombatEvent[] = [];
  state.time += dt;
  const drain = T.PRESSURE_DRAIN + state.heat * T.PRESSURE_DRAIN_HEAT
    + Math.min(T.PRESSURE_DRAIN_TIME_MAX, state.time * T.PRESSURE_DRAIN_TIME);
  state.pressure = Math.max(0, state.pressure - drain * dt);

  for (const action of actions) {
    if (action === "counter") {
      if (state.phase === "counter") resolveCounter(state, events);
      else miss(state, "whiff", events);
      continue;
    }
    if (state.phase !== "telegraph") continue;
    if (state.phaseTime > defenseWindow(state.heat)) {
      takeHit(state, "early", events);
    } else if (action !== state.attack.defense) {
      takeHit(state, "wrong", events);
    } else {
      state.phase = "counter";
      state.phaseDuration = counterWindow(state.heat);
      state.phaseTime = state.phaseDuration;
      events.push({ type: "dodge", defense: action });
    }
  }

  state.phaseTime -= dt;
  if (state.phaseTime <= 0) {
    if (state.phase === "telegraph") {
      takeHit(state, "late", events);
    } else if (state.phase === "counter") {
      miss(state, "opening", events);
      state.phase = "recover";
      state.phaseDuration = state.flurryLeft > 0 ? T.RECOVER_FLURRY : T.RECOVER_NORMAL;
      state.phaseTime = state.phaseDuration;
    } else if (state.phase === "recover") {
      scheduleNext(state, rand, events);
    }
  }

  if (state.pressure <= 0) {
    state.phase = "over";
    events.push({ type: "over" });
  }
  return events;
}

export function formatMultiplier(chain: number): string {
  return Math.min(T.CHAIN_CAP, 1 + Math.max(0, chain - 1) * T.CHAIN_STEP).toFixed(1);
}
