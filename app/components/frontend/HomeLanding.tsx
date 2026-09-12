"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  HeartHandshake,
  Play,
  Shield,
  Sparkles,
  Star,
  Users,
  Waves,
} from "lucide-react";
import { BrandMark } from "@/app/components/BrandLockup";
import { appPath } from "@/lib/app-base";
import { BRAND_SPOKEN } from "@/lib/brand";
import {
  BILLING_PLANS,
  TRIAL_DAYS,
  TRIAL_GUIDED_SESSIONS,
  type BillingPlanId,
} from "@/lib/billing-constants";
import {
  formatBlogDate,
  type LandingBlogPost,
} from "@/lib/landing-blog";
import { scheduleScrollToLandingHash } from "@/lib/landing-scroll";
import { useLandingMotion } from "./useLandingMotion";
import "lenis/dist/lenis.css";
import "./landing-motion.css";

/** Local marketing photos (self-hosted — Unsplash remote was flaky). */
const IMG = {
  calmRest: "/marketing/landing/calm-rest.jpg",
  greenLandscape: "/marketing/landing/green-landscape.jpg",
  supportTalk: "/marketing/landing/support-talk.jpg",
  practiceSpace: "/marketing/landing/practice-space.jpg",
  reading: "/marketing/landing/reading.jpg",
  eveningLight: "/marketing/landing/evening-light.jpg",
  together: "/marketing/landing/together.jpg",
  careDesk: "/marketing/landing/care-desk.jpg",
  softWindow: "/marketing/landing/soft-window.jpg",
  quietHands: "/marketing/landing/quiet-hands.jpg",
  avatarMaya: "/marketing/landing/avatar-maya.jpg",
  avatarJames: "/marketing/landing/avatar-james.jpg",
  avatarSophie: "/marketing/landing/avatar-sophie.jpg",
  avatarDaniel: "/marketing/landing/avatar-daniel.jpg",
} as const;

const ABOUT_IMAGES = [
  { src: IMG.calmRest, alt: "Calm moment of rest" },
  { src: IMG.greenLandscape, alt: "Soft green landscape" },
  { src: IMG.supportTalk, alt: "Supportive conversation" },
  { src: IMG.practiceSpace, alt: "Quiet practice space" },
  { src: IMG.reading, alt: "Reading and reflection" },
  { src: IMG.eveningLight, alt: "Gentle evening light" },
  { src: IMG.softWindow, alt: "Soft window light" },
  { src: IMG.quietHands, alt: "Quiet hands at rest" },
];

const ABOUT_COPY = `At ${BRAND_SPOKEN}, we believe therapy support is more than a blank screen — it’s a commitment to calmer sessions and clearer steps. With guided EMDR, Free mode for visual sets, and readable resources, we keep the workspace quiet so you can stay with what matters.`;

/** Decorative photos — native img so next/image does not emit 10+ srcset variants each. */
function DecorativeImg({
  src,
  width,
  height,
  className,
}: {
  src: string;
  width: number;
  height: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- decorative; avoid srcset HTML bloat
    <img
      src={src}
      alt=""
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      className={className}
    />
  );
}

const FEATURES = [
  {
    icon: HeartHandshake,
    title: "Calm session design",
    body: "Soft surfaces, gentle motion, and room to breathe — not a clinical dashboard.",
  },
  {
    icon: Waves,
    title: "Guided or Free mode",
    body: "Follow a structured EMDR protocol with a session guide, or use the moving ball on your own.",
  },
  {
    icon: Shield,
    title: "Safety built in",
    body: "Intake and grounding before sets, clear crisis guidance, and honest limits about what Nura is.",
  },
  {
    icon: BookOpen,
    title: "Resources that explain",
    body: "Short guides for EMDR and therapy support — written for real people, not jargon.",
  },
];

/** Large alternating image + copy blocks (fills the page between about and how-it-works). */
const SHOWCASES = [
  {
    kicker: "Guided sessions",
    title: "A quiet workspace for difficult moments",
    body: "Start with intake and grounding, then move through protocol phases with a guide that stays with you — check-ins after each set, not a rush to finish.",
    points: [
      "Structured phases from intake through closure",
      "Check-ins after visual sets in Guided mode",
      "Clear copy when you need a pause or grounding",
    ],
    image: IMG.practiceSpace,
    alt: "Quiet practice space with soft light",
  },
  {
    kicker: "Free mode",
    title: "The moving ball, on your terms",
    body: "When you already know what you need, Free mode gives you the visual set without chat — adjust speed and sound, then go fullscreen when you are ready.",
    points: [
      "Moving ball for visual bilateral sets",
      "Controls for speed, sound, and repeats",
      "Immersive fullscreen while a set is running",
    ],
    image: IMG.calmRest,
    alt: "Calm rest and focus",
  },
  {
    kicker: "Resources",
    title: "Guides you can actually finish",
    body: "Short articles on EMDR, safety, and what to expect — written for real people between sessions, not textbooks.",
    points: [
      "Readable articles and short videos",
      "Honest limits — self-help, not a licensed therapist",
      "Linked from the app when you need context",
    ],
    image: IMG.reading,
    alt: "Reading and reflection",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Create your space",
    summary: "Sign up and land in a calm workspace.",
    body: "Create an account, finish a short onboarding, and open a session workspace built for focus — not a busy dashboard.",
    bullets: [
      "Private sessions tied to your account",
      "Trial time to explore before you commit",
      "Settings for sound and motion preferences",
    ],
    image: IMG.eveningLight,
    alt: "Warm evening light in a quiet room",
  },
  {
    n: "02",
    title: "Choose Guided or Free",
    summary: "Pick the mode that fits today.",
    body: "Guided walks you through protocol phases with a session guide. Free mode is the moving ball only — useful when you already know your target.",
    bullets: [
      "Guided: phases, check-ins, and grounding",
      "Free: visual sets without chat",
      "Switch modes when you start a new session",
    ],
    image: IMG.supportTalk,
    alt: "Supportive conversation in a calm setting",
  },
  {
    n: "03",
    title: "Run your sets",
    summary: "Ground, then start visual sets.",
    body: "Follow grounding and intake, then run sets with the moving ball when you are ready. Adjust the controls bar, then go immersive while a set runs.",
    bullets: [
      "Speed, sound, and repeats in session controls",
      "Check in after each set in Guided mode",
      "Fullscreen while a set is running",
    ],
    image: IMG.greenLandscape,
    alt: "Soft green landscape for calm focus",
  },
  {
    n: "04",
    title: "Stay supported",
    summary: "Resources and plans when you need more.",
    body: "Browse guides, track trial time, and upgrade when you want unlimited guided sessions and full Free mode — cancel anytime in the portal.",
    bullets: [
      `${TRIAL_DAYS}-day trial with guided sessions included`,
      "Weekly, monthly, or yearly billing",
      "Customer portal for billing anytime",
    ],
    image: IMG.together,
    alt: "People sharing a calm supportive moment",
  },
];

const OFFERS = [
  {
    href: appPath("/create-account"),
    tag: "Now",
    title: "Guided sessions",
    body: "Visual sets with a moving ball, optional voice, and an on-protocol guide — built for practice between sessions.",
    image: IMG.supportTalk,
  },
  {
    href: "/resources",
    tag: "Now",
    title: "Resources",
    body: "Readable guides for EMDR, safety, and what to expect in therapy support — short enough to finish.",
    image: IMG.reading,
  },
  {
    href: "/about",
    tag: "About",
    title: "About Nura",
    body: "How guided support fits into your practice — and what comes next as we grow the product.",
    image: IMG.careDesk,
  },
];

const TESTIMONIALS = [
  {
    quote:
      "The interface feels calm enough to actually stay with a difficult memory. Free mode lets me practice without pressure.",
    name: "Maya L.",
    role: "Trial member",
    image: IMG.avatarMaya,
  },
  {
    quote:
      "Guided mode walks me through phases instead of dumping me into a blank screen.",
    name: "James R.",
    role: "Monthly plan",
    image: IMG.avatarJames,
  },
  {
    quote:
      "Resources are short and clear — finally something that explains EMDR without overwhelming me.",
    name: "Sophie T.",
    role: "Resources reader",
    image: IMG.avatarSophie,
  },
  {
    quote:
      "I use it between sessions. The steps feel structured but never rushed.",
    name: "Daniel K.",
    role: "Yearly plan",
    image: IMG.avatarDaniel,
  },
  {
    quote:
      "I open Free mode when I need a quiet visual set — no chat, no pressure, just the moving ball.",
    name: "Elena P.",
    role: "Weekly plan",
    image: IMG.avatarMaya,
  },
  {
    quote:
      "Nura stays out of the way. I get enough structure to feel held, without clinical noise.",
    name: "Chris W.",
    role: "Trial member",
    image: IMG.avatarJames,
  },
];

function StoriesStars({ className }: { className?: string }) {
  return (
    <span className={className ?? "fe-stories-stars"} aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
      ))}
    </span>
  );
}

function StoriesSection() {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const hoverPaused = useRef(false);
  const manualPaused = useRef(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let raf = 0;
    let last = performance.now();
    const speed = 36;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!hoverPaused.current && !manualPaused.current) {
        el.scrollLeft += speed * dt;
        const half = el.scrollWidth / 2;
        if (half > 0 && el.scrollLeft >= half) {
          el.scrollLeft -= half;
        }
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, []);

  function pauseBriefly() {
    manualPaused.current = true;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      manualPaused.current = false;
    }, 4500);
  }

  function scrollByDir(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    pauseBriefly();
    const card = el.querySelector(".fe-stories-card");
    const step =
      (card instanceof HTMLElement ? card.offsetWidth : 320) + 16;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  const loop = [...TESTIMONIALS, ...TESTIMONIALS];

  return (
    <section className="fe-stories" aria-labelledby="fe-stories-title">
      <div className="fe-container">
        <div className="fe-stories-intro">
          <h2 id="fe-stories-title" className="fe-stories-title">
            Their experience, your confidence
          </h2>
          <p className="fe-stories-sub">
            Voices from people using {BRAND_SPOKEN} between sessions — calm
            enough to stay with the work.
          </p>
        </div>

        <div className="fe-stories-toolbar">
          <div className="fe-stories-rating">
            <div className="fe-stories-avatars" aria-hidden>
              {TESTIMONIALS.slice(0, 4).map((t) => (
                <DecorativeImg
                  key={t.name}
                  src={t.image}
                  width={40}
                  height={40}
                  className="fe-stories-avatar-stack"
                />
              ))}
            </div>
            <div className="fe-stories-rating-copy">
              <div className="fe-stories-rating-row">
                <StoriesStars />
                <strong>4.9</strong>
              </div>
              <p>From early members exploring {BRAND_SPOKEN}</p>
            </div>
          </div>
          <div className="fe-stories-nav">
            <button
              type="button"
              className="fe-stories-nav-btn"
              aria-label="Previous stories"
              onClick={() => scrollByDir(-1)}
            >
              <ChevronLeft size={20} aria-hidden />
            </button>
            <button
              type="button"
              className="fe-stories-nav-btn fe-stories-nav-btn--accent"
              aria-label="Next stories"
              onClick={() => scrollByDir(1)}
            >
              <ChevronRight size={20} aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <div
        className="fe-stories-scroller"
        ref={scrollerRef}
        onMouseEnter={() => {
          hoverPaused.current = true;
        }}
        onMouseLeave={() => {
          hoverPaused.current = false;
        }}
        onFocusCapture={() => {
          hoverPaused.current = true;
        }}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            hoverPaused.current = false;
          }
        }}
      >
        <div className="fe-stories-track">
          {loop.map((t, i) => (
            <blockquote
              key={`${t.name}-${i}`}
              className="fe-stories-card"
            >
              <span className="fe-stories-quote" aria-hidden>
                &ldquo;
              </span>
              <p>{t.quote}</p>
              <StoriesStars className="fe-stories-card-stars" />
              <footer>
                <DecorativeImg
                  src={t.image}
                  width={48}
                  height={48}
                  className="fe-stories-card-avatar"
                />
                <span className="fe-stories-card-meta">
                  <strong>{t.name}</strong>
                  <span>{t.role}</span>
                </span>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

const HERO_IMAGE = IMG.supportTalk;
const HERO_PREVIEW_IMAGE = IMG.calmRest;

const STATS = [
  { target: 8, suffix: "", label: "Protocol phases in Guided mode" },
  { target: 2, suffix: "", label: "Session modes — Guided & Free" },
  { target: TRIAL_DAYS, suffix: " days", label: "Trial to explore Nura" },
  { target: TRIAL_GUIDED_SESSIONS, suffix: "", label: "Guided sessions in trial" },
];

const PRICING_CARDS: {
  id: BillingPlanId;
  icon: typeof Calendar;
  title: string;
  badge?: string;
  featured?: boolean;
  details: string;
  /** Extra line under the period, e.g. yearly → monthly equivalent */
  periodNote?: string;
  features: string[];
}[] = [
  {
    id: "weekly",
    icon: Calendar,
    title: "Weekly",
    details:
      "Flexible billing if you want to stay light — same full app, billed each week.",
    features: [
      "Unlimited guided sessions",
      "Full Free mode (moving ball)",
      "No ads on paid plans",
      "Cancel anytime in the portal",
      "Same session workspace as other plans",
    ],
  },
  {
    id: "yearly",
    icon: HeartHandshake,
    title: "Yearly",
    badge: "Best value",
    featured: true,
    details:
      "One calm price for a full year — the lowest cost per month if Nura is part of your routine.",
    periodNote: "≈ $8.25 / month",
    features: [
      "Everything in Monthly",
      "Lowest cost per month",
      "Pay once, fewer interruptions",
      "Customer portal for billing",
      "Keep your history and settings",
    ],
  },
  {
    id: "monthly",
    icon: Sparkles,
    title: "Monthly",
    badge: "Most popular",
    details:
      "The everyday plan for practice between sessions — billed monthly, cancel anytime.",
    features: [
      "Unlimited guided + Free mode",
      "Full protocol phases & check-ins",
      "Resources library access",
      "Customer portal for billing",
      "Upgrade or switch plans later",
    ],
  },
];

function AboutRevealText({ text }: { text: string }) {
  const words = text.trim().split(/\s+/);
  return (
    <h2 className="fe-about-title">
      {words.map((word, i) => (
        <span key={`w-${i}`}>
          <span className="fe-about-word">{word}</span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </h2>
  );
}

function BlogSection({ posts }: { posts: LandingBlogPost[] }) {
  if (posts.length === 0) return null;

  return (
    <section className="fe-blog" id="blog" aria-labelledby="fe-blog-title">
      <div className="fe-container">
        <div className="fe-blog-head">
          <h2 id="fe-blog-title" className="fe-blog-title">
            Guides and calm reading
          </h2>
          <div className="fe-blog-head-aside">
            <p className="fe-blog-head-copy">
              Short articles for EMDR practice, grounding, and when to stop.
            </p>
            <Link href="/blog" className="fe-blog-cta">
              View all guides
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
        </div>

        <div className="fe-blog-grid">
          {posts.map((post) => (
            <article key={post.slug} className="fe-blog-card">
              <Link
                href={`/blog/${post.slug}`}
                className="fe-blog-card-media"
              >
                <Image
                  src={post.coverUrl || IMG.reading}
                  alt=""
                  fill
                  priority={false}
                  sizes="(max-width: 900px) 100vw, 33vw"
                  className="fe-blog-card-image"
                />
              </Link>
              <p className="fe-blog-card-tag">{post.tag}</p>
              <h3 className="fe-blog-card-title">
                <Link href={`/blog/${post.slug}`}>
                  {post.title}
                </Link>
              </h3>
              <p className="fe-blog-card-excerpt">{post.summary}</p>
              <div className="fe-blog-card-meta">
                <span className="fe-blog-card-logo" aria-hidden>
                  <BrandMark tone="black" />
                </span>
                <span className="fe-blog-card-byline">
                  <strong>{BRAND_SPOKEN}</strong>
                  <time dateTime={post.createdAt}>
                    {formatBlogDate(post.createdAt)}
                  </time>
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQ_ITEMS = [
  {
    q: "What is Nura?",
    a: "Nura is a calm self-help workspace for guided EMDR practice and Free visual sets — structured support in the app, on your schedule. It is not a licensed therapist or emergency care.",
  },
  {
    q: "What is the difference between Guided and Free?",
    a: "Guided walks you through protocol phases with check-ins. Free is visual sets only — you control the moving ball, speed, and timing yourself.",
  },
  {
    q: "Do I need a therapist to use it?",
    a: "No. Nura is built for practice between sessions or on your own. If you are in crisis, contact local emergency services — the app does not replace professional care.",
  },
  {
    q: "How does the trial work?",
    a: `New accounts get a ${TRIAL_DAYS}-day trial with a limited number of guided sessions and Free session time. Paid plans unlock the full app with no trial caps.`,
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Manage or cancel billing in the customer portal from your account — no phone calls required.",
  },
] as const;

function FaqSection() {
  const [open, setOpen] = useState(0);

  return (
    <section className="fe-faq" id="faq" aria-labelledby="fe-faq-title">
      <div className="fe-container">
        <div className="fe-faq-head fe-animate">
          <p className="fe-section-kicker">FAQ</p>
          <h2 id="fe-faq-title" className="fe-faq-title">
            Questions, answered calmly
          </h2>
          <p className="fe-faq-sub">
            Short answers about how Nura works — before you start a trial or open a
            session.
          </p>
        </div>
        <div className="fe-faq-list">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.q}
                className={`fe-faq-item fe-animate${isOpen ? " is-open" : ""}`}
              >
                <button
                  type="button"
                  className="fe-faq-q"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                >
                  <span>{item.q}</span>
                  <span className="fe-faq-icon" aria-hidden>
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen ? <p className="fe-faq-a">{item.a}</p> : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function HomeLanding({
  blogPosts = [],
}: {
  blogPosts?: LandingBlogPost[];
}) {
  const landingRef = useRef<HTMLDivElement | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  useLandingMotion(landingRef);

  useEffect(() => {
    let stop = scheduleScrollToLandingHash({ consumePending: true });
    const onHashChange = () => {
      stop();
      stop = scheduleScrollToLandingHash({ consumePending: true });
    };
    window.addEventListener("hashchange", onHashChange);
    return () => {
      stop();
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  const step = STEPS[activeStep];

  return (
    <div ref={landingRef} className="fe-landing">
      <section className="fe-hero" id="home">
        <div className="fe-hero-image-wrap">
          <div className="fe-hero-image">
            <Image
              src={HERO_IMAGE}
              alt="Person in a calm, supportive setting"
              fill
              priority
              sizes="100vw"
              className="fe-hero-image-bg"
            />
            <div className="fe-hero-image-overlay" aria-hidden />
            <div className="fe-hero-content-wrap">
              <div className="fe-container">
                <div className="fe-hero-info-inner">
                  <div className="fe-hero-left">
                    <p className="fe-hero-kicker">The time is right for</p>
                    <h1 className="fe-hero-title">
                      <span className="fe-hero-title-line">
                        {["Support", "for", "therapy,"].map((word, i, arr) => (
                          <span key={word} className="fe-split-line">
                            <span className="fe-split-word">
                              {word}
                              {i < arr.length - 1 ? "\u00A0" : ""}
                            </span>
                          </span>
                        ))}
                      </span>
                      <span className="fe-hero-title-line fe-hero-title-line--accent">
                        <em>
                          {["Starting", "with", "EMDR."].map((word, i, arr) => (
                            <span key={word} className="fe-split-line">
                              <span className="fe-split-word">
                                {word}
                                {i < arr.length - 1 ? "\u00A0" : ""}
                              </span>
                            </span>
                          ))}
                        </em>
                      </span>
                    </h1>
                  </div>
                  <div className="fe-hero-right">
                    <p className="fe-hero-description">
                      A calm place for guided EMDR sessions and readable therapy
                      resources — structured support in the app, on your schedule.
                    </p>
                    <div className="fe-hero-card-row">
                      <div className="fe-hero-inner-card">
                        <span className="fe-hero-inner-icon" aria-hidden>
                          <HeartHandshake size={22} strokeWidth={1.5} />
                        </span>
                        <div className="fe-hero-inner-text">
                          <p className="fe-hero-inner-label">
                            Support you can trust
                          </p>
                          <Link href="/resources" className="fe-hero-inner-link">
                            Browse resources
                          </Link>
                        </div>
                      </div>
                      <Link
                        href="/resources"
                        className="fe-hero-video-thumb"
                        aria-label="Browse resources"
                      >
                        <DecorativeImg
                          src={HERO_PREVIEW_IMAGE}
                          width={160}
                          height={112}
                          className="fe-hero-video-image"
                        />
                        <span className="fe-hero-video-play" aria-hidden>
                          <Play size={18} fill="currentColor" />
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="fe-about">
        <div className="fe-container fe-about-inner">
          <div className="fe-about-kicker-wrap fe-animate">
            <Users size={16} strokeWidth={1.75} aria-hidden />
            <p className="fe-about-kicker">Here when you need us</p>
          </div>
          <AboutRevealText text={ABOUT_COPY} />
        </div>

        <div className="fe-about-marquee fe-animate" aria-hidden>
          <div className="fe-about-marquee-fade fe-about-marquee-fade--left" />
          <div className="fe-about-marquee-fade fe-about-marquee-fade--right" />
          <div className="fe-about-marquee-track">
            {[...ABOUT_IMAGES, ...ABOUT_IMAGES].map((img, i) => (
              <div key={`${img.src}-${i}`} className="fe-about-marquee-item">
                <DecorativeImg
                  src={img.src}
                  width={280}
                  height={280}
                  className="fe-about-marquee-image"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="fe-container fe-about-cta-wrap fe-animate">
          <Link href="/about" className="fe-about-cta">
            More about {BRAND_SPOKEN}
            <span className="fe-about-cta-icon" aria-hidden>
              <ArrowRight size={14} />
            </span>
          </Link>
        </div>
      </section>

      <section className="fe-section-block">
        <div className="fe-container">
          <div className="fe-section-head fe-animate">
            <p className="fe-section-kicker">Why {BRAND_SPOKEN}</p>
            <h2 className="fe-section-title">Support crafted around your pace</h2>
            <p className="fe-section-body">
              Every surface is built for calm focus — guided protocol when you want
              structure, Free mode when you just need the moving ball, and resources
              you can finish in one sitting.
            </p>
          </div>
          <div className="fe-feature-grid">
            {FEATURES.map((f) => (
              <article key={f.title} className="fe-feature-card fe-animate">
                <f.icon size={22} strokeWidth={1.75} aria-hidden />
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="fe-showcase-section">
        <div className="fe-container">
          <div className="fe-section-head fe-section-head--center fe-animate">
            <p className="fe-section-kicker">Inside the app</p>
            <h2 className="fe-section-title">
              Tools that stay with you between sessions
            </h2>
            <p className="fe-section-body fe-section-body--center">
              Large, quiet blocks for the parts of Nura you will use most — not a
              thin strip of icons.
            </p>
          </div>
          <div className="fe-showcase-list">
            {SHOWCASES.map((block, i) => (
              <article
                key={block.title}
                className={`fe-showcase fe-animate${i % 2 === 1 ? " fe-showcase--flip" : ""}`}
              >
                <div className="fe-showcase-media">
                  <Image
                    src={block.image}
                    alt={block.alt}
                    width={960}
                    height={720}
                    className="fe-showcase-image"
                    priority={false}
                    sizes="(max-width: 900px) 100vw, 48vw"
                  />
                </div>
                <div className="fe-showcase-copy">
                  <p className="fe-section-kicker">{block.kicker}</p>
                  <h3 className="fe-showcase-title">{block.title}</h3>
                  <p className="fe-showcase-body">{block.body}</p>
                  <ul className="fe-showcase-points">
                    {block.points.map((p) => (
                      <li key={p}>
                        <Check size={16} strokeWidth={2.25} aria-hidden />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="fe-how-section" id="how-it-works">
        <div className="fe-container">
          <div className="fe-how-head fe-animate">
            <p className="fe-section-kicker fe-section-kicker--on-dark">
              How it works
            </p>
            <h2 className="fe-how-title">Personalized care, every step</h2>
            <p className="fe-how-sub">
              Four calm steps from signup to ongoing support — same guided sessions
              and Free mode once you are in.
            </p>
          </div>

          <div className="fe-how-layout">
            <div
              className="fe-how-tabs fe-animate"
              role="tablist"
              aria-label="How it works"
            >
              {STEPS.map((s, i) => (
                <button
                  key={s.n}
                  type="button"
                  role="tab"
                  aria-selected={activeStep === i}
                  className={`fe-how-tab${activeStep === i ? " is-active" : ""}`}
                  onClick={() => setActiveStep(i)}
                >
                  <span className="fe-how-tab-n">{s.n}</span>
                  <span className="fe-how-tab-text">
                    <span className="fe-how-tab-title">{s.title}</span>
                    <span className="fe-how-tab-summary">{s.summary}</span>
                  </span>
                </button>
              ))}
            </div>

            <div className="fe-how-panel fe-animate" role="tabpanel" key={step.n}>
              <div className="fe-how-panel-copy">
                <h3>{step.title}</h3>
                <p>{step.body}</p>
                <ul>
                  {step.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
                <Link
                  href={appPath("/create-account")}
                  className="fe-how-cta"
                >
                  Get started
                  <ArrowRight size={16} aria-hidden />
                </Link>
              </div>
              <div className="fe-how-panel-media">
                <Image
                  src={step.image}
                  alt={step.alt}
                  width={720}
                  height={900}
                  className="fe-how-panel-image"
                  sizes="(max-width: 900px) 100vw, 42vw"
                  priority={false}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="fe-section-block">
        <div className="fe-container">
          <div className="fe-section-head fe-animate">
            <p className="fe-section-kicker">What you can use today</p>
            <h2 className="fe-section-title">
              Built for therapy support — starting with EMDR
            </h2>
            <p className="fe-section-body">
              Explore the product hubs on the public site, then open the app when
              you are ready for a session.
            </p>
          </div>
          <div className="fe-offer-cards">
            {OFFERS.map((offer) => (
              <Link key={offer.href} href={offer.href} className="fe-offer-card">
                <div className="fe-offer-image-wrap">
                  <Image
                    src={offer.image}
                    alt=""
                    width={640}
                    height={420}
                    className="fe-offer-image"
                    priority={false}
                    sizes="(max-width: 900px) 100vw, 33vw"
                  />
                </div>
                <div className="fe-offer-body">
                  <span className="fe-offer-tag">{offer.tag}</span>
                  <h3>{offer.title}</h3>
                  <p>{offer.body}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="fe-stats-section fe-section-block">
        <div className="fe-container">
          <div className="fe-section-head fe-section-head--center fe-animate">
            <p className="fe-section-kicker">Our journey in numbers</p>
            <h2 className="fe-section-title">A community built on calm and clarity</h2>
          </div>
          <div className="fe-stats-grid">
            {STATS.map((s) => (
              <div key={s.label} className="fe-stat fe-animate">
                <p
                  className="fe-count"
                  data-target={String(s.target)}
                  data-suffix={s.suffix}
                >
                  0{s.suffix}
                </p>
                <p className="fe-stat-label">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="fe-pricing-section" id="prices">
        <div className="fe-container">
          <div className="fe-pricing-head fe-animate">
            <h2 className="fe-pricing-title">Plans tailored to your pace</h2>
            <p className="fe-pricing-sub">
              Start with a {TRIAL_DAYS}-day trial. Every paid plan unlocks the same
              guided sessions and Free mode — pick how often you want to be billed.
            </p>
          </div>

          <div className="fe-pricing-grid">
            {PRICING_CARDS.map((card) => {
              const plan = BILLING_PLANS[card.id];
              const featured = Boolean(card.featured);
              const Icon = card.icon;
              return (
                <article
                  key={card.id}
                  className={`fe-price-card fe-animate${featured ? " fe-price-card--featured" : ""}`}
                >
                  <div className="fe-price-card-top">
                    <span className="fe-price-card-icon" aria-hidden>
                      <Icon size={22} strokeWidth={1.5} />
                    </span>
                    <div className="fe-price-card-cost">
                      <span className="fe-price-card-amount">
                        {plan.displayPrice}
                      </span>
                      <span className="fe-price-card-period">
                        {plan.displayPeriod.replace("/", "/per ")}
                      </span>
                      {card.periodNote ? (
                        <span className="fe-price-card-period-note">
                          {card.periodNote}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <h3 className="fe-price-card-name">{card.title}</h3>
                  {card.badge ? (
                    <p className="fe-price-card-hint">{card.badge}</p>
                  ) : null}
                  <p className="fe-price-card-details">{card.details}</p>
                  <Link
                    href={appPath("/create-account")}
                    className={`fe-price-card-cta${featured ? " fe-price-card-cta--accent" : ""}`}
                  >
                    Get started
                    <ArrowRight size={16} aria-hidden />
                  </Link>
                  <p className="fe-price-card-features-label">Features</p>
                  <ul className="fe-price-card-features">
                    {card.features.map((f) => (
                      <li key={f}>
                        <Check
                          size={16}
                          strokeWidth={2.25}
                          className="fe-price-card-check"
                          aria-hidden
                        />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <StoriesSection />

      <BlogSection posts={blogPosts} />

      <FaqSection />
    </div>
  );
}
