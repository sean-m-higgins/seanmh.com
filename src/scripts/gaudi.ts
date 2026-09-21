import {
  mosaicTiles,
  mosaicTitle,
  normalizeSeed,
  seedURL,
  normalizeMosaic,
  mosaicOptionsFromURL,
  DEFAULT_MOSAIC,
  motifs,
  glazes,
  forms,
} from "../lib/geometry.mjs";
import { initStudies } from "./studies";

const $ = <T extends Element = HTMLElement>(q: string) =>
  document.querySelector<T>(q)!;
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const rooms = [...document.querySelectorAll<HTMLElement>("[data-room]")];
const links = [
  ...document.querySelectorAll<HTMLAnchorElement>("[data-chapter-link]"),
];
document
  .querySelectorAll<HTMLElement>(".enhancement")
  .forEach((el) => (el.hidden = false));

// One path measured against actual document layout, including expanded details.
function drawInlay() {
  const main = $("#main"),
    box = main.getBoundingClientRect(),
    w = box.width;
  const x = w < 760 ? 10 : Math.max(50, w * 0.047);
  let path = `M${x},0`;
  rooms.forEach((room, i) => {
    const y = room.getBoundingClientRect().top - box.top,
      h = room.offsetHeight;
    const dx = w < 760 ? 3 : 9;
    const reach = w < 760 ? 18 : ([80, 130, 80, 100, 150, 100, 60][i] ?? 80);
    path += ` L${x},${y} C${x},${y + 12} ${x + reach},${y + 4} ${x + reach},${y + 22}`;
    path += ` C${x + reach},${y + 40} ${x},${y + 24} ${x},${y + 42} C${x + dx},${y + h * 0.35} ${x - dx},${y + h * 0.75} ${x},${y + h}`;
  });
  document
    .querySelectorAll(".inlay path")
    .forEach((el) => el.setAttribute("d", path));
}
let layoutFrame = 0;
const resize = new ResizeObserver(() => {
  cancelAnimationFrame(layoutFrame);
  layoutFrame = requestAnimationFrame(drawInlay);
});
resize.observe($("#main"));
drawInlay();

let scrollFrame = 0;
function activeChapter() {
  const target = rooms.reduce(
    (found, room) =>
      room.getBoundingClientRect().top <= innerHeight * 0.4 ? room : found,
    rooms[0],
  );
  links.forEach((link) => {
    if (link.dataset.chapterLink === target.id)
      link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
  $(".rail-progress").textContent =
    `${target.dataset.room} / ${String(rooms.length).padStart(2, "0")}`;
  document.body.dataset.activeRoom = target.id;
  scrollFrame = 0;
}
addEventListener(
  "scroll",
  () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(activeChapter);
  },
  { passive: true },
);
activeChapter();

const reveal = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) =>
      e.target.classList.toggle("is-visible", e.isIntersecting),
    ),
  { threshold: 0.15 },
);
document
  .querySelectorAll(".exhibit,.courtyard,.hero-architecture")
  .forEach((el) => reveal.observe(el));

initStudies();

let seed = normalizeSeed(new URL(location.href).searchParams.get("seed"));
let options = mosaicOptionsFromURL(location.href);
const optionInputs = [
  ...document.querySelectorAll<HTMLSelectElement>("[data-mosaic-option]"),
];
optionInputs.forEach((input) => {
  const legacy = new Option("Original edition", "");
  legacy.disabled = true;
  input.add(legacy);
});
const selectedLabel = (choices: { id: string; label: string }[], key: string) =>
  choices.find((choice) => choice.id === options?.[key])?.label ??
  "Original edition";
function renderMosaic() {
  $("#mosaic-tiles").innerHTML = mosaicTiles(
    seed,
    600,
    600,
    options ? 30 : 36,
    options,
  )
    .map(
      (t) =>
        `<polygon points="${t.points.map((p) => p.join(",")).join(" ")}" fill="${t.color}" stroke="#f0e4c7" stroke-width="2"/>`,
    )
    .join("");
  $("#tile-clip path").setAttribute(
    "d",
    forms.find((form) => form.id === (options?.form ?? "round"))!.path,
  );
  $("#mosaic-title").textContent = mosaicTitle(seed, options);
  $("#mosaic-edition").textContent = options
    ? `${selectedLabel(glazes, "glaze")} / ${selectedLabel(forms, "form")} / ${seed}`
    : `ORIGINAL CERAMIC STUDY / ${seed}`;
  optionInputs.forEach((input) => {
    input.value = options?.[input.dataset.mosaicOption!] ?? "";
  });
  $("#mosaic").setAttribute(
    "aria-label",
    `Ceramic study: ${mosaicTitle(seed, options)}, ${selectedLabel(glazes, "glaze")}, ${selectedLabel(forms, "form")}, seed ${seed}`,
  );
}
renderMosaic();
function rememberMosaic() {
  renderMosaic();
  history.replaceState(null, "", seedURL(location.href, seed, options));
  $("#mosaic-status").textContent =
    `A new study: ${mosaicTitle(seed, options)} in ${selectedLabel(glazes, "glaze")}.`;
}
optionInputs.forEach((input) =>
  input.addEventListener("change", () => {
    options = normalizeMosaic({
      ...(options ?? DEFAULT_MOSAIC),
      [input.dataset.mosaicOption!]: input.value,
    });
    rememberMosaic();
  }),
);
$("#reroll").addEventListener("click", () => {
  const randoms = crypto.getRandomValues(new Uint32Array(4));
  seed = randoms[0];
  // Always change the pattern, not just its triangulation.
  const alternatives = motifs.filter((motif) => motif.id !== options?.motif);
  options = {
    motif: alternatives[randoms[1] % alternatives.length].id,
    glaze: glazes[randoms[2] % glazes.length].id,
    form: forms[randoms[3] % forms.length].id,
  };
  rememberMosaic();
});
addEventListener("popstate", () => {
  seed = normalizeSeed(new URL(location.href).searchParams.get("seed"));
  options = mosaicOptionsFromURL(location.href);
  renderMosaic();
});
$("#copy-tile").addEventListener("click", async () => {
  const url = seedURL(location.href, seed, options).href;
  try {
    await navigator.clipboard.writeText(url);
    $("#mosaic-status").textContent =
      "Its address is copied. This composition will be waiting there.";
  } catch {
    $("#mosaic-status").textContent = `Copy this address: ${url}`;
  }
});
$("#save-tile").addEventListener("click", async () => {
  const button = $<HTMLButtonElement>("#save-tile");
  button.disabled = true;
  // Freeze the artwork before font/image awaits; later changes cannot alter this export.
  const exportSeed = seed;
  const exportTitle = mosaicTitle(seed, options);
  const exportOptions = options ? { ...options } : undefined;
  const exportEdition = $("#mosaic-edition").textContent!;
  const markup = new XMLSerializer().serializeToString($("#mosaic"));
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 1400;
  const context = canvas.getContext("2d");
  let source = "";
  try {
    if (!context) throw new Error("Canvas unavailable");
    await document.fonts.ready;
    source = URL.createObjectURL(
      new Blob([markup], { type: "image/svg+xml;charset=utf-8" }),
    );
    const img = new Image();
    img.src = source;
    await img.decode();
    context.fillStyle = "#f5efdf";
    context.fillRect(0, 0, 1200, 1400);
    context.drawImage(img, 90, 40, 1020, 1020);
    context.fillStyle = "#203e3d";
    context.textAlign = "center";
    context.font = 'italic 54px "Cormorant Garamond Variable", Georgia';
    context.fillText(exportTitle, 600, 1140);
    context.font = '18px "Manrope Variable", Arial';
    context.fillText(
      `CASA HIGGINS / ${exportEdition.toUpperCase()}`,
      600,
      1200,
    );
    context.font = '16px "Manrope Variable", Arial';
    context.fillText("seanmh.com · a small thing to keep", 600, 1290);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Export unavailable"))),
        "image/png",
      ),
    );
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `casa-higgins-${exportOptions?.motif ?? "original"}-${exportOptions?.glaze ?? "glaze"}-${exportOptions?.form ?? "round"}-${exportSeed}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    $("#mosaic-status").textContent =
      "Your tile is ready. Thank you for stopping by.";
  } catch {
    $("#mosaic-status").textContent =
      "The tile could not be saved here. You can still copy its address.";
  } finally {
    if (source) URL.revokeObjectURL(source);
    button.disabled = false;
  }
});

// Keep the full illustrated experience on touch/small screens without GPU startup.
const desktopLight = matchMedia(
  "(min-width: 900px) and (hover: hover) and (pointer: fine)",
);
let lightStarted = false;
const observer = new IntersectionObserver(
  (entries) => {
    if (
      entries.some((e) => e.isIntersecting) &&
      !reduced.matches &&
      desktopLight.matches &&
      !lightStarted
    ) {
      lightStarted = true;
      import("./lightwell")
        .then((m) =>
          m.initLightwell(
            $<HTMLCanvasElement>("#lightwell"),
            $(".hero-architecture"),
          ),
        )
        .catch(() => {
          /* The complete architectural SVG remains visible. */
        });
    }
  },
  { rootMargin: "100px" },
);
observer.observe($("#threshold"));
