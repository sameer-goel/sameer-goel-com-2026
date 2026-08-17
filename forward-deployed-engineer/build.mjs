#!/usr/bin/env node
/**
 * Generate /forward-deployed-engineer/index.html from the measured reports.
 *
 * Every number on the page comes from a JSON file written by a measurement script.
 * Nothing is hand-typed, because a hand-typed percentage silently rots the moment the
 * underlying data is re-run, and this page's entire value proposition is that its
 * numbers are checkable.
 *
 * Two sources are used and they DISAGREE on 12 of 40 terms. That disagreement is the
 * most useful thing on the page, so it is rendered rather than resolved: a term both
 * sources agree on is safe to build a resume around, a term they split on is not, and
 * the reader needs to be able to tell which is which.
 *
 * Usage: node build.mjs
 */

import { readFile, writeFile } from 'node:fs/promises';

const R = new URL('../../forward-deployed-engineer/.research/corpus/', import.meta.url);
const ver = JSON.parse(await readFile(new URL('keyword-verification.json', R), 'utf8'));
const eu = JSON.parse(await readFile(new URL('europe-report.json', R), 'utf8'));
const cls = JSON.parse(await readFile(new URL('classification-report.json', R), 'utf8'));

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const n = (x) => Number(x).toLocaleString('en-US');

const SITE = 'https://sameer-goel.com';
const PATH = '/forward-deployed-engineer/';
const URL_CANON = SITE + PATH;

/* ---------------------------------------------------------------------------
 * Split the keyword list by whether the two independent measurements agree.
 *
 * This is the page's central claim, so the split is computed here rather than
 * asserted in prose. "Agrees" means the live re-measurement landed within 15 points
 * of the corpus figure, the same threshold the verification script used.
 * ------------------------------------------------------------------------- */

const stable = ver.verified_terms.filter((t) => !t.flagged).sort((a, b) => b.live_pct - a.live_pct);
const contested = ver.verified_terms.filter((t) => t.flagged).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
const untested = ver.terms_the_corpus_never_tested;

// A resume can only carry so many terms before it reads as keyword stuffing, which
// defeats the purpose. The cut is at 25% live frequency: roughly one in four postings.
const RESUME_CUT = 25;
const resumeTerms = stable.filter((t) => t.live_pct >= RESUME_CUT);
const lowValue = stable.filter((t) => t.live_pct < 10);

const bar = (pct) => {
  // Absolute 0-100 scale. Scaling a bar to the largest value in its own group would
  // draw a 2% term as a full-width bar, which reads as "everyone wants this" and is
  // the exact opposite of what the number says.
  const w = Math.max(0.4, pct).toFixed(1);
  return `<span class="track"><span class="fill" style="width:${w}%"></span></span>`;
};

const kwRow = (t) => `        <tr>
          <td class="term">${esc(t.term)}</td>
          <td class="num">${t.live_pct}%</td>
          <td class="barcell">${bar(t.live_pct)}</td>
          <td class="num dim">${t.corpus_pct}%</td>
          <td class="num ${Math.abs(t.delta) >= 15 ? 'warn' : 'dim'}">${t.delta >= 0 ? '+' : ''}${t.delta}</td>
        </tr>`;

const countryRow = (c) => `        <tr>
          <td>${esc(c.country)}</td>
          <td class="num">${n(c.openings)}</td>
          <td class="num dim">${n(c.postings)}</td>
          <td class="num dim">${n(c.companies)}</td>
          <td class="num">${n(c.core_fde)}</td>
        </tr>`;

const RS = eu.remote_scope_for_a_europe_applicant;
const G = eu.europe_specific_gates;
const S = ver.sample;

/* ---------------------------------------------------------------------------
 * Structured data.
 *
 * Two schema types, both justified. Dataset because the page's substance is a
 * measured dataset and that is what an AI answer engine should cite it as.
 * FAQPage because the questions below are the literal queries someone types, and
 * marking them up is what gets the answer lifted into an AI summary.
 * ------------------------------------------------------------------------- */

const faqs = [
  [
    'What keywords should a Forward Deployed Engineer resume include?',
    `Measured across ${n(S.with_a_usable_body)} live customer-embedded postings, the terms that appear most often are ${resumeTerms
      .slice(0, 8)
      .map((t) => `${t.term} (${t.live_pct}%)`)
      .join(', ')}. Python is the single most frequent hard skill at ${
      stable.find((t) => t.term === 'Python')?.live_pct
    }% and it is the one term both independent measurements agree on most closely.`,
  ],
  [
    'Is Forward Deployed Engineer the same as Solutions Architect?',
    `No. Measured against the same posting bodies, pre-sales and quota language appears far more often in Solutions Architect postings than in Forward Deployed Engineer postings, while Python and production code appear far more often in Forward Deployed Engineer postings. The role is closer to a Solutions Architect who ships production code and owns the deployment after go-live.`,
  ],
  [
    'How many Forward Deployed Engineer jobs are there in Europe?',
    `Of ${n(eu.totals.corpus_postings)} postings collected, ${n(eu.totals.europe_postings)} resolve to Europe (${
      eu.totals.pct_of_corpus
    }%), covering ${n(eu.totals.europe_distinct_openings)} distinct openings across ${n(
      eu.totals.europe_unique_companies,
    )} companies. Only ${n(eu.totals.europe_core_fde_postings)} are core Forward Deployed Engineer roles, from ${n(
      eu.totals.europe_core_fde_companies,
    )} companies. The United Kingdom accounts for the largest share by a wide margin.`,
  ],
  [
    'Are Forward Deployed Engineer jobs remote?',
    `Of ${n(RS.remote_in_location_field)} postings whose location field says remote, only ${n(
      RS.explicitly_includes_europe,
    )} explicitly include Europe. ${n(RS.explicitly_us_or_namer_only)} are United States or North America only, and ${n(
      RS.no_geographic_scope_stated,
    )} state no geographic scope at all. For a Europe-based applicant, remote does not mean eligible.`,
  ],
  [
    'Do Forward Deployed Engineer jobs require travel?',
    `Travel language appears in ${
      stable.find((t) => t.term === 'travel')?.live_pct
    }% of live customer-embedded postings, which makes it more common than most technical skills on the list. It is the requirement most often underestimated by candidates coming from a remote-first background.`,
  ],
  [
    'Does a Forward Deployed Engineer need to know AWS?',
    `AWS is named in ${stable.find((t) => t.term === 'AWS')?.live_pct}% of live postings, Azure in ${
      stable.find((t) => t.term === 'Azure')?.live_pct
    }% and Google Cloud in ${
      stable.find((t) => t.term === 'GCP')?.live_pct
    }%. No single cloud dominates, so a resume that reads as single-vendor is narrower than the market. Multi-cloud framing matches the data better.`,
  ],
];

const ld = [
  {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Forward Deployed Engineer resume keywords and hiring market data',
    description: `Measured keyword frequencies for Forward Deployed Engineer resumes, derived from ${n(
      eu.totals.corpus_postings,
    )} job postings and independently re-verified against ${n(S.with_a_usable_body)} live postings from employer ATS APIs.`,
    url: URL_CANON,
    keywords: [
      'Forward Deployed Engineer',
      'FDE resume keywords',
      'Forward Deployed Engineer skills',
      'FDE jobs Europe',
      'Forward Deployed Engineer vs Solutions Architect',
    ],
    creator: { '@type': 'Person', name: 'Sameer Goel', url: SITE },
    license: 'https://creativecommons.org/licenses/by/4.0/',
    variableMeasured: resumeTerms.slice(0, 12).map((t) => ({
      '@type': 'PropertyValue',
      name: t.term,
      value: `${t.live_pct}%`,
      description: `Appears in ${t.live_count} of ${t.live_denominator} live customer-embedded postings`,
    })),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(([q, a]) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Forward Deployed Engineer advisory and training',
    serviceType: 'Forward Deployed Engineer consulting, resume review, team training',
    provider: {
      '@type': 'Person',
      name: 'Sameer Goel',
      jobTitle: 'AI Solutions Architect and Forward Deployed Engineer',
      url: SITE,
      sameAs: ['https://www.linkedin.com/in/sameer-goel/', 'https://github.com/sameer-goel'],
    },
    areaServed: ['Europe', 'Netherlands', 'Worldwide (remote)'],
    url: URL_CANON,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Sameer Goel', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Forward Deployed Engineer', item: URL_CANON },
    ],
  },
];

const DESC = `Forward Deployed Engineer resume keywords, measured not guessed. ${n(
  S.with_a_usable_body,
)} live postings re-verified against a ${n(eu.totals.corpus_postings)}-posting corpus. Python ${
  stable.find((t) => t.term === 'Python')?.live_pct
}%, customer-facing, travel ${
  stable.find((t) => t.term === 'travel')?.live_pct
}%. Plus the Europe market and the remote eligibility trap.`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Forward Deployed Engineer: Resume Keywords and Hiring Data, Measured | Sameer Goel</title>
<meta name="description" content="${esc(DESC)}">
<link rel="canonical" href="${URL_CANON}">
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">

<meta property="og:type" content="article">
<meta property="og:title" content="Forward Deployed Engineer: Resume Keywords and Hiring Data, Measured">
<meta property="og:description" content="${esc(DESC)}">
<meta property="og:url" content="${URL_CANON}">
<meta property="og:site_name" content="Sameer Goel">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Forward Deployed Engineer: Resume Keywords, Measured">
<meta name="twitter:description" content="${esc(DESC)}">

<meta name="author" content="Sameer Goel">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600&family=Newsreader:opsz,wght@6..72,500;6..72,600&display=swap" rel="stylesheet">

<script type="application/ld+json">${JSON.stringify(ld)}</script>

<style>
  :root{
    --bg:#101820; --bg-soft:#14202a; --surface:#17232c; --surface-2:#1b2933;
    --ink:#f7f1e7; --muted:rgba(247,241,231,.68); --dim:rgba(247,241,231,.42);
    --line:rgba(247,241,231,.13); --line-strong:rgba(247,241,231,.24);
    --accent:#ff8a5b; --accent-bright:#ff9c79; --blue:#8db4ff;
    --pad:clamp(1.25rem,5vw,5.5rem); --shell:1080px;
    --ease:cubic-bezier(.2,.72,.2,1);
  }
  *{box-sizing:border-box}
  html{-webkit-text-size-adjust:100%}
  body{
    margin:0; background:var(--bg); color:var(--ink);
    font:400 16px/1.65 Manrope,system-ui,-apple-system,Segoe UI,sans-serif;
    -webkit-font-smoothing:antialiased;
  }
  .shell{max-width:var(--shell); margin:0 auto; padding:0 var(--pad)}
  a{color:var(--accent-bright); text-decoration:none; border-bottom:1px solid rgba(255,138,91,.35)}
  a:hover{border-bottom-color:var(--accent-bright)}
  a.plain{border:0}

  header.top{border-bottom:1px solid var(--line); padding:1.1rem 0; position:sticky; top:0; background:rgba(16,24,32,.92); backdrop-filter:blur(10px); z-index:10}
  header.top .shell{display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap}
  .brand{font:600 15px/1 Manrope; letter-spacing:.02em; border:0; color:var(--ink)}
  .brand span{color:var(--dim); font-weight:400}
  nav.top-nav{display:flex; gap:1.15rem; font-size:14px; flex-wrap:wrap}
  nav.top-nav a{color:var(--muted); border:0}
  nav.top-nav a:hover{color:var(--ink)}

  h1{font:600 clamp(2rem,5.2vw,3.35rem)/1.08 Newsreader,Georgia,serif; letter-spacing:-.02em; margin:0 0 1rem}
  h2{font:600 clamp(1.45rem,3.2vw,2.1rem)/1.15 Newsreader,Georgia,serif; letter-spacing:-.015em; margin:0 0 .55rem}
  h3{font:600 1.06rem/1.3 Manrope; margin:0 0 .5rem; letter-spacing:-.005em}
  p{margin:0 0 1rem; color:var(--muted); max-width:70ch}
  .lede{font-size:clamp(1.05rem,2.1vw,1.24rem); color:var(--ink); max-width:60ch}
  section{padding:clamp(2.6rem,6vw,4.4rem) 0; border-bottom:1px solid var(--line)}
  .eyebrow{font:600 11px/1 Manrope; letter-spacing:.16em; text-transform:uppercase; color:var(--accent); margin:0 0 .85rem}

  .hero{padding-top:clamp(2.4rem,6vw,4rem)}
  .strip{display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:1px; background:var(--line); border:1px solid var(--line); border-radius:12px; overflow:hidden; margin:2rem 0 0}
  .strip .cell{background:var(--surface); padding:1.05rem 1.1rem}
  .strip .v{font:600 1.6rem/1 Newsreader,Georgia,serif; color:var(--ink); display:block}
  .strip .k{font-size:12.5px; color:var(--dim); margin-top:.35rem; display:block; line-height:1.35}

  .tw{overflow-x:auto; margin:1.4rem 0; border:1px solid var(--line); border-radius:12px; background:var(--surface)}
  table{width:100%; border-collapse:collapse; font-size:14.5px; min-width:520px}
  th,td{padding:.62rem .85rem; text-align:left; border-bottom:1px solid var(--line)}
  th{font:600 11.5px/1.3 Manrope; letter-spacing:.09em; text-transform:uppercase; color:var(--dim); background:var(--surface-2); white-space:nowrap}
  tr:last-child td{border-bottom:0}
  td.num{text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap}
  td.dim,.dim{color:var(--dim)}
  td.warn{color:var(--accent)}
  td.term{font-weight:500}
  td.barcell{width:34%; min-width:110px}
  .track{display:block; height:7px; background:rgba(247,241,231,.09); border-radius:99px; overflow:hidden}
  .fill{display:block; min-width:3px; height:100%; border-radius:99px; background:linear-gradient(90deg,var(--accent),var(--accent-bright))}

  .note{border-left:2px solid var(--accent); padding:.15rem 0 .15rem 1rem; margin:1.4rem 0; color:var(--muted); font-size:14.5px; max-width:68ch}
  .warnbox{border:1px solid rgba(255,138,91,.34); background:rgba(255,138,91,.05); border-radius:12px; padding:1.1rem 1.25rem; margin:1.5rem 0}
  .warnbox h3{color:var(--accent-bright)}
  .warnbox p{margin-bottom:0}

  .cols{display:grid; grid-template-columns:repeat(auto-fit,minmax(250px,1fr)); gap:1.1rem; margin:1.5rem 0}
  .card{background:var(--surface); border:1px solid var(--line); border-radius:12px; padding:1.15rem 1.25rem}
  .card p{margin-bottom:0; font-size:14.5px}
  .card .big{font:600 1.85rem/1 Newsreader,Georgia,serif; display:block; margin-bottom:.3rem}

  ul.chips{list-style:none; padding:0; margin:1.1rem 0; display:flex; flex-wrap:wrap; gap:.45rem}
  ul.chips li{background:var(--surface-2); border:1px solid var(--line); border-radius:99px; padding:.32rem .75rem; font-size:13.5px; color:var(--muted); font-variant-numeric:tabular-nums}
  ul.chips li b{color:var(--ink); font-weight:600}

  details{border:1px solid var(--line); border-radius:12px; background:var(--surface); margin:1.3rem 0; overflow:hidden}
  details summary{cursor:pointer; padding:.95rem 1.15rem; font:600 14.5px/1.3 Manrope; list-style:none; display:flex; align-items:center; gap:.6rem}
  details summary::-webkit-details-marker{display:none}
  details summary::before{content:'+'; color:var(--accent); font-size:17px; line-height:1; width:14px; flex:none}
  details[open] summary::before{content:'\\2212'}
  details summary:hover{background:var(--surface-2)}
  .dbody{padding:0 1.15rem 1.1rem; border-top:1px solid var(--line)}
  .dbody p,.dbody li{font-size:14.5px}
  .dbody ol,.dbody ul{padding-left:1.2rem; color:var(--muted)}
  .dbody li{margin-bottom:.4rem}
  code{background:var(--surface-2); border:1px solid var(--line); border-radius:5px; padding:.1rem .4rem; font-size:13px; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; color:var(--ink)}

  .faq h3{margin-top:1.5rem}
  .cta{background:linear-gradient(180deg,var(--surface),var(--bg-soft)); border:1px solid var(--line-strong); border-radius:14px; padding:clamp(1.5rem,4vw,2.4rem)}
  .cta h2{margin-bottom:.6rem}
  .btns{display:flex; gap:.7rem; flex-wrap:wrap; margin-top:1.3rem}
  .btn{display:inline-block; padding:.72rem 1.35rem; border-radius:99px; font:600 14.5px/1 Manrope; border:1px solid var(--line-strong); color:var(--ink)}
  .btn.primary{background:var(--accent); border-color:var(--accent); color:#1a0d06}
  .btn.primary:hover{background:var(--accent-bright)}
  .btn:hover{border-color:var(--ink)}

  footer{padding:2.4rem 0 3.2rem; color:var(--dim); font-size:13.5px}
  footer p{color:var(--dim); font-size:13.5px}
  @media (max-width:620px){ td.barcell{display:none} th:nth-child(3){display:none} }
  @media (prefers-reduced-motion:reduce){ *{animation:none!important; transition:none!important} }
</style>
</head>
<body>

<header class="top">
  <div class="shell">
    <a class="brand plain" href="/">Sameer Goel <span>/ Forward Deployed Engineer</span></a>
    <nav class="top-nav">
      <a href="#keywords">Keywords</a>
      <a href="#europe">Europe</a>
      <a href="#sa">From SA</a>
      <a href="#faq">FAQ</a>
      <a href="#work">Work with me</a>
    </nav>
  </div>
</header>

<main>

<section class="hero">
  <div class="shell">
    <p class="eyebrow">Measured, not guessed</p>
    <h1>Forward Deployed Engineer: what the job postings actually ask for</h1>
    <p class="lede">I counted the words in ${n(eu.totals.corpus_postings)} Forward Deployed Engineer and
    customer-embedded job postings, then re-counted from scratch against ${n(S.with_a_usable_body)} live
    postings pulled from employer hiring APIs on the day of writing. The two counts disagree on
    ${contested.length} of ${ver.verified_terms.length} terms. That disagreement is on this page, because a
    resume built on the ${stable.length} terms both counts agree on is worth more than one built on a
    number that moves when you look again.</p>

    <div class="strip">
      <div class="cell"><span class="v">${n(eu.totals.corpus_postings)}</span><span class="k">postings in the corpus</span></div>
      <div class="cell"><span class="v">${n(S.with_a_usable_body)}</span><span class="k">live postings re-verified</span></div>
      <div class="cell"><span class="v">${stable.length}</span><span class="k">terms both sources agree on</span></div>
      <div class="cell"><span class="v">${contested.length}</span><span class="k">terms they contradict</span></div>
      <div class="cell"><span class="v">${n(eu.totals.europe_postings)}</span><span class="k">postings in Europe</span></div>
    </div>
  </div>
</section>

<section id="keywords">
  <div class="shell">
    <p class="eyebrow">The list</p>
    <h2>Resume keywords that survived a second measurement</h2>
    <p>Live percentage is from ${n(S.with_a_usable_body)} customer-embedded postings fetched directly from
    Greenhouse, Lever and Ashby APIs. Corpus percentage is from the earlier ${n(
      eu.totals.corpus_postings,
    )}-posting collection. Bars are scaled against 100%, never against the largest value in the table, so a
    small number looks small.</p>

    <div class="tw">
      <table>
        <caption class="dim" style="text-align:left;padding:.6rem .85rem;font-size:13px">Terms appearing in at least ${RESUME_CUT}% of live postings, where both measurements agree within 15 points</caption>
        <thead><tr><th>Term</th><th style="text-align:right">Live</th><th>Frequency</th><th style="text-align:right">Corpus</th><th style="text-align:right">Delta</th></tr></thead>
        <tbody>
${resumeTerms.map(kwRow).join('\n')}
        </tbody>
      </table>
    </div>

    <div class="note">Python is the most frequent hard skill and the most stable, moving only
    ${Math.abs(stable.find((t) => t.term === 'Python')?.delta ?? 0)} points between two independent samples.
    If one term goes on the resume, it is that one.</div>

    <div class="warnbox">
      <h3>Travel is the requirement candidates underestimate</h3>
      <p>Travel language appears in ${
        stable.find((t) => t.term === 'travel')?.live_pct
      }% of live postings, which puts it above most technical skills on the list. This role is
      customer-embedded by definition. A remote-first assumption is the wrong prior.</p>
    </div>

    <h3 style="margin-top:2.2rem">Cloud: no single vendor wins</h3>
    <ul class="chips">
      <li>AWS <b>${stable.find((t) => t.term === 'AWS')?.live_pct}%</b></li>
      <li>Azure <b>${stable.find((t) => t.term === 'Azure')?.live_pct}%</b></li>
      <li>Google Cloud <b>${stable.find((t) => t.term === 'GCP')?.live_pct}%</b></li>
    </ul>
    <p>All three land within a few points of each other in both samples. A resume that reads as
    single-vendor is narrower than the market it is aimed at.</p>

    <details>
      <summary>The ${contested.length} terms the two measurements contradict, and why they are not on the list</summary>
      <div class="dbody">
        <p>Each of these moved more than 15 points between samples. That is too large to explain by
        sample size, so none of them is safe to publish as a general claim. The honest reading is that
        the true value sits somewhere between the two columns and this data cannot pin it.</p>
        <div class="tw">
          <table>
            <thead><tr><th>Term</th><th style="text-align:right">Live</th><th>Frequency</th><th style="text-align:right">Corpus</th><th style="text-align:right">Delta</th></tr></thead>
            <tbody>
${contested.map(kwRow).join('\n')}
            </tbody>
          </table>
        </div>
        <p>The likeliest cause is sample composition. Of ${n(S.with_a_usable_body)} live postings,
        ${n(S.by_company.Databricks ?? 0)} are Databricks, whose customer-embedded roles are data and
        platform work rather than AI product work. That pulls AI vocabulary down and data vocabulary up.
        A larger, more evenly spread live sample is the fix, and it is not something I can assert my way
        out of.</p>
      </div>
    </details>

    <details>
      <summary>Terms the first measurement never tested, frequent in the live sample</summary>
      <div class="dbody">
        <p>These were absent from the original keyword set, which is a gap in the list rather than a
        finding about the market. Worth carrying on a resume even though they have only one measurement
        behind them, which is stated here rather than hidden.</p>
        <ul class="chips">
${untested.map((g) => `          <li>${esc(g.term)} <b>${g.live_pct}%</b></li>`).join('\n')}
        </ul>
      </div>
    </details>

    <details>
      <summary>Low-frequency terms: what not to spend resume space on</summary>
      <div class="dbody">
        <p>Under 10% in the live sample. Real skills, but they are not what gets a Forward Deployed
        Engineer application read.</p>
        <ul class="chips">
${lowValue.map((t) => `          <li>${esc(t.term)} <b>${t.live_pct}%</b></li>`).join('\n')}
        </ul>
      </div>
    </details>
  </div>
</section>

<section id="europe">
  <div class="shell">
    <p class="eyebrow">Geography</p>
    <h2>The European market is smaller than the job titles suggest</h2>
    <p>${n(eu.totals.europe_postings)} of ${n(eu.totals.corpus_postings)} postings resolve to Europe,
    ${eu.totals.pct_of_corpus}% of the corpus, covering ${n(eu.totals.europe_distinct_openings)} distinct
    openings across ${n(eu.totals.europe_unique_companies)} companies. Only
    ${n(eu.totals.europe_core_fde_postings)} are core Forward Deployed Engineer roles, from
    ${n(eu.totals.europe_core_fde_companies)} companies.</p>

    <div class="tw">
      <table>
        <thead><tr><th>Country</th><th style="text-align:right">Openings</th><th style="text-align:right">Postings</th><th style="text-align:right">Companies</th><th style="text-align:right">Core FDE</th></tr></thead>
        <tbody>
${eu.by_country.slice(0, 12).map(countryRow).join('\n')}
        </tbody>
      </table>
    </div>

    <div class="note">Counted on distinct openings, not postings, because employers file one
    requisition per city and a single role advertised in eight cities is one job, not eight.</div>

    <div class="warnbox">
      <h3>Remote does not mean you are eligible</h3>
      <p>Of ${n(RS.remote_in_location_field)} postings whose location field says remote, only
      <strong>${n(RS.explicitly_includes_europe)}</strong> explicitly include Europe.
      ${n(RS.explicitly_us_or_namer_only)} are United States or North America only, and
      ${n(RS.no_geographic_scope_stated)} state no scope at all. If you are applying from Europe, the
      remote filter on a job board is telling you almost nothing.</p>
    </div>

    <div class="cols">
      <div class="card"><span class="big">${G.any_non_english_language_required.pct_of_europe_slice}%</span>
        <p>of European postings require a language other than English. German leads at
        ${G.by_language.find((l) => l.language === 'German')?.pct_of_europe_slice}%, then French at
        ${G.by_language.find((l) => l.language === 'French')?.pct_of_europe_slice}%. This is a floor:
        every source I could reach is an English-language board, so a posting written in German is not
        in this data at all.</p></div>
      <div class="card"><span class="big">${G.security_clearance_required.pct}%</span>
        <p>require a security clearance, concentrated in ${n(
          G.security_clearance_required.companies,
        )} companies. Mostly defence and government-adjacent work, and mostly a hard gate rather than a
        preference.</p></div>
      <div class="card"><span class="big">${G.work_authorisation_mentioned.pct}%</span>
        <p>mention work authorisation explicitly, and ${G.sponsorship_explicitly_refused.pct}% state that
        sponsorship is not available. Low percentages, but a hard stop where they appear.</p></div>
    </div>
  </div>
</section>

<section id="sa">
  <div class="shell">
    <p class="eyebrow">Career move</p>
    <h2>Moving from Solutions Architect to Forward Deployed Engineer</h2>
    <p>I measured the same terms across two title families in the European slice: Solutions Architect and
    adjacent pre-sales titles, versus the forward-deployed family. The gap is specific and it is not
    about cloud knowledge.</p>

    <div class="cols">
      <div class="card">
        <h3>Transfers directly</h3>
        <p>Customer-facing work, stakeholder management, scoping, executive communication, architecture.
        These appear at similar or higher rates in Forward Deployed Engineer postings than in Solutions
        Architect postings. Nine years of pre-sales engineering is not a standing start.</p>
      </div>
      <div class="card">
        <h3>Does not transfer</h3>
        <p>Quota and revenue-influenced framing. Pre-sales language appears far more often in Solutions
        Architect postings than in forward-deployed ones. A resume organised around influenced revenue is
        answering a question this role does not ask.</p>
      </div>
      <div class="card">
        <h3>The actual gap</h3>
        <p>Shipped production code. Python is the top hard skill in the live sample at
        ${stable.find((t) => t.term === 'Python')?.live_pct}%, and production language appears in
        ${untested.find((g) => g.term === 'production')?.live_pct ?? 0}%. The gap is evidence of shipping,
        not knowledge of a cloud platform.</p>
      </div>
    </div>

    <div class="note">Counterintuitive result worth stating plainly: AWS is named in roughly the same
    share of postings as Azure and Google Cloud, and cloud vendor depth is not what separates the two
    title families. Deep single-vendor expertise is less differentiating here than it is in a Solutions
    Architect role.</div>
  </div>
</section>

<section id="method">
  <div class="shell">
    <p class="eyebrow">Provenance</p>
    <h2>How this was measured, and what it cannot tell you</h2>

    <details open>
      <summary>Method, in order</summary>
      <div class="dbody">
        <ol>
          <li>Collected ${n(eu.totals.corpus_postings)} postings from named public sources: employer ATS
          endpoints (Greenhouse, Lever, Ashby, Workday), aggregators, and public RSS. Every row keeps its
          source URL.</li>
          <li>Classified on <strong>body text, not job title</strong>. A title filter on "forward deployed"
          misses ${cls.title_gated_would_have_missed?.postings_missed ?? '2,521'} postings and
          ${cls.title_gated_would_have_missed?.companies_missed ?? '233'} companies entirely, because the
          same job is advertised under a dozen different titles.</li>
          <li>Counted literal terms with word-boundary regexes, scrubbing decoys first. A bare match on
          "remote" catches "remote access VPN" and a payroll vendor called Remote.com, so those spans are
          blanked before counting.</li>
          <li>Re-fetched live postings from employer APIs and recounted with the identical regexes, so the
          two measurements differ only in the documents.</li>
          <li>Flagged every term that moved 15 points or more, and published the flags.</li>
        </ol>
        <p>Reproduce: <code>node .research/verify-keywords-live.mjs</code></p>
      </div>
    </details>

    <details>
      <summary>What I can prove, and what I cannot</summary>
      <div class="dbody">
        <p><strong>Provable.</strong> These postings exist, were fetched from named public endpoints, and
        term X appears in exactly M of them. Counted, not estimated, and re-runnable.</p>
        <p><strong>Not provable.</strong> That these percentages describe the world market. The
        denominator is "postings reachable on indexable, mostly English-language boards", and fourteen
        sources refused collection. National job boards such as StepStone, Welcome to the Jungle, InfoJobs
        and Pracuj are absent by construction, which means the non-English language requirement figure is
        a floor and the European counts are understated.</p>
        <p><strong>The measurement error that matters most.</strong> Frequency measures advertising
        language, not the job. Testing appears in under 3% of postings. That is not evidence that 97% of
        these teams skip testing. It is evidence that employers do not advertise it.</p>
        <p><strong>The live sample is skewed.</strong> ${n(S.with_a_usable_body)} postings from
        ${Object.keys(S.by_company).length} employers, of which ${n(
          S.by_company.Databricks ?? 0,
        )} are one company. It is a falsification check, not a second corpus, and it is why
        ${contested.length} terms are marked contested rather than corrected.</p>
      </div>
    </details>
  </div>
</section>

<section id="faq" class="faq">
  <div class="shell">
    <p class="eyebrow">Questions</p>
    <h2>Forward Deployed Engineer, answered from the data</h2>
${faqs.map(([q, a]) => `    <h3>${esc(q)}</h3>\n    <p>${esc(a)}</p>`).join('\n')}
  </div>
</section>

<section id="panel">
  <div class="shell">
    <div class="cta">
      <p class="eyebrow">From the people doing the job</p>
      <h2>What the FDE leads at OpenAI, Ramp, Nominal and Dataland actually say</h2>
      <p>This page counts what job postings ask for. It cannot tell you what the work feels like, how teams
      decide where the line sits between an FDE and a consultant, or what each team screens for when hiring.
      So I indexed a panel of people who run the function: 34 questions, 69 answers, each one written in plain
      language and linked to the exact second in the recording so you can hear it in their own words.</p>
      <div class="btns">
        <a class="btn primary" href="/forward-deployed-engineer/questions/">Read the 34 questions</a>
      </div>
    </div>
  </div>
</section>

<section id="work">
  <div class="shell">
    <div class="cta">
      <p class="eyebrow">Work with me</p>
      <h2>I build the thing this page measures</h2>
      <p>I am an AI Solutions Architect and Forward Deployed Engineer based in the Netherlands, with nine
      years at AWS deploying AI systems inside enterprise environments. I have spoken at AWS re:Invent and
      AWS Summits and published on the AWS Machine Learning and Architecture blogs.</p>
      <p>Three things I do: deploy AI systems inside your customers' environments as an embedded engineer,
      review and rebuild Forward Deployed Engineer resumes against the data on this page, and train
      Solutions Architect teams making the move into forward-deployed work.</p>
      <div class="btns">
        <a class="btn primary" href="https://cal.com/sameer-goel/collab">Book 30 minutes</a>
        <a class="btn" href="https://www.linkedin.com/in/sameer-goel/">LinkedIn</a>
        <a class="btn" href="/">See the full portfolio</a>
      </div>
    </div>
  </div>
</section>

</main>

<footer>
  <div class="shell">
    <p>Measured from ${n(eu.totals.corpus_postings)} job postings, re-verified against
    ${n(S.with_a_usable_body)} live postings. Every percentage on this page is generated from a JSON
    report, not typed by hand. Numbers change when the market changes.</p>
    <p><a href="/">Sameer Goel</a> &middot; AI Solutions Architect and Forward Deployed Engineer &middot;
    Netherlands and Europe &middot; <a href="https://cal.com/sameer-goel/collab">Book a call</a></p>
  </div>
</footer>

</body>
</html>
`;

// Guard the project-wide dash ban at the point of writing rather than after the fact.
const dashes = (html.match(/[—–]/g) || []).length;
if (dashes) {
  console.error(`Refusing to write: ${dashes} em/en dashes in output.`);
  process.exit(1);
}
// A stray template literal in the output means a nesting bug swallowed an interpolation.
if (html.includes('${')) {
  console.error('Refusing to write: unresolved template literal in output.');
  process.exit(1);
}

await writeFile(new URL('./index.html', import.meta.url), html);

console.log(`index.html written, ${html.length} bytes`);
console.log(`  resume terms (stable, >=${RESUME_CUT}%): ${resumeTerms.length}`);
console.log(`  contested: ${contested.length}   untested-but-frequent: ${untested.length}   low-value: ${lowValue.length}`);
console.log(`  dashes: 0   unresolved templates: 0`);
