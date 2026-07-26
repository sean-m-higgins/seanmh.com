// The Nexus — 3D entry world for the multiverse portfolio.
// Three portals float in space; each portal's surface previews the texture of
// the universe it leads to (waves = scroll, tiles = card, glyph rain = terminal).
// Clicking one flies the camera through and hands off to the Worker via /?v=.
import * as THREE from "three";

interface PortalDef {
  name: string;
  color: string;
  position: [number, number, number];
  rotationY: number;
  mode: number; // shader pattern: 0 waves, 1 tiles, 2 glyph rain
}

const PORTALS: PortalDef[] = [
  { name: "a-scroll", color: "#7c83ff", position: [-4.4, 0.3, -0.9], rotationY: 0.34, mode: 0 },
  { name: "b-card", color: "#ff9e64", position: [0, 0.38, 0], rotationY: 0, mode: 1 },
  { name: "c-terminal", color: "#3ddc84", position: [4.4, 0.3, -0.9], rotationY: -0.34, mode: 2 },
];

const PORTAL_RADIUS = 1.5;
const LOOK_TARGET = new THREE.Vector3(0, 0.3, 0);
const ENTER_DURATION = 1.05; // seconds
const TILT_RANGE = 14; // degrees from the visitor's starting position
const TILT_DEAD_ZONE = 0.75; // filters small sensor noise while held still
const TILT_CAMERA_X = 0.55;
const TILT_CAMERA_Y = 0.28;

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const PORTAL_FRAG = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uHover;
  uniform float uEnter;
  uniform vec3 uColor;
  uniform int uMode;

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    if (r > 1.0) discard;
    float t = uTime;
    float pattern = 0.0;

    if (uMode == 0) {
      // Flowing sine layers — the scroll universe.
      float w1 = sin(p.x * 6.0 + t * 1.2 + sin(p.y * 3.0 + t * 0.7));
      float w2 = sin((p.y + t * 0.15) * 10.0 + w1);
      pattern = 0.5 + 0.5 * w2;
    } else if (uMode == 1) {
      // Drifting grid of glowing tiles — the card universe.
      vec2 g = p * 4.0 + vec2(t * 0.12, -t * 0.09);
      vec2 cell = fract(g) - 0.5;
      float id = dot(floor(g), vec2(127.1, 311.7));
      float twinkle = 0.5 + 0.5 * sin(id + t * 1.5);
      float box = smoothstep(0.42, 0.34, max(abs(cell.x), abs(cell.y)));
      pattern = box * (0.35 + 0.65 * twinkle);
    } else {
      // Falling glyph columns over scanlines — the terminal universe.
      float col = floor((p.x + 1.0) * 8.0);
      float speed = 0.35 + 0.2 * fract(col * 0.618);
      float y = fract(p.y * 0.5 - t * speed + fract(col * 0.37));
      float rain = smoothstep(0.35, 0.0, y);
      float scan = 0.75 + 0.25 * sin(p.y * 90.0 + t * 3.0);
      pattern = rain * scan + 0.06;
    }

    float rim = smoothstep(1.0, 0.82, r);
    vec3 col3 = uColor * mix(0.22, 1.0, pattern);
    col3 *= 0.75 + 0.5 * uHover;
    col3 = mix(col3, vec3(1.0), uEnter * 0.85);
    float alpha = rim * (0.55 + 0.3 * uHover + 0.45 * uEnter);
    gl_FragColor = vec4(col3, alpha);
  }
`;

const PORTAL_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

interface Portal {
  def: PortalDef;
  group: THREE.Group;
  disc: THREE.Mesh;
  uniforms: {
    uTime: { value: number };
    uHover: { value: number };
    uEnter: { value: number };
    uColor: { value: THREE.Color };
    uMode: { value: number };
  };
  hover: number; // eased 0..1
  bobPhase: number;
  introDelay: number;
  home: THREE.Vector3; // layout position (portals arc on wide screens, stack on portrait)
  layoutScale: number;
  labelOffset: number; // world units below portal center for the HTML label
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

function buildPortal(def: PortalDef, index: number): Portal {
  const group = new THREE.Group();
  group.position.set(...def.position);
  group.rotation.y = def.rotationY;

  const color = new THREE.Color(def.color);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(PORTAL_RADIUS, 0.045, 16, 100),
    new THREE.MeshBasicMaterial({ color })
  );
  const glow = new THREE.Mesh(
    new THREE.TorusGeometry(PORTAL_RADIUS, 0.17, 16, 100),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );

  const uniforms = {
    uTime: { value: Math.random() * 40 },
    uHover: { value: 0 },
    uEnter: { value: 0 },
    uColor: { value: color },
    uMode: { value: def.mode },
  };
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(PORTAL_RADIUS - 0.04, 64),
    new THREE.ShaderMaterial({
      vertexShader: PORTAL_VERT,
      fragmentShader: PORTAL_FRAG,
      uniforms,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  disc.userData.portalIndex = index;

  group.add(ring, glow, disc);
  return {
    def,
    group,
    disc,
    uniforms,
    hover: 0,
    bobPhase: index * 2.1,
    introDelay: 0.15 + index * 0.16,
    home: new THREE.Vector3(...def.position),
    layoutScale: 1,
    labelOffset: PORTAL_RADIUS + 0.55,
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

  const portals = PORTALS.map(buildPortal);
  portals.forEach((portal) => {
    portal.group.scale.setScalar(reducedMotion ? 1 : 0.001);
    scene.add(portal.group);
  });

  const labels = new Map<string, HTMLAnchorElement>();
  document
    .querySelectorAll<HTMLAnchorElement>("#nexus-labels a[data-version]")
    .forEach((el) => labels.set(el.dataset.version!, el));

  const veil = document.getElementById("nexus-veil")!;

  // Wide screens get the horizontal portal arc; portrait stacks them
  // vertically. The camera backs up until everything fits.
  let baseCameraZ = 9;
  function layout() {
    const aspect = window.innerWidth / window.innerHeight;
    camera.aspect = aspect;
    const portrait = aspect < 0.9;

    const stackY = [3.7, -0.3, -4.3];
    portals.forEach((portal, index) => {
      if (portrait) {
        portal.home.set(0, stackY[index], 0);
        portal.group.rotation.y = 0;
        portal.layoutScale = 0.72;
      } else {
        portal.home.set(...portal.def.position);
        portal.group.rotation.y = portal.def.rotationY;
        portal.layoutScale = 1;
      }
      portal.labelOffset = PORTAL_RADIUS * portal.layoutScale + (portrait ? 0.4 : 0.55);
      portal.group.position.copy(portal.home);
    });

    const halfVerticalTan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const halfHorizontalTan = halfVerticalTan * aspect;
    const halfWidthNeeded = portrait ? 1.6 : 6.3;
    const halfHeightNeeded = portrait ? 8.4 : 3.9;
    baseCameraZ = THREE.MathUtils.clamp(
      Math.max(halfWidthNeeded / halfHorizontalTan, halfHeightNeeded / halfVerticalTan),
      9,
      26
    );
    camera.updateProjectionMatrix();
  }

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
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
    const hits = raycaster.intersectObjects(portals.map((portal) => portal.disc));
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

  // Keyboard focus on a label highlights its portal too.
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
    // visible portal disc itself a reliable touch target.
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
    // Fly to just in front of the portal face, along its outward normal.
    const normal = new THREE.Vector3(0, 0, 1).applyEuler(portal.group.rotation);
    enterTo.copy(portal.group.position).addScaledVector(normal, 0.45);
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
        // the response noticeable without pulling focus from the portals.
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
      entering.uniforms.uEnter.value = eased;
      if (t > 0.55) {
        veil.style.opacity = String((t - 0.55) / 0.45);
      }
    }

    stars.rotation.y += dt * 0.006 * motion;

    portals.forEach((portal, index) => {
      portal.uniforms.uTime.value += dt * motion;

      const isHovered = index === hoveredIndex || index === focusedIndex;
      if (!reducedMotion) {
        // Intro: portals bloom in, staggered; then a gentle bob.
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

      // Keep the HTML label pinned under the portal.
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
      const hits = raycaster.intersectObjects(portals.map((p) => p.disc));
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
