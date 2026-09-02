import assert from "node:assert/strict";
import test from "node:test";

import { readFileSync } from "node:fs";
import { feature } from "topojson-client";

import {
  fitVerticalFov,
  greatCirclePoints,
  groupTripsByCountry,
  latLonToCartesian,
  projectRing,
  ringWrapOffsets,
  validateTravelData,
} from "../src/scripts/globe-utils.mjs";
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
  // so assert the gate itself: nothing is published unless it is on the list.
  assert.equal(isPhotoTripPublished("spain-2014"), false, "an unfinished edit stays closed");
  assert.equal(isPhotoTripPublished("unknown-trip"), false);
  for (const slug of publishedPhotoTripSlugs) {
    assert.equal(isPhotoTripPublished(slug), true, `${slug} is released`);
  }
});
