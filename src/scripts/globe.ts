import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { feature } from "topojson-client";
import countriesTopology from "world-atlas/countries-110m.json";

import type { CountryRecord, PlaceRecord, TripRecord } from "../content/trips.ts";
import {
  fitVerticalFov,
  formatPlaceDate,
  greatCirclePoints,
  isHomelandPolygon,
  latLonToCartesian,
  projectRing,
  ringWrapOffsets,
} from "./globe-utils.mjs";

interface StateShape {
  name: string;
  polygons: number[][][][];
}

interface GlobeData {
  countries: CountryRecord[];
  trips: TripRecord[];
  places: PlaceRecord[];
  states: StateShape[];
}

interface AtlasStyle {
  fill: string;
  stroke: string;
  width: number;
}

const UNVISITED: AtlasStyle = { fill: "#284756", stroke: "rgba(151,196,207,.28)", width: 0.75 };
const VISITED: AtlasStyle = { fill: "#e79043", stroke: "rgba(255,220,165,.95)", width: 2.4 };
// A state is presence rather than a journey, so it takes the same orange held
// back a little: visited, but not a story with a route through it.
const VISITED_STATE: AtlasStyle = { fill: "rgba(231,144,67,.55)", stroke: "rgba(255,220,165,.8)", width: 1.4 };

interface AtlasFeature {
  id: string | number;
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
}

const RADIUS = 1;
// The atmosphere shell sits at 1.065; the extra margin keeps its glow off the
// canvas edge when a narrow stage forces the camera to widen.
const FIT_RADIUS = 1.12;

function readData(): GlobeData {
  const element = document.querySelector<HTMLScriptElement>("#globe-data");
  if (!element?.textContent) throw new Error("Missing globe data");
  return JSON.parse(element.textContent) as GlobeData;
}

function traceRing(
  context: CanvasRenderingContext2D,
  ring: number[][],
  width: number,
  height: number,
) {
  const points = projectRing(ring, width, height);
  for (const offset of ringWrapOffsets(points, width)) {
    points.forEach(([x, y], index) => {
      if (index === 0) context.moveTo(x + offset, y);
      else context.lineTo(x + offset, y);
    });
    context.closePath();
  }
}

function makeAtlasTexture(visited: readonly CountryRecord[], states: readonly StateShape[]) {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable");

  const paint = (polygons: number[][][][], style: AtlasStyle) => {
    if (polygons.length === 0) return;
    context.beginPath();
    for (const polygon of polygons) {
      for (const ring of polygon) traceRing(context, ring, canvas.width, canvas.height);
    }
    context.fillStyle = style.fill;
    context.fill("evenodd");
    context.strokeStyle = style.stroke;
    context.lineWidth = style.width;
    context.stroke();
  };

  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#173747");
  gradient.addColorStop(0.5, "#0e2938");
  gradient.addColorStop(1, "#071c28");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const atlas = feature(
    countriesTopology as never,
    (countriesTopology as { objects: { countries: never } }).objects.countries,
  ) as unknown as { features: AtlasFeature[] };

  const records = new Map(visited.map((country) => [country.atlasId, country]));
  for (const country of atlas.features) {
    const polygons = country.geometry.type === "Polygon"
      ? [country.geometry.coordinates as number[][][]]
      : country.geometry.coordinates as number[][][][];
    const record = records.get(String(country.id).padStart(3, "0"));
    // A country shaded by its states holds no blanket highlight of its own —
    // the places decide which parts of it are lit, which is also how Alaska and
    // Hawaii stop being a special case.
    if (record?.shadeBy === "states") {
      paint(polygons, UNVISITED);
      continue;
    }
    // A visit shades the landmass it covered, not every territory the atlas
    // files under the same country: France arrives carrying French Guiana on
    // the shoulder of South America, which no journey here has reached.
    const home = record
      ? polygons.filter((polygon) => isHomelandPolygon(polygon, record.centroid))
      : [];
    paint(polygons.filter((polygon) => !home.includes(polygon)), UNVISITED);
    paint(home, VISITED);
  }

  paint(states.flatMap((state) => state.polygons), VISITED_STATE);

  // Hairline latitude guides keep the object reading as an atlas, not a ball.
  context.strokeStyle = "rgba(139,218,224,.08)";
  context.lineWidth = 1;
  for (const latitude of [-60, -30, 0, 30, 60]) {
    const y = ((90 - latitude) / 180) * canvas.height;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(canvas.width, y);
    context.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function makeAtmosphere() {
  return new THREE.Mesh(
    new THREE.SphereGeometry(RADIUS * 1.065, 64, 64),
    new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        glowColor: { value: new THREE.Color("#74e5ed") },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPositionNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPositionNormal = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        varying vec3 vPositionNormal;
        void main() {
          float intensity = pow(0.72 - dot(vNormal, -vPositionNormal), 2.8);
          gl_FragColor = vec4(glowColor, intensity * 0.72);
        }
      `,
    }),
  );
}

function makeStars() {
  const count = 900;
  const positions = new Float32Array(count * 3);
  let seed = 271828;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let index = 0; index < count; index += 1) {
    const radius = 3.5 + random() * 4;
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[index * 3 + 1] = radius * Math.cos(phi);
    positions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: "#c8f8ff", size: 0.012, transparent: true, opacity: 0.64 }),
  );
}

function makeAurora() {
  const group = new THREE.Group();
  const colors = ["#62dbbc", "#6dbce9", "#8d7dea"];
  colors.forEach((color, index) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.7, 1.35 + index * 0.16, -1.2),
      new THREE.Vector3(-1.2, 1.8 - index * 0.12, -1.8),
      new THREE.Vector3(0.4, 1.45 + index * 0.12, -2.1),
      new THREE.Vector3(2.4, 1.72 - index * 0.1, -1.4),
    ]);
    const ribbon = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 80, 0.018 + index * 0.007, 6, false),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.16 - index * 0.025,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    group.add(ribbon);
  });
  return group;
}

function makeMarker(trip: TripRecord) {
  const group = new THREE.Group();
  const position = new THREE.Vector3(...latLonToCartesian(trip.anchor.latitude, trip.anchor.longitude, 1.03));
  const normal = position.clone().normalize();
  group.position.copy(position);
  group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
  group.userData.country = trip.visitedCountries[0];
  group.userData.trip = trip.slug;

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.027, 20, 20),
    new THREE.MeshBasicMaterial({ color: "#fff5de" }),
  );
  core.position.y = 0.028;
  core.userData.country = group.userData.country;
  core.userData.trip = trip.slug;
  group.add(core);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.045, 0.055, 40),
    new THREE.MeshBasicMaterial({ color: trip.accent, transparent: true, opacity: 0.9, side: THREE.DoubleSide }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.006;
  group.add(ring);

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.006, 0.01, 0.08, 12),
    new THREE.MeshBasicMaterial({ color: trip.accent }),
  );
  stem.position.y = 0.04;
  group.add(stem);
  return { group, hitTarget: core, ring };
}

// A place is a hairline rather than a pin. WebGL draws a line one pixel wide
// whatever the zoom, so a hundred of them over one continent stay separate
// marks instead of smearing into a single lit blob — which is also why none of
// this needs clustering.
const BEAM_BASE = 1.002;
const BEAM_TIP = 1.045;
// Vertex colours are read in the renderer's linear working space, so these go
// through THREE.Color rather than being written out by hand: an sRGB triple
// typed straight into the buffer comes back washed out.
const VISIT_TINT = { color: new THREE.Color("#eafdff"), foot: 0.92, head: 0.34 };
// Home is not a visit. It burns red against the cool scatter of the rest, and
// holds its colour the whole length of the beam rather than fading out — a
// hairline that fades is a hairline that goes back to looking like every other
// one. The red clears both the atlas's amber and Spain's coral trip accent.
const HOME_TINT = { color: new THREE.Color("#ff2f45"), foot: 1, head: 0.82 };

function makeDotTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable");
  const glow = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  glow.addColorStop(0, "rgba(255,255,255,1)");
  glow.addColorStop(0.3, "rgba(198,246,252,.9)");
  glow.addColorStop(1, "rgba(120,220,235,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

function makePlaceBeams(places: readonly PlaceRecord[]) {
  const beamPoints = new Float32Array(places.length * 6);
  const beamColors = new Float32Array(places.length * 8);
  const headPoints = new Float32Array(places.length * 3);
  const headColors = new Float32Array(places.length * 4);

  places.forEach((place, index) => {
    const foot = latLonToCartesian(place.latitude, place.longitude, BEAM_BASE);
    const head = latLonToCartesian(place.latitude, place.longitude, BEAM_TIP);
    beamPoints.set(foot, index * 6);
    beamPoints.set(head, index * 6 + 3);
    headPoints.set(head, index * 3);
  });

  const beams = new THREE.LineSegments(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false }),
  );
  beams.geometry.setAttribute("position", new THREE.BufferAttribute(beamPoints, 3));
  beams.geometry.setAttribute("color", new THREE.BufferAttribute(beamColors, 4));

  const heads = new THREE.Points(
    new THREE.BufferGeometry(),
    new THREE.PointsMaterial({
      size: 0.03,
      map: makeDotTexture(),
      vertexColors: true,
      transparent: true,
      depthWrite: false,
    }),
  );
  heads.geometry.setAttribute("position", new THREE.BufferAttribute(headPoints, 3));
  heads.geometry.setAttribute("color", new THREE.BufferAttribute(headColors, 4));

  // Lighting a beam is only ever a change of colour, so the whole layer stays
  // one geometry and one draw call however many places arrive.
  const tints = places.map((place) => (place.home ? HOME_TINT : VISIT_TINT));

  const light = (index: number, lit: boolean) => {
    const tint = tints[index];
    const { r, g, b } = tint.color;
    const foot = lit ? 1 : tint.foot;
    const head = lit ? 1 : tint.head;
    beamColors.set([r, g, b, foot, r, g, b, head], index * 8);
    headColors.set([r, g, b, lit ? 1 : 0.8], index * 4);
    beams.geometry.attributes.color.needsUpdate = true;
    heads.geometry.attributes.color.needsUpdate = true;
  };
  places.forEach((_place, index) => light(index, false));

  return { beams, heads, headPoints, light };
}

function makeRoute(trip: TripRecord) {
  const group = new THREE.Group();
  if (!trip.route.published || trip.route.waypoints.length < 2) return group;
  for (let index = 1; index < trip.route.waypoints.length; index += 1) {
    const values = greatCirclePoints(trip.route.waypoints[index - 1], trip.route.waypoints[index], 42, 1.018);
    const curve = new THREE.CatmullRomCurve3(values.map((point) => new THREE.Vector3(...point)));
    group.add(new THREE.Mesh(
      new THREE.TubeGeometry(curve, values.length * 2, 0.006, 6, false),
      new THREE.MeshBasicMaterial({ color: trip.route.color, transparent: true, opacity: 0.9 }),
    ));
  }
  return group;
}

export function startGlobe() {
  const stage = document.querySelector<HTMLElement>("[data-globe-stage]");
  const container = document.querySelector<HTMLElement>("#globe-canvas");
  if (!stage || !container || stage.dataset.state === "ready") return;

  const data = readData();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2("#061119", 0.085);
  const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 40);
  camera.position.set(0, 0.34, 3.38);
  const baseFov = camera.fov;
  const framingDistance = camera.position.length();

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch {
    stage.dataset.state = "fallback";
    throw new Error("WebGL renderer unavailable");
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const globe = new THREE.Group();
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(RADIUS, 96, 64),
    new THREE.MeshPhongMaterial({
      map: makeAtlasTexture(data.countries, data.states),
      specular: new THREE.Color("#356f7e"),
      shininess: 24,
      emissive: new THREE.Color("#04131b"),
    }),
  );
  globe.add(sphere, makeAtmosphere());
  scene.add(globe, makeStars(), makeAurora());
  scene.add(new THREE.HemisphereLight("#b8f5ff", "#071018", 2.1));
  const key = new THREE.DirectionalLight("#ffd8ad", 3.2);
  key.position.set(-2, 3, 4);
  scene.add(key);

  const hitTargets: THREE.Object3D[] = [];
  const pulseRings: THREE.Mesh[] = [];
  const routeGroups = new Map<string, THREE.Group>();
  for (const trip of data.trips) {
    const marker = makeMarker(trip);
    const route = makeRoute(trip);
    route.visible = false;
    routeGroups.set(trip.slug, route);
    globe.add(marker.group, route);
    hitTargets.push(marker.hitTarget);
    pulseRings.push(marker.ring);
  }

  const placeLayer = makePlaceBeams(data.places);
  globe.add(placeLayer.beams, placeLayer.heads);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.055;
  controls.minDistance = 2.15;
  controls.maxDistance = 4.1;
  controls.autoRotate = !reducedMotion;
  controls.autoRotateSpeed = 0.22;
  controls.target.set(0, 0.18, 0);

  const status = document.querySelector<HTMLElement>("#globe-status");
  const selectTrip = (slug: string) => {
    const trip = data.trips.find((item) => item.slug === slug);
    if (!trip) return;
    routeGroups.forEach((route, routeSlug) => { route.visible = routeSlug === slug; });
    document.querySelectorAll<HTMLElement>("[data-trip]").forEach((article) => {
      article.toggleAttribute("data-active", article.dataset.trip === slug);
    });
    if (status) {
      // Announce the shape of the route, not its colour: a hex code told a
      // screen reader nothing, and now that routes publish it is actually read.
      const stops = new Set(
        trip.route.waypoints.map((point) => `${point.latitude},${point.longitude}`),
      ).size;
      status.textContent = trip.route.published
        ? `${trip.title} selected. Its route is drawn on the globe through ${stops} stops.`
        : `${trip.title} selected. Its actual route is awaiting confirmation.`;
    }
  };
  const selectCountry = (iso2: string) => {
    const country = data.countries.find((item) => item.iso2 === iso2);
    if (!country) return;
    stage.dataset.country = iso2;
    document.querySelectorAll<HTMLElement>("[data-country-card]").forEach((card) => {
      card.toggleAttribute("hidden", card.dataset.countryCard !== iso2);
    });
    document.querySelectorAll<HTMLElement>("[data-country]").forEach((button) => {
      button.toggleAttribute("data-active", button.dataset.country === iso2);
    });
    const firstTrip = data.trips.find((trip) => trip.visitedCountries.includes(iso2));
    if (firstTrip) {
      selectTrip(firstTrip.slug);
      return;
    }
    // A country held by places rather than journeys has no route to draw, and
    // leaving the last one lit would read as belonging to it.
    routeGroups.forEach((route) => { route.visible = false; });
    if (status) {
      status.textContent = `${country.name} selected. ${data.places.length} places are lit on the globe.`;
    }
  };

  document.querySelectorAll<HTMLButtonElement>("[data-country]").forEach((button) => {
    button.addEventListener("click", () => selectCountry(button.dataset.country ?? ""));
  });
  document.querySelectorAll<HTMLButtonElement>("[data-select-trip]").forEach((button) => {
    button.addEventListener("click", () => selectTrip(button.dataset.selectTrip ?? ""));
  });
  document.querySelectorAll<HTMLButtonElement>("[data-close-country]").forEach((button) => {
    button.addEventListener("click", () => {
      button.closest<HTMLElement>("[data-country-card]")?.setAttribute("hidden", "");
      stage.removeAttribute("data-country");
      routeGroups.forEach((route) => { route.visible = false; });
    });
  });

  const label = document.querySelector<HTMLElement>("[data-place-label]");
  const labelName = label?.querySelector<HTMLElement>("[data-place-name]");
  const labelMeta = label?.querySelector<HTMLElement>("[data-place-meta]");
  const labelNote = label?.querySelector<HTMLElement>("[data-place-note]");
  const placeCountry = data.countries.find((country) => country.shadeBy === "states")?.iso2;
  // What the beam layer is showing, and what a click or a button settled on:
  // moving the pointer away from a beam falls back to the chosen one.
  let litPlace = -1;
  let chosenPlace = -1;

  const showPlace = (index: number) => {
    if (index === litPlace) return;
    if (litPlace >= 0) placeLayer.light(litPlace, false);
    litPlace = index;
    if (index >= 0) placeLayer.light(index, true);

    const place = data.places[index];
    document.querySelectorAll<HTMLElement>("[data-place]").forEach((button) => {
      button.toggleAttribute("data-active", button.dataset.place === place?.id);
    });
    if (!label || !labelName || !labelMeta || !labelNote) return;
    label.hidden = !place;
    if (!place) return;
    labelName.textContent = place.label;
    labelMeta.textContent = [place.state, formatPlaceDate(place.date)].filter(Boolean).join(" · ");
    labelNote.textContent = place.note ?? "";
    labelNote.hidden = !place.note;
  };

  const selectPlace = (id: string) => {
    const index = data.places.findIndex((place) => place.id === id);
    if (index < 0) return;
    chosenPlace = index;
    showPlace(index);
    if (placeCountry) selectCountry(placeCountry);
    const place = data.places[index];
    const when = formatPlaceDate(place.date);
    if (status) {
      status.textContent = when
        ? `${place.label}, ${place.state}. Visited ${when}.`
        : `${place.label}, ${place.state}.`;
    }
  };

  const raycaster = new THREE.Raycaster();
  raycaster.params.Points.threshold = 0.03;
  const pointer = new THREE.Vector2();
  const scratch = new THREE.Vector3();

  // The raycaster does not know the globe is solid, so a beam on the far side
  // would answer a click through the planet. A point on the unit sphere faces
  // the camera only while its dot product with the camera position clears one.
  const facingCamera = (index: number) => scratch
    .fromArray(placeLayer.headPoints, index * 3)
    .applyMatrix4(globe.matrixWorld)
    .dot(camera.position) > 1;

  const aim = (event: PointerEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
  };

  const pickPlace = () => {
    const hit = raycaster.intersectObject(placeLayer.heads, false)[0];
    if (hit?.index === undefined) return -1;
    return facingCamera(hit.index) ? hit.index : -1;
  };

  let pointerDown = { x: 0, y: 0 };
  renderer.domElement.addEventListener("pointerdown", (event) => {
    pointerDown = { x: event.clientX, y: event.clientY };
    controls.autoRotate = false;
  });
  renderer.domElement.addEventListener("pointermove", (event) => {
    aim(event);
    const hovered = pickPlace();
    renderer.domElement.style.cursor = hovered >= 0 ? "pointer" : "";
    showPlace(hovered >= 0 ? hovered : chosenPlace);
  });
  renderer.domElement.addEventListener("pointerleave", () => showPlace(chosenPlace));
  renderer.domElement.addEventListener("pointerup", (event) => {
    if (Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 8) return;
    aim(event);
    const place = pickPlace();
    if (place >= 0) {
      selectPlace(data.places[place].id);
      return;
    }
    const hit = raycaster.intersectObjects(hitTargets, false)[0];
    const country = hit?.object.userData.country as string | undefined;
    const trip = hit?.object.userData.trip as string | undefined;
    if (country) selectCountry(country);
    if (trip) selectTrip(trip);
  });

  document.querySelectorAll<HTMLButtonElement>("[data-place]").forEach((button) => {
    button.addEventListener("click", () => selectPlace(button.dataset.place ?? ""));
  });

  const resize = () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.fov = fitVerticalFov(camera.aspect, framingDistance, FIT_RADIUS, baseFov);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  let frame = 0;
  let visible = !document.hidden;
  const onContextLost = (event: Event) => {
    event.preventDefault();
    visible = false;
    cancelAnimationFrame(frame);
    stage.dataset.state = "fallback";
    if (status) status.textContent = "The interactive globe stopped responding. The static atlas and journey links remain available.";
  };
  renderer.domElement.addEventListener("webglcontextlost", onContextLost);
  const startedAt = performance.now();
  const render = () => {
    frame = requestAnimationFrame(render);
    if (!visible) return;
    const elapsed = (performance.now() - startedAt) / 1000;
    pulseRings.forEach((ring, index) => {
      const scale = 1 + Math.sin(elapsed * 2 + index) * 0.16;
      ring.scale.setScalar(scale);
      const material = ring.material as THREE.MeshBasicMaterial;
      material.opacity = 0.68 + Math.sin(elapsed * 2 + index) * 0.2;
    });
    if (label && !label.hidden && litPlace >= 0) {
      scratch.fromArray(placeLayer.headPoints, litPlace * 3).applyMatrix4(globe.matrixWorld);
      const behind = scratch.dot(camera.position) <= 1;
      scratch.project(camera);
      label.style.left = `${container.offsetLeft + ((scratch.x + 1) / 2) * container.clientWidth}px`;
      label.style.top = `${container.offsetTop + ((1 - scratch.y) / 2) * container.clientHeight}px`;
      label.toggleAttribute("data-behind", behind);
    }
    controls.update();
    renderer.render(scene, camera);
  };
  const onVisibility = () => { visible = !document.hidden; };
  document.addEventListener("visibilitychange", onVisibility);
  render();

  stage.dataset.state = "ready";
  selectCountry(data.countries[0]?.iso2 ?? "");

  document.addEventListener("astro:before-swap", () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
    renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
    controls.dispose();
    renderer.dispose();
  }, { once: true });
}
