# sameer-goel.com, DeCoDE redesign

Next.js 15 (App Router) + TypeScript + Tailwind 4 + Motion, exported as a fully static site.

## Run locally
```bash
npm install
npm run dev          # http://localhost:3000
npm run lint && npx tsc --noEmit
npm run build        # static output in ./out
npx serve out        # preview the production build
```

## Where things live
| Path | What |
|---|---|
| `src/content/site.ts` | ALL copy and evidence: WHY/WHAT/HOW, DeCoDE, evidence items, thinking, lab, connect. Edit here, not in components. |
| `src/components/` | Hero, NeuralField (canvas, decorative), Triad, Reflection, DecodeExplorer, EvidenceExplorer, LearningLab |
| `src/app/*/page.tsx` | Routes: `/`, `/why/`, `/decode/`, `/evidence/`, `/thinking/`, `/lab/`, `/connect/` |
| `public/img/` | Optimized local images (brain emblem, hero landscape, talk photos) |
| `public/og.jpg` | Social preview card |
| `docs/` | Deploy guide, migration checklist, facts to verify |

## Rules baked in
- No em dashes anywhere. `grep -rnP "\x{2014}" src` must return nothing.
- Every evidence item links to its source. Lessons are labelled "Interpretation".
- No trackers, cookies, phone, address or personal email.
- Canvas and motion are decorative only. All meaningful text is in the static HTML.
- `prefers-reduced-motion` stops the neural animation and all transitions.

## Adding evidence
Append an object to `EVIDENCE` in `src/content/site.ts` with `title, kind, year, venue, topics, url` and optionally `lesson`.
