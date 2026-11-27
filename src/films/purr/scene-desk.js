// Scene 16 · desk — late. A desk under a green-shaded lamp; the black cat sits
// by a pencil at the desk's edge. She looks at us. She taps it. She looks at
// us. She taps it again, and once more, and it goes over. She watches it fall,
// then looks up as if nothing happened. Bars 65–68.

import {
  SIZE, TAU, hex, css, mix, P, poly, rect, rrect, ellipse, blob, cel, ink, glow, vgrad, lgrad,
  held, soft, grade, setLight, gesture, smooth, span, drift, blink, clamp, lerp, shadeOf, lightOf, INK, rd, mul32,
  shadow, lit, woodGrain, books, stars, pot, bush, motes,
} from './kit.js';
import { COATS, sit } from './cats.js';

const DESK = { x: -0.72, y: -0.5, warm: [255, 222, 156], cool: [34, 38, 88], k: 1.1 };
const WALL = hex('#4a5072'), WOOD = hex('#7a4f3a');
const BACK = 650, EDGE = 776; // the desk top's back and front edges

function sky(g, R) {
  g.fillStyle = vgrad(g, 60, 520, [[0, hex('#141a44')], [1, hex('#3a4678')]]);
  g.fillRect(380, 40, 560, 500);
  stars(g, R, 420, 70, 480, 300, 50);
  g.fillStyle = css(hex('#f2ecd2')); g.fill(ellipse(790, 170, 40, 40));
  g.fillStyle = css(hex('#1c2450')); g.fill(ellipse(806, 160, 36, 36));
  let x = 400;
  while (x < 920) {
    const w = rd(R, 50, 110), h = rd(R, 60, 190);
    g.fillStyle = css(hex('#10142e')); g.fillRect(x, 520 - h, w, h + 20);
    for (let wy = 536 - h; wy < 510; wy += 28) for (let wx = x + 8; wx < x + w - 12; wx += 20) if (R() < 0.3) { g.fillStyle = css(hex('#ffd58a'), 0.85); g.fillRect(wx, wy, 9, 13); }
    x += w + rd(R, 2, 10);
  }
}

function room(g, R) {
  setLight(DESK);
  g.fillStyle = lgrad(g, 0, 0, SIZE, 0, [[0, lightOf(WALL, 0.7, [255, 200, 140])], [0.45, WALL], [1, shadeOf(WALL, 1)]]);
  g.fillRect(0, 0, SIZE, SIZE);
  // the window: night over the town, a blind half down
  g.save(); g.beginPath(); g.rect(420, 70, 480, 450); g.clip();
  g.drawImage(soft('desk:sky', 2, sky), 0, 0);
  g.restore();
  for (const r of [rect(404, 54, 512, 18), rect(404, 518, 512, 22), rect(404, 54, 18, 480), rect(898, 54, 18, 480), rect(652, 70, 14, 450)]) { cel(g, r, hex('#6a6e8a'), { sd: 4, hd: 2 }); ink(g, r, 2, [16, 14, 26]); }
  for (let i = 0; i < 3; i++) { const sl = rect(418, 70 + i * 22, 484, 15); cel(g, sl, hex('#b9b4c4'), { sd: 4, hd: 0 }); ink(g, sl, 1.4, [16, 14, 26], 0.7); }
  ink(g, P("M880 70 L880 230"), 1.6, [200, 196, 210], 0.8);
  // a pinboard at the left: cards and a photo, no words
  const board = rect(50, 150, 290, 280);
  cel(g, board, hex('#b08a5e'), { sd: 6, hd: 0 }); ink(g, board, 2.6, [30, 20, 24]);
  const fr = new Path2D(); fr.rect(50, 150, 290, 280); fr.rect(64, 164, 262, 252);
  g.fillStyle = css(hex('#6a4a3a')); g.fill(fr, 'evenodd');
  const pin = (x, y, w, h, a, c, art) => {
    g.save(); g.translate(x, y); g.rotate(a);
    const p = rect(-w / 2, 0, w, h); g.fillStyle = css(hex(c)); g.fill(p);
    g.save(); g.clip(p); if (art) art(); g.restore();
    ink(g, p, 1.6, [30, 20, 24]);
    g.fillStyle = css(hex('#c9584a')); g.fill(ellipse(0, 6, 5, 5)); ink(g, ellipse(0, 6, 5, 5), 1.2, [30, 20, 24]);
    g.restore();
  };
  pin(130, 184, 100, 86, -0.05, '#f1e9d6', () => { g.strokeStyle = css(INK, 0.45); g.lineWidth = 2; for (let y = 22; y < 80; y += 12) { g.beginPath(); g.moveTo(-40, y); g.lineTo(rd(R, 0, 40), y); g.stroke(); } });
  pin(256, 196, 84, 104, 0.06, '#dfe6ea', () => { g.fillStyle = css(hex('#7fa0b8')); g.fillRect(-42, 14, 84, 60); g.fillStyle = css(hex('#f2c230')); g.fill(ellipse(14, 34, 11, 11)); g.fillStyle = css(hex('#5a8a5a')); g.fill(blob([[-42, 74], [-42, 56], [-10, 46], [20, 60], [42, 52], [42, 74]])); });
  pin(150, 300, 92, 78, 0.04, '#f2dfa8', () => { g.strokeStyle = css(INK, 0.45); g.lineWidth = 2; for (let y = 22; y < 70; y += 12) { g.beginPath(); g.moveTo(-36, y); g.lineTo(rd(R, -6, 36), y); g.stroke(); } });
  pin(266, 326, 60, 60, -0.08, '#e7b9b0', () => { g.fillStyle = css(hex('#c9584a')); g.fill(P('M0 50 C-30 28 -18 8 0 22 C18 8 30 28 0 50 Z')); });

  // the desk: its top seen from above, the front with a drawer
  const front = rect(0, EDGE + 18, SIZE, SIZE - EDGE);
  cel(g, front, shadeOf(WOOD, 0.5), { sd: 0, hd: 0 }); woodGrain(g, R, front, 0, EDGE + 18, SIZE, 300, { c: [40, 22, 26], a: 0.3, gap: 8 });
  const drawer = rect(330, EDGE + 60, 420, 170); ink(g, drawer, 2, [26, 16, 22], 0.9);
  const pull = rrect(500, EDGE + 128, 80, 16, 8); cel(g, pull, hex('#c9a45a'), { sd: 4, hd: 3 }); ink(g, pull, 2, [26, 16, 22]);
  const top = poly([[0, BACK], [SIZE, BACK], [SIZE, EDGE], [0, EDGE]]);
  g.fillStyle = vgrad(g, BACK, EDGE, [[0, shadeOf(WOOD, 0.3)], [1, lightOf(WOOD, 0.2)]]); g.fill(top);
  woodGrain(g, R, top, 0, BACK, SIZE, EDGE - BACK, { c: [50, 28, 26], a: 0.28, gap: 7 });
  ink(g, top, 2.6, [26, 16, 22]);
  const lip = rect(0, EDGE, SIZE, 20);
  cel(g, lip, WOOD, { sd: 6, hd: 0 }); ink(g, lip, 2.4, [26, 16, 22]);

  // the lamp's pool of light on the desk
  lit(g, ellipse(330, 724, 330, 64), [255, 220, 150], 0.8, 14);

  // an open notebook in the light, with a pen across it
  const nbL = poly([[250, 690], [386, 686], [392, 756], [236, 762]]), nbR = poly([[386, 686], [520, 690], [540, 762], [392, 756]]);
  shadow(g, poly([[236, 762], [540, 762], [552, 772], [244, 772]]), [60, 34, 50], 0.4, 2);
  for (const p of [nbL, nbR]) { g.fillStyle = css(hex('#f6efdf')); g.fill(p); ink(g, p, 2, [30, 20, 24]); }
  g.strokeStyle = css(hex('#5a6a9a'), 0.6); g.lineWidth = 1.8; g.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const y = 702 + i * 11;
    g.beginPath(); g.moveTo(262 - i * 2, y); for (let x = 262; x < 374 - (i === 4 ? 50 : 0); x += 9) g.lineTo(x - i * 2, y + rd(R, -2.4, 2.4)); g.stroke();
    if (i < 3) { g.beginPath(); g.moveTo(402, y - 2); for (let x = 402; x < 516; x += 9) g.lineTo(x + i * 2, y - 2 + rd(R, -2.4, 2.4)); g.stroke(); }
  }
  const pen = new Path2D(); pen.moveTo(436, 746); pen.lineTo(520, 716);
  ink(g, pen, 9, [30, 20, 24]); ink(g, pen, 5, hex('#3f6d7a'));

  // books and a mug at the back right, a small cactus
  for (const [dy, w, c, dx] of [[0, 190, '#7a8f5a', 0], [-22, 170, '#c97b63', 12], [-44, 180, '#3f6d7a', 4]]) {
    const b = rrect(850 + dx, BACK + 6 + dy, w, 22, 3); cel(g, b, hex(c), { sd: 5, hd: 3 }); ink(g, b, 2, [30, 20, 24]);
  }
  pot(g, 946, BACK - 38, 60, 46, [214, 196, 170]);
  const cactus = P(`M930 ${BACK - 84} C926 ${BACK - 150} 966 ${BACK - 150} 962 ${BACK - 84} Z`);
  cel(g, cactus, hex('#5f8a5a'), { sd: 8, hd: 4 }); ink(g, cactus, 2.2, [30, 20, 24]);
  g.strokeStyle = css([240, 240, 220], 0.7); g.lineWidth = 1.2;
  for (let i = 0; i < 9; i++) { const x = rd(R, 934, 958), y = rd(R, BACK - 140, BACK - 92); g.beginPath(); g.moveTo(x - 3, y); g.lineTo(x + 3, y); g.moveTo(x, y - 3); g.lineTo(x, y + 3); g.stroke(); }

  // the lamp: brass foot and stem, a green glass shade lit from inside
  shadow(g, ellipse(150, 742, 96, 12), [60, 34, 50], 0.45, 2);
  const foot = ellipse(140, 734, 78, 18); cel(g, foot, hex('#c9a45a'), { sd: 6, hd: 4 }); ink(g, foot, 2.4, [30, 20, 24]);
  const stem = new Path2D(); stem.moveTo(140, 726); stem.lineTo(140, 590);
  ink(g, stem, 13, [30, 20, 24]); ink(g, stem, 8, hex('#c9a45a'));
  const shade = P('M52 588 C56 534 250 534 262 588 C262 604 52 604 52 588 Z');
  g.fillStyle = lgrad(g, 52, 540, 262, 600, [[0, hex('#3f8a5e')], [0.5, hex('#62b07a')], [1, hex('#2f6a4a')]]); g.fill(shade);
  ink(g, shade, 2.6, [20, 26, 24]);
  g.fillStyle = css([255, 246, 200]); g.fill(ellipse(157, 598, 96, 7));
  const chain = new Path2D(); chain.moveTo(214, 600); chain.lineTo(214, 640);
  g.setLineDash([3, 3]); ink(g, chain, 2, hex('#c9a45a')); g.setLineDash([]);
  g.fillStyle = css(hex('#c9a45a')); g.fill(ellipse(214, 644, 4, 4));
}

/** The pencil: yellow, hexagonal, a pink rubber at one end. Centre at (0, 0), along x. */
function pencil(ctx) {
  const body = rect(-72, -6, 124, 12);
  cel(ctx, body, hex('#eab63e'), { sd: 4, hd: 3 }); ink(ctx, body, 1.8, [30, 20, 24]);
  ink(ctx, P('M-72 -2 L52 -2'), 1, [150, 100, 20], 0.6);
  const tip = poly([[52, -6], [76, 0], [52, 6]]); cel(ctx, tip, hex('#e9cfa0'), { sd: 0, hd: 0 }); ink(ctx, tip, 1.8, [30, 20, 24]);
  ctx.fillStyle = css([40, 30, 34]); ctx.fill(poly([[68, -2], [76, 0], [68, 2]]));
  const fer = rect(-84, -6, 12, 12); cel(ctx, fer, hex('#b9b4b0'), { sd: 0, hd: 0 }); ink(ctx, fer, 1.6, [30, 20, 24]);
  const rub = rrect(-98, -6, 14, 12, 4); cel(ctx, rub, hex('#e79a9a'), { sd: 3, hd: 0 }); ink(ctx, rub, 1.6, [30, 20, 24]);
}

export const desk = {
  id: 'desk',
  draw(ctx, s) {
    setLight(DESK);
    ctx.drawImage(held('desk:room', room), 0, 0);
    // three taps; after the third the pencil goes over the edge
    // each tap lands on a beat of the soundtrack (beats 6, 9 and 11 of the scene), where a high note answers it
    const taps = [5.38, 8.19, 10.06];
    const tap = (t) => gesture(s, t, t + 0.62, 0.22);
    const paw = Math.max(...taps.map(tap));
    const pushed = (t) => smooth(span(s, t + 0.22, t + 0.5));
    const slide = pushed(taps[0]) * 16 + pushed(taps[1]) * 15;
    const fall = span(s, taps[2] + 0.24, taps[2] + 1.5);
    const px = 592 - slide * 0.3, py = 748 + slide * 0.6;
    // where she looks: us, the pencil, us, the pencil, down after it, us
    const atPencil = Math.max(gesture(s, 3.4, 5.9, 0.5), gesture(s, 7.4, 8.7, 0.4), gesture(s, 9.6, 10.6, 0.3));
    const down = gesture(s, 10.5, 13.0, 0.5);
    const cx = 700, cy = 752, k = 0.62;
    shadow(ctx, poly([[cx - 90, cy + 4], [cx + 120, cy + 4], [cx + 300, cy + 22], [cx + 20, cy + 22]]), [40, 30, 70], 0.45, 3);
    // the pencil on the desk (behind her paw) until it falls
    if (fall < 1) {
      ctx.save();
      if (fall <= 0) { ctx.translate(px, py); ctx.rotate(-0.16 + slide * 0.004); }
      else {
        // it tips on the edge, then drops and turns
        const tip = smooth(span(fall, 0, 0.3)), drop = Math.max(0, fall - 0.25) / 0.75;
        ctx.translate(px - 6 * tip, py + 14 * tip + drop * drop * 330); ctx.rotate(-0.16 + 0.12 - tip * 0.9 - drop * 2.4);
      }
      if (fall <= 0) shadow(ctx, rect(-96, 5, 170, 5), [60, 34, 50], 0.4, 1.5);
      pencil(ctx);
      ctx.restore();
    }
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(k, k);
    sit(ctx, COATS.black, {
      breath: 0.5 + 0.5 * Math.sin(TAU * s / 3.75),
      yaw: -0.05 - atPencil * 0.34 - down * 0.3 + 0.03 * drift(s, 8), tilt: atPencil * -0.07 + down * -0.16,
      look: [-atPencil * 7 - down * 6, atPencil * 8 + down * 9], pupil: 0.55 + paw * 0.25,
      blink: Math.min(1, blink(s, [1.6, 6.6], 0.3) + gesture(s, 13.3, 14.6, 0.5) * 0.9),
      paw: paw * 0.5, tail: 0.5 * Math.sin(TAU * s / 2.6) + 0.5 * gesture(s, 9.4, 11, 0.3) * Math.sin(TAU * s * 2),
      earL: 0.14 * down, earR: -0.14 * down + 0.2 * gesture(s, 2.4, 3.0, 0.15),
    });
    ctx.restore();
    // the lamp's glow
    glow(ctx, 157, 606, 560, [255, 214, 140], 0.5);
    glow(ctx, 157, 600, 130, [255, 244, 200], 0.6);
    motes(ctx, 73, 22, [40, 420, 460, 320], s, { a: 0.55, c: [255, 230, 180] });
    grade(ctx, 'desk', { x: 200, y: 640, r: 1000, warm: [255, 190, 110], wa: 0.5, cool: [30, 34, 90], ca: 0.48, screen: 0.08 });
  },
};
