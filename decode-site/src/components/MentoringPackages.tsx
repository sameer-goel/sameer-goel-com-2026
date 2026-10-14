import { MENTORING, SITE } from "@/content/site";
import Reveal from "./Reveal";

/** Mentoring packages. Replaces the previous consulting packages. Conversations first, no prices. */
export default function MentoringPackages() {
  return (
    <div>
      <ul className="grid gap-5 md:grid-cols-3">
        {MENTORING.map((m, i) => (
          <Reveal
            as="li"
            key={m.key}
            delay={i * 0.06}
            className={`flex flex-col rounded-[18px] border p-7 md:p-8 ${
              m.featured ? "border-copper/70 bg-copper/[.06]" : "border-line bg-[linear-gradient(145deg,rgba(255,255,255,.035),rgba(255,255,255,.012))]"
            }`}
          >
            <p className="label text-copper-deep">0{i + 1}</p>
            <h3 className="display mt-3 text-3xl">{m.name}</h3>
            <p className="mt-2 text-sm text-mist">{m.who}</p>
            <p className="mt-6 font-semibold leading-snug">{m.line}</p>
            <ul className="mt-6 space-y-2 border-t border-line pt-5 text-sm text-mist">
              {m.format.map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-copper" />
                  {f}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </ul>
      <div className="mt-10 flex flex-wrap gap-3">
        <a href={SITE.links.linkedin} target="_blank" rel="me noopener" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-copper px-6 text-sm font-bold text-ink transition-colors hover:bg-copper-deep">
          Ask about mentoring <span aria-hidden>↗</span>
        </a>
        <a href={SITE.links.conversation} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center rounded-full border border-line px-6 text-sm font-semibold transition-colors hover:border-copper hover:bg-copper/10">
          Pick a time to talk
        </a>
      </div>
    </div>
  );
}
