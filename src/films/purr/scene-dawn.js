// Scene 1 · dawn — first light. A bedroom still blue with night; the grey
// tabby is curled on the duvet at the foot of the bed. A sparrow lands on the
// sill outside. The sun clears the roofs, a bar of warm light arrives on the
// wall and the bed, and the cat yawns without waking. Bars 1–4.

import {
  SIZE, TAU, hex, css, mix, P, poly, rect, rrect, ellipse, blob, cel, ink, glow, vgrad, lgrad,
  held, soft, grade, setLight, gesture, smooth, span, drift, shadeOf, lightOf, INK, rd, mul32,
  shadow, lit, planks, stars, woodGrain,
} from './kit.js';
import { COATS, curl } from './cats.js';

const DAWN = { x: -0.75, y: -0.5, warm: [255, 208, 176], cool: [58, 60, 112], k: 1.1 };
const WALL = hex('#8683a8'), WOOD = hex('#8a6450'), DUVET = hex('#e4dfe6');
const WIN = [110, 70, 520, 520];
const FLOOR_Y = 900;

function outside(g, R) {
  g.fillStyle = vgrad(g, 60, 520, [[0, hex('#3a3f78')], [0.45, hex('#8a6f9c')], [0.78, hex('#e79a8c')], [1, hex('#f9c58c')]]);
  g.fillRect(0, 0, 640, 560);
  stars(g, R, 110, 70, 410, 200, 26, { a: 0.6 });
  // long thin clouds, lit pink from below
  for (const [x, y, w] of [[200, 250, 190], [390, 310, 150], [280, 380, 240], [470, 220, 120]]) {
    g.fillStyle = css([120, 96, 150], 0.7); g.fill(ellipse(x, y, w, 13));
    g.fillStyle = css([255, 176, 150], 0.8); g.fill(ellipse(x + 8, y + 7, w * 0.9, 6));
  }
  // far hills, then the roofs across the way with a lit window or two
  g.fillStyle = css(hex('#5a557e'));
  g.fill(blob([[60, 560], [60, 440], [180, 410], [300, 436], [430, 400], [560, 430], [600, 560]]));
  let x = 90;
  while (x < 540) {
    const w = rd(R, 70, 120), h = rd(R, 40, 100);
    g.fillStyle = css(hex('#3a3760'));
    g.fill(poly([[x, 540], [x, 500 - h], [x + w / 2, 470 - h], [x + w, 500 - h], [x + w, 540]]));
    if (R() < 0.6) { g.fillStyle = css(hex('#ffcf8a'), 0.9); g.fillRect(x + w * 0.3, 510 - h, 12, 16); }
    if (R() < 0.5) { g.fillStyle = css(hex('#322f56')); g.fillRect(x + w * 0.7, 468 - h, 12, 30); }
    x += w + rd(R, 0, 18);
  }
}

function room(g, R) {
  setLight(DAWN);
  g.fillStyle = lgrad(g, 0, 0, SIZE, 0, [[0, lightOf(WALL, 0.3, [220, 190, 220])], [0.5, WALL], [1, shadeOf(WALL, 0.7)]]);
  g.fillRect(0, 0, SIZE, FLOOR_Y);
  // the window: its view, the glass's cool sheen, the frame
  g.save(); g.beginPath(); g.rect(WIN[0], WIN[1], WIN[2] - WIN[0], WIN[3] - WIN[1]); g.clip();
  g.drawImage(soft('dawn:out', 2.5, outside), 0, 0);
  g.fillStyle = lgrad(g, WIN[0], WIN[1], WIN[2], WIN[3], [[0, [255, 255, 255], 0], [0.44, [255, 255, 255], 0], [0.5, [236, 232, 255], 0.14], [0.6, [255, 255, 255], 0]]);
  g.fillRect(WIN[0], WIN[1], 420, 460);
  g.restore();
  const fr = hex('#cfcbdc');
  for (const r of [rect(WIN[0] - 18, WIN[1] - 18, 446, 20), rect(WIN[0] - 18, WIN[1] - 18, 20, 486), rect(WIN[2] - 2, WIN[1] - 18, 20, 486), rect(306, WIN[1], 16, 452), rect(WIN[0], 286, 412, 14)]) {
    cel(g, r, fr, { sd: 4, hd: 3 }); ink(g, r, 2.2);
  }
  const sill = rect(WIN[0] - 34, WIN[3] - 2, 478, 26);
  cel(g, sill, lightOf(fr, 0.3), { sd: 6, hd: 0 }); ink(g, sill, 2.4);
  // heavy curtains, drawn back to either side
  for (const [x0, x1, dir] of [[40, 150, 1], [480, 600, -1]]) {
    const c = P(`M${x0} 30 L${x1} 30 C${x1 + dir * 6} 260 ${x1 - dir * 14} 520 ${x1 + dir * 4} 800 L${x0} 800 C${x0 + dir * 8} 520 ${x0 - dir * 8} 260 ${x0} 30 Z`);
    cel(g, c, hex('#5d6a94'), { sd: 26, hd: 10 });
    g.save(); g.clip(c); g.strokeStyle = css([36, 40, 78], 0.5); g.lineWidth = 4;
    for (let x = x0 + 16; x < x1; x += 22) { g.beginPath(); g.moveTo(x, 30); g.quadraticCurveTo(x + dir * 8, 420, x, 800); g.stroke(); }
    g.restore(); ink(g, c, 2.4);
  }
  const rod = rrect(20, 20, 600, 12, 6);
  cel(g, rod, hex('#4a3a3a'), { sd: 3, hd: 3 }); ink(g, rod, 2);
  // a small picture over the bed, and a shelf with a trailing plant at the right
  const pic = rect(700, 150, 190, 150);
  cel(g, pic, hex('#6a5148'), { sd: 5, hd: 4 }); ink(g, pic, 2.2);
  const art = rect(714, 164, 162, 122);
  g.fillStyle = css(hex('#d9d2c2')); g.fill(art);
  g.save(); g.clip(art);
  g.fillStyle = css(hex('#9aa6c4')); g.fill(blob([[700, 300], [700, 240], [760, 210], [820, 246], [890, 220], [890, 300]]));
  g.fillStyle = css(hex('#e7a48a')); g.fill(ellipse(826, 206, 15, 15));
  g.restore(); ink(g, art, 1.4, INK, 0.7);

  // the floor and a rug
  planks(g, R, FLOOR_Y, SIZE, { vy: 300, n: 11, base: [116, 92, 110] });
  g.fillStyle = vgrad(g, FLOOR_Y, FLOOR_Y + 50, [[0, [30, 24, 50], 0.4], [1, [30, 24, 50], 0]]);
  g.fillRect(0, FLOOR_Y, SIZE, 50);
  const bb = rect(0, FLOOR_Y - 24, SIZE, 26);
  cel(g, bb, hex('#b9b4cc'), { sd: 5, hd: 0 }); ink(g, bb, 2.2);
  const rug = poly([[330, 960], [1000, 960], [1080, 1080], [260, 1080]]);
  cel(g, rug, hex('#b98a8a'), { sd: 0, hd: 0 });
  g.save(); g.clip(rug); g.strokeStyle = css(hex('#e6cdbd'), 0.7); g.lineWidth = 5;
  for (let y = 980; y < SIZE; y += 30) { g.beginPath(); g.moveTo(240, y); g.lineTo(1080, y); g.stroke(); }
  g.restore(); ink(g, rug, 2.2);
  // slippers by the bed
  for (const [x, a] of [[520, -0.12], [600, 0.06]]) {
    g.save(); g.translate(x, 1010); g.rotate(a);
    const sl = rrect(-30, -22, 60, 70, 26);
    cel(g, sl, hex('#d8b9a6'), { sd: 8, hd: 4 }); ink(g, sl, 2.2);
    const top = P('M-30 4 C-30 -30 30 -30 30 4 C16 14 -16 14 -30 4 Z');
    cel(g, top, hex('#c59a8a'), { sd: 6, hd: 3 }); ink(g, top, 2);
    g.restore();
  }

  // the nightstand under the window: a clock, a glass of water, a book
  const ns = rect(70, 668, 210, 232);
  cel(g, ns, WOOD, { sd: 14, hd: 6 }); woodGrain(g, R, ns, 70, 668, 210, 232, { a: 0.25, c: [60, 36, 40] }); ink(g, ns, 2.4);
  const nsTop = rrect(56, 650, 238, 22, 4);
  cel(g, nsTop, lightOf(WOOD, 0.3), { sd: 5, hd: 4 }); ink(g, nsTop, 2.4);
  const drawer = rect(90, 700, 170, 70);
  ink(g, drawer, 1.8, shadeOf(WOOD, 2), 0.8);
  g.fillStyle = css(hex('#d9b98a')); g.fill(ellipse(175, 735, 8, 8)); ink(g, ellipse(175, 735, 8, 8), 1.8);
  const book = rrect(180, 632, 100, 20, 3);
  cel(g, book, hex('#7f96a0'), { sd: 5, hd: 3 }); ink(g, book, 2);
  const glass = rrect(232, 580, 38, 54, 5);
  g.fillStyle = css([210, 226, 240], 0.35); g.fill(glass);
  g.fillStyle = css([190, 214, 236], 0.45); g.fillRect(234, 604, 34, 28);
  g.fillStyle = css([255, 255, 255], 0.6); g.fillRect(238, 586, 5, 42);
  ink(g, glass, 2);
  // the alarm clock: a round face, two bells, no numerals
  for (const sgn of [-1, 1]) {
    const bell = ellipse(128 + sgn * 26, 572, 16, 12, sgn * 0.5);
    cel(g, bell, hex('#c9a45a'), { sd: 4, hd: 3 }); ink(g, bell, 2);
    ink(g, P(`M${128 + sgn * 22} 640 L${128 + sgn * 30} 652`), 5, INK);
  }
  const body = ellipse(128, 610, 42, 42);
  cel(g, body, hex('#c98a7a'), { sd: 10, hd: 5 }); ink(g, body, 2.4);
  const face = ellipse(128, 610, 32, 32);
  g.fillStyle = css(hex('#f1eadc')); g.fill(face); ink(g, face, 1.8);
  g.strokeStyle = css(INK, 0.7); g.lineWidth = 2;
  for (let k = 0; k < 12; k++) { const a = k * TAU / 12; g.beginPath(); g.moveTo(128 + Math.cos(a) * 26, 610 + Math.sin(a) * 26); g.lineTo(128 + Math.cos(a) * 30, 610 + Math.sin(a) * 30); g.stroke(); }

  // the bed, seen from its side: a footboard, the mattress, a duvet over someone's feet
  const post = rrect(330, 540, 34, 370, 8);
  const footboard = rrect(330, 596, 60, 250, 10);
  g.fillStyle = css([30, 24, 50], 0.35); g.fill(ellipse(720, 908, 420, 20));
  const frame = rect(360, 800, 720, 70);
  cel(g, frame, WOOD, { sd: 10, hd: 0 }); ink(g, frame, 2.4);
  for (const x of [372, 1040]) { const leg = rect(x, 868, 28, 40); cel(g, leg, shadeOf(WOOD, 0.6), { sd: 4, hd: 0 }); ink(g, leg, 2.2); }
  const duvet = blob([[372, 640], [470, 600], [640, 596], [800, 560], [960, 520], [1100, 510], [1100, 850], [900, 866], [640, 850], [470, 862], [384, 840], [366, 740]], true, 0.9);
  cel(g, duvet, DUVET, { sd: 34, hd: 14 });
  g.save(); g.clip(duvet);
  // a broad stripe along the hem, and the folds
  g.strokeStyle = css(hex('#a9b0cc'), 0.9); g.lineWidth = 20;
  g.beginPath(); g.moveTo(360, 800); g.bezierCurveTo(520, 824, 760, 806, 1100, 812); g.stroke();
  g.strokeStyle = css(shadeOf(DUVET, 1.7), 0.6); g.lineWidth = 2.2; g.lineCap = 'round';
  for (const [x0, y0, x1, y1, x2, y2] of [[430, 650, 470, 720, 440, 800], [560, 640, 610, 720, 600, 790], [700, 620, 760, 700, 780, 780], [860, 590, 900, 660, 960, 770], [990, 560, 1010, 640, 1060, 720]]) {
    g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x1, y1, x2, y2); g.stroke();
  }
  g.restore();
  ink(g, duvet, 2.6);
  cel(g, footboard, lightOf(WOOD, 0.15), { sd: 12, hd: 6 }); woodGrain(g, R, footboard, 330, 596, 60, 250, { dir: 'v', a: 0.25, c: [60, 36, 40] }); ink(g, footboard, 2.4);
  cel(g, post, WOOD, { sd: 8, hd: 5 }); ink(g, post, 2.4);
  const knob = ellipse(347, 532, 22, 22);
  cel(g, knob, lightOf(WOOD, 0.2), { sd: 6, hd: 4 }); ink(g, knob, 2.4);
}

/** The warm bar the rising sun throws across the wall and the bed. Held; faded in. */
function sunbar(g) {
  lit(g, poly([[540, 150], [1080, 40], [1080, 330], [540, 470]]), [255, 196, 150], 0.75, 5);
  lit(g, poly([[420, 590], [1080, 470], [1080, 640], [470, 700]]), [255, 200, 160], 0.6, 8);
  shadow(g, poly([[756, 110], [770, 108], [770, 420], [756, 424]]), [150, 130, 190], 0.5, 4);
  shadow(g, poly([[540, 300], [1080, 190], [1080, 204], [540, 316]]), [150, 130, 190], 0.5, 4);
}

function sparrow(ctx, x, y, s, hop) {
  ctx.save();
  ctx.translate(x, y - hop);
  const body = blob([[-17, 0], [-8, -13], [8, -13], [17, -3], [8, 7], [-10, 7]]);
  ctx.fillStyle = css(hex('#4a3f58')); ctx.fill(body);
  ctx.fill(ellipse(14, -13, 9, 8));
  ctx.fill(poly([[-15, -2], [-33, -8 + Math.sin(s * 5) * 2], [-15, 5]]));
  ctx.fill(poly([[22, -14], [29, -12], [22, -9]]));
  ctx.restore();
}

export const dawn = {
  id: 'dawn',
  draw(ctx, s) {
    setLight(DAWN);
    ctx.drawImage(held('dawn:room', room), 0, 0);
    // the sun comes up behind the roofs
    const up = smooth(span(s, 4.5, 9.5));
    ctx.save();
    ctx.beginPath(); ctx.rect(WIN[0], WIN[1], WIN[2] - WIN[0], WIN[3] - WIN[1]); ctx.clip();
    glow(ctx, 400, 500 - up * 26, 150 + up * 150, [255, 214, 150], 0.35 + up * 0.5);
    // a sparrow lands on the sill outside, hops twice, and goes
    const land = span(s, 2.6, 3.4), go = span(s, 11.4, 12.4);
    if (land > 0 && go < 1) {
      const fx = go > 0 ? smooth(go) : 0;
      const x = 210 - (1 - smooth(land)) * 150 + fx * 260 + gesture(s, 6.2, 6.5, 0.1) * 0 + smooth(span(s, 6.2, 6.5)) * 34 + smooth(span(s, 8.4, 8.7)) * 30;
      const y = 518 - (1 - smooth(land)) * 120 - fx * 200;
      const hop = (gesture(s, 6.2, 6.5, 0.15) + gesture(s, 8.4, 8.7, 0.15)) * 10 + (go > 0 ? Math.abs(Math.sin(s * 22)) * 6 : 0);
      sparrow(ctx, x, y, s, hop);
    }
    ctx.restore();
    if (up > 0) { ctx.save(); ctx.globalAlpha = up; ctx.drawImage(held('dawn:sunbar', sunbar), 0, 0); ctx.restore(); }

    // the clock's second hand steps once a beat
    const tick = Math.floor(s * (64 / 60));
    ctx.save(); ctx.translate(128, 610);
    ink(ctx, P('M0 0 L-10 -14 M0 0 L16 -6'), 2.6);
    ctx.rotate(tick * TAU / 60);
    ink(ctx, P('M0 5 L0 -25'), 1.4, hex('#b5483c'));
    ctx.restore();

    // the cat: asleep on the duvet; the light finds her and she yawns
    const breath = 0.5 + 0.5 * Math.sin(TAU * s / 3.75);
    const yawn = gesture(s, 9.6, 12.2, 0.8);
    shadow(ctx, ellipse(610, 668, 150, 26), [120, 110, 170], 0.45, 3);
    ctx.save();
    ctx.translate(596, 610);
    ctx.scale(0.74, 0.74);
    curl(ctx, COATS.grey, {
      breath,
      earL: gesture(s, 3.5, 4.0, 0.12) * -0.3 + gesture(s, 13.2, 13.7, 0.12) * -0.25,
      earR: gesture(s, 6.4, 6.9, 0.12) * 0.3,
      tail: gesture(s, 12.4, 13.6, 0.3) * Math.sin(TAU * (s - 12.4) * 1.6),
      head: { yawn, tilt: yawn * -0.14 + 0.02 * drift(s, 9) },
    });
    ctx.restore();

    glow(ctx, 320, 300, 520, [200, 180, 255], 0.16);
    grade(ctx, 'dawn', { x: 320, y: 420, r: 1000, warm: [255, 190, 170], wa: 0.3 + 0 * up, cool: [50, 50, 110], ca: 0.42, screen: 0.06 });
  },
};
