import test from "node:test";
import assert from "node:assert/strict";
import { rampArt } from "../src/lib/ramp.mjs";

const pointsFrom = (element) =>
  element.match(/points="([^"]+)"/)[1]
    .split(" ")
    .map((point) => point.split(",").map(Number));
const planPoint = ([screenX, screenY], height) => {
  const vertical = screenY - 525 + height * 48;
  const x = (screenX - 145 - 2 * vertical) / 59;
  return [x, vertical / 15 + x];
};
const closeTo = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 0.001, `${actual} ≠ ${expected}`);

test("the project drawing includes the metal deck, square landing, rails, and wheels", () => {
  const drawing = rampArt();
  for (const part of [
    "metal-deck",
    "square-platform",
    "wheeled-base",
    "near-handrail",
    "far-handrail",
    "platform-handrails",
    "entry-apron",
  ]) {
    assert.ok(drawing.includes(`data-ramp-part="${part}"`), part);
  }
  assert.ok((drawing.match(/data-ramp-wheel/g) ?? []).length >= 4);
  assert.match(drawing, /Not to scale/);
  assert.match(drawing, /<title id="ramp-title">/);
  assert.match(drawing, /<desc id="ramp-description">/);
  assert.doesNotMatch(drawing, /NaN|Infinity|undefined/);
  assert.equal(drawing, rampArt());
  for (const [, points] of drawing.matchAll(/points="([^"]+)"/g)) {
    for (const point of points.split(" ")) {
      const [x, y] = point.split(",").map(Number);
      assert.ok(
        x >= 0 && x <= 800 && y >= 0 && y <= 650,
        `Clipped point ${point}`,
      );
    }
  }
});

test("the square landing extends left with a continuous right-hand deck edge", () => {
  const drawing = rampArt();
  const deck = pointsFrom(
    drawing.match(/data-ramp-part="metal-deck"><polygon[^>]+>/)[0],
  );
  const platform = pointsFrom(
    drawing.match(/data-ramp-part="square-platform"><polygon[^>]+>/)[0],
  );
  assert.deepEqual(deck[2], platform[3], "The uphill right corner is shared");
  const landing = platform.map((point) => planPoint(point, 1.7));
  const rightEdge = [planPoint(deck[3], 0.1), landing[3], landing[2]];
  for (const [, y] of rightEdge) closeTo(y, 1.4);
  closeTo(landing[1][0] - landing[0][0], 4.2);
  closeTo(landing[3][1] - landing[0][1], 4.2);
  assert.ok(landing[0][1] < planPoint(deck[1], 1.7)[1]);
});

test("the landing has only end and right railings, leaving entrance and left open", () => {
  const drawing = rampArt();
  const rails = [
    ...drawing.matchAll(/<polyline[^>]+data-platform-railing="([^"]+)"[^>]*>/g),
  ];
  assert.deepEqual(rails.map(([, side]) => side), ["end", "right"]);
  const end = pointsFrom(rails[0][0]).map((point) => planPoint(point, 2.95));
  const right = pointsFrom(rails[1][0]).map((point) => planPoint(point, 2.95));
  for (const [x] of end) closeTo(x, 18.2);
  closeTo(end[0][1], -2.8);
  closeTo(end[1][1], 1.4);
  for (const [, y] of right) closeTo(y, 1.4);
  closeTo(right[0][0], 18.2);
  closeTo(right[1][0], 14);
});
