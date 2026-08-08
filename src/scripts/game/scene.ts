// Renderer, camera, lights, and every mesh in the world. All geometry is
// generated in code — low-poly, flat-shaded, vertex-coloured. The look is a
// night superpipe under floodlights: cool desaturated snow, one saturated
// colour (the site accent indigo) on the coping, the board, and nothing else.

import * as THREE from "three";
import { FLAT_HALF, R, LIP_X, LIP_Y, surfaceAt, normalAt, tangentAt, surfaceYAtX } from "./pipe";
import { T } from "./tuning";
import type { RunState, Phase } from "./state";

const BG = 0x0b0d1a;
const ACCENT = 0x6366f1;
const SNOW = 0xdfe8f6;
const DECK_SNOW = 0xbcc9e2;

const PIPE_Z_NEAR = 40;
const PIPE_Z_FAR = -300; // ends beyond the fog, so the tunnel fades instead of pitting
const SCROLL_RANGE = 200; // decor wraps over this much z
const SCROLL_NEAR = 30;

export interface SceneCtx {
  update(st: RunState, dt: number, speedNorm: number): void;
  shake(mag: number): void;
  dispose(): void;
  debug: { scene: THREE.Scene; camera: THREE.PerspectiveCamera; renderer: THREE.WebGLRenderer };
}

interface ScrollLayer {
  mesh: THREE.InstancedMesh;
  x: Float32Array;
  y: Float32Array;
  z: Float32Array;
  sx: Float32Array;
  sy: Float32Array;
}

export function createScene(
  canvas: HTMLCanvasElement,
  rand: () => number,
  reducedMotion: boolean
): SceneCtx | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: "high-performance",
    });
  } catch {
    return null;
  }
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const maxDpr = coarse ? 1.5 : 2;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  // Fog is a touch lighter than the sky: the corridor fades into a horizon
  // haze (floodlight glow) instead of a dark pit where the walls converge
  scene.fog = new THREE.Fog(0x1c2340, 50, 250);

  const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 400);
  camera.position.set(0, 7.2, 12.5);

  // --- Lights: hemisphere + one directional, no shadow maps ---
  scene.add(new THREE.HemisphereLight(0x9fb0e8, 0x10121f, 0.85));
  const key = new THREE.DirectionalLight(0xdfe8ff, 1.25);
  key.position.set(6, 14, 8);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x6366f1, 0.35);
  rim.position.set(-8, 6, -10);
  scene.add(rim);

  // --- The pipe ---
  scene.add(buildPipeMesh(rand));

  // End cap: a snow wall across the far end so the corridor fades into fog
  // instead of opening onto bare sky
  {
    const cap = new THREE.Mesh(
      new THREE.PlaneGeometry(74, 13),
      new THREE.MeshLambertMaterial({ color: SNOW })
    );
    cap.position.set(0, 5.5, PIPE_Z_FAR + 0.5);
    scene.add(cap);
  }

  // Coping: the one saturated line in the world
  for (const side of [-1, 1]) {
    const len = PIPE_Z_NEAR - PIPE_Z_FAR;
    const coping = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, len, 8),
      new THREE.MeshBasicMaterial({ color: ACCENT })
    );
    coping.rotation.x = Math.PI / 2;
    coping.position.set(side * LIP_X, LIP_Y + 0.04, (PIPE_Z_NEAR + PIPE_Z_FAR) / 2);
    scene.add(coping);
    const glow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, len, 8),
      new THREE.MeshBasicMaterial({
        color: ACCENT,
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    glow.rotation.x = Math.PI / 2;
    glow.position.copy(coping.position);
    scene.add(glow);
  }

  // --- Mountains: static far silhouettes ---
  const mountains = new THREE.InstancedMesh(
    new THREE.ConeGeometry(1, 1, 5),
    new THREE.MeshLambertMaterial({ color: 0x141830, flatShading: true }),
    9
  );
  {
    const m = new THREE.Matrix4();
    for (let i = 0; i < 9; i++) {
      // Keep the corridor down the pipe clear — mountains flank it, and their
      // footprint (cone radius) must never reach back across the center
      const side = i % 2 === 0 ? -1 : 1;
      const h = 30 + rand() * 45;
      const rad = h * (0.45 + rand() * 0.2);
      const x = side * (55 + rad + rand() * 90);
      m.makeScale(rad, h, rad);
      m.setPosition(x, LIP_Y + h / 2, -110 - rand() * 50);
      mountains.setMatrixAt(i, m);
    }
    mountains.instanceMatrix.needsUpdate = true;
  }
  scene.add(mountains);

  // --- Scrolling decor: trees + floodlight posts on both decks ---
  const scrollLayers: ScrollLayer[] = [];

  const makeLayer = (
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    count: number,
    place: (i: number) => { x: number; y: number; z: number; sx: number; sy: number }
  ): ScrollLayer => {
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    const layer: ScrollLayer = {
      mesh,
      x: new Float32Array(count),
      y: new Float32Array(count),
      z: new Float32Array(count),
      sx: new Float32Array(count),
      sy: new Float32Array(count),
    };
    for (let i = 0; i < count; i++) {
      const p = place(i);
      layer.x[i] = p.x;
      layer.y[i] = p.y;
      layer.z[i] = p.z;
      layer.sx[i] = p.sx;
      layer.sy[i] = p.sy;
    }
    scene.add(mesh);
    scrollLayers.push(layer);
    return layer;
  };

  // Trees: dark blue-green cones dusted by night
  makeLayer(
    new THREE.ConeGeometry(1, 1, 6),
    new THREE.MeshLambertMaterial({ color: 0x16203a, flatShading: true }),
    64,
    () => {
      const side = rand() < 0.5 ? -1 : 1;
      return {
        x: side * (LIP_X + 5 + rand() * 22),
        y: LIP_Y,
        z: SCROLL_NEAR - rand() * SCROLL_RANGE,
        sx: 1.6 + rand() * 1.6,
        sy: 3.5 + rand() * 4,
      };
    }
  );

  // Floodlight poles along the deck edge
  makeLayer(
    new THREE.CylinderGeometry(0.09, 0.12, 1, 6),
    new THREE.MeshLambertMaterial({ color: 0x232842 }),
    10,
    (i) => ({
      x: (i % 2 === 0 ? -1 : 1) * (LIP_X + 2),
      y: LIP_Y,
      z: SCROLL_NEAR - ((i >> 1) + rand() * 0.3) * (SCROLL_RANGE / 5),
      sx: 1,
      sy: 7,
    })
  );
  // ...and their glowing heads
  makeLayer(
    new THREE.BoxGeometry(0.9, 0.3, 0.5),
    new THREE.MeshBasicMaterial({ color: 0xeaf1ff }),
    10,
    (i) => {
      // mirror the pole placement (rand() sequence differs; heads get their
      // own jitter which is fine at night distances)
      return {
        x: (i % 2 === 0 ? -1 : 1) * (LIP_X + 1.75),
        y: LIP_Y + 7,
        z: SCROLL_NEAR - ((i >> 1) + 0.15) * (SCROLL_RANGE / 5),
        sx: 1,
        sy: 1,
      };
    }
  );

  const writeLayer = (layer: ScrollLayer) => {
    const m = new THREE.Matrix4();
    for (let i = 0; i < layer.x.length; i++) {
      m.makeScale(layer.sx[i]!, layer.sy[i]!, layer.sx[i]!);
      // cones/poles sit on their base
      m.setPosition(layer.x[i]!, layer.y[i]! + layer.sy[i]! / 2, layer.z[i]!);
      layer.mesh.setMatrixAt(i, m);
    }
    layer.mesh.instanceMatrix.needsUpdate = true;
  };
  scrollLayers.forEach(writeLayer);

  // --- Stars ---
  {
    const n = 240;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = rand() * Math.PI * 2;
      const r2 = 150 + rand() * 120;
      const elev = 0.12 + rand() * 0.8;
      pos[i * 3] = Math.cos(a) * r2;
      pos[i * 3 + 1] = 20 + elev * 140;
      pos[i * 3 + 2] = -40 - Math.abs(Math.sin(a)) * r2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const stars = new THREE.Points(
      g,
      new THREE.PointsMaterial({ color: 0xaebbe8, size: 1.6, sizeAttenuation: false, fog: false })
    );
    scene.add(stars);
  }

  // --- Snowfall ---
  const SNOW_N = reducedMotion ? 0 : 520;
  const snowPos = new Float32Array(Math.max(SNOW_N, 1) * 3);
  const snowVel = new Float32Array(Math.max(SNOW_N, 1) * 2); // fall speed, sway phase
  for (let i = 0; i < SNOW_N; i++) {
    snowPos[i * 3] = (rand() - 0.5) * 70;
    snowPos[i * 3 + 1] = rand() * 26;
    snowPos[i * 3 + 2] = 15 - rand() * 70;
    snowVel[i * 2] = 1.6 + rand() * 2.6;
    snowVel[i * 2 + 1] = rand() * Math.PI * 2;
  }
  const snowGeo = new THREE.BufferGeometry();
  snowGeo.setAttribute("position", new THREE.BufferAttribute(snowPos, 3));
  const snow = new THREE.Points(
    snowGeo,
    new THREE.PointsMaterial({ color: 0xe8eeff, size: 0.09, transparent: true, opacity: 0.8 })
  );
  if (SNOW_N > 0) scene.add(snow);

  // --- Rider ---
  const rider = buildRider();
  scene.add(rider.root);

  // Fake contact shadow
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.7, 16),
    new THREE.MeshBasicMaterial({ color: 0x05060d, transparent: true, opacity: 0.35, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  scene.add(shadow);

  // --- Per-frame state ---
  const q = new THREE.Quaternion();
  const qTarget = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const fwd = new THREE.Vector3(1, 0, -0.35).normalize();
  const vx = new THREE.Vector3();
  const vy = new THREE.Vector3();
  const vz = new THREE.Vector3();
  const basis = new THREE.Matrix4();
  let lastTravelSign = 1;
  let prevPhase: Phase = "riding";
  const launchHeading = new THREE.Vector3(1, 0, -0.35).normalize();
  let tumble = 0;
  let shakeMag = 0;
  let crouch = 1;
  let elapsed = 0;

  const onResize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  };
  window.addEventListener("resize", onResize);

  function orient(st: RunState, dt: number): void {
    if (st.phase === "air") {
      if (prevPhase !== "air") {
        launchHeading.set(st.side, 0, -0.35).normalize();
      }
      up.set(0, 1, 0);
      fwd.copy(launchHeading).applyAxisAngle(up, (-st.netRot * Math.PI) / 180);
    } else {
      const n = normalAt(st.s);
      const t = tangentAt(st.s);
      if (Math.abs(st.v) > 0.4) lastTravelSign = Math.sign(st.v);
      up.set(n.nx, n.ny, 0);
      fwd.set(t.tx * lastTravelSign, t.ty * lastTravelSign, -0.35).normalize();
    }
    // Orthonormal basis: X = travel, Y = up, Z = X × Y
    vy.copy(up);
    vx.copy(fwd).addScaledVector(vy, -fwd.dot(vy)).normalize();
    vz.crossVectors(vx, vy);
    basis.makeBasis(vx, vy, vz);
    qTarget.setFromRotationMatrix(basis);
    if (st.phase === "down") {
      tumble += dt * 9;
      const qT = new THREE.Quaternion().setFromAxisAngle(vx, tumble);
      qTarget.premultiply(qT);
    } else {
      tumble = 0;
    }
    q.slerp(qTarget, 1 - Math.exp(-14 * dt));
    rider.root.quaternion.copy(q);
  }

  function update(st: RunState, dt: number, speedNorm: number): void {
    elapsed += dt;

    // Rider position
    let rx: number;
    let ry: number;
    if (st.phase === "air") {
      rx = st.x;
      ry = st.y;
    } else {
      const p = surfaceAt(st.s);
      const n = normalAt(st.s);
      const sink = st.phase === "down" ? -0.1 : 0.06;
      rx = p.x + n.nx * sink;
      ry = p.y + n.ny * sink;
    }
    rider.root.position.set(rx, ry, 0);
    orient(st, dt);

    // Crouch: pumping tucks the body; grabbing tucks harder
    const wantCrouch =
      st.phase === "riding" && st.grabbing ? 0.78 :
      st.phase === "air" && st.grabbing ? 0.7 : 1;
    crouch += (wantCrouch - crouch) * Math.min(12 * dt, 1);
    rider.body.scale.set(1, crouch, 1);

    // Contact shadow: on the surface below the rider, fading with height
    const groundY = st.phase === "air" ? surfaceYAtX(Math.min(Math.abs(st.x), LIP_X) * Math.sign(st.x || 1)) : ry;
    const h = Math.max(ry - groundY, 0);
    shadow.position.set(rx, (st.phase === "air" ? groundY : ry) + 0.02, 0);
    const shadowMat = shadow.material as THREE.MeshBasicMaterial;
    shadowMat.opacity = Math.max(0.05, 0.35 - h * 0.02);
    const shScale = 1 + h * 0.05;
    shadow.scale.set(shScale, shScale, shScale);

    // Scroll the world past the rider
    const zSpeed =
      st.phase === "over" ? 0 : T.ZDRIFT_BASE + speedNorm * T.SPEED_CAP * T.ZDRIFT_PER_SPEED;
    if (zSpeed > 0) {
      for (const layer of scrollLayers) {
        for (let i = 0; i < layer.z.length; i++) {
          layer.z[i]! += zSpeed * dt;
          if (layer.z[i]! > SCROLL_NEAR) layer.z[i]! -= SCROLL_RANGE;
        }
        writeLayer(layer);
      }
    }

    // Snow falls, sways, and drifts past
    if (SNOW_N > 0) {
      for (let i = 0; i < SNOW_N; i++) {
        snowPos[i * 3 + 1]! -= snowVel[i * 2]! * dt;
        snowPos[i * 3]! += Math.sin(elapsed * 1.3 + snowVel[i * 2 + 1]!) * 0.35 * dt;
        snowPos[i * 3 + 2]! += zSpeed * 0.5 * dt;
        if (snowPos[i * 3 + 1]! < -0.5) snowPos[i * 3 + 1]! += 26;
        if (snowPos[i * 3 + 2]! > 15) snowPos[i * 3 + 2]! -= 70;
      }
      snowGeo.getAttribute("position").needsUpdate = true;
    }

    // Camera: follows the rider's x, rises on big airs, FOV opens with speed
    const camX = rx * 0.4;
    const camY = 7.2 + Math.max(ry - 3, 0) * 0.45;
    camera.position.x += (camX - camera.position.x) * Math.min(6 * dt, 1);
    camera.position.y += (camY - camera.position.y) * Math.min(6 * dt, 1);
    if (!reducedMotion && shakeMag > 0.002) {
      camera.position.x += (Math.random() - 0.5) * shakeMag;
      camera.position.y += (Math.random() - 0.5) * shakeMag;
      shakeMag *= Math.exp(-6 * dt);
    }
    camera.lookAt(rx * 0.75, 1.8 + ry * 0.7, -1);
    const fovTarget = reducedMotion ? 58 : 58 + speedNorm * 15;
    camera.fov += (fovTarget - camera.fov) * Math.min(4 * dt, 1);
    camera.updateProjectionMatrix();

    prevPhase = st.phase;
    renderer.render(scene, camera);
  }

  return {
    update,
    shake(mag: number) {
      shakeMag = Math.max(shakeMag, mag);
    },
    dispose() {
      window.removeEventListener("resize", onResize);
      renderer.dispose();
    },
    debug: { scene, camera, renderer },
  };
}

// ---------------------------------------------------------------------------

/** Extruded cross-section: deck → vert → transition → flat, mirrored. */
function buildPipeMesh(rand: () => number): THREE.Mesh {
  const profile: { x: number; y: number; deck: boolean }[] = [];
  const DECK_W = 28;

  // Left deck (outer → coping)
  profile.push({ x: -(LIP_X + DECK_W), y: LIP_Y, deck: true });
  profile.push({ x: -(LIP_X + 6), y: LIP_Y, deck: true });
  profile.push({ x: -LIP_X, y: LIP_Y, deck: true });
  // Left vert
  profile.push({ x: -LIP_X, y: R, deck: false });
  // Left transition (θ: π/2 → 0)
  const SEGS = 14;
  for (let i = 1; i <= SEGS; i++) {
    const th = (Math.PI / 2) * (1 - i / SEGS);
    profile.push({ x: -(FLAT_HALF + R * Math.sin(th)), y: R * (1 - Math.cos(th)), deck: false });
  }
  // Flat
  profile.push({ x: 0, y: 0, deck: false });
  // Right side mirrors, skipping the duplicated flat start
  const leftLen = profile.length;
  for (let i = leftLen - 2; i >= 0; i--) {
    const p = profile[i]!;
    profile.push({ x: -p.x, y: p.y, deck: p.deck });
  }

  const rows = 24;
  const cols = profile.length;
  const positions = new Float32Array(rows * cols * 3);
  const colors = new Float32Array(rows * cols * 3);
  const base = new THREE.Color(SNOW);
  const deckCol = new THREE.Color(DECK_SNOW);
  const c = new THREE.Color();
  for (let r2 = 0; r2 < rows; r2++) {
    const z = PIPE_Z_FAR + ((PIPE_Z_NEAR - PIPE_Z_FAR) * r2) / (rows - 1);
    for (let i = 0; i < cols; i++) {
      const p = profile[i]!;
      const idx = (r2 * cols + i) * 3;
      positions[idx] = p.x;
      positions[idx + 1] = p.y;
      positions[idx + 2] = z;
      c.copy(p.deck ? deckCol : base).multiplyScalar(0.93 + rand() * 0.1);
      colors[idx] = c.r;
      colors[idx + 1] = c.g;
      colors[idx + 2] = c.b;
    }
  }
  const indices: number[] = [];
  for (let r2 = 0; r2 < rows - 1; r2++) {
    for (let i = 0; i < cols - 1; i++) {
      const a = r2 * cols + i;
      const b = a + 1;
      const d = a + cols;
      const e = d + 1;
      indices.push(a, d, b, b, d, e);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return new THREE.Mesh(
    geo,
    new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })
  );
}

interface Rider {
  root: THREE.Group;
  body: THREE.Group;
}

/** Low-poly snowboarder: a board and a stack of boxes. Local +X is travel. */
function buildRider(): Rider {
  const root = new THREE.Group();
  const mat = (color: number) => new THREE.MeshLambertMaterial({ color, flatShading: true });

  const board = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.07, 0.36), mat(ACCENT));
  board.position.y = 0.05;
  root.add(board);

  const body = new THREE.Group();
  root.add(body);

  const bootMat = mat(0x171a2b);
  for (const bx of [-0.32, 0.32]) {
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.24), bootMat);
    boot.position.set(bx, 0.16, 0);
    body.add(boot);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.42, 0.16), mat(0x232842));
    leg.position.set(bx * 0.9, 0.45, 0);
    body.add(leg);
  }

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.52, 0.3), mat(0xb9c2d8));
  torso.position.y = 0.92;
  torso.rotation.z = -0.12;
  body.add(torso);

  const armMat = mat(0xa7b1cb);
  for (const az of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.42, 0.13), armMat);
    arm.position.set(az * 0.08, 0.95, az * 0.28);
    arm.rotation.x = az * 0.5;
    body.add(arm);
  }

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.26), mat(0x171a2b));
  head.position.y = 1.32;
  body.add(head);
  const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.08, 0.24), mat(0x9fb4ff));
  goggles.position.set(0.05, 1.34, 0);
  body.add(goggles);

  return { root, body };
}
