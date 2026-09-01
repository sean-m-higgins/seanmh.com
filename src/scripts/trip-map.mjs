// Build-time geometry for the journal page map. The outlines come from the same
// world-atlas topology the globe uses, so a new trip draws itself from its
// waypoints instead of needing a hand-authored country silhouette.

/**
 * Frame the map on where the trip actually went, not on the whole country —
 * Spain's outline carries the Canaries and Norway's carries Svalbard, either of
 * which would push the route into a corner. Distant land is simply clipped.
 */
export function frameBounds(points, { minSpan = 2.5, pad = 0.28 } = {}) {
  if (points.length === 0) throw new Error("A trip map needs at least one point");
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;
  for (const { latitude, longitude } of points) {
    if (latitude < minLat) minLat = latitude;
    if (latitude > maxLat) maxLat = latitude;
    if (longitude < minLon) minLon = longitude;
    if (longitude > maxLon) maxLon = longitude;
  }
  // A single anchor, or a tight cluster, still needs an area to be drawn in.
  const growLat = Math.max(0, minSpan - (maxLat - minLat)) / 2;
  const growLon = Math.max(0, minSpan - (maxLon - minLon)) / 2;
  minLat -= growLat; maxLat += growLat;
  minLon -= growLon; maxLon += growLon;

  const padLat = (maxLat - minLat) * pad;
  const padLon = (maxLon - minLon) * pad;
  return {
    minLat: minLat - padLat,
    maxLat: maxLat + padLat,
    minLon: minLon - padLon,
    maxLon: maxLon + padLon,
  };
}

/**
 * Equirectangular, with longitudes narrowed by cos(latitude) so the countries
 * keep their shape instead of stretching sideways this far north.
 */
export function makeProjector(bounds, width, height) {
  const midLat = (bounds.minLat + bounds.maxLat) / 2;
  const squeeze = Math.cos(midLat * (Math.PI / 180));
  const spanLon = (bounds.maxLon - bounds.minLon) * squeeze;
  const spanLat = bounds.maxLat - bounds.minLat;
  const scale = Math.min(width / spanLon, height / spanLat);
  const offsetX = (width - spanLon * scale) / 2;
  const offsetY = (height - spanLat * scale) / 2;
  return (longitude, latitude) => [
    offsetX + (longitude - bounds.minLon) * squeeze * scale,
    offsetY + (bounds.maxLat - latitude) * scale,
  ];
}

export function ringToPath(ring, project, precision = 1) {
  let path = "";
  ring.forEach(([longitude, latitude], index) => {
    const [x, y] = project(longitude, latitude);
    path += `${index === 0 ? "M" : "L"}${x.toFixed(precision)} ${y.toFixed(precision)}`;
  });
  return path ? `${path}Z` : "";
}

export function geometryToPath(geometry, project, precision = 1) {
  const polygons = geometry.type === "Polygon"
    ? [geometry.coordinates]
    : geometry.coordinates;
  let path = "";
  for (const polygon of polygons) {
    for (const ring of polygon) path += ringToPath(ring, project, precision);
  }
  return path;
}

/** Cheap reject so only land near the route is drawn into the page. */
export function geometryIntersects(geometry, bounds) {
  const polygons = geometry.type === "Polygon"
    ? [geometry.coordinates]
    : geometry.coordinates;
  for (const polygon of polygons) {
    for (const ring of polygon) {
      for (const [longitude, latitude] of ring) {
        if (
          longitude >= bounds.minLon && longitude <= bounds.maxLon
          && latitude >= bounds.minLat && latitude <= bounds.maxLat
        ) return true;
      }
    }
  }
  return false;
}

/**
 * Collapse a route that revisits a place into one label per location, keeping
 * the order of first arrival. France returns to Marseille and Nice, and the map
 * should mark each once rather than stacking two pins on the same pixel.
 */
/**
 * Push labels apart where stops sit close together. Bilbao and San Sebastián
 * are an hour apart, Nice and Monaco fifteen minutes, and at this scale their
 * names land on top of one another. Pins stay where they belong; only the text
 * slides, with the caller drawing a leader line when it moves far enough.
 */
export function placeLabels(pins, { gap = 19 } = {}) {
  const lastOnSide = new Map();
  const placed = new Map();
  for (const pin of [...pins].sort((a, b) => a.y - b.y)) {
    const side = pin.flip ? "left" : "right";
    const previous = lastOnSide.get(side);
    const labelY = previous !== undefined && pin.y - previous < gap
      ? previous + gap
      : pin.y;
    lastOnSide.set(side, labelY);
    placed.set(pin, labelY);
  }
  // Return in the original order so the markup stays stable between builds.
  return pins.map((pin) => ({ ...pin, labelY: placed.get(pin) ?? pin.y }));
}

export function uniqueStops(waypoints) {
  const seen = new Map();
  for (const point of waypoints) {
    const key = `${point.latitude},${point.longitude}`;
    if (!seen.has(key)) seen.set(key, point);
  }
  return [...seen.values()];
}
