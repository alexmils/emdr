const BALL_COLORS = [
  "#9fd4e8",
  "#f2e6c9",
  "#e8b298",
  "#c4a36a",
  "#8fad93",
  "#c9b7e8",
  "#f0d36c",
  "#ffffff",
];

const SOUND_PRESETS = [
  { id: "click", label: "Meki klik" },
  { id: "wood", label: "Drvo" },
  { id: "sine", label: "Ton" },
  { id: "drop", label: "Kap" },
  { id: "noise", label: "Šum" },
  { id: "off", label: "Bez klika" },
];

export class BLSEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.running = false;
    this.x = 0.5;
    this.dir = 1;
    this.lastSide = 0;
    this.startedAt = 0;
    this.duration = 38;
    this.onTick = null;
    this.onComplete = null;
    this.gamepadIndex = null;
    this.audio = null;
    this.settings = {
      speed: 1.15,
      ballColor: BALL_COLORS[0],
      ballSize: 22,
      trail: true,
      visual: true,
      audio: true,
      rumble: true,
      sound: "click",
      volume: 0.35,
      binaural: false,
      binauralHz: 6,
      bg: "#0f0e13",
      manualStick: false,
    };
    this._raf = 0;
    this._last = 0;
    this._resize();
    window.addEventListener("resize", () => this._resize());
    window.addEventListener("gamepadconnected", (e) => {
      this.gamepadIndex = e.gamepad.index;
    });
    window.addEventListener("gamepaddisconnected", () => {
      this.gamepadIndex = null;
    });
  }

  _resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = rect.width;
    this.h = rect.height;
    this.draw();
  }

  async ensureAudio() {
    if (this.audio) return;
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = this.settings.volume;
    master.connect(ctx.destination);
    const leftOsc = ctx.createOscillator();
    const rightOsc = ctx.createOscillator();
    const leftGain = ctx.createGain();
    const rightGain = ctx.createGain();
    const merger = ctx.createChannelMerger(2);
    leftOsc.type = "sine";
    rightOsc.type = "sine";
    leftOsc.frequency.value = 180;
    rightOsc.frequency.value = 186;
    leftGain.gain.value = 0;
    rightGain.gain.value = 0;
    leftOsc.connect(leftGain).connect(merger, 0, 0);
    rightOsc.connect(rightGain).connect(merger, 0, 1);
    merger.connect(master);
    leftOsc.start();
    rightOsc.start();
    this.audio = { ctx, master, leftOsc, rightOsc, leftGain, rightGain };
  }

  setVolume(v) {
    this.settings.volume = v;
    if (this.audio) this.audio.master.gain.value = v;
  }

  click(side) {
    if (!this.settings.audio || this.settings.sound === "off" || !this.audio) return;
    const { ctx, master } = this.audio;
    const pan = ctx.createStereoPanner();
    pan.pan.value = side < 0 ? -1 : 1;
    pan.connect(master);
    const now = ctx.currentTime;
    const kind = this.settings.sound;
    if (kind === "noise") {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      const src = ctx.createBufferSource();
      const g = ctx.createGain();
      src.buffer = buffer;
      g.gain.setValueAtTime(0.5, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      src.connect(g).connect(pan);
      src.start();
      return;
    }
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g).connect(pan);
    if (kind === "wood") {
      osc.frequency.value = 180;
      osc.type = "triangle";
      g.gain.setValueAtTime(0.5, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    } else if (kind === "sine") {
      osc.frequency.value = 420;
      osc.type = "sine";
      g.gain.setValueAtTime(0.22, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    } else if (kind === "drop") {
      osc.frequency.setValueAtTime(640, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.16);
      osc.type = "sine";
      g.gain.setValueAtTime(0.28, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    } else {
      osc.frequency.value = 980;
      osc.type = "square";
      g.gain.setValueAtTime(0.12, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    }
    osc.start(now);
    osc.stop(now + 0.2);
  }

  rumble(side) {
    if (!this.settings.rumble) return;
    const pad = this.pad();
    const actuator = pad?.vibrationActuator;
    if (!actuator?.playEffect) return;
    const left = side < 0 ? 0.45 : 0.05;
    const right = side > 0 ? 0.45 : 0.05;
    actuator.playEffect("dual-rumble", {
      duration: 70,
      startDelay: 0,
      strongMagnitude: left,
      weakMagnitude: right,
    }).catch(() => {});
  }

  pad() {
    const pads = navigator.getGamepads?.() || [];
    if (this.gamepadIndex != null && pads[this.gamepadIndex]) return pads[this.gamepadIndex];
    return [...pads].find(Boolean) || null;
  }

  start(seconds) {
    this.duration = seconds || this.duration;
    this.running = true;
    this.startedAt = performance.now();
    this._last = this.startedAt;
    this.ensureAudio().then(() => {
      if (this.audio?.ctx.state === "suspended") this.audio.ctx.resume();
      this._syncBed(true);
    });
    cancelAnimationFrame(this._raf);
    this._loop(this.startedAt);
  }

  stop() {
    this.running = false;
    this._syncBed(false);
    this.draw();
  }

  _syncBed(on) {
    if (!this.audio) return;
    const bed = on && this.settings.binaural && this.settings.audio;
    const hz = 180;
    this.audio.leftOsc.frequency.value = hz;
    this.audio.rightOsc.frequency.value = hz + Number(this.settings.binauralHz || 6);
    const vol = bed ? 0.04 : 0;
    this.audio.leftGain.gain.setTargetAtTime(vol, this.audio.ctx.currentTime, 0.05);
    this.audio.rightGain.gain.setTargetAtTime(vol, this.audio.ctx.currentTime, 0.05);
  }

  _loop(t) {
    const dt = Math.min(0.05, (t - this._last) / 1000);
    this._last = t;
    this._pollGamepad();
    if (this.running) {
      const elapsed = (t - this.startedAt) / 1000;
      if (elapsed >= this.duration) {
        this.running = false;
        this._syncBed(false);
        this.onComplete?.();
      } else {
        if (this.settings.manualStick && this.pad()) {
          const axis = this.pad().axes[0] || 0;
          this.x = Math.min(1, Math.max(0, (axis + 1) / 2));
        } else {
          const hz = Number(this.settings.speed) || 1;
          this.x += this.dir * hz * 2 * dt;
          if (this.x >= 1) { this.x = 1; this.dir = -1; }
          if (this.x <= 0) { this.x = 0; this.dir = 1; }
        }
        const side = this.x < 0.18 ? -1 : this.x > 0.82 ? 1 : 0;
        if (side && side !== this.lastSide) {
          this.lastSide = side;
          this.click(side);
          this.rumble(side);
        }
        if (side === 0) this.lastSide = 0;
        this.onTick?.({ x: this.x, remaining: Math.max(0, this.duration - elapsed) });
      }
    }
    this.draw();
    this._raf = requestAnimationFrame((n) => this._loop(n));
  }

  _pollGamepad() {
    const pad = this.pad();
    if (!pad) return;
    const pressed = (i) => pad.buttons[i]?.pressed;
    if (!this._btn) this._btn = {};
    const edge = (i) => {
      const now = pressed(i);
      const was = this._btn[i];
      this._btn[i] = now;
      return now && !was;
    };
    if (edge(0)) this.onGamepad?.("start");
    if (edge(1)) this.onGamepad?.("stop");
    if (edge(2)) this.onGamepad?.("safe");
    if (edge(3)) this.onGamepad?.("audio");
    if (edge(4)) this.settings.speed = Math.max(0.35, +(this.settings.speed - 0.1).toFixed(2));
    if (edge(5)) this.settings.speed = Math.min(2.8, +(this.settings.speed + 0.1).toFixed(2));
    if (edge(8)) this.onGamepad?.("color");
    if (edge(9)) this.onGamepad?.("sound");
  }

  draw() {
    if (!this.w) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.fillStyle = this.settings.bg;
    ctx.fillRect(0, 0, this.w, this.h);

    const y = this.h * 0.52;
    const pad = 48;
    const railW = this.w - pad * 2;
    ctx.strokeStyle = "rgba(196,163,106,0.45)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(pad + railW, y);
    ctx.stroke();
    ctx.strokeStyle = "rgba(196,163,106,0.18)";
    ctx.lineWidth = 10;
    ctx.stroke();

    const x = pad + this.x * railW;
    if (this.settings.trail && this.settings.visual) {
      const g = ctx.createLinearGradient(x - 80, y, x + 80, y);
      g.addColorStop(0, "transparent");
      g.addColorStop(0.5, this.settings.ballColor + "55");
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.fillRect(x - 90, y - 18, 180, 36);
    }
    if (this.settings.visual) {
      const r = Number(this.settings.ballSize) || 22;
      const glow = ctx.createRadialGradient(x - r / 3, y - r / 3, 2, x, y, r * 1.6);
      glow.addColorStop(0, "#fff");
      glow.addColorStop(0.18, this.settings.ballColor);
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, r * 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = this.settings.ballColor;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export { BALL_COLORS, SOUND_PRESETS };
