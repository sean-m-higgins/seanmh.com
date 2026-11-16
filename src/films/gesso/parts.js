// Sets and props for gesso, all painted through the brush in kit.js.
// Everything is generic: no brands, no known skyline, no people.

import { rd } from '../../lib/draw/rng.js';
import { mix } from '../../lib/draw/color.js';
import { arc } from '../../lib/draw/line.js';
import { A, CX, CY, ROOM, rect, frameAt } from './kit.js';
import { OIL, BIG } from './field.js';

export const FLOOR = A.y + A.h + 4; // where the leaning canvas meets the floor
export const SW = 26; // stretcher bar width, px

// ---------- sets ----------

/** The white wall, face on: roller-white, a baseboard, a strip of carpet. base = baseboard top. */
export function wallSet(L, base = 940, k = 1) {
  const R = L.R;
  L.area(rect(0, 0, 1080, base), ROOM.wall, { colors: [ROOM.wall, ROOM.wall2, ROOM.wall3], angle: Math.PI / 2, width: 58 * k, thick: 0.13, base: 0.3, len: [240, 560], jitter: 0.07, dry: 0.3, vary: 0.02 });
  for (let i = 0; i < 9; i++) { // a few crossing passes, as a roller leaves
    const x = rd(R, 0, 1080), y = rd(R, 0, base - 80), a = rd(R, -0.5, 0.5);
    L.stroke([[x, y], [x + Math.cos(a) * 200, y + Math.sin(a) * 200]], ROOM.wall, 54 * k, { thick: 0.1, base: 0.31, dry: 0.6, vary: 0.015 });
  }
  L.shade(rect(0, base - 3, 1080, 8), 0.1, 4);
  L.area(rect(0, base, 1080, 46 * k), [250, 249, 244], { angle: 0, width: 15 * k, thick: 0.25, base: 0.5, len: [300, 700], jitter: 0.004, dry: 0.05 });
  L.line([[0, base], [1080, base + 1]], { alpha: 0.3 });
  L.line([[0, base + 46 * k], [1080, base + 46 * k - 1]], { alpha: 0.38 });
  carpet(L, rect(0, base + 46 * k, 1080, 1080 - base - 46 * k), k);
  L.shade(rect(0, base + 46 * k, 1080, 12), 0.2, 6);
}

/** Loop-pile carpet from above: thousands of short touches, no direction. */
export function carpet(L, poly, k = 1) {
  const R = L.R;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [x, y] of poly) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  L.area(poly, ROOM.carpet, { colors: [ROOM.carpet, [230, 231, 236]], angle: 0.3, width: 30, thick: 0.1, base: 0.2, len: [80, 200], jitter: 0.5 });
  L.clip(poly, () => {
    const n = Math.round(((x1 - x0) * (y1 - y0)) / (70 * k * k));
    for (let i = 0; i < n; i++) L.blob(rd(R, x0, x1), rd(R, y0, y1), rd(R, 5, 8) * k, rd(R, 2.6, 4) * k, rd(R, 0, 3.14), mix(ROOM.carpet, R() < 0.5 ? [246, 246, 248] : [206, 208, 216], rd(R, 0, 0.45)), { thick: 0.24, base: 0.2 });
  });
}

const SKY = { peach: [248, 196, 160], pink: [240, 150, 140], cream: [250, 232, 200], cobalt: [58, 84, 160], teal: [110, 190, 196] };
const TOWER = [[44, 58, 118], [58, 78, 146], [34, 44, 92], [82, 98, 160], [70, 64, 120]];

/** Through the glass: a pastel sky over an invented skyline. mid = towers behind the middle pane too. */
export function city(L, mid = false) {
  const R = L.R, C = { world: 'colour' };
  L.area(rect(0, 0, 1080, 320), SKY.peach, { ...C, colors: [SKY.peach, SKY.pink, SKY.cream, SKY.peach], angle: -0.5, width: 20, len: [50, 130], thick: 0.4, jitter: 0.25 });
  L.area(rect(0, 300, 1080, FLOOR - 300), SKY.teal, { ...C, colors: [SKY.teal, SKY.cream, SKY.peach, SKY.cream], angle: -0.4, width: 20, len: [50, 120], thick: 0.35, jitter: 0.25 });
  L.area([[0, 0], [330, 0], [250, 70], [120, 120], [0, 150]], SKY.cobalt, { ...C, colors: [SKY.cobalt, [80, 110, 190], [50, 70, 140]], angle: -0.6, width: 16, len: [40, 110], thick: 0.4, jitter: 0.2 });
  for (const [cx, cy, sx, sy] of [[610, 96, 250, 70], [930, 60, 160, 50], [380, 150, 150, 40], ...(mid ? [[500, 300, 220, 50]] : [])]) {
    for (let i = 0; i < 110; i++) {
      const a = rd(R, 0, 6.283), r = Math.sqrt(R());
      const x = cx + Math.cos(a) * r * sx, y = cy + Math.sin(a) * r * sy;
      L.blob(x, y, rd(R, 14, 30), rd(R, 6, 11), rd(R, -1.0, -0.1), mix(SKY.cream, y > cy ? SKY.pink : [255, 246, 226], rd(R, 0, 0.5)), { thick: 0.6 });
    }
  }
  const towers = [[-10, 150, 300], [58, 110, 180], [120, 70, 380], [1000, 90, 250], [930, 80, 330], [884, 60, 440], [1040, 60, 400],
    ...(mid ? [[200, 110, 470], [290, 80, 360], [350, 130, 520], [470, 70, 300], [520, 120, 430], [630, 90, 390], [700, 110, 500], [790, 100, 420]] : [])];
  towers.sort((p, q) => p[2] - q[2]);
  for (const [x, w, top] of towers) {
    const c = TOWER[Math.floor(R() * TOWER.length)];
    L.area(rect(x, top, w, FLOOR - top), c, { colors: [c, mix(c, [255, 255, 255], 0.12), mix(c, [0, 0, 30], 0.2)], angle: Math.PI / 2, width: 12, len: [40, 120], thick: 0.4 });
    L.stroke([[x, top], [x + w, top]], mix(c, SKY.cream, 0.55), 5, { thick: 0.6 });
    for (let wy = top + 18; wy < FLOOR - 20; wy += 17) {
      for (let wx = x + 9; wx < x + w - 6; wx += 13) if (R() < 0.28) L.blob(wx, wy, 3.4, 2.4, 0, R() < 0.8 ? [250, 210, 90] : SKY.pink, { thick: 0.7 });
    }
  }
}

/** The window's white posts. With `pane`, a transom and sill too, so the middle pane is the anchor. */
export function posts(L, pane = false) {
  for (const x of [150, 908]) {
    L.shade(rect(x + 8, 0, 26, FLOOR), 0.16);
    L.area(rect(x, 0, 22, FLOOR), ROOM.wall, { angle: Math.PI / 2, width: 11, thick: 0.4, base: 0.4, len: [200, 420], jitter: 0.01 });
    L.line([[x, 0], [x, FLOOR]]); L.line([[x + 22, 0], [x + 22, FLOOR]]);
  }
  if (pane) {
    L.shade(rect(0, A.y - 12, 1080, 20), 0.14);
    L.area(rect(0, A.y - 20, 1080, 20), ROOM.wall, { angle: 0, width: 10, thick: 0.4, base: 0.42, len: [300, 600], jitter: 0.005 });
    L.line([[0, A.y - 20], [1080, A.y - 20]]); L.line([[0, A.y], [1080, A.y]]);
  }
}

/** The floor in front of the window: carpet for the build, a drop cloth for the painting. */
export function floor(L, cloth = false) {
  const R = L.R, top = FLOOR - 16;
  if (!cloth) {
    L.area(rect(0, top - 14, 1080, 16), ROOM.wall, { angle: 0, width: 8, thick: 0.4, base: 0.45, len: [300, 700], jitter: 0.004 });
    L.line([[0, top - 14], [1080, top - 14]], { alpha: 0.4 });
    carpet(L, rect(0, top, 1080, 1080 - top));
    L.shade(rect(0, top, 1080, 10), 0.22, 6);
    return;
  }
  L.area(rect(0, top, 1080, 1080 - top), ROOM.cloth, { colors: [ROOM.cloth, [238, 236, 230], [224, 221, 214]], angle: 0.12, width: 30, thick: 0.22, len: [120, 300], jitter: 0.12 });
  L.line([[0, top], [1080, top + 2]], { alpha: 0.4 });
  for (let i = 0; i < 9; i++) { // folds: a soft shadow under each
    const y = FLOOR + 30 + i * 34 + rd(R, -12, 12), x = rd(R, -60, 560), l = rd(R, 260, 560), b = rd(R, -30, 30), e = rd(R, -26, 26);
    const top_ = [[x, y], [x + l * 0.3, y + b], [x + l * 0.65, y + b * 0.3], [x + l, y + e]];
    L.shade([...top_, [x + l * 0.6, y + b * 0.3 + rd(R, 12, 22)], [x + l * 0.25, y + b + rd(R, 10, 18)]], 0.14);
  }
  for (let i = 0; i < 14; i++) L.blob(rd(R, 300, 900), rd(R, FLOOR + 20, 1060), rd(R, 2, 5), rd(R, 2, 4), 0, [OIL.red, OIL.blue, OIL.yellow, OIL.green][i % 4], { thick: 0.8, base: 0.3 });
}

// ---------- wood, frame, fabric ----------

/** A pine bar filling `poly`, grain along `angle`. */
export function wood(L, poly, angle, lift = 5) {
  L.shade(poly.map(([x, y]) => [x + lift, y + lift * 1.2]), 0.22, 2 + lift * 0.6);
  L.area(poly, ROOM.pine, { colors: [ROOM.pine, ROOM.pine2, ROOM.pine3, ROOM.pine], angle, width: 7, thick: 0.2, base: 0.56, len: [120, 420], jitter: 0.008, dry: 0.05, vary: 0.03 });
  L.line([...poly, poly[0]], { alpha: 0.42, width: 1.3 });
}

/** The four sides and two braces of the 3 ft × 4 ft frame, as rectangles: [poly, grain angle]. */
export const BARS = {
  top: [rect(A.x, A.y, A.w, SW), 0], bottom: [rect(A.x, A.y + A.h - SW, A.w, SW), 0],
  left: [rect(A.x, A.y + SW, SW, A.h - 2 * SW), Math.PI / 2], right: [rect(A.x + A.w - SW, A.y + SW, SW, A.h - 2 * SW), Math.PI / 2],
  upright: [rect(CX - SW / 2, A.y + SW, SW, A.h - 2 * SW), Math.PI / 2], cross: [rect(A.x + SW, CY - SW / 2, A.w - 2 * SW, SW), 0],
};
/** Where the flat brackets sit: the four corners, then the four brace ends. */
export const JOINTS = [[A.x + 15, A.y + 15], [A.x + A.w - 15, A.y + 15], [A.x + A.w - 15, A.y + A.h - 15], [A.x + 15, A.y + A.h - 15],
  [CX, A.y + 15], [A.x + A.w - 15, CY], [CX, A.y + A.h - 15], [A.x + 15, CY]];

export function bracket(L, x, y, turn = 0) {
  L.shade(rect(x - 13, y - 12, 30, 30), 0.2, 2);
  L.area(rect(x - 15, y - 15, 30, 30), ROOM.steel, { colors: [ROOM.steel, [196, 200, 208]], angle: 0.78, width: 5, thick: 0.15, base: 0.72, len: [20, 50], dry: 0 });
  L.line([...rect(x - 15, y - 15, 30, 30), [x - 15, y - 15]], { alpha: 0.5, width: 1.2 });
  for (const d of [-7, 7]) screw(L, x + d, y - d, turn + d);
}
export function screw(L, x, y, turn = 0, r = 3.6) {
  L.blob(x, y, r, r, 0, ROOM.iron, { thick: 0.5, base: 0.8 });
  L.S.col.strokeStyle = 'rgba(230,232,240,0.9)'; L.S.col.lineWidth = 1.2;
  L.S.col.beginPath(); L.S.col.moveTo(x - Math.cos(turn) * r * 0.8, y - Math.sin(turn) * r * 0.8); L.S.col.lineTo(x + Math.cos(turn) * r * 0.8, y + Math.sin(turn) * r * 0.8); L.S.col.stroke();
}

/** The whole frame, from the back. */
export function frame(L, brackets = true) {
  for (const k of ['upright', 'cross', 'left', 'right', 'top', 'bottom']) wood(L, ...BARS[k], k === 'upright' || k === 'cross' ? 3 : 5);
  if (brackets) JOINTS.forEach(([x, y]) => bracket(L, x, y));
}

/** Raw canvas cloth over `poly`: thin, the weave showing through. */
export function linen(L, poly, o = {}) {
  L.area(poly, ROOM.linen, { colors: [ROOM.linen, ROOM.linen2, ROOM.linen3], angle: o.angle ?? 0, width: 9, thick: 0.1, base: o.base ?? 0.3, len: [60, 200], jitter: 0.01, dry: 0.5, vary: 0.03 });
}
export const FABRIC = rect(A.x - 84, A.y - 84, A.w + 168, A.h + 168);

/** A staple, across an edge that runs along `ang`. */
export function staple(L, x, y, ang) {
  const at = frameAt(x, y, ang);
  L.stroke([at(-7), at(7)], [120, 124, 140], 2.6, { thick: 0.5, base: 0.8, dry: 0, vary: 0 });
}

/** The stretched canvas from the front: its edge, its face. face: 'linen' or 'gesso'. */
export function face(L, kind = 'gesso', guesses = false) {
  const { x, y, w, h } = A;
  L.area(rect(x + w, y + 3, 12, h - 3), ROOM.linen, { colors: [[214, 204, 182], [200, 190, 168]], angle: Math.PI / 2, width: 6, thick: 0.2, base: 0.5, len: [80, 200] });
  if (kind === 'linen') linen(L, rect(x, y, w, h), { base: 0.5 });
  else L.area(rect(x, y, w, h), ROOM.gesso, { colors: [ROOM.gesso, [246, 244, 237], [252, 251, 246]], angle: 0.02, width: 40, thick: 0.16, base: 0.55, len: [240, 520], jitter: 0.03, dry: 0.3 });
  if (guesses) for (const [bx, by, br] of BIG) L.line(arc(x + bx, y + by, br, br * 0.94, L.R() * 360, L.R() * 360 + 380, 28), { alpha: 0.2, width: 1.2 });
  L.line([[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]], { alpha: 0.35 });
}
/** The shadow a leaning canvas throws on the glass and the floor. */
export const leanShadow = (L) => L.shade([[A.x + 16, A.y + 20], [A.x + A.w + 26, A.y + 20], [A.x + A.w + 40, FLOOR + 22], [A.x + 16, FLOOR + 22]], 0.34);

// ---------- tools ----------

/** A brush with its tip at (x, y), the handle running back along `ang`. w = width of the bristles. */
export function brushTool(L, x, y, ang, tip, w = 16, lift = 0.7) {
  const at = frameAt(x, y, ang), wide = w > 40;
  L.shade([at(0, -w / 2), at(250, -5), at(250, 5), at(0, w / 2)].map(([px, py]) => [px + 22, py + 26]), 0.24);
  L.stroke([at(wide ? 96 : 76), at(wide ? 250 : 290)], ROOM.pine, wide ? 22 : 9, { thick: 0.6, base: lift, dry: 0 });
  L.stroke([at(wide ? 52 : 36), at(wide ? 100 : 80)], ROOM.steel, w + (wide ? 4 : -2), { thick: 0.7, base: lift + 0.02, dry: 0 });
  L.stroke([at(0), at(wide ? 54 : 38)], tip, w, { thick: 0.9, base: lift, dry: 0.25 });
}
/** A palette knife, blade tip at (x, y). */
export function knifeTool(L, x, y, ang, tip) {
  const at = frameAt(x, y, ang);
  L.shade([at(0, -3), at(70, -12), at(250, -5), at(250, 5), at(70, 12)].map(([px, py]) => [px + 22, py + 26]), 0.24);
  L.stroke([at(120), at(260)], ROOM.pine, 12, { thick: 0.6, base: 0.7, dry: 0 });
  L.area([at(0, -2), at(60, -13), at(96, -9), at(124, -3), at(124, 3), at(96, 9), at(60, 13), at(0, 2)], ROOM.steel, { colors: [ROOM.steel, [206, 210, 218]], angle: ang, width: 5, thick: 0.15, base: 0.72, len: [40, 120], dry: 0 });
  L.blob(...at(24), 18, 9, ang, tip, { thick: 0.9, base: 0.8 });
}
export function pencilTool(L, x, y, ang) {
  const at = frameAt(x, y, ang);
  L.shade([at(0, -3), at(170, -6), at(170, 6), at(0, 3)].map(([px, py]) => [px + 14, py + 16]), 0.22, 5);
  L.stroke([at(16), at(170)], [236, 196, 70], 9, { thick: 0.5, base: 0.7, dry: 0 });
  L.stroke([at(4), at(18)], ROOM.pine, 7, { thick: 0.5, base: 0.7, dry: 0 });
  L.stroke([at(0), at(6)], [60, 60, 76], 3, { thick: 0.5, base: 0.7, dry: 0 });
}
/** A coping saw: the blade runs from (x, y) along `ang` for 120 px, the bow stands off to +v. */
export function saw(L, x, y, ang) {
  const at = frameAt(x, y, ang), sh = (p) => p.map(([px, py]) => [px + 18, py + 20]);
  L.shade(sh([at(0, 0), at(0, 86), at(120, 86), at(120, 0), at(120, 10), at(10, 76), at(0, 10)]), 0.2, 5);
  L.stroke([at(0, 0), at(-2, 80), at(8, 88), at(112, 88), at(122, 80), at(120, 0)], ROOM.steel, 7, { thick: 0.7, base: 0.72, dry: 0, vary: 0.03 });
  L.stroke([at(0, 0), at(120, 0)], [110, 114, 130], 2.4, { thick: 0.3, base: 0.7, dry: 0, vary: 0 });
  L.stroke([at(124, 0), at(210, 0)], ROOM.pine2, 20, { thick: 0.7, base: 0.74, dry: 0 });
}
export function sandBlock(L, x, y) {
  L.shade(rect(x - 68, y - 36, 150, 90), 0.28);
  L.area(rect(x - 76, y - 44, 152, 88), ROOM.red, { colors: [ROOM.red, [190, 46, 40], [220, 76, 62]], angle: 0, width: 12, thick: 0.4, base: 0.78, len: [60, 150], dry: 0.05 });
  L.line([...rect(x - 76, y - 44, 152, 88), [x - 76, y - 44]], { alpha: 0.4 });
}
/** A drill from above, bit at (x, y), body back along `ang`. */
export function drill(L, x, y, ang) {
  const at = frameAt(x, y, ang);
  L.shade([at(30, -24), at(170, -26), at(170, 60), at(110, 60), at(100, 26), at(30, 24)].map(([px, py]) => [px + 22, py + 26]), 0.26);
  L.stroke([at(2), at(34)], ROOM.steel, 5, { thick: 0.5, base: 0.74, dry: 0 });
  L.stroke([at(34), at(58)], [120, 124, 140], 20, { thick: 0.6, base: 0.76, dry: 0 });
  L.stroke([at(64), at(160)], [86, 132, 138], 46, { thick: 0.7, base: 0.8, dry: 0, vary: 0.04 });
  L.stroke([at(130, 26), at(134, 84)], [70, 108, 114], 36, { thick: 0.7, base: 0.78, dry: 0, vary: 0.04 });
}
/** A staple gun from above, nose at (x, y), body back along `ang`. squash 0..1. */
export function stapler(L, x, y, ang, squash = 0) {
  const at = frameAt(x, y, ang), k = 1 - 0.14 * squash;
  L.shade([at(0, -22), at(150 * k, -26), at(150 * k, 26), at(0, 22)].map(([px, py]) => [px + 18 - 8 * squash, py + 22 - 10 * squash]), 0.28);
  L.stroke([at(8), at(140 * k)], ROOM.steel, 44, { thick: 0.7, base: 0.8, dry: 0, vary: 0.03 });
  L.stroke([at(40 * k), at(150 * k)], [150, 154, 168], 22, { thick: 0.8, base: 0.86, dry: 0, vary: 0.03 });
  L.stroke([at(0, -14), at(0, 14)], [110, 114, 130], 7, { thick: 0.5, base: 0.8, dry: 0 });
}
/** Scissors, blade tips at (x, y), handles back along `ang`. open 0..1. */
export function scissors(L, x, y, ang, open = 0.5) {
  const at = frameAt(x, y, ang), sp = 0.1 + open * 0.22;
  L.shade([at(0, 0), at(180, -40), at(180, 40)].map(([px, py]) => [px + 14, py + 18]), 0.16, 6);
  for (const s of [-1, 1]) {
    const b = frameAt(...at(92), ang + s * sp);
    L.stroke([b(-92), b(0)], ROOM.steel, 9, { thick: 0.5, base: 0.74, dry: 0 });
    const ring = arc(...b(64, s * 4), 26, 19, 0, 360, 22).map(([px, py]) => { const [qx, qy] = b(64, s * 4); const c = Math.cos(ang + s * sp), sn = Math.sin(ang + s * sp); const dx = px - qx, dy = py - qy; return [qx + c * dx - sn * dy, qy + sn * dx + c * dy]; });
    L.stroke([b(0), b(40, s * 2)], ROOM.red, 8, { thick: 0.6, base: 0.76, dry: 0 });
    L.stroke(ring, ROOM.red, 8, { thick: 0.6, base: 0.76, dry: 0 });
  }
  L.blob(...at(92), 4, 4, 0, ROOM.iron, { thick: 0.5, base: 0.84 });
}
export function tube(L, x, y, ang, c) {
  const at = frameAt(x, y, ang);
  L.shade([at(0, -12), at(70, -12), at(70, 12), at(0, 12)].map(([px, py]) => [px + 6, py + 9]), 0.2, 4);
  L.stroke([at(0), at(58)], [222, 222, 226], 24, { thick: 0.7, base: 0.6, dry: 0 });
  L.stroke([at(16), at(40)], c, 24, { thick: 0.75, base: 0.62, dry: 0 });
  L.stroke([at(60), at(70)], [60, 60, 70], 11, { thick: 0.8, base: 0.6, dry: 0 });
}
/** A tub of gesso from above. */
export function tub(L, x, y, r = 62) {
  L.shade(arc(x + 14, y + 18, r, r, 0, 360, 30), 0.26);
  L.stroke(arc(x, y, r - 5, r - 5, 0, 360, 40), [238, 238, 242], 12, { thick: 0.9, base: 0.74, dry: 0, vary: 0.02 });
  for (let i = 0; i < 14; i++) { const a = L.R() * 6.283, d = Math.sqrt(L.R()) * (r - 20); L.blob(x + Math.cos(a) * d, y + Math.sin(a) * d, rd(L.R, 14, 24), rd(L.R, 9, 14), a + 1.6, ROOM.gesso, { thick: 0.7, base: 0.6 }); }
}
/** A bolt of raw canvas, rolled, lying along x from x0 to x1. */
export function bolt(L, x0, x1, y, r = 36) {
  L.shade(rect(x0 + 8, y - r + 14, x1 - x0, r * 2), 0.26);
  for (const [dv, b, w] of [[-r * 0.6, 0.55, r * 0.9], [r * 0.6, 0.5, r * 0.9], [0, 0.72, r * 1.1]]) L.stroke([[x0, y + dv], [x1, y + dv]], dv ? ROOM.linen2 : ROOM.linen3, w, { thick: 0.5, base: b, dry: 0, vary: 0.03 });
  L.line([[x0, y - r], [x1, y - r]], { alpha: 0.3 }); L.line([[x0, y + r], [x1, y + r]], { alpha: 0.4 });
  L.stroke(arc(x1, y, 8, r - 4, 0, 360, 24), ROOM.linen2, 5, { thick: 0.4, base: 0.74, dry: 0 });
}
export function stapleBox(L, x, y) {
  L.shade(rect(x + 8, y + 10, 86, 58), 0.24);
  L.area(rect(x, y, 86, 58), [70, 74, 92], { colors: [[70, 74, 92], [84, 88, 108]], angle: 0, width: 9, thick: 0.3, base: 0.7, len: [40, 90], dry: 0 });
  L.area(rect(x + 8, y + 10, 70, 14), [222, 222, 228], { angle: 0, width: 5, thick: 0.2, base: 0.76, len: [30, 70], dry: 0 });
}
/** The painter's corner of the drop cloth: palette, medium, tubes, a rag, and brushes at rest. */
export function paintKit(L, resting = []) {
  const R = L.R, O = OIL;
  const pal = arc(196, 920, 150, 78, 0, 360, 36).map(([x, y]) => [x + (y - 920) * 0.25, y]);
  L.shade(pal.map(([x, y]) => [x + 10, y + 12]), 0.2);
  L.area(pal, ROOM.pine, { colors: [ROOM.pine, [220, 192, 140], [236, 216, 172]], angle: 0.1, width: 13, thick: 0.25, base: 0.42, len: [90, 240] });
  L.line([...pal, pal[0]], { alpha: 0.5 });
  [O.green, O.white, O.yellow, O.red, O.blue, O.orange].forEach((c, i) => {
    const x = 96 + i * 38 + i * i * 0.6, y = 876 + Math.abs(i - 2.5) * 4;
    for (let k = 0; k < 4; k++) L.blob(x + rd(R, -5, 5), y + rd(R, -4, 4), rd(R, 9, 14), rd(R, 7, 10), rd(R, 0, 3), mix(c, [255, 255, 255], rd(R, 0, 0.12)), { thick: 1, base: 0.5 });
  });
  for (const [c, x, y] of [[mix(O.blue, O.white, 0.4), 170, 940], [mix(O.yellow, O.red, 0.4), 250, 950], [mix(O.green, O.yellow, 0.4), 210, 968]]) {
    L.stroke([[x - 30, y + rd(R, -6, 6)], [x, y + rd(R, -8, 8)], [x + 34, y + rd(R, -6, 6)]], c, 20, { thick: 0.7, base: 0.46, knife: true });
  }
  // the medium, in a jar, seen from a little above
  L.shade(arc(452, 936, 40, 16, 0, 360, 24), 0.26);
  L.area([[400, 862], [472, 862], [468, 934], [404, 934]], [206, 170, 96], { colors: [[206, 170, 96], [224, 196, 130], [186, 146, 76]], angle: Math.PI / 2, width: 9, thick: 0.25, base: 0.5, len: [50, 90] });
  L.blob(436, 934, 32, 9, 0, [190, 150, 82], { thick: 0.4, base: 0.5 });
  L.blob(436, 862, 36, 11, 0, [226, 204, 150], { thick: 0.3, base: 0.56 });
  L.stroke(arc(436, 862, 36, 11, 0, 360, 28), [240, 240, 236], 4, { thick: 0.6, base: 0.6, dry: 0 });
  for (let i = 0; i < 26; i++) { // the blue rag
    const a = rd(R, 0, 6.283), r = Math.sqrt(R()), x = 944 + Math.cos(a) * r * 60, y = 850 + Math.sin(a) * r * 30;
    L.stroke([[x, y], [x + rd(R, -30, 30), y + rd(R, -18, 18)]], mix([70, 130, 210], [255, 255, 255], rd(R, 0, 0.3)), rd(R, 10, 18), { thick: 0.9, base: 0.45 });
  }
  [[900, O.yellow, -1.77], [946, O.blue, -1.42], [992, O.red, -1.62]].forEach(([x, c, a]) => tube(L, x, 1000, a, c));
  resting.forEach(([x, y, a, c, w]) => brushTool(L, x, y, a, c, w ?? 13, 0.5));
}
