// The table as solids, in inches, and the materials it is drawn in.
// 36 long (x), 24 deep (z), 12 tall (y); a 30 x 14 glass inset in the top;
// a slatted lower shelf. Every scene that shows the table draws this model.

import { TABLE as T, box, centroid } from './geom.js';
import { solid } from './kit.js';

export const RAW = { c: [240, 222, 190], grain: { c: [168, 124, 80], a: 0.42, n: 1.5 }, line: 0.72 };
export const STAIN = { c: [132, 72, 44], grain: { c: [46, 22, 14], a: 0.6, n: 1.7 }, line: 0.85, dense: true };
export const STEEL = { c: [176, 178, 190], line: 0.7 };
export const DARK = { c: [84, 82, 96], line: 0.85, dense: true };
export const GREY = { c: [134, 138, 158], line: 0.8 };
export const BLACK = { c: [52, 50, 62], line: 0.9, dense: true };
export const PLY = { c: [226, 200, 162], grain: { c: [150, 110, 72], a: 0.28, n: 0.5, wave: 2.4 }, line: 0.6 };

/** Every piece of the table: { id, group, faces, i }. Groups: leg, apron, slat, rail. */
export function tableParts() {
  const L = T.L / 2, D = T.D / 2, g = T.leg, H = T.H, y0 = H - T.top, sy = T.shelfY;
  const gx = T.glass.L / 2, gz = T.glass.D / 2;
  const parts = [];
  const add = (id, group, faces, extra = {}) => parts.push({ id, group, faces, ...extra });
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const x = sx * (L - g / 2), z = sz * (D - g / 2);
    add(`leg${sx}${sz}`, 'leg', box(x - g / 2, x + g / 2, 0, y0, z - g / 2, z + g / 2, 1), { sx, sz });
  }
  for (const sz of [-1, 1]) add(`apron-z${sz}`, 'apron', box(-L + g, L - g, sy - 1.5, sy, sz * (D - g / 2) - 0.75, sz * (D - g / 2) + 0.75), { sz });
  for (const sx of [-1, 1]) add(`apron-x${sx}`, 'apron', box(sx * (L - g / 2) - 0.75, sx * (L - g / 2) + 0.75, sy - 1.5, sy, -D + g, D - g), { sx });
  const n = T.slats, pitch = (T.L - 2 * g) / n, sw = pitch * 0.66;
  for (let i = 0; i < n; i++) {
    const x0 = -L + g + (pitch - sw) / 2 + i * pitch;
    add(`slat${i}`, 'slat', box(x0, x0 + sw, sy, sy + T.shelfT, -D + g * 0.5, D - g * 0.5), { i });
  }
  add('rail-back', 'rail', box(-L, L, y0, H, -D, -gz), { rail: 'back' });
  add('rail-left', 'rail', box(-L, -gx, y0, H, -gz, gz), { rail: 'left' });
  add('rail-right', 'rail', box(gx, L, y0, H, -gz, gz), { rail: 'right' });
  add('rail-front', 'rail', box(-L, L, y0, H, gz, D), { rail: 'front' });
  return parts;
}

/** Painter's order for a camera in front of and above the table. */
export function sortParts(P3, parts) {
  const d = (p) => P3.depth(centroid(p.faces.flatMap((f) => f.pts)));
  const legs = parts.filter((p) => p.group === 'leg').sort((a, b) => d(b) - d(a));
  const by = (grp) => parts.filter((p) => p.group === grp).sort((a, b) => d(b) - d(a));
  const aprons = by('apron');
  return [...legs.slice(0, 2), ...aprons.slice(0, 2), ...by('slat'), ...aprons.slice(2), ...legs.slice(2), ...by('rail')];
}

/** Draw parts in order. `each(part)` may return { faces, mat, skip } to move or restyle one. */
export function drawParts(P3, parts, mat, Lt, R, each) {
  for (const part of parts) {
    const e = each ? each(part) ?? {} : {};
    if (e.skip) continue;
    if (e.before) e.before();
    solid(P3, e.faces ?? part.faces, e.mat ?? mat, Lt, { R, key: part.id });
    if (e.after) e.after();
  }
}
