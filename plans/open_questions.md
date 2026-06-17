# Open questions

Central ledger of unresolved questions for the trainer. Schema per the project
convention: `Q-NNN`, raised date, blocks, context. Resolved items move to
`## Resolved` (never deleted).

## Open

_None._

## Resolved

### Q-001 · How far to restructure the repo?
**Raised:** 2026-06-17 (kickoff)
**Decision:** Full modular ES-module split (`css/`, `js/`, `js/data/`), served
via Docker (nginx) with a `serve.py` fallback.
**Rationale:** User chose the modular option and asked for Docker-only local
setup. ES modules require a server anyway, which Docker/serve.py provide.
**Landed in:** Phase 1 + Phase 5. — RESOLVED 2026-06-17

### Q-002 · How much state to persist for a single user?
**Raised:** 2026-06-17 (kickoff)
**Decision:** Rich progress — studied, answers, graded, per-chapter best,
best mixed, seeded shuffle for exact resume, plus Export/Import/Reset.
**Rationale:** User selected the rich option; the old `window.storage` bridge
didn't work outside the artifact sandbox.
**Landed in:** Phase 2. — RESOLVED 2026-06-17

### Q-003 · Source of truth for expanded "real deal" content?
**Raised:** 2026-06-17 (kickoff)
**Decision:** Authored from model knowledge of Claude / Claude Code / the
Anthropic API, not cross-checked against the PDF.
**Rationale:** User chose "from my knowledge" for speed. Risk: wording may
drift from the official guide.
**Follow-up:** A later pass could reconcile each chapter against
`docs/exam-guide.pdf`.
**Landed in:** Phase 3. — RESOLVED 2026-06-17
