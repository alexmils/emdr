"use client";

import { Bell, BellOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

async function registerAdminWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.register("/admin/sw.js", { scope: "/admin/" });
}

export function AdminPushToggle() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setSupported(false);
      return;
    }
    setSupported(true);
    try {
      await registerAdminWorker();
      const res = await fetch("/api/admin/push");
      const data = (await res.json()) as { subscribed?: boolean };
      if (res.ok) setSubscribed(Boolean(data.subscribed));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const enable = async () => {
    setBusy(true);
    setHint(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setHint("Notifications blocked — allow them in the browser.");
        return;
      }
      const reg = await registerAdminWorker();
      if (!reg) {
        setHint("Push is not available in this browser.");
        return;
      }
      await navigator.serviceWorker.ready;
      const meta = await fetch("/api/admin/push");
      const data = (await meta.json()) as { publicKey?: string };
      if (!meta.ok || !data.publicKey) {
        setHint("Push keys are not ready yet.");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey),
      });
      const res = await fetch("/api/admin/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      if (!res.ok) {
        setHint("Could not save push subscription.");
        return;
      }
      setSubscribed(true);
    } catch (err) {
      console.error("[admin/push/enable]", err);
      setHint("Could not enable push notifications.");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    setHint(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/admin/");
      const sub = await reg?.pushManager.getSubscription();
      const endpoint = sub?.endpoint;
      await sub?.unsubscribe();
      await fetch("/api/admin/push", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      });
      setSubscribed(false);
    } catch {
      setHint("Could not disable push.");
    } finally {
      setBusy(false);
    }
  };

  if (!supported) return null;

  return (
    <div className="admin-push-wrap">
      <button
        type="button"
        className={`admin-push-btn ${subscribed ? "admin-push-btn-on" : ""}`}
        disabled={busy}
        title={
          subscribed
            ? "Help push notifications on — click to turn off"
            : "Enable Help push notifications (PWA / browser)"
        }
        aria-pressed={subscribed}
        onClick={() => void (subscribed ? disable() : enable())}
      >
        {subscribed ? <Bell size={16} strokeWidth={2} /> : <BellOff size={16} strokeWidth={2} />}
        <span>{subscribed ? "Alerts on" : "Alerts"}</span>
      </button>
      {hint ? <p className="admin-push-hint">{hint}</p> : null}
    </div>
  );
}
