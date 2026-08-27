import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Sahan Profiles house advert.
 *
 * Creatives live in `client/public/ads/sahanprofiles/` (Vite publicDir), so they
 * are served verbatim at `/ads/sahanprofiles/*`. Three copy variants exist for
 * every slot; the component cross-fades between them so a visitor who stays on
 * a long job page sees more than one message.
 *
 * Slots that ship an art-directed mobile crop swap the source AND the frame
 * ratio at the same breakpoint — the aspect classes below are written out in
 * full because Tailwind only sees literal strings.
 */

const BASE = "/ads/sahanprofiles";
const TARGET = "https://www.sahanprofiles.com/";

const VARIANTS = ["a-cv", "b-verified", "c-company"] as const;
type Variant = (typeof VARIANTS)[number];

/** Alt text doubles as the accessible name of the link. */
const ALT: Record<Variant, string> = {
  "a-cv":
    "Sahan Profiles — build a free CV from eight editorial templates",
  "b-verified":
    "Sahan Profiles — a structured, verifiable record of the work you have delivered",
  "c-company":
    "Sahan Profiles — tender-ready company profiles with projects, clients and org chart",
};

export type SahanAdSlot =
  | "hero"
  | "mpu"
  | "skyscraper"
  | "infeed"
  | "footer"
  | "sticky";

interface SlotSpec {
  /** File prefix for the wide creative. */
  desktop: string;
  /** File prefix for the art-directed narrow creative, if one exists. */
  mobile?: string;
  /** Breakpoint at which the wide creative takes over. */
  swapAt?: string;
  /** Static Tailwind aspect classes — must be literals for the JIT scanner. */
  frame: string;
  sizes: string;
}

const SLOTS: Record<SahanAdSlot, SlotSpec> = {
  hero: {
    desktop: "hero-desktop",
    mobile: "hero-mobile",
    swapAt: "(min-width: 640px)",
    frame: "aspect-[656/360] sm:aspect-[1536/256]",
    sizes: "(min-width: 640px) 768px, 100vw",
  },
  mpu: {
    desktop: "mpu",
    frame: "aspect-[768/600]",
    sizes: "(min-width: 1280px) 384px, 320px",
  },
  skyscraper: {
    desktop: "skyscraper",
    frame: "aspect-[768/1152]",
    sizes: "(min-width: 1280px) 384px, 320px",
  },
  infeed: {
    desktop: "infeed-desktop",
    mobile: "infeed-mobile",
    swapAt: "(min-width: 768px)",
    frame: "aspect-[660/440] md:aspect-[1792/280]",
    sizes: "(min-width: 768px) 896px, 100vw",
  },
  footer: {
    desktop: "footer-leaderboard",
    frame: "aspect-[2400/240]",
    sizes: "(min-width: 1536px) 1200px, 100vw",
  },
  sticky: {
    desktop: "sticky-bar",
    frame: "aspect-[750/112]",
    sizes: "100vw",
  },
};

const ROTATE_MS = 8000;

// Two units can share a viewport — the hero banner and the sidebar unit sit
// above the fold together on the home page. Offset each slot's starting
// variant so they never open on the same creative. Derived from the slot
// name rather than randomised, so the choice is stable across renders.
const SLOT_ORDER = Object.keys(SLOTS);
function startIndex(slot: SahanAdSlot) {
  return SLOT_ORDER.indexOf(slot) % VARIANTS.length;
}

export function sahanUrl(slot: string, variant: string) {
  return (
    `${TARGET}?utm_source=somkenjobs&utm_medium=display` +
    `&utm_campaign=sahan_house&utm_content=${slot}_${variant}`
  );
}

/** Fire-and-forget GA4 event; gtag is loaded lazily so it may not exist yet. */
export function trackAdClick(slot: string, variant: string) {
  try {
    (window as any).gtag?.("event", "select_promotion", {
      promotion_name: "sahanprofiles",
      creative_slot: slot,
      creative_name: variant,
    });
  } catch {
    /* analytics must never break a click-through */
  }
}

interface SahanAdProps {
  slot: SahanAdSlot;
  className?: string;
  /** Cross-fade through the copy variants. */
  rotate?: boolean;
  /** Show the "Sponsored" rule above the creative. */
  label?: boolean;
  /** Render only this variant (disables rotation). */
  variant?: Variant;
  /** Skip the frame chrome — the sticky bar draws its own. */
  bare?: boolean;
  /** Light the label and dots for placement on a dark panel. */
  onDark?: boolean;
}

export default function SahanAd({
  slot,
  className,
  rotate = true,
  label = true,
  variant,
  bare = false,
  onDark = false,
}: SahanAdProps) {
  const spec = SLOTS[slot];
  const fixed = variant ? VARIANTS.indexOf(variant) : -1;
  const [index, setIndex] = useState(
    fixed >= 0 ? fixed : startIndex(slot),
  );
  const [ready, setReady] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const paused = useRef(false);

  // Native loading="lazy" proved unreliable for units far down a long job
  // page — they stayed unfetched even once scrolled into view. Drive the
  // fetch from an observer instead so a creative always loads just before it
  // is needed, and nothing loads for an ad the reader never reaches.
  useEffect(() => {
    const el = frameRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setReady(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setReady(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!rotate || fixed >= 0 || !ready) return;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const id = window.setInterval(() => {
      if (!paused.current) setIndex((i) => (i + 1) % VARIANTS.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [rotate, fixed, ready]);

  const active = VARIANTS[index];

  return (
    <aside
      className={cn("not-prose", className)}
      aria-label="Advertisement"
      onMouseEnter={() => {
        paused.current = true;
      }}
      onMouseLeave={() => {
        paused.current = false;
      }}
    >
      {label && (
        <div className="mb-2 flex items-center gap-2">
          <span
            className={cn(
              "text-[10px] font-semibold uppercase tracking-[0.14em]",
              onDark ? "text-white/70" : "text-gray-400",
            )}
          >
            Sponsored
          </span>
          <span
            className={cn("h-px flex-1", onDark ? "bg-white/30" : "bg-gray-200")}
            aria-hidden="true"
          />
        </div>
      )}

      <a
        href={sahanUrl(slot, active)}
        target="_blank"
        rel="sponsored noopener noreferrer"
        onClick={() => trackAdClick(slot, active)}
        className={cn(
          "group block focus-visible:outline-none",
          !bare &&
            "overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/[0.07] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:ring-black/[0.12] focus-visible:ring-2 focus-visible:ring-[#0077B5] focus-visible:ring-offset-2",
        )}
      >
        <div
          ref={frameRef}
          className={cn("relative w-full overflow-hidden", spec.frame)}
        >
          {ready &&
            VARIANTS.map((v, i) => (
            <picture key={v}>
              {spec.mobile && spec.swapAt && (
                <source
                  media={spec.swapAt}
                  srcSet={`${BASE}/${spec.desktop}__${v}.png`}
                />
              )}
              <img
                src={`${BASE}/${spec.mobile ?? spec.desktop}__${v}.png`}
                alt={i === index ? ALT[v] : ""}
                aria-hidden={i === index ? undefined : true}
                decoding="async"
                fetchPriority="low"
                sizes={spec.sizes}
                className={cn(
                  "absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out",
                  "motion-safe:group-hover:scale-[1.01] motion-safe:transition-transform",
                  i === index ? "opacity-100" : "pointer-events-none opacity-0",
                )}
              />
            </picture>
            ))}
        </div>
      </a>

      {rotate && fixed < 0 && (
        <div className="mt-2 flex justify-center gap-1.5" aria-hidden="true">
          {VARIANTS.map((v, i) => (
            <button
              key={v}
              type="button"
              onClick={() => setIndex(i)}
              tabIndex={-1}
              aria-label={`Show advert ${i + 1}`}
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                i === index
                  ? onDark ? "w-4 bg-white/80" : "w-4 bg-gray-400"
                  : onDark ? "w-1 bg-white/40" : "w-1 bg-gray-300",
              )}
            />
          ))}
        </div>
      )}
    </aside>
  );
}
