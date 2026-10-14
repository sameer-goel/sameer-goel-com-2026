"use client";
import Link from "next/link";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useEffect } from "react";
import NeuralField from "./NeuralField";
import { SITE } from "@/content/site";

/**
 * Brand hero: the SAMEER GOEL wordmark is the single focal point, with the
 * tagline and one line on what Sameer does. The neural field and the brain
 * emblem sit quietly behind it.
 */
export default function Hero() {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 18 });
  const sy = useSpring(my, { stiffness: 40, damping: 18 });
  const emX = useTransform(sx, (v) => v * 16);
  const emY = useTransform(sy, (v) => v * 10);

  useEffect(() => {
    if (reduce || !window.matchMedia("(pointer: fine)").matches) return;
    const on = (e: PointerEvent) => {
      mx.set(e.clientX / window.innerWidth - 0.5);
      my.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", on, { passive: true });
    return () => window.removeEventListener("pointermove", on);
  }, [reduce, mx, my]);

  const ease = [0.2, 0.72, 0.2, 1] as const;
  const fade = (delay: number) =>
    reduce ? {} : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 1.1, delay, ease } };

  return (
    <section aria-labelledby="hero-title" className="relative isolate min-h-[100svh] overflow-hidden bg-ink">
      {/* neural field: the only visual behind the name */}
      <div aria-hidden className="absolute inset-0 -z-10 opacity-45">
        <NeuralField />
      </div>

      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_30%_50%,rgb(16_24_32/.92)_25%,rgb(16_24_32/.4)_75%)]" />
      <div className="wrap relative flex min-h-[100svh] items-center pb-24 pt-28">
        <div>
          <motion.div {...fade(0.1)}>
            <h1 id="hero-title" className="wordmark text-[clamp(3.6rem,10vw,9rem)] uppercase !tracking-[-0.045em]">
              {SITE.name}
            </h1>
            <p className="label mt-4 !text-[.62rem] !tracking-[.22em] text-ivory/70">
              AI Solutions Architect · Forward Deployed Engineering
            </p>
            <span className="kicker-bar mt-4" aria-hidden />
          </motion.div>

          <motion.p {...fade(0.35)} className="display mt-14 max-w-[24ch] text-[clamp(1.9rem,3.3vw,3.1rem)] leading-[1.06]">
            {SITE.tagline[0]} <span className="text-copper">{SITE.tagline[1]}</span>
          </motion.p>
          <motion.p {...fade(0.5)} className="mt-5 max-w-xl text-lg text-mist">
            I mentor Forward Deployed Engineers through DeCoDE: Delegation, Communication, Discovery, Ethics.
          </motion.p>

          <motion.div {...fade(0.6)}>
            <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm font-semibold">
              <Link href="/why/" className="group inline-flex items-center gap-2 border-b-2 border-copper pb-1 hover:text-copper">
                Start with why <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <Link href="/mentoring/" className="group inline-flex items-center gap-2 border-b-2 border-transparent pb-1 text-ivory/80 hover:border-copper hover:text-ivory">
                Mentoring <span aria-hidden>→</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* brain emblem, small, as the signature of the network */}
      <motion.img
        aria-hidden
        src="/img/emblem-520.webp"
        alt=""
        width={520}
        height={458}
        style={{ x: emX, y: emY }}
        className="pointer-events-none absolute bottom-12 right-[4%] hidden w-[240px] opacity-30 lg:block"
      />

    </section>
  );
}
