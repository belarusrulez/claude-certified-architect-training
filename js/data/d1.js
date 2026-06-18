/* =========================================================================
   DOMAIN 1 — Agentic Architecture & Orchestration
   One chapter per Task Statement (1.1 .. 1.7). Self-contained module:
   each chapter carries its own domain/ts/title/eli5/real/callout?/example/
   quick/scenario. The app merges `quick`+`scenario` and shuffles options at
   render time, so `correct` is the index AS AUTHORED here.

   HTML rules:
   - `real`/`eli5`/`callout` use REAL inline HTML (<code>, <strong>, <em>,
     <h4>, <ul>, <li>, <div class="edge">).
   - Only INSIDE example.body (rendered in <pre>) are < and > escaped as
     &lt; / &gt;, and a literal ${ written as \${.
   - In every backtick string a literal ${ is written \${ to dodge JS interp.
   ========================================================================= */
export const D1 = {

/* ===================== TS 1.1 — agent-loop ===================== */
'agent-loop':{ domain:'d1', ts:'1.1', title:'The agent loop',
  eli5:`<p>Imagine a super-smart robot locked in a glass box with <strong>no hands</strong>. It can think, but it can't touch anything. You give it a goal; it asks you to do one thing (look out the window), you do it and report back, it thinks again, and asks for the next thing.</p><p>That circle — <strong>think &rarr; ask for an action &rarr; get the result &rarr; think again</strong> — repeated until it has the answer, is the agent loop. An "agent" is just this wheel spinning by itself until the job is done.</p>`,
  real:`<p>Every model turn comes back stamped with a <code>stop_reason</code>. Your code reads it: while it is <code>"tool_use"</code>, you run the requested tool(s), append the matching <code>tool_result</code> block(s) to the conversation, and call the model again. When it is <code>"end_turn"</code>, you stop &mdash; that turn is the final answer. The loop is driven by <strong>what is actually in the response</strong>, not by the model's prose.</p>
  <p>This is the difference between <strong>model-driven decision-making</strong> and a <strong>pre-configured decision tree</strong>. In the agent loop, Claude reasons about <em>which</em> tool to call next based on the accumulated context; you do not hardcode the sequence. Tool results accumulate in <code>messages</code> history so each iteration the model can incorporate the new information into its next decision.</p>
  <h4>The full set of stop reasons</h4>
  <ul>
    <li><code>end_turn</code> &mdash; Claude finished naturally. Terminal: return the text.</li>
    <li><code>tool_use</code> &mdash; Claude wants one or more tools run. Execute <em>all</em> requested calls, append every matching <code>tool_result</code>, loop.</li>
    <li><code>max_tokens</code> &mdash; the output ceiling was hit mid-generation. The turn may be <strong>truncated</strong> &mdash; a half-written tool call is not a valid request and the text is not a clean final answer. Raise <code>max_tokens</code> or continue generation; do not treat it as terminal <em>or</em> as a runnable tool call.</li>
    <li><code>stop_sequence</code> &mdash; a configured stop string was emitted.</li>
    <li><code>pause_turn</code> (long-running server-side tools) &mdash; resend the response back to continue generation.</li>
  </ul>
  <h4>How tool results re-enter the conversation</h4>
  <ul>
    <li>Append the assistant turn (<code>role:"assistant"</code>, the full <code>content</code> incl. <code>tool_use</code> blocks) verbatim &mdash; do not paraphrase it.</li>
    <li>Append a single <code>role:"user"</code> message whose <code>content</code> is a list of <code>tool_result</code> blocks, each carrying the <code>tool_use_id</code> of the call it answers.</li>
    <li>Results are correlated by <code>tool_use_id</code>, <strong>not by position</strong> &mdash; order is free, but each requested call must get exactly one result.</li>
  </ul>
  <h4>Edge cases &amp; failure modes</h4>
  <ul>
    <li><strong>Multiple tool_use blocks in one turn.</strong> A single turn can request several tools. Return a <code>tool_result</code> for <em>every</em> one in the next user message, or the conversation is malformed and the loop stalls.</li>
    <li><strong>Text + tool in the same turn.</strong> Claude often narrates ("Let me check that order&hellip;") <em>and</em> calls a tool in one turn. Assistant text is <em>not</em> a "done" signal.</li>
    <li><strong>Errored tools still need a result.</strong> On a tool failure return a <code>tool_result</code> with <code>is_error: true</code> so the model can recover &mdash; do not silently drop the call.</li>
  </ul>
  <div class="edge"><b>Exam traps</b>Never terminate by (a) parsing prose for "done"/"task complete", (b) checking whether assistant text exists, or (c) a fixed iteration cap as the <em>primary</em> stop. A cap is a safety backstop only; the real signal is <code>stop_reason</code> plus whether unanswered <code>tool_use</code> blocks remain.</div>`,
  callout:`<b>Anti-patterns the exam tests</b>Never terminate by parsing the model's prose, checking for assistant text, or using a fixed iteration cap as the primary stop. Loop control is <code>stop_reason</code> + unanswered tool calls &mdash; nothing else.`,
  example:{ label:`Example — loop driven by stop_reason`, body:
`while True:
    resp = client.messages.create(model="claude-opus-4-8",
                                   messages=msgs, tools=tools, max_tokens=4096)

    if resp.stop_reason == "max_tokens":
        raise Truncated("raise max_tokens / continue; NOT a clean turn")
    if resp.stop_reason != "tool_use":
        break                                    # end_turn -> done

    msgs.append({"role": "assistant", "content": resp.content})  # verbatim
    results = []
    for b in resp.content:                       # may be MULTIPLE tool_use blocks
        if b.type == "tool_use":
            results.append({"type": "tool_result",
                            "tool_use_id": b.id,  # correlate by id, not position
                            "content": run_tool(b.name, b.input)})
    msgs.append({"role": "user", "content": results})  # one result per tool_use` },
  quick:[
    {q:`Your loop should <strong>continue</strong> when <code>stop_reason</code> is ___ and <strong>stop</strong> when it is ___.`,
     options:[`continue on <code>tool_use</code>, stop on <code>end_turn</code>`,`continue on <code>end_turn</code>, stop on <code>tool_use</code>`,`continue on <code>max_tokens</code>, stop on <code>tool_use</code>`,`it doesn't depend on <code>stop_reason</code>`],
     correct:0, why:`<code>tool_use</code> means Claude wants a tool run (continue); <code>end_turn</code> means it has finished (stop).`},
    {q:`What should primarily drive loop termination?`,
     options:[`<code>stop_reason</code> plus whether unanswered <code>tool_use</code> blocks remain`,`Parsing the assistant's natural-language text for "done"`,`A fixed cap of N iterations`,`Customer sentiment`],
     correct:0, why:`Termination is determined by the response structure, not prose, caps, or sentiment.`},
    {q:`Why is model-driven decision-making preferred over a hardcoded tool sequence for an ambiguous workflow?`,
     options:[`Claude reasons about which tool fits the current context, handling the variance a fixed tree can't`,`It always uses fewer tokens`,`It removes the need for any stopping condition`,`It guarantees deterministic compliance`],
     correct:0, why:`Model-driven loops adapt to real-world variance; deterministic steps are pinned separately with gates/hooks.`},
  ],
  scenario:[
    {q:`An engineer's agent "hangs": Claude returns a <code>tool_use</code> request, but the conversation never progresses and Claude seems to wait forever. Most likely cause?`,
     options:[`The executor ran the tool but never sent a <code>tool_result</code> back in the next request, so the loop has nothing to continue from.`,`<code>stop_reason</code> was <code>end_turn</code>, so the agent correctly stopped.`,`The system prompt was too long.`,`Claude exceeded <code>max_tokens</code> and crashed the server.`],
     correct:0, why:`A <code>tool_use</code> request is an open question. The loop only advances when you feed the matching <code>tool_result</code> into the next request.`,
     traps:{B:`The premise says a tool was requested, so it wasn't <code>end_turn</code>.`,C:`Prompt length doesn't leave a tool request dangling.`,D:`<code>max_tokens</code> truncates a response; it doesn't hang the loop.`}},
    {q:`A model turn returns <code>stop_reason: "max_tokens"</code> in the middle of what looks like a tool call. Correct interpretation?`,
     options:[`The response was cut off by the token limit &mdash; it may be truncated, so don't treat it as a clean tool call or a final answer.`,`Claude finished normally; treat it as the final answer.`,`Claude requested a tool; run it and continue.`,`The API errored; resend the identical request and it will succeed.`],
     correct:0, why:`<code>max_tokens</code> means generation hit the output ceiling mid-stream; the content (including a half-written tool call) may be incomplete.`,
     traps:{B:`Only <code>end_turn</code> is a normal finish.`,C:`A truncated tool call isn't a valid, complete request.`,D:`It isn't an error; an identical resend likely truncates again.`}},
    {q:`For a high-ambiguity support workflow (returns, billing, account issues), you're choosing between letting Claude reason about the next tool vs hardcoding a fixed tool sequence for every case. Best approach?`,
     options:[`Use model-driven decision-making for adaptability, and reserve programmatic enforcement (hooks/gates) only for steps that must be deterministic.`,`Hardcode a fixed decision tree for every step.`,`Let the agent pick tools at random to avoid bias.`,`Restrict the agent to a single tool so there's no sequencing.`],
     correct:0, why:`Model-driven reasoning handles the variance an ambiguous workflow brings; you pin down only must-be-deterministic steps with hooks.`,
     traps:{B:`A rigid tree can't anticipate high-variance real requests.`,C:`Random selection is unreliable.`,D:`One tool can't resolve multi-step requests.`}},
    {q:`After your code runs a requested tool, what must happen so the model can reason about the next action on the following iteration?`,
     options:[`Append the <code>tool_result</code> to the conversation history that you send on the next request.`,`Store the result in a separate log the model never sees.`,`Put the result only in the system prompt, once.`,`Discard it &mdash; the model remembers what it asked for.`],
     correct:0, why:`Tool results are appended to the conversation so the model incorporates the new information into its next decision.`,
     traps:{B:`If the model can't see it, it can't reason over it.`,C:`The system prompt isn't where per-turn tool results belong.`,D:`The model has no memory of results you don't send back.`}},
    {q:`An engineer terminates the loop after a hardcoded 5 iterations, ignoring <code>stop_reason</code>. What's the likely failure?`,
     options:[`Tasks that need more than 5 tool calls get cut off mid-work &mdash; an iteration cap as the primary stop is an anti-pattern.`,`Nothing; 5 is always enough.`,`The model will refuse to call tools.`,`<code>stop_reason</code> stops working.`],
     correct:0, why:`A fixed cap as the primary stopping mechanism truncates legitimate longer tasks; termination should follow <code>stop_reason</code>.`,
     traps:{B:`Real tasks vary in length.`,C:`A cap doesn't change tool-calling behavior.`,D:`The cap just overrides the proper signal.`}},
    {q:`Your loop ends as soon as Claude emits any assistant text, but Claude sometimes narrates ("Let me check the order...") and then calls a tool in the same turn. What's wrong?`,
     options:[`Treating any assistant text as "done" terminates prematurely &mdash; rely on <code>stop_reason</code> / unanswered <code>tool_use</code> instead.`,`Claude should never narrate.`,`The text means the task truly finished.`,`Narration is a bug in the model.`],
     correct:0, why:`Checking for assistant text as a completion indicator is an anti-pattern; a turn can contain text <em>and</em> a tool request.`,
     traps:{B:`Narration is normal model behavior.`,C:`Text alongside a tool call doesn't mean done.`,D:`The bug is in the loop logic, not the model.`}},
    {q:`A teammate decides loop termination by scanning the model's prose for phrases like "task complete." Why is this fragile?`,
     options:[`Parsing natural-language signals for termination is unreliable; the structured <code>stop_reason</code> is the correct signal.`,`Prose parsing is faster than reading <code>stop_reason</code>.`,`It works as long as you list enough phrases.`,`It's the documented approach.`],
     correct:0, why:`Natural-language termination detection is an explicit anti-pattern &mdash; wording varies and is unreliable.`,
     traps:{B:`Speed is irrelevant if it's wrong.`,C:`You can't enumerate every phrasing.`,D:`The documented approach is <code>stop_reason</code>.`}},
    {q:`A single model turn returns two <code>tool_use</code> blocks. What should your loop do before the next model call?`,
     options:[`Execute both tools and return both <code>tool_result</code>s (each tagged with its <code>tool_use_id</code>) in the next request.`,`Execute only the first and ignore the second.`,`Reject the turn &mdash; only one tool per turn is allowed.`,`End the loop.`],
     correct:0, why:`When a turn requests multiple tools, you run them all and return all results so the model can continue coherently.`,
     traps:{B:`Dropping a requested call leaves it unanswered and stalls the loop.`,C:`Multiple tool_use blocks per turn are valid.`,D:`There's still work to do.`}},
    {q:`Claude requested two tools in one turn, but your code returned only one <code>tool_result</code> and called the model again. What happens?`,
     options:[`The request is malformed / the model is left waiting on a missing result &mdash; you must return a result for every requested call.`,`The model ignores the missing one and proceeds fine.`,`The API auto-fills the missing result.`,`It doubles the cost but works.`],
     correct:0, why:`Every <code>tool_use</code> needs a matching <code>tool_result</code>; an unanswered call leaves the conversation incomplete.`,
     traps:{B:`A dangling tool call isn't silently ignored.`,C:`The API doesn't fabricate results.`,D:`It's a correctness problem, not a cost one.`}},
    {q:`A turn comes back with <code>stop_reason: "end_turn"</code> and a complete text answer, no tool calls. Your loop should:`,
     options:[`Stop &mdash; that's the final answer.`,`Run one more tool just in case.`,`Re-send the request to confirm.`,`Continue looping until a cap is hit.`],
     correct:0, why:`<code>end_turn</code> with no tool calls is the terminal state: return the answer.`,
     traps:{B:`There's no tool requested to run.`,C:`Re-sending wastes a call and may diverge.`,D:`Looping past completion is the cap anti-pattern.`}},
    {q:`A tool your agent called raised an exception. To keep the loop healthy, what do you send back on the next turn?`,
     options:[`A <code>tool_result</code> for that call with <code>is_error: true</code> and a message, so the model can recover.`,`Nothing for that call &mdash; just omit it.`,`An <code>end_turn</code> to stop the conversation.`,`A duplicate of the previous successful result.`],
     correct:0, why:`Failed tools still require a matching result (flagged as an error) so the model can react; dropping it malforms the turn.`,
     traps:{B:`An omitted result leaves the call unanswered.`,C:`You don't control <code>stop_reason</code>; the model emits it.`,D:`Fabricating a wrong result corrupts reasoning.`}},
  ]},

/* ===================== TS 1.2 — multi-agent ===================== */
'multi-agent':{ domain:'d1', ts:'1.2', title:'Multi-agent: coordinator & hub-and-spoke',
  eli5:`<p>Think of a <strong>head chef</strong> running a kitchen. A huge order comes in, so the chef hands each dish to a different cook. Each cook works at their <strong>own station</strong> with only the instructions for their dish. The cooks never talk to each other &mdash; everything goes back through the chef &mdash; and they hand back a <strong>finished plate</strong>, not a play-by-play of every chop.</p><p>That's hub-and-spoke: the chef is the hub (coordinator), the cooks are the spokes (subagents), and all routing runs through the center.</p>`,
  real:`<p>In <strong>hub-and-spoke</strong>, a single coordinator agent owns task decomposition, delegation, result aggregation, error handling, and the decision of <em>which</em> subagents to invoke for a given query. All inter-subagent communication routes <strong>through the coordinator</strong> &mdash; never spoke-to-spoke. Centralizing the flow buys observability (one place sees every message), consistent error handling, and controlled information flow.</p>
  <p>Subagents operate with <strong>isolated context</strong>: they do <em>not</em> inherit the coordinator's conversation history automatically. (The mechanics of spawning and passing that context are TS 1.3 &mdash; see <em>subagent-config</em>.) Here the architectural point is that isolation is the whole reason the pattern exists.</p>
  <h4>Why isolation is the point</h4>
  <ul>
    <li><strong>Context isolation</strong> &mdash; each subagent gets a clean window, so a 200-file exploration doesn't pollute the coordinator's context. Subagents return a <em>summary</em>, not their raw transcript.</li>
    <li><strong>Parallelism</strong> &mdash; the coordinator can fan out concurrent work (covered mechanically in 1.3).</li>
    <li><strong>Specialization</strong> &mdash; each subagent has a scoped role and tool set, so it doesn't reach for out-of-role tools.</li>
  </ul>
  <h4>The coordinator's real job: dynamic selection &amp; refinement</h4>
  <ul>
    <li><strong>Analyze before delegating.</strong> A good coordinator inspects query requirements and <em>dynamically selects</em> which subagents to invoke, rather than always running the full pipeline regardless of need. A simple lookup shouldn't trigger the whole research fleet.</li>
    <li><strong>Partition scope</strong> to minimize duplication &mdash; assign distinct subtopics or distinct source types to each agent so two of them don't redo the same work.</li>
    <li><strong>Iterative refinement loop.</strong> The coordinator evaluates synthesis output for gaps, re-delegates <em>targeted</em> queries to the search/analysis subagents, and re-invokes synthesis until coverage is sufficient &mdash; rather than accepting the first pass.</li>
  </ul>
  <h4>Edge cases &amp; failure modes</h4>
  <ul>
    <li><strong>Over-narrow decomposition</strong> &mdash; the classic gap-in-coverage bug on broad research topics. The coordinator carves a topic into too-narrow subtasks and silently misses whole domains. Diagnose it by reading the coordinator's <em>subtask list</em>, not the subagents' output.</li>
    <li><strong>Spoke-to-spoke coupling</strong> &mdash; subagents calling each other (or sharing a file) breaks observability and consistent error handling. Route through the hub.</li>
    <li><strong>Overlap / duplication</strong> &mdash; absent scope partitioning, two subagents cover the same ground.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>Multi-agent adds real cost (latency, tokens, coordination). The justification must be isolation, parallelism, or specialization &mdash; not "it sounds more powerful." And a coverage gap on a broad topic is almost always <em>coordinator decomposition</em>, not a failing subagent: the subagents executed their narrow assignments perfectly.</div>`,
  callout:`<b>Route everything through the hub</b>All subagent communication, error handling, and information routing goes <em>through the coordinator</em> &mdash; for observability, consistent error handling, and controlled flow. No spoke-to-spoke calls.`,
  example:{ label:`Example — coordinator dynamically selects + refines`, body:
`# Coordinator pseudo-logic (hub-and-spoke):
plan = analyze_query(user_request)        # decide WHICH subagents are needed
if plan.is_simple_lookup:
    return run("lookup", plan)             # don't fan out the whole fleet

# partition scope so subagents don't duplicate:
results = []
for slice in partition(plan.topic):       # distinct subtopics / source types
    results.append(delegate("researcher", scope=slice))

draft = delegate("synthesis", findings=results)
# iterative refinement: re-delegate TARGETED gap queries, not a full re-run
while gaps := find_gaps(draft):
    extra = [delegate("researcher", scope=g) for g in gaps]
    draft = delegate("synthesis", findings=results + extra)
return draft
# ALL of the above flows through the coordinator -> one place for errors/logs.` },
  quick:[
    {q:`In hub-and-spoke, how should a fact produced by the search subagent reach the analysis subagent?`,
     options:[`Through the coordinator, which passes the needed slice along`,`The analysis subagent calls the search subagent directly`,`Via a shared file the two subagents both write`,`Through a global context window all agents share`],
     correct:0, why:`All inter-subagent communication routes through the coordinator for observability and consistent error handling.`},
    {q:`A research report on a broad topic covers only one sub-area though every subagent succeeded. Most likely root cause?`,
     options:[`The coordinator's task decomposition was too narrow`,`The synthesis agent lacked a bigger context window`,`The model version was too old`,`The subagents shared too much context`],
     correct:0, why:`Over-narrow decomposition by the coordinator silently misses whole domains; the subagents executed their (narrow) assignments correctly.`},
    {q:`When should a coordinator skip fanning out to the full subagent pipeline?`,
     options:[`When the query is simple enough that dynamic analysis shows one subagent suffices`,`Never &mdash; always run every subagent for consistency`,`Only when token budget is exhausted`,`Only on the second turn`],
     correct:0, why:`A good coordinator dynamically selects which subagents to invoke based on query complexity rather than always routing through the full pipeline.`},
  ],
  scenario:[
    {q:`On the topic "impact of AI on creative industries," every subagent completes successfully, but the final report covers only visual arts &mdash; missing music, writing, and film. The coordinator's logs show it decomposed the topic into "AI in digital art," "AI in graphic design," and "AI in photography." Most likely root cause?`,
     options:[`The coordinator's task decomposition is too narrow, so subagent assignments don't cover all relevant domains of the topic.`,`The synthesis agent lacks instructions for identifying coverage gaps.`,`The web search agent's queries aren't comprehensive enough.`,`The document analysis agent filters out non-visual sources.`],
     correct:0, why:`The logs reveal it directly: the coordinator only generated visual-arts subtasks. The subagents executed their assignments correctly &mdash; the problem is what they were assigned.`,
     traps:{B:`Synthesis worked within the scope it was given.`,C:`Search returned relevant results for the (too-narrow) tasks.`,D:`No evidence of filtering; the tasks never covered non-visual areas.`}},
    {q:`Your research coordinator keeps producing reports with coverage gaps even when subtasks are reasonable. Which pattern best closes them?`,
     options:[`Have the coordinator evaluate synthesis for gaps, re-delegate targeted queries to search/analysis, and re-invoke synthesis until coverage is sufficient.`,`Run the whole pipeline twice and concatenate.`,`Spin up ten subagents up front regardless of topic.`,`Tell synthesis to "cover everything."`],
     correct:0, why:`An iterative refinement loop targets the actual gaps and re-runs only what's needed.`,
     traps:{B:`Re-running everything duplicates work without targeting gaps.`,C:`Arbitrary fan-out risks narrow decomposition and waste.`,D:`Vague instruction doesn't fix structural gaps.`}},
    {q:`Two of your subagents keep returning heavily overlapping results, wasting compute. Best fix in the coordinator's decomposition?`,
     options:[`Partition the scope across subagents &mdash; assign distinct subtopics or source types so each covers a different slice.`,`Let both run; duplication is harmless.`,`Merge them into one subagent that does everything.`,`Increase the number of subagents.`],
     correct:0, why:`Partitioning research scope (distinct subtopics/source types) minimizes duplication.`,
     traps:{B:`Duplication wastes tokens and time.`,C:`Merging loses parallelism and isolation.`,D:`More agents without partitioning multiplies overlap.`}},
    {q:`In your hub-and-spoke system, the analysis subagent needs a fact the search subagent produced. How should that flow?`,
     options:[`Through the coordinator &mdash; it collects the search result and passes the needed slice to the analysis subagent.`,`The analysis subagent calls the search subagent directly.`,`Both share one global context window.`,`They negotiate a shared file between themselves.`],
     correct:0, why:`Hub-and-spoke routes all inter-subagent communication through the coordinator.`,
     traps:{B:`Spoke-to-spoke calls violate the pattern.`,C:`A shared global window destroys isolation.`,D:`A shared file is still spoke-to-spoke coordination.`}},
    {q:`A team proposes a five-agent system for a task a single well-contextualized agent handles fine. What's the right pushback?`,
     options:[`Multi-agent adds latency, tokens, and coordination cost; justify it by isolation, parallelism, or specialization &mdash; not by "it sounds more powerful."`,`Always prefer multi-agent; more agents are always better.`,`Switch to a larger model instead of any agents.`,`Multi-agent is required whenever there is more than one tool.`],
     correct:0, why:`Reach for multi-agent only under real pressure (context isolation, parallelism, specialization); otherwise it's pure overhead.`,
     traps:{B:`More agents multiply coordination cost and failure surface.`,C:`Model size doesn't address the architectural question.`,D:`Tool count alone doesn't justify multiple agents.`}},
    {q:`Your coordinator runs the entire 6-subagent research pipeline even for "what's the capital of France?" Best improvement?`,
     options:[`Have the coordinator analyze query complexity and dynamically select which subagents to invoke, skipping the full pipeline for simple queries.`,`Hardcode the full pipeline for every query for consistency.`,`Remove all but one subagent permanently.`,`Cache the answer to every possible question.`],
     correct:0, why:`Dynamic subagent selection based on query requirements avoids wasteful full-pipeline runs for simple queries.`,
     traps:{B:`Always running the full pipeline wastes cost on trivial queries.`,C:`Removing subagents cripples the genuinely complex queries.`,D:`You can't enumerate every question.`}},
    {q:`The coordinator needs observability and consistent error handling across a research fleet. Which architecture delivers it?`,
     options:[`Hub-and-spoke: all subagent communication, errors, and routing pass through the coordinator.`,`A mesh where every subagent talks to every other subagent.`,`A peer ring where each agent forwards to the next.`,`Independent agents writing to one shared mutable file.`],
     correct:0, why:`Routing everything through the coordinator centralizes observability and error handling &mdash; the defining benefit of hub-and-spoke.`,
     traps:{B:`A mesh scatters error handling and kills observability.`,C:`A ring couples agents and hides failures.`,D:`Shared mutable state is uncontrolled spoke-to-spoke coupling.`}},
    {q:`To diagnose why a broad-topic report missed entire areas, where do you look first?`,
     options:[`The coordinator's subtask/decomposition list &mdash; gaps there mean those areas were never assigned.`,`Each subagent's raw transcript for hallucinations.`,`The model's temperature setting.`,`The number of tokens the synthesis agent used.`],
     correct:0, why:`Over-narrow decomposition shows up in the coordinator's assignment list; the subagents only ever covered what they were asked to.`,
     traps:{B:`Subagents executed their narrow tasks correctly &mdash; not a transcript bug.`,C:`Temperature doesn't create coverage gaps.`,D:`Token count doesn't explain missing domains.`}},
    {q:`What do subagents return to the coordinator to keep the coordinator's context clean?`,
     options:[`A concise summary of their findings, not their full raw transcript.`,`Their entire conversation transcript verbatim.`,`Nothing &mdash; the coordinator reads their context directly.`,`A pointer to a shared mutable log.`],
     correct:0, why:`Context isolation works because subagents hand back summaries; dumping raw transcripts back into the hub defeats the purpose.`,
     traps:{B:`Raw transcripts re-bloat the coordinator's context.`,C:`Isolation means the coordinator can't read subagent context directly.`,D:`Shared logs reintroduce coupling.`}},
    {q:`Your coordinator-driven research system produces good coverage but the synthesis stops at the first draft, leaving thin sections. Best structural fix?`,
     options:[`Add an iterative refinement loop: the coordinator detects thin sections and re-delegates targeted queries before re-synthesizing.`,`Increase the synthesis agent's <code>max_tokens</code> and accept the first draft.`,`Let the synthesis agent invoke the search subagent itself.`,`Concatenate two full pipeline runs.`],
     correct:0, why:`Iterative refinement (evaluate, re-delegate targeted gaps, re-synthesize) is the coordinator pattern for closing thin coverage.`,
     traps:{B:`More tokens don't fill sections the search never covered.`,C:`Synthesis calling search directly is spoke-to-spoke coupling.`,D:`Duplicating the whole run wastes work and still won't target the gaps.`}},
  ]},

/* ===================== TS 1.3 — subagent-config (NEW) ===================== */
'subagent-config':{ domain:'d1', ts:'1.3', title:'Subagent invocation & context passing',
  eli5:`<p>The head chef can't <em>create</em> a new cook unless they have the special "hire a cook" button. That button is the <strong>Task</strong> tool &mdash; and it only appears if the chef was given it.</p><p>And remember: a brand-new cook knows <strong>nothing</strong> about the order. The chef has to write everything the cook needs on the ticket &mdash; the recipe, the ingredients, who it's for. If the chef just says "make the thing," the new cook has no idea what "the thing" is.</p>`,
  real:`<p>This statement is the <strong>mechanics</strong> of multi-agent (TS 1.2 is the architecture). Subagents are spawned by the <strong>Task tool</strong>, and a coordinator can only invoke it if its <code>allowedTools</code> <em>includes</em> <code>"Task"</code> &mdash; omit it and the coordinator silently can't spawn anyone.</p>
  <p>Because subagents run with <strong>isolated context</strong> and <em>do not inherit parent context or share memory between invocations</em>, every fact a subagent needs must be <strong>explicitly included in its prompt</strong>. There is no implicit handoff: if the synthesis subagent needs the search results, you paste those results (not a one-line pointer) into its prompt.</p>
  <h4>AgentDefinition: scoping each subagent type</h4>
  <ul>
    <li>An <code>AgentDefinition</code> configures a subagent type: a <strong>description</strong> (so the coordinator knows when to use it), a <strong>system prompt</strong> (its role/behavior), and <strong>tool restrictions</strong> (the tools it is allowed to use).</li>
    <li>Tool scoping prevents misuse &mdash; a synthesis agent without web-search tools <em>can't</em> wander off and search when it shouldn't.</li>
  </ul>
  <h4>Passing context correctly</h4>
  <ul>
    <li><strong>Include complete findings, not summaries-of-summaries.</strong> Pass the actual web-search results and document-analysis outputs into the synthesis subagent's prompt. A starved subagent (given only a one-line summary) produces vague output.</li>
    <li><strong>Use structured formats to separate content from metadata.</strong> Carry source URLs, document names, and page numbers alongside the claims so attribution survives the handoff. Plain prose loses provenance.</li>
    <li><strong>Goals over procedures.</strong> Write coordinator prompts that specify <em>research goals and quality criteria</em>, not rigid step-by-step instructions, so subagents can adapt their approach.</li>
  </ul>
  <h4>Parallel spawning</h4>
  <ul>
    <li>Emit <strong>multiple <code>Task</code> tool calls in a single coordinator response</strong> to run subagents in parallel. Spreading the calls across separate turns runs them one at a time (sequential).</li>
  </ul>
  <h4>Fork-based session management</h4>
  <ul>
    <li><code>fork_session</code> creates independent branches from a <strong>shared analysis baseline</strong>, so you can explore divergent approaches (e.g., two refactoring strategies) without re-doing the shared groundwork. (Full session lifecycle is TS 1.7.)</li>
  </ul>
  <div class="edge"><b>Exam trap</b>Two separate failures look alike: (1) "the coordinator never spawns anyone" &rarr; <code>"Task"</code> missing from <code>allowedTools</code>; (2) "the subagent's output is vague / misses specifics the parent had" &rarr; context wasn't passed explicitly in the prompt. Neither is fixed by a bigger model or more <code>max_tokens</code>.</div>`,
  callout:`<b>Two non-negotiables</b><code>allowedTools</code> must include <code>"Task"</code> to spawn, and subagents inherit <em>nothing</em> &mdash; pass every needed finding explicitly in the prompt. Parallelism = multiple <code>Task</code> calls in <em>one</em> response.`,
  example:{ label:`Example — parallel spawn + explicit context passing`, body:
`# 1) Coordinator must be allowed to spawn:
coordinator = AgentDefinition(
    allowedTools=["Task", "web_search"],     # <- WITHOUT "Task" it cannot spawn
)
# 2) Each subagent type is scoped (description / system_prompt / tools):
synthesis = AgentDefinition(
    description="Combine findings into a cited report.",
    system_prompt="You write cited summaries. You do NOT search the web.",
    allowedTools=["write_report"],           # no search tool -> can't misuse it
)

# 3) Parallel: BOTH Task calls in ONE response -> they run concurrently.
#    Subagents inherit NOTHING, so paste the actual findings into the prompt.
Task(subagent_type="researcher",
     prompt="Cover MUSIC. Return JSON: {claim, source_url, doc, page, excerpt}")
Task(subagent_type="researcher",
     prompt="Cover FILM.  Return JSON: {claim, source_url, doc, page, excerpt}")

# later, pass the COMPLETE structured findings into synthesis (not a one-liner):
Task(subagent_type="synthesis",
     prompt=f"Write a cited report from these findings:\\n{json.dumps(findings)}")` },
  quick:[
    {q:`Which mechanism spawns subagents, and what must be configured to allow it?`,
     options:[`The <code>Task</code> tool; <code>allowedTools</code> must include <code>"Task"</code>`,`The <code>fork_session</code> call; no config needed`,`A <code>subagent: true</code> flag on the API request`,`The <code>/spawn</code> slash command`],
     correct:0, why:`The <code>Task</code> tool spawns subagents and requires <code>"Task"</code> in the coordinator's <code>allowedTools</code>.`},
    {q:`Do subagents automatically inherit the coordinator's conversation history?`,
     options:[`No &mdash; context must be passed explicitly in the subagent's prompt`,`Yes, they share the full context window`,`Only if they use the same model`,`Only the system prompt is inherited`],
     correct:0, why:`Subagents have isolated context and don't share memory between invocations; you provide what they need in their prompt.`},
    {q:`How do you run three subagents in parallel rather than sequentially?`,
     options:[`Emit all three <code>Task</code> tool calls in a single coordinator response`,`Call <code>fork_session</code> three times`,`Put each <code>Task</code> call on its own separate turn`,`Set <code>parallel: true</code> on the API request`],
     correct:0, why:`Parallel subagents come from multiple <code>Task</code> calls in one response; separate turns run sequentially.`},
  ],
  scenario:[
    {q:`A synthesis subagent produces vague output that omits specifics the web-search subagent found. The coordinator had passed synthesis only a one-line summary. Best fix?`,
     options:[`Include the complete findings (search results, excerpts, source metadata) directly in the synthesis subagent's prompt.`,`Instruct synthesis to "be more thorough."`,`Give synthesis the web-search tool to re-fetch everything.`,`Increase <code>max_tokens</code> on synthesis.`],
     correct:0, why:`Subagents don't inherit the coordinator's context &mdash; pass needed findings explicitly in their prompt.`,
     traps:{B:`Encouragement can't supply data never provided.`,C:`Over-provisions and duplicates work.`,D:`Token budget isn't the issue.`}},
    {q:`Your coordinator agent fails to spawn any subagents at all. Most likely configuration cause?`,
     options:[`Its <code>allowedTools</code> doesn't include <code>"Task"</code>.`,`The subagents are using the wrong model.`,`<code>max_tokens</code> is too low.`,`The system prompt is too short.`],
     correct:0, why:`A coordinator can only invoke subagents if <code>"Task"</code> is in its <code>allowedTools</code>.`,
     traps:{B:`Model choice doesn't block spawning.`,C:`Token budget doesn't prevent the Task tool.`,D:`Prompt length is unrelated.`}},
    {q:`Your coordinator runs three independent research subagents, but they execute sequentially, tripling latency. How do you parallelize?`,
     options:[`Emit all three <code>Task</code> tool calls in a single coordinator response.`,`Merge them into one subagent.`,`Use <code>fork_session</code> for each.`,`Move them to the Message Batches API.`],
     correct:0, why:`Parallel subagents come from multiple <code>Task</code> calls in one response, not separate turns.`,
     traps:{B:`Merging loses isolation and parallelism.`,C:`Forking is for divergent branches off a baseline.`,D:`Batch doesn't do multi-turn agent tool calls.`}},
    {q:`Your synthesis subagent sometimes attempts web searches it shouldn't, misusing tools outside its role. Best fix?`,
     options:[`Restrict its tool set in its <code>AgentDefinition</code> so it only has synthesis-relevant tools.`,`Add a prompt line telling it not to search.`,`Remove web search from every agent.`,`Give it even more tools so it's less confused.`],
     correct:0, why:`Scoped tool access per subagent (via its definition) prevents cross-specialization misuse deterministically.`,
     traps:{B:`Prompt guidance is probabilistic.`,C:`Removing it globally breaks the search agent.`,D:`More tools worsen misuse.`}},
    {q:`Your final report loses track of which source each claim came from after synthesis. What should subagents output so attribution survives the handoff?`,
     options:[`Structured outputs that separate content from metadata (source URLs, document names, page numbers) so synthesis can preserve attribution.`,`Plain prose summaries with no source labels.`,`Only the final conclusions, to save tokens.`,`The raw web pages pasted in full.`],
     correct:0, why:`Structured claim-source mappings let downstream synthesis keep attribution intact across the explicit context handoff.`,
     traps:{B:`Unlabeled prose is where attribution is lost.`,C:`Dropping sources is the problem.`,D:`Raw dumps bloat context and still aren't structured.`}},
    {q:`You're writing the coordinator's prompt for a research pipeline. Which style produces the most adaptable subagent results?`,
     options:[`Specify research goals and quality criteria, letting subagents adapt their approach.`,`Give exhaustive step-by-step procedural instructions for every subagent action.`,`Provide no guidance and let them improvise fully.`,`Hardcode the exact tool call sequence for each subagent.`],
     correct:0, why:`Goal-and-criteria prompts enable subagent adaptability; rigid procedures suppress it.`,
     traps:{B:`Step-by-step scripts remove the adaptability you want.`,C:`No guidance yields unfocused work.`,D:`Hardcoded sequences are brittle for open-ended research.`}},
    {q:`You want two subagents to explore divergent refactoring approaches from the same codebase analysis without redoing that analysis. Which mechanism?`,
     options:[`<code>fork_session</code> to branch independent sessions from the shared analysis baseline.`,`Emit two <code>Task</code> calls with no shared context.`,`Remove <code>"Task"</code> from <code>allowedTools</code>.`,`Pass each subagent a one-line summary instead of the analysis.`],
     correct:0, why:`Fork-based session management branches from a shared baseline so each branch explores a divergent approach without re-running the shared work.`,
     traps:{B:`Fresh Tasks would each re-do the baseline analysis.`,C:`That disables spawning entirely.`,D:`A one-liner starves the subagents of the analysis.`}},
    {q:`A coordinator passes the synthesis subagent just the IDs of documents the search agent found, expecting synthesis to "look them up." Synthesis produces nothing useful. Why?`,
     options:[`Subagents don't share memory between invocations &mdash; the actual document content must be in the prompt, not a pointer the subagent can't resolve.`,`Synthesis needs a longer system prompt.`,`The IDs were formatted wrong.`,`Synthesis should have been given <code>"Task"</code>.`],
     correct:0, why:`Context must be explicitly provided; a bare ID is a pointer into memory the isolated subagent doesn't have.`,
     traps:{B:`Prompt length isn't the missing piece &mdash; the data is.`,C:`Even perfect IDs are unresolvable without shared memory.`,D:`Synthesis isn't spawning anyone; it needs content.`}},
    {q:`Each subagent type in your system should have a distinct role, behavior, and a restricted set of tools. Where is that configured?`,
     options:[`In each subagent's <code>AgentDefinition</code> (description, system prompt, tool restrictions).`,`In the coordinator's <code>max_tokens</code>.`,`In the global API key settings.`,`In a single shared system prompt for all agents.`],
     correct:0, why:`The AgentDefinition is where you set per-type description, system prompt, and allowed tools.`,
     traps:{B:`Token budget doesn't define role or tools.`,C:`API keys are unrelated to agent roles.`,D:`A shared prompt defeats specialization.`}},
    {q:`A coordinator emits five <code>Task</code> calls but spreads them one-per-turn across five turns to "be safe." Result?`,
     options:[`They run sequentially, multiplying latency; emitting them in one response would parallelize.`,`They still run in parallel automatically.`,`The Task tool rejects calls after the first.`,`Context is shared across the five turns automatically.`],
     correct:0, why:`Parallelism requires multiple Task calls in a single response; one-per-turn is sequential.`,
     traps:{B:`Separate turns are sequential by construction.`,C:`Subsequent Task calls aren't rejected; they just queue across turns.`,D:`Each invocation is still isolated.`}},
    {q:`A teammate "fixes" vague subagent output by upgrading the subagent to a larger model. It barely improves. Why?`,
     options:[`The root cause is missing context in the prompt, not model capability; a bigger model still can't see data it was never given.`,`Larger models ignore the Task tool.`,`The coordinator needs <code>fork_session</code> instead.`,`The subagent inherited the wrong system prompt.`],
     correct:0, why:`When a subagent is starved of explicitly-passed findings, no model size compensates; pass the complete context.`,
     traps:{B:`Model size doesn't affect Task availability.`,C:`Forking branches sessions; it doesn't supply missing findings.`,D:`The problem is absent data, not the system prompt.`}},
  ]},

/* ===================== TS 1.4 — workflow-enforcement (NEW) ===================== */
'workflow-enforcement':{ domain:'d1', ts:'1.4', title:'Multi-step workflows: enforcement & handoff',
  eli5:`<p>A polite sign that says "please check ID before giving out money" works <em>most</em> of the time &mdash; but "most" isn't good enough when it's money. A <strong>locked door</strong> that physically won't open until ID is checked works <em>every</em> time.</p><p>For the rules that absolutely must hold, build the locked door (code), not the sign (a prompt). And when you hand a problem to a human, give them a tidy summary &mdash; not a shrug and "good luck."</p>`,
  real:`<p>The core decision in multi-step workflows is <strong>programmatic enforcement vs prompt-based guidance</strong> for ordering. Prompt instructions ("always verify before refunding") are <strong>probabilistic</strong> &mdash; they have a non-zero failure rate. When <em>deterministic compliance</em> is required (e.g., identity verification before a financial operation), a prompt instruction alone <em>will</em> eventually fail. The fix is a <strong>prerequisite gate</strong> in code.</p>
  <h4>Programmatic prerequisites (gates)</h4>
  <ul>
    <li>A gate <strong>blocks a downstream tool until a prerequisite step has completed</strong>. Example: block <code>process_refund</code> until <code>get_customer</code> has returned a <em>verified</em> customer ID.</li>
    <li>This is deterministic. Putting the prerequisite tool "first in the array," or wording the system prompt strongly, does <strong>not</strong> enforce call order &mdash; those are probabilistic at best.</li>
    <li>Deterministic vs probabilistic is the whole framing: money, identity, and irreversible actions get gates; tone and soft guidance can stay in the prompt.</li>
  </ul>
  <h4>Decomposing multi-concern requests</h4>
  <ul>
    <li>A real customer message often bundles several distinct concerns ("my order's late, I was double-charged, and I want to change my email"). Decompose it into <strong>distinct items</strong>, investigate each in parallel using <em>shared context</em>, then synthesize one unified resolution &mdash; rather than handling them serially and losing the thread.</li>
  </ul>
  <h4>Structured handoff to humans</h4>
  <ul>
    <li>When escalating mid-process to a human who <strong>lacks access to the conversation transcript</strong>, compile a <strong>structured handoff summary</strong>: customer ID, root cause analysis, refund amount, and recommended action.</li>
    <li>A bare "escalating, please help" forces the human to restart from zero; a raw transcript dump is unstructured and slow. The structured summary is what lets the human act immediately.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>"In X% of cases the agent skips the verification step" is the signature of a <em>missing prerequisite gate</em> &mdash; the right fix is programmatic enforcement, not a stronger prompt, more few-shot examples, or reordering the tool array. Any of those leaves a non-zero failure rate, which is exactly what's unacceptable for money/identity.</div>`,
  callout:`<b>Deterministic when it must be</b>If a rule must hold 100% of the time (identity before money, verify before refund), gate it in code. Prompts are probabilistic &mdash; non-zero failure rate. Reserve prompts for soft guidance.`,
  example:{ label:`Example — prerequisite gate blocking a downstream tool`, body:
`# Gate: process_refund is BLOCKED until get_customer returned a verified id.
# This is deterministic; a system-prompt instruction is not.
def pre_tool_use(call, state):
    if call.name in ("process_refund", "lookup_order"):
        if not state.get("verified_customer_id"):
            return Block(reason="verify identity first",
                         redirect="run get_customer")   # not a silent dead-end
    return Allow()

def post_tool_use(call, result, state):
    if call.name == "get_customer" and result.get("verified"):
        state["verified_customer_id"] = result["customer_id"]

# Structured handoff when escalating to a human with NO transcript access:
handoff = {
    "customer_id":        "C-10293",
    "root_cause":         "duplicate charge from retry on 2026-06-02",
    "refund_amount":      "$48.00",
    "recommended_action": "approve refund; waive late fee",
}` },
  quick:[
    {q:`A workflow step must execute every single time before a financial action. Prompt instruction or programmatic gate?`,
     options:[`A programmatic prerequisite gate (deterministic)`,`A strongly-worded system prompt (probabilistic)`,`A few-shot example`,`Reordering the tool array so the prerequisite is first`],
     correct:0, why:`Deterministic compliance requires a gate; prompts and array order have a non-zero failure rate.`},
    {q:`A gate blocks <code>process_refund</code> until what has happened?`,
     options:[`<code>get_customer</code> has returned a verified customer ID`,`The system prompt mentions verification`,`The user typed "verified"`,`<code>max_tokens</code> is raised`],
     correct:0, why:`The prerequisite gate blocks the downstream tool until the prerequisite step (verified customer ID) completes.`},
    {q:`When escalating to a human who can't see the conversation, what do you hand off?`,
     options:[`A structured summary: customer ID, root cause, refund amount, recommended action`,`A short "please help" note`,`The entire raw transcript`,`Only the customer's last message`],
     correct:0, why:`A structured handoff summary gives the human what they need to act without the transcript.`},
  ],
  scenario:[
    {q:`In 12% of cases, your agent skips <code>get_customer</code> and calls <code>lookup_order</code> using only the customer's stated name, sometimes causing misidentified accounts and incorrect refunds. Most effective fix?`,
     options:[`Add a programmatic prerequisite that blocks <code>lookup_order</code> and <code>process_refund</code> until <code>get_customer</code> has returned a verified customer ID.`,`Enhance the system prompt to state verification is mandatory before order operations.`,`Add few-shot examples showing the agent always calling <code>get_customer</code> first.`,`Implement a routing classifier that enables only a subset of tools per request type.`],
     correct:0, why:`When a tool sequence is required for critical business logic, programmatic enforcement gives deterministic guarantees that prompt-based approaches can't.`,
     traps:{B:`Relies on probabilistic compliance &mdash; insufficient when errors have financial consequences.`,C:`Same problem: still probabilistic.`,D:`Addresses tool availability, not tool ordering &mdash; the wrong problem.`}},
    {q:`You must ensure identity verification happens before any financial operation, every time. Best implementation?`,
     options:[`A programmatic prerequisite gate that blocks financial tools until verification has completed.`,`Tell the agent in the prompt to always verify first.`,`Order the tools so verification appears first in the array.`,`Trust the model to remember.`],
     correct:0, why:`Prerequisite gates deterministically block downstream calls until the prerequisite returns.`,
     traps:{B:`Prompt instructions have a non-zero failure rate.`,C:`Array order doesn't enforce call order.`,D:`Relying on memory isn't enforcement.`}},
    {q:`Why is a system-prompt rule like "always verify identity before refunds" insufficient for a financial workflow?`,
     options:[`Prompt instructions have a non-zero failure rate; financial guarantees need deterministic enforcement.`,`Prompts are too short to hold rules.`,`The model can't read system prompts.`,`It works fine and needs nothing else.`],
     correct:0, why:`When errors have financial consequences, the probabilistic nature of prompt compliance is the gap a gate closes.`,
     traps:{B:`Length isn't the issue.`,C:`The model does read system prompts.`,D:`Probabilistic compliance is exactly the risk.`}},
    {q:`A customer message says: "My order is late, I think I was charged twice, and I want to update my email." Best way to handle this multi-concern request?`,
     options:[`Decompose it into distinct items, investigate each in parallel using shared context, then synthesize one unified resolution.`,`Handle only the first concern and ask them to resubmit the rest.`,`Treat the whole message as a single refund request.`,`Pick whichever concern is easiest and ignore the others.`],
     correct:0, why:`Decomposing multi-concern requests into distinct items investigated in parallel (with shared context) and synthesized into one resolution is the prescribed pattern.`,
     traps:{B:`Forcing resubmission is poor service and loses context.`,C:`Collapsing three concerns into one mishandles two of them.`,D:`Cherry-picking leaves real issues unresolved.`}},
    {q:`Your agent escalates a billing dispute to a human who has no access to the conversation transcript. What should the handoff contain?`,
     options:[`A structured summary: customer ID, root cause analysis, refund amount, and recommended action.`,`A short "escalating, please help" note.`,`The entire raw transcript pasted in.`,`Only the customer's last message.`],
     correct:0, why:`A structured handoff summary gives the human exactly what they need to act without the transcript.`,
     traps:{B:`No context means restarting from zero.`,C:`A raw dump is unstructured and slow.`,D:`One message lacks root cause and recommendation.`}},
    {q:`A teammate proposes putting the verification tool first in the <code>tools</code> array to "force" it to run before refunds. Why won't this work?`,
     options:[`Array position doesn't enforce call order; the model can still call the refund tool first. Only a gate blocks the downstream call.`,`Arrays can only hold one tool.`,`The model always calls tools in reverse array order.`,`It works perfectly and needs nothing else.`],
     correct:0, why:`Tool array order is not an ordering mechanism; deterministic ordering comes from a prerequisite gate.`,
     traps:{B:`Arrays hold many tools.`,C:`There's no fixed array-order calling rule.`,D:`It leaves a non-zero failure rate.`}},
    {q:`Which class of rule is appropriate to leave to prompt-based guidance rather than a gate?`,
     options:[`Soft guidance like tone and phrasing preferences.`,`Identity verification before issuing money.`,`Blocking refunds above a hard policy limit.`,`Requiring a verified customer ID before account changes.`],
     correct:0, why:`Deterministic enforcement is reserved for must-hold rules (money, identity, irreversible actions); soft guidance like tone is fine in the prompt.`,
     traps:{B:`Identity-before-money is a deterministic requirement.`,C:`A hard limit must be enforced, not suggested.`,D:`A verified-ID prerequisite needs a gate.`}},
    {q:`After a gate blocks an action, the agent retries the identical blocked action in a loop. What's the design fix?`,
     options:[`The gate should redirect to an alternative workflow (e.g., human escalation) rather than dead-ending into a retry loop.`,`Increase the iteration cap so it eventually gives up.`,`Remove the gate so the action goes through.`,`Lower the model temperature.`],
     correct:0, why:`Blocking must redirect to a valid alternative; a silent block that auto-retries loops uselessly.`,
     traps:{B:`A higher cap just loops longer.`,C:`Removing the gate defeats the deterministic requirement.`,D:`Temperature is irrelevant to the block.`}},
    {q:`You decompose a three-concern request and investigate each item. Why investigate them "using shared context" rather than in fully isolated silos?`,
     options:[`The concerns can be related (the double-charge may explain the refund), so shared context lets you synthesize one coherent resolution.`,`Shared context is required by the Task tool.`,`Isolated investigation is impossible.`,`It reduces token usage to zero.`],
     correct:0, why:`Investigating distinct items in parallel against shared context lets the final synthesis account for interactions between concerns.`,
     traps:{B:`The Task tool doesn't mandate shared context.`,C:`Isolation is possible &mdash; it just risks an incoherent result here.`,D:`It doesn't make tokens free.`}},
    {q:`Which is the clearest signal in an exam scenario that a prerequisite gate (not a better prompt) is the answer?`,
     options:[`A stated failure rate ("in N% of cases the required step is skipped") on a money/identity action.`,`The agent occasionally uses a slightly informal tone.`,`The report is missing one optional section.`,`The agent uses more tokens than expected.`],
     correct:0, why:`A measured, non-zero skip rate on a critical step is exactly the deterministic-compliance gap a gate closes.`,
     traps:{B:`Tone is soft guidance, not a deterministic requirement.`,C:`Missing optional content isn't an ordering-enforcement problem.`,D:`Token usage doesn't indicate a compliance gap.`}},
  ]},

/* ===================== TS 1.5 — hooks ===================== */
'hooks':{ domain:'d1', ts:'1.5', title:'Agent SDK hooks: interception & normalization',
  eli5:`<p>Picture a <strong>bouncer</strong> at the door. The model might <em>ask</em> to do something against the rules &mdash; like refund $5,000. A polite sign that says "please don't" will sometimes be ignored. A bouncer who checks <strong>every</strong> request before it happens and blocks the bad ones is a guarantee.</p><p>And a <strong>translator</strong> at the exit: when a tool hands back a result in a weird format, the translator fixes it before the model ever reads it. Hooks are that bouncer and that translator.</p>`,
  real:`<p>Hooks intercept the agent loop at defined points. A <strong>pre-execution / tool-call interception</strong> hook inspects the <em>outgoing</em> tool call before it runs &mdash; use it to enforce compliance rules (block a refund over a threshold) and redirect to an alternative workflow. A <code>PostToolUse</code> hook intercepts the <em>returned result</em> before the model processes it &mdash; use it to transform/normalize data.</p>
  <p>The governing principle is the same one from TS 1.4: hooks give <strong>deterministic</strong> guarantees; prompt instructions are <strong>probabilistic</strong> with a non-zero failure rate. When business rules require guaranteed compliance, choose a hook over a prompt.</p>
  <h4>The two hook roles you'll be tested on</h4>
  <ul>
    <li><strong>PostToolUse &mdash; normalization.</strong> Different MCP tools return heterogeneous formats: Unix epochs, ISO 8601 strings, numeric status codes. A <code>PostToolUse</code> hook normalizes them all into <em>one consistent format</em> before the agent reasons over them. (Also: trim verbose output, redact PII.)</li>
    <li><strong>Pre-execution &mdash; interception.</strong> Block policy-violating actions (e.g., refunds exceeding $500) and redirect to an alternative workflow (human escalation). The block is deterministic; the prompt cannot be.</li>
  </ul>
  <h4>Deterministic vs probabilistic &mdash; the decision rule</h4>
  <ul>
    <li>A rule that must hold <strong>100% of the time</strong> (money, identity, irreversible actions) &rarr; hook/gate.</li>
    <li>Soft guidance and tone &rarr; prompt/few-shot is fine.</li>
  </ul>
  <h4>Edge cases</h4>
  <ul>
    <li><strong>Blocking should never dead-end.</strong> Redirect to escalation or an alternative path, not a silent failure; a blocked action that auto-retries loops uselessly.</li>
    <li><strong>Normalize before redact.</strong> A <code>PostToolUse</code> hook is also the right place to redact PII <em>before</em> the model ever reads the result &mdash; not a prompt asking it to ignore PII.</li>
    <li><strong>Empty result is not an error.</strong> A normalization hook should preserve the distinction between a valid empty result and an access failure.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>Match the hook to the side of the call: transforming/normalizing/redacting a <em>result</em> is <code>PostToolUse</code>; blocking an <em>outgoing</em> action is pre-execution interception. And "must hold 100% of the time" always points to a hook, never to a better prompt, more examples, or lower temperature.</div>`,
  callout:`<b>Two hook jobs</b><code>PostToolUse</code> transforms <em>results</em> (normalize formats, redact PII). Pre-execution interception blocks <em>outgoing</em> calls (refund over $500 &rarr; escalate). Deterministic, where prompts are not.`,
  example:{ label:`Example — PreToolUse gate + PostToolUse normalization (.claude/settings.json)`, body:
`{
  "hooks": {
    "PreToolUse": [
      { "matcher": "process_refund",
        "command": "./hooks/gate_refund.py" }   // exit 2 = block + escalate
    ],
    "PostToolUse": [
      { "matcher": "lookup_order",
        "command": "./hooks/normalize_dates.py" } // -> ISO-8601 every result
    ]
  }
}
# gate_refund.py: reads the outgoing call's input; if amount > 500 -> block,
#   emit a redirect to human escalation (NOT a silent failure).
# normalize_dates.py: maps Unix epoch / ISO / numeric codes -> one ISO-8601
#   shape before the model sees the result. Also redact PII here.` },
  quick:[
    {q:`What does a <code>PostToolUse</code> hook typically do?`,
     options:[`Transform/normalize a tool's result before the model processes it`,`Spawn a subagent`,`Pick which model to call`,`End the session`],
     correct:0, why:`<code>PostToolUse</code> intercepts results for transformation (e.g., data normalization, redaction).`},
    {q:`A business rule must hold 100% of the time. Prompt instruction or hook?`,
     options:[`A programmatic hook / gate`,`A strongly-worded system prompt`,`A few-shot example`,`A larger model`],
     correct:0, why:`Only programmatic enforcement is deterministic; prompts have a non-zero failure rate.`},
    {q:`Which hook blocks an outgoing refund that exceeds a policy threshold?`,
     options:[`A pre-execution tool-call interception hook`,`A <code>PostToolUse</code> hook`,`A session-resume hook`,`No hook &mdash; handle it in the prompt`],
     correct:0, why:`Pre-execution interception inspects the outgoing call and can block/redirect before it runs.`},
  ],
  scenario:[
    {q:`In 12% of cases, your agent skips <code>get_customer</code> and calls <code>lookup_order</code> using only the customer's stated name, sometimes causing misidentified accounts and incorrect refunds. Most effective fix?`,
     options:[`Add a programmatic prerequisite (hook) that blocks <code>lookup_order</code> and <code>process_refund</code> until <code>get_customer</code> has returned a verified customer ID.`,`Enhance the system prompt to state verification is mandatory before order operations.`,`Add few-shot examples showing the agent always calling <code>get_customer</code> first.`,`Implement a routing classifier that enables only a subset of tools per request type.`],
     correct:0, why:`When a tool sequence is required for critical business logic, programmatic enforcement gives deterministic guarantees that prompt-based approaches can't.`,
     traps:{B:`Relies on probabilistic compliance &mdash; insufficient when errors have financial consequences.`,C:`Same problem: still probabilistic.`,D:`Addresses tool availability, not tool ordering &mdash; the wrong problem.`}},
    {q:`Different MCP tools return timestamps as Unix epochs, ISO 8601, and numeric codes, confusing the agent. How do you normalize them before the model processes them?`,
     options:[`A <code>PostToolUse</code> hook that transforms each tool's result into one consistent format.`,`A note in the system prompt asking the model to handle all formats.`,`Pick one tool and ignore the others.`,`Increase <code>max_tokens</code>.`],
     correct:0, why:`<code>PostToolUse</code> hooks intercept results for transformation/normalization before the model sees them.`,
     traps:{B:`Prompt-based handling is unreliable.`,C:`You need all the tools' data.`,D:`Token budget is unrelated.`}},
    {q:`Policy says refunds over $500 require human approval. How do you guarantee the agent can't process them autonomously?`,
     options:[`A tool-call interception hook that blocks refunds above the threshold and redirects to human escalation.`,`A strongly worded system prompt.`,`A few-shot example of refusing big refunds.`,`Lower the model temperature.`],
     correct:0, why:`Interception hooks give deterministic enforcement and can redirect to an alternative workflow.`,
     traps:{B:`Prompts have a non-zero failure rate.`,C:`Examples are probabilistic guidance.`,D:`Temperature doesn't enforce policy.`}},
    {q:`A business rule must hold 100% of the time. Which mechanism do you choose?`,
     options:[`A programmatic hook/gate (deterministic).`,`A detailed system prompt (probabilistic).`,`Few-shot examples.`,`A bigger model.`],
     correct:0, why:`Guaranteed compliance requires programmatic enforcement; prompts can't guarantee it.`,
     traps:{B:`Prompts have a non-zero failure rate.`,C:`Examples don't guarantee behavior.`,D:`Model size doesn't make a rule deterministic.`}},
    {q:`A hook that inspects <em>outgoing</em> tool calls (before they execute) is used to:`,
     options:[`Enforce compliance rules by blocking policy-violating actions before they run.`,`Normalize tool results after they return.`,`Summarize the conversation.`,`Pick which model to call.`],
     correct:0, why:`Pre-execution interception hooks enforce rules on outgoing calls (e.g., blocking refunds over a threshold).`,
     traps:{B:`That's a PostToolUse (results) hook.`,C:`Hooks don't summarize.`,D:`Hooks don't route models.`}},
    {q:`You need to redact PII from a tool's <em>result</em> before the model ever reads it. Which hook?`,
     options:[`A <code>PostToolUse</code> hook (it intercepts results for transformation).`,`A pre-execution tool-call interception hook.`,`No hook &mdash; handle it in the prompt.`,`A session-resume hook.`],
     correct:0, why:`<code>PostToolUse</code> transforms results before the model processes them &mdash; the right place to redact.`,
     traps:{B:`That intercepts the call, not the returned result.`,C:`Prompt-based redaction is unreliable.`,D:`Not a relevant hook type here.`}},
    {q:`When a hook blocks a policy-violating action, what's the best practice beyond just denying it?`,
     options:[`Redirect to an alternative workflow (e.g., human escalation) rather than silently failing.`,`Return an empty success.`,`Crash the agent loop.`,`Retry the same action automatically.`],
     correct:0, why:`Blocking should redirect to an appropriate alternative (like escalation), not dead-end.`,
     traps:{B:`Silent success hides the block.`,C:`Crashing is a poor experience.`,D:`Retrying a blocked action loops uselessly.`}},
    {q:`Why choose a hook over prompt-based enforcement when business rules require guaranteed compliance?`,
     options:[`Hooks are deterministic; prompt instructions are probabilistic with a non-zero failure rate.`,`Hooks use fewer tokens than prompts.`,`Prompts can't mention money.`,`Hooks are the only way to call tools.`],
     correct:0, why:`The deterministic vs probabilistic distinction is exactly why hooks are chosen for guaranteed compliance.`,
     traps:{B:`Token cost isn't the deciding factor.`,C:`Prompts can mention anything; they just can't guarantee.`,D:`Tools are called via the loop, not hooks.`}},
    {q:`Your normalization hook is collapsing valid empty query results into the same shape as access failures, so the agent retries pointlessly. What's the fix?`,
     options:[`Preserve the distinction in the hook: a valid empty result stays a success; an access failure stays an error.`,`Treat everything as an error so the agent always retries.`,`Treat everything as success so the agent never retries.`,`Remove the hook entirely.`],
     correct:0, why:`Normalization must keep empty-but-valid distinct from access-failure so the agent reacts correctly.`,
     traps:{B:`Pointless retries on valid-empty results.`,C:`Masks real access failures.`,D:`Removing the hook loses the format normalization you needed.`}},
    {q:`An engineer wants the model to "always reformat messy tool outputs itself" via a system-prompt instruction. Why prefer a hook?`,
     options:[`A <code>PostToolUse</code> hook normalizes deterministically before the model ever sees the data, removing the per-call variability of prompt-based reformatting.`,`The model can't read tool outputs at all.`,`Prompts can't contain formatting rules.`,`Hooks are required for every tool call.`],
     correct:0, why:`Deterministic normalization belongs in a PostToolUse hook; relying on the model to reformat is probabilistic.`,
     traps:{B:`The model does read tool outputs &mdash; that's the point of normalizing them first.`,C:`Prompts can contain rules; they just aren't guaranteed.`,D:`Hooks are optional, attached where needed.`}},
  ]},

/* ===================== TS 1.6 — decomposition ===================== */
'decomposition':{ domain:'d1', ts:'1.6', title:'Task decomposition strategies',
  eli5:`<p>Two ways to tackle a big job. If you already know the steps, follow a <strong>fixed recipe</strong> &mdash; step 1, then 2, then 3. That's prompt chaining.</p><p>If you <em>don't</em> know the steps yet, <strong>figure it out as you go</strong>, deciding the next step based on what you just found. That's dynamic decomposition. And if you try to do too much in one giant pass, you get sloppy &mdash; like grading 40 essays in one sitting without a break.</p>`,
  real:`<p>The choice is between a <strong>fixed sequential pipeline (prompt chaining)</strong> and <strong>dynamic adaptive decomposition</strong>. Prompt chaining breaks a task into known, repeatable steps &mdash; e.g., analyze each file individually, then run a separate cross-file integration pass. Dynamic decomposition generates subtasks from intermediate findings &mdash; the right tool for open-ended investigation where the steps depend on what you discover.</p>
  <h4>Choosing a strategy</h4>
  <ul>
    <li><strong>Prompt chaining (fixed pipeline)</strong> &mdash; the steps are known in advance and repeat per item. Predictable multi-aspect code review, ETL-style passes.</li>
    <li><strong>Dynamic decomposition</strong> &mdash; the steps depend on what you find. "Add comprehensive tests to a legacy codebase": first <em>map the structure</em>, identify high-impact areas, then create a <em>prioritized plan that adapts</em> as dependencies are discovered.</li>
  </ul>
  <h4>Attention dilution &amp; the integration pass</h4>
  <ul>
    <li>A single pass over many files gives <strong>uneven depth and self-contradiction</strong> &mdash; flagging a pattern in one file, approving identical code in another.</li>
    <li>The fix is structural: <strong>per-file local analysis passes</strong> for consistent depth, plus a <strong>separate cross-file integration pass</strong> for data flow and interactions between files.</li>
    <li>A <strong>bigger context window does NOT cure attention dilution.</strong> More tokens let more text fit; they don't fix the quality drop from asking one pass to do too much. The cure is focused passes, not capacity.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>Don't conflate "more context window" with "better attention." And match the strategy to the task shape: <em>predictable, repeatable</em> &rarr; prompt chaining; <em>open-ended, discovery-driven</em> &rarr; dynamic decomposition. (Session resume/fork lives in TS 1.7 &mdash; see <em>sessions</em>.)</div>`,
  callout:`<b>Match strategy to task shape</b>Predictable multi-aspect work &rarr; prompt chaining (per-file pass + integration pass). Open-ended investigation &rarr; dynamic decomposition (map &rarr; prioritize &rarr; adapt). Attention dilution is fixed structurally, not with a bigger window.`,
  example:{ label:`Example — fixed pipeline vs adaptive decomposition`, body:
`# Prompt chaining (FIXED): same predictable checks per file, then ONE
# cross-file integration pass. Known steps, repeated per item.
for f in changed_files:
    claude -p "Review \${f} for local issues (per-file pass)"
claude -p "Cross-file integration pass over all reviews (data flow, contracts)"

# Dynamic decomposition (ADAPTIVE) for an open-ended task:
#   "add comprehensive tests to this legacy codebase"
#   1) map structure  2) rank high-impact areas
#   3) build a prioritized plan that ADAPTS as dependencies surface
plan = claude -p "Map module structure; list high-impact untested areas"
# subsequent subtasks are generated from what step 1 discovered, not fixed up front.` },
  quick:[
    {q:`A predictable multi-aspect code review (same checks on every file) is best handled by:`,
     options:[`Prompt chaining / fixed sequential passes`,`Dynamic adaptive decomposition`,`A single giant prompt over all files`,`The Batch API`],
     correct:0, why:`Predictable, repeatable structure suits prompt chaining; dynamic decomposition is for open-ended investigation.`},
    {q:`"Add comprehensive tests to a legacy codebase" is best decomposed by:`,
     options:[`Dynamic decomposition: map structure, find high-impact areas, build a prioritized plan that adapts`,`A fixed pipeline written before reading any code`,`One prompt over the whole codebase at once`,`Random file selection`],
     correct:0, why:`Open-ended investigation suits adaptive decomposition that generates subtasks from what it discovers.`},
    {q:`A single-pass review of 14 files gives uneven depth and even contradicts itself. The fix is:`,
     options:[`Per-file passes plus a separate cross-file integration pass`,`A larger-context model so all files fit in one pass`,`Running the same full pass three times and voting`,`Asking developers to submit fewer files`],
     correct:0, why:`Attention dilution is fixed structurally with focused passes; a bigger window doesn't cure it.`},
  ],
  scenario:[
    {q:`A PR modifies 14 files. Your single-pass review gives detailed feedback on some files, superficial on others, misses obvious bugs, and even contradicts itself &mdash; flagging a pattern in one file while approving identical code in another. How should you restructure?`,
     options:[`Split into focused passes: analyze each file individually for local issues, then a separate integration pass for cross-file data flow.`,`Require developers to split large PRs into 3-4 file submissions.`,`Switch to a larger-context model to fit all 14 files in one pass.`,`Run three full-PR passes and only flag issues appearing in at least two.`],
     correct:0, why:`The root cause is attention dilution across many files. File-by-file passes give consistent depth; a separate integration pass catches cross-file issues.`,
     traps:{B:`Shifts burden to developers without fixing the system.`,C:`Larger context windows don't fix attention-quality dilution.`,D:`Consensus voting suppresses real bugs that are caught intermittently.`}},
    {q:`You're asked to "add comprehensive tests to a legacy codebase" &mdash; an open-ended task. Best decomposition strategy?`,
     options:[`Dynamic decomposition: map the structure, identify high-impact areas, then build a prioritized plan that adapts as dependencies are discovered.`,`A fixed pipeline written before looking at the code.`,`One giant prompt covering the whole codebase at once.`,`Random file selection until coverage feels enough.`],
     correct:0, why:`Open-ended investigation suits adaptive decomposition that generates subtasks from what's discovered.`,
     traps:{B:`A fixed pipeline can't anticipate an unknown codebase.`,C:`One pass over everything dilutes attention.`,D:`Random selection isn't a strategy.`}},
    {q:`You're reviewing many files with the same predictable set of checks per file. Which decomposition fits?`,
     options:[`Prompt chaining: a fixed sequential pipeline (per-file analysis, then a cross-file pass).`,`Dynamic decomposition driven by discoveries.`,`A single prompt over all files together.`,`The Message Batches API with tool calling.`],
     correct:0, why:`Predictable, repeatable multi-aspect work suits a fixed chained pipeline.`,
     traps:{B:`Dynamic is for open-ended investigation.`,C:`All-at-once dilutes attention.`,D:`Batch doesn't do multi-turn tool calling.`}},
    {q:`Why split a large review into per-file passes plus a separate integration pass, rather than one big pass?`,
     options:[`To avoid attention dilution &mdash; one combined pass gives uneven depth and contradictory findings.`,`To use more tokens.`,`Because single passes are not allowed.`,`To force the batch API.`],
     correct:0, why:`Focused passes prevent attention dilution; a separate integration pass catches cross-file issues.`,
     traps:{B:`Token use isn't the goal.`,C:`Single passes are allowed &mdash; just less reliable here.`,D:`Batch is unrelated.`}},
    {q:`An engineer insists the contradictory multi-file review will be fixed by switching to a model with a much larger context window. Why is this wrong?`,
     options:[`A larger window lets more text fit but doesn't cure attention dilution; the quality fix is structural (focused passes).`,`Larger windows always degrade accuracy.`,`The window size is already maxed out.`,`Bigger models can't review code.`],
     correct:0, why:`Capacity (window size) and attention quality are different; dilution is solved by decomposing into focused passes.`,
     traps:{B:`Larger windows don't inherently degrade accuracy &mdash; they just don't fix dilution.`,C:`The premise isn't about hitting a window limit.`,D:`Bigger models can review code; that's not the issue.`}},
    {q:`A task has clearly known, repeatable sub-steps that apply identically to every item. Which is the over-engineered choice to avoid?`,
     options:[`Dynamic adaptive decomposition, which adds needless planning overhead for a predictable pipeline.`,`Prompt chaining, which fits the predictable structure.`,`A per-item pass followed by an integration pass.`,`Running the fixed steps in sequence.`],
     correct:0, why:`When steps are known and repeatable, prompt chaining fits; dynamic decomposition's adaptive planning is unnecessary overhead.`,
     traps:{B:`Prompt chaining is the correct fit, not the thing to avoid.`,C:`That's a sound chaining structure.`,D:`Running fixed steps is exactly the pipeline.`}},
    {q:`In a dynamic-decomposition investigation, where do the later subtasks come from?`,
     options:[`They're generated from the intermediate findings discovered at each step.`,`They're all fully specified before any work starts.`,`They're chosen at random from a fixed list.`,`They come from the system prompt only.`],
     correct:0, why:`Dynamic decomposition's value is generating subtasks adaptively based on what each step reveals.`,
     traps:{B:`Pre-specifying everything is the fixed-pipeline approach.`,C:`Random selection isn't adaptive planning.`,D:`The system prompt doesn't enumerate discovered subtasks.`}},
    {q:`What is the purpose of the separate cross-file integration pass after per-file reviews?`,
     options:[`To catch issues that only appear across files &mdash; data flow, shared contracts, interactions the per-file passes can't see.`,`To re-check each file in isolation a second time.`,`To reduce the number of tokens used.`,`To force the model to vote on findings.`],
     correct:0, why:`Per-file passes catch local issues; the integration pass exists for cross-file data flow and interactions.`,
     traps:{B:`That just repeats the local pass.`,C:`It's about coverage, not token reduction.`,D:`No voting is involved.`}},
    {q:`For an open-ended legacy-test task, an engineer writes a rigid 8-step pipeline up front. What's the risk?`,
     options:[`A fixed pipeline can't adapt to dependencies and high-impact areas that only surface once you map the actual code.`,`Fixed pipelines always run slower.`,`The pipeline will exceed the context window.`,`Fixed pipelines can't call tools.`],
     correct:0, why:`Open-ended tasks need a plan that adapts as structure and dependencies are discovered; a pre-written rigid pipeline misses them.`,
     traps:{B:`Speed isn't the core risk.`,C:`Window size isn't the stated problem.`,D:`Fixed pipelines can call tools.`}},
    {q:`Which pairing of task-to-strategy is correct?`,
     options:[`Predictable, repeatable multi-aspect review &rarr; prompt chaining; open-ended discovery task &rarr; dynamic decomposition.`,`Predictable review &rarr; dynamic decomposition; open-ended task &rarr; prompt chaining.`,`Both task types &rarr; one giant single pass.`,`Both task types &rarr; the Batch API.`],
     correct:0, why:`Strategy follows task shape: chaining for predictable pipelines, dynamic decomposition for open-ended investigation.`,
     traps:{B:`That inverts the correct mapping.`,C:`A single giant pass dilutes attention for both.`,D:`Batch is unrelated to decomposition strategy.`}},
  ]},

/* ===================== TS 1.7 — sessions (NEW) ===================== */
'sessions':{ domain:'d1', ts:'1.7', title:'Session state, resumption & forking',
  eli5:`<p>You can <strong>save your place</strong> in a long investigation and come back to it later by name &mdash; like a bookmark. You can also <strong>branch off</strong> from a saved point to try two different ideas side by side, both starting from the same place you'd already figured out.</p><p>But beware: if the book changed since you bookmarked it, your old notes might be wrong. Sometimes it's safer to start a fresh page with a quick summary than to pick up stale notes.</p>`,
  real:`<p>Session management lets agentic work span time and branch. <code>--resume &lt;session-name&gt;</code> continues a <em>specific named</em> prior conversation, carrying its context forward. <code>fork_session</code> creates an <strong>independent branch from a shared analysis baseline</strong>, so you can explore divergent approaches in parallel without re-doing the shared groundwork.</p>
  <h4>Resume vs fork vs fresh &mdash; the decision</h4>
  <ul>
    <li><code>--resume &lt;name&gt;</code> &mdash; continue a specific named investigation across work sessions, <strong>when its prior context is still mostly valid</strong>.</li>
    <li><code>fork_session</code> &mdash; branch from a shared baseline to compare divergent approaches (e.g., two testing strategies, or two refactoring approaches) from the same codebase analysis.</li>
    <li><strong>Fresh session + injected summary</strong> &mdash; when prior <em>tool results are stale</em> (the code changed substantially), resuming carries forward wrong reasoning. Starting a new session with a <strong>structured summary</strong> is <em>more reliable</em> than resuming with stale tool results.</li>
  </ul>
  <h4>Handling changes to previously analyzed files</h4>
  <ul>
    <li>When you resume after modifying files, you must <strong>inform the agent about the changes</strong> &mdash; otherwise it reasons over a stale picture.</li>
    <li>If only a few files changed, tell the resumed session <em>which</em> files so it does <strong>targeted re-analysis</strong> rather than full re-exploration. This is the efficiency sweet spot when prior context is mostly valid but partially out of date.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>The decision hinges on <em>how stale the prior tool results are</em>. Mostly valid &rarr; resume (and name the changed files for targeted re-analysis). Substantially stale &rarr; fresh session + structured summary, NOT resume. Comparing divergent approaches from one baseline &rarr; <code>fork_session</code>. Don't reach for a bigger <code>max_tokens</code> &mdash; staleness isn't a capacity problem.</div>`,
  callout:`<b>Stale results? Start fresh.</b>Resume when prior context is mostly valid (name changed files for targeted re-analysis). Fork to branch divergent approaches from one baseline. When tool results are substantially stale, a fresh session + injected summary beats resuming.`,
  example:{ label:`Example — resume vs fork vs fresh`, body:
`# Resume a SPECIFIC named investigation (prior context still valid):
claude --resume billing-investigation

# On resume after edits, tell it WHICH files changed -> targeted re-analysis,
# not a full re-exploration:
claude --resume billing-investigation \\
  -p "I changed src/refund.py and src/auth.py. Re-analyze only those."

# Fork from a shared analysis baseline to compare divergent approaches:
#   branch A explores strategy-1, branch B explores strategy-2, same baseline.
fork_session(from="codebase-analysis", name="refactor-approach-A")
fork_session(from="codebase-analysis", name="refactor-approach-B")

# Tool results substantially STALE (code changed a lot)? Don't resume.
# Start fresh with a structured summary instead:
claude -p "Fresh start. Summary of prior findings: <structured summary>. Re-investigate."` },
  quick:[
    {q:`Which command continues a specific named prior investigation?`,
     options:[`<code>--resume &lt;session-name&gt;</code>`,`<code>fork_session</code>`,`<code>/compact</code>`,`<code>/memory</code>`],
     correct:0, why:`Named session resumption with <code>--resume &lt;name&gt;</code> continues a specific prior conversation.`},
    {q:`You want to compare two refactoring approaches from one shared codebase analysis. Use:`,
     options:[`<code>fork_session</code> to create parallel branches from the baseline`,`<code>--resume</code> the same session twice`,`A new unrelated session each time`,`<code>/compact</code>`],
     correct:0, why:`<code>fork_session</code> branches from a shared baseline to explore divergent approaches.`},
    {q:`Prior tool results are substantially stale because the code changed a lot. Best move?`,
     options:[`Start a fresh session with a structured summary injected`,`Resume anyway; stale results are fine`,`Fork the stale session`,`Raise <code>max_tokens</code> and resume`],
     correct:0, why:`When prior tool results are stale, a fresh session with an injected summary is more reliable than resuming.`},
  ],
  scenario:[
    {q:`You want to compare two refactoring approaches starting from the same codebase analysis. Which mechanism?`,
     options:[`<code>fork_session</code> to create parallel branches from a shared baseline.`,`<code>--resume</code> the same session twice in a row.`,`A brand-new session for each, with no shared analysis.`,`<code>/compact</code>.`],
     correct:0, why:`<code>fork_session</code> branches from a shared baseline to explore divergent approaches.`,
     traps:{B:`Resuming the same session doesn't branch.`,C:`Fresh sessions lose the shared analysis.`,D:`<code>/compact</code> trims context, it doesn't branch.`}},
    {q:`You want to continue a specific prior investigation by name across work sessions. Which command?`,
     options:[`<code>--resume &lt;session-name&gt;</code>.`,`<code>fork_session</code>.`,`<code>/compact</code>.`,`<code>/memory</code>.`],
     correct:0, why:`Named session resumption with <code>--resume &lt;name&gt;</code> continues a specific prior conversation.`,
     traps:{B:`Forking branches; it doesn't continue the same line.`,C:`<code>/compact</code> reduces context usage.`,D:`<code>/memory</code> shows loaded memory files.`}},
    {q:`You resume a session, but you modified several analyzed files since. What should you do for reliable results?`,
     options:[`Inform the agent which specific files changed so it does targeted re-analysis rather than full re-exploration.`,`Say nothing and assume it re-reads everything.`,`Restart from scratch every time.`,`Disable resumption entirely.`],
     correct:0, why:`Telling a resumed session about specific file changes enables efficient, targeted re-analysis.`,
     traps:{B:`Stale tool results lead to wrong answers.`,C:`Full restart wastes prior context.`,D:`Resumption is still valuable when context is mostly valid.`}},
    {q:`You're resuming work, but the prior session's tool results are now stale (the code changed substantially). Better than resuming?`,
     options:[`Start a fresh session with a structured summary injected &mdash; more reliable than resuming with stale tool results.`,`Resume anyway; stale results are fine.`,`Fork the stale session.`,`Increase <code>max_tokens</code> and resume.`],
     correct:0, why:`When prior tool results are stale, a fresh session with an injected summary beats resuming.`,
     traps:{B:`Stale results produce wrong reasoning.`,C:`Forking carries the stale baseline forward.`,D:`Token budget doesn't fix staleness.`}},
    {q:`You simply want to continue yesterday's investigation, and nothing has changed since. Resume or fork?`,
     options:[`Resume &mdash; prior context is mostly valid, so continue the same session.`,`Fork &mdash; always branch to be safe.`,`Start fresh with no context.`,`Use the Batches API.`],
     correct:0, why:`When prior context is valid, resumption is the right choice; forking is for divergent exploration.`,
     traps:{B:`Forking is unnecessary when you just want to continue.`,C:`A fresh session discards valid context.`,D:`Batch is unrelated.`}},
    {q:`You want to test two competing testing strategies against the same codebase analysis you already completed. Why use <code>fork_session</code> rather than two fresh sessions?`,
     options:[`Forking branches both from the shared baseline, so neither has to re-do the codebase analysis.`,`Fresh sessions are forbidden for this.`,`Forking is the only way to run anything in parallel.`,`Fresh sessions can't call tools.`],
     correct:0, why:`Fork-based session management explores divergent approaches from a shared baseline without repeating the shared groundwork.`,
     traps:{B:`Fresh sessions are allowed &mdash; they'd just redo the analysis.`,C:`Parallelism has other mechanisms too (e.g., Task calls).`,D:`Fresh sessions can call tools.`}},
    {q:`Only two files changed since your last analysis, and the rest of the prior context is still valid. Most efficient approach?`,
     options:[`Resume the named session and tell it exactly which two files changed for targeted re-analysis.`,`Start a completely fresh session and re-explore everything.`,`Fork the session into two branches.`,`Resume but say nothing about the changes.`],
     correct:0, why:`When context is mostly valid, resume and name the changed files so re-analysis is targeted rather than full.`,
     traps:{B:`Full re-exploration is wasteful when most context is still valid.`,C:`Forking is for divergent approaches, not a small update.`,D:`Not informing it leaves it reasoning over stale results for those files.`}},
    {q:`Why is "start fresh with a structured summary" more reliable than "resume" when prior tool results are stale?`,
     options:[`Resuming carries stale tool results forward as if still true, so the agent reasons over a wrong picture; a fresh session + summary gives it only the still-valid facts.`,`Fresh sessions are always faster.`,`Resume is deprecated.`,`A summary uses more tokens, which improves accuracy.`],
     correct:0, why:`Stale tool results poison resumed reasoning; an injected structured summary supplies only the valid state.`,
     traps:{B:`Speed isn't the reason.`,C:`Resume isn't deprecated &mdash; it's just wrong when results are stale.`,D:`More tokens don't inherently improve accuracy.`}},
    {q:`A teammate tries to fix stale-context errors after a big refactor by raising <code>max_tokens</code> and resuming. Why does this fail?`,
     options:[`Staleness is a correctness problem, not a capacity problem; more tokens just carry more wrong context forward. Start fresh with a summary instead.`,`<code>max_tokens</code> can't be changed on resume.`,`Forking would have fixed it automatically.`,`The session is too old to resume.`],
     correct:0, why:`Token budget doesn't address stale tool results; the fix is a fresh session with a structured summary.`,
     traps:{B:`You can set <code>max_tokens</code>; it just doesn't help.`,C:`Forking would carry the stale baseline forward too.`,D:`Age isn't the issue &mdash; staleness of results is.`}},
    {q:`Which scenario is the textbook case for <code>fork_session</code> rather than resume or fresh-start?`,
     options:[`Exploring two divergent approaches in parallel, both starting from one shared analysis baseline.`,`Continuing a single line of investigation where nothing has changed.`,`Recovering after the analyzed code was rewritten from scratch.`,`Reducing the token usage of one long conversation.`],
     correct:0, why:`Forking exists to branch divergent approaches from a shared baseline; the other cases call for resume, fresh-start, or compaction.`,
     traps:{B:`That's a plain resume.`,C:`A full rewrite calls for a fresh session + summary.`,D:`Token reduction is compaction, not forking.`}},
  ]},

};
