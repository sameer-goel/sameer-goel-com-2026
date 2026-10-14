import Reveal from "./Reveal";

export default function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden border-b border-line/70 pt-36 pb-16 md:pt-44 md:pb-20">
      <div aria-hidden className="grid-lines absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <img aria-hidden src="/img/hero-1400.webp" alt="" className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover object-right opacity-35" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,var(--color-ink)_25%,rgb(16_24_32/.6)_70%,rgb(16_24_32/.3)_100%)]" />
      <div className="wrap">
        <Reveal><p className="label text-copper-deep">{eyebrow}</p><span className="kicker-bar mt-3" aria-hidden /></Reveal>
        <Reveal delay={0.1}><h1 className="display mt-5 max-w-4xl text-[clamp(2.4rem,6vw,5rem)] leading-[1.02]">{title}</h1></Reveal>
        {children && <Reveal delay={0.2}><div className="mt-7 max-w-2xl text-lg leading-relaxed text-mist">{children}</div></Reveal>}
      </div>
    </section>
  );
}
