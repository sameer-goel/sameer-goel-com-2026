import type { Metadata } from "next";
import Link from "next/link";
import PageIntro from "@/components/PageIntro";
import DecodeExplorer from "@/components/DecodeExplorer";
import Reveal from "@/components/Reveal";
import JsonLd, { profilePageLd } from "@/components/JsonLd";
import { DECODE } from "@/content/site";

export const metadata: Metadata = {
  title: "DeCoDE: the 4D mindset for Forward Deployed Engineers",
  description: "DeCoDE is Sameer Goel's mentoring framework for Forward Deployed Engineers: Delegation, Communication, Discovery and Ethics, each with a real engineering example and a decision challenge.",
  alternates: { canonical: "/decode/" },
};

export default function Decode() {
  return (
    <>
      <JsonLd data={profilePageLd("/decode/", "DeCoDE: the 4D mindset")} />
      <PageIntro eyebrow="What · the 4D mindset" title={<>De<span className="text-copper">Co</span>D<span className="text-cool">E</span>: four habits that make engineers trustworthy.</>}>
        <p>Engineers rarely fail on code. They fail on what to hand off, say, look for, and refuse.</p>
      </PageIntro>

      <section className="py-20">
        <div className="wrap"><DecodeExplorer /></div>
      </section>

      <section aria-labelledby="summary" className="border-y border-line/70 bg-navy py-20">
        <div className="wrap">
          <h2 id="summary" className="label text-copper">The four questions, in one place</h2>
          <dl className="mt-10 grid gap-px overflow-hidden rounded-[18px] border border-line bg-line md:grid-cols-2 lg:grid-cols-4">
            {DECODE.map((d, i) => (
              <Reveal key={d.key} delay={i * 0.05} className="bg-ink p-7">
                <dt className="display text-3xl text-copper">{d.name}</dt>
                <dd className="mt-3 text-mist">{d.question}</dd>
                <dd className="display mt-5 italic">{d.takeaway}</dd>
              </Reveal>
            ))}
          </dl>
          <p className="mt-8 text-sm text-mist">Examples link to Sameer&apos;s original publications. The reading of each example is interpretation, labelled as such.</p>
        </div>
      </section>

      <section className="py-20">
        <div className="wrap flex flex-wrap items-center justify-between gap-6">
          <p className="display text-2xl">Frameworks stick when you use them.</p>
          <Link href="/lab/" className="inline-flex items-center gap-2 border-b border-copper pb-1 hover:text-copper">Use all four in the Learning Lab <span aria-hidden>→</span></Link>
        </div>
      </section>
    </>
  );
}
