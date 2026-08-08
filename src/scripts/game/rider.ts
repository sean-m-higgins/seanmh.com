// On-surface physics: gravity along the slope, pumping through the
// transitions, and the launch off the lip. This is the "pump the transitions
// to build speed" half of the compounding loop.

import { S_FLAT, S_TRANS, S_LIP, surfaceAt, sideOf } from "./pipe";
import { T } from "./tuning";
import type { RunState } from "./state";
import type { InputState } from "./input";

/** One fixed step of riding. Returns "launch" when the rider leaves the lip. */
export function stepRiding(st: RunState, input: InputState, dt: number): "launch" | null {
  const side = sideOf(st.s);
  const a = Math.abs(st.s);
  const { phi } = surfaceAt(st.s);

  // Gravity component along the surface (always pulls toward the flat)
  let acc = -T.G * Math.sin(phi) * side;

  // Drag: proportional + a constant snow-resistance term
  acc -= T.FRICTION_LIN * st.v;
  if (Math.abs(st.v) > 0.2) acc -= T.ROLL_DRAG * Math.sign(st.v);

  // Pump: only effective while carving through the curved transition, only
  // while moving, and capped so speed can't grow forever
  const inTransition = a > S_FLAT && a < S_TRANS;
  if (input.action && inTransition && Math.abs(st.v) > 1 && Math.abs(st.v) < T.SPEED_CAP) {
    acc += T.PUMP * Math.sign(st.v) * (0.35 + 0.65 * Math.sin(phi));
  }

  // Gentle steering — lets you get moving from a stall and fine-adjust
  acc += input.dir * T.STEER;

  st.v += acc * dt;
  st.s += st.v * dt;

  // Launch: carried past the lip while still moving outward
  if (Math.abs(st.s) >= S_LIP && Math.sign(st.v) === sideOf(st.s)) {
    const launchSide = sideOf(st.s);
    const speed = Math.abs(st.v);
    const lip = surfaceAt(launchSide * S_LIP);
    st.phase = "air";
    st.side = launchSide;
    st.launchSpeed = speed;
    st.x = lip.x;
    st.y = lip.y;
    // Tangent at the lip is vertical; drift slightly back into the pipe so
    // the rider lands on the wall, lower when slower
    st.vy = speed;
    st.vx = -launchSide * (T.DRIFT_BASE + T.DRIFT_PER_SPEED * speed);
    st.netRot = 0;
    st.spinVel = 0;
    st.grabbing = false;
    st.grabTime = 0;
    st.airTime = 0;
    st.peakY = lip.y;
    return "launch";
  }
  return null;
}

/** Tumbling after a bail: heavy drag, no control, timer back to riding. */
export function stepDown(st: RunState, dt: number): void {
  const side = sideOf(st.s);
  const { phi } = surfaceAt(st.s);
  let acc = -T.G * Math.sin(phi) * side;
  acc -= 2.5 * st.v; // body in the snow, not a board on it
  st.v += acc * dt;
  st.s += st.v * dt;
  st.downTimer -= dt;
  if (st.downTimer <= 0) st.phase = "riding";
}
