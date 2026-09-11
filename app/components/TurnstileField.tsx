"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import Script from "next/script";
import {
  TURNSTILE_SITE_KEY,
  type TurnstileAction,
} from "@/lib/turnstile-shared";

export type TurnstileFieldHandle = {
  reset: () => void;
  getToken: () => string | null;
};

type TurnstileApi = {
  render: (
    el: HTMLElement,
    options: Record<string, unknown>
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
  getResponse: (widgetId?: string) => string;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type Props = {
  action: TurnstileAction;
  onToken: (token: string | null) => void;
  className?: string;
};

export const TurnstileField = forwardRef<TurnstileFieldHandle, Props>(
  function TurnstileField({ action, onToken, className }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const onTokenRef = useRef(onToken);
    onTokenRef.current = onToken;
    const [scriptReady, setScriptReady] = useState(false);

    useImperativeHandle(ref, () => ({
      reset: () => {
        const id = widgetIdRef.current;
        if (id && window.turnstile) {
          window.turnstile.reset(id);
        }
        onTokenRef.current(null);
      },
      getToken: () => {
        const id = widgetIdRef.current;
        if (!id || !window.turnstile) return null;
        return window.turnstile.getResponse(id) || null;
      },
    }));

    useEffect(() => {
      // Next.js <Script strategy="afterInteractive"> loads with async/defer.
      // turnstile.ready() forbids that — call render only after Script onReady.
      if (!scriptReady || !window.turnstile || !containerRef.current) {
        return;
      }
      if (widgetIdRef.current) return;

      const container = containerRef.current;
      widgetIdRef.current = window.turnstile.render(container, {
        sitekey: TURNSTILE_SITE_KEY,
        action,
        theme: "light",
        size: "flexible",
        callback: (token: string) => {
          onTokenRef.current(token);
        },
        "error-callback": () => {
          onTokenRef.current(null);
        },
        "expired-callback": () => {
          onTokenRef.current(null);
        },
      });

      return () => {
        const id = widgetIdRef.current;
        widgetIdRef.current = null;
        if (id && window.turnstile) {
          try {
            window.turnstile.remove(id);
          } catch {
            /* already removed */
          }
        }
        onTokenRef.current(null);
      };
    }, [scriptReady, action]);

    return (
      <div className={className ?? "auth-turnstile"}>
        <div ref={containerRef} />
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onReady={() => setScriptReady(true)}
        />
      </div>
    );
  }
);
