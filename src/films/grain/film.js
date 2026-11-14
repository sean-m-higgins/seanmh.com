// Film 01 · grain — a coffee table, built by hand.
// Storyboard approved 2026-11-14 (incoming/grain/storyboard.html, local).
// Look C (etched coloured pencil, with photographic glass) chosen 2026-11-14.
// Scenes are added as they are built.

import { pencil } from '../../lib/draw/line.js';
import { signature, span, easeInOut } from '../common.js';
import { A, homeCamera, buildHome, vMark } from './home.js';
import { renderHome, PEN } from './looks.js';

const P = homeCamera();
const PARTS = buildHome(P);

export default {
  slug: 'grain', title: 'grain', model: 'claude opus 5.5', year: 2026,
  fps: 24, size: 1080, seed: 20260914,
  scenes: [
    {
      id: 'home', dur: 6,
      draw(ctx, t, R, env) {
        ctx.drawImage(env.paper, 0, 0);
        // The one camera move: a slow push, zooming about the anchor so the V never moves.
        const z = 1 + 0.1 * easeInOut(t);
        ctx.save();
        ctx.translate(A[0], A[1]); ctx.scale(z, z); ctx.translate(-A[0], -A[1]);
        renderHome(ctx, PARTS, env.look ?? 'c', R, env.still, env.paper); // look C chosen at gate 3
        pencil(ctx, R, vMark(P), { color: PEN, width: 2.6, amp: 0.3, alpha: 0.5, step: 2, taper: false });
        ctx.restore();
        signature(ctx, R, env.film, easeInOut(span(t, 0.55, 0.9)));
      },
    },
  ],
};
