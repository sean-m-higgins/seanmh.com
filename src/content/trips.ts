export type TransportMode = "air" | "rail" | "ferry" | "motorcycle" | "foot";

export interface RouteWaypoint {
  label: string;
  latitude: number;
  longitude: number;
  modeFromPrevious?: TransportMode;
}

export interface TripRoute {
  id: string;
  label: string;
  color: string;
  published: boolean;
  waypoints: RouteWaypoint[];
}

export interface TripRecord {
  slug: string;
  title: string;
  shortTitle: string;
  /** Position in the archive, numbered by when the journey happened. */
  number: string;
  dateStart: string;
  dateEnd: string;
  dateLabel: string;
  summary: string;
  kicker: string;
  accent: string;
  visitedCountries: string[];
  anchor: { latitude: number; longitude: number; label: string };
  /** Journal headline, split so the second half can be set in italic. */
  heading: { lead: string; emphasis: string };
  intro: { heading: string; body: string };
  /** The standing note at the foot of the journal page. */
  note: { title: string; body: string };
  route: TripRoute;
  links: {
    overview: string;
    photos: string;
    /** Only journeys planned in writing carry a preserved document. */
    htmlDownload?: string;
    pdfDownload?: string;
  };
}

export interface CountryRecord {
  iso2: string;
  atlasId: string;
  name: string;
  centroid: { latitude: number; longitude: number };
}

// Only countries the atlas can actually shade belong here. Monaco is visited on
// the France journey but is absent from the 110m topology, so it lives on that
// route as a waypoint rather than as a highlighted country.
export const countries: readonly CountryRecord[] = [
  {
    iso2: "NO",
    atlasId: "578",
    name: "Norway",
    centroid: { latitude: 65.1, longitude: 13.3 },
  },
  {
    iso2: "ES",
    atlasId: "724",
    name: "Spain",
    centroid: { latitude: 40.2, longitude: -3.6 },
  },
  {
    iso2: "FR",
    atlasId: "250",
    name: "France",
    centroid: { latitude: 46.6, longitude: 2.4 },
  },
];

// Newest first: the archive reads backwards from where Sean has just been.
export const trips: readonly TripRecord[] = [
  {
    slug: "norway-2026",
    title: "Oslo to Lofoten",
    shortTitle: "Norway 2026",
    number: "004",
    dateStart: "2026-08-19",
    dateEnd: "2026-08-25",
    dateLabel: "August 19–25, 2026",
    kicker: "Solo motorcycle journey",
    summary:
      "A late-summer line from Oslo to the Lofoten archipelago—north by air, across the Vestfjorden by ferry, then onto the E10 by motorcycle.",
    accent: "#ffb45b",
    visitedCountries: ["NO"],
    anchor: { latitude: 67.949, longitude: 13.133, label: "Hamnøy, Lofoten" },
    heading: { lead: "Oslo", emphasis: "to Lofoten." },
    intro: {
      heading: "Fly north. Cross the Vestfjorden. Pick up the road where the mountains meet it.",
      body: "The plan used Bodø as the hinge: an airport close to the motorcycle, a three-hour ferry that lands beside Reine, and three weather-flexible days based in a waterfront rorbu. The plan below is preserved as it existed before departure; the route atlas will show only the confirmed journey.",
    },
    note: {
      title: "Plan and record stay separate.",
      body: "The pre-trip document is useful because it shows the decisions before the outcome. Actual route coordinates and photo locations will be published only after they are confirmed.",
    },
    route: {
      id: "norway-2026-actual",
      label: "Actual route",
      color: "#ffb45b",
      // The pre-trip itinerary is not evidence of the completed route. Keep the
      // globe route unpublished until Sean confirms the actual stops.
      published: false,
      waypoints: [],
    },
    links: {
      overview: "/travel/norway-2026/",
      photos: "/travel/norway-2026/photos/",
      htmlDownload: "/travel/norway-2026/downloads/norway-2026-pretrip.html",
      pdfDownload: "/travel/norway-2026/downloads/norway-2026-pretrip.pdf",
    },
  },
  {
    slug: "france-2026",
    title: "The Coast by way of the Alps",
    shortTitle: "France 2026",
    number: "003",
    dateStart: "2026-03-19",
    dateEnd: "2026-03-31",
    dateLabel: "March 19–31, 2026",
    kicker: "Mediterranean and mountains",
    summary:
      "Thirteen days shaped like a detour: the Mediterranean south through Marseille and Montpellier, a ski weekend up in the Alps, then back down to Nice and a day across the border in Monaco.",
    accent: "#83e4e3",
    visitedCountries: ["FR"],
    anchor: { latitude: 43.7102, longitude: 7.262, label: "Nice, Côte d'Azur" },
    heading: { lead: "The coast,", emphasis: "by way of the Alps." },
    intro: {
      heading: "Two climates, one trip, with the mountains folded into the middle.",
      body: "The south came first and slowest — Marseille and Montpellier taking most of the early days. Then the route turned inland and uphill for a weekend on snow before dropping back to sea level, where Nice became a base for the last stretch and Monaco filled a single day.",
    },
    note: {
      title: "A route that doubles back on purpose.",
      body: "Marseille and Nice each appear twice because the Alps sit inland from both. The line on the atlas follows the order they were travelled rather than tidying the loop into a circle.",
    },
    route: {
      id: "france-2026-actual",
      label: "Actual route",
      color: "#83e4e3",
      published: true,
      waypoints: [
        { label: "Nice", latitude: 43.7102, longitude: 7.262, modeFromPrevious: "air" },
        { label: "Marseille", latitude: 43.2965, longitude: 5.3698, modeFromPrevious: "rail" },
        { label: "Montpellier", latitude: 43.6108, longitude: 3.8767, modeFromPrevious: "rail" },
        { label: "French Alps", latitude: 45.3, longitude: 6.58, modeFromPrevious: "rail" },
        { label: "Marseille", latitude: 43.2965, longitude: 5.3698, modeFromPrevious: "rail" },
        { label: "Nice", latitude: 43.7102, longitude: 7.262, modeFromPrevious: "rail" },
        { label: "Monaco", latitude: 43.7384, longitude: 7.4246, modeFromPrevious: "rail" },
      ],
    },
    links: {
      overview: "/travel/france-2026/",
      photos: "/travel/france-2026/photos/",
    },
  },
  {
    slug: "spain-2025",
    title: "Madrid to Barcelona",
    shortTitle: "Spain 2025",
    number: "002",
    dateStart: "2025-02-14",
    dateEnd: "2025-02-25",
    dateLabel: "February 14–25, 2025",
    kicker: "Closing the circle",
    summary:
      "A return eleven years later, taking the half of Spain the first trip never reached—south to Seville, then back up the Mediterranean coast through Valencia to Barcelona.",
    accent: "#9c88e8",
    visitedCountries: ["ES"],
    anchor: { latitude: 37.3891, longitude: -5.9845, label: "Seville, Andalusia" },
    heading: { lead: "Madrid", emphasis: "to Barcelona." },
    intro: {
      heading: "The same country, the other half of it.",
      body: "The 2014 trip ran across the north and finished in Madrid. This one started there and went the way the first never did: south into Andalusia, then along the coast, arriving in Barcelona from the opposite direction to the one it had been left in.",
    },
    note: {
      title: "Two journeys, one country.",
      body: "Spain carries both routes on the atlas, in different colours. Selecting a journey on the globe shows only that line, so the 2014 and 2025 crossings can be read apart.",
    },
    route: {
      id: "spain-2025-actual",
      label: "Actual route",
      color: "#9c88e8",
      published: true,
      waypoints: [
        { label: "Madrid", latitude: 40.4168, longitude: -3.7038, modeFromPrevious: "air" },
        { label: "Seville", latitude: 37.3891, longitude: -5.9845, modeFromPrevious: "rail" },
        { label: "Valencia", latitude: 39.4699, longitude: -0.3763, modeFromPrevious: "rail" },
        { label: "Barcelona", latitude: 41.3874, longitude: 2.1686, modeFromPrevious: "rail" },
      ],
    },
    links: {
      overview: "/travel/spain-2025/",
      photos: "/travel/spain-2025/photos/",
    },
  },
  {
    slug: "spain-2014",
    title: "Barcelona to Madrid",
    shortTitle: "Spain 2014",
    number: "001",
    dateStart: "2014-06-09",
    dateEnd: "2014-06-19",
    dateLabel: "June 9–19, 2014",
    kicker: "First crossing",
    summary:
      "Eleven days across the north of Spain on a school group tour—Barcelona's old quarter, the Basque coast, and the long way south over the meseta to Madrid, finishing with a day in Toledo.",
    accent: "#e8735a",
    visitedCountries: ["ES"],
    anchor: { latitude: 43.263, longitude: -2.935, label: "Bilbao, Basque Country" },
    heading: { lead: "Barcelona", emphasis: "to Madrid." },
    intro: {
      heading: "The first one, chaperoned, and the reason for all the rest.",
      body: "A school group tour that flew into Barcelona and out of Madrid, moving by motorcoach with nights in Barcelona, Bilbao, Burgos and Madrid, and a day given over to Toledo. No plan of Sean's own survives from it—there was nothing to preserve, because someone else had written it.",
    },
    note: {
      title: "Recorded from memory and one surviving document.",
      body: "The route comes from the tour's own map rather than a journal. Stops are accurate; the day-by-day is not reconstructed here, and a basic itinerary may be written later if it proves worth having.",
    },
    route: {
      id: "spain-2014-actual",
      label: "Actual route",
      color: "#e8735a",
      published: true,
      waypoints: [
        { label: "Barcelona", latitude: 41.3874, longitude: 2.1686, modeFromPrevious: "air" },
        { label: "Pamplona", latitude: 42.8125, longitude: -1.6458, modeFromPrevious: "foot" },
        { label: "Bilbao", latitude: 43.263, longitude: -2.935, modeFromPrevious: "foot" },
        { label: "San Sebastián", latitude: 43.3183, longitude: -1.9812, modeFromPrevious: "foot" },
        { label: "Burgos", latitude: 42.3439, longitude: -3.6969, modeFromPrevious: "foot" },
        { label: "Segovia", latitude: 40.9429, longitude: -4.1088, modeFromPrevious: "foot" },
        { label: "Madrid", latitude: 40.4168, longitude: -3.7038, modeFromPrevious: "foot" },
        { label: "Toledo", latitude: 39.8628, longitude: -4.0273, modeFromPrevious: "foot" },
      ],
    },
    links: {
      overview: "/travel/spain-2014/",
      photos: "/travel/spain-2014/photos/",
    },
  },
];

export function tripBySlug(slug: string): TripRecord | undefined {
  return trips.find((trip) => trip.slug === slug);
}

export function tripsForCountry(iso2: string): readonly TripRecord[] {
  return trips.filter((trip) => trip.visitedCountries.includes(iso2));
}
