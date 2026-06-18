/* Domain 5 — Context Management & Reliability
   Chapters (order): context-preservation, escalation, error-propagation,
   codebase-context, human-review, provenance. */

export const D5 = {

/* ============================================================= 5.1 */
'context-preservation':{ domain:'d5', ts:'5.1', title:`Preserving conversation context`,
  eli5:`<p>In a long chat, important numbers get blurred into "some refund." Keep a <strong>sticky-note of the hard facts</strong> — exact amounts, dates, order IDs, statuses — and re-show it every turn so nothing gets lost. And remember: the model reads the <strong>start and end</strong> of a long input carefully but skims the <strong>middle</strong>.</p>`,
  real:`<p>Over long interactions two distinct failure modes erode the facts you need, and each has a different fix.</p>
  <h4>Failure mode 1 — progressive summarization drift</h4>
  <ul>
    <li>Condensing the conversation into prose blurs <strong>numerical values, percentages, dates, and customer-stated expectations</strong> ("a refund on the customer's order" instead of "$347.50 refund on order #88231, promised by 2026-06-18").</li>
    <li>Fix: extract transactional facts (amounts, dates, order numbers, statuses) into a persistent <strong>"case facts" block</strong> that is re-included in <em>every</em> prompt, <strong>outside</strong> the summarized history. For multi-issue sessions, persist structured issue data (order IDs, amounts, statuses) into a separate context layer so issues don't bleed together.</li>
    <li>"Summarize more aggressively" makes drift <em>worse</em>; the answer is structure, not more or less prose.</li>
  </ul>
  <h4>Failure mode 2 — "lost in the middle"</h4>
  <ul>
    <li>Models reliably process information at the <strong>beginning and end</strong> of a long input but may omit findings buried in the <strong>middle</strong>.</li>
    <li>Fix: place key-findings summaries at the <strong>top</strong> of aggregated inputs and organize details under <strong>explicit section headers</strong> so position effects don't drop the middle.</li>
  </ul>
  <h4>Keep the window lean &amp; coherent</h4>
  <ul>
    <li>Tool results accumulate disproportionately to their relevance — a single order lookup can return <strong>40+ fields when only 5 matter</strong>. Trim verbose tool outputs to the relevant fields <em>before</em> they pile up in context.</li>
    <li>Pass <strong>complete conversation history</strong> in each subsequent API request — the API is stateless, so omitting prior turns breaks conversational coherence. (Trim tool noise, not the dialogue itself.)</li>
  </ul>
  <div class="edge"><b>Exam trap</b>The fix for summarization drift is a structured facts block re-sent verbatim — <em>not</em> "summarize harder" (blurs the numbers) and <em>not</em> "resend the entire raw transcript every turn" (blows the budget and buries facts in the middle). Trimming applies to verbose <em>tool outputs</em>, never to the conversation history needed for coherence.</div>`,
  callout:`<b>TWO LAYERS</b> Summarized prose history is lossy; the "case facts" block sits outside it, re-sent verbatim every turn.`,
  example:{ label:`Example — persistent case-facts block`, body:
`# re-sent verbatim every turn, OUTSIDE the summarized history, near the TOP
CASE FACTS (do not summarize):
- order #A-4471   refund $129.99   status: APPROVED
- customer_id: 88213
- promised callback: 2026-06-18

[ KEY FINDINGS SUMMARY -- placed at top to beat "lost in the middle" ]
...

[ === detailed history below, under explicit section headers === ]
[ summarized conversation history... ]` },
  fresh:`<ul><li><strong>Server-side compaction</strong> — a new beta (compaction-2025-05-06) auto-summarizes older turns server-side on Opus 4.6+, Sonnet 4.6, and Fable 5, so the window stays lean without you rebuilding history each turn. <a href="https://platform.claude.com/docs/en/build-with-claude/context-windows">docs</a></li><li><strong>Context-editing API</strong> — a new beta (context-management-2025-06-27) lets clear_tool_uses_20250919 strip the oldest tool results to a placeholder and clear_thinking_20251015 manage thinking blocks, applied server-side while the client keeps full history; responses return applied_edits token counts. <a href="https://platform.claude.com/docs/en/build-with-claude/context-editing">docs</a></li><li><strong>Memory tool</strong> — a file-based store outside the window that survives compaction; combined with context-editing it gave ~39% on agentic search and cut tokens ~84% in a 100-turn eval, complementing the exam's "case-facts block" pattern. <a href="https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool">docs</a></li><li><strong>1M-token window</strong> — exam guide assumes 200k; current docs: Opus 4.6+, Sonnet 4.6, and Fable 5 offer a 1M-token context window (other models stay at 200k), so "lost in the middle" applies over a far larger span. <a href="https://platform.claude.com/docs/en/build-with-claude/context-windows">docs</a></li><li><strong>Context awareness</strong> — models now receive a &lt;budget&gt; token count and post-tool &lt;system_warning&gt; updates so they can self-manage remaining space. <a href="https://platform.claude.com/docs/en/build-with-claude/context-windows">docs</a></li></ul>`,
  quick:[
    {q:`Which part of a long input do models process least reliably?`,
     options:[`The beginning`,`The middle`,`The end`,`All equally`],
     correct:1, why:`The "lost in the middle" effect: start and end are reliable; the middle gets skimmed or dropped.`},
    {q:`An order lookup returns 40 fields but only 5 are relevant. Best practice?`,
     options:[`Keep all 40 in context for completeness`,`Trim to the relevant fields before they accumulate`,`Summarize them into vague prose`,`Drop the tool entirely`],
     correct:1, why:`Trim verbose tool outputs to the relevant fields so context stays lean and on-point.`},
    {q:`Why pass the complete conversation history in each subsequent API request?`,
     options:[`To increase token spend`,`The API is stateless, so prior turns are needed to maintain conversational coherence`,`To trigger summarization`,`It is optional and rarely matters`],
     correct:1, why:`The Messages API is stateless; full history each turn preserves coherence. (Trim tool noise, not the dialogue.)`},
  ],
  scenario:[
    {q:`In a long multi-issue support conversation, the agent starts losing exact refund amounts and order numbers as history gets summarized. Best fix?`,
     options:[`Extract the hard facts (amounts, dates, order IDs, statuses) into a persistent "case facts" block included in every prompt, outside the summarized history.`,`Summarize more aggressively to save tokens.`,`Rely on the model to remember from earlier turns.`,`Disable summarization and send the entire raw transcript every time.`],
     correct:0, why:`A persistent structured facts block keeps precise transactional values intact regardless of how prose history is summarized.`,
     traps:{B:`More summarization blurs the very numbers you need.`,C:`Long-context recall of specific values is exactly what fails.`,D:`Raw transcripts blow the budget and bury facts in the middle.`}},
    {q:`Over a 40-turn chat, summarization has blurred "$347.50 refund on order #88231" into "a refund on the customer's order." What design keeps the exact values intact?`,
     options:[`A persistent "case facts" block (amounts, order IDs, statuses) kept outside summarized history and re-included every prompt`,`Summarize more aggressively so important facts rise to the top`,`Lower the temperature so the model recalls numbers more precisely`,`Trust the model to reconstruct the numbers from the conversation`],
     correct:0, why:`A structured facts block outside summarized prose preserves precise values no matter how history is compressed.`,
     traps:{B:`More summarization blurs the numbers you need to keep.`,C:`Temperature can't restore information summarization already dropped.`,D:`Reconstructing exact values from blurred history is exactly what fails.`}},
    {q:`A 30,000-token transcript has critical account details buried in the middle, and the agent keeps overlooking them. Best fix for the "lost in the middle" effect?`,
     options:[`Move the key facts and a findings summary to the top (and end), with explicit section headers`,`Add more detail to the middle so it stands out`,`Increase max_tokens so the whole transcript fits`,`Re-order the transcript randomly each turn`],
     correct:0, why:`Models read start and end most reliably; placing key facts there with headers counters the middle being skimmed.`,
     traps:{B:`Adding bulk keeps the facts in the least-reliable region.`,C:`Fitting more tokens doesn't change where the model attends.`,D:`Random ordering doesn't guarantee facts land in a reliable position.`}},
    {q:`Every order lookup returns 40 fields but only 5 matter, and context is filling up. Best practice?`,
     options:[`Trim each tool output to the relevant fields before it accumulates in history`,`Keep all 40 fields for completeness in case they're needed later`,`Summarize the 40 fields into a vague prose sentence`,`Stop calling the order-lookup tool entirely`],
     correct:0, why:`Trimming verbose tool outputs to relevant fields keeps context lean and on-point.`,
     traps:{B:`Hoarding 35 irrelevant fields per call is what bloats and degrades context.`,C:`Vague prose loses the precise field values you may still need.`,D:`Dropping the tool loses the 5 fields that do matter.`}},
    {q:`A multi-issue session tracks three separate disputes, and the agent keeps mixing up which amount belongs to which order. Most robust design?`,
     options:[`Persist structured issue data (order ID, amount, status) per issue in a separate context layer, re-included each turn`,`Tell the model to "keep the issues straight"`,`Summarize all three issues into one paragraph`,`Handle only one issue at a time and drop the others`],
     correct:0, why:`A structured per-issue context layer keeps each issue's facts distinct rather than relying on prose to keep them apart.`,
     traps:{B:`Instructions don't substitute for structured separation under long context.`,C:`One paragraph is exactly where the issues blur together.`,D:`Dropping issues loses real work the customer is waiting on.`}},
    {q:`A subagent feeds findings to a synthesis agent with a limited context budget, but it returns verbose reasoning chains and full article text. Best change?`,
     options:[`Have the subagent return structured data — key facts, citations, relevance scores — instead of verbose content and reasoning`,`Increase the synthesis agent's max_tokens and keep the verbose output`,`Have the synthesis agent summarize the verbose output itself`,`Drop the relevance scores to save space`],
     correct:0, why:`When downstream context is tight, return structured key facts/citations/scores rather than verbose prose so the budget is spent on signal.`,
     traps:{B:`A bigger window still wastes budget on low-relevance verbosity.`,C:`Re-summarizing downstream burns budget and can re-introduce drift.`,D:`Relevance scores are signal that helps prioritize, not noise to cut.`}},
    {q:`You want downstream synthesis to interpret subagent findings correctly. What metadata should subagents be required to include in their structured output?`,
     options:[`Dates, source locations, and methodological context alongside each finding`,`Only the final claim, to keep outputs short`,`The subagent's full chain-of-thought`,`A confidence emoji per finding`],
     correct:0, why:`Requiring dates, source locations, and methodological context lets downstream synthesis combine findings accurately.`,
     traps:{B:`Stripping metadata is exactly what breaks accurate downstream synthesis.`,C:`A raw reasoning dump bloats context without the decision-relevant metadata.`,D:`An emoji isn't calibrated or sourced metadata.`}},
    {q:`The team's instinct is to "summarize more aggressively" whenever context gets tight. Why is that the wrong reflex for preserving transactional facts?`,
     options:[`Aggressive summarization condenses exact numbers, dates, and stated expectations into vague prose — losing the very facts you need`,`Summarization is too slow to run each turn`,`Summaries always exceed the context window`,`Summaries can't be placed at the top of the input`],
     correct:0, why:`Progressive summarization blurs precise values; the fix is a structured facts block outside the summary, not more compression.`,
     traps:{B:`Latency isn't the objection; the lossiness is.`,C:`Summaries are shorter, not longer, than the source.`,D:`Summaries can be placed anywhere; placement isn't the issue.`}},
    {q:`Which input organization best mitigates position effects when aggregating many sections of results?`,
     options:[`A key-findings summary at the top, then detailed results under explicit section headers`,`A single unbroken block of prose with no headers`,`The least important material first to "warm up" the model`,`Findings sorted alphabetically with no summary`],
     correct:0, why:`A top summary plus explicit section headers places key signal where the model attends and structures the rest.`,
     traps:{B:`An unbroken block buries findings in the skimmed middle.`,C:`"Warming up" wastes the reliable opening on low-value text.`,D:`Alphabetical order ignores where the model actually attends.`}},
    {q:`Across a long conversation, which content is safe to trim and which must be preserved?`,
     options:[`Trim verbose tool-output fields that aren't relevant; preserve the conversation history needed for coherence and the case-facts block`,`Trim the conversation history; keep all 40 tool fields`,`Trim everything older than the last turn`,`Trim the case-facts block once it's been shown once`],
     correct:0, why:`Tool noise is the safe thing to trim; the dialogue (for coherence) and the case-facts block (for precise values) must persist.`,
     traps:{B:`Dropping history breaks coherence while hoarding tool noise bloats context — backwards.`,C:`Trimming all older turns discards context the model still needs.`,D:`The case-facts block must be re-sent every turn, not shown once.`}},
  ]},

/* ============================================================= 5.2 */
'escalation':{ domain:'d5', ts:'5.2', title:`Escalation & ambiguity resolution`,
  eli5:`<p>Hand off to a human when the customer <strong>asks</strong> for one, when the rulebook <strong>doesn't cover</strong> their case, or when you're genuinely <strong>stuck</strong> — not just because they sound annoyed or you "feel unsure." When a lookup returns two people with the same name, <strong>ask for another ID</strong> instead of guessing.</p>`,
  real:`<p>Escalation is about <em>when</em> to hand off and <em>how</em> to resolve ambiguity — and the exam tests sound triggers against tempting-but-unreliable proxies.</p>
  <h4>Three valid escalation triggers</h4>
  <ul>
    <li><strong>Explicit human request</strong> — honor it <em>immediately</em>, no investigation first. Distinguish this from a straightforward issue you can simply offer to resolve.</li>
    <li><strong>Policy gap / exception</strong> — not just "complex" cases, but cases the policy is silent or ambiguous on (e.g., the policy covers own-site price adjustments but says nothing about competitor price matching).</li>
    <li><strong>Inability to make meaningful progress</strong> — genuinely stuck after legitimate attempts.</li>
  </ul>
  <h4>Unreliable proxies (the exam loves these)</h4>
  <ul>
    <li><strong>Sentiment</strong> — negative tone doesn't correlate with case complexity; a frustrated customer may have a simple, in-scope issue.</li>
    <li><strong>Self-reported confidence</strong> — poorly calibrated; the agent is often <em>confidently wrong</em> on the hardest cases, so a 1-10 threshold is not a sound router.</li>
    <li>Calibrate decision boundaries with <strong>explicit criteria + few-shot examples</strong> in the system prompt <em>before</em> reaching for a separate classifier or sentiment model.</li>
  </ul>
  <h4>Resolving ambiguity</h4>
  <ul>
    <li>Acknowledge frustration but <strong>offer resolution</strong> when the issue is within scope; escalate only if the customer reiterates their preference for a human.</li>
    <li>On <strong>multiple customer matches</strong>, ask for an additional identifier rather than a heuristic guess ("first match," "most orders"). Acting on the wrong account is the costly failure.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>When resolution rate is low because the agent miscalibrates escalation, the proportionate first fix is explicit criteria + few-shot examples — <em>not</em> a confidence threshold (already confidently wrong), a trained classifier (over-engineered before prompt work), or sentiment routing (wrong proxy entirely).</div>`,
  callout:`<b>TRIGGERS vs PROXIES</b> Trigger = explicit request / policy gap / can't progress. Proxy (unreliable) = sentiment, self-reported confidence.`,
  example:{ label:`Example — escalation criteria (prompt / skill)`, body:
`Escalate to a human IF:
- the customer explicitly asks for one   -> do it immediately, no triage first
- the policy has no rule for the case    -> a genuine exception/gap
- you cannot make meaningful progress

Do NOT escalate based on tone/sentiment or your own confidence score -
both are poorly calibrated proxies for complexity.

Few-shot:
  user: "match this competitor's price"  (policy only covers own-site)
    -> escalate: policy gap
  user: "I'm furious, but just resend my receipt"  (in scope)
    -> resolve, acknowledge frustration; escalate only if they reiterate
On multiple identity matches: ask for another identifier; never guess.` },
  fresh:`<ul><li><strong>Per-subagent escalation triggers</strong> — an AgentDefinition's permissionMode and maxTurns give hard, configurable limits per subagent, turning "can't make meaningful progress" into an enforced ceiling rather than a judgment call. <a href="https://code.claude.com/docs/en/subagents">docs</a></li><li><strong>Tiered model escalation</strong> — current eval guidance: route most queries to a small model and escalate only uncertain cases to a larger one, an architectural escalation pattern beyond customer-to-human handoff. <a href="https://platform.claude.com/docs/en/test-and-evaluate/eval-tool">docs</a></li><li><strong>No dedicated escalation API</strong> — current docs confirm escalation is still expressed through agent patterns (permissions, turn caps, prompt criteria), consistent with the exam's "explicit criteria + few-shot first" stance. <a href="https://code.claude.com/docs/en/subagents">docs</a></li></ul>`,
  quick:[
    {q:`Is an LLM's self-reported confidence score a reliable escalation trigger?`,
     options:[`Yes, it's well-calibrated`,`No — it's poorly calibrated, often confident on hard cases`,`Only above 0.9`,`Only for refunds`],
     correct:1, why:`Self-reported confidence and sentiment are unreliable proxies for case complexity.`},
    {q:`A customer explicitly demands a human agent. You should:`,
     options:[`Investigate first, then escalate if needed`,`Honor the request and escalate immediately`,`Offer a discount instead`,`Ask three clarifying questions first`],
     correct:1, why:`Explicit human requests are honored immediately without first attempting investigation.`},
    {q:`A name lookup returns three different people. Best move before acting on an account?`,
     options:[`Pick the first match`,`Ask for an additional identifier to disambiguate`,`Pick the account with the most orders`,`Act on all three`],
     correct:1, why:`Multiple matches require clarification — request another identifier rather than guessing.`},
  ],
  scenario:[
    {q:`Your agent hits 55% first-contact resolution (target 80%). Logs show it escalates straightforward cases (standard damage replacements with photo evidence) while trying to autonomously handle policy-exception cases. Most effective way to improve escalation calibration?`,
     options:[`Add explicit escalation criteria to the system prompt with few-shot examples showing when to escalate vs resolve.`,`Have the agent self-report a 1-10 confidence score and route below a threshold to humans.`,`Train a separate classifier on historical tickets to predict escalation.`,`Use sentiment analysis to escalate on negative sentiment.`],
     correct:0, why:`The root cause is unclear decision boundaries; explicit criteria + few-shot is the proportionate first fix before adding infrastructure.`,
     traps:{B:`Self-reported confidence is poorly calibrated — already confidently wrong on hard cases.`,C:`Over-engineered before prompt optimization is tried.`,D:`Sentiment doesn't correlate with case complexity.`}},
    {q:`A customer writes "Just connect me to a human, please" mid-troubleshooting. What should the agent do?`,
     options:[`Honor the explicit request and escalate immediately, without first attempting more investigation`,`Run two more diagnostic steps, then escalate only if they fail`,`Offer a discount to keep the conversation automated`,`Ask three clarifying questions before deciding`],
     correct:0, why:`An explicit human request is honored immediately — a sound trigger with no investigation-first requirement.`,
     traps:{B:`Continuing to investigate ignores the explicit, valid request to escalate.`,C:`A discount neither honors the request nor resolves the issue.`,D:`More questions delay an escalation the customer already asked for.`}},
    {q:`The customer asks the agent to match a competitor's price. The refund policy addresses own-site price adjustments but says nothing about competitor matching. Right move?`,
     options:[`Escalate — the policy is silent on this request, which is a genuine policy gap`,`Apply the own-site adjustment rule as if it covered competitors`,`Deny the request because no rule explicitly allows it`,`Approve it to keep the customer happy`],
     correct:0, why:`A policy gap/exception is a valid trigger; the agent shouldn't improvise a binding decision on a request the rulebook doesn't address.`,
     traps:{B:`Stretching the own-site rule onto a case it doesn't cover risks a wrong, binding outcome.`,C:`A blanket denial on a gap can be just as wrong as a blanket approval.`,D:`Approving to please the customer ignores that the case needs human judgment.`}},
    {q:`Your team proposes routing any ticket where the agent self-reports confidence below 0.7 to a human. Why is this a weak calibration signal?`,
     options:[`Self-reported confidence is poorly calibrated — the agent is often confidently wrong on the hardest cases`,`Confidence scores are accurate but 0.7 is simply the wrong threshold`,`Confidence routing works only for billing tickets`,`Confidence below 0.7 never actually occurs in practice`],
     correct:0, why:`Self-reported confidence is an unreliable proxy; the model is frequently confident on cases it gets wrong.`,
     traps:{B:`No threshold rescues a fundamentally miscalibrated signal.`,C:`The calibration problem isn't limited to one ticket type.`,D:`Low self-reported confidence does occur; the issue is that it's unreliable.`}},
    {q:`An agent escalates whenever a customer's message reads as angry. Why is sentiment a poor escalation trigger?`,
     options:[`Sentiment doesn't correlate with case complexity — a frustrated customer may have a simple, in-scope issue`,`Sentiment analysis is too slow to run per message`,`Angry customers always actually want a refund, not escalation`,`Sentiment scoring isn't available to agents`],
     correct:0, why:`Sentiment is an unreliable proxy for whether a case needs a human; complexity, not tone, should drive escalation.`,
     traps:{B:`Latency isn't the objection; the signal itself is the wrong proxy.`,C:`Tone doesn't reliably indicate what the customer wants.`,D:`Availability isn't the issue; correlation with complexity is.`}},
    {q:`A customer lookup by name returns three different people. What should the agent do before taking any account action?`,
     options:[`Ask for an additional identifier (email, order number) to disambiguate rather than guessing`,`Act on the first match returned`,`Choose the account with the most orders as most likely`,`Proceed on all three accounts to be safe`],
     correct:0, why:`Multiple matches require clarification; requesting another identifier avoids acting on the wrong account.`,
     traps:{B:`First-match is an arbitrary guess that can hit the wrong person.`,C:`"Most orders" is still a guess, not a verified match.`,D:`Acting on all three risks changing unrelated accounts.`}},
    {q:`A customer is frustrated but their request — a standard return within policy — is clearly in scope. Best handling?`,
     options:[`Acknowledge the frustration and resolve the in-scope request; escalate only if they reiterate a demand for a human`,`Escalate immediately because they're upset`,`Ignore the emotion and process the return silently`,`Offer a coupon and close the ticket without processing the return`],
     correct:0, why:`When a request is in scope, acknowledge the emotion and resolve it; escalate only on an explicit, repeated request.`,
     traps:{B:`Frustration alone isn't an escalation trigger when the case is in scope.`,C:`Ignoring the emotion handles the task but not the customer.`,D:`A coupon dodges the actual request the customer made.`}},
    {q:`The agent has tried every available tool and still cannot make progress on a stuck case. Appropriate action?`,
     options:[`Escalate — genuine inability to make meaningful progress is a valid escalation trigger`,`Loop the same tools again hoping for a different result`,`Close the ticket as resolved to protect the resolution rate`,`Fabricate a plausible answer so the customer has something`],
     correct:0, why:`Inability to make progress is one of the three sound triggers; hand off rather than spin or fake a result.`,
     traps:{B:`Re-running tools that already failed won't make progress.`,C:`Marking an unresolved case resolved hides the failure and harms the customer.`,D:`Fabricating an answer is the worst outcome of all.`}},
    {q:`A straightforward, in-scope issue arrives with no request for a human. What distinguishes the right response from over-escalation?`,
     options:[`Offer to resolve it directly, since it's within the agent's capability; don't escalate a case you can handle`,`Escalate every case to be safe`,`Escalate because automation should never make binding decisions`,`Wait for the customer to demand a human before doing anything`],
     correct:0, why:`Escalation triggers are specific; a straightforward in-scope issue should simply be resolved, not handed off.`,
     traps:{B:`Escalating everything defeats the point of an autonomous agent.`,C:`In-scope resolution is exactly what the agent is for.`,D:`Stalling until the customer demands a human is poor service.`}},
    {q:`Leadership wants to "catch the hard cases" by escalating on negative sentiment OR low self-reported confidence. Why does combining the two proxies still fail?`,
     options:[`Both are unreliable proxies for complexity, so OR-ing them still doesn't track which cases actually need a human`,`Two signals are always better than one, so it would work`,`The OR makes it escalate too rarely`,`Sentiment fixes confidence's miscalibration`],
     correct:0, why:`Neither sentiment nor self-reported confidence correlates with case complexity; combining two bad proxies doesn't create a good one.`,
     traps:{B:`Combining two miscalibrated signals doesn't yield a calibrated one.`,C:`The OR would escalate too often, not too rarely — and on the wrong cases.`,D:`Sentiment can't repair confidence; both are the wrong proxy.`}},
  ]},

/* ============================================================= 5.3 */
'error-propagation':{ domain:'d5', ts:'5.3', title:`Error propagation in multi-agent systems`,
  eli5:`<p>When a helper hits a wall, it shouldn't whisper "failed" or pretend it found nothing. It should report <strong>what it tried, what it got partway, and what to try next</strong> — so the coordinator can actually decide what to do. And one helper failing shouldn't blow up the whole job.</p>`,
  real:`<p>In a multi-agent system the coordinator can only recover if subagents report failures with enough structure to act on.</p>
  <h4>Structured error context</h4>
  <ul>
    <li>Return <strong>failure type</strong>, the <strong>attempted query</strong>, any <strong>partial results</strong>, and <strong>alternative approaches</strong> — enough for the coordinator to retry differently, reroute, or proceed with partial data and annotate the gap.</li>
    <li>A generic <code>"search unavailable"</code> hides this context — even after exhausting retries, the flattened status strips what the coordinator needs.</li>
  </ul>
  <h4>Access failure vs valid empty result</h4>
  <ul>
    <li>An <strong>access failure</strong> (e.g., a timeout) needs a retry decision. A <strong>valid empty result</strong> (the query ran, found no matches) is a <em>success</em>. Conflating them makes the coordinator retry successful empties or treat a failure as "no data."</li>
  </ul>
  <h4>Two anti-patterns</h4>
  <ul>
    <li><strong>Silent suppression</strong> — returning empty-as-success hides the failure and risks shipping incomplete output as if complete.</li>
    <li><strong>Terminating the whole workflow</strong> on one subagent failure — recovery strategies (or the five other subagents' partial results) could have succeeded.</li>
  </ul>
  <h4>Where recovery happens</h4>
  <ul>
    <li>Subagents implement <strong>local recovery for transient failures</strong> and propagate only what they genuinely can't resolve — carrying partial results forward.</li>
    <li>Synthesis output should include <strong>coverage annotations</strong> marking which findings are well-supported vs which areas have gaps from unavailable sources.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>"Retry with backoff, then return a generic 'search unavailable'" is still wrong — the generic string hides context. The right answer surfaces structure (type, query, partials, alternatives). And both silent suppression and whole-workflow termination are explicit anti-patterns.</div>`,
  callout:`<b>NOT THE SAME</b> Access failure (timeout → maybe retry) ≠ valid empty result (query ran, no matches → success). Report them distinctly.`,
  example:{ label:`Example — structured error propagation`, body:
`# a subagent timeout -> return CONTEXT, not a flat "search unavailable"
return {
  "status": "error",
  "failureType": "timeout",          # vs "empty" for a valid no-match
  "attemptedQuery": "AI music tools 2024",
  "partialResults": [ ...what it did get before timing out... ],
  "alternatives": ["narrow the date range", "try a news source"]
}
# transient blip? recover LOCALLY and don't propagate.
# never silently return empty-as-success, and don't kill the whole workflow.` },
  fresh:`<ul><li><strong>Isolated subagent context</strong> — current docs confirm only a subagent's final message returns to the parent; intermediate tool calls, results, and errors stay inside it, which is exactly why structured final-error reporting matters. <a href="https://code.claude.com/docs/en/subagents">docs</a></li><li><strong>Graceful context-overflow stop</strong> — a new stop_reason model_context_window_exceeded (Claude 4.5+) makes the API stop cleanly instead of throwing a 400; older models opt in via beta model-context-window-exceeded-2025-08-26, so this is a recoverable signal rather than a hard error to propagate. <a href="https://platform.claude.com/docs/en/build-with-claude/context-windows">docs</a></li><li><strong>Nested subagents</strong> — subagents can spawn subagents (Claude Code v2.1.172+); background nesting is capped at 5 deep, and you prevent further spawning by omitting Agent from a subagent's tools. <a href="https://code.claude.com/docs/en/subagents">docs</a></li><li><strong>Independent transcripts</strong> — subagent transcripts persist separately from the main conversation, so main-conversation compaction does not erase a subagent's error trail. <a href="https://code.claude.com/docs/en/subagents">docs</a></li></ul>`,
  quick:[
    {q:`A subagent times out. Which return best enables coordinator recovery?`,
     options:[`A generic "search unavailable" after exhausting retries`,`Structured error context: failure type, attempted query, partial results, alternatives`,`An empty result marked successful`,`Throw to a top-level handler that kills the workflow`],
     correct:1, why:`Structured context lets the coordinator retry, reroute, or proceed with partial results.`},
    {q:`Killing the entire research workflow because one subagent failed is:`,
     options:[`Best practice for safety`,`An anti-pattern — recovery strategies could have succeeded`,`Required by the Agent SDK`,`Fine if logged`],
     correct:1, why:`Terminating everything on a single failure (and silent suppression) are both anti-patterns.`},
    {q:`A search ran fine and matched nothing. The subagent should report it as:`,
     options:[`An error so the coordinator retries`,`A valid empty result, distinct from an access failure`,`A timeout`,`A workflow-terminating failure`],
     correct:1, why:`A valid empty result is a success and must be distinguished from an access failure needing a retry decision.`},
  ],
  scenario:[
    {q:`The web search subagent times out on a complex topic. How should that failure flow back to the coordinator for the best recovery?`,
     options:[`Return structured error context: failure type, attempted query, any partial results, and potential alternatives.`,`Retry with backoff inside the subagent, then return a generic "search unavailable".`,`Catch the timeout and return an empty result marked successful.`,`Propagate the exception to a top-level handler that terminates the whole workflow.`],
     correct:0, why:`Structured context gives the coordinator what it needs to retry differently, try an alternative, or proceed with partial results and annotate gaps.`,
     traps:{B:`A generic status hides the context needed for an informed decision.`,C:`Masking failure as success prevents recovery and risks incomplete output.`,D:`Terminating everything is unnecessary when recovery could succeed.`}},
    {q:`A search subagent runs successfully but matches nothing. How should it report this so the coordinator reacts correctly?`,
     options:[`As a valid empty result (successful query, no matches) — distinct from an access failure that needs a retry decision`,`As an error so the coordinator retries the query`,`As a failure that terminates the research workflow`,`As a transient timeout so it's retried with backoff`],
     correct:0, why:`An empty result is a successful outcome and must be distinguished from an access failure that may warrant a retry.`,
     traps:{B:`Retrying a successful empty query just returns the same empty set.`,C:`A legitimate empty result isn't grounds to kill the workflow.`,D:`Nothing timed out; it's a success, not a transient fault.`}},
    {q:`A subagent catches its own failure and quietly returns an empty payload marked successful. Why is this a dangerous anti-pattern?`,
     options:[`Silent suppression hides the failure from the coordinator, so it can't recover and may emit incomplete output as if complete`,`It's fine because empty output is always safe`,`It improves throughput by avoiding error handling`,`It only matters when more than half the subagents fail`],
     correct:0, why:`Suppressing errors as empty success removes the signal the coordinator needs and risks shipping incomplete results unknowingly.`,
     traps:{B:`Empty-as-success is not safe; it conceals a real gap.`,C:`Skipping error handling trades correctness for nothing real.`,D:`Even one silently suppressed failure can corrupt the final output.`}},
    {q:`One of six research subagents fails. The pipeline throws to a top-level handler that aborts the entire run. What's wrong with this design?`,
     options:[`Terminating the whole workflow on a single failure is an anti-pattern — recovery or partial results from the other five could have succeeded`,`Nothing; any failure should stop everything for safety`,`The handler should silently swallow the error instead`,`The five successful subagents should also be marked failed`],
     correct:0, why:`Killing everything on one failure throws away recoverable progress; the coordinator should recover locally or proceed with partial results.`,
     traps:{B:`Halting on any single failure wastes the work that did succeed.`,C:`Silent swallowing is the opposite anti-pattern, also wrong.`,D:`Marking good results failed destroys valid work.`}},
    {q:`A subagent hits a transient network blip it could retry past on its own. Where should recovery happen?`,
     options:[`Locally inside the subagent for transient issues; propagate only what it genuinely can't resolve, with partial results`,`Always propagate every error straight to the coordinator`,`Escalate every transient blip to a human`,`Abort the subagent and return nothing`],
     correct:0, why:`Subagents should recover locally for transient issues and propagate only unresolved failures, carrying partial results forward.`,
     traps:{B:`Propagating trivially recoverable blips burdens the coordinator needlessly.`,C:`Human escalation for a transient blip is wildly disproportionate.`,D:`Returning nothing discards partial progress and context.`}},
    {q:`A subagent returns only "operation failed" after several internal retries. Why does this still hinder the coordinator?`,
     options:[`It strips the failure type, attempted query, and partial results the coordinator needs to choose a recovery path`,`It's ideal because it keeps the response short`,`It guarantees the coordinator will retry correctly`,`It tells the coordinator the empty result is valid`],
     correct:0, why:`A generic status hides the structured context — type, attempt, partials — required for an informed recovery decision.`,
     traps:{B:`Brevity isn't the goal; the missing context is the problem.`,C:`Without context the coordinator can't know how to retry.`,D:`A generic failure says nothing about whether an empty result is valid.`}},
    {q:`How should a failing subagent represent work it managed to complete before the failure?`,
     options:[`Include the partial results in its structured error so the coordinator can use or annotate them`,`Discard partial results since the call ultimately failed`,`Return the partials as a clean success with no error flag`,`Hold the partials internally and report only the error`],
     correct:0, why:`Returning partial results alongside the structured error lets the coordinator salvage progress and annotate any gap.`,
     traps:{B:`Discarding partials throws away usable work.`,C:`Marking a failed call a clean success masks the gap in the partials.`,D:`Withholding the partials denies the coordinator usable data.`}},
    {q:`A coordinator must decide whether to retry, reroute, or proceed after a subagent issue. What does it most need from the subagent's return?`,
     options:[`A structured report distinguishing the failure type and including the attempt, partial results, and alternatives`,`A single boolean success/failure flag`,`The subagent's full internal reasoning transcript`,`A natural-language apology for the failure`],
     correct:0, why:`Structured, categorized context is exactly what lets the coordinator pick retry, reroute, or proceed-with-partials.`,
     traps:{B:`A bare boolean can't distinguish a transient failure from a valid empty result.`,C:`A raw reasoning dump bloats context without the decision-relevant fields.`,D:`An apology carries no actionable recovery information.`}},
    {q:`In the final synthesis, some topic areas had no available sources. How should the synthesis output represent that?`,
     options:[`Add coverage annotations indicating which findings are well-supported vs which areas have gaps from unavailable sources`,`Present every section with equal confidence`,`Silently omit the under-sourced areas`,`Fill the gaps with plausible content`],
     correct:0, why:`Coverage annotations make each section's support level explicit, which is the structured-error principle carried into synthesis.`,
     traps:{B:`Uniform confidence misrepresents the thinly-sourced areas.`,C:`Silent omission hides that coverage was incomplete.`,D:`Fabrication to fill gaps is the worst outcome.`}},
    {q:`Two failures occur: subagent A timed out connecting, subagent B's query returned zero rows. Why must the coordinator see these as different?`,
     options:[`A is an access failure that may warrant a retry; B is a valid empty result needing no retry — conflating them causes wrong recovery`,`They're identical and both should be retried`,`They're identical and both should terminate the workflow`,`Only B should be retried; A should be ignored`],
     correct:0, why:`Distinguishing access failures from valid empties lets the coordinator retry A while accepting B's empty as a real answer.`,
     traps:{B:`Retrying B's valid empty just re-returns nothing.`,C:`Neither warrants killing the whole workflow.`,D:`Backwards — A is the one that may need a retry, not B.`}},
  ]},

/* ============================================================= 5.4 (NEW) */
'codebase-context':{ domain:'d5', ts:'5.4', title:`Context in large codebase exploration`,
  eli5:`<p>Exploring a huge codebase fills the model's memory fast, and once it's full it starts answering with "typical patterns" instead of the actual classes it found. Fix it by writing findings to <strong>scratchpad files</strong>, using <strong>/compact</strong> to free room, sending <strong>helper agents</strong> to read the messy details, and saving a <strong>manifest</strong> so you can pick up after a crash.</p>`,
  real:`<p>Long exploration sessions degrade in a specific way, and the mitigations are concrete techniques — not just "use a bigger model."</p>
  <h4>Context degradation, observed</h4>
  <ul>
    <li>In extended sessions the model starts giving <strong>inconsistent answers</strong> and referencing <strong>"typical patterns"</strong> rather than the specific classes it discovered earlier — a signal the relevant context has fallen out of the window.</li>
  </ul>
  <h4>Scratchpad files</h4>
  <ul>
    <li>Have agents maintain <strong>scratchpad files</strong> recording key findings, and reference them for subsequent questions. They persist findings <em>across context boundaries</em>, countering degradation.</li>
  </ul>
  <h4>Subagent delegation</h4>
  <ul>
    <li>Spawn subagents to investigate specific questions ("find all test files," "trace the refund-flow dependencies") so the <strong>verbose exploration output stays in the subagent</strong>, while the main agent keeps a clean, high-level coordination view.</li>
  </ul>
  <h4>Phase summaries &amp; /compact</h4>
  <ul>
    <li><strong>Summarize key findings from one phase before spawning subagents for the next</strong>, injecting the summary into their initial context.</li>
    <li>Use <code>/compact</code> to reduce context usage during extended sessions when the window fills with verbose discovery output.</li>
  </ul>
  <h4>Crash recovery via manifests</h4>
  <ul>
    <li>Design for crashes with <strong>structured state exports</strong>: each agent exports state to a known location; the coordinator <strong>loads a manifest on resume</strong> and injects it into agent prompts — instead of restarting from scratch.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>The fix for degradation is externalizing state (scratchpad, manifest, subagent isolation, /compact) — <em>not</em> "switch to a larger context window" (a bigger window still degrades and still vanishes on a crash) and <em>not</em> "ask the model to remember harder."</div>`,
  callout:`<b>SYMPTOM</b> "typical patterns" instead of the actual classes found earlier = context has degraded. Externalize state.`,
  example:{ label:`Example — exploration scratchpad + resume manifest`, body:
`# scratchpad.md  (persisted; referenced for later questions)
## refund flow
- RefundService.process()  -> validates in PaymentGuard
- depends on: OrderRepo, LedgerClient
## test files
- 41 *.test.ts; integration suite under /it

# manifest.json  (each agent exports state; coordinator loads on resume)
{
  "phase": "dependency-trace",
  "completed": ["test-inventory", "refund-flow"],
  "scratchpads": ["scratchpad.md"],
  "next": "trace ledger writes"
}
# on resume: coordinator loads manifest -> injects into agent prompts
# during a long session: /compact to reclaim room from verbose discovery` },
  fresh:`<ul><li><strong>Path-scoped rules</strong> — .claude/rules/ files with a YAML paths: frontmatter load only when Claude opens matching files, so codebase-specific context arrives just-in-time instead of bloating every turn. <a href="https://code.claude.com/docs/en/memory">docs</a></li><li><strong>CLAUDE.md re-read after /compact</strong> — current docs: the project CLAUDE.md is re-read from disk after /compact (nested CLAUDE.md reload on demand), so persistent project context survives compaction during long exploration. <a href="https://code.claude.com/docs/en/memory">docs</a></li><li><strong>HTML-comment stripping</strong> — &lt;!-- --&gt; comments in CLAUDE.md are stripped before injection, giving maintainers free notes that cost no context. <a href="https://code.claude.com/docs/en/memory">docs</a></li><li><strong>Interactive /init</strong> — a new mode (CLAUDE_CODE_NEW_INIT=1) runs multi-phase, subagent-assisted codebase analysis and produces a reviewable proposal, extending the exam's subagent-delegation pattern. <a href="https://code.claude.com/docs/en/memory">docs</a></li><li><strong>Subagent memory</strong> — subagents can keep their own memory (AgentDefinition.memory: user|project|local), a durable per-agent store that complements scratchpad files and manifests. <a href="https://code.claude.com/docs/en/subagents">docs</a></li></ul>`,
  quick:[
    {q:`In an extended session the model starts citing "typical patterns" instead of specific classes it found. This indicates:`,
     options:[`The codebase is too small`,`Context degradation — relevant findings have fallen out of the window`,`A bug in the model weights`,`The temperature is too low`],
     correct:1, why:`Inconsistent answers and "typical patterns" are the classic signal of context degradation in long sessions.`},
    {q:`What is the purpose of a scratchpad file during long codebase exploration?`,
     options:[`To store API keys`,`To persist key findings across context boundaries for later reference`,`To replace the conversation history entirely`,`To speed up the model`],
     correct:1, why:`Scratchpad files persist findings across context boundaries, countering degradation.`},
    {q:`Why delegate a verbose investigation ("find all test files") to a subagent?`,
     options:[`To run on a cheaper model`,`To keep the verbose output isolated in the subagent while the main agent coordinates at a high level`,`Because subagents are always faster`,`To avoid writing a scratchpad`],
     correct:1, why:`Subagent delegation isolates verbose exploration output, preserving the main agent's clean coordination context.`},
  ],
  scenario:[
    {q:`A long multi-agent codebase exploration crashes after two hours and loses all progress. How should it have been designed for recovery?`,
     options:[`Have each agent export structured state to a known location; the coordinator loads a manifest on resume and injects it into agent prompts.`,`Restart the entire exploration from scratch each time.`,`Hold all state in one ever-growing context window.`,`Rely on the model to remember where it left off.`],
     correct:0, why:`Structured state exports plus a coordinator manifest let work resume after a crash instead of restarting.`,
     traps:{B:`Restarting discards all prior work — the failure being avoided.`,C:`A single huge window still vanishes on a crash and exhausts capacity.`,D:`Models have no durable memory across a crash.`}},
    {q:`In an extended exploration session, the model gives inconsistent answers and cites "typical patterns" instead of the specific classes it found earlier. Best mitigation?`,
     options:[`Maintain a scratchpad file of key findings and reference it later, and use <code>/compact</code> when context fills`,`Keep going — it will recover on its own`,`Start a brand-new session with no context`,`Ask it to "try harder to remember"`],
     correct:0, why:`Scratchpad files persist findings across context boundaries; <code>/compact</code> reclaims room as the window fills.`,
     traps:{B:`Degradation worsens as context grows; it doesn't self-heal.`,C:`A blank session throws away everything learned.`,D:`Exhortation can't restore context that has fallen out of the window.`}},
    {q:`You're about to start a second exploration phase, but the window is full of verbose discovery from phase one. Best way to set up the next phase?`,
     options:[`Summarize phase one's key findings and inject that summary into the subagents' initial context for phase two`,`Carry all of phase one's raw output forward verbatim`,`Skip any summary and let subagents re-discover everything`,`Switch to a larger context window and keep all raw output`],
     correct:0, why:`Summarizing key findings before the next phase and injecting them keeps the next agents grounded without dragging verbose output along.`,
     traps:{B:`Carrying raw output forward is what fills and degrades the window.`,C:`Re-discovering wastes work already done.`,D:`A bigger window still degrades and still wastes budget on raw noise.`}},
    {q:`The coordinator needs to investigate "trace all refund-flow dependencies" without polluting its own high-level view. Best approach?`,
     options:[`Spawn a subagent for the trace so its verbose output stays isolated, returning only a concise findings summary`,`Run the trace inline in the coordinator's own context`,`Ask the user to trace it manually`,`Paste every file's full source into the coordinator`],
     correct:0, why:`Subagent delegation isolates verbose exploration so the coordinator preserves a clean coordination context.`,
     traps:{B:`Inline tracing floods the coordinator with verbose output.`,C:`Offloading to the user defeats the agent's purpose.`,D:`Pasting full sources is the maximal context-pollution option.`}},
    {q:`A teammate proposes "just use the model with the biggest context window" to avoid degradation entirely. Why is that insufficient?`,
     options:[`A larger window still degrades as it fills and still loses everything on a crash — externalized state (scratchpad/manifest) is the durable fix`,`Larger windows are never available`,`Larger windows make the model slower, which is the real problem`,`Larger windows can't run subagents`],
     correct:0, why:`Window size doesn't prevent degradation or survive crashes; persisting findings and state externally does.`,
     traps:{B:`Larger windows do exist; availability isn't the point.`,C:`Latency isn't the degradation problem.`,D:`Window size is unrelated to whether subagents can be spawned.`}},
    {q:`During a long session the context is filling with verbose tool and discovery output, but you want to keep the session going. Which built-in action reclaims room?`,
     options:[`Use <code>/compact</code> to reduce context usage from accumulated verbose output`,`Increase max_tokens`,`Lower the temperature`,`Restart the session from zero`],
     correct:0, why:`<code>/compact</code> is the documented way to reduce context usage during extended exploration sessions.`,
     traps:{B:`max_tokens controls output length, not accumulated context.`,C:`Temperature doesn't reclaim context room.`,D:`Restarting loses everything; /compact preserves the session.`}},
    {q:`On resume after a crash, what does the coordinator do with each agent's exported state?`,
     options:[`Load the manifest and inject the relevant state into the agents' prompts so they continue from where they were`,`Ignore it and re-run every phase`,`Email it to the user for manual review`,`Delete it to start clean`],
     correct:0, why:`Crash recovery is designed around the coordinator loading a manifest on resume and reinjecting state into agent prompts.`,
     traps:{B:`Re-running every phase is exactly the restart-from-scratch failure.`,C:`Manual review isn't automated recovery.`,D:`Deleting state forfeits the recovery design.`}},
    {q:`Which combination best counteracts context degradation across a long, multi-phase codebase exploration?`,
     options:[`Scratchpad files for findings, subagent delegation for verbose work, phase summaries, /compact, and manifest-based crash recovery`,`A single ever-growing context window and frequent reminders to the model`,`Only switching models when answers get inconsistent`,`Disabling tools so less output accumulates`],
     correct:0, why:`These are the complementary techniques: externalize findings, isolate verbosity, summarize between phases, compact, and persist state for recovery.`,
     traps:{B:`A growing window plus reminders is what degrades and forgets.`,C:`Swapping models doesn't externalize the lost context.`,D:`Disabling tools cripples exploration rather than managing its output.`}},
    {q:`An agent answered a question correctly an hour ago but now contradicts itself on the same class. Before trusting the new answer, what's the right move?`,
     options:[`Consult the scratchpad recorded earlier — it holds the specific, verified finding the degraded context has lost`,`Trust the most recent answer since it's freshest`,`Average the two answers`,`Restart the whole exploration`],
     correct:0, why:`The earlier scratchpad entry is the durable record; degraded context, not the older note, is the unreliable source.`,
     traps:{B:`The newest answer is the degraded one, not the most reliable.`,C:`Averaging two answers about a class is meaningless.`,D:`Restarting discards all prior work unnecessarily.`}},
    {q:`Why summarize a phase's findings before spawning the next phase's subagents, rather than handing them the full transcript?`,
     options:[`A concise injected summary grounds them in what matters without consuming budget on verbose prior output`,`Subagents can't read transcripts`,`Summaries are required by the Agent SDK`,`The full transcript would be more accurate, but it's too slow to send`],
     correct:0, why:`Phase summaries inject the essential grounding while keeping the next agents' context lean.`,
     traps:{B:`Subagents can read transcripts; the issue is budget and noise.`,C:`No SDK rule mandates this; it's a context-management practice.`,D:`The verbose transcript degrades context, not merely "slow."`}},
  ]},

/* ============================================================= 5.5 (NEW) */
'human-review':{ domain:'d5', ts:'5.5', title:`Human review & confidence calibration`,
  eli5:`<p>A "97% accurate" report can still be terrible at one document type — the average <strong>hides the weak spots</strong>. So check accuracy <strong>per type and per field</strong>, route the shaky and contradictory cases to humans, and keep <strong>spot-checking</strong> the confident ones to catch new mistakes.</p>`,
  real:`<p>Before you trust an extraction pipeline enough to reduce human review, you have to look past the headline number.</p>
  <h4>Aggregate accuracy hides segment failures</h4>
  <ul>
    <li>A 97% <em>overall</em> accuracy can mask poor performance on a specific <strong>document type or field</strong>. Analyze accuracy <strong>by document type and by field segment</strong> and confirm consistent performance across <em>all</em> segments before automating high-confidence extractions.</li>
  </ul>
  <h4>Field-level confidence, properly calibrated</h4>
  <ul>
    <li>Have the model output <strong>field-level confidence scores</strong>, then <strong>calibrate review thresholds using labeled validation sets</strong> — don't trust raw self-reported confidence as-is (it's poorly calibrated until checked against ground truth).</li>
  </ul>
  <h4>Sampling &amp; audit strategy</h4>
  <ul>
    <li>Use <strong>stratified random sampling</strong> of high-confidence extractions for ongoing error-rate measurement and to detect <strong>novel error patterns</strong> — high confidence does not mean "never audit."</li>
  </ul>
  <h4>Routing reviewer attention</h4>
  <ul>
    <li>Route extractions with <strong>low model confidence</strong> or <strong>ambiguous / contradictory source documents</strong> to human review, prioritizing limited reviewer capacity where it matters most.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>"97% overall, so drop human review" is the wrong move — the aggregate can hide a failing segment. Validate by document type and field first, and keep stratified sampling on the high-confidence stream to catch new error patterns.</div>`,
  callout:`<b>AVERAGES LIE</b> 97% overall can hide a 70% document type. Always slice accuracy by type and field before automating.`,
  example:{ label:`Example — segment audit before reducing review`, body:
`# DON'T trust the aggregate; slice it
overall_accuracy = 0.97
by_segment = {
  "invoice/total":        0.99,
  "invoice/tax_id":       0.98,
  "handwritten/amount":   0.71,   # <-- hidden failure the 97% masks
  "contract/effective_date": 0.95,
}
# routing rule (thresholds calibrated on a LABELED validation set):
#   low field-confidence  OR  ambiguous/contradictory source  -> human review
# AND: stratified random sample of HIGH-confidence extractions
#      to keep measuring error rate + catch novel patterns` },
  fresh:`<ul><li><strong>pass@k vs pass^k</strong> — new eval metrics let you tune review thresholds to product needs: pass@k requires at least one of k attempts correct, pass^k requires all k correct (a far stricter reliability bar). <a href="https://platform.claude.com/docs/en/test-and-evaluate/eval-tool">docs</a></li><li><strong>Multi-grader approach</strong> — current guidance combines code-based checks, an LLM judge, and human review, with LLM judges calibrated against humans via weekly transcript sampling — echoing the exam's "calibrate against labeled data" rule. <a href="https://platform.claude.com/docs/en/test-and-evaluate/eval-tool">docs</a></li><li><strong>Single-agent focus</strong> — note published eval guidance is largely single-agent-focused, so multi-agent review pipelines still lean on the human-calibration and stratified-sampling principles the exam stresses. <a href="https://platform.claude.com/docs/en/test-and-evaluate/eval-tool">docs</a></li></ul>`,
  quick:[
    {q:`Your extraction pipeline reports 97% overall accuracy. Before reducing human review, you should:`,
     options:[`Drop review immediately — 97% is good enough`,`Analyze accuracy by document type and field segment to find hidden weak spots`,`Re-run until the aggregate hits 99%`,`Switch to a larger model`],
     correct:1, why:`Aggregate accuracy can mask poor performance on a specific document type or field; validate by segment first.`},
    {q:`How should review thresholds for field-level confidence scores be set?`,
     options:[`Use the raw self-reported scores directly`,`Calibrate them against a labeled validation set`,`Pick a round number like 0.7`,`Let each reviewer choose their own`],
     correct:1, why:`Field-level confidence must be calibrated using labeled validation sets, not trusted raw.`},
    {q:`Why apply stratified random sampling to high-confidence extractions?`,
     options:[`High-confidence outputs never need checking`,`To keep measuring error rates and detect novel error patterns`,`To reduce token cost`,`To re-train the model automatically`],
     correct:1, why:`Sampling the high-confidence stream catches novel error patterns and measures ongoing error rate.`},
  ],
  scenario:[
    {q:`An extraction pipeline reports 97% overall accuracy, so the team wants to drop human review. What must you verify first?`,
     options:[`Break accuracy down by document type and field — the aggregate can mask poor performance on a specific segment`,`Nothing — 97% aggregate is clearly good enough to ship`,`Re-run until the aggregate climbs to 99%`,`Remove human review now and watch for complaints later`],
     correct:0, why:`Aggregate metrics can hide a failing segment, so validate by document type and field before reducing oversight.`,
     traps:{B:`A high aggregate can still conceal a badly failing document type or field.`,C:`A higher aggregate still hides per-segment gaps.`,D:`Pulling review before checking segments risks shipping bad extractions.`}},
    {q:`You confirm overall accuracy is high but discover handwritten invoices extract at 71%. What's the right response?`,
     options:[`Keep human review on the handwritten-invoice segment while automating the segments that are consistently accurate`,`Automate everything since the overall number is fine`,`Stop processing handwritten invoices entirely`,`Raise the overall threshold and ignore the segment`],
     correct:0, why:`Segment analysis exists precisely to keep review where performance is weak while safely automating strong segments.`,
     traps:{B:`Automating the weak segment ships its errors.`,C:`Dropping a needed document type isn't required; targeted review is.`,D:`A global threshold can't fix a single failing segment.`}},
    {q:`You want field-level confidence scores to route review attention reliably. How do you make the scores trustworthy?`,
     options:[`Calibrate the thresholds against a labeled validation set so scores map to real accuracy`,`Use the model's raw scores as-is`,`Average each document's field scores into one number`,`Treat anything above 0.5 as safe by default`],
     correct:0, why:`Calibrating against labeled ground truth turns raw confidence into a reliable routing signal.`,
     traps:{B:`Raw self-reported confidence is poorly calibrated until checked.`,C:`Averaging hides which specific field is uncertain.`,D:`A fixed 0.5 cutoff isn't grounded in measured accuracy.`}},
    {q:`A document has two source pages stating contradictory values for the same field. How should this extraction be handled?`,
     options:[`Route it to human review — ambiguous/contradictory source documents warrant a human decision`,`Auto-pick the first value and move on`,`Mark it high-confidence since both came from the document`,`Average the two values`],
     correct:0, why:`Ambiguous or contradictory sources are exactly what should be routed to human review.`,
     traps:{B:`Auto-picking from contradictory sources risks the wrong value.`,C:`Contradiction is the opposite of a high-confidence case.`,D:`Averaging fabricates a value neither page states.`}},
    {q:`The team assumes high-confidence extractions never need auditing once thresholds are set. What's the flaw?`,
     options:[`Novel error patterns can emerge in the high-confidence stream; stratified sampling keeps measuring and catching them`,`High-confidence extractions are always wrong`,`Auditing high-confidence cases wastes no reviewer time`,`Confidence scores can't be sampled`],
     correct:0, why:`Stratified random sampling of high-confidence outputs detects novel error patterns and tracks ongoing error rate.`,
     traps:{B:`They're usually right — the point is rare, novel failures.`,C:`Sampling does cost some reviewer time, but it's the cheap insurance.`,D:`Confidence outputs can absolutely be sampled.`}},
    {q:`With limited reviewer capacity, where should you direct human attention to get the most value?`,
     options:[`To low-confidence extractions and ambiguous/contradictory source documents`,`To a uniform random sample of all extractions only`,`To the highest-confidence extractions first`,`To whichever documents are longest`],
     correct:0, why:`Prioritize review on low-confidence and ambiguous/contradictory cases where errors are most likely.`,
     traps:{B:`Uniform sampling alone ignores where risk concentrates.`,C:`Highest-confidence cases are the least likely to need a human.`,D:`Length isn't a proxy for extraction risk.`}},
    {q:`Why is "self-reported confidence is poorly calibrated" still relevant even when you use field-level confidence scores?`,
     options:[`The raw scores must be calibrated against labeled data before thresholds based on them mean anything`,`It isn't relevant — field-level scores are automatically calibrated`,`Field-level scores replace the need for any validation set`,`It only applies to escalation, not extraction`],
     correct:0, why:`Field-level confidence is useful only once calibrated to real accuracy on a labeled validation set.`,
     traps:{B:`Field-level scores aren't calibrated by default.`,C:`Calibration is exactly what the validation set provides.`,D:`The calibration problem spans both escalation and extraction.`}},
    {q:`Before automating high-confidence extractions across the board, what is the prerequisite check?`,
     options:[`Verify accuracy is consistent across all document types and field segments, not just in aggregate`,`Confirm the aggregate exceeds 95%`,`Confirm the model is the latest version`,`Confirm reviewers approve of automation`],
     correct:0, why:`Consistent per-segment accuracy — not a high aggregate — is the prerequisite for automating high-confidence extractions.`,
     traps:{B:`The aggregate is exactly the number that can mislead.`,C:`Model version doesn't establish per-segment reliability.`,D:`Reviewer opinion isn't a substitute for segment validation.`}},
    {q:`You stratify your high-confidence sample by document type and find a new error mode appearing only in scanned faxes. What does this demonstrate?`,
     options:[`Stratified sampling surfaces novel, segment-specific error patterns an aggregate metric would bury`,`The sampling was misconfigured and should be uniform`,`Scanned faxes should be trusted more`,`The overall accuracy must be wrong`],
     correct:0, why:`Stratifying the sample is precisely how segment-specific novel errors get detected.`,
     traps:{B:`Stratification is the feature, not a misconfiguration.`,C:`A new error mode is reason to trust that segment less.`,D:`The aggregate can be correct yet still hide this segment.`}},
    {q:`A teammate wants to set one global confidence threshold for routing every field to review or auto-accept. Why is per-field calibration better?`,
     options:[`Different fields have different accuracy and confidence distributions, so a single threshold over- or under-reviews specific fields`,`Global thresholds are impossible to implement`,`Per-field thresholds remove the need for any human review`,`A single threshold always reviews too few documents`],
     correct:0, why:`Calibrating per field against labeled data routes attention correctly where a one-size threshold would misroute.`,
     traps:{B:`Global thresholds are easy to implement — just not well-calibrated per field.`,C:`Per-field routing still sends risky cases to humans.`,D:`A single threshold's error direction varies by field; it's the mismatch that's the issue.`}},
  ]},

/* ============================================================= 5.6 */
'provenance':{ domain:'d5', ts:'5.6', title:`Provenance & multi-source synthesis`,
  eli5:`<p>When you combine facts from many sources, keep a <strong>label</strong> on each saying where it came from. If two trustworthy sources <strong>disagree</strong>, show both with their labels — don't silently pick one, average them, or drop one. And keep the <strong>dates</strong>, so a 2021 number vs a 2024 number reads as "things changed," not "contradiction."</p>`,
  real:`<p>Synthesis across sources is where attribution and nuance quietly get destroyed. The fixes are structural.</p>
  <h4>Preserve the claim → source mapping</h4>
  <ul>
    <li>Attribution is lost when findings are compressed without preserving <strong>claim-source mappings</strong>. Require subagents to output structured mappings — <strong>source URL, document name, relevant excerpt, date</strong> — that downstream agents <em>preserve and merge</em> through synthesis rather than flattening into prose.</li>
  </ul>
  <h4>Handle conflicting credible values</h4>
  <ul>
    <li>When credible sources give different statistics, <strong>annotate the conflict with attribution</strong> rather than arbitrarily selecting one. Don't <strong>average</strong> (fabricates a number neither reported), don't <strong>silently pick</strong> one, don't <strong>discard</strong> either.</li>
    <li>Complete document analysis with the conflicting values <em>included and explicitly annotated</em>, letting the <strong>coordinator decide</strong> how to reconcile before passing to synthesis.</li>
  </ul>
  <h4>Temporal data ≠ contradiction</h4>
  <ul>
    <li>Require <strong>publication / data-collection dates</strong> in structured outputs so a 2021-vs-2024 difference is read as a temporal change, not a contradiction.</li>
  </ul>
  <h4>Structure the report</h4>
  <ul>
    <li>Separate <strong>well-established</strong> findings from <strong>contested</strong> ones, preserving original source characterizations and methodological context; add coverage notes where sources were unavailable.</li>
    <li>Render content types appropriately — <strong>financial data as tables, news as prose, technical findings as structured lists</strong> — rather than forcing everything into one uniform format.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>Silent selection, averaging, and discarding all destroy real signal. The correct move always <em>preserves</em> the conflicting values with their sources so the disagreement stays visible — and dates keep temporal differences from being misread as conflicts.</div>`,
  callout:`<b>NEVER</b> average, silently pick, or discard conflicting credible values. Annotate both with attribution; let the coordinator reconcile.`,
  example:{ label:`Example — claim-to-source mapping`, body:
`{
  "claim":    "The market reached $4.2B in 2023",
  "source":   "https://example.com/market-report",
  "document": "Gartner Market Guide 2023",
  "excerpt":  "...reaching $4.2 billion in 2023...",
  "date":     "2023-11-02"
}
# two credible sources conflict? keep BOTH with attribution:
#   - never average (fabricates a number neither reported)
#   - never silently pick one
#   - let the coordinator reconcile
# include dates so 2021 vs 2024 reads as CHANGE, not contradiction
# render: financial -> tables, news -> prose, technical -> structured lists` },
  fresh:`<ul><li><strong>Citations API (GA)</strong> — went GA June 30 2025 (API + Vertex): set citations.enabled:true on document blocks and responses return char_location / page_location (PDF) / content_block_location objects, turning the exam's "claim-to-source mapping" into a native feature. <a href="https://platform.claude.com/docs/en/build-with-claude/citations">docs</a></li><li><strong>cited_text is token-exempt</strong> — quoted source text returned in citations does not count toward output tokens, so preserving provenance is cheap. <a href="https://platform.claude.com/docs/en/build-with-claude/citations">docs</a></li><li><strong>Three document types</strong> — plain text is auto sentence-chunked, PDFs cite by page number, and custom content lets the caller control chunk boundaries for precise attribution. <a href="https://platform.claude.com/docs/en/build-with-claude/citations">docs</a></li><li><strong>Compatibility note</strong> — Citations works with prompt caching and batch but is incompatible with Structured Outputs (enabling both returns a 400), so a JSON-schema synthesis step can't also emit native citations. <a href="https://platform.claude.com/docs/en/build-with-claude/citations">docs</a></li><li><strong>Web search citations</strong> — the web search tool returns inline citations automatically, giving multi-source synthesis built-in provenance for live sources. <a href="https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool">docs</a></li></ul>`,
  quick:[
    {q:`Two credible sources report different statistics. The synthesis agent should:`,
     options:[`Pick the higher number`,`Annotate both values with their source attribution`,`Average them silently`,`Drop the conflicting one`],
     correct:1, why:`Preserve both with attribution rather than arbitrarily selecting one.`},
    {q:`Why require publication/collection dates in structured outputs?`,
     options:[`To sort alphabetically`,`So temporal differences aren't misinterpreted as contradictions`,`To reduce tokens`,`They're not needed`],
     correct:1, why:`Dates let synthesis interpret time-based differences correctly instead of as conflicts.`},
    {q:`How should mixed content types be rendered in a synthesis report?`,
     options:[`Convert everything to one uniform format`,`Financial as tables, news as prose, technical findings as structured lists`,`Everything as a single bulleted list`,`Everything as prose paragraphs`],
     correct:1, why:`Render each content type appropriately rather than flattening to a uniform format.`},
  ],
  scenario:[
    {q:`During synthesis, two credible sources give different market-size figures. What should the document-analysis subagent do before synthesis?`,
     options:[`Complete the analysis with both values included and explicitly annotated with their sources, letting the coordinator decide how to reconcile.`,`Silently choose the value from the more recent source.`,`Average the two figures.`,`Discard both as unreliable.`],
     correct:0, why:`Preserving both conflicting values with source attribution lets downstream synthesis reconcile transparently rather than hiding a disagreement.`,
     traps:{B:`Silent selection destroys the conflict signal.`,C:`Averaging fabricates a number neither source reported.`,D:`Discarding loses real, credible data.`}},
    {q:`A final report can no longer say which source backs each claim. What should subagents emit to preserve attribution through synthesis?`,
     options:[`Structured claim-source mappings (URL, document name, excerpt, date) that downstream agents carry through`,`Plain prose summaries with the sources stripped to save tokens`,`Only the final conclusions, without any source references`,`The raw web pages pasted in full`],
     correct:0, why:`Structured claim-source mappings let each claim stay traceable to its origin as it flows through synthesis.`,
     traps:{B:`Stripping sources from prose is exactly how attribution gets lost.`,C:`Conclusions without references can't be traced back at all.`,D:`Raw page dumps bloat context and still aren't structured mappings.`}},
    {q:`Two sources report different unemployment rates — but one is from 2021 and the other from 2024. How should synthesis treat this?`,
     options:[`Include the collection dates so the difference is read as a temporal change, not a contradiction`,`Flag it as a direct conflict and pick one value`,`Average the two rates`,`Drop the older figure as outdated`],
     correct:0, why:`Publication/collection dates let synthesis interpret time-based differences correctly rather than mistaking them for conflicts.`,
     traps:{B:`Treating a time difference as a contradiction misrepresents the data.`,C:`Averaging across different years produces a meaningless number.`,D:`The older figure may be valid for its period; dropping it loses context.`}},
    {q:`A research report mixes well-established findings with a few contested claims. How should it be structured for the reader?`,
     options:[`Separate well-established findings from contested ones so reliability is explicit, preserving each source's characterization`,`Present every claim with identical confidence for a clean read`,`Lead with the contested claims because they're most interesting`,`Omit the contested claims to avoid confusing the reader`],
     correct:0, why:`Separating established from contested findings makes each section's reliability explicit to the reader.`,
     traps:{B:`Uniform confidence misleads by hiding which claims are shaky.`,C:`Foregrounding contested claims overstates their certainty.`,D:`Omitting contested claims hides real, relevant disagreement.`}},
    {q:`Some sources were unavailable, so parts of the report rest on thin support. How should synthesis represent that?`,
     options:[`Add coverage notes marking which findings are well-supported and which have gaps from unavailable sources`,`Present the thin sections with the same confidence as the rest`,`Silently omit the thinly-supported sections`,`Fill the gaps with plausible-sounding content`],
     correct:0, why:`Explicit coverage annotations make each section's reliability clear rather than overstating or hiding the gaps.`,
     traps:{B:`Equal confidence misleads about the thin sections.`,C:`Silent omission hides that coverage was incomplete.`,D:`Fabricating to fill gaps is the worst possible outcome.`}},
    {q:`A summarization step compresses ten sources into three paragraphs and loses every citation. What design preserves attribution?`,
     options:[`Require the summary to retain claim-to-source mappings (source name, excerpt, date) alongside the compressed text`,`Compress harder so only the highest-confidence claims survive`,`Keep the prose and append a single generic "sources: various" note`,`Accept the loss since summaries are meant to be concise`],
     correct:0, why:`Carrying claim-to-source mappings through the compression keeps every retained claim traceable.`,
     traps:{B:`Harder compression drops even more attribution, not less.`,C:`"Sources: various" can't tie any specific claim to its origin.`,D:`Conciseness doesn't require discarding traceability.`}},
    {q:`The coordinator wants to reconcile a conflict between two credible statistics itself. What must the subagents give it to do that fairly?`,
     options:[`Both values with full attribution (source, date, excerpt), not a single pre-chosen number`,`Only the value the subagent judged most trustworthy`,`The averaged figure to save the coordinator a step`,`A note that the sources conflicted, without the actual numbers`],
     correct:0, why:`The coordinator can only reconcile fairly if it receives both attributed values, not a pre-filtered or fabricated one.`,
     traps:{B:`Pre-choosing one value strips the coordinator's ability to reconcile.`,C:`A pre-averaged figure hides both real numbers behind a fabricated one.`,D:`"They conflicted" without the values gives nothing to reconcile.`}},
    {q:`Why is silently picking the higher of two conflicting statistics a poor synthesis choice?`,
     options:[`It destroys the conflict signal and hides a real disagreement between credible sources from the reader`,`It's fine as long as the higher number is from a newer source`,`Higher numbers are statistically more likely to be correct`,`It saves tokens, which outweighs the lost attribution`],
     correct:0, why:`Arbitrarily selecting one value hides a genuine disagreement the reader should see, with attribution, to judge.`,
     traps:{B:`Recency doesn't justify silently dropping the other credible value.`,C:`There's no rule that larger figures are more accurate.`,D:`Token savings don't justify concealing a real conflict.`}},
    {q:`A synthesis agent receives financial figures, news developments, and a technical spec, and renders all three as flat prose paragraphs. Why is appropriate per-type rendering better?`,
     options:[`Financial data as tables, news as prose, and technical findings as structured lists preserve the structure each content type needs`,`Uniform prose is always the most readable format`,`Tables and lists add tokens for no benefit`,`Content type never affects the right rendering`],
     correct:0, why:`Rendering each content type appropriately preserves the structure readers need rather than flattening everything uniformly.`,
     traps:{B:`Flat prose obscures tabular and list-structured data.`,C:`The structure conveys meaning that prose loses.`,D:`Content type directly determines the appropriate rendering.`}},
    {q:`A subagent must report a contested claim upward. Beyond the conflicting values, what context should it preserve so synthesis stays faithful?`,
     options:[`The original source characterizations and methodological context, plus each value's date and attribution`,`Only the numeric values, stripped of any framing`,`Its own opinion on which source is right`,`A single merged paragraph with the disagreement smoothed over`],
     correct:0, why:`Preserving original characterizations, methodology, dates, and attribution lets synthesis represent the contest faithfully.`,
     traps:{B:`Stripping framing loses the methodological context that explains the disagreement.`,C:`A subagent opinion pre-decides what the coordinator should reconcile.`,D:`Smoothing over the disagreement is exactly what destroys the signal.`}},
  ]},

};
