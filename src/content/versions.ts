// The single source of truth for the multiverse: every version of the site,
// consumed by both the Nexus page markup (labels, fallbacks) and the 3D scene.
// Adding a version = one entry here + an interior builder in scripts/nexus.ts.
export interface VersionDef {
  name: string;
  href: string;
  glyph: string;
  label: string;
  branch: string;
  blurb: string;
  color: string;
  /** Which miniature world lives inside this version's orb. */
  interior: "aurora" | "cards" | "rain" | "halfpipe" | "ring" | "blueprint" | "globe";
}

export const VERSIONS: readonly VersionDef[] = [
  {
    name: "a-scroll",
    href: "/?v=a-scroll",
    glyph: "∿",
    label: "Scroll",
    branch: "version/a-scroll",
    blurb: "a cinematic story",
    color: "#7c83ff",
    interior: "aurora",
  },
  {
    name: "b-card",
    href: "/?v=b-card",
    glyph: "▣",
    label: "Card",
    branch: "version/b-card",
    blurb: "a tactile gallery",
    color: "#ff9e64",
    interior: "cards",
  },
  {
    name: "c-terminal",
    href: "/?v=c-terminal",
    glyph: "❯",
    label: "Terminal",
    branch: "version/c-terminal",
    blurb: "a working shell",
    color: "#3ddc84",
    interior: "rain",
  },
  {
    name: "d-3d-game",
    href: "/?v=d-3d-game",
    glyph: "⌣",
    label: "Halfpipe",
    branch: "version/d-3d-game",
    blurb: "a snowboard run",
    color: "#2ac3de",
    interior: "halfpipe",
  },
  {
    name: "e-2d-game",
    href: "/?v=e-2d-game",
    glyph: "◇",
    label: "Counter",
    branch: "version/e-2d-game",
    blurb: "a title fight",
    color: "#f7768e",
    interior: "ring",
  },
  {
    name: "f-blueprint",
    href: "/systems/",
    glyph: "⌗",
    label: "Blueprint",
    branch: "version/f-blueprint",
    blurb: "a living system map",
    color: "#7ee6c2",
    interior: "blueprint",
  },
  {
    name: "g-travel",
    href: "/travel/",
    glyph: "◎",
    label: "G Travel",
    branch: "version/g-travel",
    blurb: "a living travel atlas",
    color: "#ffb45b",
    interior: "globe",
  },
];
