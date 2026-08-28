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
  dateStart: string;
  dateEnd: string;
  dateLabel: string;
  summary: string;
  kicker: string;
  accent: string;
  visitedCountries: string[];
  anchor: { latitude: number; longitude: number; label: string };
  route: TripRoute;
  links: {
    overview: string;
    photos: string;
    htmlDownload: string;
    pdfDownload: string;
  };
}

export interface CountryRecord {
  iso2: string;
  atlasId: string;
  name: string;
  centroid: { latitude: number; longitude: number };
}

export const countries: readonly CountryRecord[] = [
  {
    iso2: "NO",
    atlasId: "578",
    name: "Norway",
    centroid: { latitude: 65.1, longitude: 13.3 },
  },
];

export const trips: readonly TripRecord[] = [
  {
    slug: "norway-2026",
    title: "Oslo to Lofoten",
    shortTitle: "Norway 2026",
    dateStart: "2026-08-19",
    dateEnd: "2026-08-25",
    dateLabel: "August 19–25, 2026",
    kicker: "Solo motorcycle journey",
    summary:
      "A late-summer line from Oslo to the Lofoten archipelago—north by air, across the Vestfjorden by ferry, then onto the E10 by motorcycle.",
    accent: "#ffb45b",
    visitedCountries: ["NO"],
    anchor: { latitude: 67.949, longitude: 13.133, label: "Hamnøy, Lofoten" },
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
];

export const norwayTrip = trips[0];

export function tripsForCountry(iso2: string): readonly TripRecord[] {
  return trips.filter((trip) => trip.visitedCountries.includes(iso2));
}
