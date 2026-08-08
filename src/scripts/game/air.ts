// Air physics: ballistic flight in the cross-section plane, spin and grab
// accumulation, and landing resolution. The landing-angle test is the other
// half of the compounding loop — more air means a tighter window.

import { LIP_X, LIP_Y, S_FLAT, surfaceYAtX, landingS, tangentAt } from "./pipe";
import { T } from "./tuning";
import type { RunState, LandingResult } from "./state";
import type { InputState } from "./input";

/** One fixed step in the air. Returns a LandingResult on touchdown. */
export function stepAir(st: RunState, input: InputState, dt: number): LandingResult | null {
  // Ballistic motion
  st.vy -= T.G_AIR * dt;
  st.x += st.vx * dt;
  st.y += st.vy * dt;
  st.airTime += dt;
  if (st.y > st.peakY) st.peakY = st.y;

  // Spin: held direction ramps toward max; released decays toward zero
  if (input.dir !== 0) {
    st.spinVel += input.dir * T.SPIN_ACCEL * dt;
    st.spinVel = Math.max(-T.SPIN_MAX, Math.min(T.SPIN_MAX, st.spinVel));
  } else if (st.spinVel !== 0) {
    const drop = T.SPIN_DECAY * dt;
    st.spinVel = Math.abs(st.spinVel) <= drop ? 0 : st.spinVel - Math.sign(st.spinVel) * drop;
  }
  st.netRot += st.spinVel * dt;

  // Grab: same key as pump, held in the air. Must be released to land clean.
  st.grabbing = input.action;
  if (st.grabbing) st.grabTime += dt;

  // Touchdown only while descending
  if (st.vy >= 0) return null;

  const a = Math.abs(st.x);
  const onVert = a >= LIP_X - 1e-6 && st.y <= LIP_Y;
  const onSurface = a < LIP_X && st.y <= surfaceYAtX(st.x);
  if (!onVert && !onSurface) return null;

  // --- Resolve the landing ---
  const s = landingS(st.x, st.y);
  const flat = Math.abs(s) < S_FLAT + 0.3;
  const flatBail = flat && Math.abs(st.vy) > T.FLAT_BAIL_VY;

  // Rotation must be near a multiple of 180° (board is symmetric)
  const mod = ((st.netRot % 180) + 180) % 180;
  const dev = Math.min(mod, 180 - mod);
  let quality: LandingResult["quality"] =
    dev <= T.LAND_CLEAN ? "clean" : dev <= T.LAND_SKETCHY ? "sketchy" : "bail";
  // Still holding the grab at touchdown downgrades one tier
  const grabbedAtLanding = st.grabbing;
  if (grabbedAtLanding && quality !== "bail") {
    quality = quality === "clean" ? "sketchy" : "bail";
  }
  if (flatBail) quality = "bail";

  // Project air velocity onto the surface tangent — landing high on the wall
  // keeps your speed, landing low bleeds it into the snow
  const { tx, ty } = tangentAt(s);
  let v = st.vx * tx + st.vy * ty;
  if (quality === "clean") v *= T.CLEAN_BOOST;
  else if (quality === "sketchy") v *= T.SKETCHY_KEEP;
  else v *= T.BAIL_KEEP;

  st.s = s;
  st.v = v;
  if (quality === "bail") {
    st.phase = "down";
    st.downTimer = T.DOWN_TIME;
  } else {
    st.phase = "riding";
  }

  return {
    quality,
    rotDeg: Math.abs(st.netRot),
    grabTime: st.grabTime,
    airTime: st.airTime,
    flatBail,
    grabbedAtLanding,
  };
}
