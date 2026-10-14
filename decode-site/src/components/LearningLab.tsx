"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { LAB } from "@/content/site";

export default function LearningLab() {
  const [picks, setPicks] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const reduce = useReducedMotion();
  const step = picks.length - (showResult ? 1 : 0);
  const done = picks.length === LAB.steps.length && !showResult;
  const total = picks.reduce((s, p, i) => s + LAB.steps[i].options[p].score, 0);
  const max = LAB.steps.length * 2;

  const choose = (o: number) => { setPicks((p) => [...p, o]); setShowResult(true); };
  const next = () => setShowResult(false);
  const reset = () => { setPicks([]); setShowResult(false); };

  return (
    <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
      <aside>
        <p className="label text-copper">Scenario</p>
        <h2 className="display mt-3 text-3xl leading-tight">{LAB.title}</h2>
        <p className="mt-4 text-mist">{LAB.brief}</p>
        <ol className="mt-8 space-y-3" aria-label="Progress">
          {LAB.steps.map((s, i) => {
            const state = i < picks.length ? (LAB.steps[i].options[picks[i]].score === 2 ? "strong" : "weak") : i === picks.length ? "now" : "next";
            return (
              <li key={s.dimension} className="flex items-center gap-3 text-sm">
                <span className={`h-2.5 w-2.5 rounded-full ${state === "strong" ? "bg-cool" : state === "weak" ? "bg-copper" : state === "now" ? "breathe bg-ivory" : "bg-line"}`} />
                <span className={state === "next" ? "text-mist/50" : "text-ivory"}>{s.dimension}</span>
              </li>
            );
          })}
        </ol>
      </aside>

      <div className="min-h-[26rem] rounded-[18px] border border-line bg-deep/60 p-6 md:p-10" aria-live="polite">
        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div key={`${step}-${showResult}`} initial={reduce ? false : { opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={reduce ? undefined : { opacity: 0, x: -12 }} transition={{ duration: 0.4 }}>
              <p className="label text-cool">Step {step + 1} of {LAB.steps.length} · {LAB.steps[step].dimension}</p>
              <h3 className="display mt-3 text-2xl">{LAB.steps[step].prompt}</h3>
              <div className="mt-6 space-y-3">
                {LAB.steps[step].options.map((o, oi) => {
                  const chosen = showResult && picks[step] === oi;
                  return (
                    <button
                      key={o.text}
                      disabled={showResult}
                      onClick={() => choose(oi)}
                      className={`block w-full rounded-xl border px-4 py-3.5 text-left transition-colors disabled:cursor-default ${
                        chosen ? (o.score === 2 ? "border-cool bg-cool/10" : "border-copper bg-copper/10") : showResult ? "border-line opacity-50" : "border-line hover:border-mist/60"
                      }`}
                    >
                      {o.text}
                    </button>
                  );
                })}
              </div>
              {showResult && (
                <div className="mt-6">
                  <p className="text-mist">{LAB.steps[step].options[picks[step]].result}</p>
                  <button onClick={next} className="mt-6 inline-flex items-center gap-2 border-b border-copper pb-1">
                    {picks.length === LAB.steps.length ? "See what you built" : "Next decision"} <span aria-hidden>→</span>
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="end" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="label text-copper">Outcome</p>
              <p className="display mt-3 text-5xl">{total}<span className="text-mist/50">/{max}</span></p>
              <ul className="mt-6 space-y-3">
                {LAB.steps.map((s, i) => {
                  const sc = s.options[picks[i]].score;
                  return (
                    <li key={s.dimension} className="grid grid-cols-[8rem_1fr] items-center gap-4 text-sm">
                      <span>{s.dimension}</span>
                      <span className="h-1.5 overflow-hidden rounded-full bg-line"><span className={`block h-full ${sc === 2 ? "bg-cool" : "bg-copper"}`} style={{ width: `${(sc / 2) * 100}%` }} /></span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-8 text-mist">
                {total === max
                  ? "You solved the clinic's real problem, kept people in charge of what matters, and protected patients. That is the whole of DeCoDE in two weeks."
                  : "Every weak call here is common in real projects. The point is not a perfect score. It is noticing which dimension you skipped, and why."}
              </p>
              <p className="display mt-6 text-xl italic">The clinic did not need a chatbot. It needed the 08:00 rush to stop losing people.</p>
              <button onClick={reset} className="mt-8 label text-mist hover:text-ivory">Run it again</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
