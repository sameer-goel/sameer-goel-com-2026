"use client";
import { useMemo, useState } from "react";
import { EVIDENCE, type EvidenceKind } from "@/content/site";

const KINDS: ("All" | EvidenceKind)[] = ["All", "AWS publication", "Article", "Talk", "Project", "Repository"];

export default function EvidenceExplorer() {
  const [kind, setKind] = useState<(typeof KINDS)[number]>("All");
  const [topic, setTopic] = useState("All topics");
  const [q, setQ] = useState("");

  const topics = useMemo(() => ["All topics", ...Array.from(new Set(EVIDENCE.flatMap((e) => e.topics))).sort()], []);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return EVIDENCE.filter((e) => kind === "All" || e.kind === kind)
      .filter((e) => topic === "All topics" || e.topics.includes(topic))
      .filter((e) => !s || `${e.title} ${e.venue} ${e.topics.join(" ")}`.toLowerCase().includes(s))
      .sort((a, b) => b.year - a.year);
  }, [kind, topic, q]);

  const counts = useMemo(() => Object.fromEntries(KINDS.map((k) => [k, k === "All" ? EVIDENCE.length : EVIDENCE.filter((e) => e.kind === k).length])), []);

  return (
    <div>
      <div className="flex flex-col gap-5 border-b border-line pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div role="group" aria-label="Filter by type" className="flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <button
              key={k}
              aria-pressed={kind === k}
              onClick={() => setKind(k)}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                kind === k ? "border-copper bg-copper/15 text-ivory" : "border-line text-mist hover:border-mist/60"
              }`}
            >
              {k} <span className="ml-1 text-xs opacity-60">{counts[k]}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="ev-topic">Topic</label>
          <select id="ev-topic" value={topic} onChange={(e) => setTopic(e.target.value)} className="rounded-[18px] border border-line bg-deep px-3 py-2 text-sm">
            {topics.map((t) => <option key={t}>{t}</option>)}
          </select>
          <label className="sr-only" htmlFor="ev-q">Search evidence</label>
          <input id="ev-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search titles, venues, topics" className="rounded-[18px] border border-line bg-deep px-3 py-2 text-sm placeholder:text-mist/50 sm:w-64" />
        </div>
      </div>

      <p className="mt-6 label text-mist" aria-live="polite">{list.length} items</p>

      <ul className="mt-4 grid gap-px overflow-hidden rounded-[18px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {list.map((e) => (
          <li key={e.title + e.year} className="flex flex-col bg-ink p-6 transition-colors hover:bg-deep">
            {e.image && (
              <img src={e.image} alt={`${e.title}, ${e.venue}`} loading="lazy" className="mb-5 aspect-[16/10] w-full rounded-xl object-cover opacity-85 grayscale-[35%]" />
            )}
            <div className="flex items-center justify-between gap-3">
              <span className="label text-copper !tracking-[.12em]">{e.kind}</span>
              <span className="font-mono text-xs text-mist">{e.year}</span>
            </div>
            <h3 className="mt-3 text-[1.02rem] leading-snug">
              {e.url ? (
                <a href={e.url} target="_blank" rel="noopener" className="hover:text-copper">{e.title}<span className="sr-only"> (opens original source)</span></a>
              ) : e.title}
            </h3>
            <p className="mt-2 text-sm text-mist">{e.venue}</p>
            {e.lesson && (
              <p className="mt-4 border-l border-cool/50 pl-3 text-sm text-mist">
                <span className="label mb-1 block text-cool/90 !tracking-[.12em]">Interpretation</span>
                {e.lesson}
              </p>
            )}
            <div className="mt-auto flex flex-wrap gap-2 pt-5">
              {e.topics.map((t) => <span key={t} className="rounded-full bg-deep px-2.5 py-1 text-[11px] text-mist">{t}</span>)}
            </div>
            <p className="mt-4 text-[11px] text-mist/70">{e.url ? "Fact: links to the original source" : "Fact: from Sameer's own event photo archive"}</p>
          </li>
        ))}
      </ul>
      {list.length === 0 && <p className="mt-10 text-mist">Nothing matches. Try a broader topic.</p>}
    </div>
  );
}
