// Builds index.html from data/qna.json.
//
// Nothing in the output is hand-typed: every timestamp, deep link, count and
// quote comes from the JSON, so a fix to the data is a fix to the page.
// Run: node build.mjs
//
// Design intent, v3. Two orthogonal colour signals so the eye can navigate 34
// questions without reading them:
//   1. Category  -> each of the 8 themes owns a hue. Section headers, question
//                   text, timeline ticks and filter pills all share it.
//   2. Answer    -> always teal, in every category. Teal means "this is what
//                   someone said", so Q and A never blur together.
// Depth is layered shadows plus a 1px inset top highlight, which is what
// actually reads as raised on a dark background. The only literal 3D transform
// is the timeline strip, tilted on X so it reads as a console laid flat.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(root, "data/qna.json"), "utf8"));
const { source, people, themes, questions } = data;

// Guard against the failure mode that matters most here: a card whose clip link
// points at the wrong moment in the video is worse than a card that is missing.
const ids = new Set();
for (const q of questions) {
  if (ids.has(q.id)) throw new Error(`duplicate question id: ${q.id}`);
  ids.add(q.id);
  if (!people[q.asked_by]) throw new Error(`${q.id}: unknown asker ${q.asked_by}`);
  if (!themes.some((t) => t.key === q.theme)) throw new Error(`${q.id}: unknown theme ${q.theme}`);
  if (!q.answers.length) throw new Error(`${q.id}: no answers`);
  if (!(q.t >= 0 && q.t <= source.duration_seconds)) throw new Error(`${q.id}: t outside video`);
  for (const a of q.answers) {
    if (!people[a.speaker]) throw new Error(`${q.id}: unknown speaker ${a.speaker}`);
    if (!(a.end > a.start)) throw new Error(`${q.id}/${a.speaker}: end must follow start`);
    if (a.end > source.duration_seconds) throw new Error(`${q.id}/${a.speaker}: end past video duration`);
  }
}
for (const t of themes) {
  if (!t.blurb) throw new Error(`theme ${t.key}: missing blurb`);
  if (!questions.some((q) => q.theme === t.key)) throw new Error(`theme ${t.key}: no questions`);
}

// One hue per category. Spaced round the wheel, and each one has to hold up as
// small text on #07080a, which rules out anything much darker than these.
// None of them may be the answer teal, or the category signal and the "this is
// what someone said" signal would collide.
const hues = {
  definition: "#e8bd63",
  boundaries: "#7db8f5",
  "ai-shift": "#a98cf0",
  "services-trap": "#f0817f",
  economics: "#eb8fd0",
  "product-tension": "#f5b04e",
  hiring: "#9ed95e",
  team: "#64d4e8",
};
const answerHue = "#5ecfa8";
for (const t of themes) {
  t.hue = hues[t.key];
  if (!t.hue) throw new Error(`theme ${t.key}: no hue assigned`);
  if (t.hue.toLowerCase() === answerHue) throw new Error(`theme ${t.key}: hue collides with answer teal`);
}
if (new Set(Object.values(hues)).size !== Object.keys(hues).length) throw new Error("duplicate category hue");

// Soft fills are precomputed rather than left to color-mix(), so the page does
// not depend on that being supported.
const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
const themeVars = (t) => `--c:${t.hue}; --c-soft:${rgba(t.hue, 0.1)}; --c-line:${rgba(t.hue, 0.32)}`;

// The dash ban is a hard project rule, so enforce it at build time rather than
// trusting a manual sweep of a generated file.
const bannedDashes = /[—–]/;

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// YouTube honours whole seconds only, so a 2s lead-in is the cheapest way to
// avoid dropping the first word of an answer.
const link = (t) => `${source.url}&t=${Math.max(0, t - 2)}s`;

const clock = (t) => {
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

const answerCount = questions.reduce((n, q) => n + q.answers.length, 0);
const panelists = Object.values(people).filter((p) => p.org !== "Audience" && !p.moderator);
const orgs = [...new Set(panelists.map((p) => p.org))];
const audienceAsked = questions.filter((q) => people[q.asked_by].org === "Audience").length;
const minutes = Math.round(source.duration_seconds / 60);

// Questions keep their JSON order inside a category, and categories keep their
// declared order, so the page reads roughly in the order the panel ran.
const grouped = themes.map((t) => ({ ...t, items: questions.filter((q) => q.theme === t.key) }));

// Global 1..N numbering, assigned after grouping so the numbers ascend down the
// page rather than jumping about.
const numberOf = new Map();
let seq = 0;
for (const g of grouped) for (const q of g.items) numberOf.set(q.id, ++seq);

const answerHtml = (a) => {
  const p = people[a.speaker];
  return `
            <article class="a">
              <header class="a-top">
                <span class="a-who">
                  <span class="a-disc" aria-hidden="true">${esc(p.name.slice(0, 1).toUpperCase())}</span>
                  <span class="a-name">${esc(p.name)}<span class="a-org">${esc(p.org)}</span></span>
                </span>
                <a class="clip" href="${esc(link(a.start))}" target="_blank" rel="noopener"
                   aria-label="Watch ${esc(p.name)} answer this, at ${esc(clock(a.start))}">
                  <span class="clip-play" aria-hidden="true">&#9654;</span><span class="clip-t">${esc(clock(a.start))}</span>
                </a>
              </header>
              <p class="a-body">${esc(a.summary)}</p>
              ${a.quote ? `<blockquote class="pull"><p>${esc(a.quote)}</p></blockquote>` : ""}
            </article>`;
};

const itemHtml = (q, theme) => {
  const fromAudience = people[q.asked_by].org === "Audience";
  return `
          <details class="qa" id="${esc(q.id)}">
            <summary class="q">
              <span class="q-n">${String(numberOf.get(q.id)).padStart(2, "0")}</span>
              <span class="q-main">
                <span class="q-text">${esc(q.question)}</span>
                <span class="q-meta">
                  <span class="tag tag-c">${esc(theme.label)}</span>
                  <span class="tag">${q.answers.length} ${q.answers.length === 1 ? "answer" : "answers"}</span>
                  <span class="tag tag-t">${esc(clock(q.t))}</span>
                  ${fromAudience ? `<span class="tag tag-aud">Asked from the audience</span>` : ""}
                </span>
              </span>
              <span class="q-mark" aria-hidden="true"></span>
            </summary>
            <div class="body">
              ${q.context ? `<p class="ctx">${esc(q.context)}</p>` : ""}
              <div class="answers">${q.answers.map(answerHtml).join("")}
              </div>
            </div>
          </details>`;
};

const sectionHtml = (g, i) => `
      <section class="cat" id="cat-${esc(g.key)}" data-theme="${esc(g.key)}" style="${themeVars(g)}"
               aria-labelledby="cat-h-${esc(g.key)}">
        <header class="cat-head">
          <span class="cat-i" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>
          <div class="cat-t">
            <h2 id="cat-h-${esc(g.key)}">${esc(g.label)}</h2>
            <p>${esc(g.blurb)}</p>
          </div>
          <span class="cat-n"><b>${g.items.length}</b><i>${g.items.length === 1 ? "question" : "questions"}</i></span>
        </header>
        <div class="cat-list">${g.items.map((q) => itemHtml(q, g)).join("")}
        </div>
      </section>`;

// Where each question sits in the recording. Ticks are positioned by the real
// timestamp, so a cluster on the strip is a real cluster in the conversation.
const tickHtml = (q) => {
  const g = grouped.find((x) => x.key === q.theme);
  const pct = ((q.t / source.duration_seconds) * 100).toFixed(3);
  return `<a class="tick" href="#${esc(q.id)}" style="left:${pct}%; --c:${g.hue}"
     data-theme="${esc(q.theme)}"
     title="${esc(clock(q.t))} &middot; ${esc(g.label)} &middot; ${esc(q.question)}"><span></span></a>`;
};

const marks = [0, 600, 1200, 1800, 2400, 3000].filter((s) => s <= source.duration_seconds);

// FAQPage over the real panel answers, so the summaries are eligible for rich
// results and readable by the assistants that increasingly do the first search.
const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: questions.map((q) => ({
    "@type": "Question",
    name: q.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: q.answers
        .map((a) => `${people[a.speaker].name} (${people[a.speaker].org}): ${a.summary}`)
        .join(" "),
      url: `${source.url}&t=${Math.max(0, q.t - 2)}s`,
    },
  })),
};

const clipLd = {
  "@context": "https://schema.org",
  "@type": "VideoObject",
  name: source.title,
  description: `Panel discussion on forward deployed engineering with practitioners from ${orgs.join(", ")}, hosted by ${source.channel}.`,
  uploadDate: source.published,
  duration: `PT${Math.floor(source.duration_seconds / 60)}M${source.duration_seconds % 60}S`,
  embedUrl: `https://www.youtube.com/embed/${source.video_id}`,
  thumbnailUrl: [`https://i.ytimg.com/vi/${source.video_id}/maxresdefault.jpg`],
  publisher: { "@type": "Organization", name: source.channel },
  hasPart: questions.flatMap((q) =>
    q.answers.map((a) => ({
      "@type": "Clip",
      name: `${q.question} (${people[a.speaker].name}, ${people[a.speaker].org})`,
      startOffset: a.start,
      endOffset: a.end,
      url: `${source.url}&t=${Math.max(0, a.start - 2)}s`,
    })),
  ),
};

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Forward Deployed Engineer interview questions and answers, from FDE leads at ${orgs.join(", ")}</title>
<meta name="description" content="${questions.length} Forward Deployed Engineer questions answered by the people who run FDE teams at ${orgs.join(", ")}, sorted into ${themes.length} categories. What the role is, where consulting begins, how ROI is measured, what they screen for when hiring. Each answer links to the exact moment in the recording.">
<link rel="canonical" href="https://sameer-goel.com/forward-deployed-engineer/questions/">
<meta property="og:type" content="article">
<meta property="og:url" content="https://sameer-goel.com/forward-deployed-engineer/questions/">
<meta property="og:title" content="Forward Deployed Engineer: ${questions.length} questions and answers">
<meta property="og:description" content="${answerCount} answers from FDE leads at ${orgs.join(", ")}, in ${themes.length} categories. Each one links to the exact clip.">
<meta property="og:image" content="https://i.ytimg.com/vi/${source.video_id}/maxresdefault.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#07080a">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<script type="application/ld+json">${JSON.stringify(faqLd)}</script>
<script type="application/ld+json">${JSON.stringify(clipLd)}</script>
<style>
:root{
  --bg:#07080a;
  --panel:#0d0f13; --panel-2:#12151b; --panel-3:#171b22;
  --line:#1b1f26; --line-2:#252a33;
  --ink:#edf0f4; --ink-2:#9aa3b0; --ink-3:#646c78;
  --a:#5ecfa8;                          /* answers, in every category */
  --a-soft:rgba(94,207,168,.07);
  --a-line:rgba(94,207,168,.24);
  --c:#e8bd63; --c-soft:rgba(232,189,99,.10); --c-line:rgba(232,189,99,.32);
  --max:900px;
  /* depth: the inset top highlight is what actually reads as raised on dark */
  --e1:inset 0 1px 0 rgba(255,255,255,.045), 0 1px 2px rgba(0,0,0,.5), 0 8px 20px -10px rgba(0,0,0,.65);
  --e2:inset 0 1px 0 rgba(255,255,255,.07), 0 2px 4px rgba(0,0,0,.5), 0 18px 40px -16px rgba(0,0,0,.8);
  --e3:inset 0 1px 0 rgba(255,255,255,.09), 0 4px 8px rgba(0,0,0,.55), 0 30px 60px -20px rgba(0,0,0,.9);
}
*{box-sizing:border-box}
html{scroll-behavior:smooth; scroll-padding-top:7.5rem}
body{
  margin:0; color:var(--ink);
  background:
    radial-gradient(900px 420px at 12% -8%, rgba(232,189,99,.055), transparent 68%),
    radial-gradient(760px 380px at 88% 4%, rgba(94,207,168,.045), transparent 66%),
    var(--bg);
  font:400 17px/1.7 Inter,system-ui,-apple-system,sans-serif;
  -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility;
}
a{color:var(--a); text-decoration:none}
a:hover{text-decoration:underline}
.wrap{max-width:var(--max); margin:0 auto; padding:0 26px}

/* ---------- masthead ---------- */
.top{border-bottom:1px solid var(--line)}
.top-in{max-width:var(--max); margin:0 auto; padding:74px 26px 44px; text-align:center}
.kicker{
  display:inline-block; margin:0 0 22px; padding:7px 16px; border-radius:999px;
  font:500 11px/1 Inter; letter-spacing:.2em; text-transform:uppercase; color:var(--c);
  border:1px solid var(--c-line); background:var(--c-soft); box-shadow:var(--e1);
}
h1{
  margin:0 auto 20px; max-width:23ch;
  font:500 clamp(2.3rem,6vw,3.9rem)/1.09 Cormorant Garamond,Georgia,serif; letter-spacing:-.012em;
}
h1 em{font-style:italic; color:var(--c)}
.rule{width:54px; height:1px; margin:0 auto 24px; background:var(--c-line)}
.lede{margin:0 auto 34px; max-width:60ch; font-size:1.05rem; color:var(--ink-2)}
.lede strong{color:var(--ink); font-weight:500}

.figs{display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin:0; padding:0; list-style:none}
.figs li{
  padding:18px 10px 15px; border-radius:14px; border:1px solid var(--line);
  background:linear-gradient(180deg, var(--panel-2), var(--panel)); box-shadow:var(--e1);
}
.figs b{display:block; font:500 2rem/1.05 Cormorant Garamond,Georgia,serif; color:var(--c)}
.figs span{font:400 .67rem/1.5 Inter; letter-spacing:.15em; text-transform:uppercase; color:var(--ink-3)}

/* ---------- timeline map ---------- */
.map{padding:34px 0 4px; perspective:900px}
.map-h{
  display:flex; justify-content:space-between; align-items:baseline; gap:14px; margin:0 0 14px;
  font:400 .71rem/1.5 Inter; letter-spacing:.15em; text-transform:uppercase; color:var(--ink-3);
}
.strip{
  position:relative; height:66px; border-radius:14px;
  border:1px solid var(--line-2); background:linear-gradient(180deg,var(--panel-3),var(--panel));
  box-shadow:var(--e2);
  transform:rotateX(7deg); transform-origin:50% 100%; transition:transform .35s ease;
}
.map:hover .strip{transform:rotateX(0deg)}
.tick{position:absolute; top:9px; bottom:20px; width:11px; margin-left:-5.5px; display:block}
.tick span{
  display:block; width:3px; height:100%; margin:0 auto; border-radius:2px;
  background:var(--c); opacity:.5; box-shadow:0 0 9px var(--c);
  transition:opacity .16s, transform .16s;
}
.tick:hover span,.tick:focus-visible span{opacity:1; transform:scaleX(1.9)}
.tick.dim span{opacity:.09; box-shadow:none}
.axis{position:absolute; left:0; right:0; bottom:0; height:20px}
.axis i{
  position:absolute; transform:translateX(-50%);
  font:500 .63rem/20px JetBrains Mono,monospace; color:var(--ink-3); white-space:nowrap;
}
.map-note{margin:11px 0 0; font-size:.8rem; color:var(--ink-3); text-align:center}

/* ---------- sticky category nav ---------- */
.bar{
  position:sticky; top:0; z-index:30; margin-top:30px;
  border-top:1px solid var(--line); border-bottom:1px solid var(--line);
  background:rgba(7,8,10,.9); backdrop-filter:blur(16px) saturate(150%);
  box-shadow:0 12px 26px -18px rgba(0,0,0,.95);
}
.bar-in{max-width:var(--max); margin:0 auto; padding:12px 26px}
.bar-row{display:flex; align-items:center; justify-content:space-between; gap:14px; flex-wrap:wrap}
.pills{display:flex; gap:7px; flex-wrap:wrap; margin:0; padding:0; list-style:none}
.pill{
  display:inline-flex; align-items:center; gap:7px; cursor:pointer;
  border:1px solid var(--line-2); background:var(--panel); color:var(--ink-2);
  border-radius:999px; padding:7px 13px; font:500 .79rem/1 Inter;
  box-shadow:var(--e1); transition:border-color .16s, color .16s, background .16s, transform .12s;
}
.pill:hover{transform:translateY(-1px); color:var(--ink)}
.pill .dot{width:7px; height:7px; border-radius:50%; background:var(--pc,var(--ink-3)); box-shadow:0 0 7px var(--pc,transparent)}
.pill .pn{font:500 .7rem/1 JetBrains Mono,monospace; color:var(--ink-3)}
.pill[aria-pressed="true"]{border-color:var(--pc,var(--c-line)); color:var(--ink); background:var(--panel-3)}
.pill[aria-pressed="true"] .pn{color:var(--ink-2)}
.bar-btns{display:flex; align-items:center; gap:7px; flex-shrink:0}
.tbtn{
  font:500 .79rem/1 Inter; padding:8px 14px; border-radius:999px; cursor:pointer;
  background:transparent; border:1px solid var(--line-2); color:var(--ink-2);
  transition:border-color .16s, color .16s;
}
.tbtn:hover{border-color:var(--a-line); color:var(--a)}
.count{font:400 .73rem/1 Inter; letter-spacing:.1em; text-transform:uppercase; color:var(--ink-3)}

/* ---------- categories ---------- */
.list{padding:40px 0 10px}
.cat{margin-bottom:44px; scroll-margin-top:8rem}
.cat[hidden]{display:none}
.cat-head{
  display:flex; align-items:center; gap:18px; padding:20px 22px; margin-bottom:14px;
  border:1px solid var(--line); border-left:3px solid var(--c); border-radius:14px;
  background:linear-gradient(100deg, var(--c-soft), transparent 46%), linear-gradient(180deg,var(--panel-2),var(--panel));
  box-shadow:var(--e2);
}
.cat-i{flex-shrink:0; font:500 .78rem/1 JetBrains Mono,monospace; letter-spacing:.08em; color:var(--c); opacity:.75}
.cat-t{flex:1; min-width:0}
.cat-t h2{margin:0 0 5px; font:500 1.55rem/1.2 Cormorant Garamond,Georgia,serif; color:var(--ink); letter-spacing:-.006em}
.cat-t p{margin:0; font-size:.9rem; color:var(--ink-2)}
.cat-n{flex-shrink:0; text-align:right}
.cat-n b{display:block; font:500 1.5rem/1 Cormorant Garamond,Georgia,serif; color:var(--c)}
.cat-n i{font:400 .63rem/1.6 Inter; font-style:normal; letter-spacing:.14em; text-transform:uppercase; color:var(--ink-3)}
.cat-list{display:grid; gap:11px}

/* ---------- question cards ---------- */
.qa{
  border:1px solid var(--line); border-radius:14px; overflow:hidden;
  background:linear-gradient(180deg,var(--panel-2),var(--panel)); box-shadow:var(--e1);
  transition:box-shadow .2s, transform .16s, border-color .18s;
}
.qa:hover{transform:translateY(-2px); box-shadow:var(--e2); border-color:var(--line-2)}
.qa[open]{
  border-color:var(--c-line); box-shadow:var(--e3); transform:none;
  background:linear-gradient(180deg,var(--panel-3),var(--panel));
}
.q{display:flex; gap:16px; align-items:flex-start; cursor:pointer; padding:20px 22px; list-style:none; outline:none}
.q::-webkit-details-marker{display:none}
.q:focus-visible{box-shadow:inset 0 0 0 2px var(--c-line)}
.q-n{
  flex-shrink:0; margin-top:5px; width:1.6em;
  font:500 .78rem/1 JetBrains Mono,monospace; letter-spacing:.05em; color:var(--ink-3); transition:color .18s;
}
.qa[open] .q-n,.qa:hover .q-n{color:var(--c)}
.q-main{flex:1; min-width:0}
.q-text{
  display:block; font:500 clamp(1.14rem,2.3vw,1.34rem)/1.42 Cormorant Garamond,Georgia,serif;
  color:var(--ink); letter-spacing:.004em; transition:color .18s;
}
.qa[open] .q-text{color:var(--c)}
.q-meta{display:flex; align-items:center; gap:7px; flex-wrap:wrap; margin-top:10px}
.tag{
  font:400 .68rem/1 Inter; letter-spacing:.09em; text-transform:uppercase; color:var(--ink-3);
  border:1px solid var(--line-2); border-radius:999px; padding:5px 9px; background:rgba(255,255,255,.015);
}
.tag-c{color:var(--c); border-color:var(--c-line); background:var(--c-soft)}
.tag-t{font-family:JetBrains Mono,monospace; letter-spacing:.04em}
.tag-aud{color:var(--a); border-color:var(--a-line); background:var(--a-soft)}
.q-mark{position:relative; flex-shrink:0; width:15px; height:15px; margin-top:9px}
.q-mark::before,.q-mark::after{content:''; position:absolute; background:var(--ink-3); transition:transform .22s, background .18s}
.q-mark::before{top:7px; left:0; width:15px; height:1.5px}
.q-mark::after{top:0; left:6.75px; width:1.5px; height:15px}
.qa[open] .q-mark::before,.qa[open] .q-mark::after{background:var(--c)}
.qa[open] .q-mark::after{transform:rotate(90deg)}

.body{padding:0 22px 22px}
.ctx{
  margin:0 0 18px; padding:12px 16px; border-radius:10px;
  border:1px solid var(--line); border-left:2px solid var(--c-line); background:rgba(255,255,255,.014);
  color:var(--ink-2); font-size:.93rem; font-style:italic;
}
.answers{display:grid; gap:12px}

/* answers: teal in every category, so Q and A never blur */
.a{
  background:linear-gradient(180deg, var(--a-soft), rgba(94,207,168,.02));
  border:1px solid var(--a-line); border-radius:12px; padding:17px 19px; box-shadow:var(--e1);
}
.a-top{display:flex; flex-wrap:wrap; gap:12px; justify-content:space-between; align-items:center; margin-bottom:11px}
.a-who{display:inline-flex; align-items:center; gap:10px}
.a-disc{
  display:grid; place-items:center; width:28px; height:28px; border-radius:50%; flex-shrink:0;
  border:1px solid var(--a-line); background:rgba(94,207,168,.12);
  font:500 .8rem/1 Inter; color:var(--a); box-shadow:var(--e1);
}
.a-name{display:inline-flex; align-items:baseline; gap:9px; font:500 .96rem/1.2 Inter; color:var(--ink)}
.a-org{font:400 .7rem/1 Inter; letter-spacing:.11em; text-transform:uppercase; color:var(--a)}
.clip{
  display:inline-flex; align-items:center; gap:8px; flex-shrink:0;
  border:1px solid var(--a-line); border-radius:999px; padding:7px 13px;
  color:var(--a); font:500 .79rem/1 Inter; background:rgba(94,207,168,.08); box-shadow:var(--e1);
  transition:background .16s, transform .12s;
}
.clip:hover{background:rgba(94,207,168,.18); transform:translateY(-1px); text-decoration:none}
.clip-play{font-size:.58rem}
.clip-t{font-family:JetBrains Mono,monospace}
.a-body{margin:0; color:var(--ink-2); font-size:1rem}
.pull{margin:14px 0 0; padding:0 0 0 15px; border-left:2px solid var(--a)}
.pull p{margin:0; color:var(--ink); font:400 1.11rem/1.55 Cormorant Garamond,Georgia,serif; font-style:italic}
.pull p::before{content:'\\201C'} .pull p::after{content:'\\201D'}

/* ---------- closing ---------- */
.tip{
  margin:46px 0 0; padding:34px 32px; border-radius:18px;
  border:1px solid var(--c-line); box-shadow:var(--e3);
  background:linear-gradient(165deg, rgba(232,189,99,.10), transparent 58%), linear-gradient(180deg,var(--panel-2),var(--panel));
}
.tip .eye{margin:0 0 12px; font:500 11px/1 Inter; letter-spacing:.2em; text-transform:uppercase; color:var(--c)}
.tip h2{margin:0 0 16px; font:500 1.85rem/1.2 Cormorant Garamond,Georgia,serif; letter-spacing:-.008em}
.tip p{margin:0 0 15px; color:var(--ink-2); font-size:1rem}
.tip ol{margin:0 0 22px; padding-left:22px; color:var(--ink-2)}
.tip li{margin-bottom:12px; padding-left:5px}
.tip li strong{color:var(--ink); font-weight:500}
.btns{display:flex; flex-wrap:wrap; gap:11px; margin-top:4px}
.btn{display:inline-flex; align-items:center; gap:9px; border-radius:999px; padding:13px 24px; font:500 .93rem/1 Inter; border:1px solid transparent}
.btn-1{background:var(--c); color:#171204; box-shadow:var(--e2)}
.btn-1:hover{background:#f1cd80; text-decoration:none}
.btn-2{border-color:var(--line-2); color:var(--ink); background:transparent}
.btn-2:hover{border-color:var(--a); color:var(--a); text-decoration:none}

.src{border-top:1px solid var(--line); margin-top:56px}
.src .wrap{padding:38px 26px 62px}
.src h3{margin:0 0 12px; font:500 1.15rem/1.3 Cormorant Garamond,Georgia,serif; color:var(--ink-2)}
.src p{margin:0 0 12px; color:var(--ink-3); font-size:.87rem; line-height:1.75}
.src a{color:var(--ink-2); text-decoration:underline; text-decoration-color:var(--line-2)}
.src a:hover{color:var(--a)}

@media (max-width:720px){
  body{font-size:16px}
  .top-in{padding:50px 22px 34px}
  .figs{grid-template-columns:repeat(2,1fr)}
  .strip{transform:none; height:56px}
  .cat-head{flex-wrap:wrap; gap:12px; padding:17px 18px}
  .cat-n{text-align:left}
  .q{padding:17px 16px; gap:12px}
  .body{padding:0 16px 18px}
  .tip{padding:26px 22px}
  .bar-in{padding:11px 22px}
  .axis i:nth-child(even){display:none}
}
@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  *{transition:none !important}
  .strip{transform:none}
}
</style>
</head>
<body>

<header class="top">
  <div class="top-in">
    <p class="kicker">Forward Deployed Engineering</p>
    <h1>${questions.length} questions, answered by <em>the people running the teams</em></h1>
    <div class="rule"></div>
    <p class="lede">
      Sorted into ${themes.length} categories: what the role is, where it ends and consulting begins, how it gets
      measured, and what these teams screen for when they hire. Answered by the leads at
      <strong>${orgs.map(esc).join(", ")}</strong>.
      <strong>Pick a category, open a question, or click a timestamp to watch the answer.</strong>
    </p>
    <ul class="figs">
      <li><b>${questions.length}</b><span>Questions</span></li>
      <li><b>${answerCount}</b><span>Answers</span></li>
      <li><b>${themes.length}</b><span>Categories</span></li>
      <li><b>${orgs.length}</b><span>Companies</span></li>
    </ul>
  </div>
</header>

<main class="wrap">

  <div class="map">
    <p class="map-h"><span>Where each question sits in the ${minutes} minute recording</span><span>${clock(source.duration_seconds)}</span></p>
    <div class="strip">${questions.map(tickHtml).join("")}
      <div class="axis">${marks.map((s) => `<i style="left:${((s / source.duration_seconds) * 100).toFixed(2)}%">${clock(s)}</i>`).join("")}</div>
    </div>
    <p class="map-note">Each tick is one question, coloured by category. Click a tick to jump to it.</p>
  </div>

  <div class="bar">
    <div class="bar-in">
      <div class="bar-row">
        <ul class="pills">
          <li><button class="pill" data-filter="all" aria-pressed="true"><span class="dot" style="--pc:#9aa3b0"></span>All<span class="pn">${questions.length}</span></button></li>
          ${grouped.map((g) => `<li><button class="pill" data-filter="${esc(g.key)}" style="--pc:${g.hue}" aria-pressed="false"><span class="dot"></span>${esc(g.label)}<span class="pn">${g.items.length}</span></button></li>`).join("\n          ")}
        </ul>
        <div class="bar-btns">
          <span class="count" id="count">${questions.length} shown</span>
          <button class="tbtn" id="expand">Expand all</button>
          <button class="tbtn" id="collapse">Collapse all</button>
        </div>
      </div>
    </div>
  </div>

  <div class="list">${grouped.map(sectionHtml).join("")}
  </div>

  <section class="tip">
    <p class="eye">If you are preparing for an interview</p>
    <h2>How to actually use these answers</h2>
    <p>Reading them is not preparation. These are the questions FDE hiring managers care about, because they
    are the ones they argue about internally. Four things that turn this page into an edge:</p>
    <ol>
      <li><strong>Have a position on the consultant line.</strong> Every panelist circled it. If you cannot say
      when custom work should become product and when it should be refused, you sound like a contractor.</li>
      <li><strong>Bring one story where you changed the product, not just the deployment.</strong> The recurring
      test is whether your field work fed the roadmap. Know the before, the decision, and the outcome.</li>
      <li><strong>Say the number.</strong> These teams are judged on revenue per head. Attach a figure to your
      work, even a rough one, and explain how you would know whether it was real.</li>
      <li><strong>Expect a communication screen.</strong> Several teams add one on top of the normal loop,
      because you sit in front of the customer. Rehearse explaining your hardest project to a non-engineer.</li>
    </ol>
    <p>This is my work: embedded delivery, FDE resume reviews against measured job posting data, and training
    for Solutions Architects moving into forward-deployed roles. If you are interviewing and want a second pair
    of eyes, book a slot and bring the job description.</p>
    <div class="btns">
      <a class="btn btn-1" href="https://cal.com/sameer-goel/collab">Book 30 minutes</a>
      <a class="btn btn-2" href="/forward-deployed-engineer/">See the FDE hiring data</a>
    </div>
  </section>
</main>

<footer class="src">
  <div class="wrap">
    <h3>Where this came from</h3>
    <p>
      These are the questions and answers from <a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.title)}</a>,
      a ${minutes} minute panel published by ${esc(source.channel)} on ${esc(source.published)},
      with the people who lead or built the forward deployed engineering function at ${orgs.map(esc).join(", ")}.
      ${audienceAsked} of the questions were asked by working FDEs in the audience.
    </p>
    <p>
      The panel content belongs to the speakers and to ${esc(source.channel)}. This page is an index, not a
      replacement: answers are summarised in plain language rather than transcribed, quotes are short and
      attributed, and every timestamp links back to the recording so the speakers get the view. Timestamps came
      from the video captions and were checked against them one by one, and each link starts a couple of seconds
      early on purpose so the first word is not clipped.
    </p>
    <p>Compiled by <a href="https://sameer-goel.com/">Sameer Goel</a>.</p>
  </div>
</footer>

<script>
(function(){
  var items = Array.prototype.slice.call(document.querySelectorAll('.qa'));
  var cats  = Array.prototype.slice.call(document.querySelectorAll('.cat'));
  var pills = Array.prototype.slice.call(document.querySelectorAll('.pill'));
  var ticks = Array.prototype.slice.call(document.querySelectorAll('.tick'));
  var count = document.getElementById('count');

  // Expand all only touches what is currently visible, so it matches the filter.
  document.getElementById('expand').addEventListener('click', function(){
    items.forEach(function(d){
      var c = d.closest('.cat');
      if (!c || !c.hidden) d.open = true;
    });
  });
  document.getElementById('collapse').addEventListener('click', function(){
    items.forEach(function(d){ d.open = false; });
  });

  // Filtering hides whole categories rather than individual cards, so the
  // section headers keep their meaning and the counts stay honest.
  function apply(key){
    var shown = 0;
    cats.forEach(function(c){
      var on = (key === 'all' || c.getAttribute('data-theme') === key);
      c.hidden = !on;
      if (on) shown += c.querySelectorAll('.qa').length;
    });
    ticks.forEach(function(t){
      t.classList.toggle('dim', !(key === 'all' || t.getAttribute('data-theme') === key));
    });
    pills.forEach(function(p){
      p.setAttribute('aria-pressed', String(p.getAttribute('data-filter') === key));
    });
    count.textContent = shown + ' shown';
  }
  pills.forEach(function(p){
    p.addEventListener('click', function(){
      // Clicking the active pill clears back to all.
      apply(p.getAttribute('aria-pressed') === 'true' ? 'all' : p.getAttribute('data-filter'));
    });
  });

  // Jumping to a question has to work whether it came from a shared link, a
  // timeline tick, or the back button, and it has to survive an active filter:
  // a tick for a filtered-out category would otherwise scroll to a hidden
  // element and look broken.
  function reveal(hash){
    if (!hash) return;
    var t;
    try { t = document.querySelector(hash); } catch (e) { return; }
    if (!t || !t.classList.contains('qa')) return;
    var c = t.closest('.cat');
    if (c && c.hidden) {
      apply(c.getAttribute('data-theme'));
      t.scrollIntoView({ block: 'center' });
    }
    t.open = true;
  }
  window.addEventListener('hashchange', function(){ reveal(location.hash); });
  reveal(location.hash);
})();
</script>
</body>
</html>
`;

if (bannedDashes.test(html)) {
  const at = html.search(bannedDashes);
  throw new Error(`em or en dash in output near: ${JSON.stringify(html.slice(at - 70, at + 70))}`);
}
if (/undefined|NaN|\[object Object\]/.test(html)) {
  throw new Error("unresolved value in output");
}

writeFileSync(join(root, "index.html"), html);
console.log(
  `built index.html  ${(html.length / 1024).toFixed(1)}kb  ` +
    `${questions.length} questions  ${answerCount} answers  ${themes.length} categories  collapsed by default`,
);
for (const g of grouped) console.log(`  ${g.hue}  ${String(g.items.length).padStart(2)}  ${g.label}`);
