import test from "node:test";
import assert from "node:assert/strict";
import {
  chainPoints,
  normalizeSeed,
  DEFAULT_SEED,
  mosaicTiles,
  seedURL,
  motifs,
  glazes,
  forms,
  DEFAULT_MOSAIC,
  normalizeMosaic,
  mosaicOptionsFromURL,
} from "../src/lib/geometry.mjs";
import { studyRenderers } from "../src/lib/studies.mjs";

test("a catenary fixes its endpoints, is symmetric, and achieves the chosen sag", () => {
  for (const sag of [60, 110, 165]) {
    const p = chainPoints(sag, 400);
    assert.ok(Math.abs(p[0][1]) < 1e-8);
    assert.ok(Math.abs(p.at(-1)[1]) < 1e-8);
    assert.ok(Math.abs(p[50][1] - sag) < 1e-8);
    for (let i = 0; i < p.length; i++)
      assert.ok(Math.abs(p[i][1] - p[100 - i][1]) < 1e-8);
  }
});

test("all 108 mosaic combinations are deterministic and distinct", () => {
  const results = new Set();
  for (const motif of motifs)
    for (const glaze of glazes)
      for (const form of forms) {
        const options = { motif: motif.id, glaze: glaze.id, form: form.id };
        const tiles = mosaicTiles(42, 600, 600, 30, options);
        assert.deepEqual(tiles, mosaicTiles(42, 600, 600, 30, options));
        assert.ok(tiles.every((tile) => glaze.colors.includes(tile.color)));
        assert.ok(
          tiles.every((tile) =>
            tile.points.every((point) => point.every(Number.isFinite)),
          ),
        );
        results.add(JSON.stringify({ tiles, mask: form.path }));
      }
  assert.equal(results.size, 108);
});

test("mosaic choices round-trip, preserve legacy links, and reject unknown input", () => {
  assert.deepEqual(
    normalizeMosaic({ motif: "<script>", glaze: "bad", form: "unknown" }),
    DEFAULT_MOSAIC,
  );
  assert.deepEqual(normalizeMosaic(null), DEFAULT_MOSAIC);
  assert.deepEqual(mosaicOptionsFromURL("https://seanmh.com/"), DEFAULT_MOSAIC);
  assert.equal(mosaicOptionsFromURL("https://seanmh.com/?seed=42"), undefined);
  const options = { motif: "spiral", glaze: "rose", form: "arch" };
  const address = seedURL(
    "https://seanmh.com/?v=a-scroll&utm_source=friend",
    0,
    options,
  );
  assert.deepEqual(mosaicOptionsFromURL(address), options);
  assert.equal(address.searchParams.get("utm_source"), "friend");
  assert.equal(address.searchParams.get("seed"), "0");
  assert.equal(address.searchParams.get("v"), "h-gaudi");
  assert.equal(address.hash, "#light");
  assert.equal(seedURL(address, 42).searchParams.has("motif"), false);
});

test("each architectural study responds at both control limits without invalid geometry", () => {
  for (const [id, min, max] of [
    ["chain", 60, 165],
    ["branch", 16, 42],
    ["ruled", 20, 155],
    ["light", 0, 100],
    ["fragments", 22, 65],
  ]) {
    const first = studyRenderers[id](min),
      last = studyRenderers[id](max);
    assert.notEqual(first, last, id);
    assert.doesNotMatch(first + last, /NaN|Infinity|undefined/);
    assert.equal(first, studyRenderers[id](min));
  }
});
test("mosaic seeds are bounded, deterministic, and visibly distinct", () => {
  for (const v of [
    null,
    undefined,
    "abc",
    "-1",
    "4294967296",
    "1.5",
    "<script>",
  ])
    assert.equal(normalizeSeed(v), DEFAULT_SEED);
  assert.equal(normalizeSeed("0"), 0);
  assert.equal(normalizeSeed("4294967295"), 4294967295);
  assert.deepEqual(mosaicTiles(42), mosaicTiles(42));
  assert.notDeepEqual(mosaicTiles(42), mosaicTiles(43));
  assert.ok(
    mosaicTiles(42).every((t) =>
      t.points.every((p) => p.every(Number.isFinite)),
    ),
  );
});
test("artifact permalinks retain the selected version and unrelated queries", () => {
  const url = seedURL(
    "https://seanmh.com/?v=h-gaudi&utm_source=friend#works",
    42,
  );
  assert.equal(url.searchParams.get("v"), "h-gaudi");
  assert.equal(url.searchParams.get("utm_source"), "friend");
  assert.equal(url.searchParams.get("seed"), "42");
  assert.equal(url.hash, "#light");
  assert.equal(
    seedURL("https://seanmh.com/", 0).searchParams.get("v"),
    "h-gaudi",
  );
});
