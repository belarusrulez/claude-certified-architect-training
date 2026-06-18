# Claude Certified Architect — Foundations Trainer

A single-user study app for the **Claude Certified Architect (CCA) Foundations**
exam. Walks all five exam domains chapter by chapter, each with the same ladder:

1. **Learn** — the actual engineering, edge cases, and exam traps, with an
   "Explain like I'm 5" simple take tucked behind a hover chip at the top.
2. **Quick checks** — fast concept questions.
3. **Scenario questions** — 10+ exam-style scenarios per chapter, scored to the 720 line.

Plus a **Mixed exam** that pulls ten scenarios at random across every domain.

Progress (studied chapters, answers, graded state, per-chapter best scores,
best mixed score) is stored **locally in your browser** via `localStorage` —
no account, no server-side state. Export / import / reset live in the sidebar.

## Run it

### Docker (nothing to install but Docker)

```bash
docker compose up
# open http://localhost:8088
docker compose down   # stop
```

### Python fallback (no Docker)

```bash
python3 serve.py --open      # http://localhost:8088
```

> The app uses ES modules, which the browser refuses to load over `file://`.
> Use one of the servers above rather than double-clicking `index.html`.

## Layout

```
.
├── index.html              # shell: loads css + js/app.js (module)
├── css/styles.css          # all styling
├── js/
│   ├── app.js              # nav, views, routing, boot, data tools
│   ├── state.js            # in-memory state + persistence glue + seeded RNG
│   ├── store.js            # localStorage load/save/export/import/reset
│   ├── quiz.js             # question rendering, grading, scoring
│   └── data/
│       ├── domains.js      # the five domains, weights, and chapter lists
│       ├── topics.js       # aggregator: merges d1..d5 into TOPICS
│       └── d1.js … d5.js   # one module per domain; each chapter carries its
│                           #   own eli5 / real / example / quick / scenario
│                           #   and a `ts` task-statement tag (e.g. "1.3")
├── deploy/nginx.conf       # static-serving config for the Docker image
├── docker-compose.yml
├── serve.py                # Docker-free local server
├── docs/exam-guide.pdf     # official Foundations exam guide
└── plans/                  # architecture + build-order docs
```

## Coverage

Chapters map **1:1 to the exam guide's task statements** (Domain → `x.y`), so
there are no silent gaps. 30 chapters across 5 domains; each is tagged with its
task-statement id (shown in the chapter header).

## Adding content

- **A new question** → append to the chapter's `scenario` (or `quick`) array in
  the relevant `js/data/d{N}.js`. Shape: `{ q, options:[…4…], correct, why,
  traps:{…} }`. The app shuffles option order per question (deterministically
  from a stored seed), so `correct` points at the right option in its authored
  position.
- **A new chapter** → add an entry to the right `js/data/d{N}.js` (with a `ts`
  tag) and list its id under that domain in `js/data/domains.js`.

## Scoring

Each scenario set and the mixed exam scale `correct/total` to a 1000-point
scale; **720** is the pass line, mirroring the real exam.
