import Link from "next/link";
import Hero from "@/components/Hero";
import Reveal from "@/components/Reveal";
import Reflection from "@/components/Reflection";
import Triad from "@/components/Triad";
import DecodeExplorer from "@/components/DecodeExplorer";
import JsonLd, { profilePageLd } from "@/components/JsonLd";
import ContactBlock from "@/components/ContactBlock";
import MentoringPackages from "@/components/MentoringPackages";
import { EVIDENCE } from "@/content/site";

const count = (k: string) => EVIDENCE.filter((e) => e.kind === k).length;

export const metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <>
      <JsonLd data={profilePageLd("/", "Sameer Goel")} />
      <Hero />

      {/* WHY */}
      <section aria-labelledby="why-title" className="py-28 md:py-40">
        <div className="wrap grid gap-16 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <Reveal>
            <p className="label text-copper-deep">Why</p>
            <h2 id="why-title" className="display mt-5 text-[clamp(2.4rem,5.6vw,5rem)] leading-[1.02]">
              Human responsibility is to <span className="italic text-copper">grow together.</span>
            </h2>
            <p className="mt-6 text-lg text-mist">Technology is only as good as the human behind it.</p>
          </Reveal>
          <Reveal delay={0.15}><Reflection /></Reveal>
        </div>
      </section>

      {/* WHY / WHAT / HOW */}
      <section aria-label="Why, what, how" className="border-y border-line/70 bg-navy py-24 md:py-32">
        <div className="wrap"><Triad /></div>
      </section>

      {/* WHAT: DeCoDE */}
      <section aria-labelledby="decode-title" className="py-24 md:py-32">
        <div className="wrap">
          <Reveal>
            <p className="label text-copper-deep">What</p>
            <h2 id="decode-title" className="display mt-4 text-[clamp(2.6rem,6vw,5rem)] leading-none">
              De<span className="text-copper">Co</span>D<span className="text-cool">E</span>
            </h2>
          </Reveal>
          <div className="mt-12"><DecodeExplorer compact /></div>
        </div>
      </section>

      {/* EVIDENCE */}
      <section aria-labelledby="ev-title" className="border-y border-line/70 bg-navy py-20">
        <div className="wrap flex flex-wrap items-end justify-between gap-10">
          <Reveal>
            <p className="label text-copper-deep">Evidence</p>
            <h2 id="ev-title" className="display mt-4 text-[clamp(2rem,4vw,3.2rem)]">The work, with sources.</h2>
          </Reveal>
          <Reveal delay={0.1} className="flex items-end gap-10 md:gap-16">
            {[[count("AWS publication"), "AWS posts"], [count("Article"), "articles"], [count("Talk"), "talks"]].map(([n, l]) => (
              <div key={String(l)}>
                <p className="display text-[clamp(2.4rem,4.6vw,3.8rem)] leading-none">{n}</p>
                <p className="label mt-2 text-mist">{l}</p>
              </div>
            ))}
            <Link href="/evidence/" className="mb-1 border-b-2 border-copper pb-1 text-sm font-semibold hover:text-copper">Browse →</Link>
          </Reveal>
        </div>
      </section>

      {/* HOW */}
      <section aria-labelledby="how-title" className="py-24 md:py-32">
        <div className="wrap">
          <Reveal>
            <p className="label text-copper-deep">How</p>
            <h2 id="how-title" className="display mt-4 text-[clamp(2rem,4.4vw,3.6rem)]">Learn by building, from day one.</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <ol className="mt-12 grid gap-px overflow-hidden rounded-[18px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
              {["Pick a real problem", "Build the smallest useful thing", "Test it where work happens", "Reflect, then teach it on"].map((s, i) => (
                <li key={s} className="bg-ink p-6">
                  <span className="font-mono text-xs text-copper">0{i + 1}</span>
                  <p className="mt-3 font-semibold">{s}</p>
                </li>
              ))}
            </ol>
            <Link href="/lab/" className="mt-8 inline-flex border-b-2 border-copper pb-1 text-sm font-semibold hover:text-copper">Try one decision →</Link>
          </Reveal>
        </div>
      </section>

      {/* MENTORING: replaces the old consulting packages */}
      <section aria-labelledby="mentoring-title" className="border-t border-line/70 bg-navy py-24 md:py-32">
        <div className="wrap">
          <Reveal>
            <p className="label text-copper-deep">Mentoring</p>
            <h2 id="mentoring-title" className="display mt-4 text-[clamp(2rem,4.4vw,3.6rem)]">Three ways to grow with DeCoDE.</h2>
          </Reveal>
          <div className="mt-12"><MentoringPackages /></div>
        </div>
      </section>

      <section aria-label="Connect" className="border-t border-line/70 py-24 md:py-32">
        <div className="wrap"><ContactBlock /></div>
      </section>
    </>
  );
}
