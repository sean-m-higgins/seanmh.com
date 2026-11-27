// Scene 3 · breakfast — the kitchen floor in the morning sun. The Russian blue
// and the grey tabby crouch nose to nose over their bowls and crunch in time.
// The tabby looks up, licks her lips, blinks, and goes back to it. Bars 9–12.

import {
  SIZE, TAU, hex, css, mix, P, poly, rect, rrect, ellipse, blob, cel, ink, glow, vgrad, lgrad,
  held, grade, setLight, gesture, smooth, span, drift, blink, lerp, shadeOf, lightOf, INK, rd, mul32,
  shadow, lit, motes, sunPatch,
} from './kit.js';
import { COATS, loaf, head, headBack } from './cats.js';

const MORN = { x: -0.7, y: -0.72, warm: [255, 232, 180], cool: [84, 78, 124], k: 1 };
const NAVY = hex('#40506e'), TILE_A = hex('#f1e7d2'), TILE_B = hex('#b7c9ae');
const FLOOR_Y = 470, VY = -260;
const px = (x, y) => 540 + (x - 540) * ((y - VY) / (SIZE - VY)); // a floor x at depth y, from its x at the front edge

function room(g, R) {
  setLight(MORN);
  // the lower cabinets fill the top of the frame: we are down at cat height
  g.fillStyle = css(NAVY); g.fillRect(0, 0, SIZE, FLOOR_Y);
  for (let i = 0; i < 4; i++) {
    const x = 20 + i * 270;
    const door = rect(x, -20, 250, 430);
    cel(g, door, NAVY, { sd: 8, hd: 5, hi: lightOf(NAVY, 0.5) }); ink(g, door, 2.4, [22, 24, 40]);
    const panel = rect(x + 22, 4, 206, 384);
    ink(g, panel, 1.8, shadeOf(NAVY, 2.2), 0.9);
    g.fillStyle = css(lightOf(NAVY, 0.22), 0.5); g.fillRect(x + 24, 6, 6, 380);
    const hd = rrect(x + (i % 2 ? 26 : 210), 60, 12, 74, 6);
    cel(g, hd, hex('#d2ab62'), { sd: 3, hd: 3 }); ink(g, hd, 1.8, [40, 28, 24]);
  }
  // the toe-kick, in shadow
  g.fillStyle = css(hex('#22283a')); g.fillRect(0, 410, SIZE, FLOOR_Y - 410);
  // a striped tea towel over a door, the one that hangs there all day
  const tw = P('M556 -10 L640 -10 L646 250 L550 250 Z');
  cel(g, tw, hex('#efe6d6'), { sd: 10, hd: 0 });
  g.save(); g.clip(tw); g.fillStyle = css(hex('#c9584a'));
  for (const y of [40, 62, 190, 212]) g.fillRect(540, y, 120, 9);
  g.restore(); ink(g, tw, 2.2);

  // the floor: big checkerboard tiles, running away from us
  const rows = [FLOOR_Y];
  let step = 44;
  while (rows[rows.length - 1] < SIZE) { rows.push(rows[rows.length - 1] + step); step *= 1.3; }
  for (let j = 0; j < rows.length - 1; j++) {
    const y0 = rows[j], y1 = Math.min(SIZE + 40, rows[j + 1]);
    for (let i = -8; i < 8; i++) {
      const x0 = 540 + i * 240, x1 = x0 + 240;
      const c = (i + j) % 2 === 0 ? TILE_A : TILE_B;
      const t = poly([[px(x0, y0), y0], [px(x1, y0), y0], [px(x1, y1), y1], [px(x0, y1), y1]]);
      g.fillStyle = css(mix(c, [120, 90, 110], R() * 0.07)); g.fill(t);
      ink(g, t, 1.6, [150, 130, 120], 0.6);
    }
  }
  g.fillStyle = vgrad(g, FLOOR_Y, FLOOR_Y + 90, [[0, [30, 26, 50], 0.5], [1, [30, 26, 50], 0]]);
  g.fillRect(0, FLOOR_Y, SIZE, 90);

  // a paper sack of kibble at the left, its top rolled down
  g.fillStyle = css([60, 40, 60], 0.3); g.fill(ellipse(150, 742, 130, 20));
  const sack = P('M54 740 L62 520 C90 506 190 506 222 520 L236 740 Z');
  cel(g, sack, hex('#c9a678'), { sd: 22, hd: 10 }); ink(g, sack, 2.6);
  const roll = rrect(52, 498, 180, 34, 12);
  cel(g, roll, hex('#b8915f'), { sd: 8, hd: 4 }); ink(g, roll, 2.4);
  // the label: a fish, no words
  const lab = ellipse(146, 632, 56, 46);
  g.fillStyle = css(hex('#f1e7d2')); g.fill(lab); ink(g, lab, 2);
  const fb = blob([[112, 632], [140, 612], [168, 632], [140, 652]]);
  g.fillStyle = css(hex('#c9584a')); g.fill(fb); g.fill(poly([[164, 632], [186, 614], [186, 650]]));
  g.fillStyle = css(INK); g.fill(ellipse(126, 628, 3, 3));
  g.strokeStyle = css(shadeOf(hex('#c9a678'), 1.6), 0.6); g.lineWidth = 2;
  for (const x of [84, 204]) { g.beginPath(); g.moveTo(x, 540); g.quadraticCurveTo(x + 6, 640, x - 2, 736); g.stroke(); }

  // a step stool at the right, and a broom leaning by it
  const broom = new Path2D(); broom.moveTo(1010, 0); broom.lineTo(960, 640);
  ink(g, broom, 13, INK); ink(g, broom, 8, hex('#c9a06a'));
  const bristle = P('M912 640 L1008 640 L1030 742 L896 742 Z');
  cel(g, bristle, hex('#d9b25a'), { sd: 12, hd: 6 });
  g.save(); g.clip(bristle); g.strokeStyle = css(hex('#9a7430'), 0.7); g.lineWidth = 2;
  for (let x = 890; x < 1040; x += 9) { g.beginPath(); g.moveTo(960 + (x - 960) * 0.7, 640); g.lineTo(x, 742); g.stroke(); }
  g.restore(); ink(g, bristle, 2.4);
  const band = rect(908, 632, 104, 18); cel(g, band, hex('#b5483c'), { sd: 4, hd: 3 }); ink(g, band, 2.2);

  // the window's light across the tiles
  sunPatch(g, R, [[250, FLOOR_Y], [700, FLOOR_Y], [1010, 1080], [330, 1080]], { a: 0.62, blur: 5, bars: [[[468, FLOOR_Y], [494, FLOOR_Y], [690, 1080], [640, 1080]], [[300, 690], [900, 690], [916, 722], [306, 722]]] });

  // a rubber mat under the bowls
  const mat = poly([[px(250, 770), 770], [px(830, 770), 770], [px(870, 900), 900], [px(210, 900), 900]]);
  cel(g, mat, hex('#d98a6a'), { sd: 0, hd: 0 });
  ink(g, mat, 2.4);
  g.save(); g.clip(mat); g.strokeStyle = css(hex('#f0c9a8'), 0.7); g.lineWidth = 3; g.setLineDash([10, 9]);
  g.stroke(poly([[px(270, 780), 780], [px(810, 780), 780], [px(846, 890), 890], [px(234, 890), 890]]));
  g.restore();
}

/** A food bowl seen from a little above: the rim's ellipse, the kibble, the body. */
function bowl(ctx, x, y, c, full) {
  shadow(ctx, ellipse(x + 10, y + 26, 78, 13), [130, 100, 120], 0.4);
  const body = P(`M${x - 66} ${y - 6} C${x - 62} ${y + 30} ${x - 40} ${y + 36} ${x} ${y + 36} C${x + 40} ${y + 36} ${x + 62} ${y + 30} ${x + 66} ${y - 6} Z`);
  cel(ctx, body, c, { sd: 12, hd: 6 }); ink(ctx, body, 2.4);
  const rim = ellipse(x, y - 6, 66, 17);
  cel(ctx, rim, lightOf(c, 0.4), { sd: 0, hd: 0 }); ink(ctx, rim, 2.4);
  const inner = ellipse(x, y - 4, 56, 12);
  ctx.fillStyle = css(shadeOf(c, 1.4)); ctx.fill(inner);
  if (full > 0) {
    ctx.save(); ctx.clip(inner);
    const R = mul32(x);
    for (let i = 0; i < 26; i++) {
      const kx = x + rd(R, -50, 50), ky = y - 4 + rd(R, -3, 10) + (1 - full) * 8;
      ctx.fillStyle = css(mix(hex('#a8683c'), hex('#d39a5a'), R())); ctx.fill(ellipse(kx, ky, 7, 5));
    }
    ctx.restore();
  }
  // a paw print on the side
  ctx.fillStyle = css(lightOf(c, 0.9), 0.85);
  ctx.fill(ellipse(x, y + 20, 7, 6));
  for (const d of [-9, 0, 9]) ctx.fill(ellipse(x + d, y + 10 - (d ? 0 : 3), 3.4, 3.4));
}

/** A cat crouched at a bowl. `up` (0..1) lifts the head from the bowl to look at us. */
function eater(ctx, coat, x, y, k, flip, s, o) {
  const { up = 0, bob = 0 } = o;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  if (flip) { ctx.scale(-1, 1); MORN.x = -MORN.x; setLight(MORN); }
  loaf(ctx, coat, { breath: o.breath, tail: o.tail, head: false });
  // the head: down in the bowl we see its crown and ears; lifted, its face
  const hx = lerp(-176, -96, smooth(up)), hy = lerp(-78 + bob * 8, -214, smooth(up));
  ctx.translate(hx, hy);
  if (up < 0.5) {
    ctx.scale(0.86, 0.66 + up * 0.4);
    headBack(ctx, coat, { tilt: -0.1 + bob * 0.03, earL: o.earL ?? 0, earR: o.earR ?? 0 });
  } else {
    ctx.scale(0.92, 0.92);
    head(ctx, coat, { yaw: -0.12, tilt: 0.04, blink: o.blink, tongue: o.tongue, pupil: 0.3, earL: o.earL ?? 0, earR: o.earR ?? 0 });
  }
  if (flip) { MORN.x = -MORN.x; setLight(MORN); }
  ctx.restore();
}

export const breakfast = {
  id: 'breakfast',
  draw(ctx, s) {
    setLight(MORN);
    ctx.drawImage(held('breakfast:room', room), 0, 0);
    const beat = s * (64 / 60);
    // crunching: a small dip of the head twice a beat, with pauses
    const crunch = (ph, rest) => (rest ? 0 : Math.max(0, Math.sin(TAU * (beat * 2 + ph))));
    const up = gesture(s, 6.4, 11.3, 0.45);
    const tongue = up > 0.9 && s > 7.2 && s < 9.1 ? Math.sin(TAU * (s - 7.2) * 1.3) : undefined;
    for (const x of [330, 760]) shadow(ctx, ellipse(x, 842, 190, 30), [130, 100, 130], 0.45, 3);
    eater(ctx, COATS.blue, 306, 836, 0.82, true, s, {
      breath: 0.5 + 0.5 * Math.sin(TAU * s / 3.75), bob: crunch(0, s > 12.6 && s < 13.4), tail: 0.5 * drift(s, 6),
      earR: gesture(s, 4.4, 4.9, 0.12) * 0.3, earL: gesture(s, 10.2, 10.7, 0.12) * -0.25,
    });
    eater(ctx, COATS.grey, 784, 836, 0.82, false, s, {
      breath: 0.5 + 0.5 * Math.sin(TAU * (s / 3.75 + 0.4)), bob: crunch(0.35, up > 0), up, tongue,
      blink: blink(s, [9.5, 10.1], 0.3), tail: 0.6 * Math.sin(TAU * s / 5), earL: gesture(s, 2.2, 2.7, 0.12) * -0.3,
    });
    // the bowls sit in front of the heads
    bowl(ctx, 462, 818, hex('#7fa0b8'), 0.9);
    bowl(ctx, 628, 818, hex('#e0b06a'), 0.7);
    motes(ctx, 17, 36, [240, 380, 620, 600], s, { a: 0.6 });
    glow(ctx, 380, 420, 620, [255, 236, 190], 0.2);
    grade(ctx, 'breakfast', { x: 380, y: 500, r: 1000, warm: [255, 214, 150], wa: 0.42, cool: [90, 80, 130], ca: 0.25 });
  },
};
