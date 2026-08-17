// The Nexus — 3D entry world for the multiverse portfolio.
// Each version floats as a glass orb holding a miniature world (aurora ribbons
// = scroll, card constellation = card, glyph rain = terminal, low-poly planet
// = game). Clicking one flies the camera into the glass and hands off to the
// Worker via /?v=. The version list lives in ../content/versions.ts.
import * as THREE from "three";
import { VERSIONS, type VersionDef } from "../content/versions.ts";

const ORB_RADIUS = 1.2;
const ORB_SPACING = 2.9; // landscape arc distance between orb centers
const LOOK_TARGET = new THREE.Vector3(0, 0.3, 0);
const ENTER_DURATION = 1.05; // seconds
const TILT_RANGE = 14; // degrees from the visitor's starting position
const TILT_DEAD_ZONE = 0.75; // filters small sensor noise while held still
const TILT_CAMERA_X = 0.55;
const TILT_CAMERA_Y = 0.28;

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Screen-space scale for the glyph-rain points; updated on resize so glyphs
// keep a consistent size across window sizes and DPRs.
const POINT_SCALE = { value: 400 };

// ---------------------------------------------------------------------------
// Glass shell — a fresnel rim in the version's color plus a fake specular
// glint. Rendered twice per orb (BackSide then FrontSide) so the glass has a
// visible far wall behind the interior.
const SHELL_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const SHELL_FRAG = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  uniform vec3 uColor;
  uniform float uHover;
  uniform float uEnter;
  uniform float uRimPower;
  uniform float uIntensity;

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vView);
    // abs() so the BackSide pass (normals facing away) gets the same rim.
    float fres = pow(1.0 - abs(dot(N, V)), uRimPower);
    vec3 L = normalize(vec3(0.6, 0.8, 0.5));
    float spec = pow(max(dot(reflect(-L, N), V), 0.0), 48.0);
    vec3 col = uColor * (0.9 + 0.6 * uHover) + vec3(spec * 0.6);
    col = mix(col, vec3(1.0), uEnter);
    float alpha = (fres * (0.55 + 0.25 * uHover) + spec * 0.4 + 0.03) * uIntensity;
    gl_FragColor = vec4(col, mix(alpha, 1.0, uEnter * 0.9));
  }
`;

// ---------------------------------------------------------------------------
// Interiors — one miniature world per version, each a cheap self-contained
// group with its own update clock (so hover can dilate time per orb).
interface Interior {
  object: THREE.Object3D;
  update(time: number): void;
}

// a-scroll: three sine-warped aurora ribbons drifting around the center.
const AURORA_VERT = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uPhase;
  void main() {
    vUv = uv;
    vec3 p = position;
    float t = uTime + uPhase;
    p.z += sin(p.x * 4.0 + t * 1.2) * 0.12;
    p.y += sin(p.x * 2.5 + t * 0.8) * 0.1;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const AURORA_FRAG = /* glsl */ `
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uPhase;
  void main() {
    float edge = smoothstep(0.0, 0.45, vUv.y) * smoothstep(1.0, 0.55, vUv.y);
    float ends = smoothstep(0.0, 0.3, vUv.x) * smoothstep(1.0, 0.7, vUv.x);
    float wave = 0.6 + 0.4 * sin(vUv.x * 6.0 - (uTime + uPhase) * 0.9);
    gl_FragColor = vec4(uColor, edge * ends * wave * 0.55);
  }
`;

function buildAurora(color: THREE.Color): Interior {
  const group = new THREE.Group();
  const time = { value: 0 };
  for (let i = 0; i < 3; i++) {
    const material = new THREE.ShaderMaterial({
      vertexShader: AURORA_VERT,
      fragmentShader: AURORA_FRAG,
      uniforms: { uTime: time, uColor: { value: color }, uPhase: { value: i * 2.4 } },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const ribbon = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.45, 48, 1), material);
    ribbon.rotation.y = (i * Math.PI) / 3;
    ribbon.position.y = (i - 1) * 0.22;
    group.add(ribbon);
  }
  return {
    object: group,
    update(time_) {
      time.value = time_;
      group.rotation.y = time_ * 0.12;
    },
  };
}

// b-card: a drifting constellation of small twinkling cards.
const CARDS_VERT = /* glsl */ `
  attribute float aPhase;
  uniform float uTime;
  varying float vTwinkle;
  void main() {
    vTwinkle = 0.25 + 0.75 * (0.5 + 0.5 * sin(aPhase + uTime * 1.5));
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`;

const CARDS_FRAG = /* glsl */ `
  uniform vec3 uColor;
  varying float vTwinkle;
  void main() {
    gl_FragColor = vec4(uColor * vTwinkle, vTwinkle * 0.9);
  }
`;

function buildCards(color: THREE.Color): Interior {
  const COUNT = 40;
  const geometry = new THREE.PlaneGeometry(0.18, 0.24);
  const time = { value: 0 };
  const material = new THREE.ShaderMaterial({
    vertexShader: CARDS_VERT,
    fragmentShader: CARDS_FRAG,
    uniforms: { uTime: time, uColor: { value: color } },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const cards = new THREE.InstancedMesh(geometry, material, COUNT);
  const phases = new Float32Array(COUNT);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < COUNT; i++) {
    // Random point inside a sphere, denser toward the center.
    const radius = 0.75 * Math.cbrt(Math.random());
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    dummy.position.set(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi)
    );
    dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    dummy.updateMatrix();
    cards.setMatrixAt(i, dummy.matrix);
    phases[i] = Math.random() * Math.PI * 2;
  }
  geometry.setAttribute("aPhase", new THREE.InstancedBufferAttribute(phases, 1));
  const group = new THREE.Group();
  group.add(cards);
  return {
    object: group,
    update(time_) {
      time.value = time_;
      group.rotation.y = -time_ * 0.1;
    },
  };
}

// c-terminal: columns of glyph rain falling through the core, fading out
// before they reach the glass.
const RAIN_VERT = /* glsl */ `
  attribute float aSpeed;
  attribute float aSeed;
  attribute float aHead;
  uniform float uTime;
  uniform float uScale;
  varying float vAlpha;
  varying float vHead;
  void main() {
    vec3 p = position;
    float H = 0.9;
    p.y = mod(p.y - uTime * aSpeed, 2.0 * H) - H;
    float flicker = 0.6 + 0.4 * sin(aSeed * 6.2831 + uTime * 4.0);
    vAlpha = smoothstep(0.95, 0.6, length(p)) * flicker;
    vHead = aHead;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = (uScale * 0.075) / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const RAIN_FRAG = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  varying float vHead;
  void main() {
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    // Tall rounded blob so each point reads as a glyph, not a dot.
    float d = max(abs(p.x) * 1.8, abs(p.y));
    float glyph = smoothstep(1.0, 0.55, d);
    float a = glyph * vAlpha;
    if (a < 0.02) discard;
    vec3 col = mix(uColor * 0.9, vec3(1.0), vHead * 0.35);
    gl_FragColor = vec4(col, a);
  }
`;

function buildRain(color: THREE.Color): Interior {
  const COLUMNS = 24;
  const PER_COLUMN = 6;
  const COUNT = COLUMNS * PER_COLUMN;
  const positions = new Float32Array(COUNT * 3);
  const speeds = new Float32Array(COUNT);
  const seeds = new Float32Array(COUNT);
  const heads = new Float32Array(COUNT);
  for (let c = 0; c < COLUMNS; c++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.7 * Math.sqrt(Math.random());
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);
    const speed = 0.5 + Math.random() * 0.6;
    const offset = Math.random() * 1.8;
    for (let j = 0; j < PER_COLUMN; j++) {
      const i = c * PER_COLUMN + j;
      positions[i * 3] = x;
      positions[i * 3 + 1] = offset + j * 0.3; // head (j = 0) falls lowest
      positions[i * 3 + 2] = z;
      speeds[i] = speed;
      seeds[i] = Math.random();
      heads[i] = j === 0 ? 1 : 0;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute("aHead", new THREE.BufferAttribute(heads, 1));
  const time = { value: 0 };
  const material = new THREE.ShaderMaterial({
    vertexShader: RAIN_VERT,
    fragmentShader: RAIN_FRAG,
    uniforms: { uTime: time, uColor: { value: color }, uScale: POINT_SCALE },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geometry, material);
  const group = new THREE.Group();
  group.add(points);
  return {
    object: group,
    update(time_) {
      time.value = time_;
      group.rotation.y = time_ * 0.08;
    },
  };
}

// d-3d-game: a wireframe halfpipe with a tiny snowboarder carving wall to
// wall, airing above the coping with a spin at each side, under light snow.
function buildHalfpipe(color: THREE.Color): Interior {
  const group = new THREE.Group();
  const PIPE_RADIUS = 0.55;
  const PIPE_LENGTH = 0.95;
  const PIPE_Y = 0.18; // coping height; the U hangs below

  const pipe = new THREE.Mesh(
    new THREE.CylinderGeometry(
      PIPE_RADIUS,
      PIPE_RADIUS,
      PIPE_LENGTH,
      14,
      3,
      true,
      -Math.PI / 2,
      Math.PI
    ),
    new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    })
  );
  pipe.rotation.x = Math.PI / 2; // trough runs along z, opening upward
  pipe.position.y = PIPE_Y;
  group.add(pipe);

  // Glowing coping rails along both lips.
  for (const side of [-1, 1]) {
    const rail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, PIPE_LENGTH, 6),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    rail.rotation.x = Math.PI / 2;
    rail.position.set(side * PIPE_RADIUS, PIPE_Y, 0);
    group.add(rail);
  }

  // The rider: a board plus a tiny body, swung as one.
  const rider = new THREE.Group();
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.022, 0.09),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 8, 8),
    new THREE.MeshBasicMaterial({ color })
  );
  body.position.y = 0.08;
  rider.add(board, body);
  group.add(rider);

  // Light snowfall, wrapped vertically.
  const SNOW = 40;
  const snowBase = new Float32Array(SNOW * 3);
  for (let i = 0; i < SNOW; i++) {
    const radius = 0.85 * Math.cbrt(Math.random());
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    snowBase[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    snowBase[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    snowBase[i * 3 + 2] = radius * Math.cos(phi);
  }
  const snowGeometry = new THREE.BufferGeometry();
  snowGeometry.setAttribute("position", new THREE.BufferAttribute(snowBase.slice(), 3));
  const snow = new THREE.Points(
    snowGeometry,
    new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.03,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    })
  );
  group.add(snow);

  return {
    object: group,
    update(time_) {
      // Swing across the U, overshooting the lip for air time; the overshoot
      // fraction drives a spin at each wall.
      const swing = Math.sin(time_ * 1.5) * (Math.PI / 2 + 0.45);
      const rideRadius = PIPE_RADIUS - 0.05;
      rider.position.set(
        Math.sin(swing) * rideRadius,
        PIPE_Y - Math.cos(swing) * rideRadius + 0.02,
        Math.sin(time_ * 0.37) * (PIPE_LENGTH / 2 - 0.12)
      );
      const air = THREE.MathUtils.smoothstep(
        Math.abs(swing),
        Math.PI / 2,
        Math.PI / 2 + 0.45
      );
      // Tilt with the wall, then spin about vertical while airborne.
      rider.rotation.set(0, air * Math.PI * 2 * Math.sign(swing), swing);

      const positions = snow.geometry.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < SNOW; i++) {
        const y = snowBase[i * 3 + 1] - time_ * 0.12;
        positions.setY(i, THREE.MathUtils.euclideanModulo(y + 0.9, 1.8) - 0.9);
      }
      positions.needsUpdate = true;

      // A gentle sway (never a full turn) keeps the pipe's depth readable.
      group.rotation.y = Math.sin(time_ * 0.2) * 0.5;
    },
  };
}

// e-2d-game: a wireframe ring under a hanging lamp, where two tiny fighters
// trade — one throws, the other slips it, then they swap. That exchange is
// the whole game (Counter: read the punch, slip, fire back).
function buildRing(color: THREE.Color): Interior {
  const group = new THREE.Group();
  const HALF = 0.5; // ring half-width
  const FLOOR_Y = -0.32;
  const POST_H = 0.44;
  const HOME_Z = 0.17; // each fighter's distance from center, squared up on z

  const canvas = new THREE.Mesh(
    new THREE.PlaneGeometry(HALF * 2, HALF * 2, 4, 4),
    new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    })
  );
  canvas.rotation.x = -Math.PI / 2;
  canvas.position.y = FLOOR_Y;
  group.add(canvas);

  const corners: [number, number][] = [
    [-HALF, -HALF],
    [HALF, -HALF],
    [HALF, HALF],
    [-HALF, HALF],
  ];

  const postMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  for (const [x, z] of corners) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, POST_H, 6), postMaterial);
    post.position.set(x, FLOOR_Y + POST_H / 2, z);
    group.add(post);
  }

  const ropeMaterial = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  for (const height of [0.16, 0.28, 0.4]) {
    const points = corners.map(([x, z]) => new THREE.Vector3(x, FLOOR_Y + height, z));
    group.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), ropeMaterial));
  }

  // The lamp over the ring. (A cone for its beam was tried and cut: at this
  // scale the silhouette reads as a solid pyramid, not light.)
  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 10, 10),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  lamp.position.y = 0.6;
  group.add(lamp);

  // White versus the version color, the way the halfpipe pairs a white board
  // with a colored rider. Each fighter's lead glove animates on its own.
  function buildFighter(bodyColor: THREE.ColorRepresentation, gloveColor: THREE.ColorRepresentation) {
    const fighter = new THREE.Group();
    const bodyMaterial = new THREE.MeshBasicMaterial({ color: bodyColor });
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.07), bodyMaterial);
    torso.position.y = 0.08;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), bodyMaterial);
    head.position.y = 0.2;
    const glove = new THREE.Mesh(
      new THREE.SphereGeometry(0.028, 8, 8),
      new THREE.MeshBasicMaterial({ color: gloveColor })
    );
    glove.position.set(0.035, 0.15, 0.05);
    fighter.add(torso, head, glove);
    return { group: fighter, glove };
  }

  const fighters = [buildFighter(0xffffff, color), buildFighter(color, 0xffffff)];
  fighters[1].group.rotation.y = Math.PI; // squared up, facing each other
  group.add(fighters[0].group, fighters[1].group);

  return {
    object: group,
    update(time_) {
      const bob = Math.sin(time_ * 5) * 0.012;
      // One punch per beat, alternating who throws it.
      const beat = time_ / 1.4;
      const attacker = Math.floor(beat) % 2;
      const phase = beat - Math.floor(beat);
      // Out and back over the front of the beat; the rest is reset time.
      const jab = Math.sin(Math.PI * THREE.MathUtils.clamp(phase / 0.4, 0, 1));

      fighters.forEach((fighter, index) => {
        const facing = index === 0 ? 1 : -1; // fighter 0 faces +z
        const throwing = index === attacker;
        const punch = throwing ? jab : 0;
        const slip = throwing ? 0 : jab;
        fighter.glove.position.z = 0.05 + punch * 0.14;
        fighter.group.position.set(
          slip * 0.06 * facing,
          FLOOR_Y + bob * (throwing ? 1 : -1),
          facing * (-HOME_Z + punch * 0.05 - slip * 0.04)
        );
        // The defender ducks off the line instead of eating it.
        fighter.group.rotation.z = slip * 0.4 * facing;
      });

      // A sway rather than a spin, so the ring keeps a readable 3/4 angle.
      group.rotation.y = Math.sin(time_ * 0.2) * 0.5 + 0.35;
    },
  };
}

const INTERIOR_BUILDERS: Record<VersionDef["interior"], (color: THREE.Color) => Interior> = {
  aurora: buildAurora,
  cards: buildCards,
  rain: buildRain,
  halfpipe: buildHalfpipe,
  ring: buildRing,
};

// ---------------------------------------------------------------------------

interface Portal {
  def: VersionDef;
  group: THREE.Group;
  shell: THREE.Mesh; // FrontSide glass — the raycast target
  interior: Interior;
  interiorTime: number; // per-orb clock; hover dilates it
  uniforms: {
    uHover: { value: number };
    uEnter: { value: number };
    uRimPower: { value: number };
  };
  hover: number; // eased 0..1
  bobPhase: number;
  introDelay: number;
  home: THREE.Vector3; // layout position (arc on wide screens, grid on portrait)
  layoutScale: number;
  labelOffset: number; // world units below orb center for the HTML label
}

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl2") || canvas.getContext("webgl"))
    );
  } catch {
    return false;
  }
}

function showFallback() {
  document.getElementById("nexus-fallback")?.removeAttribute("hidden");
  document.getElementById("nexus-scene")?.setAttribute("hidden", "");
  document.getElementById("nexus-labels")?.setAttribute("hidden", "");
}

function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function buildStars(): THREE.Points {
  const COUNT = 1400;
  const positions = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    // Random point on a thick spherical shell so stars surround the scene.
    const radius = 28 + Math.random() * 34;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xdfe4ff,
    size: 0.14,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  return new THREE.Points(geometry, material);
}

function buildOrb(def: VersionDef, index: number): Portal {
  const group = new THREE.Group();
  const color = new THREE.Color(def.color);

  const uHover = { value: 0 };
  const uEnter = { value: 0 };
  const uRimPower = { value: 2.6 };
  const geometry = new THREE.SphereGeometry(ORB_RADIUS, 48, 32);
  const shellMaterial = (side: THREE.Side, intensity: number) =>
    new THREE.ShaderMaterial({
      vertexShader: SHELL_VERT,
      fragmentShader: SHELL_FRAG,
      // Shared value objects, so one write drives both shell passes.
      uniforms: { uColor: { value: color }, uHover, uEnter, uRimPower, uIntensity: { value: intensity } },
      transparent: true,
      side,
      depthWrite: false,
    });

  // Fixed render order (back wall → interior → front glass) keeps the
  // transparent layers from popping as the camera drifts.
  const back = new THREE.Mesh(geometry, shellMaterial(THREE.BackSide, 0.35));
  back.renderOrder = 1;

  const interior = INTERIOR_BUILDERS[def.interior](color);
  interior.object.traverse((child) => (child.renderOrder = 2));

  const shell = new THREE.Mesh(geometry, shellMaterial(THREE.FrontSide, 1));
  shell.renderOrder = 3;
  shell.userData.portalIndex = index;

  group.add(back, interior.object, shell);
  return {
    def,
    group,
    shell,
    interior,
    interiorTime: Math.random() * 40,
    uniforms: { uHover, uEnter, uRimPower },
    hover: 0,
    bobPhase: index * 2.1,
    introDelay: 0.15 + index * 0.16,
    home: new THREE.Vector3(),
    layoutScale: 1,
    labelOffset: ORB_RADIUS + 0.55,
  };
}

function init() {
  const container = document.getElementById("nexus-scene");
  if (!container) return;
  if (!webglAvailable()) {
    showFallback();
    return;
  }

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setClearColor(0x05060e);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 120);

  const stars = buildStars();
  scene.add(stars);

  const portals = VERSIONS.map(buildOrb);
  portals.forEach((portal) => {
    portal.group.scale.setScalar(reducedMotion ? 1 : 0.001);
    scene.add(portal.group);
  });

  const labels = new Map<string, HTMLAnchorElement>();
  document
    .querySelectorAll<HTMLAnchorElement>("#nexus-labels a[data-version]")
    .forEach((el) => labels.set(el.dataset.version!, el));

  const veil = document.getElementById("nexus-veil")!;

  // Wide screens get a shallow arc sized to however many orbs exist; portrait
  // uses a centered column (≤3 orbs) or a two-column grid (4+, since this page
  // never scrolls). The camera backs up until everything fits.
  let baseCameraZ = 9;
  function layout() {
    const aspect = window.innerWidth / window.innerHeight;
    camera.aspect = aspect;
    const portrait = aspect < 0.9;
    const count = portals.length;
    let halfWidthNeeded: number;
    let halfHeightNeeded: number;

    if (!portrait) {
      const halfSpan = (ORB_SPACING * (count - 1)) / 2;
      portals.forEach((portal, index) => {
        const t = count > 1 ? (index - (count - 1) / 2) / ((count - 1) / 2) : 0;
        portal.home.set(t * halfSpan, 0.3, -0.9 * t * t);
        portal.layoutScale = 1;
      });
      halfWidthNeeded = halfSpan + ORB_RADIUS + 0.9;
      halfHeightNeeded = 3.9;
    } else if (count <= 3) {
      portals.forEach((portal, index) => {
        portal.home.set(0, ((count - 1) / 2 - index) * 4.0 - 0.3, 0);
        portal.layoutScale = 0.72;
      });
      halfWidthNeeded = 1.6;
      // The extra factor leaves the header/footer bands clear.
      halfHeightNeeded = (2.0 * (count - 1) + ORB_RADIUS * 0.72 + 1.5) * 1.4;
    } else {
      const rows = Math.ceil(count / 2);
      portals.forEach((portal, index) => {
        const row = Math.floor(index / 2);
        const soloRow = count % 2 === 1 && row === rows - 1;
        const x = soloRow ? 0 : index % 2 === 0 ? -1.45 : 1.45;
        portal.home.set(x, ((rows - 1) / 2 - row) * 3.1 + 0.1, 0);
        portal.layoutScale = 0.62;
      });
      halfWidthNeeded = 1.45 + ORB_RADIUS * 0.62 + 0.5;
      halfHeightNeeded = (((rows - 1) / 2) * 3.1 + ORB_RADIUS * 0.62 + 1.4) * 1.4;
    }

    portals.forEach((portal) => {
      portal.labelOffset = ORB_RADIUS * portal.layoutScale + (portrait ? 0.4 : 0.55);
      portal.group.position.copy(portal.home);
    });

    const halfVerticalTan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const halfHorizontalTan = halfVerticalTan * aspect;
    baseCameraZ = THREE.MathUtils.clamp(
      Math.max(halfWidthNeeded / halfHorizontalTan, halfHeightNeeded / halfVerticalTan),
      9,
      26
    );
    camera.updateProjectionMatrix();
  }

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    POINT_SCALE.value = (window.innerHeight * renderer.getPixelRatio()) / 2;
    layout();
  }
  resize();
  window.addEventListener("resize", resize);

  // Pointer parallax + raycast hover.
  const pointer = new THREE.Vector2(0, 0);
  const pointerTarget = new THREE.Vector2(0, 0);
  const tilt = new THREE.Vector2(0, 0);
  const tiltTarget = new THREE.Vector2(0, 0);
  const raycaster = new THREE.Raycaster();
  let hoveredIndex = -1;
  let focusedIndex = -1;
  let pointerActive = false;
  let tiltActive = false;
  let tiltOrigin: { beta: number; gamma: number } | null = null;
  const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function setPointerPosition(clientX: number, clientY: number) {
    pointerTarget.set(
      (clientX / window.innerWidth) * 2 - 1,
      -(clientY / window.innerHeight) * 2 + 1
    );
  }

  function portalAt(clientX: number, clientY: number): number {
    setPointerPosition(clientX, clientY);
    raycaster.setFromCamera(pointerTarget, camera);
    const hits = raycaster.intersectObjects(portals.map((portal) => portal.shell));
    return hits.length ? (hits[0].object.userData.portalIndex as number) : -1;
  }

  function shortestAngle(value: number, origin: number): number {
    return THREE.MathUtils.euclideanModulo(value - origin + 180, 360) - 180;
  }

  function normalizeTilt(value: number): number {
    const magnitude = Math.max(0, Math.abs(value) - TILT_DEAD_ZONE);
    return (
      Math.sign(value) *
      THREE.MathUtils.clamp(magnitude / (TILT_RANGE - TILT_DEAD_ZONE), 0, 1)
    );
  }

  function screenAngle(): number {
    const legacyAngle = (window as Window & { orientation?: number }).orientation ?? 0;
    return THREE.MathUtils.euclideanModulo(screen.orientation?.angle ?? legacyAngle, 360);
  }

  function resetTiltOrigin() {
    tiltOrigin = null;
    tiltTarget.set(0, 0);
  }

  function onDeviceOrientation(event: DeviceOrientationEvent) {
    if (event.beta === null || event.gamma === null) return;

    if (!tiltOrigin) {
      // Calibrate to however the visitor is naturally holding their phone so
      // enabling tilt never causes the scene to jump.
      tiltOrigin = { beta: event.beta, gamma: event.gamma };
      tiltActive = true;
      return;
    }

    const beta = shortestAngle(event.beta, tiltOrigin.beta);
    const gamma = shortestAngle(event.gamma, tiltOrigin.gamma);
    const angle = THREE.MathUtils.degToRad(screenAngle());

    // Rotate the sensor axes into screen space so portrait and either
    // landscape orientation feel the same.
    const screenX = gamma * Math.cos(angle) + beta * Math.sin(angle);
    const screenY = beta * Math.cos(angle) - gamma * Math.sin(angle);
    tiltTarget.set(normalizeTilt(screenX), -normalizeTilt(screenY));
  }

  function setupTiltControls() {
    const hint = document.getElementById("nexus-look-hint");
    const permissionButton = document.getElementById("nexus-tilt-permission");
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

    if (!coarsePointer) return;
    if (reducedMotion || !("DeviceOrientationEvent" in window)) {
      if (hint) hint.textContent = "tap a portal";
      return;
    }

    type OrientationEventWithPermission = typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<"granted" | "denied">;
    };
    const OrientationEvent = window.DeviceOrientationEvent as OrientationEventWithPermission;

    const enableTilt = () => {
      window.addEventListener("deviceorientation", onDeviceOrientation, { passive: true });
      screen.orientation?.addEventListener("change", resetTiltOrigin);
      if (hint) hint.textContent = "tilt to look";
      if (permissionButton instanceof HTMLButtonElement) permissionButton.hidden = true;
    };

    if (typeof OrientationEvent.requestPermission !== "function") {
      enableTilt();
      return;
    }

    if (!(permissionButton instanceof HTMLButtonElement)) return;
    if (hint) hint.textContent = "tilt to look";
    permissionButton.hidden = false;
    permissionButton.addEventListener(
      "click",
      async () => {
        permissionButton.disabled = true;
        try {
          const permission = await OrientationEvent.requestPermission!();
          if (permission === "granted") {
            enableTilt();
          } else {
            permissionButton.hidden = true;
            if (hint) hint.textContent = "tap a portal";
          }
        } catch {
          permissionButton.hidden = true;
          if (hint) hint.textContent = "tap a portal";
        } finally {
          permissionButton.disabled = false;
        }
      },
      { once: true }
    );
  }

  setupTiltControls();

  window.addEventListener("pointermove", (event) => {
    setPointerPosition(event.clientX, event.clientY);
    pointerActive = true;
  });

  // Keyboard focus on a label highlights its orb too.
  labels.forEach((el, name) => {
    const index = portals.findIndex((p) => p.def.name === name);
    el.addEventListener("focus", () => (focusedIndex = index));
    el.addEventListener("blur", () => (focusedIndex = -1));
    el.addEventListener("click", (event) => {
      if (entering) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      beginEnter(index);
    });
    el.addEventListener("pointerenter", () => (focusedIndex = index));
    el.addEventListener("pointerleave", () => (focusedIndex = -1));
  });

  renderer.domElement.addEventListener("click", (event) => {
    if (entering) return;
    // A touch tap often has no pointermove beforehand, so hoveredIndex can be
    // stale or unset. Raycast the activation coordinates directly to make the
    // visible orb itself a reliable touch target.
    const tappedIndex = portalAt(event.clientX, event.clientY);
    if (tappedIndex >= 0) beginEnter(tappedIndex);
  });

  // Entry sequence state.
  let entering: Portal | null = null;
  let enterStart = 0;
  const enterFrom = new THREE.Vector3();
  const enterTo = new THREE.Vector3();

  function beginEnter(index: number) {
    const portal = portals[index];
    entering = portal;
    enterStart = clock.elapsedTime;
    veil.style.backgroundColor = portal.def.color;
    document.getElementById("nexus-labels")?.setAttribute("data-entering", "");
    document.body.setAttribute("data-entering", "");

    if (reducedMotion) {
      veil.style.transition = "opacity 0.25s ease";
      veil.style.opacity = "1";
      window.setTimeout(() => navigate(portal), 280);
      return;
    }
    enterFrom.copy(camera.position);
    // Fly straight into the glass: end just past the orb's center, along the
    // current view line, so the camera crosses the shell mid-whiteout.
    const dir = camera.position.clone().sub(portal.group.position).normalize();
    enterTo.copy(portal.group.position).addScaledVector(dir, 0.2);
    window.setTimeout(() => navigate(portal), ENTER_DURATION * 1000 + 60);
  }

  function navigate(portal: Portal) {
    window.location.href = `/?v=${portal.def.name}`;
  }

  const clock = new THREE.Clock();

  function frame() {
    requestAnimationFrame(frame);
    // getDelta() also advances elapsedTime; calling getElapsedTime() first
    // would zero the delta.
    const dt = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.elapsedTime;
    const motion = reducedMotion ? 0 : 1;

    // Parallax drift toward a fine pointer or, on mobile, the phone's tilt.
    if (!entering) {
      if (tiltActive && motion) {
        // A slower low-pass filter keeps noisy phone sensors calm and makes
        // the response noticeable without pulling focus from the orbs.
        tilt.lerp(tiltTarget, 1 - Math.pow(0.002, dt));
        camera.position.set(
          tilt.x * TILT_CAMERA_X,
          0.4 + tilt.y * TILT_CAMERA_Y,
          baseCameraZ
        );
      } else {
        if (pointerActive && hasFinePointer && motion)
          pointer.lerp(pointerTarget, 1 - Math.pow(0.001, dt));
        camera.position.set(pointer.x * 1.1, 0.4 + pointer.y * 0.5, baseCameraZ);
      }
      camera.lookAt(LOOK_TARGET);
    } else if (!reducedMotion) {
      const t = Math.min((elapsed - enterStart) / ENTER_DURATION, 1);
      const eased = easeInOutCubic(t);
      camera.position.lerpVectors(enterFrom, enterTo, eased);
      camera.lookAt(entering.group.position);
      // The rim band widens until the whole shell glows white, and the little
      // world expands to meet the camera.
      entering.uniforms.uEnter.value = eased;
      entering.uniforms.uRimPower.value = THREE.MathUtils.lerp(2.6, 1.0, eased);
      entering.interior.object.scale.setScalar(1 + eased * 1.6);
      if (t > 0.55) {
        veil.style.opacity = String((t - 0.55) / 0.45);
      }
    }

    stars.rotation.y += dt * 0.006 * motion;

    portals.forEach((portal, index) => {
      const isHovered = index === hoveredIndex || index === focusedIndex;
      if (!reducedMotion) {
        // Intro: orbs bloom in, staggered; then a gentle bob.
        const introT = THREE.MathUtils.clamp((elapsed - portal.introDelay) / 0.9, 0, 1);
        const intro = easeOutCubic(introT);
        portal.hover += ((isHovered ? 1 : 0) - portal.hover) * Math.min(dt * 8, 1);
        portal.uniforms.uHover.value = portal.hover;
        portal.group.scale.setScalar(intro * portal.layoutScale * (1 + portal.hover * 0.06));
        portal.group.position.y =
          portal.home.y + Math.sin(elapsed * 0.8 + portal.bobPhase) * 0.07;
      } else {
        portal.uniforms.uHover.value = isHovered ? 1 : 0;
        portal.group.scale.setScalar(portal.layoutScale);
      }

      // Each interior runs on its own clock; hovering dilates time so the
      // miniature world visibly speeds up.
      portal.interiorTime += dt * motion * (1 + portal.hover * 1.5);
      portal.interior.update(portal.interiorTime);

      // Keep the HTML label pinned under the orb.
      const label = labels.get(portal.def.name);
      if (label) {
        const anchor = portal.group.position.clone();
        anchor.y -= portal.labelOffset;
        anchor.project(camera);
        const x = (anchor.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-anchor.y * 0.5 + 0.5) * window.innerHeight;
        label.style.transform = `translate(-50%, 0) translate(${x}px, ${y}px)`;
      }
    });

    // Hover raycast (skip while entering).
    if (!entering && pointerActive) {
      raycaster.setFromCamera(pointerTarget, camera);
      const hits = raycaster.intersectObjects(portals.map((p) => p.shell));
      const nextHovered = hits.length ? (hits[0].object.userData.portalIndex as number) : -1;
      if (nextHovered !== hoveredIndex) {
        hoveredIndex = nextHovered;
        renderer.domElement.style.cursor = hoveredIndex >= 0 ? "pointer" : "default";
      }
    }

    renderer.render(scene, camera);
  }

  frame();
}

init();
