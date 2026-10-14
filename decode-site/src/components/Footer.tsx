import Link from "next/link";
import { NAV, SITE } from "@/content/site";

export default function Footer() {
  return (
    <footer className="border-t border-line/70 bg-ink">
      <div className="wrap grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="wordmark text-[2.6rem] uppercase !tracking-[-0.04em]">{SITE.name}</p>
          <span className="kicker-bar mt-3" aria-hidden />
          <p className="display mt-6 text-xl leading-snug">
            {SITE.tagline[0]} <span className="text-copper">{SITE.tagline[1]}</span>
          </p>
          <p className="mt-4 max-w-sm text-sm text-mist">
            Sameer Goel, {SITE.role}, {SITE.location}.
          </p>
        </div>
        <nav aria-label="Footer">
          <p className="label text-copper">Explore</p>
          <ul className="mt-4 space-y-2 text-sm text-mist">
            {NAV.map((n) => (
              <li key={n.href}><Link className="hover:text-ivory" href={n.href}>{n.label}</Link></li>
            ))}
            <li><a className="hover:text-ivory" href="/forward-deployed-engineer/">FDE hiring data</a></li>
            <li><a className="hover:text-ivory" href="/anthropic-certifications/visual-study-guide/">Claude certification guide</a></li>
          </ul>
        </nav>
        <div>
          <p className="label text-copper">Elsewhere</p>
          <ul className="mt-4 space-y-2 text-sm text-mist">
            <li><a className="hover:text-ivory" rel="me noopener" target="_blank" href={SITE.links.linkedin}>LinkedIn</a></li>
            <li><a className="hover:text-ivory" rel="me noopener" target="_blank" href={SITE.links.github}>GitHub</a></li>
          </ul>
        </div>
      </div>
      <div className="wrap flex flex-wrap justify-between gap-3 border-t border-line/50 py-6 text-xs text-mist/70">
        <p>© {new Date().getFullYear()} Sameer Goel. No trackers, no cookies.</p>
        <p>Every evidence item links to its original source.</p>
      </div>
    </footer>
  );
}
