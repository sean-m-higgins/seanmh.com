// The world in inches (x right, y up, z toward the camera), a pinhole camera,
// and the few solids everything is built from: boxes and cylinders, as lists
// of faces with normals. One table model keeps every scene's table the same.

export const TABLE = {
  L: 36, D: 24, H: 12,
  leg: 2.25, top: 1.25,
  glass: { L: 30, D: 14 },
  shelfY: 3.2, shelfT: 0.75, slats: 9,
};

export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const norm = (a) => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
export const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const centroid = (pts) => mul(pts.reduce(add, [0, 0, 0]), 1 / pts.length);

/**
 * A camera mapping world points to the screen. `pin` is a world point and
 * `at` the screen point it must land on, so the anchor is pinned exactly.
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
  const r = raw(pin ?? target);
  const ox = (at ?? [540, 540])[0] - r[0], oy = (at ?? [540, 540])[1] - r[1];
  const P = (p) => { const q = raw(p); return [q[0] + ox, q[1] + oy]; };
  P.depth = (p) => raw(p)[2];
  P.eye = eye;
  return P;
}

/** Project a world polygon, clipped to what is in front of the camera. */
export function projectPoly(P, pts, near = 1) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const da = P.depth(a) - near, db = P.depth(b) - near;
    if (da > 0) out.push(a);
    if (da > 0 !== db > 0) out.push(lerp3(a, b, da / (da - db)));
  }
  return out.map(P);
}

/**
 * A box as six faces. Each face carries its normal and `g`, the direction the
 * wood grain runs in (the box's longest side unless `axis` says otherwise);
 * faces square to the grain have g = null: end grain.
 */
export function box(x0, x1, y0, y1, z0, z1, axis) {
  const d = [x1 - x0, y1 - y0, z1 - z0];
  const ax = axis ?? (d[0] >= d[1] && d[0] >= d[2] ? 0 : d[2] >= d[1] ? 2 : 1);
  const G = [0, 0, 0]; G[ax] = 1;
  const F = (n, pts) => ({ n, pts, g: Math.abs(dot(n, G)) > 0.5 ? null : G });
  return [
    F([0, 1, 0], [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]]),
    F([0, -1, 0], [[x0, y0, z1], [x1, y0, z1], [x1, y0, z0], [x0, y0, z0]]),
    F([0, 0, 1], [[x0, y1, z1], [x1, y1, z1], [x1, y0, z1], [x0, y0, z1]]),
    F([0, 0, -1], [[x1, y1, z0], [x0, y1, z0], [x0, y0, z0], [x1, y0, z0]]),
    F([1, 0, 0], [[x1, y1, z1], [x1, y1, z0], [x1, y0, z0], [x1, y0, z1]]),
    F([-1, 0, 0], [[x0, y1, z0], [x0, y1, z1], [x0, y0, z1], [x0, y0, z0]]),
  ];
}

/** A cylinder from c along unit `axis` for `len`, radius r (r1 at the far end for a cone). */
export function cyl(c, axis, r, len, n = 28, r1 = r) {
  const a = norm(axis);
  const u = norm(cross(a, Math.abs(a[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]));
  const v = cross(a, u);
  const ring = (o, rr) => Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2;
    return add(o, add(mul(u, Math.cos(t) * rr), mul(v, Math.sin(t) * rr)));
  });
  const c1 = add(c, mul(a, len));
  const A = ring(c, r), B = ring(c1, r1);
  const faces = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, t = ((i + 0.5) / n) * Math.PI * 2;
    faces.push({ n: add(mul(u, Math.cos(t)), mul(v, Math.sin(t))), pts: [A[i], A[j], B[j], B[i]], g: a, smooth: true });
  }
  faces.push({ n: mul(a, -1), pts: A.slice().reverse(), g: null, cap: true });
  faces.push({ n: a, pts: B, g: null, cap: true });
  return faces;
}

/** Rotate faces about an axis ('x' | 'y' | 'z') through `about`, then move them. */
export function turn(faces, axis, ang, about = [0, 0, 0], move = [0, 0, 0]) {
  const c = Math.cos(ang), s = Math.sin(ang);
  const r = axis === 'x' ? ([x, y, z]) => [x, y * c - z * s, y * s + z * c]
    : axis === 'y' ? ([x, y, z]) => [x * c + z * s, y, -x * s + z * c]
      : ([x, y, z]) => [x * c - y * s, x * s + y * c, z];
  const p = (q) => add(add(r(sub(q, about)), about), move);
  return faces.map((f) => ({ ...f, n: r(f.n), g: f.g && r(f.g), pts: f.pts.map(p) }));
}

export const shift = (faces, d) => faces.map((f) => ({ ...f, pts: f.pts.map((p) => add(p, d)) }));

/** Keep the part of a world polygon above the plane y = y0. */
export function clipY(pts, y0) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const da = a[1] - y0, db = b[1] - y0;
    if (da > 0) out.push(a);
    if (da > 0 !== db > 0) out.push(lerp3(a, b, da / (da - db)));
  }
  return out;
}
