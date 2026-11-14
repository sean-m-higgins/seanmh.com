// The pipeline proof (films-plan step 1): a pencil line crosses the paper,
// then the film signs itself. The cross-hatched block boils on every second
// frame on purpose: it is the bitrate worst case the budget is measured on.

import { pencil, box } from '../../lib/draw/line.js';
import { hatchFill } from '../../lib/draw/fill.js';
import { scribble } from '../../lib/draw/hand.js';
import { caption, signature, span, easeInOut } from '../common.js';

const S = 1080;
const block = [[600, 250], [960, 250], [960, 560], [600, 560]];

function ground(ctx, R, env) {
  ctx.drawImage(env.paper, 0, 0);
  const H = env.still('hatch'); // held: shading doesn't boil
  hatchFill(ctx, H, block, { spacing: 7, angle: 0.75, alpha: 0.45 });
  hatchFill(ctx, H, block, { spacing: 9, angle: -0.7, alpha: 0.3 });
  box(ctx, R, 600, 250, 360, 310, { alpha: 0.7 });
  const W = env.still('notes');
  for (let i = 0; i < 4; i++) scribble(ctx, W, 120, 300 + i * 46, 400, 14);
}

export default {
  slug: 'test', title: 'test', model: 'claude opus 5.5', year: 2026,
  fps: 24, size: S, seed: 190926,
  scenes: [
    {
      id: 'line', dur: 3, step: 'a line',
      draw(ctx, t, R, env) {
        ground(ctx, R, env);
        pencil(ctx, R, [[90, 760], [540, 740], [990, 770]], { width: 3, amp: 1.6, upTo: easeInOut(span(t, 0.05, 0.8)) });
        caption(ctx, R, 'one line', span(t, 0.5, 0.9), S);
      },
    },
    {
      id: 'sign', dur: 2, step: 'signature',
      draw(ctx, t, R, env) {
        ground(ctx, R, env);
        pencil(ctx, R, [[90, 760], [540, 740], [990, 770]], { width: 3, amp: 1.6 });
        signature(ctx, R, env.film, easeInOut(span(t, 0.05, 0.75)));
      },
    },
  ],
};
