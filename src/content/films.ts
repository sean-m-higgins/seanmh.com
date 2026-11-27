export interface FilmStep {
  t: number;
  label: string;
}

export interface Film {
  slug: "grain" | "gesso" | "ramp" | "sunny" | "purr";
  title: string;
  subject: string;
  kind: "how-to" | "story" | "portrait" | "loop";
  model: string;
  year: number;
  duration: number;
  /** Has a soundtrack: the player is not muted. The rest of the series is silent. */
  sound?: boolean;
  sentence: string;
  room?: "woodshop" | "art" | "eagle";
  notes?: { kicker: string; heading: string };
  materials?: string[];
  tools?: string[];
  steps?: FilmStep[];
  synopsis?: string[];
  facts?: { label: string; value: string }[];
}

export const films: Film[] = [
  {
    slug: "grain",
    title: "grain",
    subject: "a coffee table, built in a garage",
    kind: "how-to",
    model: "Claude Fable 5.2",
    year: 2026,
    duration: 55.5,
    sentence: "A coffee table moves from one pencil mark to dark oak, flush glass, and a place in the room.",
    room: "woodshop",
    materials: ["Mostly oak", "30 × 14 in glass", "Wooden dowels", "Wood glue", "Small screws", "Dark brown stain", "Two coats of polyurethane"],
    tools: ["Tape measure and pencil", "Mitre saw", "Drill", "Router", "Power sander", "Clamps — and one weight plate"],
    steps: [
      { t: 0, label: "Draw it first" },
      { t: 8, label: "Pick good boards" },
      { t: 12.5, label: "Measure twice" },
      { t: 16.5, label: "Cut" },
      { t: 24, label: "Sand" },
      { t: 29, label: "Dry fit" },
      { t: 34, label: "Set the glass" },
      { t: 39, label: "Stain in pieces" },
      { t: 43.5, label: "Glue up" },
      { t: 49, label: "Finish" },
    ],
  },
  {
    slug: "gesso",
    title: "gesso",
    subject: "a canvas, built and painted in an apartment",
    kind: "how-to",
    model: "Claude Fable 5.2",
    year: 2026,
    duration: 74,
    sentence: "A blank apartment wall becomes a frame, a stretched canvas, and a field dense with painted flowers.",
    room: "art",
    materials: ["Wood for a 3 × 4 ft frame", "Screws and brackets", "Canvas fabric", "Staples", "Gesso", "Oil paint", "Painting medium"],
    tools: ["Hand saw", "Sanding block", "Drill", "Staple gun", "Scissors", "Brushes and palette knife"],
    steps: [
      { t: 0, label: "Measure the wall" },
      { t: 11.5, label: "Gather" },
      { t: 15, label: "Cut by hand" },
      { t: 22, label: "Build the frame" },
      { t: 26.5, label: "Stretch" },
      { t: 30, label: "Staple, rotate" },
      { t: 36, label: "Trim and flip" },
      { t: 42, label: "Prime it first" },
      { t: 46.5, label: "Paint" },
      { t: 63.5, label: "Hang" },
    ],
  },
  {
    slug: "ramp",
    title: "ramp",
    subject: "a portable wheelchair ramp, made as an Eagle Scout project",
    kind: "story",
    model: "Claude Fable 5.2",
    year: 2026,
    duration: 89,
    sentence: "A challenge at a stable becomes three wheeled sections, a long steel build, and a way in from the rain.",
    room: "eagle",
    synopsis: [
      "At sixteen, Sean asked a therapeutic riding centre what Eagle Scout project would help most. Their answer grew into a portable wheelchair ramp: safe, towable, and manageable one section at a time.",
      "Family, friends, volunteers, and a neighbour who welded helped turn the design into steel. The finished ramp was tested with a wheelchair, delivered in pieces on two trailers, and left to serve riders the builders might never meet.",
    ],
    facts: [
      { label: "Built", value: "roughly 2014–2016" },
      { label: "Overall", value: "about 25 ft long × 5 ft wide" },
      { label: "Structure", value: "three wheeled sections joined with metal pins" },
      { label: "Slope", value: "designed to the ADA 1:12 maximum" },
      { label: "Moving it", value: "each section towable by ATV" },
      { label: "Threshold", value: "a hinged toe plate folds to the ground" },
    ],
  },
  {
    slug: "sunny",
    title: "sunny",
    subject: "a day with Sunny, the tripod cat",
    kind: "portrait",
    model: "Claude Fable 5.2",
    year: 2026,
    duration: 62,
    sentence: "One day with Sunny, from the first patch of morning sun to the last warm one, built in felt and card.",
    notes: { kicker: "The subject", heading: "A day with Sunny." },
    synopsis: [
      "Sunny is a tripod cat: three legs and a bob of a tail. He sits bolt upright in the morning sun, hops straight into the lens, plays fetch with a striped mouse on a ribbon, and goes straight up after a feather. Then the hallway, the window at dusk, a lamp, and sleep.",
      "Every moment comes from Sean’s own videos of him, and so does the way he moves: the front legs step, the one hind leg hops. None of the footage appears: the cat, the rooms and the light were rebuilt as a small felt-and-card miniature in Blender, written entirely in code, and shot like stop motion.",
    ],
    facts: [
      { label: "Coat", value: "spotted tabby" },
      { label: "Legs", value: "three, with the hind paw under the middle" },
      { label: "Tail", value: "a bob" },
      { label: "Eyes", value: "yellow-green" },
      { label: "Games", value: "fetch, and the feather wand" },
      { label: "Made in", value: "Blender, from Python, with no hand keyframes" },
      { label: "Motion", value: "twelve poses a second, each held for two frames" },
      { label: "Drawn from", value: "four home videos" },
    ],
  },
  {
    slug: "purr",
    title: "purr",
    subject: "four cats through one day, on a loop",
    kind: "loop",
    model: "Claude Fable 5.2",
    year: 2026,
    duration: 300,
    sound: true,
    sentence: "Four cats through one day, from first light on the bed to all of them asleep on the sofa, and round again.",
    notes: { kicker: "The subject", heading: "A day with four cats." },
    synopsis: [
      "The cats of Sean’s life: Sunny the tabby, a Russian blue, a black cat, and a grey-and-white tabby. One day in eighteen quiet scenes: a yawn at dawn, tea on the window sill, breakfast, a patch of sun, a butterfly on the balcony, a bee in the garden, a quilt to knead, a nap on the piano, the fish tank, rain on the glass, a box at golden hour, a rooftop at sunset, the kitchen at dusk, a record turning, the wood stove, a pencil on the desk, the house under the stars, and the sofa, where all four fall asleep together and the lamp goes out.",
      "It is made to run on repeat. Night dissolves back into dawn, and the music, a felt piano with a small band around it, turns the same corner, so there is no place where it starts. Both the pictures and the music are written entirely in code.",
    ],
    facts: [
      { label: "Cats", value: "a tabby (Sunny, on three legs), a Russian blue, a black cat, a grey-and-white tabby" },
      { label: "Length", value: "five minutes, eighteen scenes" },
      { label: "Shape", value: "a seamless loop: night dissolves into dawn" },
      { label: "Music", value: "felt piano, bass, brushes, strings and celesta in D♭, 64 BPM, 80 bars" },
      { label: "Made in", value: "JavaScript on a canvas; the music in Python" },
      { label: "Motion", value: "everything moves on twos, twelve drawings a second" },
    ],
  },
];

export const newestFilm = films[films.length - 1];
export const getFilm = (slug: string) => films.find((film) => film.slug === slug);

export function formatDuration(seconds: number) {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function filmPath(slug: Film["slug"]) {
  return `/films/${slug}/`;
}
