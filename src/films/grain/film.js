// Film 01 · grain — a coffee table, built by hand.
// Storyboard approved 2026-11-14; look C (etched coloured pencil, one photographic
// glass pass) chosen the same day. Redrawn on a pencil engine that works from
// light: see kit.js.

import { mark, design, store, measure } from './scenesA.js';
import { cut, legs, sand, dryFit } from './scenesB.js';
import { glass, stain, glueUp } from './scenesC.js';
import { home } from './home.js';

export default {
  slug: 'grain', title: 'grain', model: 'claude fable 5.2', year: 2026,
  fps: 24, size: 1080, seed: 20260914,
  scenes: [mark, design, store, measure, cut, legs, sand, dryFit, glass, stain, glueUp, home],
};
