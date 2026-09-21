import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

import { feature } from "topojson-client";

// us-atlas ships the states in longitude and latitude; the albers sibling of
// this file is pre-projected and the globe texture cannot use it. Resolve the
// package rather than reach for a relative path: the build moves this module
// into dist before running it, and a path relative to the source would follow.
const SOURCE = createRequire(import.meta.url).resolve("us-atlas/states-10m.json");

// The atlas texture is 2048 pixels wide — a shade under a fifth of a degree to
// the pixel — so two vertices closer together than this land on the same pixel
// and only one of them is worth carrying to the browser.
const TOLERANCE = 0.15;

const round = (value) => Math.round(value * 100) / 100;

function decimateRing(ring) {
  const kept = [];
  for (const [longitude, latitude] of ring) {
    const point = [round(longitude), round(latitude)];
    const last = kept[kept.length - 1];
    if (!last || Math.hypot(point[0] - last[0], point[1] - last[1]) >= TOLERANCE) kept.push(point);
  }
  const first = kept[0];
  const last = kept[kept.length - 1];
  if (first && (first[0] !== last[0] || first[1] !== last[1])) kept.push([...first]);
  // The District of Columbia is barely wider than the tolerance. Anything that
  // thins to less than a shape keeps its full outline instead.
  return kept.length >= 4 ? kept : ring.map(([longitude, latitude]) => [round(longitude), round(latitude)]);
}

let cache;

function states() {
  if (!cache) {
    const topology = JSON.parse(readFileSync(SOURCE));
    const atlas = feature(topology, topology.objects.states);
    cache = new Map(atlas.features.map((state) => [state.properties.name, state]));
  }
  return cache;
}

/**
 * Outlines for the named states, thinned to what the texture can draw. Unknown
 * names come back as errors rather than as silently missing shading, so a
 * misspelled state stops the build instead of quietly unvisiting itself.
 */
export function stateShapes(names) {
  const atlas = states();
  const shapes = [];
  const errors = [];

  for (const name of names) {
    const state = atlas.get(name);
    if (!state) {
      errors.push(`Unknown state: ${name}`);
      continue;
    }
    const polygons = state.geometry.type === "Polygon"
      ? [state.geometry.coordinates]
      : state.geometry.coordinates;
    shapes.push({ name, polygons: polygons.map((polygon) => polygon.map(decimateRing)) });
  }

  return { shapes, errors };
}
