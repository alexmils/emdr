import type { SoundMode } from "./types";

export class BlsAudioEngine {
  private ctx: AudioContext | null = null;
  private gain: GainNode | null = null;

  private ensure() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.gain = this.ctx.createGain();
      this.gain.connect(this.ctx.destination);
      this.gain.gain.value = 0.35;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  playPan(side: "left" | "right", mode: SoundMode) {
    if (mode === "mute") return;
    this.ensure();
    if (!this.ctx || !this.gain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const pan = this.ctx.createStereoPanner();
    pan.pan.value = side === "left" ? -1 : 1;

    if (mode === "click") {
      osc.type = "square";
      osc.frequency.value = 880;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.4, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
      osc.connect(g);
      g.connect(pan);
      pan.connect(this.gain);
      osc.start(t);
      osc.stop(t + 0.05);
    } else if (mode === "pulse") {
      osc.type = "sine";
      osc.frequency.value = 220;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      osc.connect(g);
      g.connect(pan);
      pan.connect(this.gain);
      osc.start(t);
      osc.stop(t + 0.13);
    } else {
      osc.type = "sine";
      osc.frequency.value = 440;
      const g = this.ctx.createGain();
      g.gain.value = 0.15;
      osc.connect(g);
      g.connect(pan);
      pan.connect(this.gain);
      osc.start(t);
      osc.stop(t + 0.08);
    }
  }

  dispose() {
    void this.ctx?.close();
    this.ctx = null;
    this.gain = null;
  }
}
