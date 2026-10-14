import type { Metadata } from "next";
import PageIntro from "@/components/PageIntro";
import MentoringPackages from "@/components/MentoringPackages";
import JsonLd, { profilePageLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Mentoring for Forward Deployed Engineers: DeCoDE 1:1, FDE Circle, Leader Exchange",
  description: "Sameer Goel mentors Forward Deployed Engineers and engineering leaders through DeCoDE: Delegation, Communication, Discovery and Ethics, learned through real projects.",
  alternates: { canonical: "/mentoring/" },
};

export default function Mentoring() {
  return (
    <>
      <JsonLd data={profilePageLd("/mentoring/", "Mentoring for Forward Deployed Engineers")} />
      <PageIntro eyebrow="Mentoring" title="Grow engineers, not dependency.">
        <p>Three ways to learn DeCoDE by building.</p>
      </PageIntro>
      <section className="py-16 md:py-24">
        <div className="wrap"><MentoringPackages /></div>
      </section>
    </>
  );
}
