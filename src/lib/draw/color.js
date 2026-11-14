// Colours are RGB triples so any pen can be laid down at any alpha, which is
// what builds the layered coloured-pencil look.

/** '#rrggbb' -> [r, g, b] */
export function hex(h) {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** CSS rgba() string for a triple at alpha a. */
export function rgba(c, a = 1) {
  return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
}

/** Linear mix of two triples. */
export function mix(c1, c2, t) {
  return [0, 1, 2].map((i) => c1[i] + (c2[i] - c1[i]) * t);
}

export const tint = (c, t) => mix(c, [255, 255, 255], t);
export const shade = (c, t) => mix(c, [0, 0, 0], t);
