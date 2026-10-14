"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";

/** A two-question pause. No data leaves the browser; nothing is stored. */
const Q = [
  {
    q: "Think of the last thing you built, or the last AI tool you relied on. What did it make better?",
    options: [
      { k: "task", label: "A task got faster", reply: "Most tools stop there. Speed is real value, and it is also the easiest thing to measure." },
      { k: "person", label: "A person got better at something", reply: "That is the rarer outcome. It usually happens on purpose, not by accident." },
      { k: "unsure", label: "Honestly, I am not sure", reply: "That uncertainty is the start of good engineering. Most teams never ask." },
    ],
  },
  {
    q: "Now a harder one. Who is more capable because that thing exists?",
    options: [
      { k: "user", label: "The people who use it", reply: "Then it grew judgment, not dependency. Keep asking how you would know." },
      { k: "me", label: "Me, the person who built it", reply: "Building teaches the builder first. The next step is passing that on." },
      { k: "noone", label: "No one, really", reply: "Then the work is not finished. This is where responsibility starts." },
    ],
  },
];

export default function Reflection() {
  const [answers, setAnswers] = useState<string[]>([]);
  const reduce = useReducedMotion();
  const step = Math.min(answers.length, Q.length - 1);
  const done = answers.length === Q.length;

  return (
    <div className="border-l border-copper/60 pl-6 md:pl-10">
      <p className="label text-copper">A pause</p>
      <AnimatePresence mode="wait">
        <motion.div
          key={done ? "done" : step}
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0 }}
          transition={{ duration: 0.5 }}
          aria-live="polite"
        >
          {!done ? (
            <fieldset className="mt-5">
              <legend className="display text-[clamp(1.4rem,2.6vw,2rem)] leading-snug">{Q[step].q}</legend>
              {answers[step - 1] && (
                <p className="mt-4 text-sm text-cool">
                  {Q[step - 1].options.find((o) => o.k === answers[step - 1])?.reply}
                </p>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                {Q[step].options.map((o) => (
                  <button
                    key={o.k}
                    onClick={() => setAnswers((a) => [...a, o.k])}
                    className="rounded-full border border-line px-5 py-2.5 text-sm text-ivory transition-colors hover:border-copper hover:bg-copper/10"
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : (
            <div className="mt-5">
              <p className="text-sm text-cool">{Q[1].options.find((o) => o.k === answers[1])?.reply}</p>
              <p className="display mt-4 text-[clamp(1.4rem,2.6vw,2rem)] leading-snug">
                The question is not whether we build. It is whether people grow because we did.
              </p>
              <button onClick={() => setAnswers([])} className="mt-6 label text-mist hover:text-ivory">
                Ask me again
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
