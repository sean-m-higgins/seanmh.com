// Scene 12, "home": the finished table indoors, window light passing through
// its glass. The room is generic (there is no photo of it): a white couch,
// a rug, a board floor, coffee-table books on the shelf, two coasters.

import { pencil } from '../../lib/draw/line.js';
import { mul32, rd } from '../../lib/draw/rng.js';
import { signature, span, easeInOut } from '../common.js';
import { TABLE as T, camera, projectPoly, box, cyl, norm } from './geom.js';
import { A, PEN, rgb, trace, background, fill, glaze, line, solid, shadow, compose, vee3 } from './kit.js';
import { STAIN, tableParts, sortParts, drawParts } from './table.js';

export const PIN = [-3, T.H, T.D / 2 - 2.4];
export const homeCamera = () => camera({ eye: [24, 30, 60], target: [-4, 10, -16], f: 1180, pin: PIN, at: A });
const P = homeCamera();
const LT = { dir: norm([-0.7, 0.62, 0.25]), sun: [1.05, 0.98, 0.8], amb: [0.44, 0.45, 0.56], fill: { dir: norm([0.5, 0.3, 0.8]), k: 0.2 } };
const ROOM = { ...LT, sun: [0.3, 0.29, 0.26], amb: [0.7, 0.7, 0.76] };
const PARTS = sortParts(P, tableParts());
const onFloor = (q) => { const t = q[1] / LT.dir[1]; return [q[0] - LT.dir[0] * t, 0, q[2] - LT.dir[2] * t]; };

// A tall window in the left wall, off frame: six panes of sun on the floor.
const PANES = [];
for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) {
  const z0 = 6 + i * 29, y0 = 30 + j * 30;
  PANES.push([[-90, y0 + 27, z0], [-90, y0 + 27, z0 + 26], [-90, y0, z0 + 26], [-90, y0, z0]].map(onFloor));
}
const PATCH = [[-90, 118, 4], [-90, 118, 64], [-90, 28, 64], [-90, 28, 4]].map(onFloor);
const floorAng = (() => { const a = P([0, 0, 0]), b = P([10, 0, 0]); return Math.atan2(b[1] - a[1], b[0] - a[0]); })();
const quad = (x0, x1, z0, z1, y = 0) => projectPoly(P, [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]]);

const COUCH = { c: [246, 243, 238], line: 0.5, press: 0.8 };
const BOOKS = [
  { b: box(-13, -1, 4.0, 5.2, -6, 5), c: [58, 78, 118] },
  { b: box(-12, -2.5, 5.2, 6.1, -5, 3.5), c: [178, 96, 66] },
  { b: box(4, 14, 4.0, 5.5, -5, 5), c: [122, 140, 112] },
];
const COASTERS = [cyl([8, T.H, -1.5], [0, 1, 0], 1.9, 0.25, 24), cyl([12.5, T.H, T.D / 2 - 2.5], [0, 1, 0], 1.9, 0.25, 24)];

function room(S) {
  // Wall and floor, drawn as if lit; the room's shade goes over them afterwards.
  fill(projectPoly(P, [[-200, 150, -80], [200, 150, -80], [200, 0, -80], [-200, 0, -80]]), 'rgb(222,212,200)', 1.5, { press: 0.6 });
  fill(quad(-200, 200, -80, 56), 'rgb(240,208,162)', floorAng);
  glaze((p) => {
    const G = mul32(404);
    p.lineCap = 'round';
    for (let z = -78; z < 50; z += 5.2) {
      const l = projectPoly(P, [[-200, 0, z], [200, 0, z]]);
      if (l.length < 2) continue;
      p.strokeStyle = `rgba(96,62,40,${rd(G, 0.25, 0.5)})`; p.lineWidth = rd(G, 0.9, 1.8);
      p.beginPath(); p.moveTo(...l[0]); p.lineTo(...l[1]); p.stroke();
      for (let k = 0; k < 7; k++) { const x = rd(G, -150, 150), e = projectPoly(P, [[x, 0, z], [x, 0, z + 5.2]], 6); if (e.length === 2) { p.beginPath(); p.moveTo(...e[0]); p.lineTo(...e[1]); p.stroke(); } }
    }
  });
  solid(P, box(-200, 200, 0, 4.5, -80, -79.2), { c: [244, 240, 232], line: 0.4 }, ROOM, { R: S, key: 'base' });
  // The couch: frame, arms, seat and back cushions, two pillows.
  const cz0 = -76, cz1 = -40, cx = 46;
  glaze((p) => { p.filter = 'blur(12px)'; p.fillStyle = 'rgba(70,52,60,0.45)'; trace(p, quad(-cx - 2, cx + 6, cz0, cz1 + 5)); p.fill(); });
  const soft = (b, key, mat = COUCH) => solid(P, b, mat, ROOM, { R: S, key, round: 14, lineOpts: { amp: 1.4, width: 1.6 } });
  for (const fx of [-cx + 3, cx - 3]) solid(P, box(fx - 1.5, fx + 1.5, 0, 3, cz1 - 4.5, cz1 - 1.5), { c: [90, 70, 62], line: 0.7, dense: true }, ROOM, { R: S, key: 'foot' });
  soft(box(-cx, cx, 3, 30, cz0, cz0 + 8), 'c-back');
  soft(box(-cx, -cx + 8, 3, 25, cz0, cz1), 'c-armL');
  soft(box(-cx + 8, -0.4, 11, 33, cz0 + 8, cz0 + 17), 'c-bk1');
  soft(box(0.4, cx - 8, 11, 33, cz0 + 8, cz0 + 17), 'c-bk2');
  soft(box(-cx + 8, cx - 8, 3, 11, cz0 + 8, cz1), 'c-base');
  soft(box(-cx + 8, -0.4, 11, 18, cz0 + 17, cz1 + 1.5), 'c-seat1');
  soft(box(0.4, cx - 8, 11, 18, cz0 + 17, cz1 + 1.5), 'c-seat2');
  soft(box(-34, -19, 18, 31, cz0 + 17, cz0 + 21), 'pil1', { c: [226, 196, 150], line: 0.55 });
  soft(box(20, 35, 18, 31, cz0 + 17, cz0 + 21), 'pil2', { c: [150, 164, 190], line: 0.55 });
  soft(box(cx - 8, cx, 3, 25, cz0, cz1), 'c-armR');
  // The rug, then the room's shade over everything the window light misses.
  const rug = quad(-34, 38, -27, 30, 0.05);
  fill(rug, 'rgb(236,232,224)', floorAng + 1.2, { press: 0.7 });
  line(S, [...rug, rug[0]], { alpha: 0.5, width: 1.5 });
  const inner = quad(-30.5, 34.5, -23.5, 26.5, 0.05);
  line(S, [...inner, inner[0]], { alpha: 0.35, width: 1.2, color: [70, 86, 130] });
  glaze((p) => {
    p.beginPath(); p.rect(-20, -20, 1120, 1120);
    for (const pane of PANES) { const q = pane.map(P); p.moveTo(...q[0]); for (const v of q.slice(1)) p.lineTo(...v); p.closePath(); }
    p.clip('evenodd');
    p.beginPath(); const fl = quad(-200, 200, -80, 56); trace(p, fl); p.clip();
    p.globalCompositeOperation = 'multiply'; p.fillStyle = 'rgb(200,182,190)'; p.fillRect(0, 0, 1080, 1080);
  });
  // The table's shadow in the light: the frame's shadow, with the glass letting the sun through.
  const casters = [...PARTS.map((x) => x.faces), ...BOOKS.map((x) => x.b)];
  shadow(P, casters, 0, LT, PATCH.map(P), { alpha: 1, blur: 2.5, color: [196, 176, 188] });
  const gx = T.glass.L / 2, gz = T.glass.D / 2;
  const caustic = [[-gx, T.H, -gz], [gx, T.H, -gz], [gx, T.H, gz], [-gx, T.H, gz]].map((q) => P(onFloor(q)));
  glaze((p) => {
    p.save(); trace(p, caustic); p.clip();
    p.globalCompositeOperation = 'multiply'; p.fillStyle = 'rgba(206,232,222,0.6)'; p.fillRect(0, 0, 1080, 1080);
    p.restore();
    p.strokeStyle = 'rgba(255,252,236,0.8)'; p.lineWidth = 2.5; p.filter = 'blur(1.2px)'; trace(p, caustic); p.stroke();
  });
  // Where the legs meet the floor, and the dimness under the shelf.
  glaze((p) => { p.filter = 'blur(16px)'; p.fillStyle = 'rgba(60,44,56,0.3)'; trace(p, quad(-17, 19, -11, 11)); p.fill(); });
  glaze((p) => { p.filter = 'blur(7px)'; p.fillStyle = 'rgba(50,34,40,0.5)'; for (const part of PARTS.filter((x) => x.group === 'leg')) { const c = part.faces[1].pts; trace(p, projectPoly(P, c.map(([x, y, z]) => [x + 0.8, 0, z + 0.8]))); p.fill(); } });
}

let F = null;
function glassPass(g) {
  const gx = T.glass.L / 2, gz = T.glass.D / 2, y = T.H - 0.02;
  const q = [[-gx, y, -gz], [gx, y, -gz], [gx, y, gz], [-gx, y, gz]].map(P);
  const mid = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  g.lineCap = 'round'; g.lineJoin = 'round'; // set first: this canvas keeps its state between frames
  g.save();
  trace(g, q); g.clip();
  // Refraction: what lies under the pane, doubled a few pixels away.
  g.globalAlpha = 0.4; g.drawImage(g.canvas, 4, 8); g.globalAlpha = 1;
  const lg = g.createLinearGradient(...q[3], ...q[1]);
  lg.addColorStop(0, 'rgba(140,190,178,0.10)'); lg.addColorStop(1, 'rgba(110,168,160,0.34)');
  g.fillStyle = lg; g.fillRect(0, 0, 1080, 1080);
  // The window, reflected: two soft panes of sky.
  g.filter = 'blur(9px)';
  for (const [u0, u1] of [[0.06, 0.26], [0.3, 0.5]]) {
    g.fillStyle = 'rgba(244,250,250,0.62)';
    trace(g, [mid(q[0], q[1], u0), mid(q[0], q[1], u1), mid(q[3], q[2], u1 - 0.1), mid(q[3], q[2], u0 - 0.1)]); g.fill();
  }
  g.filter = 'blur(1.5px)'; g.strokeStyle = 'rgba(255,255,250,0.8)'; g.lineWidth = 2.5;
  g.beginPath(); g.moveTo(...mid(q[0], q[1], 0.56)); g.lineTo(...mid(q[3], q[2], 0.46)); g.stroke();
  g.restore();
  // The pane's thickness, seen at its near edges.
  g.lineCap = 'round';
  g.strokeStyle = 'rgba(80,140,126,0.9)'; g.lineWidth = 2.4;
  g.beginPath(); g.moveTo(...q[3]); g.lineTo(...q[2]); g.lineTo(...q[1]); g.stroke();
  g.strokeStyle = 'rgba(255,255,248,0.8)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(q[3][0], q[3][1] - 2.4); g.lineTo(q[2][0] - 2, q[2][1] - 2.4); g.stroke();
}

export const home = {
  id: 'home', dur: 6.5, step: 'finish',
  draw(ctx, t, R, env) {
    const S = env.still('home');
    background('home', () => room(S));
    const top = quad(-T.L / 2, T.L / 2, -T.D / 2, T.D / 2, T.H);
    const shelf = quad(-T.L / 2 + 2, T.L / 2 - 2, -T.D / 2 + 1, T.D / 2 - 1, T.shelfY + T.shelfT);
    let slats = 0;
    drawParts(P, PARTS, STAIN, LT, R, (part) => {
      if (part.group === 'slat' && ++slats === T.slats) return {
        after() {
          BOOKS.forEach((b, i) => solid(P, b.b, { c: b.c, line: 0.7, dense: true }, LT, { R, key: `book${i}` }));
          shadow(P, PARTS.filter((x) => x.group === 'rail').map((x) => x.faces), T.shelfY + T.shelfT, LT, shelf, { alpha: 0.5, blur: 2 });
        },
      };
      return null;
    });
    // Two coats of polyurethane: a slow sheen along the top.
    glaze((p) => {
      trace(p, top); p.clip();
      p.globalCompositeOperation = 'screen';
      const x = 200 + 500 * easeInOut(span(t, 0.05, 0.75));
      const lg = p.createLinearGradient(x - 130, 0, x + 130, 80);
      lg.addColorStop(0, 'rgba(255,236,200,0)'); lg.addColorStop(0.5, 'rgba(255,236,200,0.42)'); lg.addColorStop(1, 'rgba(255,236,200,0)');
      p.fillStyle = lg; p.fillRect(0, 0, 1080, 1080);
    });
    COASTERS.forEach((c, i) => solid(P, c, { c: [206, 160, 108], line: 0.7 }, LT, { R, key: `coaster${i}` }));
    F ??= Object.assign(document.createElement('canvas'), { width: 1080, height: 1080 });
    const g = F.getContext('2d');
    compose(g, env.paper);
    glassPass(g);
    COASTERS.slice(0, 1).forEach((c) => { g.save(); g.globalAlpha = 0.9; g.fillStyle = rgb([186, 140, 92]); trace(g, projectPoly(P, c[c.length - 1].pts)); g.fill(); g.restore(); });
    // The pencil mark, still there under the finish.
    vee3(g, R, P, PIN, { alpha: 0.7, color: [30, 14, 10], width: 2.8, s: 1.35 });
    // The one camera move: a slow push about the anchor, so the V never moves.
    const z = 1 + 0.1 * easeInOut(t);
    ctx.save();
    ctx.translate(A[0], A[1]); ctx.scale(z, z); ctx.translate(-A[0], -A[1]);
    ctx.drawImage(F, 0, 0);
    ctx.restore();
    signature(ctx, R, env.film, easeInOut(span(t, 0.55, 0.9)), { color: PEN });
  },
};
