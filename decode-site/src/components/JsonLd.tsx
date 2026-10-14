import { SITE } from "@/content/site";

export const personLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${SITE.url}/#person`,
  name: SITE.name,
  url: SITE.url,
  image: `${SITE.url}/og.jpg`,
  jobTitle: "AI Solutions Architect",
  description: SITE.description,
  address: { "@type": "PostalAddress", addressCountry: "NL" },
  knowsAbout: [
    "Forward Deployed Engineering", "Agentic AI", "Machine learning", "AWS cloud architecture",
    "Data engineering", "Responsible AI", "Human-AI collaboration", "Neuroscience and cognition", "Engineering mentoring",
  ],
  sameAs: [SITE.links.linkedin, SITE.links.github],
};

export const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE.url}/#website`,
  url: SITE.url,
  name: SITE.name,
  inLanguage: "en",
  publisher: { "@id": `${SITE.url}/#person` },
};

export function profilePageLd(path: string, name: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: `${SITE.url}${path}`,
    name,
    mainEntity: { "@id": `${SITE.url}/#person` },
  };
}

export default function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
