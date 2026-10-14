import type { Metadata } from "next";
import PageIntro from "@/components/PageIntro";
import Reveal from "@/components/Reveal";
import JsonLd from "@/components/JsonLd";
import { SITE, THEMES } from "@/content/site";

export const metadata: Metadata = {
  title: "Thinking: AI, neuroscience, cognition and responsible engineering",
  description: "Sameer Goel's writing on AI and human cognition, neuroscience, human-AI collaboration, responsible AI and the future of Forward Deployed Engineers.",
  alternates: { canonical: "/thinking/" },
};

const ld = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Thinking by Sameer Goel",
  url: `${SITE.url}/thinking/`,
  itemListElement: THEMES.flatMap((t) => t.items).map((it, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: { "@type": "Article", headline: it.title, url: it.url, datePublished: String(it.year), author: { "@id": `${SITE.url}/#person` } },
  })),
};

export default function Thinking() {
  return (
    <>
      <JsonLd data={ld} />
      <PageIntro eyebrow="Thinking" title="Where the brain, the machine and the engineer meet.">
        <p>Writing on AI, the mind and responsible engineering.</p>
      </PageIntro>
      <section className="py-20">
        <div className="wrap space-y-20">
          {THEMES.map((t, ti) => (
            <Reveal key={t.key} as="section" className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
              <div>
                <p className="font-mono text-sm text-copper">0{ti + 1}</p>
                <h2 className="display mt-3 text-3xl leading-tight">{t.title}</h2>
                <p className="mt-4 text-mist">{t.note}</p>
              </div>
              <ul className="divide-y divide-line border-y border-line">
                {t.items.map((it) => (
                  <li key={it.url}>
                    <a href={it.url} target="_blank" rel="noopener" className="group flex items-baseline justify-between gap-6 py-5">
                      <span className="text-lg leading-snug group-hover:text-copper">{it.title}</span>
                      <span className="shrink-0 text-right font-mono text-xs text-mist">{it.venue}<br />{it.year}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
