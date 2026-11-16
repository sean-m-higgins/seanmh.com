// Film 02 · gesso — a canvas, built and then painted.
// Storyboard approved and look C (impasto, lit) chosen 2026-11-15
// (incoming/gesso/storyboard.html, local). Painting order per Sean: grass,
// dots, stems, sky, flowers, clouds, butterflies.

import { wall, picture, list, haul } from './scenes1.js';
import { begin, release, dry, hang, yours } from './scenes3.js';
import { cut, sand, frameUp, fabric, stapleTurn, trim, flip, prime } from './scenes2.js';

export default {
  slug: 'gesso', title: 'gesso', model: 'claude fable 5.2', year: 2026,
  fps: 24, size: 1080, seed: 20261115,
  scenes: [wall, picture, list, haul, cut, sand, frameUp, fabric, stapleTurn, trim, flip, prime, begin, release, dry, hang, yours],
};
