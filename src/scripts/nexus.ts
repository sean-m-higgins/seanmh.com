// The Nexus — 3D entry world for the multiverse portfolio.
// Each version floats as a glass orb holding a miniature world. Clicking one
// flies the camera into the glass and hands off to that version's canonical
// route. The version list lives in ../content/versions.ts.
import * as THREE from "three";
import { VERSIONS, type VersionDef } from "../content/versions.ts";

const ORB_RADIUS = 1.2;
const MIN_ORBIT_CHORD = 3.1; // center-to-center room for neighboring glass orbs
const MIN_ORB_SCALE = 0.58;
const LOOK_TARGET = new THREE.Vector3(0, 0.3, 0);
const BASE_CAMERA_Y = 3; // elevation turns the receding ring into a readable ellipse
const ENTER_DURATION = 1.05; // seconds
const TILT_RANGE = 14; // degrees from the visitor's starting position
const TILT_DEAD_ZONE = 0.75; // filters small sensor noise while held still
const TILT_CAMERA_X = 0.55;
const TILT_CAMERA_Y = 0.28;
const DRAG_STEP_PORTION = 0.28; // drag this fraction of the viewport per universe
const DRAG_FRICTION = 4.8;
const SNAP_STRENGTH = 10;

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

// f-blueprint: a tiny drafting plane with a connected system graph and a
// bright request pulse travelling through it. Unlike the other miniature
// worlds it stays nearly face-on, reading as a technical drawing in glass.
function buildBlueprint(color: THREE.Color): Interior {
  const group = new THREE.Group();
  const plane = new THREE.Group();
  const lineMaterial = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.42,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const gridPoints: THREE.Vector3[] = [];
  for (let i = -3; i <= 3; i++) {
    const p = i * 0.18;
    gridPoints.push(new THREE.Vector3(-0.62, p, 0), new THREE.Vector3(0.62, p, 0));
    gridPoints.push(new THREE.Vector3(p, -0.62, 0), new THREE.Vector3(p, 0.62, 0));
  }
  plane.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(gridPoints), lineMaterial));

  const pathPoints = [
    new THREE.Vector3(-0.53, 0.12, 0.025),
    new THREE.Vector3(-0.24, 0.12, 0.025),
    new THREE.Vector3(0.02, 0.12, 0.025),
    new THREE.Vector3(0.27, 0.36, 0.025),
    new THREE.Vector3(0.52, 0.36, 0.025),
  ];
  plane.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pathPoints), lineMaterial));

  const nodes = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.12, 0.08, 0.035),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    7
  );
  const positions = [
    pathPoints[0], pathPoints[1], pathPoints[2], pathPoints[3], pathPoints[4],
    new THREE.Vector3(0.28, -0.28, 0.025),
    new THREE.Vector3(0.52, -0.28, 0.025),
  ];
  const dummy = new THREE.Object3D();
  positions.forEach((position, index) => {
    dummy.position.copy(position);
    dummy.updateMatrix();
    nodes.setMatrixAt(index, dummy.matrix);
  });
  plane.add(nodes);

  const pulse = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 10, 10),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  plane.add(pulse);
  plane.rotation.set(-0.16, -0.38, -0.04);
  group.add(plane);

  return {
    object: group,
    update(time_) {
      const progress = THREE.MathUtils.euclideanModulo(time_ * 0.38, pathPoints.length - 1);
      const segment = Math.floor(progress);
      pulse.position.lerpVectors(pathPoints[segment], pathPoints[segment + 1], progress - segment);
      const pulseScale = 0.8 + Math.sin(time_ * 8) * 0.18;
      pulse.scale.setScalar(pulseScale);
      group.rotation.y = Math.sin(time_ * 0.22) * 0.22;
    },
  };
}

const INTERIOR_BUILDERS: Record<VersionDef["interior"], (color: THREE.Color) => Interior> = {
  aurora: buildAurora,
  cards: buildCards,
  rain: buildRain,
  halfpipe: buildHalfpipe,
  ring: buildRing,
  blueprint: buildBlueprint,
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
  home: THREE.Vector3; // current un-bobbed position on the orbital ring
  layoutScale: number;
  frontness: number; // 0 at the back of the orbit, 1 at the active position
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
  document.getElementById("nexus-orbit-controls")?.setAttribute("hidden", "");
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

// ---------------------------------------------------------------------------
// Deep-space workshop — a handful of small, quiet artifacts beyond the orbs.
// They are real low-poly scene objects rather than a texture, so pointer/tilt
// parallax gives them depth. Their carriers own the slow travel while each
// model owns one restrained mechanical gesture.
interface AmbientModel {
  object: THREE.Group;
  update(time: number): void;
}

interface AmbientArtifact extends AmbientModel {
  carrier: THREE.Group;
  base: THREE.Vector3;
  screen: THREE.Vector2;
  depth: number;
  screenScale: number;
  layoutScale: number;
  phase: number;
  drift: THREE.Vector2;
  spin: THREE.Vector3;
}

interface AmbientField {
  object: THREE.Group;
  layout(camera: THREE.PerspectiveCamera, cameraZ: number): void;
  update(time: number, motion: number): void;
}

function ambientMaterial(
  color: THREE.ColorRepresentation,
  opacity: number,
  wireframe = false
): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    wireframe,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}

function buildTelescope(): AmbientModel {
  const object = new THREE.Group();
  const hull = ambientMaterial(0x9ba7ca, 0.34);
  const frame = ambientMaterial(0xb9c5ea, 0.28, true);
  const glass = ambientMaterial(0x7da5db, 0.48);

  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.82, 10), hull);
  tube.rotation.x = Math.PI / 2;
  object.add(tube);

  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.16, 18), glass);
  lens.position.z = 0.42;
  object.add(lens);

  const lensRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.025, 6, 18), frame);
  lensRing.position.z = 0.425;
  object.add(lensRing);

  const panels = new THREE.Group();
  for (const side of [-1, 1]) {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.34, 4, 2), frame);
    panel.position.x = side * 0.49;
    panels.add(panel);
  }
  object.add(panels);

  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 6), hull);
  antenna.position.set(0, 0.34, -0.2);
  object.add(antenna);

  const dish = new THREE.Mesh(new THREE.CircleGeometry(0.17, 14), frame);
  dish.position.set(0, 0.54, -0.2);
  dish.rotation.x = -0.45;
  object.add(dish);

  return {
    object,
    update(time) {
      panels.rotation.y = Math.sin(time * 0.16) * 0.28;
      dish.rotation.z = Math.sin(time * 0.32) * 0.42;
    },
  };
}

function buildCourier(): AmbientModel {
  const object = new THREE.Group();
  const hull = ambientMaterial(0xa6aed0, 0.34);
  const wingMaterial = ambientMaterial(0x6e7ca8, 0.3);
  const windowMaterial = ambientMaterial(0x87d9ff, 0.58);
  const engineMaterial = ambientMaterial(0xffb767, 0.55);

  const body = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.78, 4), hull);
  body.rotation.z = -Math.PI / 2;
  object.add(body);

  const wingGeometry = new THREE.BufferGeometry();
  wingGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute([
      -0.22, 0.02, 0,
      0.18, 0.02, 0,
      -0.32, 0.42, 0,
      -0.22, -0.02, 0,
      -0.32, -0.42, 0,
      0.18, -0.02, 0,
    ], 3)
  );
  const wings = new THREE.Mesh(wingGeometry, wingMaterial);
  object.add(wings);

  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.105, 10, 8), windowMaterial);
  canopy.scale.set(1.15, 0.7, 0.45);
  canopy.position.set(0.06, 0, 0.09);
  object.add(canopy);

  const engine = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), engineMaterial);
  engine.position.x = -0.42;
  object.add(engine);

  const trail = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.46, 0, 0),
      new THREE.Vector3(-1.05, 0, 0),
    ]),
    new THREE.LineBasicMaterial({
      color: 0xffb767,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
    })
  );
  object.add(trail);

  return {
    object,
    update(time) {
      const thrust = 0.82 + Math.sin(time * 6.5) * 0.18;
      engine.scale.setScalar(thrust);
      engineMaterial.opacity = 0.42 + thrust * 0.16;
      object.rotation.z = Math.sin(time * 0.48) * 0.12;
    },
  };
}

function buildVisitor(): AmbientModel {
  const object = new THREE.Group();
  const shell = ambientMaterial(0x9ca9c9, 0.3);
  const ringMaterial = ambientMaterial(0x9f8cff, 0.42, true);
  const glass = ambientMaterial(0x7ee6c2, 0.18);
  const eyeMaterial = ambientMaterial(0xc4ffe9, 0.72);
  const beamMaterial = ambientMaterial(0x7ee6c2, 0.055);

  const saucer = new THREE.Mesh(new THREE.SphereGeometry(0.5, 18, 9), shell);
  saucer.scale.y = 0.24;
  object.add(saucer);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.026, 6, 22), ringMaterial);
  rim.rotation.x = Math.PI / 2;
  object.add(rim);

  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.23, 14, 9), glass);
  dome.scale.y = 0.7;
  dome.position.y = 0.12;
  object.add(dome);

  for (const x of [-0.055, 0.055]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), eyeMaterial);
    eye.position.set(x, 0.16, 0.205);
    object.add(eye);
  }

  const beam = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.9, 16, 1, true), beamMaterial);
  beam.position.y = -0.52;
  beam.rotation.z = Math.PI;
  object.add(beam);

  return {
    object,
    update(time) {
      object.rotation.y = time * 0.14;
      beamMaterial.opacity = 0.035 + (0.5 + Math.sin(time * 1.6) * 0.5) * 0.04;
      beam.scale.x = beam.scale.z = 0.88 + Math.sin(time * 0.8) * 0.12;
    },
  };
}

function buildSignalBuoy(): AmbientModel {
  const object = new THREE.Group();
  const frame = ambientMaterial(0x8e9abd, 0.3, true);
  const coreMaterial = ambientMaterial(0x7984a8, 0.34);
  const signalMaterial = ambientMaterial(0xff8e9d, 0.62);

  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), coreMaterial);
  object.add(core);

  const rings: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.38 + i * 0.08, 0.008, 4, 28), frame);
    ring.rotation.set(i * 0.7, i * 0.85, i * 0.45);
    rings.push(ring);
    object.add(ring);
  }

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.52, 6), coreMaterial);
  mast.position.y = 0.35;
  object.add(mast);

  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), signalMaterial);
  beacon.position.y = 0.62;
  object.add(beacon);

  return {
    object,
    update(time) {
      rings.forEach((ring, index) => {
        ring.rotation.z = time * (0.08 + index * 0.025) * (index % 2 ? -1 : 1);
      });
      const ping = 0.72 + Math.pow(0.5 + Math.sin(time * 2.2) * 0.5, 5) * 0.55;
      beacon.scale.setScalar(ping);
      signalMaterial.opacity = 0.38 + ping * 0.18;
    },
  };
}

function buildAmbientField(): AmbientField {
  const object = new THREE.Group();
  const definitions = [
    { build: buildTelescope, screen: [-0.76, 0.48], depth: -7, scale: 0.048, phase: 0.3, drift: [0.28, 0.18], spin: [0.018, 0.028, -0.012] },
    { build: buildCourier, screen: [0.73, 0.52], depth: -11, scale: 0.044, phase: 2.2, drift: [0.42, 0.12], spin: [0.012, -0.018, 0] },
    { build: buildVisitor, screen: [0.79, -0.5], depth: -9, scale: 0.046, phase: 4.1, drift: [0.24, 0.2], spin: [0.008, 0, 0.01] },
    { build: buildSignalBuoy, screen: [-0.79, -0.52], depth: -13, scale: 0.042, phase: 5.4, drift: [0.2, 0.28], spin: [0.025, 0.035, -0.018] },
  ] as const;

  const artifacts: AmbientArtifact[] = definitions.map((definition) => {
    const model = definition.build();
    const carrier = new THREE.Group();
    carrier.add(model.object);
    carrier.traverse((child) => (child.renderOrder = 0));
    object.add(carrier);
    return {
      ...model,
      carrier,
      base: new THREE.Vector3(),
      screen: new THREE.Vector2(...definition.screen),
      depth: definition.depth,
      screenScale: definition.scale,
      layoutScale: 1,
      phase: definition.phase,
      drift: new THREE.Vector2(...definition.drift),
      spin: new THREE.Vector3(...definition.spin),
    };
  });

  return {
    object,
    layout(camera, cameraZ) {
      const halfVerticalTan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      artifacts.forEach((artifact) => {
        const distance = cameraZ - artifact.depth;
        const halfHeight = halfVerticalTan * distance;
        const halfWidth = halfHeight * camera.aspect;
        artifact.base.set(
          artifact.screen.x * halfWidth,
          LOOK_TARGET.y + artifact.screen.y * halfHeight,
          artifact.depth
        );
        artifact.layoutScale = distance * artifact.screenScale;
        artifact.carrier.scale.setScalar(artifact.layoutScale);
      });
    },
    update(time, motion) {
      const t = time * motion;
      artifacts.forEach((artifact) => {
        artifact.carrier.position.set(
          artifact.base.x + Math.sin(t * 0.16 + artifact.phase) * artifact.drift.x,
          artifact.base.y + Math.cos(t * 0.13 + artifact.phase) * artifact.drift.y,
          artifact.base.z + Math.sin(t * 0.11 + artifact.phase) * 0.24
        );
        artifact.carrier.rotation.set(
          t * artifact.spin.x,
          t * artifact.spin.y,
          t * artifact.spin.z
        );
        artifact.update(t);
      });
    },
  };
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
    frontness: 1,
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

  const ambient = buildAmbientField();
  scene.add(ambient.object);

  const orbitTrack = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: 96 }, (_, index) => {
        const angle = (index / 96) * Math.PI * 2;
        return new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
      })
    ),
    new THREE.LineBasicMaterial({
      color: 0x65719a,
      transparent: true,
      opacity: 0.13,
      depthWrite: false,
    })
  );
  orbitTrack.renderOrder = 0;
  scene.add(orbitTrack);

  const portals = VERSIONS.map(buildOrb);
  portals.forEach((portal) => {
    portal.group.scale.setScalar(reducedMotion ? 1 : 0.001);
    scene.add(portal.group);
  });

  const labels = new Map<string, HTMLAnchorElement>();
  document
    .querySelectorAll<HTMLAnchorElement>("#nexus-labels a[data-version]")
    .forEach((el) => labels.set(el.dataset.version!, el));

  const labelsContainer = document.getElementById("nexus-labels");
  const previousButton = document.getElementById("nexus-orbit-prev");
  const nextButton = document.getElementById("nexus-orbit-next");
  const orbitStatus = document.getElementById("nexus-orbit-status");
  const veil = document.getElementById("nexus-veil")!;

  const portalCount = Math.max(portals.length, 1);
  const orbitStep = (Math.PI * 2) / portalCount;
  let orbitRadius = 3.1;
  let orbitOrbScale = 1;
  let orbitRotation = 0;
  let snapTarget: number | null = 0;
  let angularVelocity = 0;
  let activeIndex = 0;
  let orbitBusy = false;
  let dragging = false;

  function wrapIndex(index: number): number {
    return THREE.MathUtils.euclideanModulo(index, portals.length);
  }

  function normalizeOrbitAngle(angle: number): number {
    return Math.atan2(Math.sin(angle), Math.cos(angle));
  }

  function frontIndex(): number {
    return wrapIndex(Math.round(-orbitRotation / orbitStep));
  }

  function rotationForIndex(index: number): number {
    const canonical = -wrapIndex(index) * orbitStep;
    return orbitRotation + normalizeOrbitAngle(canonical - orbitRotation);
  }

  function setActiveIndex(index: number) {
    const nextIndex = wrapIndex(index);
    if (nextIndex === activeIndex && labels.get(portals[nextIndex].def.name)?.dataset.active === "true") return;
    const moveLabelFocus = document.activeElement instanceof HTMLAnchorElement
      && document.activeElement.classList.contains("portal-label");
    activeIndex = nextIndex;

    portals.forEach((portal, portalIndex) => {
      const label = labels.get(portal.def.name);
      if (!label) return;
      const active = portalIndex === activeIndex;
      label.tabIndex = active ? 0 : -1;
      if (active) {
        label.dataset.active = "true";
        label.removeAttribute("aria-hidden");
      } else {
        label.removeAttribute("data-active");
        label.setAttribute("aria-hidden", "true");
      }
    });

    const active = portals[activeIndex];
    if (orbitStatus && isOrbitSettled()) {
      orbitStatus.textContent = `${active.def.label}, universe ${activeIndex + 1} of ${portals.length}`;
    }
    previousButton?.setAttribute(
      "aria-label",
      `Previous universe: ${portals[wrapIndex(activeIndex - 1)].def.label}`
    );
    nextButton?.setAttribute(
      "aria-label",
      `Next universe: ${portals[wrapIndex(activeIndex + 1)].def.label}`
    );
    if (moveLabelFocus) {
      labels.get(active.def.name)?.focus({ preventScroll: true });
    }
  }

  function isOrbitSettled(): boolean {
    return (
      !dragging &&
      Math.abs(angularVelocity) < 0.02 &&
      snapTarget !== null &&
      Math.abs(snapTarget - orbitRotation) < 0.025
    );
  }

  function updateOrbitBusyState() {
    const busy = !isOrbitSettled();
    if (busy === orbitBusy) return;
    orbitBusy = busy;
    labelsContainer?.toggleAttribute("data-spinning", busy);
    if (!busy && orbitStatus) {
      const active = portals[activeIndex];
      orbitStatus.textContent = `${active.def.label}, universe ${activeIndex + 1} of ${portals.length}`;
    }
  }

  function snapToIndex(index: number) {
    angularVelocity = 0;
    snapTarget = rotationForIndex(index);
    if (reducedMotion) orbitRotation = snapTarget;
  }

  function snapToNearest() {
    snapToIndex(frontIndex());
  }

  function stepOrbit(direction: -1 | 1) {
    if (entering) return;
    const queuedIndex = snapTarget === null
      ? frontIndex()
      : wrapIndex(Math.round(-snapTarget / orbitStep));
    snapToIndex(queuedIndex + direction);
    updateOrbitBusyState();
  }

  function positionPortals(elapsed: number, motion: number) {
    portals.forEach((portal, index) => {
      const angle = index * orbitStep + orbitRotation;
      portal.frontness = (Math.cos(angle) + 1) / 2;
      portal.home.set(
        Math.sin(angle) * orbitRadius,
        LOOK_TARGET.y,
        orbitRadius * (Math.cos(angle) - 1)
      );
      portal.group.position.copy(portal.home);
      portal.group.position.y += Math.sin(elapsed * 0.8 + portal.bobPhase) * 0.07 * motion;
    });
  }

  // A real horizontal ring replaces the old line/grid. Its circumference grows
  // with the version count, while the orb scale steps down gently after six.
  // Centering the ring behind z=0 keeps the active orb fixed at the front.
  let baseCameraZ = 9;
  function layout() {
    const aspect = window.innerWidth / window.innerHeight;
    camera.aspect = aspect;
    orbitOrbScale = THREE.MathUtils.clamp(
      1 - Math.max(0, portals.length - 6) * 0.055,
      MIN_ORB_SCALE,
      1
    );
    const chord = MIN_ORBIT_CHORD * (0.75 + orbitOrbScale * 0.25);
    orbitRadius = portals.length > 1
      ? chord / (2 * Math.sin(Math.PI / portals.length))
      : 0;

    portals.forEach((portal) => {
      portal.layoutScale = orbitOrbScale;
      portal.labelOffset = ORB_RADIUS * orbitOrbScale + (aspect < 0.9 ? 0.42 : 0.55);
    });

    orbitTrack.visible = portals.length > 1;
    orbitTrack.position.set(0, LOOK_TARGET.y, -orbitRadius);
    orbitTrack.scale.setScalar(Math.max(orbitRadius, 0.001));

    baseCameraZ = aspect < 0.65 ? 9.6 : aspect < 0.9 ? 9.25 : 9;
    camera.position.set(0, BASE_CAMERA_Y, baseCameraZ);
    camera.lookAt(LOOK_TARGET);
    positionPortals(0, 0);
    ambient.layout(camera, baseCameraZ);
    camera.updateProjectionMatrix();
  }

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    POINT_SCALE.value = (window.innerHeight * renderer.getPixelRatio()) / 2;
    layout();
  }
  resize();
  window.addEventListener("resize", resize);
  setActiveIndex(0);

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
  let dragPointerId: number | null = null;
  let dragStartX = 0;
  let dragLastX = 0;
  let dragLastTime = 0;
  let dragDistance = 0;
  let suppressClick = false;
  const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function setPointerPosition(clientX: number, clientY: number) {
    pointerTarget.set(
      (clientX / window.innerWidth) * 2 - 1,
      -(clientY / window.innerHeight) * 2 + 1
    );
  }

  function activePortalAt(clientX: number, clientY: number): number {
    if (!isOrbitSettled()) return -1;
    setPointerPosition(clientX, clientY);
    raycaster.setFromCamera(pointerTarget, camera);
    const activeShell = portals[activeIndex]?.shell;
    if (!activeShell) return -1;
    const hits = raycaster.intersectObject(activeShell);
    return hits.length ? activeIndex : -1;
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
      if (hint) hint.textContent = "drag to spin · arrows to step";
      return;
    }

    type OrientationEventWithPermission = typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<"granted" | "denied">;
    };
    const OrientationEvent = window.DeviceOrientationEvent as OrientationEventWithPermission;

    const enableTilt = () => {
      window.addEventListener("deviceorientation", onDeviceOrientation, { passive: true });
      screen.orientation?.addEventListener("change", resetTiltOrigin);
      if (hint) hint.textContent = "drag to spin · tilt to look";
      if (permissionButton instanceof HTMLButtonElement) permissionButton.hidden = true;
    };

    if (typeof OrientationEvent.requestPermission !== "function") {
      enableTilt();
      return;
    }

    if (!(permissionButton instanceof HTMLButtonElement)) return;
    if (hint) hint.textContent = "drag to spin · enable tilt";
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
            if (hint) hint.textContent = "drag to spin · arrows to step";
          }
        } catch {
          permissionButton.hidden = true;
          if (hint) hint.textContent = "drag to spin · arrows to step";
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

  function dragSensitivity(): number {
    return orbitStep / Math.max(window.innerWidth * DRAG_STEP_PORTION, 140);
  }

  renderer.domElement.addEventListener("pointerdown", (event) => {
    if (entering || event.button !== 0) return;
    dragging = true;
    dragPointerId = event.pointerId;
    dragStartX = event.clientX;
    dragLastX = event.clientX;
    dragLastTime = event.timeStamp;
    dragDistance = 0;
    angularVelocity = 0;
    snapTarget = null;
    suppressClick = false;
    renderer.domElement.setPointerCapture(event.pointerId);
    document.body.setAttribute("data-dragging", "");
    updateOrbitBusyState();
  });

  renderer.domElement.addEventListener("pointermove", (event) => {
    if (!dragging || event.pointerId !== dragPointerId) return;
    event.preventDefault();
    const deltaX = event.clientX - dragLastX;
    const deltaSeconds = Math.max((event.timeStamp - dragLastTime) / 1000, 0.001);
    const deltaRotation = deltaX * dragSensitivity();
    orbitRotation += deltaRotation;
    dragDistance += Math.abs(deltaX);
    angularVelocity = THREE.MathUtils.lerp(
      angularVelocity,
      deltaRotation / deltaSeconds,
      0.52
    );
    dragLastX = event.clientX;
    dragLastTime = event.timeStamp;
    setActiveIndex(frontIndex());
  });

  function finishDrag(event: PointerEvent, cancelled = false) {
    if (!dragging || event.pointerId !== dragPointerId) return;
    const moved = dragDistance > 6 || Math.abs(event.clientX - dragStartX) > 6;
    dragging = false;
    dragPointerId = null;
    document.body.removeAttribute("data-dragging");
    if (renderer.domElement.hasPointerCapture(event.pointerId)) {
      renderer.domElement.releasePointerCapture(event.pointerId);
    }

    suppressClick = moved || cancelled;
    angularVelocity = THREE.MathUtils.clamp(angularVelocity, -4.2, 4.2);
    if (reducedMotion || cancelled || !moved || Math.abs(angularVelocity) < 0.08) {
      snapToNearest();
    }
    updateOrbitBusyState();
  }

  renderer.domElement.addEventListener("pointerup", (event) => finishDrag(event));
  renderer.domElement.addEventListener("pointercancel", (event) => finishDrag(event, true));

  renderer.domElement.addEventListener(
    "wheel",
    (event) => {
      if (entering) return;
      event.preventDefault();
      const rawDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;
      const modeScale = event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? window.innerHeight
          : 1;
      const pixelDelta = THREE.MathUtils.clamp(rawDelta * modeScale, -140, 140);
      snapTarget = null;
      angularVelocity = reducedMotion
        ? 0
        : THREE.MathUtils.clamp(angularVelocity - pixelDelta * 0.026, -4.2, 4.2);
      if (reducedMotion) {
        stepOrbit(pixelDelta >= 0 ? 1 : -1);
      }
      updateOrbitBusyState();
    },
    { passive: false }
  );

  previousButton?.addEventListener("click", () => stepOrbit(-1));
  nextButton?.addEventListener("click", () => stepOrbit(1));

  window.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      stepOrbit(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      stepOrbit(1);
    }
  });

  // Only the label belonging to the front orb is focusable and actionable.
  labels.forEach((el, name) => {
    const index = portals.findIndex((p) => p.def.name === name);
    el.addEventListener("focus", () => (focusedIndex = index));
    el.addEventListener("blur", () => (focusedIndex = -1));
    el.addEventListener("click", (event) => {
      if (entering || index !== activeIndex || !isOrbitSettled()) {
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
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    // A tap enters only the orb snapped into the front slot. Every other shell
    // is scenery until the visitor rotates it forward.
    const tappedIndex = activePortalAt(event.clientX, event.clientY);
    if (tappedIndex >= 0) beginEnter(tappedIndex);
  });

  // Entry sequence state.
  let entering: Portal | null = null;
  let enterStart = 0;
  const enterFrom = new THREE.Vector3();
  const enterTo = new THREE.Vector3();

  function beginEnter(index: number) {
    if (index !== activeIndex || !isOrbitSettled()) return;
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
    window.location.href = portal.def.href;
  }

  const clock = new THREE.Clock();

  function frame() {
    requestAnimationFrame(frame);
    // getDelta() also advances elapsedTime; calling getElapsedTime() first
    // would zero the delta.
    const dt = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.elapsedTime;
    const motion = reducedMotion ? 0 : 1;

    // Direct manipulation feeds angular velocity into the ring. Once released,
    // friction carries it briefly before a spring settles the nearest orb into
    // the only actionable slot at angle zero.
    if (!entering && !dragging) {
      if (snapTarget === null) {
        if (!reducedMotion) {
          orbitRotation += angularVelocity * dt;
          angularVelocity *= Math.exp(-DRAG_FRICTION * dt);
        }
        if (reducedMotion || Math.abs(angularVelocity) < 0.08) snapToNearest();
      } else if (reducedMotion) {
        orbitRotation = snapTarget;
        angularVelocity = 0;
      } else {
        const difference = snapTarget - orbitRotation;
        orbitRotation += difference * (1 - Math.exp(-SNAP_STRENGTH * dt));
        if (Math.abs(difference) < 0.0005) {
          orbitRotation = snapTarget;
          angularVelocity = 0;
        }
      }
    }

    setActiveIndex(frontIndex());
    updateOrbitBusyState();
    positionPortals(elapsed, motion);

    // Parallax drift toward a fine pointer or, on mobile, the phone's tilt.
    if (!entering) {
      if (tiltActive && motion) {
        // A slower low-pass filter keeps noisy phone sensors calm and makes
        // the response noticeable without pulling focus from the orbs.
        tilt.lerp(tiltTarget, 1 - Math.pow(0.002, dt));
        camera.position.set(
          tilt.x * TILT_CAMERA_X,
          BASE_CAMERA_Y + tilt.y * TILT_CAMERA_Y,
          baseCameraZ
        );
      } else {
        if (pointerActive && hasFinePointer && motion)
          pointer.lerp(pointerTarget, 1 - Math.pow(0.001, dt));
        camera.position.set(pointer.x * 1.1, BASE_CAMERA_Y + pointer.y * 0.5, baseCameraZ);
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
    ambient.update(elapsed, motion);

    portals.forEach((portal, index) => {
      const isHovered = index === hoveredIndex || index === focusedIndex;
      const depthScale = 0.68 + Math.pow(portal.frontness, 0.72) * 0.32;
      if (!reducedMotion) {
        // Intro: orbs bloom in, staggered; then a gentle bob.
        const introT = THREE.MathUtils.clamp((elapsed - portal.introDelay) / 0.9, 0, 1);
        const intro = easeOutCubic(introT);
        portal.hover += ((isHovered ? 1 : 0) - portal.hover) * Math.min(dt * 8, 1);
        portal.uniforms.uHover.value = portal.hover;
        portal.group.scale.setScalar(
          intro * portal.layoutScale * depthScale * (1 + portal.hover * 0.06)
        );
      } else {
        portal.uniforms.uHover.value = isHovered ? 1 : 0;
        portal.group.scale.setScalar(portal.layoutScale * depthScale);
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

    // Only the settled front shell participates in hover or entry raycasts.
    if (!entering && !dragging && pointerActive && isOrbitSettled()) {
      raycaster.setFromCamera(pointerTarget, camera);
      const hits = raycaster.intersectObject(portals[activeIndex].shell);
      const nextHovered = hits.length ? activeIndex : -1;
      if (nextHovered !== hoveredIndex) {
        hoveredIndex = nextHovered;
        renderer.domElement.style.cursor = hoveredIndex >= 0 ? "pointer" : "grab";
      }
    } else if (hoveredIndex !== -1) {
      hoveredIndex = -1;
      renderer.domElement.style.cursor = "grab";
    }

    renderer.render(scene, camera);
  }

  frame();
}

init();
