// Film 03 · ramp — the Eagle Scout project, a portable wheelchair ramp.
// Storyboard approved and look C (cut-paper relief, lit) chosen 2026-11-14
// (incoming/ramp/storyboard.html, local). 18 scenes, 89 s.
// After the first cut (Sean, 2026-11-15): the note says only "a ramp", and the
// calendar scene (eighteen, still in scenesA.js) is out. Then two scenes went in
// after the rain: arrive (the centre and its sign) and shake (the agreement).
// The anchor is the ground line (GY in kit.js): every cut is a match cut on it.

import { rain, arrive, shake, ask } from './scenesA.js';
import { trailers, three, advice } from './scenesB.js';
import { cut, numbered } from './scenesC.js';
import weld from './weld.js';
import { roll, black, deck, join, holds } from './scenesD.js';
import { road, tow, stable } from './scenesE.js';

export default {
  slug: 'ramp', title: 'ramp', model: 'claude fable 5.2', year: 2026,
  fps: 24, size: 1080, seed: 20161107, paper: [42, 43, 49],
  scenes: [rain, arrive, shake, ask, trailers, three, advice, cut, numbered, weld, roll, black, deck, join, holds, road, tow, stable],
};
