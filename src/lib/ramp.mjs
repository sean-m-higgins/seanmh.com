// Original axonometric drawing informed by Sean's project photograph.
// Proportions illustrate the design, not engineering dimensions or compliance.
export function rampArt() {
  const project = (x, y, z = 0) => [
    145 + x * 29 + y * 30,
    525 - x * 15 + y * 15 - z * 48,
  ];
  const point = (p) =>
    project(...p)
      .map((v) => v.toFixed(2))
      .join(",");
  const polygon = (points, fill, stroke = "#59695f", width = 1) =>
    `<polygon points="${points.map(point).join(" ")}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`;
  const line = (points, stroke, width = 1, extra = "") =>
    `<polyline points="${points.map(point).join(" ")}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
  const height = (x) => 0.1 + (Math.min(14, Math.max(0, x)) / 14) * 1.6;
  const edge = (x, y) => [x, y, height(x)];
  const rail = (x, y) => [x, y, height(x) + 1.25];
  const post = (x, y) => {
    const base = edge(x, y),
      top = rail(x, y);
    const [tx, ty] = project(...top);
    return (
      line([base, top], "#856a45", 7) +
      line(
        [
          [x, y - 0.065, height(x)],
          [x, y - 0.065, height(x) + 1.25],
        ],
        "#bd9d6a",
        2,
      ) +
      `<path d="M${tx - 6} ${ty - 2}h12v4h-12Z" fill="#c0a273" stroke="#806444" stroke-width=".8"/>`
    );
  };
  const wheel = (x, y) => {
    const [cx, cy] = project(x, y, 0.19);
    return (
      line(
        [
          [x, y, height(x) - 0.08],
          [x, y, 0.36],
        ],
        "#536157",
        4,
      ) +
      `<g data-ramp-wheel><path d="M${cx - 5} ${cy - 15}h10v11h-10Z" fill="#7f8c7e"/><ellipse cx="${cx}" cy="${cy}" rx="10" ry="13" fill="#384941" stroke="#203d37" stroke-width="2" transform="rotate(18 ${cx} ${cy})"/><ellipse cx="${cx}" cy="${cy}" rx="5" ry="7" fill="#c7cec0"/><circle cx="${cx}" cy="${cy}" r="2" fill="#73816f"/></g>`
    );
  };
  const ramp = [edge(0, -1.4), edge(14, -1.4), edge(14, 1.4), edge(0, 1.4)];
  // Facing uphill, the right edge continues into the landing without a step
  // sideways. The square platform widens only to the left, which stays open.
  const platformRight = 1.4;
  const platformLeft = platformRight - 4.2;
  const platform = [
    [14, platformLeft, 1.7],
    [18.2, platformLeft, 1.7],
    [18.2, platformRight, 1.7],
    [14, platformRight, 1.7],
  ];
  const posts = [0, 3.5, 7, 10.5, 14];
  const wheels = [5.2, 9.3, 13.1, 16.8];
  let illustration = polygon(
    [
      [-2, -1.7, 0],
      [18.6, platformLeft - 0.3, 0],
      [18.6, platformRight + 0.5, 0],
      [-2, 1.8, 0],
    ],
    "#53695312",
    "none",
  );
  // Rear rail and wheels sit behind the deck; near-side hardware is drawn last.
  illustration += `<g data-ramp-part="far-handrail">${posts.map((x) => post(x, -1.4)).join("")}${line(
    posts.map((x) => rail(x, -1.4)),
    "#344d4c",
    4.5,
  )}</g>`;
  illustration += wheels
    .map((x) => wheel(x, x > 14 ? platformLeft - 0.05 : -1.47))
    .join("");
  illustration += polygon(
    [
      [0, 1.4, -0.04],
      [14, 1.4, 1.56],
      [14, 1.4, 1.7],
      [0, 1.4, 0.1],
    ],
    "#52615a",
  );
  illustration += polygon(
    [
      [14, platformRight, 1.56],
      [18.2, platformRight, 1.56],
      [18.2, platformRight, 1.7],
      [14, platformRight, 1.7],
    ],
    "#56685f",
  );
  illustration += `<g data-ramp-part="metal-deck">${polygon(ramp, "url(#ramp-metal)")}`;
  for (let x = 0.8; x < 14; x += 1.65) {
    illustration += line(
      [edge(x, -0.97), edge(x, 0.97)],
      "#53665d",
      4.5,
      'opacity=".85"',
    );
    illustration += line(
      [edge(x + 0.52, -1.08), edge(x + 0.52, -0.75)],
      "#67796b",
      3,
    );
    illustration += line(
      [edge(x + 0.52, 0.75), edge(x + 0.52, 1.08)],
      "#67796b",
      3,
    );
  }
  for (let x = 2.8; x < 14; x += 2.8)
    illustration += line([edge(x, -1.4), edge(x, 1.4)], "#87978b", 0.8);
  illustration +=
    line([edge(0, -1.31), edge(14, -1.31)], "#f4efdf", 2) +
    line([edge(0, 1.3), edge(14, 1.3)], "#f4efdf", 1.5) +
    "</g>";
  illustration += `<g data-ramp-part="square-platform">${polygon(platform, "url(#ramp-metal)")}`;
  for (let x = 14.5; x < 18.2; x += 0.7)
    illustration += line(
      [
        [x, platformLeft + 0.15, 1.7],
        [x, platformRight - 0.15, 1.7],
      ],
      "#89998e",
      0.55,
      'opacity=".55"',
    );
  illustration += "</g>";
  illustration += `<g data-ramp-part="entry-apron">${polygon(
    [
      [-2, -1.4, 0],
      [0, -1.4, 0.1],
      [0, 1.4, 0.1],
      [-2, 1.4, 0],
    ],
    "#9b8867",
  )}${line(
    [
      [-1, -1, 0.05],
      [-1, 1, 0.05],
    ],
    "#4e6258",
    5,
  )}${polygon(
    [
      [-2.5, -1.4, 0],
      [-2, -1.4, 0],
      [-2, 1.4, 0],
      [-2.5, 1.4, 0],
    ],
    "#c1c9b8",
  )}</g>`;
  illustration += `<g data-ramp-part="wheeled-base">${wheels.map((x) => wheel(x, platformRight + 0.13)).join("")}</g>`;
  illustration += `<g data-ramp-part="near-handrail">${posts.map((x) => post(x, 1.4)).join("")}${line(
    posts.map((x) => rail(x, 1.4)),
    "#344d4c",
    4.5,
  )}${line(
    posts.map((x) => [x, 1.37, height(x) + 1.28]),
    "#90a297",
    0.9,
  )}</g>`;
  // Only the end and right edges have platform rails. The uphill ramp post
  // already supplies the shared right-hand corner; don't draw it twice.
  illustration += `<g data-ramp-part="platform-handrails">${[
    [18.2, platformLeft],
    [18.2, platformRight],
  ]
    .map(([x, y]) => post(x, y))
    .join("")}${line(
    [rail(18.2, platformLeft), rail(18.2, platformRight)],
    "#344d4c",
    4.5,
    'data-platform-railing="end"',
  )}${line(
    [rail(18.2, platformRight), rail(14, platformRight)],
    "#344d4c",
    4.5,
    'data-platform-railing="right"',
  )}</g>`;
  return `<svg viewBox="0 0 800 650" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="ramp-title ramp-description">
    <title id="ramp-title">Sean's portable wheelchair ramp: long metal deck, wheeled base, and square upper platform</title>
    <desc id="ramp-description">An architectural illustration based on the project photograph, showing the sloping metal ramp with traction strips, wooden posts, dark handrails, wheels along the base, and a broad square landing at the top. Facing uphill, the ramp and landing share one continuous right edge. The landing has rails only along its right and far edges; the entrance and left side are open. Not to scale.</desc>
    <defs><pattern id="ramp-grid" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M25 0H0V25" fill="none" stroke="#6d7d73" stroke-opacity=".075"/></pattern><linearGradient id="ramp-metal" x1="0" y1="0" x2="1" y2=".7"><stop stop-color="#a4b5ac"/><stop offset=".28" stop-color="#dfe4d4"/><stop offset=".52" stop-color="#bcc9be"/><stop offset=".7" stop-color="#f0eddb"/><stop offset="1" stop-color="#a8b9ae"/></linearGradient></defs>
    <path d="M0 0H800V650H0Z" fill="url(#ramp-grid)"/>
    <g font-family="monospace" font-size="10" letter-spacing="1.3" fill="#496555"><text x="36" y="38">A WAY IN. BUILT TO MOVE.</text></g>
    ${illustration}
    <g fill="none" stroke="#9b956d" stroke-width=".8"><path d="M609 74H702V155"/><path d="M48 285H175L259 339"/><path d="M541 361L576 434H642"/></g>
    <g font-family="monospace" font-size="10" letter-spacing="1.1" fill="#496555"><text x="543" y="61">SQUARE UPPER PLATFORM</text><text x="48" y="274">LONG METAL DECK</text><text x="577" y="454">WHEELED BASE</text><text x="36" y="621">PROJECT STUDY · DRAWN FROM THE PHOTOGRAPH · NOT TO SCALE</text></g>
  </svg>`;
}
