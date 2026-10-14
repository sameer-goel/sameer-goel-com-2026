import type { Metadata } from "next";
import ContactBlock from "@/components/ContactBlock";

export const metadata: Metadata = {
  title: "Connect: engineering conversations, speaking and mentorship",
  description: "Start a conversation with Sameer Goel about engineering strategy, speaking and research, engineering leadership, or mentorship and community initiatives.",
  alternates: { canonical: "/connect/" },
};

export default function Connect() {
  return (
    <section className="pt-32 pb-24 md:pt-40 md:pb-32">
      <div className="wrap"><ContactBlock headingLevel={1} /></div>
    </section>
  );
}
