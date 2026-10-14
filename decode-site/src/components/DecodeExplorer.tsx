"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import { DECODE } from "@/content/site";

export default function DecodeExplorer({ compact = false }: { compact?: boolean }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<Record<string, number>>({});
  const reduce = useReducedMotion();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const d = DECODE[i];
  const choice = picked[d.key];

  const onKey = (e: React.KeyboardEvent, idx: number) => {
    const n = DECODE.length;
    const next = e.key === "ArrowRight" || e.key === "ArrowDown" ? (idx + 1) % n : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (idx - 1 + n) % n : -1;
    if (next < 0) return;
    e.preventDefault(); setI(next); tabs.current[next]?.focus();
  };

  return (
    <div>
      <div role="tablist" aria-label="The four dimensions of DeCoDE" className="grid grid-cols-4 border-y border-line">
        {DECODE.map((x, idx) => (
          <button
            key={x.key}
            ref={(el) => { tabs.current[idx] = el; }}
            role="tab"
            id={`d-tab-${x.key}`}
            aria-selected={i === idx}
            aria-controls={`d-panel-${x.key}`}
            tabIndex={i === idx ? 0 : -1}
            onClick={() => setI(idx)}
            onKeyDown={(e) => onKey(e, idx)}
            className={`group relative border-line px-2 py-6 text-left transition-colors md:px-6 [&:not(:first-child)]:border-l ${
              i === idx ? "bg-deep" : "hover:bg-deep/50"
            }`}
          >
            <span className={`display block text-[clamp(2.2rem,6vw,4.6rem)] leading-none transition-colors ${i === idx ? "text-copper" : "text-mist/40 group-hover:text-mist/70"}`}>
              {x.letter}
            </span>
            <span className={`label mt-3 block truncate !text-[.62rem] !tracking-[.08em] sm:!text-[.72rem] sm:!tracking-[.12em] ${i === idx ? "text-ivory" : "text-mist/70"}`}><span className="sm:hidden" aria-hidden>{x.name.slice(0, 5)}.</span><span className="max-sm:sr-only">{x.name}</span></span>
            {picked[x.key] !== undefined && <span aria-label="challenge answered" className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-cool" />}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={d.key}
          role="tabpanel"
          id={`d-panel-${d.key}`}
          aria-labelledby={`d-tab-${d.key}`}
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="grid gap-10 py-12 lg:grid-cols-[1fr_1fr] lg:gap-16"
        >
          <div>
            <h3 className="display text-[clamp(1.7rem,3.2vw,2.6rem)] leading-tight">{d.question}</h3>
            {!compact && <p className="mt-5 text-lg leading-relaxed text-mist">{d.definition}</p>}

            {compact && (
              <p className="mt-8 border-t border-line pt-5 text-sm text-mist">
                <span className="label mr-2 text-cool">Real example</span>
                <a href={d.example.source} target="_blank" rel="noopener" className="underline decoration-line hover:text-ivory">{d.example.title}</a>
                <span className="text-mist/70"> · {d.example.sourceLabel}</span>
              </p>
            )}
            {!compact && (
              <article className="mt-10 border-t border-line pt-6">
                <p className="label text-cool">Real engineering example</p>
                <h4 className="mt-3 text-lg">
                  <a href={d.example.source} target="_blank" rel="noopener" className="underline decoration-line hover:decoration-copper">
                    {d.example.title}
                  </a>
                </h4>
                <p className="mt-1 text-xs text-mist/80">Source: {d.example.sourceLabel}</p>
                <p className="mt-4 text-mist">
                  <span className="label mr-2 text-copper/90">Interpretation</span>
                  {d.example.interpretation}
                </p>
              </article>
            )}
          </div>

          <div className="rounded-[18px] border border-line bg-deep/60 p-6 md:p-8">
            <p className="label text-copper">Decision challenge</p>
            <fieldset className="mt-4">
              <legend className="text-xl leading-snug">{d.challenge.prompt}</legend>
              <div className="mt-6 space-y-3">
                {d.challenge.choices.map((c, ci) => {
                  const chosen = choice === ci;
                  const reveal = choice !== undefined;
                  return (
                    <button
                      key={c.text}
                      onClick={() => setPicked((p) => ({ ...p, [d.key]: ci }))}
                      aria-pressed={chosen}
                      className={`block w-full rounded-xl border px-4 py-3.5 text-left text-[.95rem] transition-colors ${
                        chosen
                          ? c.strong ? "border-cool bg-cool/10" : "border-copper bg-copper/10"
                          : reveal && c.strong ? "border-cool/50" : "border-line hover:border-mist/60"
                      }`}
                    >
                      {c.text}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <div aria-live="polite" className="min-h-24">
              {choice !== undefined && (
                <motion.div initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
                  <p className={`label ${d.challenge.choices[choice].strong ? "text-cool" : "text-copper"}`}>
                    {d.challenge.choices[choice].strong ? "Strong call" : "Think again"}
                  </p>
                  <p className="mt-2 text-mist">{d.challenge.choices[choice].feedback}</p>
                  <p className="display mt-6 text-xl italic text-ivory">Takeaway: {d.takeaway}</p>
                </motion.div>
              )}
            </div>

          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
