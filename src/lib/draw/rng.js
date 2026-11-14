// Seeded randomness and noise. Everything downstream is reproducible from a
// seed, which is what makes a frame render to the same pixels every time.
// mul32, rd, h2 and fbm follow .inspiration's toolkit spec (entry 1).

/** mulberry32: a fast seeded PRNG returning floats in [0, 1). */
export function mul32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Uniform float in [a, b). */
export const rd = (R, a, b) => a + R() * (b - a);

/** FNV-1a hash of a string, for deriving seeds from names. */
export function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Hash of a lattice point, in [0, 1). */
export function h2(x, y, s) {
  const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

/** Smooth value noise in [0, 1). */
export function vn(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = h2(xi, yi, s), b = h2(xi + 1, yi, s);
  const c = h2(xi, yi + 1, s), d = h2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** Fractal noise. The 2.03 lacunarity (not 2.0) avoids grid alignment. */
export function fbm(x, y, s, octaves = 4) {
  let a = 0.5, f = 1, t = 0, n = 0;
  for (let i = 0; i < octaves; i++) {
    t += vn(x * f, y * f, s + i * 17) * a;
    n += a;
    a *= 0.5;
    f *= 2.03;
  }
  return t / n;
}
