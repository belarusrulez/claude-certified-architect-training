# Architecture

Single-page, no-build, ES-module web app. Static files only; a web server is
needed solely because browsers block module loading over `file://`.

## Component hub

```mermaid
graph TD
  idx[index.html<br/>shell] --> css[css/styles.css]
  idx --> app[js/app.js<br/>nav · views · routing · boot]

  app --> domains[data/domains.js<br/>DOMAINS, DOMAIN_NAME]
  app --> topics[data/topics.js<br/>TOPICS + getChapterScenarios]
  app --> state[js/state.js<br/>state · persist · hydrate · seeded RNG]
  app --> quiz[js/quiz.js<br/>render · grade · score]

  topics --> extra[data/extra.js<br/>CHAPTER_EXTRA]
  topics --> extramore[data/extra-more.js<br/>CHAPTER_EXTRA_MORE]

  quiz --> state
  state --> store[js/store.js<br/>localStorage I/O]

  subgraph serving
    compose[docker-compose.yml] --> nginx[deploy/nginx.conf]
    serve[serve.py]
  end
  nginx -. serves .-> idx
  serve -. serves .-> idx
```

## Data flow

- **Boot** (`app.js`): `store.load()` → `hydrate()` into `state` → render the
  last view (or the URL hash).
- **Interaction** (`quiz.js`): every answer / grade / reset calls `persist()`,
  which snapshots durable slices of `state` and writes them via `store.save()`.
- **Routing**: `location.hash` is the source of truth for `view/tab`; the
  sidebar and cards drive it through `go()`.

## Persistence model (single user, `localStorage` key `cca_progress`, v2)

| field         | meaning                                              |
|---------------|------------------------------------------------------|
| `studied[]`   | topic ids visited                                    |
| `chapterBest` | tid → best scaled scenario-exam score                |
| `bestMixed`   | best scaled mixed-exam score                         |
| `quizzes`     | inst → `{ answers, graded }`                          |
| `seeds`       | inst → integer seed driving the option shuffle       |
| `mixedSel`    | `[{tid, idx}]` — the ten chosen mixed questions      |
| `lastView`    | view to restore on next load                         |

The **seed** is the key to exact resume: option order is shuffled
deterministically from `(seed, questionIndex)`, so a reloaded quiz shows the
same layout and the saved answer indices still line up.

## Decisions

- **No build / no framework** — content is data; rendering is template strings.
  Keeps the app forkable and the diff readable.
- **Why a server at all** — ES modules only; everything else is static.
- **Docker primary, `serve.py` fallback** — user requested "nothing installed
  but Docker"; the Python server covers the no-Docker case.

## Status

| Area                    | State |
|-------------------------|-------|
| Modular split           | Done  |
| Local single-user state | Done  |
| Expanded "real deal"    | Done (21/21 chapters) |
| 10+ scenarios/chapter   | Done  |
| Docker + serve.py       | Done  |
