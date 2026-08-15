import { defenseIsOpen, type CombatEvent, type Defense, type GameState } from "./combat";

interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string }

export interface FightScene {
  update(dt: number): void;
  render(state: GameState): void;
  handle(event: CombatEvent): void;
}

const WORLD_W = 1000;
const WORLD_H = 650;
// The horizontal band that has to stay on screen for an exchange to read: both
// fighters at full extension, with room for a player slipped hard to the left.
const ACTION_W = 580;
// The vertical band that carries the fight, from the cue badge down to the
// fighters' feet. The dead floor below it may slide under the touch controls.
const CONTENT_TOP = 90;
const CONTENT_BOTTOM = 560;
const CONTENT_H = CONTENT_BOTTOM - CONTENT_TOP;
// Mirrors Hud.astro: the control row is a 4.3rem button above a 0.75rem (or
// safe-area) gutter, and the score block runs ~72px down from the top edge.
const CONTROL_H = 68.8;
const CONTROL_GAP = 12;
const HUD_TOP_BLOCK = 72;

interface Layout { scale: number; offsetX: number; offsetY: number }

/** Reads the live env(safe-area-inset-*) values, which CSS alone can't hand to canvas. */
function safeInsets(): { top: number; bottom: number } {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;top:0;left:0;width:0;height:0;visibility:hidden;pointer-events:none;" +
    "padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);";
  document.body.appendChild(probe);
  const style = getComputedStyle(probe);
  const insets = {
    top: Number.parseFloat(style.paddingTop) || 0,
    bottom: Number.parseFloat(style.paddingBottom) || 0,
  };
  probe.remove();
  return insets;
}

/**
 * Desktop framing is unchanged. Wherever the touch controls are on screen the
 * world is fitted into the band between the HUD and the control row instead of
 * being centred in the viewport, so the buttons can never cover the fighters
 * and tall phones stop wasting half the screen on empty canvas.
 */
function computeLayout(w: number, h: number): Layout {
  const touch = window.matchMedia("(pointer: coarse), (max-width: 640px)").matches;
  if (!touch) {
    const visibleWidth = w / h < 0.75 ? 720 : WORLD_W;
    const scale = Math.min(w / visibleWidth, h / WORLD_H);
    return { scale, offsetX: (w - WORLD_W * scale) / 2, offsetY: (h - WORLD_H * scale) / 2 };
  }
  const insets = safeInsets();
  const top = insets.top + HUD_TOP_BLOCK;
  const bottom = Math.max(CONTROL_GAP, insets.bottom) + CONTROL_H;
  const band = Math.max(140, h - top - bottom);
  const scale = Math.min(w / ACTION_W, band / CONTENT_H);
  return {
    scale,
    offsetX: (w - WORLD_W * scale) / 2,
    offsetY: top + (band - CONTENT_H * scale) / 2 - CONTENT_TOP * scale,
  };
}

/**
 * The halftone is a static texture, so it is stamped once per resize instead of
 * costing ~790 arc fills on every frame.
 */
function buildHalftone(pixelScale: number): HTMLCanvasElement | null {
  const sheet = document.createElement("canvas");
  sheet.width = Math.max(1, Math.ceil(WORLD_W * pixelScale));
  sheet.height = Math.max(1, Math.ceil(WORLD_H * pixelScale));
  const ink = sheet.getContext("2d");
  if (!ink) return null;
  ink.scale(pixelScale, pixelScale);
  ink.globalAlpha = 0.08;
  ink.fillStyle = "#f2e8d5";
  for (let y = 80; y < 560; y += 24) {
    for (let x = 35 + ((y / 24) % 2) * 8; x < 980; x += 24) {
      ink.beginPath();
      ink.arc(x, y, 2.2, 0, Math.PI * 2);
      ink.fill();
    }
  }
  return sheet;
}

export function createScene(canvas: HTMLCanvasElement, reducedMotion: boolean): FightScene | null {
  const foundContext = canvas.getContext("2d");
  if (!foundContext) return null;
  const context: CanvasRenderingContext2D = foundContext;

  let width = 1;
  let height = 1;
  let dodge: Defense | null = null;
  let dodgeTimer = 0;
  let punchTimer = 0;
  let hitTimer = 0;
  let shake = 0;
  let elapsed = 0;
  const particles: Particle[] = [];

  let layout: Layout = { scale: 1, offsetX: 0, offsetY: 0 };
  let halftone: HTMLCanvasElement | null = null;
  let halftoneScale = 0;

  const resize = () => {
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    layout = computeLayout(width, height);
    // Capped so a high-DPI desktop does not allocate a huge offscreen sheet for
    // what is an 8%-opacity texture, and rounded so the repeated resize events
    // a mobile browser fires do not keep reallocating it.
    const sheetScale = Math.round(Math.min(layout.scale * ratio, 2) * 4) / 4;
    if (sheetScale !== halftoneScale) {
      halftone = buildHalftone(sheetScale);
      halftoneScale = sheetScale;
    }
  };
  resize();
  window.addEventListener("resize", resize);

  function burst(x: number, y: number, color: string, count: number): void {
    if (reducedMotion) return;
    for (let index = 0; index < count; index++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 190;
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.35 + Math.random() * 0.35, color });
    }
  }

  function line(x1: number, y1: number, x2: number, y2: number, widthPx: number, color: string): void {
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.lineWidth = widthPx;
    context.lineCap = "round";
    context.strokeStyle = color;
    context.stroke();
  }

  function glove(x: number, y: number, color: string, rotation = 0): void {
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    context.fillStyle = color;
    context.strokeStyle = "#17130f";
    context.lineWidth = 7;
    context.beginPath();
    context.ellipse(0, 0, 27, 22, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.fillRect(-10, 13, 26, 20);
    context.strokeRect(-10, 13, 26, 20);
    context.restore();
  }

  function fighter(x: number, floor: number, color: string, gloves: string, facing: 1 | -1, pose: { crouch?: number; lean?: number; punch?: number; rearPunch?: number }): void {
    const crouch = pose.crouch ?? 0;
    const lean = pose.lean ?? 0;
    const shoulderX = x + lean;
    const shoulderY = floor - 164 + crouch;
    const hipY = floor - 83 + crouch * 0.55;
    const forward = facing * (66 + (pose.punch ?? 0) * 88);
    const rear = facing * (42 + (pose.rearPunch ?? 0) * 65);

    context.fillStyle = color;
    context.strokeStyle = "#17130f";
    context.lineWidth = 8;
    context.beginPath();
    context.moveTo(shoulderX - 30, shoulderY);
    context.quadraticCurveTo(shoulderX, shoulderY - 13, shoulderX + 30, shoulderY);
    context.lineTo(x + 28, hipY);
    context.lineTo(x - 28, hipY);
    context.closePath();
    context.fill();
    context.stroke();

    line(x - 14, hipY, x - 34, floor - 7, 23, color);
    line(x + 14, hipY, x + 42, floor - 7, 23, color);
    line(x - 48, floor - 5, x - 16, floor - 5, 15, "#17130f");
    line(x + 30, floor - 5, x + 62, floor - 5, 15, "#17130f");

    context.beginPath();
    context.arc(shoulderX, shoulderY - 52, 36, 0, Math.PI * 2);
    context.fillStyle = color;
    context.fill();
    context.stroke();
    // Neck: a short column from inside the skull down into the shoulders,
    // tucked just far enough back to read as a stance. It has to overlap both
    // ends — the head bottom sits at shoulderY - 16 and the torso crown at
    // roughly shoulderY - 6, so anything shorter leaves the head detached.
    line(shoulderX - facing * 4, shoulderY - 30, shoulderX - facing * 8, shoulderY - 8, 16, color);

    const frontElbowX = shoulderX + forward * 0.52;
    const frontElbowY = shoulderY + 4 - (pose.punch ?? 0) * 11;
    line(shoulderX + facing * 24, shoulderY + 5, frontElbowX, frontElbowY, 20, color);
    line(frontElbowX, frontElbowY, shoulderX + forward, shoulderY + 5 - (pose.punch ?? 0) * 14, 18, color);
    glove(shoulderX + forward, shoulderY + 5 - (pose.punch ?? 0) * 14, gloves, facing === 1 ? -0.2 : 0.2);

    const rearX = shoulderX + rear;
    line(shoulderX - facing * 22, shoulderY + 7, shoulderX - facing * 6, shoulderY + 46, 20, color);
    line(shoulderX - facing * 6, shoulderY + 46, rearX, shoulderY + 21, 18, color);
    glove(rearX, shoulderY + 21, gloves, facing === 1 ? -0.3 : 0.3);
  }

  function drawBackground(): void {
    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#272019");
    gradient.addColorStop(0.6, "#17130f");
    gradient.addColorStop(1, "#0d0b09");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  }

  function drawWorld(state: GameState): void {
    const { scale, offsetX, offsetY } = layout;
    const sx = reducedMotion ? 0 : (Math.random() - 0.5) * shake * 18;
    const sy = reducedMotion ? 0 : (Math.random() - 0.5) * shake * 10;
    context.save();
    context.translate(offsetX + sx, offsetY + sy);
    context.scale(scale, scale);

    if (halftone) context.drawImage(halftone, 0, 0, WORLD_W, WORLD_H);

    context.fillStyle = "#0b0907";
    context.fillRect(0, 505, WORLD_W, 145);
    context.strokeStyle = "#6e6253";
    context.lineWidth = 5;
    for (const y of [325, 395, 465]) {
      context.beginPath();
      context.moveTo(0, y);
      context.quadraticCurveTo(500, y + Math.sin(elapsed * 1.4 + y) * 4, 1000, y);
      context.stroke();
    }
    context.fillStyle = "#d33e2d";
    context.fillRect(43, 288, 18, 235);
    context.fillRect(939, 288, 18, 235);

    let playerX = 330;
    let playerCrouch = 0;
    let playerLean = 0;
    if (dodgeTimer > 0) {
      if (dodge === "left") playerX -= 42;
      if (dodge === "right") playerX += 35;
      if (dodge === "duck") playerCrouch = 58;
      playerLean = dodge === "left" ? -18 : dodge === "right" ? 18 : 0;
    }
    const punch = Math.min(1, punchTimer * 5);
    const hitLean = hitTimer > 0 ? -42 * Math.sin(Math.min(1, hitTimer * 4) * Math.PI) : 0;
    fighter(playerX + hitLean, 520, "#e9ddc7", "#d33e2d", 1, { crouch: playerCrouch, lean: playerLean, punch });

    const telegraphProgress = state.phase === "telegraph" ? 1 - state.phaseTime / state.phaseDuration : 0;
    const attackDrive = state.phase === "telegraph" ? Math.max(0, (telegraphProgress - 0.52) / 0.48) : 0;
    const hook = state.attack.kind === "hook";
    const front = state.attack.kind === "left-straight" ? attackDrive : 0;
    const rear = state.attack.kind === "right-straight" ? attackDrive : hook ? attackDrive * 0.85 : 0;
    fighter(675, 520, "#41382e", "#f2e8d5", -1, { lean: -attackDrive * 20, punch: front, rearPunch: rear });

    if (state.phase === "telegraph") {
      const ready = defenseIsOpen(state);
      const progress = 1 - state.phaseTime / state.phaseDuration;
      context.save();
      context.translate(500, 188);
      context.rotate(-0.025);
      context.fillStyle = ready ? "#d33e2d" : "#17130f";
      context.strokeStyle = ready ? "#f2e8d5" : "#807462";
      context.lineWidth = ready ? 7 : 4;
      context.beginPath();
      context.arc(0, 0, ready ? 52 : 48, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.fillStyle = "#f2e8d5";
      context.font = "900 54px Inter, sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(state.attack.cue, 0, -2);
      context.beginPath();
      context.arc(0, 0, 67, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
      context.strokeStyle = "#d33e2d";
      context.lineWidth = 8;
      context.stroke();
      context.restore();
    } else if (state.phase === "counter") {
      const progress = state.phaseTime / state.phaseDuration;
      context.fillStyle = "#ffd166";
      context.strokeStyle = "#17130f";
      context.lineWidth = 8;
      context.font = "900 43px Inter, sans-serif";
      context.textAlign = "center";
      context.strokeText("COUNTER!", 500, 185);
      context.fillText("COUNTER!", 500, 185);
      context.fillRect(420, 205, 160 * progress, 7);
    }

    for (const particle of particles) {
      context.globalAlpha = Math.min(1, particle.life * 3);
      context.fillStyle = particle.color;
      context.fillRect(particle.x - 4, particle.y - 4, 8, 8);
    }
    context.globalAlpha = 1;
    context.restore();
  }

  return {
    update(dt) {
      elapsed += dt;
      dodgeTimer = Math.max(0, dodgeTimer - dt);
      punchTimer = Math.max(0, punchTimer - dt);
      hitTimer = Math.max(0, hitTimer - dt);
      shake = Math.max(0, shake - dt * 3.5);
      for (let index = particles.length - 1; index >= 0; index--) {
        const particle = particles[index];
        particle.life -= dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vy += 280 * dt;
        if (particle.life <= 0) particles.splice(index, 1);
      }
    },
    render(state) {
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.restore();
      drawBackground();
      drawWorld(state);
    },
    handle(event) {
      if (event.type === "dodge") {
        dodge = event.defense;
        dodgeTimer = 0.42;
      } else if (event.type === "counter") {
        punchTimer = 0.24;
        shake = event.quality === "perfect" ? 0.8 : 0.45;
        burst(610, 330, event.quality === "perfect" ? "#ffd166" : "#d33e2d", event.quality === "perfect" ? 20 : 11);
      } else if (event.type === "hit") {
        hitTimer = 0.42;
        shake = 1;
        burst(390, 330, "#f2e8d5", 16);
      }
    },
  };
}
