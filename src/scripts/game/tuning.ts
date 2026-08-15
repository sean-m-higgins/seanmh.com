export const T = {
  DT: 1 / 120,
  PRESSURE_START: 65,
  PRESSURE_MAX: 100,
  PRESSURE_DRAIN: 4.9,
  PRESSURE_DRAIN_HEAT: 2.1,
  // The late-bout ramp is the hard clock: at full stretch the drain (4.9 + 2.1
  // + 18 = 25/s) outruns even flawless flurry countering (~23.4/s), so every
  // bout ends well inside the leaderboard's 300s plausibility ceiling.
  PRESSURE_DRAIN_TIME: 0.09,
  PRESSURE_DRAIN_TIME_MAX: 18,
  HIT_DAMAGE: 24,
  WHIFF_DAMAGE: 7,
  CLEAN_GAIN: 6,
  PERFECT_GAIN: 9,
  TELEGRAPH_SLOW: 0.88,
  TELEGRAPH_FAST: 0.36,
  DEFENSE_WINDOW_SLOW: 0.48,
  DEFENSE_WINDOW_FAST: 0.22,
  COUNTER_WINDOW_SLOW: 0.36,
  COUNTER_WINDOW_FAST: 0.22,
  PERFECT_MIN: 0.055,
  PERFECT_MAX: 0.135,
  RECOVER_NORMAL: 0.42,
  RECOVER_FLURRY: 0.16,
  RECOVER_HIT: 0.68,
  HEAT_CLEAN: 0.038,
  HEAT_PERFECT: 0.06,
  HEAT_HIT_LOSS: 0.24,
  HEAT_MISS_LOSS: 0.1,
  // Opening-bell easing. The first WARMUP_SECONDS of every bout run at a
  // fraction of the fighter's real heat, so telegraphs stay slow and the
  // defense window stays wide while you learn the reads. It ramps to full
  // difficulty on a clock, identically for every player, so global scores
  // stay directly comparable.
  WARMUP_SECONDS: 30,
  WARMUP_CURVE: 2,
  WARMUP_HEAT_SCALE: 0.4,
  WARMUP_GAIN_SCALE: 0.4,
  // At the bell the defense window covers nearly the whole telegraph, so a fast
  // correct read is never punished as "early" — by far the biggest source of
  // early washouts. It tapers back to the designed window over the warmup.
  WARMUP_WINDOW_FRACTION: 0.95,
  // The counter opening gets the same treatment, widened then eased back.
  WARMUP_COUNTER_BONUS: 1.6,
  SCORE_BASE: 100,
  CHAIN_STEP: 0.2,
  CHAIN_CAP: 4,
} as const;
