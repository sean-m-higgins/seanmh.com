import { chainPoints, mosaicTiles } from "./geometry.mjs";

const line = (x1, y1, x2, y2, color, width = 1, opacity = 1) =>
  `<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${width}" opacity="${opacity}"/>`;

export function chainStudy(value = 110) {
  const pts = chainPoints(value, 400);
  const curve = (flip) =>
    pts
      .map(
        ([x, y], i) => `${i ? "L" : "M"}${80 + x},${flip ? 455 - y : 75 + y}`,
      )
      .join(" ");
  return `<path d="M80 55V210M480 55V210M60 75H500M60 455H500M280 30V510" class="construction-line"/>
    <path d="${curve(false)}" id="chain-hanging" class="chain-hanging"/>
    <path d="${curve(true)}" id="chain-arch" class="chain-arch"/>
    <circle cx="80" cy="75" r="5" fill="currentColor"/><circle cx="480" cy="75" r="5" fill="currentColor"/>
    <path d="M263 257h34m-6-6 6 6-6 6" stroke="currentColor" fill="none"/>
    <text x="80" y="40">TENSION</text><text x="80" y="490">COMPRESSION</text>
    <g id="chain-hangers">${pts
      .filter((_, i) => i % 10 === 0)
      .map(([x, y]) => line(80 + x, 455, 80 + x, 455 - y, "#355b4d", 0.8, 0.4))
      .join("")}</g>`;
}

export function branchStudy(value = 30) {
  let paths = "";
  function branch(x, y, length, angle, depth) {
    const ex = x + Math.sin(angle) * length,
      ey = y - Math.cos(angle) * length;
    paths += line(
      x + 3,
      y + 3,
      ex + 3,
      ey + 3,
      "#aa936d",
      (depth + 1) * 3.4,
      0.24,
    );
    paths += line(
      x,
      y,
      ex,
      ey,
      depth > 1 ? "#496852" : "#819675",
      (depth + 1) * 2.6,
    );
    if (depth > 0) {
      const spread = (value * Math.PI) / 180;
      branch(ex, ey, length * 0.67, angle - spread, depth - 1);
      branch(ex, ey, length * 0.67, angle + spread, depth - 1);
    } else {
      paths += `<circle cx="${ex}" cy="${ey}" r="5" fill="#b58c3c"/><circle cx="${ex}" cy="${ey}" r="11" fill="none" stroke="#b58c3c" opacity=".3"/>`;
    }
  }
  branch(280, 470, 152, 0, 4);
  return `<ellipse cx="280" cy="475" rx="78" ry="13" fill="#c3b79a" opacity=".25"/>
    <path d="M280 30V495M70 470H490" class="construction-line"/>${paths}
    <text x="48" y="40">ONE TRUNK. MANY SUPPORTS.</text><text x="48" y="520">A GEOMETRIC STUDY, NOT A LOAD SIMULATION</text>`;
}

export function ruledStudy(value = 115) {
  const twist = (value * Math.PI) / 180;
  let back = "",
    front = "";
  for (let i = 0; i < 48; i++) {
    const theta = (i / 48) * Math.PI * 2;
    const x1 = 280 + 176 * Math.cos(theta),
      y1 = 115 + 45 * Math.sin(theta);
    const x2 = 280 + 176 * Math.cos(theta + twist),
      y2 = 430 + 45 * Math.sin(theta + twist);
    const strut = line(
      x1,
      y1,
      x2,
      y2,
      i % 4 === 0 ? "#b48437" : "#346d73",
      i % 4 === 0 ? 1.9 : 1.1,
      0.7,
    );
    if (Math.sin(theta) < 0) back += strut;
    else front += strut;
  }
  return `<path d="M280 40V510" class="construction-line"/>
    <ellipse cx="280" cy="430" rx="176" ry="45" fill="#bfb391" fill-opacity=".12" stroke="#a29575"/>
    ${back}${front}<ellipse cx="280" cy="115" rx="176" ry="45" fill="none" stroke="#a29575"/>
    <text x="48" y="40">48 STRAIGHT LINES</text><text x="48" y="520">CURVATURE THROUGH ROTATION</text>`;
}

export function lightStudy(value = 48) {
  let tiles = "";
  const colors = [
    "#2b5973",
    "#39718a",
    "#548e9f",
    "#7dabb4",
    "#acc7c8",
    "#d6dfd5",
    "#ebe7d4",
  ];
  for (let row = 0; row < 14; row++)
    for (let col = 0; col < 10; col++) {
      tiles += `<rect x="${92 + col * 37.5}" y="${80 + row * 27}" width="35.5" height="25" fill="${colors[Math.floor(row / 2)]}"/>`;
    }
  const sunX = 90 + value * 3.8,
    patchX = 460 - value * 3.6;
  return `<text x="48" y="40">DARKER ABOVE. LIGHTER BELOW.</text>
    <path d="M84 70H476V465H84Z" fill="#e0d7be"/>${tiles}
    <path d="M203 435V175Q280 58 357 175V435Z" fill="#e8ddc7" stroke="#f5efdf" stroke-width="8"/>
    <path d="M213 431V180Q280 78 347 180V431Z" fill="#34606b"/>
    <path d="M280 118V431M213 260H347" stroke="#e8ddc7" stroke-width="8"/>
    <path d="M${sunX} 62L${patchX - 65} 458L${patchX + 65} 458Z" fill="#fff1ba" opacity=".25"/>
    <ellipse cx="${patchX}" cy="460" rx="66" ry="13" fill="#f3d892" opacity=".85"/>
    <circle cx="${sunX}" cy="62" r="19" fill="#d5a645"/>
    <text x="48" y="520">A STUDY OF COLOR & LIGHT, NOT PHOTOMETRY</text>`;
}

export function fragmentStudy(value = 35) {
  const tiles = mosaicTiles(190826, 460, 420, value, {
    motif: "petals",
    glaze: "sea",
    form: "tile",
  });
  return `<text x="48" y="40">MANY FRAGMENTS. ONE SURFACE.</text>
    <g transform="translate(50 70)" clip-path="url(#fragments-clip)">${tiles.map((t) => `<polygon points="${t.points.map((p) => p.join(",")).join(" ")}" fill="${t.color}" stroke="#f1e5ca" stroke-width="2.8"/>`).join("")}</g>
    <text x="48" y="520">BROKEN PIECES, A CONTINUOUS PATTERN</text>`;
}

export const studyRenderers = {
  chain: chainStudy,
  branch: branchStudy,
  ruled: ruledStudy,
  light: lightStudy,
  fragments: fragmentStudy,
};
