import type { Metadata } from "next";
import Link from "next/link";
import PageIntro from "@/components/PageIntro";
import Reveal from "@/components/Reveal";
import Reflection from "@/components/Reflection";
import JsonLd, { profilePageLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Why: human responsibility is to grow together",
  description: "Why Sameer Goel builds, leads and teaches: technology is only as good as the human behind it, and good engineering leaves people with better judgment and capability.",
  alternates: { canonical: "/why/" },
};

const TENSIONS = [
  { a: "AI capability", b: "Human judgment", note: "Capability decides what is possible. Judgment decides what is right. Neither replaces the other." },
  { a: "Speed", b: "Understanding", note: "Shipping fast is good. Shipping something nobody understands just moves the problem downstream." },
  { a: "Automation", b: "Growth", note: "Automate the repetitive part, and give people the time and the reason to grow into the hard part." },
  { a: "Individual output", b: "Collective growth", note: "A brilliant engineer who teaches nobody is a single point of failure, however good the code." },
];

export default function Why() {
  return (
    <>
      <JsonLd data={profilePageLd("/why/", "Why: human responsibility is to grow together")} />
      <PageIntro eyebrow="Why" title={<>Human responsibility is to <em className="text-copper">grow together.</em></>}>
        <p>Technology is only as good as the human behind it.</p>
      </PageIntro>

      <section className="py-24">
        <div className="wrap grid gap-16 lg:grid-cols-3">
          {[
            ["01", "Solve what matters", "Interesting is not the same as important."],
            ["02", "The human behind it", "Our values travel into everything we ship."],
            ["03", "Leave people stronger", "If it only makes people faster, it is unfinished."],
          ].map(([n, t, b], i) => (
            <Reveal key={n} delay={i * 0.08}>
              <p className="font-mono text-sm text-copper">{n}</p>
              <h2 className="display mt-4 text-3xl">{t}</h2>
              <p className="mt-4 leading-relaxed text-mist">{b}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section aria-labelledby="tensions" className="border-y border-line/70 bg-navy py-24">
        <div className="wrap">
          <Reveal><h2 id="tensions" className="display max-w-3xl text-[clamp(1.8rem,3.6vw,3rem)] leading-tight">Four tensions. Neither side wins alone.</h2></Reveal>
          <ul className="mt-14 divide-y divide-line border-y border-line">
            {TENSIONS.map((t, i) => (
              <Reveal as="li" key={t.a} delay={i * 0.05} className="grid gap-4 py-8 md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-8">
                <span className="display text-2xl text-copper">{t.a}</span>
                <span aria-hidden className="hidden h-px w-16 bg-gradient-to-r from-copper to-cool md:block" />
                <span className="display text-2xl text-cool">{t.b}</span>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-24">
        <div className="wrap max-w-3xl"><Reflection /></div>
      </section>

      <section className="border-t border-line/70 py-20">
        <div className="wrap flex flex-wrap items-center justify-between gap-6">
          <p className="display text-2xl">The why shapes the what.</p>
          <Link href="/decode/" className="inline-flex items-center gap-2 border-b border-copper pb-1 hover:text-copper">Meet DeCoDE <span aria-hidden>→</span></Link>
        </div>
      </section>
    </>
  );
}
