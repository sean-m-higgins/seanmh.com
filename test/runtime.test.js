import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mul32 } from '../src/lib/draw/rng.js';
import { chaikin, resample } from '../src/lib/draw/line.js';
import { GLYPHS } from '../src/lib/draw/hand.js';
import { timeline, frameCount, locate, renderFrame, chaptersVTT } from '../src/films/runtime.js';
import testFilm from '../src/films/test/film.js';

const film = {
  slug: 'x', title: 'x', model: 'm', year: 2026, fps: 24, size: 100, seed: 7,
  scenes: [
    { id: 'a', dur: 1.5, step: 'first', draw() {} },
    { id: 'b', dur: 0.5, draw() {} },
    { id: 'c', dur: 2, step: 'third', draw() {} },
  ],
};

test('mul32 is deterministic per seed', () => {
  const a = mul32(42), b = mul32(42), c = mul32(43);
  const sa = [a(), a(), a()], sb = [b(), b(), b()];
  assert.deepEqual(sa, sb);
  assert.notEqual(sa[0], c());
});

test('scenes are laid end to end and frames map onto them', () => {
  assert.deepEqual(timeline(film).map((s) => [s.start, s.end]), [[0, 1.5], [1.5, 2], [2, 4]]);
  assert.equal(frameCount(film), 96);
  assert.equal(locate(film, 0).scene.id, 'a');
  assert.equal(locate(film, 35).scene.id, 'a'); // 1.458 s
  assert.equal(locate(film, 36).scene.id, 'b'); // exactly 1.5 s starts b
  assert.equal(locate(film, 36).t, 0);
  assert.equal(locate(film, 95).scene.id, 'c');
  assert.ok(locate(film, 500).t <= 1, 'past the end clamps to the last scene');
});

test('lines boil on twos: R repeats for frame pairs and changes between pairs', () => {
  const first = [];
  const probe = { ...film, scenes: [{ id: 'p', dur: 1, draw: (ctx, t, R) => first.push(R()) }] };
  const ctx = { save() {}, restore() {} };
  for (const f of [0, 1, 2, 3]) renderFrame(ctx, probe, f, {});
  assert.equal(first[0], first[1]);
  assert.equal(first[2], first[3]);
  assert.notEqual(first[1], first[2]);
});

test('chapters come from scenes with a step label', () => {
  const vtt = chaptersVTT(film);
  assert.match(vtt, /^WEBVTT/);
  assert.match(vtt, /00:00:00\.000 --> 00:00:02\.000\nfirst/);
  assert.match(vtt, /00:00:02\.000 --> 00:00:04\.000\nthird/);
});

test('chaikin and resample keep the endpoints of an open stroke', () => {
  const pts = resample([[0, 0], [100, 0], [100, 50]], 5);
  assert.deepEqual(pts[0], [0, 0]);
  assert.deepEqual(pts[pts.length - 1], [100, 50]);
  const c = chaikin(pts, false, 2);
  assert.deepEqual(c[0], [0, 0]);
  assert.deepEqual(c[c.length - 1], [100, 50]);
});

test('the hand alphabet covers every signature character', () => {
  const sig = `${testFilm.title} · ${testFilm.model} · ${testFilm.year}`;
  for (const ch of `${sig}abcdefghijklmnopqrstuvwxyz0123456789`) assert.ok(GLYPHS[ch], `missing glyph ${JSON.stringify(ch)}`);
});
