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

export function validateTravelData(countries, trips) {
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
  return errors;
}
