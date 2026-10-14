import type { Metadata } from "next";
import PageIntro from "@/components/PageIntro";
import EvidenceExplorer from "@/components/EvidenceExplorer";
import JsonLd from "@/components/JsonLd";
import { EVIDENCE, SITE } from "@/content/site";

export const metadata: Metadata = {
  title: "Engineering evidence: AWS publications, talks, projects and repositories",
  description: "A browsable record of Sameer Goel's public engineering work: AWS Machine Learning, Big Data and Architecture blog posts, technical articles, talks, projects and open repositories, each linked to the source.",
  alternates: { canonical: "/evidence/" },
};

const ld = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  url: `${SITE.url}/evidence/`,
  name: "Engineering evidence",
  about: { "@id": `${SITE.url}/#person` },
  hasPart: EVIDENCE.filter((e) => e.url && (e.kind === "AWS publication" || e.kind === "Article")).map((e) => ({
    "@type": "TechArticle",
    headline: e.title,
    url: e.url,
    datePublished: String(e.year),
    publisher: { "@type": "Organization", name: e.venue },
    author: { "@id": `${SITE.url}/#person` },
  })),
};

export default function Evidence() {
  return (
    <>
      <JsonLd data={ld} />
      <PageIntro eyebrow="Evidence" title="The work, with sources.">
        <p>Every item links to its original source.</p>
      </PageIntro>
      <section className="py-16 md:py-20">
        <div className="wrap"><EvidenceExplorer /></div>
      </section>
    </>
  );
}
