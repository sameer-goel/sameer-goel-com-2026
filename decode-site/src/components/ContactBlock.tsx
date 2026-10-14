import { CONNECT, SITE } from "@/content/site";
import Reveal from "./Reveal";

/** Contact layout carried over from the previous live site: portrait left, conversation card right. */
export default function ContactBlock({ headingLevel = 2 }: { headingLevel?: 1 | 2 }) {
  const H = headingLevel === 1 ? "h1" : "h2";
  return (
    <div className="grid items-start gap-12 md:grid-cols-[.78fr_1.22fr] lg:gap-24">
      <Reveal className="md:sticky md:top-28">
        <figure className="relative m-0 aspect-square overflow-hidden rounded-[18px] border border-line bg-deep shadow-[0_24px_70px_rgba(0,0,0,.18)]">
          <picture>
            <source media="(max-width: 700px)" srcSet="/img/portrait-contact-480.webp" />
            <img src="/img/portrait-contact-900.webp" alt="Sameer Goel" width={900} height={900} loading="lazy" className="h-full w-full object-cover" />
          </picture>
        </figure>
        <p className="wordmark mt-6 text-[2.1rem] uppercase !tracking-[-0.04em]">{SITE.name}</p>
        <p className="mt-2 text-sm text-mist">{SITE.location}</p>
        <div className="mt-4 flex flex-wrap gap-5 text-sm font-semibold text-ivory/80">
          <a href={SITE.links.linkedin} target="_blank" rel="me noopener" className="hover:text-copper">LinkedIn ↗</a>
          <a href={SITE.links.github} target="_blank" rel="me noopener" className="hover:text-copper">GitHub ↗</a>
        </div>
      </Reveal>

      <Reveal delay={0.1} className="rounded-[18px] border border-line bg-[linear-gradient(145deg,rgba(255,255,255,.035),rgba(255,255,255,.012))] p-7 shadow-[0_24px_70px_rgba(0,0,0,.14)] md:p-10">
        <p className="label text-copper-deep">Connect</p>
        <H className="display mt-3 text-[clamp(2rem,3.6vw,3rem)] leading-[1.05]">Conversations, not appointments.</H>
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {CONNECT.map((c, i) => (
            <li key={c.title} className="flex items-baseline gap-4 py-4">
              <span className="font-mono text-xs text-copper">0{i + 1}</span>
              <h3 className="font-semibold">{c.title}</h3>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={SITE.links.linkedin} target="_blank" rel="me noopener" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-copper px-6 text-sm font-bold text-ink transition-colors hover:bg-copper-deep">
            Message on LinkedIn <span aria-hidden>↗</span>
          </a>
          <a href={SITE.links.conversation} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-6 text-sm font-semibold transition-colors hover:border-copper hover:bg-copper/10">
            Pick a time to talk
          </a>
        </div>
      </Reveal>
    </div>
  );
}
