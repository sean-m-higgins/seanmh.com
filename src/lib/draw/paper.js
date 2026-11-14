// A cream paper ground: low-frequency mottling, fine tooth, a few fibres and
// a soft vignette. It is rendered once per film and never boils, because a
// static ground costs almost nothing in the video bitrate.

import { mul32, rd, fbm, h2 } from './rng.js';
import { rgba } from './color.js';

export function makePaper(size, seed, base = [243, 234, 216]) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const img = g.createImageData(size, size);
  const d = img.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const m = fbm(x / 260, y / 260, seed, 3) - 0.5; // mottling
      const tooth = h2(x, y, seed) - 0.5; // per-pixel grain
      const vx = x / size - 0.5, vy = y / size - 0.5;
      const vig = (vx * vx + vy * vy) * 0.16;
      const k = 1 + m * 0.05 + tooth * 0.035 - vig;
      const i = (y * size + x) * 4;
      d[i] = base[0] * k;
      d[i + 1] = base[1] * k;
      d[i + 2] = base[2] * (k - tooth * 0.01);
      d[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const R = mul32(seed ^ 0x5eed);
  g.lineCap = 'round';
  for (let i = 0; i < 260; i++) {
    const x = rd(R, 0, size), y = rd(R, 0, size), a = rd(R, 0, 6.283), l = rd(R, 4, 18);
    g.strokeStyle = rgba(R() < 0.5 ? [120, 105, 80] : [255, 252, 240], rd(R, 0.05, 0.14));
    g.lineWidth = rd(R, 0.4, 0.9);
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a + 0.6) * l * 0.5, y + Math.sin(a + 0.6) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
    g.stroke();
  }
  return c;
}
