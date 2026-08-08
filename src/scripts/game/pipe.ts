// Halfpipe cross-section math. The pipe runs along z and is uniform, so all
// gameplay lives in the x/y cross-section plane.
//
// Profile (one side): flat bottom → circular transition (radius R, tangent to
// the flat and to vertical) → short vert → lip/coping at (LIP_X, LIP_Y).
// Positions on the surface are parametrized by signed arc-length `s` measured
// from the pipe center; `phi` is the surface tangent's angle from horizontal
// (0 on the flat, π/2 on the vert).

export const FLAT_HALF = 3;
export const R = 5;
export const VERT = 1;

export const S_FLAT = FLAT_HALF;
export const S_TRANS = FLAT_HALF + (R * Math.PI) / 2;
export const S_LIP = S_TRANS + VERT;

export const LIP_X = FLAT_HALF + R;
export const LIP_Y = R + VERT;

export interface SurfacePoint {
  x: number;
  y: number;
  phi: number; // tangent angle from horizontal, [0, π/2]
  side: 1 | -1;
}

export function sideOf(s: number): 1 | -1 {
  return s < 0 ? -1 : 1;
}

export function surfaceAt(s: number): SurfacePoint {
  const side = sideOf(s);
  const a = Math.abs(s);
  if (a <= S_FLAT) {
    return { x: s, y: 0, phi: 0, side };
  }
  if (a <= S_TRANS) {
    const th = (a - S_FLAT) / R;
    return {
      x: side * (FLAT_HALF + R * Math.sin(th)),
      y: R * (1 - Math.cos(th)),
      phi: th,
      side,
    };
  }
  const h = Math.min(a - S_TRANS, VERT);
  return { x: side * LIP_X, y: R + h, phi: Math.PI / 2, side };
}

/** Unit tangent in direction of increasing s: (cosφ, side·sinφ). */
export function tangentAt(s: number): { tx: number; ty: number } {
  const { phi, side } = surfaceAt(s);
  return { tx: Math.cos(phi), ty: side * Math.sin(phi) };
}

/** Unit normal pointing into the pipe (away from the snow). */
export function normalAt(s: number): { nx: number; ny: number } {
  const { phi, side } = surfaceAt(s);
  return { nx: -side * Math.sin(phi), ny: Math.cos(phi) };
}

/** Height of the pipe surface below a given x (flat + transition only). */
export function surfaceYAtX(x: number): number {
  const a = Math.min(Math.abs(x), LIP_X);
  if (a <= FLAT_HALF) return 0;
  const dx = a - FLAT_HALF;
  return R - Math.sqrt(Math.max(R * R - dx * dx, 0));
}

/**
 * Arc-length for an air touchdown at (x, y). Points beyond the wall plane
 * resolve onto the vert at that height.
 */
export function landingS(x: number, y: number): number {
  const side = x < 0 ? -1 : 1;
  const a = Math.abs(x);
  if (a >= LIP_X - 1e-6) {
    const h = Math.min(Math.max(y - R, 0), VERT);
    return side * (S_TRANS + h);
  }
  if (a <= FLAT_HALF) return x;
  const th = Math.asin((a - FLAT_HALF) / R);
  return side * (S_FLAT + R * th);
}
