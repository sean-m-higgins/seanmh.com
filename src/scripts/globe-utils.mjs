const DEG = Math.PI / 180;

export function latLonToCartesian(latitude, longitude, radius = 1) {
  const lat = latitude * DEG;
  const lon = longitude * DEG;
  const cosLat = Math.cos(lat);
  return [
    radius * cosLat * Math.sin(lon),
    radius * Math.sin(lat),
    radius * cosLat * Math.cos(lon),
  ];
}

function normalize(vector) {
  const length = Math.hypot(...vector) || 1;
  return vector.map((value) => value / length);
}

export function greatCirclePoints(start, end, segments = 48, radius = 1) {
  const a = normalize(latLonToCartesian(start.latitude, start.longitude));
  const b = normalize(latLonToCartesian(end.latitude, end.longitude));
  const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const omega = Math.acos(dot);
  const sinOmega = Math.sin(omega);
  const points = [];

  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    let vector;
    if (sinOmega < 1e-6) {
      vector = normalize(a.map((value, axis) => value + (b[axis] - value) * t));
    } else {
      const first = Math.sin((1 - t) * omega) / sinOmega;
      const second = Math.sin(t * omega) / sinOmega;
      vector = a.map((value, axis) => value * first + b[axis] * second);
    }
    const altitude = Math.sin(Math.PI * t) * Math.min(0.22, omega * 0.08);
    points.push(vector.map((value) => value * (radius + altitude)));
  }

  return points;
}

export function projectRing(ring, width, height) {
  // Unwrap longitudes so a ring that crosses the texture seam stays one
  // continuous outline. Cutting it into separate subpaths lets the canvas fill
  // close each fragment straight across the map instead of around the country.
  const points = [];
  let previous;
  for (const [longitude, latitude] of ring) {
    let lon = longitude;
    if (previous !== undefined) {
      while (lon - previous > 180) lon -= 360;
      while (previous - lon > 180) lon += 360;
    }
    previous = lon;
    // Three's SphereGeometry puts longitude 0 on the visible +Z meridian at
    // texture u=.25, so the equirectangular atlas needs a quarter-turn offset.
    points.push([((lon + 90) / 360) * width, ((90 - latitude) / 180) * height]);
  }
  return points;
}

export function ringWrapOffsets(points, width) {
  if (points.length === 0) return [];
  let min = Infinity;
  let max = -Infinity;
  for (const [x] of points) {
    if (x < min) min = x;
    if (x > max) max = x;
  }
  // Slide the unwrapped ring onto the first repeat that reaches the canvas,
  // then add the neighbouring repeat when it runs off the right edge, so a
  // seam-crossing country is drawn whole on both sides. Antarctica spans
  // exactly one width, so its two copies abut rather than overlap.
  const base = -Math.floor(min / width) * width;
  const offsets = [base];
  if (min + base + (max - min) > width) offsets.push(base - width);
  return offsets;
}

export function fitVerticalFov(aspect, distance, fitRadius, baseFov) {
  // A perspective camera frames only its vertical field of view, so a canvas
  // taller than it is wide crops the globe's left and right limbs. Widen the
  // vertical FOV until the horizontal extent clears fitRadius.
  const needed = 2 * Math.atan(fitRadius / (distance * aspect)) * (180 / Math.PI);
  return Math.max(baseFov, needed);
}

export function groupTripsByCountry(trips) {
  const grouped = new Map();
  for (const trip of trips) {
    for (const country of trip.visitedCountries) {
      const existing = grouped.get(country) ?? [];
      existing.push(trip);
      grouped.set(country, existing);
    }
  }
  return grouped;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Renders whatever precision a place date carries: a bare year stays a year,
 * and a fuller date is set the way the journeys set theirs.
 */
export function formatPlaceDate(date) {
  if (!date) return "";
  const [year, month, day] = date.split("-");
  const name = month ? MONTHS[Number(month) - 1] : undefined;
  if (!name) return year;
  return day ? `${name} ${Number(day)}, ${year}` : `${name} ${year}`;
}

// A place note is a caption, not a journal entry: the journeys carry the prose.
const NOTE_LIMIT = 160;

/** @param {readonly any[]} [places] */
export function validateTravelData(countries, trips, places = []) {
  const errors = [];
  const countryCodes = new Set(countries.map((country) => country.iso2));
  const slugs = new Set();
  const routeColors = new Map();

  for (const trip of trips) {
    if (slugs.has(trip.slug)) errors.push(`Duplicate trip slug: ${trip.slug}`);
    slugs.add(trip.slug);
    for (const country of trip.visitedCountries) {
      if (!countryCodes.has(country)) errors.push(`Unknown country ${country} in ${trip.slug}`);
      const color = typeof trip.route.color === "string" ? trip.route.color.toLowerCase() : "";
      if (!/^#[0-9a-f]{6}$/.test(color)) errors.push(`Invalid route color in ${trip.slug}: ${trip.route.color}`);
      const key = `${country}:${color}`;
      if (routeColors.has(key)) {
        errors.push(`Route color ${trip.route.color} is reused by ${trip.slug} and ${routeColors.get(key)} in ${country}`);
      }
      routeColors.set(key, trip.slug);
    }
    const points = [trip.anchor, ...trip.route.waypoints];
    for (const point of points) {
      if (!Number.isFinite(point.latitude) || point.latitude < -90 || point.latitude > 90) {
        errors.push(`Invalid latitude in ${trip.slug}: ${point.latitude}`);
      }
      if (!Number.isFinite(point.longitude) || point.longitude < -180 || point.longitude > 180) {
        errors.push(`Invalid longitude in ${trip.slug}: ${point.longitude}`);
      }
    }
    if (trip.route.published && trip.route.waypoints.length < 2) {
      errors.push(`Published route ${trip.route.id} needs at least two waypoints`);
    }
  }

  const placeIds = new Set();
  for (const place of places) {
    if (placeIds.has(place.id)) errors.push(`Duplicate place id: ${place.id}`);
    placeIds.add(place.id);
    if (!place.label) errors.push(`Place ${place.id} needs a label`);
    if (!place.state) errors.push(`Place ${place.id} needs a state`);
    if (!Number.isFinite(place.latitude) || place.latitude < -90 || place.latitude > 90) {
      errors.push(`Invalid latitude in ${place.id}: ${place.latitude}`);
    }
    if (!Number.isFinite(place.longitude) || place.longitude < -180 || place.longitude > 180) {
      errors.push(`Invalid longitude in ${place.id}: ${place.longitude}`);
    }
    // A place is remembered to the year, the month, or the day, and a date is
    // allowed to be missing entirely rather than invented.
    if (place.date !== undefined && !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(place.date)) {
      errors.push(`Invalid date in ${place.id}: ${place.date}`);
    }
    if (place.note && place.note.length > NOTE_LIMIT) {
      errors.push(`Note in ${place.id} runs past ${NOTE_LIMIT} characters`);
    }
  }

  return errors;
}

// Natural Earth folds overseas territories into the sovereign state, so the
// atlas hands France its polygon for French Guiana and Norway its polygons for
// Svalbard. Eight degrees reaches an offshore island that belongs to the
// mainland visit, such as Corsica, and stops well short of a territory an
// ocean away.
const HOMELAND_DEGREES = 8;

export function isHomelandPolygon(polygon, centroid, limitDegrees = HOMELAND_DEGREES) {
  let west = Infinity;
  let east = -Infinity;
  let south = Infinity;
  let north = -Infinity;
  for (const [longitude, latitude] of polygon[0]) {
    if (longitude < west) west = longitude;
    if (longitude > east) east = longitude;
    if (latitude < south) south = latitude;
    if (latitude > north) north = latitude;
  }
  const northSouth = Math.max(south - centroid.latitude, centroid.latitude - north, 0);
  // Meridians converge, so a degree of longitude is worth less the further
  // north the country sits.
  const eastWest = Math.max(west - centroid.longitude, centroid.longitude - east, 0)
    * Math.cos(centroid.latitude * DEG);
  return Math.hypot(northSouth, eastWest) <= limitDegrees;
}
