import assert from "node:assert/strict";
import test from "node:test";

import { readFileSync } from "node:fs";
import { feature } from "topojson-client";

import {
  fitVerticalFov,
  formatPlaceDate,
  greatCirclePoints,
  groupTripsByCountry,
  isHomelandPolygon,
  latLonToCartesian,
  projectRing,
  ringWrapOffsets,
  validateTravelData,
} from "../src/scripts/globe-utils.mjs";
import { stateShapes } from "../src/content/us-states.mjs";
import { frameBounds, makeProjector, placeLabels, uniqueStops } from "../src/scripts/trip-map.mjs";
import {
  isPhotoTripPublished,
  publicRouteWaypoints,
  publishedPhotoTripSlugs,
  tripsForPublication,
} from "../src/content/publication.mjs";

test("latitude and longitude map to stable globe coordinates", () => {
  assert.deepEqual(latLonToCartesian(0, 0).map((value) => Math.round(value)), [0, 0, 1]);
  assert.deepEqual(latLonToCartesian(90, 0).map((value) => Math.round(value)), [0, 1, 0]);
});

test("great-circle interpolation takes the short path across the antimeridian", () => {
  const points = greatCirclePoints(
    { latitude: 60, longitude: 170 },
    { latitude: 60, longitude: -170 },
    12,
  );
  assert.equal(points.length, 13);
  assert.ok(points.every((point) => point.every(Number.isFinite)));
  assert.ok(Math.hypot(...points[6]) > 1);
});

test("the camera keeps the whole globe framed on portrait canvases", () => {
  const distance = 3.397;
  const fitRadius = 1.12;
  const baseFov = 37;
  const halfWidth = (fov, aspect) =>
    Math.tan((fov * Math.PI) / 360) * distance * aspect;

  // Every stage shape the layout can produce, from a wide desktop column down
  // to the narrowest supported phone, must still frame the globe horizontally.
  for (const aspect of [1.11, 0.985, 0.919, 0.905, 0.822, 0.647]) {
    const fov = fitVerticalFov(aspect, distance, fitRadius, baseFov);
    assert.ok(
      halfWidth(fov, aspect) >= fitRadius - 1e-9,
      `aspect ${aspect} still crops the globe at ${fov} degrees`,
    );
  }

  // Landscape canvases already fit, so the default framing must not change.
  assert.equal(fitVerticalFov(1.11, distance, fitRadius, baseFov), baseFov);
  assert.ok(fitVerticalFov(0.822, distance, fitRadius, baseFov) > baseFov);
});

test("no country outline is split across the atlas texture seam", () => {
  const width = 2048;
  const height = 1024;
  const topology = JSON.parse(
    readFileSync(new URL("../node_modules/world-atlas/countries-110m.json", import.meta.url)),
  );
  const atlas = feature(topology, topology.objects.countries);

  let seamCrossers = 0;
  for (const country of atlas.features) {
    const polygons = country.geometry.type === "Polygon"
      ? [country.geometry.coordinates]
      : country.geometry.coordinates;
    for (const polygon of polygons) {
      for (const ring of polygon) {
        const points = projectRing(ring, width, height);
        // A jump wider than half the atlas is the discontinuity that used to
        // break a ring mid-outline, letting the fill close it across the map.
        for (let index = 1; index < points.length; index += 1) {
          const jump = Math.abs(points[index][0] - points[index - 1][0]);
          assert.ok(
            jump < width / 2,
            `${country.properties?.name ?? country.id} jumps ${jump.toFixed(1)}px mid-ring`,
          );
        }
        const offsets = ringWrapOffsets(points, width);
        assert.ok(offsets.length >= 1 && offsets.length <= 2);
        if (offsets.length === 2) seamCrossers += 1;
      }
    }
  }
  // The seam sits at 90 degrees west, so North America genuinely straddles it
  // and must be drawn twice. If this reaches zero the wrapping stopped working.
  assert.ok(seamCrossers > 0, "expected seam-crossing rings to be drawn on both edges");
});

test("a visit shades the landmass it covered, not distant territories", () => {
  const topology = JSON.parse(
    readFileSync(new URL("../node_modules/world-atlas/countries-110m.json", import.meta.url)),
  );
  const atlas = feature(topology, topology.objects.countries);
  // Atlas ids and centroids as the country records carry them.
  const shaded = (atlasId, centroid) => {
    const country = atlas.features.find((f) => String(f.id).padStart(3, "0") === atlasId);
    const polygons = country.geometry.type === "Polygon"
      ? [country.geometry.coordinates]
      : country.geometry.coordinates;
    return polygons
      .filter((polygon) => isHomelandPolygon(polygon, centroid))
      .map((polygon) => polygon[0]);
  };
  const holds = (rings, longitude, latitude) => rings.some((ring) => {
    const lons = ring.map(([lon]) => lon);
    const lats = ring.map(([, lat]) => lat);
    return longitude >= Math.min(...lons) && longitude <= Math.max(...lons)
      && latitude >= Math.min(...lats) && latitude <= Math.max(...lats);
  });

  // The atlas files French Guiana under France and Svalbard under Norway, and
  // shading them claimed journeys that never happened.
  const france = shaded("250", { latitude: 46.6, longitude: 2.4 });
  assert.ok(holds(france, 2.4, 46.6), "mainland France stays shaded");
  assert.ok(holds(france, 9.1, 42.2), "Corsica belongs to the mainland visit");
  assert.ok(!holds(france, -53, 4), "French Guiana is not shaded");

  const norway = shaded("578", { latitude: 65.1, longitude: 13.3 });
  assert.ok(holds(norway, 13.3, 65.1), "mainland Norway stays shaded");
  assert.ok(!holds(norway, 16, 78.5), "Svalbard is not shaded");

  assert.equal(shaded("724", { latitude: 40.2, longitude: -3.6 }).length, 1, "Spain is unaffected");
});

test("a ring straddling the seam is drawn whole on both edges", () => {
  const width = 2048;
  // A box across 90 degrees west, the shape that produced the wedges.
  const points = projectRing([[-100, 40], [-80, 40], [-80, 30], [-100, 30], [-100, 40]], width, 1024);
  const offsets = ringWrapOffsets(points, width);
  assert.equal(offsets.length, 2);

  const xs = points.map(([x]) => x);
  const span = Math.max(...xs) - Math.min(...xs);
  const lefts = offsets.map((offset) => Math.min(...xs) + offset).sort((a, b) => a - b);
  // One copy runs off the right edge; its partner picks up the remainder on
  // the left, and the two sit exactly one atlas width apart.
  assert.equal(lefts[1] - lefts[0], width);
  assert.ok(lefts[1] < width && lefts[1] + span > width, "right copy overflows the edge");
  assert.ok(lefts[0] + span > 0, "left copy carries the overflow back on");
});

test("map labels for neighbouring stops are pushed apart, pins are not", () => {
  // Nice and Monaco land within a few pixels of each other at trip-map scale.
  const pins = [
    { label: "Marseille", x: 100, y: 400, flip: false },
    { label: "Nice", x: 500, y: 300, flip: false },
    { label: "Monaco", x: 505, y: 304, flip: false },
    { label: "Montpellier", x: 60, y: 300, flip: true },
  ];
  const placed = placeLabels(pins, { gap: 19 });

  assert.deepEqual(placed.map((p) => p.label), pins.map((p) => p.label), "order is stable");
  assert.deepEqual(placed.map((p) => p.y), pins.map((p) => p.y), "pins do not move");

  const nice = placed.find((p) => p.label === "Nice");
  const monaco = placed.find((p) => p.label === "Monaco");
  assert.ok(Math.abs(monaco.labelY - nice.labelY) >= 19, "crowded labels separate");

  // A stop on the other side of the map must not be pushed by them.
  const montpellier = placed.find((p) => p.label === "Montpellier");
  assert.equal(montpellier.labelY, montpellier.y);
});

test("a trip map frames the route, and a repeated stop is drawn once", () => {
  // France returns to Marseille and Nice; the map should pin each place once.
  const waypoints = [
    { label: "Nice", latitude: 43.7102, longitude: 7.262 },
    { label: "Marseille", latitude: 43.2965, longitude: 5.3698 },
    { label: "French Alps", latitude: 45.3, longitude: 6.58 },
    { label: "Marseille", latitude: 43.2965, longitude: 5.3698 },
    { label: "Nice", latitude: 43.7102, longitude: 7.262 },
  ];
  const stops = uniqueStops(waypoints);
  assert.deepEqual(stops.map((s) => s.label), ["Nice", "Marseille", "French Alps"]);

  const bounds = frameBounds(stops);
  for (const stop of stops) {
    assert.ok(stop.latitude > bounds.minLat && stop.latitude < bounds.maxLat);
    assert.ok(stop.longitude > bounds.minLon && stop.longitude < bounds.maxLon);
  }

  // Every stop must land inside the drawing, or a pin would sit off-canvas.
  const project = makeProjector(bounds, 620, 760);
  for (const stop of stops) {
    const [x, y] = project(stop.longitude, stop.latitude);
    assert.ok(x >= 0 && x <= 620, `${stop.label} x=${x}`);
    assert.ok(y >= 0 && y <= 760, `${stop.label} y=${y}`);
  }
});

test("countries aggregate multiple trips without treating route stops as visits", () => {
  const grouped = groupTripsByCountry([
    { slug: "one", visitedCountries: ["NO"] },
    { slug: "two", visitedCountries: ["NO", "SE"] },
  ]);
  assert.deepEqual(grouped.get("NO").map((trip) => trip.slug), ["one", "two"]);
  assert.deepEqual(grouped.get("SE").map((trip) => trip.slug), ["two"]);
  assert.equal(grouped.has("IE"), false);
});

test("travel data validation rejects duplicate, unknown, and incomplete records", () => {
  const countries = [{ iso2: "NO" }];
  const trip = {
    slug: "norway",
    visitedCountries: ["IE"],
    anchor: { latitude: 91, longitude: 0 },
    route: { id: "route", color: "#fff", published: true, waypoints: [] },
  };
  const errors = validateTravelData(countries, [trip, { ...trip }]);
  assert.ok(errors.some((error) => error.includes("Duplicate trip slug")));
  assert.ok(errors.some((error) => error.includes("Unknown country")));
  assert.ok(errors.some((error) => error.includes("Invalid latitude")));
  assert.ok(errors.some((error) => error.includes("at least two")));
  assert.ok(errors.some((error) => error.includes("Route color")));
});

test("place validation rejects duplicates, bad coordinates, and invented dates", () => {
  const place = {
    id: "seattle",
    label: "Seattle",
    state: "Washington",
    latitude: 47.6062,
    longitude: -122.3321,
  };
  const errors = validateTravelData([], [], [
    place,
    { ...place },
    { ...place, id: "nowhere", state: "", latitude: 95 },
    { ...place, id: "someday", date: "summer 2019" },
    { ...place, id: "wordy", note: "x".repeat(161) },
  ]);
  assert.ok(errors.some((error) => error.includes("Duplicate place id: seattle")));
  assert.ok(errors.some((error) => error.includes("needs a state")));
  assert.ok(errors.some((error) => error.includes("Invalid latitude in nowhere")));
  assert.ok(errors.some((error) => error.includes("Invalid date in someday")));
  assert.ok(errors.some((error) => error.includes("Note in wordy")));
});

test("a place keeps whatever date precision it was remembered with", () => {
  assert.equal(formatPlaceDate("2011"), "2011");
  assert.equal(formatPlaceDate("2017-07"), "July 2017");
  assert.equal(formatPlaceDate("2026-08-19"), "August 19, 2026");
  // A place with no date is a place all the same, so it renders as nothing
  // rather than as a guess.
  assert.equal(formatPlaceDate(undefined), "");
});

test("a place with no date passes validation, since some are only places", () => {
  const errors = validateTravelData([], [], [
    { id: "st-louis", label: "St. Louis", state: "Missouri", latitude: 38.627, longitude: -90.1994 },
  ]);
  assert.deepEqual(errors, []);
});

test("a misspelled state stops the build rather than quietly unvisiting itself", () => {
  const { shapes, errors } = stateShapes(["Missouri", "Missourri"]);
  assert.deepEqual(shapes.map((state) => state.name), ["Missouri"]);
  assert.deepEqual(errors, ["Unknown state: Missourri"]);
});

test("state outlines are thinned without losing the shape of the state", () => {
  const topology = JSON.parse(
    readFileSync(new URL("../node_modules/us-atlas/states-10m.json", import.meta.url)),
  );
  const atlas = feature(topology, topology.objects.states);
  const raw = atlas.features.find((state) => state.properties.name === "Missouri");
  const rawRing = raw.geometry.coordinates[0];
  const [thinned] = stateShapes(["Missouri"]).shapes;
  const thinnedRing = thinned.polygons[0][0];

  assert.ok(thinnedRing.length < rawRing.length / 2, "the outline should lose most of its vertices");

  const bounds = (ring) => ring.reduce((box, [longitude, latitude]) => [
    Math.min(box[0], longitude), Math.min(box[1], latitude),
    Math.max(box[2], longitude), Math.max(box[3], latitude),
  ], [Infinity, Infinity, -Infinity, -Infinity]);
  bounds(rawRing).forEach((edge, index) => {
    // Dropping a vertex can pull an edge in by as much as the tolerance it was
    // dropped under — a fifth of a degree, which the 2048-pixel texture draws
    // as less than a single pixel. Anything beyond that is a lost shape.
    assert.ok(Math.abs(edge - bounds(thinnedRing)[index]) <= 0.15, `edge ${index} moved`);
  });

  assert.deepEqual(thinnedRing.at(0), thinnedRing.at(-1), "a fill needs a closed ring");
});

test("a state too small to thin keeps its whole outline", () => {
  const [capital] = stateShapes(["District of Columbia"]).shapes;
  const ring = capital.polygons[0][0];
  assert.ok(ring.length >= 4);
  assert.deepEqual(ring.at(0), ring.at(-1));
});

test("unpublished route coordinates are removed from every public payload", () => {
  const waypoints = [
    { label: "Private draft", latitude: 67.1, longitude: 13.2 },
    { label: "Private draft two", latitude: 67.2, longitude: 13.3 },
  ];
  const draft = {
    slug: "draft",
    route: { published: false, waypoints },
  };
  const published = {
    slug: "published",
    route: { published: true, waypoints },
  };

  assert.deepEqual(publicRouteWaypoints(draft), []);
  assert.equal(publicRouteWaypoints(published), waypoints);

  const [publicDraft, publicPublished] = tripsForPublication([draft, published]);
  assert.deepEqual(publicDraft.route.waypoints, []);
  assert.equal(publicPublished, published, "published records stay untouched");
  assert.equal(draft.route.waypoints, waypoints, "redaction does not mutate authoring data");
});

test("photo galleries remain unpublished until explicitly released", () => {
  // Naming a trip here would only track whichever edit happens to be finished,
  // so assert the gate itself: a slug on the list opens, anything else stays
  // shut. Every trip is released at present, which is exactly why the negative
  // case is worth keeping — it is the only thing still guarding a new slug.
  assert.equal(isPhotoTripPublished("unknown-trip"), false);
  assert.equal(isPhotoTripPublished(""), false);
  for (const slug of publishedPhotoTripSlugs) {
    assert.equal(isPhotoTripPublished(slug), true, `${slug} is released`);
  }
});
