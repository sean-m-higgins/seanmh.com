// Helpers every film shares: easing, the caption, and the signature.

import { hand } from '../lib/draw/hand.js';

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
/** Map t from [a, b] to [0, 1], clamped. */
export const span = (t, a, b) => clamp((t - a) / (b - a));
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export const easeIn = (t) => t * t * t;
export const lerp = (a, b, t) => a + (b - a) * t;

/**
 * A hand-lettered caption, lowercase, written out over `write` (0..1) and
 * held. Placed bottom-left by default, inside the frame.
 */
export function caption(ctx, R, text, write, size, o = {}) {
  const { x = size * 0.074, y = size * 0.9, scale = 0.026, ...pen } = o;
  hand(ctx, R, text, x, y, size * scale, { upTo: write, alpha: 0.82, ...pen });
}

/** The signature: `<title> · <model> · <year>`, centred near the bottom. */
export function signature(ctx, R, film, write, o = {}) {
  const { y = film.size * 0.93, scale = 0.018, ...pen } = o;
  const text = `${film.title} · ${film.model} · ${film.year}`;
  hand(ctx, R, text, film.size / 2, y, film.size * scale, { align: 'center', upTo: write, alpha: 0.75, ...pen });
}
