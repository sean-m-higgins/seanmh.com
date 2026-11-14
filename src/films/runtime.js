// The deterministic film runtime. A film is { slug, title, model, year, fps,
// size, seed, scenes: [{ id, dur, step?, draw(ctx, t, R, env) }] }.
// Time comes from the frame index, never requestAnimationFrame: an occluded or
// headless Chrome throttles rAF, and a render must be exactly repeatable.

import { mul32, hashStr } from '../lib/draw/rng.js';

/** Scenes with absolute start and end times, in seconds. */
export function timeline(film) {
  let t = 0;
  return film.scenes.map((s, index) => {
    const o = { ...s, index, start: t, end: t + s.dur };
    t += s.dur;
    return o;
  });
}

export const duration = (film) => film.scenes.reduce((a, s) => a + s.dur, 0);
export const frameCount = (film) => Math.round(duration(film) * film.fps);

/** The scene at a frame, and t (0..1) through it. */
export function locate(film, frame) {
  const sec = frame / film.fps;
  const tl = timeline(film);
  const scene = tl.find((s) => sec < s.end) ?? tl[tl.length - 1];
  const t = Math.min(1, Math.max(0, (sec - scene.start) / scene.dur));
  return { scene, t, sec };
}

/**
 * Draw one frame. R is reseeded every `boilEvery` frames (default 2: drawn on
 * twos), so wobbled lines "boil" the way hand-drawn animation does.
 * env.still(key) gives a generator that never boils, for things that must hold.
 */
export function renderFrame(ctx, film, frame, env = {}) {
  const { scene, t, sec } = locate(film, frame);
  const boil = Math.floor(frame / (film.boilEvery ?? 2));
  const R = mul32((film.seed ^ hashStr(scene.id) ^ Math.imul(boil + 1, 0x9e3779b1)) >>> 0);
  const still = (key) => mul32((film.seed ^ hashStr(key)) >>> 0);
  ctx.save();
  scene.draw(ctx, t, R, { ...env, film, frame, sec, boil, still, size: film.size, scene });
  ctx.restore();
  return scene;
}

/** Chapters from the scenes that carry a `step` label. */
export function chapters(film) {
  const tl = timeline(film);
  const marks = tl.filter((s) => s.step);
  return marks.map((s, i) => ({
    start: s.start,
    end: i + 1 < marks.length ? marks[i + 1].start : duration(film),
    label: s.step,
  }));
}

const stamp = (s) => {
  const ms = Math.round(s * 1000);
  const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60;
  const sec = Math.floor(ms / 1000) % 60, r = ms % 1000;
  const p = (n, w = 2) => String(n).padStart(w, '0');
  return `${p(h)}:${p(m)}:${p(sec)}.${p(r, 3)}`;
};

/** A WebVTT chapters track. */
export function chaptersVTT(film) {
  const lines = ['WEBVTT', ''];
  chapters(film).forEach((c, i) => {
    lines.push(String(i + 1), `${stamp(c.start)} --> ${stamp(c.end)}`, c.label, '');
  });
  return lines.join('\n');
}
