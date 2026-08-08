// Every feel-critical number in one place. P3 of the plan lives in this file:
// tuning these is where the game is actually made.

export const T = {
  // Simulation
  DT: 1 / 120, // fixed step, decoupled from render

  // Gravity (gamey, not 9.8 — snappier at this world scale)
  G: 22,
  G_AIR: 21,

  // Riding
  FRICTION_LIN: 0.015, // proportional drag on surface speed
  ROLL_DRAG: 0.28, // constant snow resistance
  PUMP: 17, // accel from pumping through the transition
  STEER: 7, // small on-surface accel from left/right
  SPEED_CAP: 30, // pump stops adding beyond this

  // Launch
  DRIFT_BASE: 0.25, // inward air drift so you land back on the wall...
  DRIFT_PER_SPEED: 0.02, // ...scaled a little by launch speed

  // Air
  SPIN_ACCEL: 1600, // deg/s^2 toward max while held
  SPIN_MAX: 540, // deg/s
  SPIN_DECAY: 1700, // deg/s^2 toward zero when released — release needs to bite
  GRAB_MAX: 1.5, // seconds of grab that still add bonus

  // Landing windows (deviation from a multiple of 180°, in degrees)
  LAND_CLEAN: 32,
  LAND_SKETCHY: 65,
  FLAT_BAIL_VY: 6, // hucking to flat harder than this is a bail
  CLEAN_BOOST: 1.05, // clean landings bank a little extra speed
  SKETCHY_KEEP: 0.8,
  BAIL_KEEP: 0.3,
  DOWN_TIME: 0.9, // seconds of tumble before you're riding again

  // Run clock — the failure condition. Cautious straight airs bleed out.
  CLOCK_START: 40,
  CLOCK_PER_CLEAN: 2.2,
  CLOCK_MAX: 60,

  // Scoring: trick = (rot × grabBonus + base) × airTime, × chain on landing
  SCORE_AIR_BASE: 60,
  GRAB_BONUS_RATE: 0.5, // grabBonus = 1 + rate × min(grabTime, GRAB_MAX)
  SKETCHY_SCORE: 0.4,

  // Decorative down-pipe motion
  ZDRIFT_BASE: 2,
  ZDRIFT_PER_SPEED: 0.28,
} as const;
