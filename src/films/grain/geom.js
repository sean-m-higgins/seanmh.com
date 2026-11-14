// The table in inches, and a pinhole camera to project it. One model keeps
// every scene's table consistent: 36 long (x), 24 deep (z, + toward camera),
// 12 tall (y). The glass is a 30 x 14 inset: 3 in of oak at each end, 5 in
// along each side.

export const TABLE = {
  L: 36, D: 24, H: 12,
  leg: 2.25, top: 1.25, // leg section; top frame thickness
  glass: { L: 30, D: 14 },
  shelfY: 3.2, shelfT: 0.75, slats: 7,
};

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(...a); return [a[0] / l, a[1] / l, a[2] / l]; };

/**
 * A camera that maps world points to screen. `pin` is a world point and `at`
 * the screen point it must land on, so the anchor can be pinned exactly.
 */
export function camera({ eye, target, f, pin, at }) {
  const fw = norm(sub(target, eye));
  const rt = norm(cross(fw, [0, 1, 0]));
  const up = cross(rt, fw);
  const raw = (p) => {
    const d = sub(p, eye);
    const z = dot(d, fw);
    return [(f * dot(d, rt)) / z, (-f * dot(d, up)) / z, z];
  };
  const r = raw(pin);
  const ox = at[0] - r[0], oy = at[1] - r[1];
  const P = (p) => { const q = raw(p); return [q[0] + ox, q[1] + oy]; };
  P.depth = (p) => raw(p)[2];
  return P;
}

/**
 * Project a world polygon, first clipping it to the part in front of the
 * camera (depth > near). Without this, a corner behind the camera projects
 * through to the far side of the frame and the shape turns inside out.
 */
export function projectPoly(P, pts, near = 1) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const da = P.depth(a) - near, db = P.depth(b) - near;
    if (da > 0) out.push(a);
    if (da > 0 !== db > 0) {
      const t = da / (da - db);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);
    }
  }
  return out.map(P);
}

/** The eight corners of a box, as screen points, keyed by face. */
export function boxFaces(P, x0, x1, y0, y1, z0, z1) {
  const c = (x, y, z) => P([x, y, z]);
  return {
    top: [c(x0, y1, z0), c(x1, y1, z0), c(x1, y1, z1), c(x0, y1, z1)],
    front: [c(x0, y0, z1), c(x1, y0, z1), c(x1, y1, z1), c(x0, y1, z1)],
    right: [c(x1, y0, z1), c(x1, y0, z0), c(x1, y1, z0), c(x1, y1, z1)],
    left: [c(x0, y0, z0), c(x0, y0, z1), c(x0, y1, z1), c(x0, y1, z0)],
  };
}
