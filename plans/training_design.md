# Training design — evidence-based practices in the trainer

How the app turns exam-guide content into effective learning, and which
research-backed techniques each feature implements.

## The per-chapter ladder (concrete → abstract → retrieval → transfer)

Each chapter runs the same four-rung ladder, which mirrors how durable skill is built:

1. **ELI5 (hover)** — a concrete analogy first. Lowers the entry cost and gives a
   mental hook before any jargon. Hidden behind a hover chip so it's optional
   scaffolding, not a wall of baby-talk for returning learners.
2. **Learn / "the real deal"** — the actual mechanism, faithful to the guide's
   *Knowledge of* bullets, plus a **worked example** (a real slash command /
   `SKILL.md` / config / API snippet). Worked examples reduce cognitive load for
   novices far better than problem-solving alone (the *worked-example effect*).
3. **Quick checks** — 2-3 low-stakes retrieval questions. **Retrieval practice**
   (the testing effect) builds memory far better than re-reading.
4. **Scenario questions** — ≥10 exam-style application items. **Transfer**: apply
   the concept in a realistic production situation, the form the real exam uses.

## Techniques and where they live

| Technique | Evidence | In the app |
|---|---|---|
| Worked examples | worked-example effect (Sweller) | one runnable example per chapter |
| Retrieval practice | testing effect (Roediger & Karpicke) | quick checks + scenario grading |
| Spaced & repeatable practice | spacing effect | seeded shuffle + reshuffle; localStorage resume keeps progress across sessions |
| Interleaving | interleaving improves discrimination | Mixed exam pulls scenarios across all 5 domains |
| Misconception-targeted distractors | feedback that corrects errors | every wrong option carries a `traps` note explaining *why* it's wrong, drawn from the guide's stated distractors |
| Immediate elaborated feedback | feedback timing | on grading, each item shows *why the answer is right* + *why the others fail* |
| Concrete → abstract | dual coding, analogy | ELI5 analogy → mechanism → applied scenario |
| Goal-relevant scope | desirable difficulties | scenarios scored to the real **720/1000** line so practice matches the target |

## Coverage discipline

The chapter set is a **1:1 map to the guide's task statements** (Domain → `x.y`),
so there are no silent gaps. Each chapter is tagged with its task-statement id;
the build asserts every `x.y` is represented (`scripts`/verification in
`build_order.md`). When the guide changes, the diff is visible at the chapter
level.

## Distractor authoring rule

Distractors are not random wrong answers — each targets a *specific* incomplete
mental model the guide warns about (e.g., "array order enforces tool-call order",
"a bigger context window fixes attention dilution", "self-reported confidence is a
good escalation trigger"). The `traps` note names the flaw so a wrong pick becomes
a teaching moment.

## What this is not

- Not a flashcard drill — items are scenario-based judgment, matching the exam.
- Not exhaustive lecture notes — depth is tuned to what the task statement tests,
  not everything knowable about the topic.
