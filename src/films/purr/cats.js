// Film 05 · purr — the four cats.
// Each cat is built from parts (ears, head, eyes, body, legs, tail) put down
// back to front in the kit's look: flat coat, a cel-shade crescent, a warm
// highlight, an ink line, coat markings clipped inside each part, and short
// fur marks. Poses are functions of a few live parameters (breath, blink, a
// head turn, an ear flick, the tail) so each scene animates them from time.
//
// Sunny is a tripod: no right hind leg and a bob tail. None of his poses ever
// draws a right hind leg, and he never has a long tail (see memory note and
// wiki/Films.md). His poses here are the curl, the loaf and the box peek.
// Tails are tapered (thick at the root, fine at the tip) and drawn by tail().

import { P, moved, ellipse, blob, poly, cel, ink, shape, tube, css, hex, mix, shadeOf, lightOf, INK, LIGHT, TAU, furMarks, mul32 } from './kit.js';

// ---------------------------------------------------------------- coats

export const COATS = {
  sunny: {
    name: 'sunny', base: hex('#a48a6a'), chest: hex('#e8dcc3'), stripe: hex('#4a3a2e'), stripeA: 0.8,
    eye: hex('#d4cf63'), eyeDark: hex('#7f8c30'), nose: hex('#c98676'), ear: hex('#dca394'),
    whisk: [252, 248, 236], muzzle: hex('#efe5d1'), tabby: true, tripod: true, bob: true, line: INK, fur: hex('#6d5a46'),
  },
  blue: {
    name: 'blue', base: hex('#8d97a8'), chest: hex('#a3acbb'), eye: hex('#93cf6e'), eyeDark: hex('#3f8a4a'),
    nose: hex('#5f6272'), ear: hex('#b3a8b8'), whisk: [246, 246, 250], line: hex('#2f2a36'), sheen: hex('#c9d2df'), fur: hex('#6b7487'),
  },
  black: {
    name: 'black', innerLine: hex('#4a3a42'), base: hex('#2e262c'), chest: hex('#3a3036'), shade: hex('#1a1419'), hi: hex('#7a5a50'),
    eye: hex('#f4b52e'), eyeDark: hex('#b96a14'), nose: hex('#43323a'), ear: hex('#6a4a4c'),
    whisk: [236, 230, 224], line: hex('#140e12'), fur: hex('#4e3f45'),
  },
  grey: {
    name: 'grey', base: hex('#4d4f55'), chest: hex('#f4f2ed'), stripe: hex('#a4a7ae'), stripeA: 0.7,
    eye: hex('#e9b443'), eyeDark: hex('#a86a1c'), nose: hex('#e79891'), ear: hex('#e8b0a6'),
    whisk: [250, 250, 248], muzzle: hex('#f6f4ef'), tabby: true, white: true, line: INK, fur: hex('#34363b'),
  },
};

const sh = (coat, k = 1) => coat.shade ?? shadeOf(coat.base, k, LIGHT.cool);
const hi = (coat) => coat.hi ?? lightOf(coat.base, 0.9, LIGHT.warm);

/** Put a coat part down: cel shading with the coat's colours, and its line. */
function part(ctx, path, coat, o = {}) {
  const base = o.base ?? coat.base;
  cel(ctx, path, base, {
    sd: o.sd ?? 16, hd: o.hd ?? 7,
    shade: o.shade ?? (o.base ? shadeOf(base, 1, LIGHT.cool) : sh(coat)),
    hi: o.hi ?? (o.base ? lightOf(base, 0.8, LIGHT.warm) : hi(coat)),
    inner: o.inner,
  });
  if (o.line !== false) ink(ctx, path, o.lw ?? 2.6, o.inside ? (coat.innerLine ?? shadeOf(coat.base, 2.2, LIGHT.cool)) : coat.line, o.la ?? 1);
}

/** A tapered stroke along points: stripes, fur, whiskers. */
export function taper(ctx, pts, w0, w1, c, a = 1) {
  const n = pts.length;
  if (n < 2) return;
  const L = [], Rr = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[Math.min(n - 1, i + 1)], o = pts[Math.max(0, i - 1)];
    const dx = q[0] - o[0], dy = q[1] - o[1], d = Math.hypot(dx, dy) || 1;
    const w = (w0 + (w1 - w0) * (i / (n - 1))) / 2;
    L.push([p[0] - (dy / d) * w, p[1] + (dx / d) * w]);
    Rr.push([p[0] + (dy / d) * w, p[1] - (dx / d) * w]);
  }
  ctx.fillStyle = css(c, a);
  ctx.fill(blob([...L, ...Rr.reverse()], true, 0.6));
}

/** Stripes as tapered strokes, each a list of 3 points, clipped to `clip`. */
function stripes(ctx, clip, list, coat, w = 12, a = coat.stripeA ?? 0.8) {
  if (!coat.tabby) return;
  ctx.save();
  ctx.clip(clip);
  for (const s of list) taper(ctx, s, s.w ?? w, 1.5, coat.stripe, a);
  ctx.restore();
}

/** Points along a Catmull-Rom curve through pts (open), n per segment. */
function along(pts, n = 10) {
  const out = [];
  const at = (i) => pts[Math.min(pts.length - 1, Math.max(0, i))];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((d) => 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/**
 * A tail: a tube along `pts` that tapers from w0 at the root to w1 at a
 * rounded tip, cel-shaded and inked like any other part, ringed on a tabby.
 */
export function tail(ctx, coat, pts, w0 = 32, w1 = 13, o = {}) {
  const c = along(pts, 10), n = c.length;
  const L = [], Rr = [];
  for (let i = 0; i < n; i++) {
    const a = c[Math.max(0, i - 1)], b = c[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    const u = i / (n - 1), w = (w0 + (w1 - w0) * Math.pow(u, 0.8)) / 2;
    L.push([c[i][0] - (dy / d) * w, c[i][1] + (dx / d) * w]);
    Rr.push([c[i][0] + (dy / d) * w, c[i][1] - (dx / d) * w]);
  }
  const path = new Path2D();
  L.forEach(([x, y], i) => (i ? path.lineTo(x, y) : path.moveTo(x, y)));
  const e = c[n - 1], q = c[n - 2], ea = Math.atan2(e[1] - q[1], e[0] - q[0]);
  path.arc(e[0], e[1], w1 / 2, ea + Math.PI / 2, ea - Math.PI / 2, true);
  for (let i = n - 1; i >= 0; i--) path.lineTo(Rr[i][0], Rr[i][1]);
  path.closePath();
  part(ctx, path, coat, {
    sd: w0 * 0.3, hd: w0 * 0.14, lw: o.lw ?? 2.6, base: o.base,
    inner: (g) => {
      if (coat.tabby && o.rings !== false) {
        g.strokeStyle = css(coat.stripe, (coat.stripeA ?? 0.8) * 0.9);
        g.lineCap = 'butt';
        for (let k = 3; k < n - 4; k += o.every ?? 7) {
          g.lineWidth = Math.max(4, w0 * 0.24 * (1 - k / n * 0.5));
          g.beginPath(); g.moveTo(L[k][0], L[k][1]); g.quadraticCurveTo(c[k][0] + (c[k + 1][0] - c[k][0]) * 2, c[k][1] + (c[k + 1][1] - c[k][1]) * 2, Rr[k][0], Rr[k][1]); g.stroke();
        }
      }
      if (coat.white && o.tip !== false) {
        g.fillStyle = css(coat.chest);
        const k = n - 6;
        g.beginPath(); g.moveTo(L[k][0], L[k][1]);
        for (let i = k; i < n; i++) g.lineTo(L[i][0], L[i][1]);
        g.arc(e[0], e[1], w1, ea + Math.PI / 2, ea - Math.PI / 2, true);
        for (let i = n - 1; i >= k; i--) g.lineTo(Rr[i][0], Rr[i][1]);
        g.fill();
      }
    },
  });
}

// ---------------------------------------------------------------- the head

const HEAD = P('M0 -86 C44 -86 80 -66 96 -30 C104 -12 108 6 110 22 L122 31 L106 38 L117 50 L98 53 C80 77 44 90 0 90 C-44 90 -80 77 -98 53 L-117 50 L-106 38 L-122 31 L-110 22 C-108 6 -104 -12 -96 -30 C-80 -66 -44 -86 0 -86 Z');
const EAR = P('M28 -74 C50 -100 80 -122 103 -131 C110 -100 108 -62 96 -28 Z');
const EAR_IN = P('M46 -72 C62 -92 82 -108 96 -115 C100 -92 98 -66 90 -42 Z');

function ear(ctx, coat, side, flick, yaw) {
  ctx.save();
  ctx.translate(yaw * 14, 0);
  ctx.scale(side, 1);
  // the ear on the far side of a turn foreshortens
  const far = Math.max(0, -side * yaw);
  ctx.translate(64, -54);
  ctx.rotate(flick);
  ctx.scale(1 - far * 0.35, 1);
  ctx.translate(-64, 54);
  part(ctx, EAR, coat, { sd: 10, hd: 5, lw: 2.6 });
  cel(ctx, EAR_IN, coat.ear, { sd: 8, hd: 0, shade: shadeOf(coat.ear, 1.2, LIGHT.cool) });
  // tufts of ear fur
  ctx.strokeStyle = css(coat.chest ?? coat.whisk, 0.85);
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const y = -60 - i * 9;
    ctx.moveTo(60 + i * 5, y + 10);
    ctx.quadraticCurveTo(72 + i * 3, y - 4, 76 + i * 4, y - 14);
  }
  ctx.stroke();
  ctx.restore();
}

function eye(ctx, coat, x, y, rx, ry, o) {
  const { blink = 0, look = [0, 0], pupil = 0.35, mode } = o;
  const side = Math.sign(x || 1);
  if (mode === 'sleep' || mode === 'happy' || blink > 0.93) {
    // A shut eye: a soft curve. Asleep it smiles down; content, it arcs up.
    const p = new Path2D();
    const up = mode === 'happy' ? -1 : 1;
    p.moveTo(x - rx, y + 2);
    p.quadraticCurveTo(x, y + up * ry * 0.45 + 2, x + rx, y - 1);
    ink(ctx, p, 3.6, coat.line);
    // lashes at the outer corner
    const l = new Path2D();
    l.moveTo(x + side * rx * 0.95, y);
    l.lineTo(x + side * (rx + 7), y - 4);
    ink(ctx, l, 2.2, coat.line);
    return;
  }
  const shapeP = blob([[x - rx, y + 3 * side], [x - rx * 0.2, y - ry], [x + rx, y - 3 * side], [x + rx * 0.15, y + ry]], true, 1.1);
  ctx.save();
  ctx.clip(shapeP);
  const g = ctx.createRadialGradient(x + look[0] * 0.5, y + ry * 0.25, 2, x, y, Math.max(rx, ry) * 1.1);
  g.addColorStop(0, css(lightOf(coat.eye, 0.6)));
  g.addColorStop(0.55, css(coat.eye));
  g.addColorStop(1, css(coat.eyeDark));
  ctx.fillStyle = g;
  ctx.fill(shapeP);
  // the lid's shadow along the top
  ctx.fillStyle = css(coat.eyeDark, 0.45);
  ctx.fillRect(x - rx - 4, y - ry - 4, rx * 2 + 8, ry * 0.55);
  // pupil
  const pw = rx * (0.16 + 0.5 * pupil);
  ctx.fillStyle = 'rgb(26,16,20)';
  ctx.fill(ellipse(x + look[0], y + look[1] + 1, pw, ry * 0.86));
  // highlights
  ctx.fillStyle = 'rgba(255,253,246,0.95)';
  ctx.fill(ellipse(x - rx * 0.3 + look[0] * 0.6, y - ry * 0.38 + look[1] * 0.5, rx * 0.26, ry * 0.2));
  ctx.fillStyle = 'rgba(255,253,246,0.7)';
  ctx.fill(ellipse(x + rx * 0.32 + look[0] * 0.6, y + ry * 0.4, rx * 0.11, ry * 0.08));
  // the lid closing
  if (blink > 0.02) {
    ctx.fillStyle = css(o.lid ?? coat.base);
    const yl = y - ry - 2 + (ry * 2 + 4) * blink;
    ctx.fillRect(x - rx - 4, y - ry - 6, rx * 2 + 8, yl - (y - ry - 6));
    const lid = new Path2D();
    lid.moveTo(x - rx - 2, yl + 2);
    lid.quadraticCurveTo(x, yl + 5, x + rx + 2, yl);
    ink(ctx, lid, 3.4, coat.line);
  }
  ctx.restore();
  // the line: heavy on the upper lid, light below
  ink(ctx, shapeP, 1.8, coat.line, 0.9);
  if (blink < 0.5) {
    const top = new Path2D();
    top.moveTo(x - rx - 1, y + 3 * side);
    top.bezierCurveTo(x - rx * 0.7, y - ry * 0.95, x + rx * 0.5, y - ry * 1.05, x + rx + 1, y - 3 * side);
    ink(ctx, top, 4, coat.line);
  }
}

/**
 * The head, centred on the origin (about 230 units wide).
 * o: yaw (-0.6..0.6), tilt (rad), blink, look [x, y], pupil (0 slit .. 1 round),
 *    mode ('open' | 'sleep' | 'happy'), earL / earR (flick angle, rad).
 */
export function head(ctx, coat, o = {}) {
  const { yaw = 0, tilt = 0, earL = 0, earR = 0, yawn = 0 } = o;
  ctx.save();
  ctx.rotate(tilt);
  ear(ctx, coat, -1, -earL - yawn * 0.3, yaw);
  ear(ctx, coat, 1, earR + yawn * 0.3, yaw);
  const fx = yaw * 24; // features slide with the turn
  if (yawn > 0.02) {
    // the lower jaw drops below the chin
    const jaw = ellipse(fx * 1.2, 70 + yawn * 26, 30 + yawn * 4, 16 + yawn * 10);
    part(ctx, jaw, coat, { base: coat.muzzle ?? coat.chest ?? coat.base, sd: 6, hd: 0, lw: 2.4 });
  }
  part(ctx, HEAD, coat, {
    sd: 18, hd: 8, lw: 2.8,
    inner: (g) => {
      if (coat.tabby) {
        // the tabby "M" and the cheek lines
        const S = [
          [[-26 + fx, -84], [-22 + fx, -66], [-14 + fx, -44]], [[0 + fx, -88], [0 + fx, -68], [1 + fx, -48]], [[26 + fx, -84], [22 + fx, -66], [15 + fx, -44]],
          [[-46 + fx, -78], [-40 + fx, -64], [-36 + fx, -52]], [[46 + fx, -78], [40 + fx, -64], [36 + fx, -52]],
          [[-64 + fx, 12], [-84, 6], [-108, 2]], [[64 + fx, 12], [84, 6], [108, 2]],
          [[-62 + fx, 30], [-86, 30], [-106, 34]], [[62 + fx, 30], [86, 30], [106, 34]],
        ];
        for (const s of S) taper(g, s, 9, 1.5, coat.stripe, coat.stripeA);
      }
      if (coat.white) {
        // a white blaze up the nose
        g.fillStyle = css(coat.chest);
        g.fill(blob([[fx - 6, -20], [fx + 6, -20], [fx + 22, 30], [fx, 60], [fx - 22, 30]], true, 1));
      }
      if (coat.sheen) {
        g.fillStyle = css(coat.sheen, 0.35);
        g.fill(ellipse(-30 + fx * 0.5, -58, 34, 14, -0.2));
      }
      furMarks(g, mul32(9), fx, 40, 80, 40, 18, sh(coat, 1.2), { len: 9, dir: 1.9, a: 0.35 });
    },
  });
  // muzzle
  if (coat.muzzle || coat.white) {
    const m = coat.muzzle ?? coat.chest;
    ctx.fillStyle = css(m);
    ctx.fill(ellipse(fx - 15, 46, 22, 16));
    ctx.fill(ellipse(fx + 15, 46, 22, 16));
    ctx.fill(ellipse(fx, 64, 20, 14));
  }
  const pupil = o.pupil ?? 0.35;
  const eo = { blink: o.blink ?? 0, look: o.look ?? [0, 0], pupil, mode: yawn > 0.25 ? 'happy' : o.mode, lid: o.lid };
  const er = (sgn) => 22 * (1 - 0.3 * Math.max(0, -sgn * yaw));
  eye(ctx, coat, -40 + fx * 1.05, 6, er(-1), 24, eo);
  eye(ctx, coat, 40 + fx * 1.05, 6, er(1), 24, eo);
  // nose and mouth
  const nx = fx * 1.2;
  const nose = P('M-10 30 C-10 25 10 25 10 30 C10 35 2 41 0 42 C-2 41 -10 35 -10 30 Z');
  ctx.save();
  ctx.translate(nx, 0);
  cel(ctx, nose, coat.nose, { sd: 3, hd: 3 });
  ink(ctx, nose, 1.8, coat.line);
  const mouth = new Path2D();
  mouth.moveTo(0, 42); mouth.lineTo(0, 48);
  if (yawn > 0.02) {
    // a yawn: the mouth opens wide, a curled pink tongue, two small fangs
    const my = 52 + yawn * 20, rx = 11 + yawn * 9, ry = 3 + yawn * 26;
    const open = ellipse(0, my, rx, ry);
    ctx.fillStyle = 'rgb(112,38,52)';
    ctx.fill(open);
    ctx.save();
    ctx.clip(open);
    ctx.fillStyle = 'rgb(232,128,134)';
    ctx.fill(ellipse(0, my + ry * 0.62, rx * 0.72, ry * 0.5));
    ctx.fillStyle = 'rgb(250,246,236)';
    for (const sg of [-1, 1]) ctx.fill(poly([[sg * rx * 0.72, my - ry], [sg * rx * 0.3, my - ry], [sg * rx * 0.5, my - ry + 5 + yawn * 9]]));
    ctx.restore();
    ink(ctx, open, 2.2, coat.line);
  } else {
    mouth.moveTo(-13, 50); mouth.quadraticCurveTo(-6, 56, 0, 48); mouth.quadraticCurveTo(6, 56, 13, 50);
    if (o.tongue !== undefined) {
      // licking its lips: a small tongue that sweeps from side to side (-1..1)
      const tg = ellipse(o.tongue * 9, 55 + Math.abs(o.tongue) * -3, 8, 6.5, o.tongue * 0.5);
      ctx.fillStyle = 'rgb(236,134,140)'; ctx.fill(tg); ink(ctx, tg, 1.6, coat.line);
    }
  }
  ink(ctx, mouth, 2, coat.line);
  ctx.restore();
  // whiskers
  ctx.save();
  ctx.strokeStyle = css(coat.whisk, 0.85);
  ctx.lineWidth = 1.3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const sgn of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const x0 = nx + sgn * 26, y0 = 44 + i * 6;
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(x0 + sgn * 70, y0 - 10 + i * 6, x0 + sgn * (128 - i * 10), y0 - 2 + i * 14);
    }
  }
  ctx.stroke();
  ctx.restore();
  ctx.restore();
}

// ---------------------------------------------------------------- poses

/** Mirror the light with the cat, so a flipped cat stays lit from the same side. */
function flipped(ctx, flip, fn) {
  if (flip) {
    const lx = LIGHT.x;
    LIGHT.x = -lx;
    ctx.save();
    ctx.scale(-1, 1);
    fn();
    ctx.restore();
    LIGHT.x = lx;
  } else fn();
}

function paw(ctx, coat, x, y, rx = 28, ry = 14, toes = true, base) {
  const p = ellipse(x, y, rx, ry);
  part(ctx, p, coat, { base: base ?? (coat.white ? coat.chest : coat.base), sd: 6, hd: 3, lw: 2.4, inside: true });
  if (toes) {
    const t = new Path2D();
    t.moveTo(x - rx * 0.3, y + ry * 0.9); t.lineTo(x - rx * 0.3, y + ry * 0.2);
    t.moveTo(x + rx * 0.3, y + ry * 0.9); t.lineTo(x + rx * 0.3, y + ry * 0.2);
    ink(ctx, t, 1.6, coat.innerLine ?? shadeOf(coat.base, 2.2, LIGHT.cool), 0.8);
  }
}

/**
 * Sitting, three-quarter front, ground at y = 0, about 560 units tall.
 * o: head params, breath (0..1), tail (−1..1, the tip's lift), flip.
 */
export function sit(ctx, coat, o = {}) {
  const { breath = 0, tail: tw = 0, flip = false, paw: lift = 0 } = o;
  flipped(ctx, flip, () => {
    const R = mul32(31);
    ctx.save();
    ctx.translate(0, -2);
    ctx.scale(1 + breath * 0.012, 1 + breath * 0.018);
    // the far haunch, half hidden
    part(ctx, ellipse(-104, -62, 52, 58), coat, { sd: 12, hd: 0 });
    const body = P('M-58 -262 C-104 -232 -142 -160 -150 -86 C-156 -32 -132 -2 -84 0 L96 0 C150 0 170 -36 160 -88 C150 -150 112 -226 62 -262 Z');
    part(ctx, body, coat, {
      sd: 26, hd: 10,
      inner: (g) => {
        stripes(g, body, [
          [[-140, -120], [-110, -110], [-84, -96]], [[-146, -80], [-116, -70], [-90, -60]], [[-150, -40], [-120, -34], [-96, -26]],
          [[150, -150], [120, -140], [96, -130]], [[158, -110], [130, -104], [104, -96]],
        ], coat, 13);
        furMarks(g, R, 60, -140, 70, 90, 30, sh(coat, 1.3), { len: 12, dir: 1.8, a: 0.35 });
      },
    });
    // the near haunch and hind paw
    const haunch = ellipse(104, -72, 70, 68);
    part(ctx, haunch, coat, {
      sd: 18, hd: 9, inside: true,
      inner: (g) => stripes(g, haunch, [[[60, -130], [90, -120], [118, -128]], [[50, -96], [92, -84], [140, -98]], [[60, -60], [100, -48], [160, -60]]], coat, 12),
    });
    paw(ctx, coat, 138, -10, 34, 13);
    // front legs: taper from the shoulder to the wrist, toes out a little
    for (const [x0, x1, px, lean, up] of [[-66, -18, -46, -3, lift], [12, 60, 38, 4, 0]]) {
      const m = (x0 + x1) / 2;
      // a lifted paw: the leg folds at the wrist and reaches out and up
      const fy = -14 - up * 86, fx = lean - up * 44;
      const leg = up > 0.01
        ? new Path2D(`M${x0} -186 C${x0 - 4} -150 ${m - 17 + fx} ${fy - 50} ${m - 15 + fx} ${fy} L${m + 15 + fx} ${fy} C${m + 17 + fx * 0.6} ${fy - 30} ${x1 + 4} -130 ${x1} -186 Z`)
        : P(`M${x0} -186 C${x0 - 4} -130 ${m - 17 + lean} -70 ${m - 15 + lean} -14 L${m + 15 + lean} -14 C${m + 17 + lean} -70 ${x1 + 4} -130 ${x1} -186 Z`);
      part(ctx, leg, coat, {
        base: coat.white ? coat.chest : coat.base, sd: 10, hd: 6, inside: true,
        inner: (g) => (up > 0.01 ? null : stripes(g, leg, [[[x0 - 4, -130], [m, -124], [x1 + 4, -130]], [[x0 - 4, -92], [m, -86], [x1 + 4, -92]], [[x0, -56], [m, -52], [x1, -56]]], coat, 9)),
      });
      if (up > 0.01) { ctx.save(); ctx.translate(px + fx, fy + 4); ctx.rotate(-up * 0.5); paw(ctx, coat, 0, 0, 25, 15); ctx.restore(); }
      else paw(ctx, coat, px + lean, -11, 26, 13);
    }
    // chest
    const chest = P('M-50 -252 C-68 -200 -62 -150 -42 -118 L-30 -108 L-18 -120 L-6 -104 L6 -118 L18 -106 L28 -122 C46 -160 48 -212 36 -254 Z');
    cel(ctx, chest, coat.chest, { sd: 10, hd: 0 });
    furMarks(ctx, R, -6, -170, 34, 50, 16, shadeOf(coat.chest, 0.8), { len: 10, dir: 1.6, a: 0.5 });
    ctx.restore();
    // the tail comes round the haunch and lies across the front of the paws; its tip lifts
    if (!coat.bob) tail(ctx, coat, [[176, -66], [192, -26], [150, 8], [84, 12], [30, 8 - tw * 4], [-6 - tw * 4, -2 - tw * 16], [-20 + tw * 2, -16 - tw * 30]], 34, 13);
    // head
    ctx.save();
    ctx.translate(-4, -330 - breath * 3);
    head(ctx, coat, o);
    ctx.restore();
  });
}

/**
 * Curled asleep, seen from a little above. Centre of the body at the origin,
 * about 380 units across. o: breath (0..1), tail flick, flip, ear twitch.
 * Sunny curls with his bob at the back; the others wrap a full tail round.
 */
export function curl(ctx, coat, o = {}) {
  const { breath = 0, tail: tw = 0, flip = false, earR = 0, earL = 0 } = o;
  flipped(ctx, flip, () => {
    const R = mul32(47);
    ctx.save();
    ctx.translate(0, 100);
    ctx.scale(1 + breath * 0.012, 1 + breath * 0.028);
    ctx.translate(0, -100);
    if (coat.bob) {
      // Sunny's bob: a short round stub at the back.
      const bob = ellipse(184 + tw * 3, 30 - tw * 4, 30, 22, -0.5 + tw * 0.15);
      part(ctx, bob, coat, { sd: 8, hd: 4, inner: (g) => stripes(g, bob, [[[170, 8], [178, 30], [172, 52]]], coat, 10) });
    }
    const body = blob([[-176, 0], [-150, -74], [-60, -118], [50, -122], [140, -86], [184, -8], [160, 62], [80, 100], [-30, 106], [-130, 82]]);
    part(ctx, body, coat, {
      sd: 30, hd: 12,
      inner: (g) => {
        const S = [];
        for (let i = 0; i < 15; i++) {
          const a = Math.PI * (1.04 + i * 0.062);
          const c = Math.cos(a), s = Math.sin(a), w = (i % 2 ? 1 : -1) * 0.05;
          S.push([[20 + c * 96, 14 + s * 66], [20 + Math.cos(a + w) * 130, 14 + Math.sin(a + w) * 90], [20 + Math.cos(a - w) * 165, 14 + Math.sin(a - w) * 114], [20 + c * 205, 14 + s * 140]]);
        }
        stripes(g, body, S, coat, 10);
        if (coat.white) {
          g.fillStyle = css(coat.chest);
          g.fill(blob([[-160, 30], [-120, 10], [-60, 60], [-40, 110], [-150, 90]]));
        }
        furMarks(g, R, 20, -30, 150, 80, 50, sh(coat, 1.3), { len: 14, dir: 0.3, a: 0.3 });
      },
    });
    // the folded hind leg makes a crease
    const crease = new Path2D();
    crease.ellipse(98, -6, 80, 66, 0, Math.PI * 1.02, Math.PI * 1.75);
    ink(ctx, crease, 2.4, coat.line, 0.9);
    if (!coat.bob) {
      // a full tail wraps round the front, its tip near the nose
      tail(ctx, coat, [[176, 26], [188, 82], [110, 116], [0, 118], [-90, 112], [-146 - tw * 4, 96 - tw * 6], [-170 - tw * 8, 70 - tw * 16]], 34, 14);
    }
    paw(ctx, coat, -66, 92, 30, 15);
    // the head, resting on the paws, asleep
    ctx.save();
    ctx.translate(-112, 22);
    ctx.rotate(-0.28);
    ctx.scale(0.8, 0.8);
    head(ctx, coat, { mode: 'sleep', yaw: -0.25, earL, earR, ...(o.head ?? {}) });
    ctx.restore();
    paw(ctx, coat, -120, 92, 30, 15);
    ctx.restore();
  });
}

/**
 * A loaf: paws tucked, three-quarter view, facing left, ground at y = 0,
 * about 420 units long. o: head params, breath, tail, flip, sleep.
 */
export function loaf(ctx, coat, o = {}) {
  const { breath = 0, tail: tw = 0, flip = false } = o;
  flipped(ctx, flip, () => {
    const R = mul32(53);
    ctx.save();
    ctx.scale(1 + breath * 0.01, 1 + breath * 0.022);
    if (coat.bob) {
      const bob = ellipse(196, -96 - tw * 4, 22, 18, -0.3);
      part(ctx, bob, coat, { sd: 6, hd: 4 });
    }
    const body = blob([[-150, -14], [-160, -100], [-110, -168], [20, -184], [140, -156], [196, -92], [192, -14], [120, 4], [-100, 4]]);
    part(ctx, body, coat, {
      sd: 26, hd: 12,
      inner: (g) => {
        const S = [];
        for (let i = 0; i < 7; i++) {
          const x = -40 + i * 34;
          S.push([[x - 6, -186], [x + 6, -140], [x + 2, -100 + (i % 2) * 10]]);
        }
        S.push([[150, -150], [160, -110], [190, -90]]);
        stripes(g, body, S, coat, 15);
        if (coat.white) { g.fillStyle = css(coat.chest); g.fill(blob([[-168, -60], [-120, -96], [-70, -40], [-84, 10], [-160, 6]])); }
        furMarks(g, R, 40, -100, 130, 60, 40, sh(coat, 1.3), { len: 13, dir: 0.1, a: 0.3 });
      },
    });
    // the tail lies along the front; a scene can draw its own instead (o.tail === false)
    if (!coat.bob && o.tail !== false) tail(ctx, coat, [[186, -40], [204, -6], [150, 14], [80, 14], [20, 12 - tw * 4], [-24 - tw * 6, 4 - tw * 14], [-40 - tw * 4, -8 - tw * 26]], 30, 12);
    // tucked paws peep out at the front
    paw(ctx, coat, -126, -2, 26, 11, false);
    paw(ctx, coat, -72, 0, 26, 11, false);
    ctx.restore();
    if (o.head === false) return;
    ctx.save();
    ctx.translate(-92, -212 - breath * 3);
    ctx.scale(0.92, 0.92);
    head(ctx, coat, { yaw: -0.3, ...o });
    ctx.restore();
  });
}

/**
 * Sitting, seen from behind, ground at y = 0, about 500 units tall.
 * o: tilt (rad), earL / earR (rad), tail (−1..1), breath, flip.
 */
export function back(ctx, coat, o = {}) {
  const { tilt = 0, earL = 0, earR = 0, tail: tw = 0, breath = 0, flip = false } = o;
  flipped(ctx, flip, () => {
    const R = mul32(61);
    if (!coat.bob) tail(ctx, coat, [[60, -14], [130, 2], [186, -4], [214 + tw * 6, -34 - tw * 10], [218 + tw * 14, -66 - tw * 18], [198 + tw * 18, -84 - tw * 22]], 32, 13);
    ctx.save();
    ctx.scale(1 + breath * 0.012, 1 + breath * 0.016);
    const body = P('M-104 0 C-156 -40 -156 -150 -100 -218 C-72 -250 72 -250 100 -218 C156 -150 156 -40 104 0 Z');
    part(ctx, body, coat, {
      sd: 18, hd: 14,
      inner: (g) => {
        furMarks(g, R, 0, -120, 100, 90, 40, sh(coat, 1.3), { len: 14, dir: 1.6, a: 0.35 });
        // the spine and the shoulder blades
        const sp = new Path2D();
        sp.moveTo(0, -236); sp.quadraticCurveTo(4, -140, 0, -60);
        ink(g, sp, 2, sh(coat, 1.5), 0.6);
      },
    });
    ctx.restore();
    ctx.save();
    ctx.translate(0, -262 - breath * 3);
    headBack(ctx, coat, { tilt, earL, earR });
    ctx.restore();
  });
}

/** The back of a head, centred near the nape: two ears, the skull, whisker tips. */
export function headBack(ctx, coat, o = {}) {
  const { tilt = 0, earL = 0, earR = 0 } = o;
  const R = mul32(61);
  {
    {
    ctx.save();
    ctx.rotate(tilt);
    const ears = [[-1, earL], [1, earR]];
    for (const [s, f] of ears) {
      ctx.save();
      ctx.scale(s, 1);
      ctx.translate(60, -84);
      ctx.rotate(f);
      ctx.translate(-60, 84);
      part(ctx, P('M24 -100 C44 -130 68 -150 90 -158 C98 -126 96 -92 86 -60 Z'), coat, { sd: 8, hd: 6 });
      ctx.restore();
    }
    const hd = P('M0 -118 C56 -118 90 -82 96 -34 C98 -14 104 4 112 18 L100 26 L108 38 L90 42 C70 60 40 66 0 66 C-40 66 -70 60 -90 42 L-108 38 L-100 26 L-112 18 C-104 4 -98 -14 -96 -34 C-90 -82 -56 -118 0 -118 Z');
    part(ctx, hd, coat, { sd: 14, hd: 12, inner: (g) => furMarks(g, R, 0, -30, 70, 50, 20, sh(coat, 1.3), { len: 10, dir: 1.6, a: 0.35 }) });
    // whiskers seen past the cheeks
    ctx.strokeStyle = css(coat.whisk, 0.7);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { ctx.moveTo(s * 92, 14 + i * 8); ctx.quadraticCurveTo(s * 120, 10 + i * 10, s * 142, 18 + i * 16); }
    ctx.stroke();
    ctx.restore();
    }
  }
}

/**
 * Peeking over an edge (the box): shoulders, head, and two front paws hooked
 * over a line at y = 92. Head at the origin. o: head params, paws (0..1 lift).
 */
export function peek(ctx, coat, o = {}) {
  const { pawL = 0, pawR = 0 } = o;
  const sh0 = P('M-110 150 C-112 96 -76 64 0 60 C76 64 112 96 110 150 Z');
  part(ctx, sh0, coat, { sd: 16, hd: 8, inner: (g) => {
    if (coat.chest) { g.fillStyle = css(coat.chest); g.fill(ellipse(0, 110, 50, 40)); }
    stripes(g, sh0, [[[-110, 90], [-80, 100], [-60, 130]], [[110, 90], [80, 100], [60, 130]]], coat, 12);
  } });
  for (const [x, l] of [[-58, pawL], [58, pawR]]) {
    const leg = P(`M${x - 24} ${150} L${x - 26} ${96 - l * 8} C${x - 26} ${80 - l * 8} ${x + 26} ${80 - l * 8} ${x + 26} ${96 - l * 8} L${x + 24} 150 Z`);
    part(ctx, leg, coat, { base: coat.white ? coat.chest : coat.base, sd: 8, hd: 5, inside: true, inner: (g) => stripes(g, leg, [[[x - 30, 110], [x, 114], [x + 30, 108]]], coat, 8) });
  }
  ctx.save();
  ctx.translate(0, -6);
  head(ctx, coat, o);
  ctx.restore();
  if (o.mid) o.mid(ctx); // what the cat is behind (the box's front), drawn before the paws come over it
  for (const [x, l] of [[-58, pawL], [58, pawR]]) {
    // a paw hooked over the edge: rounded on top, toes hanging down the front
    const y = 92 - l * 10;
    const mit = new Path2D(`M${x - 27} ${y + 16} C${x - 30} ${y - 6} ${x - 20} ${y - 20} ${x} ${y - 20} C${x + 20} ${y - 20} ${x + 30} ${y - 6} ${x + 27} ${y + 16} C${x + 20} ${y + 26} ${x - 20} ${y + 26} ${x - 27} ${y + 16} Z`);
    part(ctx, mit, coat, { base: coat.white ? coat.chest : lightOf(coat.base, 0.25, [255, 240, 214]), sd: 7, hd: 4, lw: 2.4 });
    const toes = new Path2D();
    for (const d of [-9, 9]) { toes.moveTo(x + d, y + 22); toes.lineTo(x + d, y + 8); }
    ink(ctx, toes, 1.7, coat.innerLine ?? shadeOf(coat.base, 2.2, LIGHT.cool), 0.85);
  }
}

/**
 * Kneading, front view: a crouched body, two front legs that push in turn.
 * Ground (the quilt) at y = 0. o: head params, k (kneading phase, cycles),
 * breath.
 */
export function knead(ctx, coat, o = {}) {
  const { k = 0, breath = 0 } = o;
  const R = mul32(71);
  const push = (ph) => Math.max(0, Math.sin(TAU * ph)); // a paw lifts on half the cycle
  const lL = push(k), lR = push(k + 0.5);
  ctx.save();
  ctx.scale(1 + breath * 0.012, 1 + breath * 0.018);
  // haunches either side, behind
  part(ctx, ellipse(-120, -60, 70, 62), coat, { sd: 14, hd: 6 });
  part(ctx, ellipse(120, -60, 70, 62), coat, { sd: 14, hd: 6 });
  const body = blob([[-140, -40], [-120, -170], [0, -214], [120, -170], [140, -40], [90, 0], [-90, 0]]);
  part(ctx, body, coat, {
    sd: 22, hd: 10,
    inner: (g) => {
      stripes(g, body, [[[-140, -140], [-110, -130], [-90, -110]], [[140, -140], [110, -130], [90, -110]], [[-140, -90], [-110, -84], [-94, -66]], [[140, -90], [110, -84], [94, -66]]], coat, 13);
      g.fillStyle = css(coat.chest);
      g.fill(blob([[-54, -200], [54, -200], [64, -100], [0, -40], [-64, -100]]));
      furMarks(g, R, 0, -130, 60, 60, 24, shadeOf(coat.chest, 0.9), { len: 10, dir: 1.6, a: 0.5 });
    },
  });
  for (const [x, l] of [[-50, lL], [50, lR]]) {
    const top = -140, y = -12 - l * 26;
    const leg = P(`M${x - 26} ${top} C${x - 30} ${top + 40} ${x - 22} ${y - 30} ${x - 20} ${y} L${x + 20} ${y} C${x + 22} ${y - 30} ${x + 30} ${top + 40} ${x + 26} ${top} Z`);
    part(ctx, leg, coat, { base: coat.white ? coat.chest : coat.base, sd: 12, hd: 5, inside: true,
      inner: (g) => furMarks(g, mul32(x + 99), x, y - 40, 16, 30, 8, shadeOf(coat.white ? coat.chest : coat.base, 1), { len: 8, dir: 1.6, a: 0.5 }) });
    // toes spread as the paw presses
    const spread = 1 + (1 - l) * 0.14;
    paw(ctx, coat, x, y + 2, 30 * spread, 15);
  }
  // the bib: a fluffy chest over the tops of the legs
  const bib = P('M-70 -206 C-86 -170 -80 -130 -60 -112 Q-52 -98 -44 -104 Q-36 -110 -30 -100 Q-22 -88 -12 -98 Q-4 -106 2 -96 Q10 -86 20 -98 Q28 -106 36 -98 Q46 -92 54 -104 Q58 -108 62 -104 C82 -128 86 -170 70 -206 Z');
  cel(ctx, bib, coat.white ? coat.chest : mix(coat.base, coat.chest ?? coat.base, 0.5), { sd: 10, hd: 0 });
  ink(ctx, bib, 1.8, coat.innerLine ?? shadeOf(coat.base, 2.2, LIGHT.cool), 0.8);
  furMarks(ctx, R, 0, -150, 50, 40, 20, shadeOf(coat.chest ?? coat.base, 0.9), { len: 10, dir: 1.6, a: 0.5 });
  ctx.restore();
  ctx.save();
  const bob = (lL + lR) * 3;
  ctx.translate(0, -252 + bob - breath * 3);
  head(ctx, coat, { mode: 'happy', ...o });
  ctx.restore();
}

/** A sheet of every coat in every pose, for checking the cats (look=cats). */
export function sheet(ctx, s) {
  ctx.fillStyle = '#efe6d6';
  ctx.fillRect(0, 0, 1080, 1080);
  const coats = [COATS.sunny, COATS.blue, COATS.black, COATS.grey];
  coats.forEach((c, i) => {
    const y = 150 + i * 250;
    const b = 0.5 + 0.5 * Math.sin(TAU * s / 3.2);
    ctx.save(); ctx.translate(90, y + 40); ctx.scale(0.3, 0.3);
    if (!c.bob) sit(ctx, c, { breath: b, blink: 0, yaw: 0.2, tail: Math.sin(s), paw: i === 2 ? 1 : 0, yawn: i === 3 ? 1 : 0 });
    else { head(ctx, c, { yaw: 0.2, yawn: 0.6 }); }
    ctx.restore();
    ctx.save(); ctx.translate(300, y); ctx.scale(0.42, 0.42); curl(ctx, c, { breath: b }); ctx.restore();
    ctx.save(); ctx.translate(530, y + 50); ctx.scale(0.4, 0.4); loaf(ctx, c, { breath: b }); ctx.restore();
    ctx.save(); ctx.translate(740, y + 50); ctx.scale(0.34, 0.34); if (!c.bob) back(ctx, c, { tail: Math.sin(s) }); else peek(ctx, c, { yaw: -0.2 }); ctx.restore();
    ctx.save(); ctx.translate(950, y + 60); ctx.scale(0.3, 0.3); knead(ctx, c, { k: s / 1.2 }); ctx.restore();
  });
}
