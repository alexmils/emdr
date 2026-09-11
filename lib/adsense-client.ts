/** Client-only AdSense push helpers (browser). */

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Push one AdSense unit after the loader is present.
 * Safe under React Strict Mode double-effects: marks the element only after push.
 */
export function scheduleAdSensePush(
  el: HTMLElement | null,
  maxWaitMs = 4000
): () => void {
  if (!el) return () => {};

  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const started = Date.now();

  const run = () => {
    if (cancelled || !el.isConnected) return;
    if (el.dataset.adsenseStatus === "done") return;

    const hasScript = Boolean(
      document.querySelector(
        'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]'
      )
    );
    if (!hasScript && Date.now() - started < maxWaitMs) {
      timer = setTimeout(run, 150);
      return;
    }

    el.dataset.adsenseStatus = "done";
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Ad blockers / already filled — ignore
    }
  };

  run();

  return () => {
    cancelled = true;
    if (timer) clearTimeout(timer);
  };
}
