import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { sahanUrl, trackAdClick } from "@/components/SahanAd";

/**
 * Mobile-only sticky footer advert for Sahan Profiles.
 *
 * Deliberately restrained: it stays hidden until the reader is a third of the
 * way down the page, can be dismissed, and stays dismissed for a week. It also
 * lifts the page bottom padding while visible so it never covers the last line
 * of a job description or an apply button.
 */

const DISMISS_KEY = "sahan-sticky-dismissed-until";
const DISMISS_DAYS = 7;
const SHOW_AFTER = 0.33; // fraction of the page scrolled

const VARIANTS = ["a-cv", "b-verified", "c-company"] as const;

function dismissedRecently() {
  try {
    const until = window.localStorage.getItem(DISMISS_KEY);
    return !!until && Number(until) > Date.now();
  } catch {
    return false;
  }
}

export default function SahanStickyAd({
  variant = "a-cv",
}: {
  variant?: (typeof VARIANTS)[number];
}) {
  const [visible, setVisible] = useState(false);
  const [closed, setClosed] = useState(true);

  useEffect(() => {
    if (dismissedRecently()) return;
    setClosed(false);

    const onScroll = () => {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      setVisible(window.scrollY / scrollable > SHOW_AFTER);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Reserve space so the bar never sits on top of the last line of a job
  // description or an apply button.
  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.paddingBottom;
    document.body.style.paddingBottom = "3.5rem";
    return () => {
      document.body.style.paddingBottom = prev;
    };
  }, [visible]);

  const dismiss = () => {
    setVisible(false);
    setClosed(true);
    try {
      window.localStorage.setItem(
        DISMISS_KEY,
        String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000),
      );
    } catch {
      /* private mode — it simply reappears next visit */
    }
  };

  if (closed) return null;

  return (
    <div
      className={
        "fixed inset-x-0 bottom-0 z-40 md:hidden " +
        "transition-transform duration-500 ease-out " +
        (visible ? "translate-y-0" : "translate-y-full")
      }
      aria-hidden={!visible}
    >
      <div className="relative border-t border-black/10 bg-white/95 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur">
        <a
          href={sahanUrl("sticky", variant)}
          target="_blank"
          rel="sponsored noopener noreferrer"
          onClick={() => trackAdClick("sticky", variant)}
          tabIndex={visible ? 0 : -1}
          className="block pr-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0077B5]"
        >
          <img
            src={`/ads/sahanprofiles/sticky-bar__${variant}.png`}
            alt="Sahan Profiles — create a free professional profile"
            loading="lazy"
            decoding="async"
            className="h-14 w-full object-contain object-left px-3"
          />
        </a>

        <button
          type="button"
          onClick={dismiss}
          tabIndex={visible ? 0 : -1}
          aria-label="Dismiss advertisement"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077B5]"
        >
          <X className="h-4 w-4" />
        </button>

        <span className="pointer-events-none absolute left-3 top-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
          Ad
        </span>
      </div>
    </div>
  );
}
