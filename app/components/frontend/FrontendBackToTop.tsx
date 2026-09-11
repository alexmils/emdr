"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import { scrollToLandingSection } from "@/lib/landing-scroll";
import "./frontend-back-to-top.css";

const SHOW_AFTER_PX = 480;

export function FrontendBackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > SHOW_AFTER_PX);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function goTop() {
    const ok = scrollToLandingSection("home");
    if (!ok) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    window.history.pushState(null, "", "/");
  }

  return (
    <button
      type="button"
      className={`fe-back-top${visible ? " is-visible" : ""}`}
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
      onClick={goTop}
    >
      <ChevronUp size={22} strokeWidth={2.25} aria-hidden />
    </button>
  );
}
