import { archPath, mosaicTiles, random } from "./geometry.mjs";

const svg = (body: string, viewBox = "0 0 800 900") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none" aria-hidden="true">${body}</svg>`;
const tiles = (seed: number, w: number, h: number, step: number) =>
  mosaicTiles(seed, w, h, step)
    .map(
      (t) =>
        `<path d="M${t.points.map((p) => p.join(",")).join("L")}Z" fill="${t.color}" stroke="#dfd2b1" stroke-width="1.3"/><path d="M${t.points[0].join(",")}L${t.points[1].join(",")}" stroke="#fff3cb" stroke-opacity="${(0.1 + t.sheen * 0.24).toFixed(2)}"/>`,
    )
    .join("");

export function portalArt(id = "portal", seed = 190826) {
  const r = random(seed);
  const leaves = Array.from({ length: 80 }, (_, i) => {
    const a = i * 2.399,
      d = 13 * Math.sqrt(i),
      x = 400 + Math.cos(a) * d,
      y = 236 + Math.sin(a) * d * 0.8;
    return `<ellipse cx="${x}" cy="${y}" rx="${8 + r() * 14}" ry="${3 + r() * 6}" transform="rotate(${(a * 180) / Math.PI} ${x} ${y})" fill="${["#e5c276", "#688e78", "#b78441", "#eee0b3"][i % 4]}" stroke="#163c40" stroke-width="2"/>`;
  }).join("");
  const ribs = Array.from({ length: 14 }, (_, i) => {
    const p = archPath(400, 37 + i * 13, 770 - i * 36, 810 - i * 12);
    return `<path d="${p}" fill="url(#${id}-stone)" stroke="#a2916b" stroke-width="1.2"/><path d="${archPath(398, 34 + i * 13, 764 - i * 36, 810 - i * 12, false)}" stroke="#f6ebcb" stroke-opacity=".75" stroke-width="3"/>`;
  }).join("");
  const branch = (x: number, sign: number) =>
    `<path d="M${x} 800 Q${x + sign * 45} 585 ${x + sign * 12} 475 Q${x - sign * 20} 370 400 236 M${x + sign * 12} 475 Q${x + sign * 80} 370 ${x + sign * 80} 320" stroke="#153c3f" stroke-width="12"/><path d="M${x - 3} 800 Q${x + sign * 45 - 3} 585 ${x + sign * 12 - 3} 475 Q${x - sign * 20} 370 400 236" stroke="#9daf8d" stroke-width="3"/>`;
  return svg(`<defs>
    <linearGradient id="${id}-stone" x1="0" y1="0" x2="1" y2=".3"><stop stop-color="#b7a77e"/><stop offset=".26" stop-color="#f0e5c6"/><stop offset=".56" stop-color="#cab78c"/><stop offset=".8" stop-color="#f7e9c3"/><stop offset="1" stop-color="#8d7c57"/></linearGradient>
    <radialGradient id="${id}-sky"><stop stop-color="#efdaa0"/><stop offset=".4" stop-color="#9bac91"/><stop offset="1" stop-color="#225963"/></radialGradient>
    <linearGradient id="${id}-floor" x2="0" y2="1"><stop stop-color="#163f46"/><stop offset="1" stop-color="#102e35"/></linearGradient>
    <clipPath id="${id}-clip"><path d="${archPath(400, 219, 292, 629)}"/></clipPath>
    <filter id="${id}-grain"><feTurbulence type="fractalNoise" baseFrequency=".72" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".13"/></feComponentTransfer><feComposite in2="SourceGraphic" operator="in" result="grain"/><feBlend in="SourceGraphic" in2="grain" mode="multiply"/></filter>
  </defs>
  <g filter="url(#${id}-grain)">${ribs}</g>
  <g clip-path="url(#${id}-clip)"><path d="M0 0H800V900H0Z" fill="url(#${id}-sky)"/>
    <g opacity=".65" transform="translate(230 170)">${tiles(seed, 350, 650, 28)}</g>
    <path d="M200 585 Q400 545 600 585V900H200Z" fill="url(#${id}-floor)"/>
    ${Array.from({ length: 15 }, (_, i) => `<path d="M400 567L${i * 75 - 125} 900" stroke="#81a08b" stroke-opacity=".24"/>`).join("")}
    ${Array.from({ length: 12 }, (_, i) => `<path d="M200 ${590 + i * i * 2}H600" stroke="#81a08b" stroke-opacity=".22"/>`).join("")}
    ${branch(290, 1)}${branch(510, -1)}${leaves}
    <ellipse cx="400" cy="264" rx="39" ry="50" fill="#f4e3a7" stroke="#264e48" stroke-width="6"/>
    <path d="M400 214V314M361 264H439" stroke="#657b5b" stroke-width="3"/>
    <path class="portal-sunbeam" d="M393 313L336 720Q400 739 464 720L407 313" fill="#e9c275" opacity=".1"/>
  </g>
  <path d="M64 856H736M40 866H760M15 880H785" stroke="#bbac83" stroke-width="5"/>
  <path d="M374 879L390 850H410L429 879" fill="#b98746" stroke="#e6d1a5" stroke-width="2"/>
  <g transform="translate(367 100)"><path d="M33 0C36 20 58 29 66 33C47 39 37 47 33 66C26 48 18 38 0 33C20 27 27 20 33 0Z" fill="#bd965b" stroke="#f2deb5"/></g>`);
}

export function projectArt(kind: string, id: string) {
  const defs = `<defs><pattern id="${id}-grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" stroke="currentColor" stroke-opacity=".1"/></pattern></defs><path d="M0 0H600V460H0Z" fill="url(#${id}-grid)"/>`;
  let body = "";
  if (kind === "gateway") {
    body =
      Array.from(
        { length: 9 },
        (_, i) =>
          `<path d="${archPath(300, 50 + i * 13, 400 - i * 32, 342 - i * 12, false)}" stroke="currentColor" stroke-width="${i === 8 ? 3 : 1}"/>`,
      ).join("") +
      `<path d="M40 390H560M300 28V430" stroke="currentColor" stroke-opacity=".3" stroke-dasharray="4 6"/><circle cx="300" cy="225" r="22" fill="#c69a58"/><path d="M293 225l5 5 11-12" stroke="#163f43" stroke-width="2"/>`;
  } else if (kind === "consent") {
    body =
      Array.from(
        { length: 32 },
        (_, i) =>
          `<ellipse cx="300" cy="230" rx="${65 + i * 3}" ry="${143 - i * 1.7}" transform="rotate(${i * 11.25} 300 230)" stroke="currentColor" stroke-opacity=".6" stroke-width=".8"/>`,
      ).join("") +
      `<circle cx="300" cy="230" r="50" fill="#ecdfbf"/><path d="M275 230h50M300 205v50" stroke="#8c572d" stroke-width="1.4"/>`;
  } else if (kind === "data") {
    body =
      Array.from(
        { length: 26 },
        (_, i) =>
          `<path d="M60 ${60 + i * 13}C210 ${30 + i * 7} 230 ${445 - i * 9} 300 230S430 ${40 + i * 5} 540 ${60 + i * 13}" stroke="currentColor" stroke-opacity="${0.35 + i * 0.02}" stroke-width="1"/>`,
      ).join("") + `<circle cx="300" cy="230" r="7" fill="#e1b768"/>`;
  } else {
    body = Array.from({ length: 9 }, (_, i) => {
      const x = 100 + (i % 3) * 200,
        y = 90 + Math.floor(i / 3) * 145;
      return `<path d="${archPath(x, y - 35, 84, 100)}" fill="${i === 8 ? "#ba8446" : "none"}" stroke="currentColor" stroke-width="1.5"/><path d="M${x} ${y + 60}V${y - 5}" stroke="currentColor" stroke-opacity=".5"/>`;
    }).join("");
  }
  return svg(`${defs}${body}`, "0 0 600 460");
}

export function treeArt() {
  const r = random(414),
    parts: string[] = [];
  function branch(
    x: number,
    y: number,
    length: number,
    angle: number,
    depth: number,
  ) {
    const xx = x + Math.sin(angle) * length,
      yy = y - Math.cos(angle) * length;
    parts.push(
      `<path d="M${x} ${y}Q${x + Math.sin(angle - 0.13) * length * 0.55} ${y - Math.cos(angle) * length * 0.55} ${xx} ${yy}" stroke="#355d52" stroke-width="${depth * 0.9 + 0.35}"/>`,
    );
    if (depth > 0) {
      branch(
        xx,
        yy,
        length * (0.65 + r() * 0.1),
        angle - 0.28 - r() * 0.34,
        depth - 1,
      );
      branch(
        xx,
        yy,
        length * (0.65 + r() * 0.1),
        angle + 0.28 + r() * 0.34,
        depth - 1,
      );
    } else
      parts.push(
        `<ellipse cx="${xx}" cy="${yy}" rx="${4 + r() * 5}" ry="${9 + r() * 5}" fill="${["#a7ae7b", "#b8b486", "#527766", "#c39658"][Math.floor(r() * 4)]}" transform="rotate(${(angle * 180) / Math.PI} ${xx} ${yy})"/>`,
      );
  }
  branch(300, 840, 215, 0, 6);
  return svg(parts.join(""), "0 0 600 900");
}

export function courtyardArt() {
  const r = random(810);
  const plant = (x: number, y: number, scale: number) =>
    `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M-25 0H25L17 45H-17Z" fill="#b5704d" stroke="#664b35"/><path d="M0 0Q-40-65-12-120M0 0Q44-72 25-140M0 0V-158" stroke="#3c6351" stroke-width="3"/><g fill="#50765a">${Array.from({ length: 8 }, (_, i) => `<ellipse cx="${i % 2 ? 14 : -15}" cy="${-20 - i * 16}" rx="17" ry="6" transform="rotate(${i % 2 ? -35 : 35} ${i % 2 ? 14 : -15} ${-20 - i * 16})"/>`).join("")}</g></g>`;
  return svg(
    `<defs><pattern id="court-tiles" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M40 0L80 40 40 80 0 40Z" stroke="#b6aa7f" fill="#e2d7b5"/><path d="M30 30L50 30 50 50 30 50Z" fill="#95a28a"/></pattern></defs>
    <path d="M50 330Q400 240 750 330V610H50Z" fill="url(#court-tiles)"/>
    <path d="${archPath(410, 35, 275, 355)}" fill="#37696b" stroke="#b4a17a" stroke-width="18"/>
    ${Array.from({ length: 5 }, (_, i) => `<path d="${archPath(410, 17 - i * 8, 310 + i * 21, 373 + i * 9, false)}" stroke="${i % 2 ? "#f7edd3" : "#b4a17a"}" stroke-width="${i % 2 ? 2 : 1.2}"/>`).join("")}
    <path d="${archPath(410, 60, 225, 330, false)}" stroke="#f0e4bc" stroke-width="4"/>
    <path d="M410 68V390M303 240H520" stroke="#e2d5ad" stroke-width="5"/>
    <circle cx="454" cy="168" r="34" fill="#e4bb70"/>
    <path d="M304 329l45-65 59 40 61-87 50 94V386H304Z" fill="#718e7e"/>
    <path d="M349 264l-9 38 16-11 21 25M469 217l-22 54 16-16 21 15" stroke="#c4c7a3" stroke-width="1" fill="none"/>
    ${Array.from({ length: 25 }, () => {
      const x = 312 + r() * 198,
        y = 315 + r() * 66;
      return `<path d="M${x} ${y}l${12 + r() * 12} -${2 + r() * 4}" stroke="#a3b296" stroke-width=".65" opacity=".6"/>`;
    }).join("")}
    <path d="M166 412Q380 350 598 418L591 449Q380 400 170 454Z" fill="#af7d47" stroke="#735c3c" stroke-width="3"/>
    <path d="M197 449L187 529M562 449L575 529" stroke="#6e5638" stroke-width="13"/>
    <path d="M203 418Q374 377 551 423M235 431Q376 400 517 434" stroke="#e5be7a" stroke-width="2"/>
    <defs><clipPath id="wood-clip"><path d="M166 412Q380 350 598 418L591 449Q380 400 170 454Z"/></clipPath></defs>
    <g clip-path="url(#wood-clip)">${Array.from({ length: 32 }, (_, i) => `<path d="M160 ${410 + i * 1.8}Q${335 + r() * 30} ${352 + i * 1.8} 605 ${422 + i * 1.8}" stroke="${i % 3 ? "#6d502f" : "#efd398"}" stroke-width="${0.3 + r() * 0.5}" opacity=".5"/>`).join("")}<ellipse cx="274" cy="420" rx="19" ry="4" stroke="#765d38"/><ellipse cx="274" cy="420" rx="11" ry="2" stroke="#765d38"/></g>
    ${plant(113, 366, 0.85)}${plant(664, 359, 1.3)}
    <g class="sunny-cat" transform="translate(456 411)"><path d="M-34 0Q-48-28-28-33Q-38-59-14-66L-12-80 0-72 16-77 17-61Q34-47 17-30Q42-15 33 0Z" fill="#cb9a52" stroke="#886338" stroke-width="1.5"/><path class="sunny-tail" d="M-28-10Q-65-20-62 3Q-60 17-39 7" stroke="#cb9a52" stroke-width="9"/><path d="M-10-53q4 3 8 0M7-53q4 3 8 0M1-48l3 2 3-2M-16-43l-20-3M-16-40l-19 2M17-43l18-4M17-40l20 1" stroke="#624f34" stroke-width="1" fill="none"/><path d="M-12-67l7 7M-3-70l5 10M8-69l-2 9M-29-27l11 4M-34-18l11 4M18-20l-9 5" stroke="#a8793c" stroke-width="2.5"/></g>
    <path d="M353 610Q370 532 325 501" stroke="#b98547" stroke-width="8" stroke-dasharray="14 3"/>
  `,
    "0 0 800 640",
  );
}
