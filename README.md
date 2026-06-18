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
│       ├── domains.js      # the five domains and weights
│       ├── topics.js       # per-chapter content (eli5 / real / quick / scenario)
│       ├── examples.js     # one worked artifact per chapter (shown in Learn)
│       ├── extra.js        # seed scenario bank
│       └── extra-more.js   # expanded scenario bank (tops each chapter to 10+)
├── deploy/nginx.conf       # static-serving config for the Docker image
├── docker-compose.yml
├── serve.py                # Docker-free local server
├── docs/exam-guide.pdf     # official Foundations exam guide
└── plans/                  # architecture + build-order docs
```

## Adding content

- **A new question** → append to the chapter's array in `js/data/extra-more.js`
  (or `extra.js`). Shape: `{ q, options:[…4…], correct, why, traps:{…} }`.
  The app shuffles option order per question (deterministically from a stored
  seed), so author with `correct` pointing at the right option in its
  authored position.
- **A new chapter** → add an entry to `js/data/topics.js` and list its id under
  the right domain in `js/data/domains.js`.

## Scoring

Each scenario set and the mixed exam scale `correct/total` to a 1000-point
scale; **720** is the pass line, mirroring the real exam.
