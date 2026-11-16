// Things drawn flat on the sheet, in screen space: the carpenter's pencil,
// a work glove, sunlit dust.

import { chaikin } from '../../lib/draw/line.js';
import { mul32, rd } from '../../lib/draw/rng.js';
import { fill, glaze, line, place, trace } from './kit.js';

export const SUN = [242, 181, 68];

/**
 * A flat carpenter's pencil with its tip at `tip`, its body running off at
 * `ang`. lift (0..1) raises it off the paper: its shadow drifts away and softens.
 */
export function carpenterPencil(R, tip, ang, lift = 0, sc = 1) {
  const at = (pts) => place(pts, tip[0], tip[1], ang, sc);
  const all = [[0, 0], [60, -19], [640, -19], [640, 19], [60, 19]];
  glaze((p) => {
    p.filter = `blur(${(5 + lift * 16) * sc}px)`;
    p.fillStyle = `rgba(60,50,80,${0.5 - lift * 0.22})`;
    trace(p, place(all, tip[0] + (8 + lift * 34) * sc, tip[1] + (11 + lift * 44) * sc, ang, sc)); p.fill();
  });
  const a = ang;
  fill(at([[60, -19], [640, -19], [640, -5], [60, -5]]), 'rgb(246,196,92)', a);
  fill(at([[60, -5], [640, -5], [640, 19], [60, 19]]), 'rgb(226,160,58)', a, { dense: true });
  fill(at([[13, -4.2], [60, -19], [60, -5], [36, 0]]), 'rgb(244,226,194)', a + 0.3);
  fill(at([[13, 4.2], [36, 0], [60, -5], [60, 19]]), 'rgb(222,196,158)', a + 0.3);
  fill(at([[0, 0], [13, -4.2], [13, 4.2]]), 'rgb(62,58,74)', a, { dense: true });
  line(R, at([[0, 0], [60, -19], [640, -19]]), { alpha: 0.75 });
  line(R, at([[0, 0], [60, 19], [640, 19]]), { alpha: 0.8, width: 2 });
  line(R, at([[60, -19], [70, -6], [60, 19]]), { alpha: 0.5, width: 1.3 });
  line(R, at([[66, -5], [640, -5]]), { alpha: 0.3, width: 1.2 });
}

const smooth = (pts) => chaikin(pts, true, 2);
/**
 * A leather work glove gripping something, seen from the back of the hand.
 * Knuckles at (x, y), fingers pointing along `ang`, the sleeve running back
 * out of frame. `curl` (0..1) shortens the fingers as they wrap over an edge.
 */
export function glove(R, x, y, ang, sc = 1, curl = 0.6) {
  const at = (pts) => place(pts, x, y, ang, sc);
  glaze((p) => { p.filter = 'blur(9px)'; p.fillStyle = 'rgba(60,50,80,0.4)'; trace(p, place([[-10, -52], [70, -52], [70, 52], [-10, 52], [-520, 76], [-520, -76]], x + 9, y + 13, ang, sc)); p.fill(); });
  fill(at([[-96, -44], [-640, -70], [-640, 70], [-96, 44]]), 'rgb(120,124,146)', ang, { dense: true });
  line(R, at([[-96, -44], [-640, -70]]), { alpha: 0.7 }); line(R, at([[-96, 44], [-640, 70]]), { alpha: 0.7 });
  fill(at(smooth([[-120, -50], [-84, -52], [-84, 52], [-120, 50]])), 'rgb(200,160,108)', ang + 1.57);
  line(R, at([[-120, -50], [-84, -52], [-84, 52], [-120, 50]]), { alpha: 0.6 });
  const palm = at(smooth([[-90, -46], [-30, -54], [8, -50], [14, 0], [8, 50], [-30, 54], [-90, 46]]));
  fill(palm, 'rgb(226,188,132)', ang + 0.4);
  line(R, [...palm, palm[0]], { alpha: 0.75 });
  const len = 62 - 26 * curl;
  for (let i = 0; i < 4; i++) {
    const fy = -39 + i * 26, l = len * (i === 0 || i === 3 ? 0.86 : 1);
    const f = at(smooth([[0, fy - 11], [l, fy - 10], [l + 9, fy], [l, fy + 10], [0, fy + 11]]));
    fill(f, i % 2 ? 'rgb(232,196,142)' : 'rgb(220,180,124)', ang);
    line(R, [...f, f[0]], { alpha: 0.7, width: 1.4 });
  }
  const th = at(smooth([[-66, 40], [-30, 58], [4, 78], [18, 70], [-8, 46], [-40, 30]]));
  fill(th, 'rgb(214,172,116)', ang + 0.5);
  line(R, [...th, th[0]], { alpha: 0.7, width: 1.4 });
  line(R, at([[-70, -20], [-28, -24]]), { alpha: 0.35, width: 1.2 }); line(R, at([[-70, 8], [-28, 6]]), { alpha: 0.35, width: 1.2 });
}

/** A seeded cloud of particles: [{ a: launch angle, v: speed, r: size, k: 0..1, tb: birth 0..1 }]. */
export const particles = (seed, n, o = {}) => {
  const G = mul32(seed), { a = [-3.1, -1.6], v = [200, 900], r = [1, 3.2], tb = [0, 1] } = o;
  return Array.from({ length: n }, () => ({ a: rd(G, ...a), v: rd(G, ...v), r: rd(G, ...r), k: G(), tb: rd(G, ...tb), j: G() }));
};

/** Dust motes hanging in a shaft of light: slow, drifting, on the finished frame. */
export function motes(ctx, sec, seed, box, n = 60, alpha = 0.5) {
  const G = mul32(seed), [x0, y0, x1, y1] = box;
  for (let i = 0; i < n; i++) {
    const bx = rd(G, x0, x1), by = rd(G, y0, y1), ph = rd(G, 0, 6.28), sp = rd(G, 0.2, 0.7), r = rd(G, 0.8, 2.4);
    const x = bx + 26 * Math.sin(sec * sp + ph) + sec * 5, y = by + 16 * Math.cos(sec * sp * 0.8 + ph * 2) + sec * 3;
    const tw = 0.5 + 0.5 * Math.sin(sec * sp * 3 + ph * 3);
    ctx.fillStyle = `rgba(250,206,120,${alpha * tw})`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.3); ctx.fill();
  }
}
