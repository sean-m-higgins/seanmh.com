// Original procedural geometry. The seed is a composition, never visitor data.
export const DEFAULT_SEED = 190826;
export function normalizeSeed(value) {
  if (
    value === null ||
    value === undefined ||
    !/^\d{1,10}$/.test(String(value))
  )
    return DEFAULT_SEED;
  const n = Number(value);
  return Number.isSafeInteger(n) && n >= 0 && n <= 4294967295
    ? n
    : DEFAULT_SEED;
}
export function random(seed) {
  let state = normalizeSeed(seed);
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function chainPoints(sag = 120, width = 440, count = 100) {
  // Solve a(cosh(w/2a)-1) = sag by binary search. Units are SVG pixels.
  let lo = width / 100,
    hi = (width * width) / Math.max(0.1, sag);
  for (let i = 0; i < 70; i++) {
    const a = (lo + hi) / 2;
    if (a * (Math.cosh(width / (2 * a)) - 1) > sag) lo = a;
    else hi = a;
  }
  const a = (lo + hi) / 2;
  return Array.from({ length: count + 1 }, (_, i) => {
    const x = (width * i) / count;
    return [x, sag - a * (Math.cosh((x - width / 2) / a) - 1)];
  });
}
export function archPath(cx, top, width, height, close = true) {
  const points = chainPoints(height, width, 80);
  return (
    points
      .map(
        ([x, y], i) =>
          `${i ? "L" : "M"}${(cx - width / 2 + x).toFixed(2)},${(top + height - y).toFixed(2)}`,
      )
      .join(" ") + (close ? "Z" : "")
  );
}
export const palettes = [
  ["#1d5964", "#35878a", "#76a99a", "#d6ca8d", "#e8b55c", "#b76942", "#ece0b6"],
  ["#214651", "#36738b", "#6b9db2", "#adc4bc", "#ddb477", "#e5d5b5", "#a55943"],
  ["#31574c", "#659079", "#b0b692", "#ddd3a9", "#c18943", "#edc579", "#8b4a35"],
];
export const motifs = [
  { id: "tide", label: "Tidal bands", title: "a tide in stone" },
  { id: "sunburst", label: "Sunburst", title: "a piece of the sun" },
  { id: "canopy", label: "Leaf canopy", title: "somewhere, a garden" },
  { id: "spiral", label: "Spiral", title: "the slow turning" },
  { id: "petals", label: "Petals", title: "a flower, unfolded" },
  { id: "lightwell", label: "Lightwell", title: "a window left open" },
];
export const glazes = [
  {
    id: "sea",
    label: "Mediterranean",
    colors: [
      "#153f57",
      "#246782",
      "#409eae",
      "#8ebfbb",
      "#c9dcc9",
      "#e9dfb7",
      "#c88c38",
    ],
  },
  {
    id: "clay",
    label: "Terracotta",
    colors: [
      "#633d37",
      "#984d3c",
      "#bc7150",
      "#d99b72",
      "#e4bd91",
      "#efe0bc",
      "#536c59",
    ],
  },
  {
    id: "garden",
    label: "Garden",
    colors: [
      "#214b45",
      "#3c6e54",
      "#719360",
      "#a9b47e",
      "#d4cf9b",
      "#ece1b8",
      "#b98240",
    ],
  },
  {
    id: "cobalt",
    label: "Cobalt & cream",
    colors: [
      "#1d3563",
      "#2b4c91",
      "#537cbb",
      "#91afcc",
      "#c4d1d7",
      "#f0e9d3",
      "#d6b661",
    ],
  },
  {
    id: "rose",
    label: "Rose & plum",
    colors: [
      "#583e59",
      "#875974",
      "#b77e94",
      "#d5a8ac",
      "#e6cabc",
      "#efe2cc",
      "#69877c",
    ],
  },
  {
    id: "honey",
    label: "Honey glass",
    colors: [
      "#75502f",
      "#a37132",
      "#c99d48",
      "#e3be6c",
      "#ead49a",
      "#f3e7c4",
      "#3e7979",
    ],
  },
];
export const forms = [
  {
    id: "round",
    label: "River stone",
    path: "M300 30C430 30 551 150 551 300S437 558 300 558 49 450 49 300 164 30 300 30Z",
  },
  { id: "arch", label: "Catenary arch", path: archPath(300, 28, 490, 530) },
  {
    id: "tile",
    label: "Ceramic tile",
    path: "M70 40Q40 40 40 70V530Q40 560 70 560H530Q560 560 560 530V70Q560 40 530 40Z",
  },
];
export const DEFAULT_MOSAIC = { motif: "tide", glaze: "sea", form: "round" };
export function normalizeMosaic(options = {}) {
  return Object.fromEntries(
    [
      ["motif", motifs],
      ["glaze", glazes],
      ["form", forms],
    ].map(([key, choices]) => [
      key,
      choices.some((c) => c.id === options?.[key])
        ? options[key]
        : DEFAULT_MOSAIC[key],
    ]),
  );
}
export function mosaicOptionsFromURL(href) {
  const params = new URL(href).searchParams;
  // A seed-only link from the first edition retains its original composition.
  return ["motif", "glaze", "form"].some((key) => params.has(key))
    ? normalizeMosaic(Object.fromEntries(params))
    : params.has("seed")
      ? undefined
      : { ...DEFAULT_MOSAIC };
}
export function mosaicTiles(
  seed,
  width = 600,
  height = 600,
  step = 36,
  options,
) {
  const r = random(seed),
    rows = Math.ceil(height / step),
    cols = Math.ceil(width / step);
  const grid = Array.from({ length: rows + 1 }, (_, y) =>
    Array.from({ length: cols + 1 }, (_, x) =>
      [
        x * step + (x && x < cols ? (r() - 0.5) * step * 0.7 : 0),
        y * step + (y && y < rows ? (r() - 0.5) * step * 0.7 : 0),
      ].map((value) => Math.round(value * 10) / 10),
    ),
  );
  const selected = options ? normalizeMosaic(options) : undefined;
  const colors = selected
      ? glazes.find((g) => g.id === selected.glaze).colors
      : palettes[normalizeSeed(seed) % palettes.length],
    tiles = [];
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const a = grid[y][x],
        b = grid[y][x + 1],
        c = grid[y + 1][x + 1],
        d = grid[y + 1][x];
      const triangles =
        r() > 0.5
          ? [
              [a, b, d],
              [b, c, d],
            ]
          : [
              [a, b, c],
              [a, c, d],
            ];
      for (const pts of triangles) {
        let wave =
          0.5 +
          0.34 * Math.sin((x / cols) * 7 + (y / rows) * 3) +
          (r() - 0.5) * 0.4;
        if (selected) {
          const nx = (pts.reduce((s, p) => s + p[0], 0) / 3 / width - 0.5) * 2;
          const ny = (pts.reduce((s, p) => s + p[1], 0) / 3 / height - 0.5) * 2;
          const radius = Math.hypot(nx, ny),
            angle = Math.atan2(ny, nx);
          const phase = ((normalizeSeed(seed) % 1000) / 1000) * Math.PI * 2;
          const fields = {
            tide: () => Math.sin(ny * 9 + Math.sin(nx * 4 + phase) * 1.8),
            sunburst: () =>
              Math.cos(angle * 12 + phase) * 0.7 + Math.sin(radius * 8) * 0.3,
            canopy: () => Math.sin(nx * 7 + phase) * Math.cos(ny * 9 + nx * 3),
            spiral: () => Math.sin(angle * 3 - radius * 15 + phase),
            petals: () =>
              Math.sin(radius * 12 - Math.cos(angle * 6 + phase) * 2.8),
            lightwell: () =>
              Math.cos(Math.max(Math.abs(nx), Math.abs(ny)) * 17 + phase),
          };
          wave = 0.5 + fields[selected.motif]() * 0.46 + (wave - 0.5) * 0.16;
        }
        tiles.push({
          points: pts,
          color:
            colors[
              Math.max(
                0,
                Math.min(colors.length - 1, Math.floor(wave * colors.length)),
              )
            ],
          sheen: r(),
        });
      }
    }
  return tiles;
}
export function mosaicTitle(seed, options) {
  if (options)
    return motifs.find((m) => m.id === normalizeMosaic(options).motif).title;
  const places = [
    "a tide in stone",
    "the small hours",
    "a piece of the sun",
    "leaves after rain",
    "a window left open",
    "somewhere, a garden",
  ];
  return places[normalizeSeed(seed) % places.length];
}
export function seedURL(href, seed, options) {
  const url = new URL(href);
  // A shared artifact must not depend on the recipient's portfolio cookie.
  url.searchParams.set("v", "h-gaudi");
  url.searchParams.set("seed", String(normalizeSeed(seed)));
  for (const key of ["motif", "glaze", "form"]) {
    if (options) url.searchParams.set(key, normalizeMosaic(options)[key]);
    else url.searchParams.delete(key);
  }
  url.hash = "light";
  return url;
}
