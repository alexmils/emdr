"use client";

import { useEffect, useState } from "react";
import { isGamepadConnected } from "./gamepad";

export function useGamepadConnected() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const update = () => setConnected(isGamepadConnected());
    update();
    window.addEventListener("gamepadconnected", update);
    window.addEventListener("gamepaddisconnected", update);
    const id = window.setInterval(update, 1500);
    return () => {
      window.removeEventListener("gamepadconnected", update);
      window.removeEventListener("gamepaddisconnected", update);
      window.clearInterval(id);
    };
  }, []);

  return connected;
}
