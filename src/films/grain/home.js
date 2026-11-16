// Scene 12, "home": the finished table indoors. Built as geometry first
// (polygons in draw order), then rendered by whichever look is chosen.
// Room details from Sean: coffee-table books on the lower shelf, coasters on
// top, a large white couch behind.

import { TABLE as T, camera, boxFaces, projectPoly } from './geom.js';

export const A = [540, 560];

// The V mark sits on the front oak border of the top, just left of centre.
export const PIN = [-3, T.H, T.D / 2 - 2.4];

// Window light from the back-left, travelling right, down and toward camera.
const SUN = [0.7, -0.45, 0.55];
const onFloor = ([x, y, z]) => { const t = y / -SUN[1]; return [x + SUN[0] * t, 0, z + SUN[2] * t]; };

export function homeCamera() {
  return camera({ eye: [24, 30, 60], target: [-4, 10, -16], f: 1180, pin: PIN, at: A });
}

/** The V mark's three points, lying on the oak, pointing at the front edge. */
export function vMark(P) {
  const [x, y, z] = PIN;
  return [P([x - 0.7, y, z - 1.1]), P([x, y, z]), P([x + 0.7, y, z - 1.1])];
}

/** Every shape in the room, back to front. `kind` drives how a look renders it. */
export function buildHome(P) {
  const L = T.L / 2, D = T.D / 2, g = T.leg, H = T.H;
  const parts = [];
  const add = (kind, pts, extra = {}) => parts.push({ kind, pts, ...extra });
  const faces = (kind, f, which, extra) => which.forEach((k) => add(kind, f[k], { face: k, ...extra }));

  // Room: wall, floor, the window, and its patch of light on the floor.
  // Big shapes are clipped to what's in front of the camera before projecting.
  add('wall', projectPoly(P, [[-160, 140, -80], [160, 140, -80], [160, 0, -80], [-160, 0, -80]]));
  add('floor', projectPoly(P, [[-160, 0, -80], [160, 0, -80], [160, 0, 140], [-160, 0, 140]]));
  const boards = [];
  for (let z = -78; z < 140; z += 5.5) {
    const l = projectPoly(P, [[-160, 0, z], [160, 0, z], [160, 0, z + 0.01], [-160, 0, z + 0.01]]);
    if (l.length >= 2) boards.push([l[0], l[1]]);
  }
  add('boards', [], { lines: boards });
  faces('baseboard', boxFaces(P, -160, 160, 0, 4, -80, -79.4), ['front', 'top']);
  const win = [[-110, 70, -79.5], [-55, 70, -79.5], [-55, 24, -79.5], [-110, 24, -79.5]];
  add('window', win.map(P));
  const patch = win.map((p) => P(onFloor(p)));
  add('sun', patch);

  // The table's shadow, cast by the window, visible only inside the light.
  const top = [[-L, H, -D], [L, H, -D], [L, H, D], [-L, H, D]].map((p) => P(onFloor(p)));
  add('shadow', top, { clip: patch });
  for (const [x, z] of [[-L + g, -D + g], [L - g, -D + g], [L - g, D - g], [-L + g, D - g]]) {
    add('shadow', [P([x - g / 2, 0, z]), P([x + g / 2, 0, z]), P(onFloor([x + g / 2, H, z])), P(onFloor([x - g / 2, H, z]))], { clip: patch });
  }

  // The couch, a large white sofa: back frame, padded arms, a base on short
  // feet, thick seat cushions, two back cushions and two throw pillows. Soft
  // parts get rounded corners in the look. Drawn back to front for this camera.
  const cz0 = -76, cz1 = -40, cx = 46;
  add('contact', [P([-cx - 3, 0, cz0]), P([cx + 3, 0, cz0]), P([cx + 3, 0, cz1 + 4]), P([-cx - 3, 0, cz1 + 4])]);
  for (const [fx, fz] of [[-cx + 3, cz1 - 3], [cx - 3, cz1 - 3]]) faces('foot', boxFaces(P, fx - 1.5, fx + 1.5, 0, 3, fz - 1.5, fz + 1.5), ['front', 'right']);
  faces('couch', boxFaces(P, -cx, cx, 3, 30, cz0, cz0 + 8), ['top', 'front']);
  faces('couch', boxFaces(P, -cx, -cx + 8, 3, 25, cz0, cz1), ['top', 'front', 'right']);
  faces('cushion', boxFaces(P, -cx + 8, -0.4, 11, 33, cz0 + 8, cz0 + 17), ['top', 'front', 'right']);
  faces('cushion', boxFaces(P, 0.4, cx - 8, 11, 33, cz0 + 8, cz0 + 17), ['top', 'front', 'right']);
  faces('couch', boxFaces(P, -cx + 8, cx - 8, 3, 11, cz0 + 8, cz1), ['front']);
  faces('cushion', boxFaces(P, -cx + 8, -0.4, 11, 18, cz0 + 17, cz1 + 1.5), ['top', 'front', 'right']);
  faces('cushion', boxFaces(P, 0.4, cx - 8, 11, 18, cz0 + 17, cz1 + 1.5), ['top', 'front', 'right']);
  const pillow = (x0, w, tilt) => add('pillow', [P([x0, 18, cz0 + 21]), P([x0 + w, 18, cz0 + 21 + tilt]), P([x0 + w + 1, 31, cz0 + 17.5 + tilt]), P([x0 - 1, 31, cz0 + 17.5])]);
  pillow(-34, 15, 0.5);
  pillow(20, 15, -0.5);
  faces('couch', boxFaces(P, cx - 8, cx, 3, 25, cz0, cz1), ['top', 'front', 'right']);

  for (const [x, z] of [[-L + g / 2, -D + g / 2], [L - g / 2, -D + g / 2], [L - g / 2, D - g / 2], [-L + g / 2, D - g / 2]]) {
    add('contact', [P([x - 2.2, 0, z - 2.2]), P([x + 2.2, 0, z - 2.2]), P([x + 2.2, 0, z + 2.2]), P([x - 2.2, 0, z + 2.2])]);
  }

  // Back legs, then the lower shelf and its books, then the front legs.
  const leg = (x, z) => boxFaces(P, x - g / 2, x + g / 2, 0, H - T.top, z - g / 2, z + g / 2);
  const lx = L - g / 2, lz = D - g / 2;
  faces('oak', leg(-lx, -lz), ['front', 'right'], { part: 'leg' });
  faces('oak', leg(lx, -lz), ['front', 'right'], { part: 'leg' });

  const sy = T.shelfY;
  faces('oak', boxFaces(P, -L + g, L - g, sy - 1.5, sy, -D + g / 2 - 0.75, -D + g / 2 + 0.75), ['top', 'front'], { part: 'apron' });
  const n = T.slats, pitch = (T.L - 2 * g) / n, sw = pitch * 0.62;
  for (let i = 0; i < n; i++) {
    const x0 = -L + g + (pitch - sw) / 2 + i * pitch;
    faces('slat', boxFaces(P, x0, x0 + sw, sy, sy + T.shelfT, -D + g, D - g), ['top', 'front', 'right'], { i });
  }
  // Coffee-table books, stacked flat on the shelf.
  const book = (x0, x1, z0, z1, y0, h, tone) =>
    faces('book', boxFaces(P, x0, x1, y0, y0 + h, z0, z1), ['top', 'front', 'right'], { tone });
  const s0 = sy + T.shelfT;
  book(-13, -1, -6, 5, s0, 1.2, 0);
  book(-12, -2.5, -5, 3.5, s0 + 1.2, 0.9, 1);
  book(4, 14, -5, 5, s0, 1.5, 2);
  faces('oak', boxFaces(P, -L + g, L - g, sy - 1.5, sy, D - g / 2 - 0.75, D - g / 2 + 0.75), ['top', 'front'], { part: 'apron' });
  faces('oak', leg(-lx, lz), ['front', 'right'], { part: 'leg' });
  faces('oak', leg(lx, lz), ['front', 'right'], { part: 'leg' });

  // The top: an oak frame (two long rails, two end rails) around the glass.
  const y0 = H - T.top, gx = T.glass.L / 2, gz = T.glass.D / 2;
  faces('oak-top', boxFaces(P, -L, L, y0, H, -D, -gz), ['top'], { rail: 'back' });
  faces('oak-top', boxFaces(P, -L, -gx, y0, H, -gz, gz), ['top'], { rail: 'left' });
  faces('oak-top', boxFaces(P, gx, L, y0, H, -gz, gz), ['top', 'right'], { rail: 'right' });
  faces('oak-top', boxFaces(P, -L, L, y0, H, gz, D), ['top', 'front', 'right'], { rail: 'front' });
  faces('oak-top', boxFaces(P, L - 0.01, L, y0, H, -D, D), ['right'], { rail: 'end' });
  add('glass', [P([-gx, H - 0.1, -gz]), P([gx, H - 0.1, -gz]), P([gx, H - 0.1, gz]), P([-gx, H - 0.1, gz])]);

  // Two coasters: one on the glass, one on the front rail.
  const coaster = (x, z) => { const pts = []; for (let k = 0; k < 28; k++) { const a = (k / 28) * Math.PI * 2; pts.push(P([x + Math.cos(a) * 1.9, H + 0.25, z + Math.sin(a) * 1.9])); } return pts; };
  add('coaster', coaster(8, -1.5));
  add('coaster', coaster(12.5, D - 2.5));

  return parts;
}
