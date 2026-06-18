/* =========================================================================
   EXAMPLES — one concrete, copy-pasteable artifact per chapter, shown at the
   bottom of the "Learn" tab. A slash command / SKILL.md / config / API snippet
   that embodies the chapter's concept. Keyed by topic id; rendered as raw
   HTML inside a <div class="example"> by app.js.

   NOTE: these are JS template-literal strings, so any literal ${...} must be
   written as \${...}, and any literal < / > inside a <pre> must be HTML-escaped
   (&lt; / &gt;) so it isn't parsed as a tag.
   ========================================================================= */
export const EXAMPLES = {
/* ---- Domain 1 ---- */
'agent-loop':{ label:'Example — loop driven by stop_reason', body:
`while True:
    resp = client.messages.create(model="claude-opus-4-8",
                                  messages=msgs, tools=tools)
    if resp.stop_reason != "tool_use":
        break                                   # end_turn -> done
    msgs.append({"role": "assistant", "content": resp.content})
    results = [run_tool(b) for b in resp.content if b.type == "tool_use"]
    msgs.append({"role": "user", "content": results})  # one result per tool_use` },

'multi-agent':{ label:'Example — parallel subagent spawn (coordinator)', body:
`# coordinator's allowedTools must include "Task".
# Emit BOTH Task calls in ONE response -> they run in parallel.
Task(subagent_type="researcher",
     prompt="Cover MUSIC. Return JSON: claim, source, date, excerpt.")
Task(subagent_type="researcher",
     prompt="Cover FILM.  Return JSON: claim, source, date, excerpt.")
# subagents do NOT inherit history -> pass the context they need explicitly` },

'hooks':{ label:'Example — PreToolUse gate (.claude/settings.json)', body:
`{
  "hooks": {
    "PreToolUse": [
      { "matcher": "process_refund",
        "command": "./hooks/gate_refund.py" }   // exit 2 = block + escalate
    ],
    "PostToolUse": [
      { "matcher": "lookup_order",
        "command": "./hooks/normalize_dates.py" }  // ISO-8601 every result
    ]
  }
}` },

'decomposition':{ label:'Example — fixed pipeline vs branch/resume', body:
`# prompt chaining: same predictable checks, per file, then one integration pass
for f in changed_files:
    claude -p "Review \${f} for local issues"
claude -p "Cross-file integration pass over all reviews"

claude --resume billing-investigation   # continue a specific named session
# fork_session -> branch two refactor approaches from one shared baseline` },

/* ---- Domain 2 ---- */
'tool-descriptions':{ label:'Example — disambiguating tool description', body:
`{
  "name": "lookup_order",
  "description": "Look up an ORDER by its order number (e.g. #12345): "
                 "status, items, shipping. Do NOT use for account/profile "
                 "lookups - use get_customer for those.",
  "input_schema": {
    "type": "object",
    "properties": { "order_id": { "type": "string" } },
    "required": ["order_id"]
  }
}` },

'structured-errors':{ label:'Example — structured MCP error return', body:
`return {
  "isError": true,
  "errorCategory": "business",   // transient | validation | business | permission
  "isRetryable": false,
  "message": "Refund of $800 exceeds the $500 policy limit."
}
# valid query, zero matches != error -> return a normal empty result, not isError` },

'tool-distribution':{ label:'Example — tool_choice modes', body:
`tool_choice = {"type": "auto"}                          # may answer in text
tool_choice = {"type": "any"}                           # must call SOME tool
tool_choice = {"type": "tool", "name": "extract_meta"}  # must call THAT tool
# scope each agent to ~4-5 role tools; array order does NOT enforce call order` },

'mcp-config':{ label:'Example — project .mcp.json (committed, shared)', body:
`{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "\${GITHUB_TOKEN}" }   // env-var, not the secret
    }
  }
}
// personal/experimental servers go in ~/.claude.json instead (not shared)` },

/* ---- Domain 3 ---- */
'claudemd':{ label:'Example — modular CLAUDE.md', body:
`# CLAUDE.md  (project root - shared with everyone who clones the repo)
@import ./.claude/rules/testing.md
@import ./packages/api/CLAUDE.md

# team-wide standards live here (project scope).
# personal-only rules go in ~/.claude/CLAUDE.md and are never shared.
# run /memory to see which memory files actually loaded.` },

'commands-skills':{ label:'Example — a /review command + a skill', body:
`# .claude/commands/review.md   ->  invoked as /review
Run the team review checklist on the staged diff:
- report correctness & security only; skip style
- output each finding as  file:line - severity - one-line fix

# .claude/skills/release-notes/SKILL.md
---
description: Draft release notes from merged PRs
context: fork                 # isolate verbose output from the main session
allowed-tools: [Read, Grep]   # no Bash / destructive tools
argument-hint: &lt;version-tag&gt;   # prompt for the required param
---` },

'path-rules':{ label:'Example — path-scoped rule (.claude/rules/)', body:
`# .claude/rules/tests.md
---
paths: ["**/*.test.tsx", "**/*.spec.ts"]
---
- one behaviour per test; no snapshot tests for logic
- mock at the network boundary, never the unit under test

# loads ONLY when editing a file matching the glob - regardless of directory` },

'plan-mode':{ label:'Example — entering plan mode for a big change', body:
`# large, multi-file, architectural -> plan BEFORE editing
"Use plan mode. Explore the monolith with the Explore subagent, map module
 dependencies, and propose service boundaries. Do NOT change any files until
 I approve the plan."

# a one-line fix with a clear stack trace -> just direct-execute it.` },

'cicd':{ label:'Example — Claude Code in CI (non-interactive)', body:
`# -p / --print: process the prompt, print, exit (no input hang)
claude -p "Review this PR for security issues" \\
  --output-format json \\
  --json-schema ./review.schema.json > findings.json

# an independent instance (no generation context) catches more than self-review.
# on re-runs, pass prior findings so it only reports new/unaddressed issues.` },

/* ---- Domain 4 ---- */
'explicit-criteria':{ label:'Example — categorical review criteria (/review)', body:
`# .claude/commands/review.md
Report ONLY:
- correctness bugs (null deref, off-by-one, race conditions)
- security issues (injection, broken authz, leaked secrets)
SKIP: style, naming, formatting.
For each finding: file:line - severity(critical|major) - one-line fix.
# specific categories beat "be conservative / only high-confidence".` },

'few-shot':{ label:'Example — 2-4 few-shot routing examples', body:
`&lt;example&gt;
Input: "check my order #12345"
Tool:  lookup_order    # order number present -> order tool, not get_customer
&lt;/example&gt;
&lt;example&gt;
Input: "update my email address"
Tool:  get_customer    # profile change -> customer tool
&lt;/example&gt;
# cover the AMBIGUOUS cases and show WHY, so judgment generalizes.` },

'structured-output':{ label:'Example — schema-constrained extraction', body:
`tools = [{
  "name": "extract_invoice",
  "input_schema": { "type": "object",
    "properties": {
      "total":     { "type": ["number", "null"] },  // nullable -> no fabrication
      "po_number": { "type": ["string", "null"] }
    }, "required": ["total"] }
}]
tool_choice = {"type": "tool", "name": "extract_invoice"}
# schema kills SYNTAX errors, not SEMANTIC ones (e.g. lines that don't sum).` },

'validation-retry':{ label:'Example — retry-with-error-feedback', body:
`# only format/structural failures are worth retrying - feed the SPECIFIC error
followup = [
  {"role": "user",      "content": original_doc},
  {"role": "assistant", "content": failed_extraction},
  {"role": "user",      "content": "date must be ISO 8601 (YYYY-MM-DD). Re-extract."}
]
# data absent from the source can't be conjured by retrying - don't.` },

'batch':{ label:'Example — Message Batches submission', body:
`# ~50% cheaper, up to 24h window, no latency SLA, no in-request multi-turn tools
client.messages.batches.create(requests=[
  {"custom_id": "doc-001", "params": { ...one-shot request... }},
  {"custom_id": "doc-002", "params": { ...one-shot request... }}
])
# resubmit only FAILED custom_ids. never use batch for a blocking pre-merge check.` },

/* ---- Domain 5 ---- */
'context-preservation':{ label:'Example — persistent case-facts block', body:
`# re-sent verbatim every turn, OUTSIDE the summarized history, near the TOP
CASE FACTS (do not summarize):
- order #A-4471   refund $129.99   status: APPROVED
- customer_id: 88213
- promised callback: 2026-06-18

[ summarized conversation history below... ]` },

'escalation':{ label:'Example — escalation criteria (prompt / skill)', body:
`Escalate to a human IF:
- the customer explicitly asks for one  -> do it immediately, no triage first
- the policy has no rule for the case   -> a genuine exception
- you cannot make progress

Do NOT escalate based on tone/sentiment or your own confidence score -
both are poorly calibrated. On multiple identity matches, ask for another ID.` },

'error-propagation':{ label:'Example — structured error propagation', body:
`# a subagent timeout -> return CONTEXT, not a flat "search unavailable"
return {
  "status": "error",
  "failureType": "timeout",
  "attemptedQuery": "AI music tools 2024",
  "partialResults": [ ...what it did get... ],
  "alternatives": ["narrow the date range", "try a news source"]
}
# never silently return empty-as-success, and don't kill the whole workflow.` },

'provenance':{ label:'Example — claim-to-source mapping', body:
`{
  "claim":    "The market reached $4.2B in 2023",
  "source":   "https://example.com/market-report",
  "document": "Gartner Market Guide 2023",
  "excerpt":  "...reaching $4.2 billion in 2023...",
  "date":     "2023-11-02"
}
# two credible sources conflict? keep BOTH with attribution - never average or pick.` },
};
