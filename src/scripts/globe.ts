import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { feature } from "topojson-client";
import countriesTopology from "world-atlas/countries-110m.json";

import type { CountryRecord, TripRecord } from "../content/trips.ts";
import {
  fitVerticalFov,
  greatCirclePoints,
  latLonToCartesian,
  projectRing,
  ringWrapOffsets,
} from "./globe-utils.mjs";

interface GlobeData {
  countries: CountryRecord[];
  trips: TripRecord[];
}

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

function makeAtlasTexture(visitedAtlasIds: Set<string>) {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable");

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

  for (const country of atlas.features) {
    const polygons = country.geometry.type === "Polygon"
      ? [country.geometry.coordinates as number[][][]]
      : country.geometry.coordinates as number[][][][];
    context.beginPath();
    for (const polygon of polygons) {
      for (const ring of polygon) traceRing(context, ring, canvas.width, canvas.height);
    }
    const visited = visitedAtlasIds.has(String(country.id).padStart(3, "0"));
    context.fillStyle = visited ? "#e79043" : "#284756";
    context.fill("evenodd");
    context.strokeStyle = visited ? "rgba(255,220,165,.95)" : "rgba(151,196,207,.28)";
    context.lineWidth = visited ? 2.4 : 0.75;
    context.stroke();
  }

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
  const visitedIds = new Set(data.countries.map((country) => country.atlasId));
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(RADIUS, 96, 64),
    new THREE.MeshPhongMaterial({
      map: makeAtlasTexture(visitedIds),
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
    if (firstTrip) selectTrip(firstTrip.slug);
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

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let pointerDown = { x: 0, y: 0 };
  renderer.domElement.addEventListener("pointerdown", (event) => {
    pointerDown = { x: event.clientX, y: event.clientY };
    controls.autoRotate = false;
  });
  renderer.domElement.addEventListener("pointerup", (event) => {
    if (Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 8) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(hitTargets, false)[0];
    const country = hit?.object.userData.country as string | undefined;
    const trip = hit?.object.userData.trip as string | undefined;
    if (country) selectCountry(country);
    if (trip) selectTrip(trip);
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
