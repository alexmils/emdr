export type GamepadCallback = (action: "toggle" | "speed_up" | "speed_down" | "safe_place") => void;

let rafId: number | null = null;
let prevButtons: boolean[] = [];

export function startGamepadLoop(onAction: GamepadCallback) {
  stopGamepadLoop();

  const tick = () => {
    const pads = navigator.getGamepads?.() ?? [];
    const pad = Array.from(pads).find((p) => p && p.connected);
    if (pad) {
      const buttons = pad.buttons.map((b) => b.pressed);
      if (buttons[0] && !prevButtons[0]) onAction("toggle");
      if (buttons[1] && !prevButtons[1]) onAction("safe_place");
      if (buttons[14] && !prevButtons[14]) onAction("speed_down");
      if (buttons[15] && !prevButtons[15]) onAction("speed_up");
      prevButtons = buttons;
    }
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);
}

export function stopGamepadLoop() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  prevButtons = [];
}

export function rumble(intensity: number) {
  const pads = navigator.getGamepads?.() ?? [];
  for (const pad of pads) {
    if (!pad?.vibrationActuator) continue;
    pad.vibrationActuator.playEffect("dual-rumble", {
      startDelay: 0,
      duration: 80,
      weakMagnitude: intensity * 0.5,
      strongMagnitude: intensity,
    }).catch(() => {});
  }
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(40);
  }
}
