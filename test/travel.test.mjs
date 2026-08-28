import assert from "node:assert/strict";
import test from "node:test";

import {
  fitVerticalFov,
  greatCirclePoints,
  groupTripsByCountry,
  latLonToCartesian,
  validateTravelData,
} from "../src/scripts/globe-utils.mjs";

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
