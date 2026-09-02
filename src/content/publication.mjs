/**
 * Publication controls that must be readable from both Astro content and the
 * JavaScript Astro config. Keep photos staged in the manifest until the edit is
 * complete, then add the trip slug here to make the gallery indexable and link
 * to it throughout the site.
 */
export const publishedPhotoTripSlugs = Object.freeze([
  "norway-2026",
  "france-2026",
  "spain-2025",
]);

const publishedPhotoTrips = new Set(publishedPhotoTripSlugs);

export function isPhotoTripPublished(slug) {
  return publishedPhotoTrips.has(slug);
}

/** Unconfirmed waypoints are authoring data and must never reach public HTML. */
export function publicRouteWaypoints(trip) {
  return trip.route.published ? trip.route.waypoints : [];
}

/**
 * The globe needs most of each trip record in the browser. Redact draft route
 * coordinates before serializing that data rather than relying on rendering
 * code to keep an otherwise-public payload hidden.
 */
export function tripsForPublication(trips) {
  return trips.map((trip) => trip.route.published
    ? trip
    : { ...trip, route: { ...trip.route, waypoints: [] } });
}
