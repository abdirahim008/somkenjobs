import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Building2, ArrowRight } from "lucide-react";

interface Slide {
  title: string;
  text: string;
  cta: string;
}

const SLIDES: Slide[] = [
  {
    title: "Are you an employer or recruiter?",
    text: "Publish your vacancies and reach thousands of East African professionals.",
    cta: "Register here",
  },
  {
    title: "Manage everything from one dashboard.",
    text: "Post, edit, and track all your job listings in a single place.",
    cta: "Get started",
  },
  {
    title: "Hire faster across the region.",
    text: "Connect with qualified candidates in Kenya, Somalia, Ethiopia & Djibouti.",
    cta: "Post a job",
  },
];

const ROTATE_MS = 6000;

interface RecruiterAdBannerProps {
  onRegister: () => void;
}

/**
 * A slim, auto-rotating advert in the hero inviting employers/recruiters to
 * register. Minimal and clean but noticeable (white card against the blue
 * hero). Auto-advance pauses on hover and is disabled for users who prefer
 * reduced motion.
 */
export default function RecruiterAdBanner({ onRegister }: RecruiterAdBannerProps) {
  const [index, setIndex] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const id = window.setInterval(() => {
      if (!paused.current) {
        setIndex((i) => (i + 1) % SLIDES.length);
      }
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="mx-auto mt-6 max-w-3xl px-4 sm:px-0"
      onMouseEnter={() => {
        paused.current = true;
      }}
      onMouseLeave={() => {
        paused.current = false;
      }}
    >
      <div className="relative overflow-hidden rounded-xl bg-white text-gray-900 shadow-lg ring-1 ring-black/5">
        <div className="flex items-stretch">
          <div className="hidden items-center justify-center bg-[#0077B5] px-4 text-white sm:flex">
            <Building2 className="h-6 w-6" aria-hidden="true" />
          </div>

          <div className="flex-1 p-4 sm:p-5">
            {/* All slides share one grid cell so the card height stays stable
                (sized to the tallest slide) and cross-fades without any jump. */}
            <div className="grid">
              {SLIDES.map((slide, i) => (
                <div
                  key={i}
                  aria-hidden={i !== index}
                  className={
                    "col-start-1 row-start-1 transition-opacity duration-700 " +
                    (i === index ? "opacity-100" : "pointer-events-none opacity-0")
                  }
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#0077B5]">
                        For Employers &amp; Recruiters
                      </p>
                      <p className="mt-0.5 text-base font-bold leading-snug">
                        {slide.title}
                      </p>
                      <p className="mt-0.5 text-sm text-gray-600">{slide.text}</p>
                    </div>
                    <Button
                      onClick={onRegister}
                      className="w-full shrink-0 justify-center bg-[#0077B5] text-white hover:bg-[#00669c] sm:w-auto"
                    >
                      {slide.cta}
                      <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex justify-center gap-1.5">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Show slide ${i + 1}`}
                  aria-current={i === index}
                  onClick={() => setIndex(i)}
                  className={
                    i === index
                      ? "h-1.5 w-5 rounded-full bg-[#0077B5] transition-all"
                      : "h-1.5 w-1.5 rounded-full bg-gray-300 transition-all hover:bg-gray-400"
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
