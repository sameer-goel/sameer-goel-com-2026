"use client";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import { TRIAD } from "@/content/site";

// Region glows placed over the brain emblem (brain faces left). Symbolic, not anatomical precision.
const REGIONS: Record<string, { x: number; y: number; r: number; color: string }> = {
  why: { x: 22, y: 42, r: 26, color: "255,138,91" },
  how: { x: 47, y: 18, r: 18, color: "247,241,231" },
  what: { x: 70, y: 46, r: 28, color: "141,180,255" },
};

export default function Triad() {
  const [active, setActive] = useState<"why" | "what" | "how">("why");
  const reduce = useReducedMotion();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const item = TRIAD.find((t) => t.key === active)!;

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const n = TRIAD.length;
    const next = e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i - 1 + n) % n : -1;
    if (next < 0) return;
    e.preventDefault();
    setActive(TRIAD[next].key);
    tabs.current[next]?.focus();
  };

  return (
    <div className="grid items-center gap-12 lg:grid-cols-[.95fr_1.05fr]">
      <figure className="relative">
        <div className="relative mx-auto max-w-[560px]" role="img" aria-label={`Brain emblem highlighting the ${item.region}, linked to ${item.label}`}>
          {Object.entries(REGIONS).map(([k, r]) => (
            <motion.span
              key={k}
              aria-hidden
              className="absolute rounded-full"
              style={{
                left: `${r.x - r.r}%`, top: `${r.y - r.r * 1.13}%`, width: `${r.r * 2}%`, height: `${r.r * 2 * 1.13}%`,
                background: `radial-gradient(closest-side, rgba(${r.color},.55), rgba(${r.color},0))`,
              }}
              animate={{ opacity: k === active ? 1 : 0, scale: k === active ? 1 : 0.85 }}
              transition={{ duration: reduce ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
          ))}
          <img src="/img/emblem-1000.webp" alt="" width={1000} height={881} loading="lazy" className="relative w-full" />
        </div>
        <figcaption className="mt-4 flex items-baseline gap-3">
          <span className="label text-copper">{item.region}</span>
          <span className="text-sm text-mist">{item.regionNote}</span>
        </figcaption>
      </figure>

      <div>
        <div role="tablist" aria-label="Why, what and how" className="flex gap-2 border-b border-line">
          {TRIAD.map((t, i) => (
            <button
              key={t.key}
              ref={(el) => { tabs.current[i] = el; }}
              role="tab"
              id={`tab-${t.key}`}
              aria-selected={active === t.key}
              aria-controls={`panel-${t.key}`}
              tabIndex={active === t.key ? 0 : -1}
              onClick={() => setActive(t.key)}
              onKeyDown={(e) => onKey(e, i)}
              className={`relative -mb-px px-4 py-3 display text-2xl transition-colors ${
                active === t.key ? "text-ivory" : "text-mist/60 hover:text-mist"
              }`}
            >
              {t.label}
              {active === t.key && <motion.span layoutId="triad-underline" className="absolute inset-x-0 bottom-0 h-px bg-copper" />}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={item.key}
            role="tabpanel"
            id={`panel-${item.key}`}
            aria-labelledby={`tab-${item.key}`}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -10 }}
            transition={{ duration: 0.45 }}
            className="pt-8"
          >
            <h3 className="display text-[clamp(1.8rem,3.4vw,2.8rem)] leading-tight">{item.title}</h3>
            <ul className="mt-6 space-y-3">
              {item.lines.map((l) => (
                <li key={l} className="flex gap-4 text-mist">
                  <span aria-hidden className="mt-3 h-px w-5 shrink-0 bg-copper" />
                  {l}
                </li>
              ))}
            </ul>
            <Link href={item.href} className="mt-8 inline-flex items-center gap-2 border-b border-copper pb-1 hover:text-copper">
              {item.cta} <span aria-hidden>→</span>
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
