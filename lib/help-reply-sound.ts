/**
 * Soft bubble-pop for Help chat when an assistant reply arrives.
 * Web Audio only — no asset file; quiet and short for clinic-calm UI.
 */

let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  if (!sharedCtx || sharedCtx.state === "closed") {
    sharedCtx = new AC();
  }
  return sharedCtx;
}

/** Soft rising pop — like a message bubble appearing. */
export function playHelpReplyPop(): void {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();

    const t = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = 0.11;
    master.connect(ctx.destination);

    // Soft body (sine sweep up)
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.05);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.55, t + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    osc.connect(env);
    env.connect(master);
    osc.start(t);
    osc.stop(t + 0.15);

    // Tiny high “pop” click (very short)
    const click = ctx.createOscillator();
    const clickEnv = ctx.createGain();
    click.type = "triangle";
    click.frequency.value = 1400;
    clickEnv.gain.setValueAtTime(0.0001, t);
    clickEnv.gain.exponentialRampToValueAtTime(0.2, t + 0.004);
    clickEnv.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
    click.connect(clickEnv);
    clickEnv.connect(master);
    click.start(t);
    click.stop(t + 0.04);
  } catch {
    // Autoplay / unsupported — ignore
  }
}
