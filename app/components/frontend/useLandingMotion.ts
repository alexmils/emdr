"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { setLandingLenis } from "@/lib/landing-scroll";

/** Curevo + Scalient-style motion: Lenis smooth scroll, GSAP hero + scroll reveals. */
export function useLandingMotion(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      root.querySelectorAll(".fe-split-word, .fe-animate, .fe-display-word, .fe-about-word").forEach((el) => {
        gsap.set(el, { clearProps: "all", opacity: 1, y: 0, x: 0, color: "" });
      });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    let lenis: Lenis | null = null;
    let rafId = 0;

    lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 0.9,
    });
    setLandingLenis(lenis);

    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => {
      lenis?.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    const ctx = gsap.context(() => {
      /* —— Hero load (SplitText-style word rise) —— */
      const heroTl = gsap.timeline({ defaults: { ease: "power4.out" } });
      heroTl
        .from(".fe-hero-kicker", { y: 20, opacity: 0, duration: 0.7 })
        .from(
          ".fe-hero .fe-split-word",
          { yPercent: 115, opacity: 0, stagger: 0.045, duration: 1.05 },
          "-=0.35"
        )
        .from(".fe-hero-description", { y: 28, opacity: 0, duration: 0.85 }, "-=0.55")
        .from(
          ".fe-hero-card-row > *",
          { y: 22, opacity: 0, stagger: 0.09, duration: 0.65 },
          "-=0.45"
        );

      gsap.to(".fe-hero-image-bg", {
        yPercent: 12,
        ease: "none",
        scrollTrigger: {
          trigger: ".fe-hero",
          start: "top top",
          end: "bottom top",
          scrub: 1.2,
        },
      });

      /* Keep overlay pinned to hero — do not translate (that strips the bottom filter). */
      /* —— Section stagger reveals —— */
      root.querySelectorAll<HTMLElement>(
        ".fe-section-block, .fe-pricing-section, .fe-about, .fe-faq, .fe-blog, .fe-how-section"
      ).forEach((section) => {
        const items = section.querySelectorAll(".fe-animate");
        if (!items.length) return;
        gsap.from(items, {
          y: 56,
          opacity: 0,
          duration: 0.95,
          stagger: 0.11,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });
      });

      /* —— About title: scroll-scrub word color (Curevo) —— */
      const aboutTitle = root.querySelector<HTMLElement>(".fe-about-title");
      const aboutWords = root.querySelectorAll<HTMLElement>(".fe-about-word");
      if (aboutTitle && aboutWords.length) {
        gsap.set(aboutWords, { color: "rgba(42, 48, 32, 0.18)" });
        gsap.to(aboutWords, {
          color: "#2a3020",
          ease: "none",
          stagger: {
            each: 0.05,
            from: "start",
          },
          scrollTrigger: {
            trigger: aboutTitle,
            start: "top 80%",
            end: "bottom 42%",
            scrub: 0.65,
            invalidateOnRefresh: true,
          },
        });
      }

      /* —— Intro image clip reveal —— */
      gsap.from(".fe-intro-image-wrap", {
        clipPath: "inset(100% 0 0 0)",
        duration: 1.2,
        ease: "power4.inOut",
        scrollTrigger: { trigger: ".fe-intro", start: "top 75%" },
      });

      /* —— Scalient-style display words —— */
      gsap.from(".fe-display-word", {
        xPercent: (i) => (i === 0 ? -40 : 40),
        opacity: 0,
        duration: 1.35,
        stagger: 0.18,
        ease: "power4.out",
        scrollTrigger: { trigger: ".fe-display", start: "top 78%" },
      });

      /* —— Offer cards image scale —— */
      root.querySelectorAll<HTMLElement>(".fe-offer-card").forEach((card) => {
        gsap.from(card, {
          y: 40,
          opacity: 0,
          duration: 0.85,
          ease: "power2.out",
          scrollTrigger: { trigger: card, start: "top 88%" },
        });
      });

      /* —— Curevo-style stat counters —— */
      root.querySelectorAll<HTMLElement>(".fe-count").forEach((el, idx) => {
        const target = parseInt(el.dataset.target ?? "0", 10);
        const suffix = el.dataset.suffix ?? "";
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: Math.max(1.2, Math.min(2.4, target / 4)),
          ease: "power2.out",
          delay: idx * 0.12,
          scrollTrigger: { trigger: el, start: "top 85%" },
          onUpdate: () => {
            el.textContent = `${Math.floor(obj.val)}${suffix}`;
          },
          onComplete: () => {
            el.textContent = `${target}${suffix}`;
          },
        });
      });

      /* —— Closing band (CTA inside footer) —— */
      gsap.from(".fe-site-footer-cta", {
        y: 36,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: ".fe-site-footer", start: "top 85%" },
      });

    }, root);

    return () => {
      cancelAnimationFrame(rafId);
      ctx.revert();
      setLandingLenis(null);
      lenis?.destroy();
    };
  }, [rootRef]);
}
