import type { CombatEvent } from "./combat";
import { loadMuted, saveMuted } from "./storage";

export class FightAudio {
  private context: AudioContext | null = null;
  private crowdGain: GainNode | null = null;
  private lastHeartbeat = -1;
  private muted = loadMuted();

  async start(): Promise<void> {
    if (!this.context) {
      const AudioCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return;
      this.context = new AudioCtor();
      this.startCrowd();
    }
    if (this.context.state === "suspended") await this.context.resume();
    this.bell();
  }

  isMuted(): boolean { return this.muted; }

  toggle(): boolean {
    this.muted = !this.muted;
    saveMuted(this.muted);
    if (this.crowdGain && this.context) {
      this.crowdGain.gain.setTargetAtTime(this.muted ? 0 : 0.012, this.context.currentTime, 0.05);
    }
    if (!this.muted) this.tone(520, 0.045, 0.05, "square");
    return this.muted;
  }

  event(event: CombatEvent): void {
    if (event.type === "counter") {
      this.noise(event.quality === "perfect" ? 0.12 : 0.08, event.quality === "perfect" ? 0.18 : 0.12);
      this.tone(event.quality === "perfect" ? 130 : 105, 0.09, 0.16, "square", 58);
    } else if (event.type === "hit") {
      this.noise(0.14, 0.2);
      this.tone(72, 0.12, 0.13, "sawtooth", 42);
    } else if (event.type === "dodge") {
      this.noise(0.025, 0.025);
    } else if (event.type === "over") {
      this.bell();
    }
  }

  update(pressure: number): void {
    const ctx = this.context;
    if (!ctx || this.muted || pressure >= 22 || ctx.currentTime - this.lastHeartbeat < 0.58) return;
    this.lastHeartbeat = ctx.currentTime;
    this.tone(68, 0.085, 0.075, "sine", 48);
    window.setTimeout(() => this.tone(56, 0.1, 0.06, "sine", 42), 115);
  }

  private tone(frequency: number, duration: number, volume: number, type: OscillatorType, endFrequency = frequency): void {
    const ctx = this.context;
    if (!ctx || this.muted) return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  private noise(duration: number, volume: number): void {
    const ctx = this.context;
    if (!ctx || this.muted) return;
    const length = Math.ceil(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    filter.type = "lowpass";
    filter.frequency.value = 850;
    gain.gain.value = volume;
    source.buffer = buffer;
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start();
  }

  private startCrowd(): void {
    const ctx = this.context;
    if (!ctx || this.crowdGain) return;
    const length = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let rolling = 0;
    for (let index = 0; index < length; index++) {
      rolling = rolling * 0.985 + (Math.random() * 2 - 1) * 0.015;
      data[index] = rolling;
    }
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    this.crowdGain = ctx.createGain();
    filter.type = "bandpass";
    filter.frequency.value = 420;
    filter.Q.value = 0.45;
    this.crowdGain.gain.value = this.muted ? 0 : 0.012;
    source.buffer = buffer;
    source.loop = true;
    source.connect(filter).connect(this.crowdGain).connect(ctx.destination);
    source.start();
  }

  private bell(): void {
    this.tone(820, 0.55, 0.08, "sine", 610);
    window.setTimeout(() => this.tone(980, 0.35, 0.045, "sine", 720), 85);
  }
}
