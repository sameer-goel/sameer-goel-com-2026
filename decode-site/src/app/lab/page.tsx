import type { Metadata } from "next";
import PageIntro from "@/components/PageIntro";
import LearningLab from "@/components/LearningLab";

export const metadata: Metadata = {
  title: "Learning Lab: make one real engineering decision",
  description: "An interactive scenario from Sameer Goel's project-based learning approach. A clinic asks for a chatbot. Use Discovery, Delegation, Communication and Ethics to decide what to build.",
  alternates: { canonical: "/lab/" },
};

export default function Lab() {
  return (
    <>
      <PageIntro eyebrow="How · Learning Lab" title="One small problem. Four real decisions.">
        <p>A real problem, four choices, real consequences.</p>
      </PageIntro>
      <section className="py-16 md:py-24">
        <div className="wrap"><LearningLab /></div>
      </section>
      <section className="border-t border-line/70 py-14">
        <p className="wrap text-sm text-mist">The scenario is illustrative, written for learning. It is not a client case study.</p>
      </section>
    </>
  );
}
