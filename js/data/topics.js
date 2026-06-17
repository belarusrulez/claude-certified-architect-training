/* =========================================================================
   CONTENT MODEL  —  add a topic by appending to TOPICS and listing its id
   under the right domain in domains.js. Each topic:
   { domain, title, eli5, real, callout?, quick:[{q,options,correct,why}],
     scenario:[{q,options,correct,why,traps}] }

   `real` is rich HTML: <p> prose, <h4> sub-headers, <ul>/<li> lists, and
   an optional <div class="edge"> block for edge cases / exam traps.
   ========================================================================= */
export const TOPICS = {
/* ---------------- DOMAIN 1 ---------------- */
'agent-loop':{ domain:'d1', title:'The agent loop',
  eli5:`<p>Imagine a super-smart robot locked in a glass box with <strong>no hands</strong>. It can think, but it can't touch anything. You give it a goal; it asks you to do one thing (look out the window), you do it and report back, it thinks again, and asks for the next thing.</p><p>That circle — <strong>think → ask for an action → get the result → think again</strong> — repeated until it has the answer, is the agent loop. An "agent" is just this wheel spinning by itself until the job is done.</p>`,
  real:`<p>Every model turn comes back stamped with a <code>stop_reason</code>. Your code reads it: while it's <code>"tool_use"</code>, you run the requested tool, append the <code>tool_result</code> to the conversation, and call the model again. When it's <code>"end_turn"</code>, you stop — that turn is the final answer.</p><p>The robust rule is to drive the loop off <strong>what's actually in the response</strong> — unanswered <code>tool_use</code> blocks mean continue; a text-only turn means done. Tool results accumulate in history so the model can reason over the new information each iteration.</p>
  <h4>The full set of stop reasons</h4>
  <ul>
    <li><code>end_turn</code> — Claude finished naturally. Terminal: return the text.</li>
    <li><code>tool_use</code> — Claude wants one or more tools run. Execute <em>all</em> requested calls, append every matching <code>tool_result</code>, loop.</li>
    <li><code>max_tokens</code> — output ceiling hit mid-generation. The turn may be <strong>truncated</strong> — a half-written tool call is not a valid request and the text is not a clean final answer. Raise <code>max_tokens</code> or continue generation; don't treat it as either terminal or a runnable tool call.</li>
    <li><code>stop_sequence</code> — a configured stop string was emitted.</li>
    <li><code>pause_turn</code> (long-running server tools) — resend the response back to continue.</li>
  </ul>
  <h4>Edge cases & failure modes</h4>
  <ul>
    <li><strong>Multiple tool_use blocks in one turn.</strong> A single turn can request several tools. Return a <code>tool_result</code> for <em>every</em> one (matched by <code>tool_use_id</code>) in the next user message, or the conversation is malformed.</li>
    <li><strong>Text + tool in the same turn.</strong> Claude often narrates ("Let me check that order…") <em>and</em> calls a tool. Assistant text is not a "done" signal.</li>
    <li><strong>tool_result order is free, IDs are not.</strong> Results are correlated by <code>tool_use_id</code>, not position — but each requested call must get exactly one result.</li>
    <li><strong>Errored tools still need a result.</strong> On a tool failure, return a <code>tool_result</code> with <code>is_error: true</code> so the model can recover — don't drop the call.</li>
  </ul>
  <div class="edge"><b>Exam traps</b>Never terminate by (a) parsing prose for "done"/"task complete", (b) checking whether assistant text exists, or (c) a fixed iteration cap as the <em>primary</em> stop. A cap is a safety backstop only; the real signal is <code>stop_reason</code> + unanswered <code>tool_use</code> blocks.</div>`,
  callout:`<b>Anti-patterns the exam tests</b>Never terminate by parsing the model's prose, checking for assistant text, or using a fixed iteration cap as the primary stop. Loop control is <code>stop_reason</code> + unanswered tool calls — nothing else.`,
  quick:[
    {q:`Your loop should <strong>continue</strong> when <code>stop_reason</code> is ___ and <strong>stop</strong> when it is ___.`,
     options:[`continue on <code>end_turn</code>, stop on <code>tool_use</code>`,`continue on <code>tool_use</code>, stop on <code>end_turn</code>`,`continue on <code>max_tokens</code>, stop on <code>tool_use</code>`,`it doesn't depend on <code>stop_reason</code>`],
     correct:1, why:`<code>tool_use</code> means Claude wants a tool run (continue); <code>end_turn</code> means it's finished (stop).`},
    {q:`What should primarily drive loop termination?`,
     options:[`Parsing the assistant's natural-language text for "done"`,`A fixed cap of N iterations`,`<code>stop_reason</code> plus whether unanswered <code>tool_use</code> blocks remain`,`Customer sentiment`],
     correct:2, why:`Termination is determined by the response structure, not prose, caps, or sentiment.`},
  ],
  scenario:[
    {q:`An engineer's agent "hangs": Claude returns a <code>tool_use</code> request, but the conversation never progresses and Claude seems to wait forever. Most likely cause?`,
     options:[`The executor ran the tool but never sent a <code>tool_result</code> back in the next request, so the loop has nothing to continue from.`,`<code>stop_reason</code> was <code>end_turn</code>, so the agent correctly stopped.`,`The system prompt was too long.`,`Claude exceeded <code>max_tokens</code> and crashed the server.`],
     correct:0, why:`A <code>tool_use</code> request is an open question. The loop only advances when you feed the matching <code>tool_result</code> into the next request.`,
     traps:{B:`The premise says a tool was requested, so it wasn't <code>end_turn</code>.`,C:`Prompt length doesn't leave a tool request dangling.`,D:`<code>max_tokens</code> truncates a response; it doesn't hang the loop.`}},
    {q:`A model turn returns <code>stop_reason: "max_tokens"</code> in the middle of what looks like a tool call. Correct interpretation?`,
     options:[`Claude finished normally; treat it as the final answer.`,`Claude requested a tool; run it and continue.`,`The response was cut off by the token limit — it may be truncated, so don't treat it as a clean tool call or a final answer.`,`The API errored; resend the identical request and it will succeed.`],
     correct:2, why:`<code>max_tokens</code> means the generation hit the output ceiling mid-stream; the content (including a half-written tool call) may be incomplete.`,
     traps:{A:`Only <code>end_turn</code> is a normal finish.`,B:`A truncated tool call isn't a valid, complete request.`,D:`It isn't an error; an identical resend likely truncates again.`}},
  ]},

'multi-agent':{ domain:'d1', title:'Multi-agent: hub & spoke',
  eli5:`<p>Think of a <strong>head chef</strong> running a kitchen. A huge order comes in, so the chef hands each dish to a different cook. Each cook works at their <strong>own station</strong> with only the instructions for their dish. The cooks never talk to each other — everything goes back through the chef — and they hand back a <strong>finished plate</strong>, not a play-by-play of every chop.</p><p>That's hub-and-spoke: the chef is the hub (coordinator), the cooks are the spokes (subagents), and all routing runs through the center.</p>`,
  real:`<p>A coordinator delegates subtasks to subagents via the <code>Task</code> tool (the coordinator's <code>allowedTools</code> must include <code>"Task"</code>). Subagents run with <strong>isolated context</strong> — they do NOT inherit the coordinator's conversation history, so you pass the context they need explicitly in their prompt. All inter-subagent communication routes through the coordinator, which handles decomposition, delegation, error handling, and result aggregation.</p><p>Reach for multi-agent only under real pressure — context isolation, parallelism, or specialization. A frequent failure is <strong>over-narrow decomposition</strong>: the coordinator carves a broad topic into too-narrow subtasks and silently misses whole areas.</p>
  <h4>Why isolation is the whole point</h4>
  <ul>
    <li><strong>Context isolation</strong> — each subagent gets a clean window, so a 200-file exploration doesn't pollute the coordinator's context. Subagents return a <em>summary</em>, not their raw transcript.</li>
    <li><strong>Parallelism</strong> — emit multiple <code>Task</code> calls in one coordinator turn to fan out concurrently. Sequential <code>Task</code> calls across turns run one at a time.</li>
    <li><strong>Specialization</strong> — each subagent has a scoped role, system prompt, and tool set (its <code>AgentDefinition</code>), so it doesn't misuse out-of-role tools.</li>
  </ul>
  <h4>Edge cases & failure modes</h4>
  <ul>
    <li><strong>Over-narrow decomposition</strong> — the classic gap-in-coverage bug. Read the coordinator's <em>subtask list</em>, not the subagents' output, to diagnose it.</li>
    <li><strong>Starved subagents</strong> — passing only a one-line summary when the subagent needs full findings yields vague output. Pass the data, not a pointer to it.</li>
    <li><strong>Spoke-to-spoke coupling</strong> — subagents calling each other (or sharing a file) breaks the pattern; route through the hub.</li>
    <li><strong>Overlap / duplication</strong> — partition scope (distinct subtopics or source types) so two subagents don't redo the same work.</li>
    <li><strong>Lost attribution</strong> — require structured outputs (claim → source metadata) so synthesis can preserve provenance.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>Multi-agent adds real cost (latency, tokens, coordination). Don't reach for it when a single agent with good context management would do. The justification must be isolation, parallelism, or specialization — not "it sounds more powerful."</div>`,
  callout:`<b>Spawn pattern</b>Emit multiple <code>Task</code> tool calls in a <em>single</em> coordinator response to run subagents in parallel — not across separate turns.`,
  quick:[
    {q:`Do subagents automatically inherit the coordinator's conversation history?`,
     options:[`Yes, they share the full context window`,`No — context must be passed explicitly in the subagent's prompt`,`Only if they use the same model`,`Only the system prompt is inherited`],
     correct:1, why:`Subagents have isolated context; you provide what they need in their prompt.`},
    {q:`Which mechanism spawns subagents, and what must be configured to allow it?`,
     options:[`The <code>fork_session</code> call; no config needed`,`The <code>Task</code> tool; <code>allowedTools</code> must include <code>"Task"</code>`,`A <code>subagent: true</code> flag on the API request`,`The <code>/spawn</code> slash command`],
     correct:1, why:`The <code>Task</code> tool spawns subagents and requires <code>"Task"</code> in <code>allowedTools</code>.`},
  ],
  scenario:[
    {q:`On the topic "impact of AI on creative industries," every subagent completes successfully, but the final report covers only visual arts — missing music, writing, and film. The coordinator's logs show it decomposed the topic into "AI in digital art," "AI in graphic design," and "AI in photography." Most likely root cause?`,
     options:[`The synthesis agent lacks instructions for identifying coverage gaps.`,`The coordinator's task decomposition is too narrow, so subagent assignments don't cover all relevant domains of the topic.`,`The web search agent's queries aren't comprehensive enough.`,`The document analysis agent filters out non-visual sources.`],
     correct:1, why:`The logs reveal it directly: the coordinator only generated visual-arts subtasks. The subagents executed their assignments correctly — the problem is what they were assigned.`,
     traps:{A:`Synthesis worked within the scope it was given.`,C:`Search returned relevant results for the (too-narrow) tasks.`,D:`No evidence of filtering; the tasks never covered non-visual areas.`}},
  ]},

'hooks':{ domain:'d1', title:'Hooks & programmatic enforcement',
  eli5:`<p>Picture a <strong>bouncer</strong> at the door. The model might <em>ask</em> to do something against the rules — like refund $5,000. A polite sign that says "please don't" will sometimes be ignored. A bouncer who checks <strong>every</strong> request before it happens and blocks the bad ones is a guarantee.</p><p>Hooks are that bouncer: code that intercepts what the model wants to do.</p>`,
  real:`<p>Hooks intercept the loop. A <strong>pre-execution</strong> hook inspects outgoing tool calls to enforce rules (block a refund above a threshold, redirect to escalation). A <code>PostToolUse</code> hook transforms tool <em>results</em> before the model sees them (e.g., normalizing Unix timestamps, ISO 8601, and numeric codes into one format).</p><p>The core distinction: programmatic enforcement gives <strong>deterministic</strong> guarantees; prompt instructions are <strong>probabilistic</strong> with a non-zero failure rate. When a rule must always hold — verify identity before a financial operation — gate it in code, not in the prompt.</p>
  <h4>Hook points in the loop</h4>
  <ul>
    <li><strong>Pre-execution (tool-call interception)</strong> — sees the <em>outgoing</em> call before it runs. Use to block policy violations, enforce prerequisite gates, and redirect to an alternative workflow.</li>
    <li><strong>PostToolUse</strong> — sees the <em>returned result</em> before the model reads it. Use to normalize formats, trim verbose output, or redact PII.</li>
  </ul>
  <h4>Deterministic vs probabilistic — the decision rule</h4>
  <ul>
    <li>A rule that must hold <strong>100% of the time</strong> (money, identity, irreversible actions) → programmatic hook/gate.</li>
    <li>Soft guidance and tone → prompt/few-shot is fine.</li>
    <li>A prerequisite ordering ("verify before refund") → a gate that blocks the downstream tool until the prerequisite tool returns. Tool array order and prompt wording do <em>not</em> enforce call order.</li>
  </ul>
  <div class="edge"><b>Edge cases</b>Blocking should never dead-end: redirect to escalation or an alternative path, not a silent failure. A blocked action that auto-retries loops uselessly. And when escalating to a human, hand off a <em>structured summary</em> (customer ID, root cause, amount, recommended action) — not the raw transcript and not a bare "please help."</div>`,
  callout:`<b>Prerequisite gates</b>Block a downstream tool until a prerequisite returns. Example: block <code>process_refund</code> until <code>get_customer</code> has returned a verified customer ID.`,
  quick:[
    {q:`A business rule must hold 100% of the time. Prompt instruction or hook?`,
     options:[`A strongly-worded system prompt`,`A programmatic hook / gate`,`A few-shot example`,`A larger model`],
     correct:1, why:`Only programmatic enforcement is deterministic; prompts have a non-zero failure rate.`},
    {q:`What does a <code>PostToolUse</code> hook typically do?`,
     options:[`Spawn a subagent`,`Transform/normalize a tool's result before the model processes it`,`Pick which model to call`,`End the session`],
     correct:1, why:`<code>PostToolUse</code> intercepts results for transformation (e.g., data normalization).`},
  ],
  scenario:[
    {q:`In 12% of cases, your agent skips <code>get_customer</code> and calls <code>lookup_order</code> using only the customer's stated name, sometimes causing misidentified accounts and incorrect refunds. Most effective fix?`,
     options:[`Add a programmatic prerequisite that blocks <code>lookup_order</code> and <code>process_refund</code> until <code>get_customer</code> has returned a verified customer ID.`,`Enhance the system prompt to state verification is mandatory before order operations.`,`Add few-shot examples showing the agent always calling <code>get_customer</code> first.`,`Implement a routing classifier that enables only a subset of tools per request type.`],
     correct:0, why:`When a tool sequence is required for critical business logic, programmatic enforcement gives deterministic guarantees that prompt-based approaches can't.`,
     traps:{B:`Relies on probabilistic compliance — insufficient when errors have financial consequences.`,C:`Same problem: still probabilistic.`,D:`Addresses tool availability, not tool ordering — the wrong problem.`}},
  ]},

'decomposition':{ domain:'d1', title:'Task decomposition & sessions',
  eli5:`<p>Two ways to tackle a big job. If you know the steps, follow a <strong>fixed recipe</strong> — step 1, then 2, then 3. If you don't, <strong>figure it out as you go</strong>, deciding the next step based on what you just found.</p><p>And you can <strong>save your place</strong> to come back later, or <strong>branch off</strong> from a saved point to try two different approaches side by side.</p>`,
  real:`<p><strong>Prompt chaining</strong> = a fixed sequential pipeline for predictable, multi-aspect work (e.g., analyze each file, then a cross-file integration pass). <strong>Dynamic decomposition</strong> = generate subtasks from what you discover, for open-ended investigation. Splitting big reviews into per-file passes avoids <em>attention dilution</em>.</p><p>Sessions: <code>--resume &lt;name&gt;</code> continues a specific prior conversation; <code>fork_session</code> branches from a shared baseline to explore divergent approaches. When prior tool results are stale, start fresh with a structured summary rather than resuming.</p>
  <h4>Choosing a decomposition strategy</h4>
  <ul>
    <li><strong>Prompt chaining (fixed pipeline)</strong> — the steps are known in advance and repeat per item. Predictable code review, ETL-style passes.</li>
    <li><strong>Dynamic decomposition</strong> — the steps depend on what you find. "Add tests to this legacy codebase" — map structure first, then generate a prioritized, adapting plan.</li>
    <li><strong>Attention dilution</strong> — a single pass over many files gives uneven depth and self-contradiction (flagging a pattern in one file, approving it in another). Per-file passes + a separate cross-file integration pass fix it; a bigger context window does not.</li>
  </ul>
  <h4>Resume vs fork vs fresh</h4>
  <ul>
    <li><code>--resume &lt;name&gt;</code> — continue a specific prior line of work when its context is still valid.</li>
    <li><code>fork_session</code> — branch from a shared baseline to compare divergent approaches in parallel.</li>
    <li><strong>Fresh + injected summary</strong> — when prior tool results are <em>stale</em> (the code changed substantially), resuming carries forward wrong reasoning. Start fresh with a structured summary instead.</li>
    <li>If only a few files changed since, tell the resumed session <em>which</em> files so it does targeted re-analysis rather than full re-exploration.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>Don't conflate "more context window" with "better attention." Larger windows let more text fit; they don't cure the quality dilution of asking one pass to do too much at once. The fix is structural (focused passes), not capacity.</div>`,
  quick:[
    {q:`A predictable multi-aspect code review (same checks on every file) is best handled by:`,
     options:[`Dynamic adaptive decomposition`,`Prompt chaining / fixed sequential passes`,`A single giant prompt over all files`,`Batch API`],
     correct:1, why:`Predictable, repeatable structure suits prompt chaining; dynamic decomposition is for open-ended investigation.`},
    {q:`You want to compare two refactoring approaches from one shared codebase analysis. Use:`,
     options:[`<code>--resume</code> the same session twice`,`<code>fork_session</code> to create parallel branches from the baseline`,`A new unrelated session each time`,`<code>/compact</code>`],
     correct:1, why:`<code>fork_session</code> branches from a shared baseline to explore divergent approaches.`},
  ],
  scenario:[
    {q:`A PR modifies 14 files. Your single-pass review gives detailed feedback on some files, superficial on others, misses obvious bugs, and even contradicts itself — flagging a pattern in one file while approving identical code in another. How should you restructure?`,
     options:[`Split into focused passes: analyze each file individually for local issues, then a separate integration pass for cross-file data flow.`,`Require developers to split large PRs into 3-4 file submissions.`,`Switch to a larger-context model to fit all 14 files in one pass.`,`Run three full-PR passes and only flag issues appearing in at least two.`],
     correct:0, why:`The root cause is attention dilution across many files. File-by-file passes give consistent depth; a separate integration pass catches cross-file issues.`,
     traps:{B:`Shifts burden to developers without fixing the system.`,C:`Larger context windows don't fix attention-quality dilution.`,D:`Consensus voting suppresses real bugs that are caught intermittently.`}},
  ]},

/* ---------------- DOMAIN 2 ---------------- */
'tool-descriptions':{ domain:'d2', title:'Tool descriptions',
  eli5:`<p>If two tools wear vague nametags — "does stuff" and "does things" — the model keeps grabbing the wrong one. A good description is a clear nametag: what the tool does, what inputs it takes, and when to use it instead of the similar-looking one next to it.</p>`,
  real:`<p>Tool descriptions are the <strong>primary mechanism</strong> the model uses to select a tool. Minimal or overlapping descriptions (<code>analyze_content</code> vs <code>analyze_document</code>) cause misrouting. Fix by expanding descriptions with input formats, example queries, edge cases, and boundaries ("use this vs that"); renaming to remove overlap; and splitting a generic tool into purpose-specific tools with defined I/O. System-prompt wording can also bias selection, so review it for keyword associations.</p>
  <h4>What a strong description contains</h4>
  <ul>
    <li><strong>What it does</strong> and what it returns (output shape).</li>
    <li><strong>Input formats</strong> with examples (an order ID vs a customer email).</li>
    <li><strong>When to use it vs the neighbor</strong> — explicit disambiguation ("use <code>lookup_order</code> for order numbers; use <code>get_customer</code> for account/profile lookups").</li>
    <li><strong>Edge cases</strong> — empty results, ambiguous input.</li>
  </ul>
  <h4>The fix ladder (cheapest first)</h4>
  <ul>
    <li>1 — Expand &amp; disambiguate descriptions. Highest leverage, lowest effort; usually the right <em>first</em> step.</li>
    <li>2 — Rename to remove keyword overlap.</li>
    <li>3 — Split a generic tool into purpose-specific tools with defined I/O.</li>
    <li>4 — Add 2-4 few-shot routing examples (more tokens; reach for it only after descriptions are good).</li>
  </ul>
  <div class="edge"><b>Exam trap</b>A deterministic keyword-routing layer over the tools is over-engineering — it bypasses the model's language understanding and is brittle. Forcing <code>tool_choice</code> to one tool every turn breaks every legitimate use of the others. Fix the description first.</div>`,
  quick:[
    {q:`What is the primary mechanism an LLM uses to choose between tools?`,
     options:[`The order tools appear in the array`,`The tool descriptions`,`The tool's return type`,`Alphabetical tool names`],
     correct:1, why:`Descriptions are the primary selection signal; weak ones cause misrouting.`},
    {q:`Two similar tools with minimal descriptions get confused. Best <em>first</em> step?`,
     options:[`Expand each description with inputs, examples, edge cases, and when-to-use boundaries`,`Add a deterministic routing layer that parses keywords`,`Merge them into one generic tool`,`Add 8 few-shot examples`],
     correct:0, why:`Fixing the descriptions targets the root cause with a low-effort, high-leverage change.`},
  ],
  scenario:[
    {q:`The agent calls <code>get_customer</code> when users ask about orders ("check my order #12345") instead of <code>lookup_order</code>. Both have minimal descriptions ("Retrieves customer information" / "Retrieves order details") and accept similar identifiers. Most effective first step?`,
     options:[`Add 5-8 few-shot examples routing order queries to <code>lookup_order</code>.`,`Expand each tool's description with input formats, example queries, edge cases, and when to use it vs similar tools.`,`Add a routing layer that pre-selects a tool from detected keywords.`,`Consolidate both into one <code>lookup_entity</code> tool.`],
     correct:1, why:`Descriptions are the primary selection mechanism; expanding them is the low-effort, high-leverage root-cause fix.`,
     traps:{A:`Adds token overhead without fixing the underlying ambiguity.`,C:`Over-engineered; bypasses the model's language understanding.`,D:`A valid bigger change, but more effort than a "first step" warrants.`}},
  ]},

'structured-errors':{ domain:'d2', title:'Structured error responses',
  eli5:`<p>When a tool fails, don't just say "oops." Say <strong>what kind</strong> of oops, and whether <strong>trying again would help</strong>. That way the agent knows whether to retry, explain it to the customer, or escalate — instead of guessing.</p>`,
  real:`<p>Use the MCP <code>isError</code> flag plus structured metadata: <code>errorCategory</code> (transient / validation / business / permission), an <code>isRetryable</code> boolean, and a human-readable message. Generic "Operation failed" blocks smart recovery. Mark business-rule violations <code>retriable: false</code> with a customer-friendly explanation. Distinguish <strong>access failures</strong> (need a retry decision) from <strong>valid empty results</strong> (a successful query with no matches).</p>
  <h4>The error taxonomy the model can act on</h4>
  <ul>
    <li><strong>transient</strong> (timeout, rate limit) — <code>isRetryable: true</code>; retry with backoff.</li>
    <li><strong>validation</strong> (bad input) — not retryable as-is; fix the arguments.</li>
    <li><strong>business</strong> (policy violation, e.g. refund over limit) — <code>retriable: false</code> + customer-friendly explanation. Retrying can never satisfy a policy.</li>
    <li><strong>permission</strong> (unauthorized) — not retryable; escalate or re-auth.</li>
  </ul>
  <div class="edge"><b>Edge case: empty ≠ error</b>A query that runs fine but matches nothing is a <strong>valid success with no results</strong>, not a failure. Marking it as an error triggers pointless retries; marking a real access failure as an empty success hides the problem. Keep the two distinct in the response so the agent reacts correctly.</div>`,
  quick:[
    {q:`Which enables the agent to recover intelligently from a tool failure?`,
     options:[`A uniform generic "Operation failed" string`,`Structured metadata: category + <code>isRetryable</code> + readable message`,`Silently returning empty results`,`Crashing the loop`],
     correct:1, why:`Structured error metadata lets the agent decide whether to retry, explain, or escalate.`},
    {q:`A query runs fine but matches nothing. That is:`,
     options:[`A retryable transient error`,`A valid empty result (success, no matches)`,`A permission error`,`A reason to terminate the workflow`],
     correct:1, why:`Empty results are valid successes — distinct from access failures.`},
  ],
  scenario:[
    {q:`A refund request exceeds your policy limit. What should the <code>process_refund</code> tool return so the agent communicates appropriately?`,
     options:[`A generic "Operation failed" so the agent retries.`,`A structured business error with <code>retriable: false</code> and a customer-friendly explanation.`,`An empty success so the conversation continues.`,`A transient error so the agent retries with backoff.`],
     correct:1, why:`A policy violation is a non-retryable business error; structured metadata lets the agent explain it rather than uselessly retry.`,
     traps:{A:`Hides the reason and triggers pointless retries.`,C:`Masking failure as success prevents proper handling.`,D:`It isn't transient; retrying can't satisfy a policy limit.`}},
  ]},

'tool-distribution':{ domain:'d2', title:'Tool distribution & tool_choice',
  eli5:`<p>Don't hand one worker 18 tools — they get overwhelmed and grab the wrong one. Give each worker just the few tools their job needs. And when you absolutely must, you can <strong>force</strong> the model to use a tool (or one specific tool) instead of letting it chat.</p>`,
  real:`<p>Too many tools on one agent (18 vs 4-5) degrades selection; agents with out-of-role tools tend to misuse them. Scope tools per role, adding a few cross-role tools only for high-frequency needs (e.g., a <code>verify_fact</code> tool for synthesis). <code>tool_choice</code>: <code>"auto"</code> (may return text), <code>"any"</code> (must call some tool), or forced <code>{"type":"tool","name":"…"}</code> (must call that specific tool — useful to guarantee ordering or structured output).</p>
  <h4><code>tool_choice</code> modes</h4>
  <ul>
    <li><code>"auto"</code> — model decides; may answer in text without any tool.</li>
    <li><code>"any"</code> — must call <em>some</em> tool (model picks which). Guarantees an action over chat.</li>
    <li><code>{"type":"tool","name":"X"}</code> — must call <em>that specific</em> tool. Use to force the first step in an ordering, or to force structured output.</li>
    <li><code>"none"</code> — forbid tools for this turn.</li>
  </ul>
  <h4>Least privilege in practice</h4>
  <ul>
    <li>Scope each role to ~4-5 tools; add a cross-role tool only for a genuinely high-frequency need (the 85% case), keeping the rare/complex 15% delegating through the coordinator.</li>
    <li>Out-of-role tools invite misuse — a synthesis agent with web search will sometimes search when it shouldn't.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>Forced/array-order tricks don't enforce a <em>multi-step</em> sequence by themselves. <code>tool_choice</code> forces the <em>current</em> turn's call; ordering across steps comes from forcing the first tool, then handling later steps in follow-up turns (or a prerequisite gate). Putting a tool "first in the array" guarantees nothing.</div>`,
  quick:[
    {q:`Giving one agent 18 tools instead of 4-5 tends to:`,
     options:[`Improve flexibility with no downside`,`Degrade tool-selection reliability`,`Reduce token usage`,`Force parallelism`],
     correct:1, why:`More tools = more decision complexity = less reliable selection.`},
    {q:`You must guarantee the model calls <em>some</em> tool rather than replying with text. Use:`,
     options:[`<code>tool_choice: "auto"</code>`,`<code>tool_choice: "any"</code>`,`A longer system prompt`,`<code>stop_reason: "tool_use"</code>`],
     correct:1, why:`<code>"any"</code> forces a tool call (model still picks which).`},
  ],
  scenario:[
    {q:`Your synthesis agent often needs to verify claims. Today it returns to the coordinator, which invokes the web search agent and re-invokes synthesis — adding 2-3 round trips and +40% latency. 85% of verifications are simple fact-checks; 15% need deep investigation. Best approach?`,
     options:[`Give the synthesis agent a scoped <code>verify_fact</code> tool for simple lookups; complex cases still delegate through the coordinator.`,`Have synthesis batch all verifications and return them to the coordinator at the end.`,`Give the synthesis agent access to all web search tools so it never round-trips.`,`Have the web search agent pre-cache extra context around every source.`],
     correct:0, why:`Least privilege: give synthesis exactly what it needs for the 85% common case while preserving coordination for the complex 15%.`,
     traps:{B:`Batching creates blocking dependencies when later synthesis depends on earlier verified facts.`,C:`Over-provisions the agent and breaks separation of concerns.`,D:`Speculative caching can't reliably predict what's needed.`}},
  ]},

'mcp-config':{ domain:'d2', title:'MCP server configuration',
  eli5:`<p>Team tools go in the <strong>shared toolbox</strong> everyone gets when they pull the repo. Your personal, experimental tools go in <strong>your own drawer</strong>. And you never paste secret keys into the shared toolbox — you reference them by name.</p>`,
  real:`<p>Project scope = <code>.mcp.json</code> (committed, shared team tooling). User scope = <code>~/.claude.json</code> (personal / experimental). Use environment-variable expansion (e.g. <code>\${GITHUB_TOKEN}</code>) so secrets aren't committed. Tools from <strong>all</strong> configured servers are discovered at connection time and available simultaneously. MCP <em>resources</em> expose content catalogs (issue summaries, schemas) to cut exploratory tool calls. Prefer community servers for standard integrations (e.g. Jira); reserve custom servers for team-specific workflows.</p>
  <h4>Scope decides who gets the server</h4>
  <ul>
    <li><strong>Project</strong> — <code>.mcp.json</code> committed at the repo root; everyone gets it on clone/pull. This is where team tooling belongs.</li>
    <li><strong>User</strong> — <code>~/.claude.json</code>; only you, never shared via VCS. Good for personal/experimental servers. Copying it to a teammate doesn't scale and leaks personal settings.</li>
  </ul>
  <h4>Secrets &amp; resources</h4>
  <ul>
    <li>Reference secrets via env-var expansion (<code>\${TOKEN}</code>) so the committed config never contains the value.</li>
    <li>MCP <strong>tools</strong> = actions; MCP <strong>resources</strong> = readable content catalogs (issue summaries, schemas). Exposing resources cuts the exploratory tool calls an agent would otherwise burn discovering what exists.</li>
    <li>Build/buy: use a community server for a standard integration (Jira, GitHub); reserve custom servers for team-specific workflows.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>"It works for me but a teammate doesn't get it after cloning" almost always means the server lives in <code>~/.claude.json</code> (user scope). Move it to project-scoped <code>.mcp.json</code>. Note: <code>CLAUDE.md</code> holds context/instructions — it does <em>not</em> define MCP servers.</div>`,
  quick:[
    {q:`Where do you configure an MCP server so the whole team gets it via version control?`,
     options:[`<code>~/.claude.json</code>`,`<code>.mcp.json</code> (project scope)`,`Root <code>CLAUDE.md</code>`,`<code>.claude/commands/</code>`],
     correct:1, why:`Project-scoped <code>.mcp.json</code> is committed and shared.`},
    {q:`How do you keep an auth token out of a committed config?`,
     options:[`Paste it directly; it's fine in private repos`,`Use environment-variable expansion like <code>\${GITHUB_TOKEN}</code>`,`Store it in <code>CLAUDE.md</code>`,`Disable the server`],
     correct:1, why:`Env-var expansion references the secret without committing it.`},
  ],
  scenario:[
    {q:`You added an MCP server and it works for you, but a new teammate doesn't get it after cloning the repo. You had configured it in <code>~/.claude.json</code>. Best fix?`,
     options:[`Tell the teammate to copy your <code>~/.claude.json</code>.`,`Move the server config to the project-scoped <code>.mcp.json</code> so it's shared via version control.`,`Add the server to the root <code>CLAUDE.md</code>.`,`Paste your token into a committed file so it just works.`],
     correct:1, why:`<code>~/.claude.json</code> is user-scoped and not shared. Project tooling belongs in committed <code>.mcp.json</code>.`,
     traps:{A:`Copying personal config doesn't scale and leaks personal settings.`,C:`<code>CLAUDE.md</code> holds context/instructions, not server definitions.`,D:`Committing secrets is a security failure; use env-var expansion.`}},
  ]},

/* ---------------- DOMAIN 3 ---------------- */
'claudemd':{ domain:'d3', title:'CLAUDE.md hierarchy',
  eli5:`<p>Claude reads "rule notes." Some are just for <strong>you</strong> (your home note), some are for the <strong>whole team</strong> (the project note), and some only apply in one <strong>room</strong> (a folder note). If a teammate isn't following your rule, you probably wrote it in your <em>personal</em> note, which they never see.</p>`,
  real:`<p>Hierarchy: user-level <code>~/.claude/CLAUDE.md</code> (only you, not shared via VCS); project-level <code>.claude/CLAUDE.md</code> or root <code>CLAUDE.md</code> (shared); directory-level <code>CLAUDE.md</code> in subfolders. Keep it modular with <code>@import</code>, or split topics into <code>.claude/rules/</code> instead of one monolith. Use <code>/memory</code> to verify which memory files are actually loaded when behavior is inconsistent.</p>
  <h4>The precedence ladder</h4>
  <ul>
    <li><strong>User</strong> — <code>~/.claude/CLAUDE.md</code>: applies to all your projects, private to you, never shared via VCS.</li>
    <li><strong>Project</strong> — root <code>CLAUDE.md</code> or <code>.claude/CLAUDE.md</code>: shared with everyone who clones the repo. Team standards live here.</li>
    <li><strong>Directory</strong> — a <code>CLAUDE.md</code> inside a subfolder: applies when working in that part of the tree.</li>
  </ul>
  <h4>Keeping it maintainable</h4>
  <ul>
    <li>Use <code>@import</code> to compose per-package standards, or split topics into <code>.claude/rules/</code> files, instead of one giant monolith that dilutes attention.</li>
    <li>When behavior is inconsistent, run <code>/memory</code> to see which memory files are actually loaded — the fastest way to catch "I wrote the rule in the wrong scope."</li>
  </ul>
  <div class="edge"><b>Exam trap</b>"A teammate's Claude ignores our standards" → you put them in <code>~/.claude/CLAUDE.md</code> (user scope, private). Move to project scope. Don't reach for "use a bigger model" — model size is irrelevant to config scoping — and don't have each developer retype standards into their own home config (drifts immediately).</div>`,
  quick:[
    {q:`A teammate isn't receiving an instruction you wrote. Most likely cause?`,
     options:[`It's in <code>~/.claude/CLAUDE.md</code> (user-level), not project-level`,`Their model version differs`,`<code>@import</code> is deprecated`,`CLAUDE.md only works in CI`],
     correct:0, why:`User-level settings apply only to you and aren't shared via version control.`},
    {q:`Which command shows which memory files are currently loaded?`,
     options:[`<code>/compact</code>`,`<code>/memory</code>`,`<code>/resume</code>`,`<code>/files</code>`],
     correct:1, why:`<code>/memory</code> verifies loaded memory files to diagnose inconsistent behavior.`},
  ],
  scenario:[
    {q:`Your team's coding standards work for you but a new hire's Claude ignores them. You placed them in <code>~/.claude/CLAUDE.md</code>. Best fix?`,
     options:[`Have the new hire retype the standards into their own home config.`,`Move the standards to the project-level <code>.claude/CLAUDE.md</code> (or root <code>CLAUDE.md</code>) so they're shared via version control.`,`Put the standards in a personal skill.`,`Switch the new hire to a larger model.`],
     correct:1, why:`Team-wide standards belong at the project level, which is shared through the repo; user-level config is private to each developer.`,
     traps:{A:`Manual copying doesn't scale and drifts out of sync.`,C:`Skills are on-demand, not always-on standards.`,D:`Model size is irrelevant to config scoping.`}},
  ]},

'commands-skills':{ domain:'d3', title:'Slash commands & skills',
  eli5:`<p>A <strong>slash command</strong> is a shortcut button your whole team gets if you save it in the shared folder. A <strong>skill</strong> is a mini-playbook Claude pulls out for a specific task — and running it "forked" means it works in a side-room so its mess doesn't fill up the main conversation.</p>`,
  real:`<p>Project commands live in <code>.claude/commands/</code> (shared via VCS); user commands in <code>~/.claude/commands/</code> (personal). Skills live in <code>.claude/skills/</code> with <code>SKILL.md</code> frontmatter: <code>context: fork</code> (run in an isolated subagent so verbose output doesn't pollute the main session), <code>allowed-tools</code> (restrict tools during the skill), and <code>argument-hint</code> (prompt for required params). Choose skills for on-demand task workflows, and <code>CLAUDE.md</code> for always-loaded universal standards.</p>
  <h4>Command vs skill vs CLAUDE.md</h4>
  <ul>
    <li><strong>Slash command</strong> — a reusable prompt template invoked explicitly (<code>/review</code>). Project scope to share with the team.</li>
    <li><strong>Skill</strong> — an on-demand task workflow (a <code>SKILL.md</code> + assets) Claude pulls in for a specific job.</li>
    <li><strong>CLAUDE.md</strong> — always-loaded universal standards. Use it for "every time," not for occasional task workflows.</li>
  </ul>
  <h4>Key <code>SKILL.md</code> frontmatter</h4>
  <ul>
    <li><code>context: fork</code> — runs the skill in an isolated subagent so its verbose output doesn't pollute the main conversation.</li>
    <li><code>allowed-tools</code> — deterministically restricts which tools the skill may use (e.g., writes only, never destructive Bash).</li>
    <li><code>argument-hint</code> — prompts for a required parameter at invocation so it doesn't silently fail with no args.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>Don't confuse the two isolation knobs: <code>context: fork</code> isolates <em>context</em>; <code>allowed-tools</code> restricts <em>tools</em>. Restricting tool access is an <code>allowed-tools</code> job, not a <code>context: fork</code> job. And a request in the skill body ("please don't run rm") is probabilistic — use <code>allowed-tools</code> to make it a guarantee.</div>`,
  quick:[
    {q:`A custom <code>/review</code> command should be available to everyone who pulls the repo. Put it in:`,
     options:[`<code>~/.claude/commands/</code>`,`<code>.claude/commands/</code> in the repo`,`Root <code>CLAUDE.md</code>`,`<code>.claude/config.json</code>`],
     correct:1, why:`Project-scoped <code>.claude/commands/</code> is version-controlled and shared.`},
    {q:`Which frontmatter keeps a verbose skill's output from polluting the main conversation?`,
     options:[`<code>allowed-tools</code>`,`<code>context: fork</code>`,`<code>argument-hint</code>`,`<code>model: opus</code>`],
     correct:1, why:`<code>context: fork</code> runs the skill in an isolated subagent context.`},
  ],
  scenario:[
    {q:`You want a custom <code>/review</code> slash command that runs your team's review checklist, available to every developer when they clone or pull the repo. Where should the command file live?`,
     options:[`<code>.claude/commands/</code> in the project repository`,`<code>~/.claude/commands/</code> in each developer's home directory`,`The root <code>CLAUDE.md</code> file`,`A <code>.claude/config.json</code> file with a commands array`],
     correct:0, why:`Project-scoped commands in <code>.claude/commands/</code> are version-controlled and auto-available to everyone on clone/pull.`,
     traps:{B:`User scope isn't shared via version control.`,C:`<code>CLAUDE.md</code> holds context, not command definitions.`,D:`That config mechanism doesn't exist in Claude Code.`}},
  ]},

'path-rules':{ domain:'d3', title:'Path-specific rules',
  eli5:`<p>Instead of leaving the same note in every single room, you put up <strong>one sign</strong>: "this rule applies to all blue doors anywhere in the building." A glob pattern is the blue-door rule — it finds the right files no matter where they live.</p>`,
  real:`<p><code>.claude/rules/</code> files carry YAML frontmatter with a <code>paths</code> glob (e.g. <code>paths: ["**/*.test.tsx"]</code>); the rule loads <strong>only</strong> when you edit a matching file, cutting irrelevant context and tokens. This beats directory-level <code>CLAUDE.md</code> when a convention spans many directories — like test files scattered throughout the tree — which a directory-bound file can't easily cover.</p>
  <h4>When path-rules win</h4>
  <ul>
    <li>A convention is tied to a <strong>file type</strong>, not a location — test files (<code>**/*.test.tsx</code>), migrations, stories — scattered across the tree.</li>
    <li>You want <strong>conditional loading</strong>: the rule appears only when editing a matching file, so unrelated context (and tokens) stay out of the window.</li>
  </ul>
  <h4>Path-rules vs the alternatives</h4>
  <ul>
    <li><strong>Directory <code>CLAUDE.md</code></strong> — location-bound; can't cover files spread across many directories without copies everywhere.</li>
    <li><strong>Root <code>CLAUDE.md</code> with headers</strong> — relies on the model <em>inferring</em> which section applies; a glob match is explicit and reliable.</li>
    <li><strong>A skill</strong> — must be invoked; path-rules apply automatically on matching edits.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>"Apply automatically, by file type, regardless of directory" is the signature of a path-rule glob. If an option relies on inference ("rely on Claude to know which applies") or on manual invocation, it's the wrong answer for an <em>automatic</em>, scattered-file convention.</div>`,
  quick:[
    {q:`Conventions for test files that are spread across many directories are best handled by:`,
     options:[`A subdirectory <code>CLAUDE.md</code> in each folder`,`<code>.claude/rules/</code> with a glob like <code>**/*.test.tsx</code>`,`The root <code>CLAUDE.md</code> with headers`,`A skill the developer must invoke`],
     correct:1, why:`Glob path-rules apply by file type regardless of directory; directory CLAUDE.md files are location-bound.`},
    {q:`When does a path-scoped rule load?`,
     options:[`On every request`,`Only when editing a file matching its glob`,`At session start only`,`When the user runs <code>/memory</code>`],
     correct:1, why:`Path rules load conditionally on matching edits, reducing irrelevant context.`},
  ],
  scenario:[
    {q:`Test files sit next to the code they test (<code>Button.test.tsx</code> beside <code>Button.tsx</code>) throughout the codebase, and you want all tests to follow the same conventions regardless of location. Most maintainable way to apply them automatically?`,
     options:[`Create <code>.claude/rules/</code> files with YAML frontmatter glob patterns that conditionally apply conventions by file path.`,`Consolidate everything in the root <code>CLAUDE.md</code> under headers and rely on Claude to infer which applies.`,`Create a skill per code type with conventions in its <code>SKILL.md</code>.`,`Place a separate <code>CLAUDE.md</code> in each subdirectory.`],
     correct:0, why:`Glob path-rules (e.g. <code>**/*.test.tsx</code>) apply automatically by path regardless of directory — ideal for scattered test files.`,
     traps:{B:`Relies on inference, not explicit matching — unreliable.`,C:`Skills need invocation; this requires automatic application.`,D:`Directory-bound files can't cover files spread across many directories.`}},
  ]},

'plan-mode':{ domain:'d3', title:'Plan mode vs direct execution',
  eli5:`<p>For a big remodel, you draw <strong>blueprints</strong> first and agree on the plan before knocking down walls — that's plan mode. For changing a <strong>lightbulb</strong>, you just do it — that's direct execution.</p>`,
  real:`<p>Plan mode = explore and design before changing, for large-scale, multi-file, architectural tasks with multiple valid approaches (monolith→microservices, a 45-file library migration). Direct execution = simple, well-scoped changes (a single-file bug fix with a clear stack trace). The <strong>Explore subagent</strong> isolates verbose discovery and returns summaries to preserve main-conversation context. You can combine them: plan to investigate, then direct-execute the agreed approach.</p>
  <h4>Which mode fits</h4>
  <ul>
    <li><strong>Plan mode</strong> — scope is large/architectural, touches many files, has multiple valid approaches, or the cost of rework is high. You explore and agree on an approach <em>before</em> changing anything.</li>
    <li><strong>Direct execution</strong> — the change is small, well-scoped, and the path is clear (a single-file fix with a known stack trace).</li>
    <li><strong>Combined</strong> — plan to investigate, then direct-execute the agreed plan.</li>
  </ul>
  <h4>The Explore subagent</h4>
  <ul>
    <li>Isolates verbose discovery (reading dozens of files) and returns a concise summary, so the main conversation's context isn't flooded.</li>
    <li>A bigger <code>max_tokens</code> doesn't stop context accumulation; offloading discovery to Explore does.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>When complexity is <em>stated up front</em> (dozens of files, service boundaries to decide), choose plan mode now — not "start direct and switch if complexity appears." Starting direct on a known-large task risks costly rework when dependencies surface late.</div>`,
  quick:[
    {q:`Restructuring a monolith into microservices (dozens of files, architectural decisions) calls for:`,
     options:[`Direct execution, incrementally`,`Plan mode`,`Batch API`,`<code>fork_session</code> only`],
     correct:1, why:`Large-scale architectural change is exactly what plan mode is for.`},
    {q:`Adding one date-validation conditional to a single function calls for:`,
     options:[`Plan mode with full exploration`,`Direct execution`,`A multi-agent pipeline`,`The Explore subagent`],
     correct:1, why:`Simple, well-scoped changes are direct-execution work.`},
  ],
  scenario:[
    {q:`You must restructure a monolith into microservices — changes across dozens of files, plus decisions about service boundaries and module dependencies. Which approach?`,
     options:[`Enter plan mode to explore the codebase, understand dependencies, and design the approach before changing anything.`,`Start with direct execution and let the implementation reveal the service boundaries.`,`Direct execution with comprehensive upfront instructions for each service.`,`Begin in direct execution and switch to plan mode only if unexpected complexity appears.`],
     correct:0, why:`Plan mode is designed for large-scale, multi-approach, architectural work; it enables safe exploration and design before costly changes.`,
     traps:{B:`Risks costly rework when dependencies surface late.`,C:`Assumes you already know the right structure without exploring.`,D:`The complexity is stated up front, not something that might emerge.`}},
  ]},

'cicd':{ domain:'d3', title:'Claude Code in CI/CD',
  eli5:`<p>To run Claude Code inside an automated robot pipeline, you tell it "<strong>don't wait for me to type</strong>" and "give me <strong>machine-readable</strong> output." And a fresh reviewer who didn't write the code catches more than the author grading their own homework.</p>`,
  real:`<p><code>-p</code> / <code>--print</code> runs non-interactively (no input hang). <code>--output-format json</code> with <code>--json-schema</code> produces parseable findings for inline PR comments. <code>CLAUDE.md</code> supplies CI context (testing standards, fixtures, criteria). <strong>Session isolation</strong>: an independent review instance — without the generator's reasoning context — catches more than self-review. On re-runs, include prior findings so it reports only new/unaddressed issues and avoids duplicate comments.</p>
  <h4>The headless flags that matter</h4>
  <ul>
    <li><code>-p</code> / <code>--print</code> — non-interactive: process the prompt, print to stdout, exit. Fixes the "job hangs waiting for input" symptom. There is no <code>CLAUDE_HEADLESS</code> env var and no <code>--batch</code> flag.</li>
    <li><code>--output-format json</code> + <code>--json-schema</code> — structured, parseable findings a script can post as inline PR comments. Plain <code>-p</code> prevents hangs but isn't structured.</li>
  </ul>
  <h4>Why an independent reviewer</h4>
  <ul>
    <li>Asking the <em>same</em> session that generated code to review it retains generation bias and misses subtle bugs. A fresh instance — without that reasoning context — catches more.</li>
    <li>On re-runs, feed in prior findings so it reports only new/unaddressed issues instead of duplicating comments.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>The hang has one right fix — <code>-p</code>/<code>--print</code>. Distractors like <code>CLAUDE_HEADLESS=true</code>, <code>--batch</code>, or redirecting stdin from <code>/dev/null</code> are non-existent flags or fragile workarounds that don't address the interactive design.</div>`,
  quick:[
    {q:`Your CI job runs <code>claude "..."</code> and hangs waiting for input. Fix?`,
     options:[`Set <code>CLAUDE_HEADLESS=true</code>`,`Add the <code>-p</code> (<code>--print</code>) flag`,`Add <code>--batch</code>`,`Redirect stdin from <code>/dev/null</code>`],
     correct:1, why:`<code>-p</code> is the documented non-interactive mode; the others are non-existent flags or fragile workarounds.`},
    {q:`Who catches more subtle issues in generated code?`,
     options:[`The same session that wrote it, asked to self-review`,`An independent review instance without the generator's reasoning context`,`Extended thinking in the same turn`,`A longer system prompt`],
     correct:1, why:`Self-review retains generation bias; an independent instance is more effective.`},
  ],
  scenario:[
    {q:`Your pipeline runs <code>claude "Analyze this PR for security issues"</code> but the job hangs indefinitely; logs show it's waiting for interactive input. Correct way to run Claude Code in an automated pipeline?`,
     options:[`Add the <code>-p</code> flag: <code>claude -p "Analyze this PR for security issues"</code>.`,`Set <code>CLAUDE_HEADLESS=true</code> before running.`,`Redirect stdin: <code>claude "..." &lt; /dev/null</code>.`,`Add a <code>--batch</code> flag.`],
     correct:0, why:`<code>-p</code> / <code>--print</code> is the documented non-interactive mode: it processes the prompt, prints to stdout, and exits.`,
     traps:{B:`No such environment variable.`,C:`A Unix workaround that doesn't address the command's interactive design.`,D:`No such flag.`}},
  ]},

/* ---------------- DOMAIN 4 ---------------- */
'explicit-criteria':{ domain:'d4', title:'Explicit criteria & false positives',
  eli5:`<p>"Be careful" doesn't help anyone. "Flag it <strong>only</strong> when the comment claims one thing and the code does another" does. Specific rules beat vague vibes — and one noisy category of false alarms makes people stop trusting the good alarms too.</p>`,
  real:`<p>Explicit categorical criteria beat vague instructions — "be conservative" or "only report high-confidence findings" don't actually improve precision. High false-positive categories erode developer trust in the accurate ones. Define exactly which issues to report (bugs, security) vs skip (minor style), with concrete examples per severity level. You can temporarily disable a noisy category while you fix its prompt.</p>
  <h4>Why vague confidence language fails</h4>
  <ul>
    <li>"Be conservative" / "only high-confidence findings" gives the model no <em>operational</em> definition of what counts — precision barely moves.</li>
    <li>Precision comes from <strong>categorical criteria</strong>: name exactly which issue classes to report (correctness bugs, security) and which to skip (minor style), with a concrete example per severity.</li>
  </ul>
  <h4>Trust is a system property</h4>
  <ul>
    <li>One noisy category trains developers to ignore the tool — including its accurate findings. Precision in the categories you keep matters more than coverage.</li>
    <li>You can temporarily disable a noisy category while you fix its prompt, rather than letting it erode trust in everything.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>Levers that don't address criteria ambiguity are distractors: lowering temperature, switching models, or running the review three times and voting (which actually <em>suppresses</em> real bugs that are only caught intermittently).</div>`,
  quick:[
    {q:`Adding "only report high-confidence findings" to a noisy reviewer prompt will:`,
     options:[`Reliably improve precision`,`Not meaningfully improve precision — it's vague`,`Eliminate all false positives`,`Force structured output`],
     correct:1, why:`Vague confidence instructions don't improve precision; specific categorical criteria do.`},
    {q:`Best lever to cut false positives in a code reviewer?`,
     options:[`Explicit categorical criteria + concrete examples`,`Telling it to "be conservative"`,`A larger context window`,`More tools`],
     correct:0, why:`Specific criteria define what to report vs skip; vague guidance doesn't.`},
  ],
  scenario:[
    {q:`Your automated reviewer flags too many non-issues, and developers are starting to ignore it. Most effective improvement?`,
     options:[`Add "be conservative and only flag high-confidence issues" to the prompt.`,`Define explicit categorical criteria for what to report (bugs, security) vs skip (minor style), with concrete examples per severity.`,`Lower the model temperature.`,`Run the same review three times and vote.`],
     correct:1, why:`Precision comes from specific categorical criteria, not confidence-based hedging.`,
     traps:{A:`Vague confidence language doesn't improve precision.`,C:`Temperature doesn't address criteria ambiguity.`,D:`Voting can suppress real but intermittently-caught issues.`}},
  ]},

'few-shot':{ domain:'d4', title:'Few-shot prompting',
  eli5:`<p><strong>Show, don't just tell.</strong> Give Claude 2-4 worked examples of the tricky cases — including <em>why</em> one answer was chosen over a plausible alternative — and it copies that judgment, even on new cases it hasn't seen.</p>`,
  real:`<p>Few-shot examples are the most effective technique when detailed instructions still produce inconsistent output. 2-4 targeted examples covering ambiguous cases (with the reasoning for the choice) teach <strong>generalizable</strong> judgment, demonstrate the exact output format you want (location, issue, severity, fix), reduce extraction hallucination, and distinguish acceptable patterns from real issues to cut false positives.</p>
  <h4>What good few-shot examples do</h4>
  <ul>
    <li>Teach <strong>generalizable judgment</strong> by covering the <em>ambiguous</em> cases and including the reasoning for the pick over the plausible alternative — not just easy ones.</li>
    <li>Pin the <strong>exact output format</strong> (location, issue, severity, fix), reducing format drift and extraction hallucination.</li>
    <li>Distinguish acceptable patterns from real issues, cutting false positives.</li>
  </ul>
  <h4>How many, and when</h4>
  <ul>
    <li>2-4 targeted examples is the sweet spot — enough to teach judgment without bloating the prompt. 20+ or one-per-input is over-fitting and token waste.</li>
    <li>Reach for few-shot when <em>detailed instructions still give inconsistent results</em>. It outperforms "think carefully," a sterner instruction, a bigger model, or more tools for the inconsistency problem.</li>
  </ul>
  <div class="edge"><b>Related: the interview pattern</b>When you're in an unfamiliar domain and worried about missing considerations (cache invalidation, failure modes), have Claude <em>ask you questions first</em> to surface design considerations before implementing — examples of finished code can't surface unknowns.</div>`,
  quick:[
    {q:`Detailed instructions still give inconsistent formatting. Best fix?`,
     options:[`A few-shot examples (2-4 targeted)`,`A longer, sterner instruction`,`A bigger model`,`More tools`],
     correct:0, why:`Few-shot examples are the most effective fix for inconsistent output.`},
    {q:`How many targeted few-shot examples are typically recommended for ambiguous cases?`,
     options:[`0-1`,`2-4`,`20+`,`One per possible input`],
     correct:1, why:`2-4 targeted examples teach generalizable judgment without bloat.`},
  ],
  scenario:[
    {q:`Your agent inconsistently routes ambiguous requests between two valid tools, even though the descriptions are good. Most effective next step?`,
     options:[`Add 2-4 few-shot examples showing the chosen action for ambiguous cases, including the reasoning for picking it over the alternative.`,`Tell it to "think carefully" before choosing.`,`Remove one of the tools.`,`Increase <code>max_tokens</code>.`],
     correct:0, why:`Few-shot examples demonstrate judgment on the exact ambiguous cases and generalize to new ones.`,
     traps:{B:`Vague encouragement doesn't fix inconsistent judgment.`,C:`Removing capability isn't a routing fix.`,D:`Token limit isn't the issue.`}},
  ]},

'structured-output':{ domain:'d4', title:'Structured output via tool_use',
  eli5:`<p>Want the answer as a <strong>clean filled-in form</strong> instead of a paragraph? Hand Claude the form — a JSON schema wrapped as a tool — and make it fill that out. No more broken brackets or missing commas.</p>`,
  real:`<p><code>tool_use</code> with a JSON schema is the most reliable way to get schema-valid structured output — it eliminates JSON <em>syntax</em> errors. <code>tool_choice: "any"</code> guarantees a tool call; forced <code>{"type":"tool","name":"…"}</code> guarantees a specific one (ordering). Crucially, strict schemas kill syntax errors but <strong>not semantic</strong> errors (line items that don't sum to the total). Make fields <strong>nullable/optional</strong> when the source may lack them, so the model returns <code>null</code> instead of fabricating a value to satisfy a required field.</p>
  <h4>Syntax vs semantic — the line schemas can't cross</h4>
  <ul>
    <li>A schema guarantees <strong>shape and types</strong> (valid JSON, right fields). It does <em>not</em> guarantee the values are correct — line items can still fail to sum to the stated total.</li>
    <li>Catch semantics with self-checks: extract <code>calculated_total</code> alongside <code>stated_total</code> and compare; add a <code>conflict_detected</code> boolean.</li>
  </ul>
  <h4>Schema design that prevents fabrication</h4>
  <ul>
    <li>Make a field <strong>nullable/optional</strong> when the source may not contain it — the model returns <code>null</code> instead of inventing a value to satisfy a required field.</li>
    <li>For open category sets, add an <code>"other"</code> enum value (with a detail string) and an <code>"unclear"</code> value, so edge cases don't get force-fit to a wrong label or dropped.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>Making <em>every</em> field required is what <em>causes</em> fabrication, not what prevents it. And <code>tool_choice: "auto"</code> may skip the tool entirely — use <code>"any"</code> (or a forced tool) when you must guarantee structured output.</div>`,
  quick:[
    {q:`Most reliable way to get guaranteed schema-compliant structured output?`,
     options:[`Ask for JSON in the prompt and parse the text`,`<code>tool_use</code> with a JSON schema`,`Regex over the model's prose`,`A longer system prompt`],
     correct:1, why:`Tool use with a JSON schema eliminates syntax errors.`},
    {q:`Strict JSON schemas via tool use eliminate which errors?`,
     options:[`Both syntax and semantic errors`,`Syntax errors only (not semantic ones like totals that don't sum)`,`Semantic errors only`,`Neither`],
     correct:1, why:`Schemas guarantee shape/syntax, not correctness of values.`},
  ],
  scenario:[
    {q:`Your extraction sometimes <em>fabricates</em> a value for a required field when the source document simply doesn't contain it. Best schema fix?`,
     options:[`Make that field nullable/optional so the model can return <code>null</code> when the info is absent.`,`Make every field required so the model tries harder.`,`Remove the schema and parse free text.`,`Switch to <code>tool_choice: "auto"</code>.`],
     correct:0, why:`Nullable/optional fields let the model represent "not present" instead of being forced to fabricate to satisfy a required field.`,
     traps:{B:`Required fields are exactly what pressures fabrication.`,C:`Free text reintroduces syntax errors and unreliability.`,D:`<code>auto</code> may skip the tool entirely; it doesn't fix fabrication.`}},
  ]},

'validation-retry':{ domain:'d4', title:'Validation & retry loops',
  eli5:`<p>If the answer fails a check, tell Claude <strong>exactly</strong> what was wrong and let it fix that. But if the information simply <strong>isn't in the document</strong>, retrying won't conjure it out of thin air — that's a different problem.</p>`,
  real:`<p>Retry-with-error-feedback: on failure, send a follow-up with the original document, the failed extraction, and the <em>specific</em> validation error so the model self-corrects. This works for format/structural errors but is useless when the required info is <strong>absent from the source</strong>. Add semantic self-checks — extract <code>calculated_total</code> alongside <code>stated_total</code> to flag mismatches, add a <code>conflict_detected</code> boolean — and track a <code>detected_pattern</code> field to analyze false positives.</p>
  <h4>What retry can and can't fix</h4>
  <ul>
    <li><strong>Can fix</strong> — format/structural errors (wrong date format, missing field). Send back the original input, the failed output, and the <em>specific</em> error.</li>
    <li><strong>Can't fix</strong> — information genuinely absent from the source. No amount of retrying conjures a figure that was never provided; that's a data-availability problem, not a format one.</li>
  </ul>
  <h4>Make validation semantic, not just structural</h4>
  <ul>
    <li>Extract <code>calculated_total</code> next to <code>stated_total</code> to flag arithmetic mismatches a schema would pass.</li>
    <li>Add a <code>conflict_detected</code> boolean and a <code>detected_pattern</code> field so you can analyze false positives over time.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>Independent review beats self-review: asking the same session that produced an output to "review more carefully" keeps its generation bias. Use a second, independent instance. Treating absent-data failures like format failures just burns retries.</div>`,
  quick:[
    {q:`A required value is simply not present in the source document. Will retry-with-feedback fix it?`,
     options:[`Yes, eventually`,`No — the information is absent; retries can't create it`,`Only with a bigger model`,`Only in batch mode`],
     correct:1, why:`Retries help with format/structural errors, not missing source information.`},
    {q:`Which failure is a good candidate for retry-with-error-feedback?`,
     options:[`Data that doesn't exist in the document`,`A format mismatch / structural output error`,`A network outage`,`A policy violation`],
     correct:1, why:`Format and structural errors are correctable by feeding back the specific error.`},
  ],
  scenario:[
    {q:`Two extraction failures occur: (1) a date came back in the wrong format, and (2) a required revenue figure that only exists in an external document you never provided. Which is worth retrying with error feedback?`,
     options:[`Only #1 (format mismatch) — #2's information is absent from the source, so retrying can't fix it.`,`Both, identically.`,`Only #2 — retries always eventually succeed.`,`Neither; never retry extractions.`],
     correct:0, why:`Retry-with-feedback corrects format/structural errors; it cannot supply information that isn't in the source.`,
     traps:{B:`Treating absent-data the same as a format error wastes calls.`,C:`Retries can't conjure missing information.`,D:`Retry is valuable for the right failure classes.`}},
  ]},

'batch':{ domain:'d4', title:'Batch processing',
  eli5:`<p>Two checkout lanes. The <strong>express lane</strong> is instant but full price — use it for things you're standing there waiting on. The <strong>overnight drop-box</strong> is half price and ready by tomorrow — use it for things that can wait.</p>`,
  real:`<p>The Message Batches API: ~<strong>50% cheaper</strong>, up to a <strong>24-hour</strong> window, <strong>no latency SLA</strong>, no multi-turn tool calling in a single request, and <code>custom_id</code> to correlate request/response pairs. Use it for non-blocking, latency-tolerant work (overnight reports, weekly audits) — never for blocking pre-merge checks where a developer is waiting. Resubmit only failed <code>custom_id</code>s; refine your prompt on a sample first to lift first-pass success.</p>
  <h4>The batch trade-off</h4>
  <ul>
    <li><strong>Win:</strong> ~50% cheaper, up to a 24-hour processing window, <code>custom_id</code> correlates each request to its response.</li>
    <li><strong>Cost:</strong> no latency SLA (could take minutes or hours), and no multi-turn tool calling within a single request.</li>
  </ul>
  <h4>Match the API to the workload</h4>
  <ul>
    <li><strong>Latency-tolerant, non-blocking</strong> (overnight reports, weekly audits, bulk extraction) → batch. Schedule with margin and resubmit only the failed <code>custom_id</code>s.</li>
    <li><strong>Blocking, a developer is waiting</strong> (pre-merge check) → synchronous API. Polling doesn't make batch acceptable here.</li>
    <li>Refine the prompt on a sample first to raise first-pass success before submitting the full batch.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>"Move both workflows to batch for the savings" is the bait — split them: batch the overnight job, keep the blocking check synchronous. Distractors invoke fake blockers ("batch ordering issues" — <code>custom_id</code> handles correlation) or needless complexity ("batch with a real-time timeout fallback").</div>`,
  quick:[
    {q:`A blocking pre-merge check that developers wait on should use:`,
     options:[`The Message Batches API for the cost savings`,`The synchronous API`,`Either, with polling`,`Whichever finishes first`],
     correct:1, why:`Batch has no latency SLA (up to 24h) — unsuitable for blocking workflows.`},
    {q:`The Message Batches API offers roughly:`,
     options:[`50% cost savings, up to a 24-hour window`,`Guaranteed sub-second latency`,`Free processing`,`Multi-turn tool calling within one request`],
     correct:0, why:`~50% cheaper, up to 24h, no SLA, no in-request multi-turn tool calling.`},
  ],
  scenario:[
    {q:`Your manager wants to move <em>both</em> workflows to the Message Batches API for 50% savings: (1) a blocking pre-merge check developers wait on, and (2) an overnight technical-debt report. How do you evaluate this?`,
     options:[`Use batch only for the overnight report; keep real-time (synchronous) calls for the pre-merge check.`,`Switch both to batch with status polling.`,`Keep real-time for both to avoid batch ordering issues.`,`Switch both to batch with a timeout fallback to real-time.`],
     correct:0, why:`Batch's up-to-24h window with no SLA suits the overnight job but not a blocking check developers wait on.`,
     traps:{B:`Polling doesn't make batch acceptable for a blocking workflow.`,C:`A misconception — <code>custom_id</code> handles correlation; the overnight job is a clear win.`,D:`Adds needless complexity vs matching each API to its use case.`}},
  ]},

/* ---------------- DOMAIN 5 ---------------- */
'context-preservation':{ domain:'d5', title:'Preserving conversation context',
  eli5:`<p>In a long chat, important numbers get blurred into "some refund." Keep a <strong>sticky-note of the hard facts</strong> — amounts, dates, order IDs — and re-show it every turn so nothing gets lost. And remember: models read the <strong>start and end</strong> of a long input carefully but skim the <strong>middle</strong>.</p>`,
  real:`<p>Progressive summarization can blur numbers, dates, and stated expectations — keep a persistent "case facts" block (amounts, order #s, statuses) <em>outside</em> summarized history, included in each prompt. The <strong>"lost in the middle"</strong> effect: put key summaries at the <strong>top</strong>, use explicit section headers. Trim verbose tool outputs to only the relevant fields before they pile up (a 40-field order lookup when 5 matter). In long codebase sessions, use scratchpad files and <code>/compact</code> to fight context degradation.</p>
  <h4>Two failure modes of long context</h4>
  <ul>
    <li><strong>Summarization drift</strong> — prose summaries blur precise values (exact amounts, dates, order IDs). Keep a structured "case facts" block <em>outside</em> the summarized history and include it every turn.</li>
    <li><strong>Lost in the middle</strong> — models attend to the start and end reliably and skim the middle. Put key summaries at the top with explicit section headers.</li>
  </ul>
  <h4>Keep the window lean</h4>
  <ul>
    <li>Trim verbose tool outputs to the relevant fields before they accumulate (a 40-field order lookup when 5 matter).</li>
    <li>In long codebase work, persist key findings to a scratchpad file and use <code>/compact</code> to reclaim room — degradation worsens as the window fills.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>"Summarize more aggressively" makes the drift <em>worse</em>, and "send the entire raw transcript every time" blows the budget and buries facts in the middle. The fix is a structured facts block, not more or less prose. Beware aggregate accuracy numbers too — 97% overall can hide a failing document-type or field segment.</div>`,
  quick:[
    {q:`Which part of a long input do models process least reliably?`,
     options:[`The beginning`,`The middle`,`The end`,`All equally`],
     correct:1, why:`The "lost in the middle" effect: start and end are reliable; the middle gets dropped.`},
    {q:`An order lookup returns 40 fields but only 5 are relevant. Best practice?`,
     options:[`Keep all 40 in context for completeness`,`Trim to the relevant fields before they accumulate`,`Summarize them into vague prose`,`Drop the tool entirely`],
     correct:1, why:`Trimming verbose outputs to relevant fields keeps context lean and on-point.`},
  ],
  scenario:[
    {q:`In a long multi-issue support conversation, the agent starts losing exact refund amounts and order numbers as history gets summarized. Best fix?`,
     options:[`Extract the hard facts (amounts, dates, order IDs, statuses) into a persistent "case facts" block included in every prompt, outside the summarized history.`,`Summarize more aggressively to save tokens.`,`Rely on the model to remember from earlier turns.`,`Disable summarization and send the entire raw transcript every time.`],
     correct:0, why:`A persistent structured facts block keeps precise transactional values intact regardless of how prose history is summarized.`,
     traps:{B:`More summarization blurs the very numbers you need.`,C:`Long-context recall of specific values is exactly what fails.`,D:`Raw transcripts blow the budget and bury facts in the middle.`}},
  ]},

'escalation':{ domain:'d5', title:'Escalation & ambiguity',
  eli5:`<p>Hand off to a human when the customer <strong>asks</strong> for one, when the rulebook <strong>doesn't cover</strong> their case, or when you're genuinely <strong>stuck</strong> — not just because they sound annoyed or you "feel unsure."</p>`,
  real:`<p>Escalation triggers: an explicit human request (honor it immediately, no investigation first), policy gaps/exceptions, and inability to make progress. <strong>Sentiment</strong> and <strong>self-reported confidence</strong> are unreliable proxies for complexity — the agent is often confidently wrong on hard cases. Calibrate with explicit criteria plus few-shot examples. Acknowledge frustration but offer resolution when it's in scope; escalate if the customer reiterates. On multiple customer matches, ask for another identifier rather than guessing.</p>
  <h4>Valid escalation triggers</h4>
  <ul>
    <li><strong>Explicit human request</strong> — honor immediately, no "let me try first."</li>
    <li><strong>Policy gap / exception</strong> — the rulebook doesn't cover the case.</li>
    <li><strong>Inability to progress</strong> — genuinely stuck after legitimate attempts.</li>
  </ul>
  <h4>Unreliable proxies (the exam loves these)</h4>
  <ul>
    <li><strong>Sentiment</strong> — negative tone doesn't correlate with case complexity.</li>
    <li><strong>Self-reported confidence</strong> — poorly calibrated; the agent is often confidently wrong on the hard cases. A 1-10 confidence threshold is not a sound router.</li>
    <li>Calibrate decision boundaries with explicit criteria + few-shot examples <em>before</em> reaching for a separate classifier or sentiment model.</li>
  </ul>
  <div class="edge"><b>Edge case: ambiguous identity</b>When a lookup returns multiple people with the same name, ask for an additional identifier — don't guess "first match" or "most orders." Acting on the wrong account is the costly failure.</div>`,
  quick:[
    {q:`Is an LLM's self-reported confidence score a reliable escalation trigger?`,
     options:[`Yes, it's well-calibrated`,`No — it's poorly calibrated, often confident on hard cases`,`Only above 0.9`,`Only for refunds`],
     correct:1, why:`Self-reported confidence and sentiment are unreliable proxies for case complexity.`},
    {q:`A customer explicitly demands a human agent. You should:`,
     options:[`Investigate first, then escalate if needed`,`Honor the request and escalate immediately`,`Offer a discount instead`,`Ask three clarifying questions first`],
     correct:1, why:`Explicit human requests are honored immediately without first attempting investigation.`},
  ],
  scenario:[
    {q:`Your agent hits 55% first-contact resolution (target 80%). Logs show it escalates straightforward cases (standard damage replacements with photo evidence) while trying to autonomously handle policy-exception cases. Most effective way to improve escalation calibration?`,
     options:[`Add explicit escalation criteria to the system prompt with few-shot examples showing when to escalate vs resolve.`,`Have the agent self-report a 1-10 confidence score and route below a threshold to humans.`,`Train a separate classifier on historical tickets to predict escalation.`,`Use sentiment analysis to escalate on negative sentiment.`],
     correct:0, why:`The root cause is unclear decision boundaries; explicit criteria + few-shot is the proportionate first fix before adding infrastructure.`,
     traps:{B:`Self-reported confidence is poorly calibrated — it's already confidently wrong on hard cases.`,C:`Over-engineered before prompt optimization is tried.`,D:`Sentiment doesn't correlate with case complexity.`}},
  ]},

'error-propagation':{ domain:'d5', title:'Error propagation in multi-agent',
  eli5:`<p>When a helper hits a wall, it shouldn't whisper "failed" or pretend it found nothing. It should report <strong>what it tried, what it got partway, and what to try next</strong> — so the boss can actually decide what to do.</p>`,
  real:`<p>Return <strong>structured error context</strong> (failure type, attempted query, partial results, alternative approaches) so the coordinator can make an intelligent recovery decision. Distinguish access failures (need a retry decision) from valid empty results (success). Generic "search unavailable" hides context. Two anti-patterns: silently suppressing errors (returning empty as success), and terminating the whole workflow on a single failure. Subagents recover locally for transient issues and propagate only what they can't resolve, with partial results.</p>
  <h4>What a recoverable error report carries</h4>
  <ul>
    <li><strong>Failure type</strong>, the <strong>attempted query</strong>, any <strong>partial results</strong>, and <strong>alternative approaches</strong> — enough for the coordinator to retry differently, reroute, or proceed with partial data and annotate the gap.</li>
    <li>Distinguish an <strong>access failure</strong> (timeout — needs a retry decision) from a <strong>valid empty result</strong> (query ran, no matches — a success).</li>
  </ul>
  <h4>Two anti-patterns</h4>
  <ul>
    <li><strong>Silent suppression</strong> — returning empty-as-success hides the failure and risks incomplete output.</li>
    <li><strong>Terminating the whole workflow</strong> on one subagent failure — recovery strategies could have succeeded.</li>
    <li>Subagents should recover <em>locally</em> for transient issues and propagate only what they can't resolve, with partial results attached.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>A generic "search unavailable" after exhausting retries is still wrong — it hides the context the coordinator needs. The right answer surfaces structure (type, query, partials, alternatives), not a flattened status string.</div>`,
  quick:[
    {q:`A subagent times out. Which return best enables coordinator recovery?`,
     options:[`A generic "search unavailable" after exhausting retries`,`Structured error context: failure type, attempted query, partial results, alternatives`,`An empty result marked successful`,`Throw to a top-level handler that kills the workflow`],
     correct:1, why:`Structured context lets the coordinator retry, reroute, or proceed with partial results.`},
    {q:`Killing the entire research workflow because one subagent failed is:`,
     options:[`Best practice for safety`,`An anti-pattern — recovery strategies could have succeeded`,`Required by the Agent SDK`,`Fine if logged`],
     correct:1, why:`Terminating everything on a single failure (and silent suppression) are both anti-patterns.`},
  ],
  scenario:[
    {q:`The web search subagent times out on a complex topic. How should that failure flow back to the coordinator for the best recovery?`,
     options:[`Return structured error context: failure type, attempted query, any partial results, and potential alternatives.`,`Retry with backoff inside the subagent, then return a generic "search unavailable".`,`Catch the timeout and return an empty result marked successful.`,`Propagate the exception to a top-level handler that terminates the whole workflow.`],
     correct:0, why:`Structured context gives the coordinator what it needs to retry differently, try an alternative, or proceed with partial results and annotate gaps.`,
     traps:{B:`A generic status hides the context needed for an informed decision.`,C:`Masking failure as success prevents recovery and risks incomplete output.`,D:`Terminating everything is unnecessary when recovery could succeed.`}},
  ]},

'provenance':{ domain:'d5', title:'Provenance & multi-source synthesis',
  eli5:`<p>When you combine facts from many sources, keep a <strong>label</strong> on each one saying where it came from. If two trustworthy sources <strong>disagree</strong>, show both with their labels — don't silently pick one and hide the other.</p>`,
  real:`<p>Source attribution gets lost when summaries compress without preserving claim→source mappings. Require subagents to output structured <strong>claim-source mappings</strong> (URL, document name, excerpt, date) that downstream agents preserve through synthesis. For conflicting statistics from credible sources, <strong>annotate both</strong> with attribution rather than arbitrarily picking one. Include publication/collection dates so temporal differences aren't misread as contradictions. Structure reports to separate well-established findings from contested ones.</p>
  <h4>Preserve the mapping, not just the claim</h4>
  <ul>
    <li>Require structured <strong>claim → source</strong> records: URL / document name, excerpt, and date. Plain prose summaries are where attribution is lost.</li>
    <li>Downstream synthesis must <em>carry the metadata through</em>, not flatten it away.</li>
  </ul>
  <h4>Handling conflict and time</h4>
  <ul>
    <li>Two credible sources disagree → <strong>annotate both with attribution</strong> and let the coordinator reconcile. Don't silently pick one, average them (fabricates a number neither reported), or discard them.</li>
    <li>Include publication/collection <strong>dates</strong> so a time-based difference isn't misread as a contradiction.</li>
    <li>Separate well-established findings from contested ones; add coverage notes where sources were unavailable.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>Silent selection, averaging, and discarding all destroy real signal. The correct move always <em>preserves</em> the conflicting values with their sources so the disagreement stays visible.</div>`,
  quick:[
    {q:`Two credible sources report different statistics. The synthesis agent should:`,
     options:[`Pick the higher number`,`Annotate both values with their source attribution`,`Average them silently`,`Drop the conflicting one`],
     correct:1, why:`Preserve both with attribution rather than arbitrarily selecting one.`},
    {q:`Why require publication/collection dates in structured outputs?`,
     options:[`To sort alphabetically`,`So temporal differences aren't misinterpreted as contradictions`,`To reduce tokens`,`They're not needed`],
     correct:1, why:`Dates let synthesis interpret time-based differences correctly instead of as conflicts.`},
  ],
  scenario:[
    {q:`During synthesis, two credible sources give different market-size figures. What should the document-analysis subagent do before synthesis?`,
     options:[`Complete the analysis with both values included and explicitly annotated with their sources, letting the coordinator decide how to reconcile.`,`Silently choose the value from the more recent source.`,`Average the two figures.`,`Discard both as unreliable.`],
     correct:0, why:`Preserving both conflicting values with source attribution lets downstream synthesis reconcile transparently rather than hiding a disagreement.`,
     traps:{B:`Silent selection destroys the conflict signal.`,C:`Averaging fabricates a number neither source reported.`,D:`Discarding loses real, credible data.`}},
  ]},
};

/* getChapterScenarios merges a chapter's own scenarios with both the seed
   CHAPTER_EXTRA bank and the expanded CHAPTER_EXTRA_MORE bank, so every
   chapter reaches at least 10 graded scenario questions. */
import { CHAPTER_EXTRA } from './extra.js';
import { CHAPTER_EXTRA_MORE } from './extra-more.js';
export function getChapterScenarios(tid){
  return [
    ...TOPICS[tid].scenario,
    ...((CHAPTER_EXTRA[tid])||[]),
    ...((CHAPTER_EXTRA_MORE[tid])||[]),
  ];
}
