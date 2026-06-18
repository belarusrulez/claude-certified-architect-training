/* =========================================================================
   DOMAIN 2 — Tool Design & MCP Integration
   Self-contained chapter module. Each chapter:
   { domain, ts, title, eli5, real, callout?, example:{label,body}, quick:[...], scenario:[...] }
   - real/eli5 use real inline HTML; only example.body escapes < > as &lt; &gt;.
   - correct = index of the right option as authored (app shuffles).
   ========================================================================= */
export const D2 = {

/* ---------------- 2.1 TOOL DESCRIPTIONS ---------------- */
'tool-descriptions':{ domain:'d2', ts:'2.1', title:`Tool descriptions & boundaries`,
  eli5:`<p>If two tools wear vague nametags — "does stuff" and "does things" — the model keeps grabbing the wrong one. A good description is a clear nametag: what the tool does, what inputs it takes, an example, the edge cases, and <strong>when to use it instead of the similar-looking one next to it</strong>.</p>`,
  real:`<p>Tool descriptions are the <strong>primary mechanism</strong> the model uses to select a tool. Minimal or overlapping descriptions (the classic <code>analyze_content</code> vs <code>analyze_document</code>, both "Analyzes the input and returns results") cause <strong>misrouting</strong> — the model has no signal to tell them apart. The model reads the descriptions, not the array order, not the names alone, and not your runtime validation.</p>
  <h4>What a strong description contains</h4>
  <ul>
    <li><strong>What it does</strong> and what it returns (the output shape).</li>
    <li><strong>Input formats</strong> with example queries — an order ID like <code>#12345</code> vs a customer email; ISO dates vs natural-language dates.</li>
    <li><strong>When to use it vs the neighbor</strong> — explicit disambiguation ("use <code>lookup_order</code> for order numbers; use <code>get_customer</code> for account/profile lookups").</li>
    <li><strong>Edge cases &amp; non-use cases</strong> — empty results, ambiguous input, and what this tool is <em>not</em> for (kills over-triggering of catch-all tools).</li>
  </ul>
  <h4>The fix ladder (cheapest first)</h4>
  <ul>
    <li><strong>1 — Expand &amp; disambiguate descriptions.</strong> Add formats, example queries, edge cases, and a when-to-use-vs-the-other boundary. Highest leverage, lowest effort; the right <em>first</em> step.</li>
    <li><strong>2 — Rename to remove keyword overlap</strong> (e.g. <code>analyze_content</code> → <code>extract_web_results</code> with a web-specific description). Use when two tools share an opening sentence and overlapping keywords causing ~50/50 routing.</li>
    <li><strong>3 — Split a generic tool</strong> into purpose-specific tools with defined I/O (e.g. a generic <code>analyze_document</code> → <code>extract_data_points</code>, <code>summarize_content</code>, <code>verify_claim_against_source</code>). Use when one tool takes a free-form <code>action</code> string and behaves differently per value.</li>
    <li><strong>4 — Add 2-4 few-shot routing examples.</strong> More tokens; reach for it only <em>after</em> descriptions are good.</li>
  </ul>
  <h4>System-prompt wording biases selection</h4>
  <ul>
    <li>Keyword-sensitive instructions create unintended tool associations: adding "the reporting assistant" to a system prompt can make the model over-select a <code>generate_report</code> tool even for non-report queries. Co-design prompt and tool descriptions; review prompts for keywords that could override good descriptions.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>A deterministic keyword/regex routing layer over the tools — or a separate ML classifier — is over-engineering. It bypasses the model's language understanding, adds maintenance, and is brittle. Likewise, forcing <code>tool_choice</code> to one tool every turn breaks every legitimate use of the others, and a larger model doesn't fix descriptions that lack distinguishing detail. Fix the description first.</div>`,
  callout:`<b>PRIMARY SIGNAL</b> Descriptions — not names, array order, or runtime code — are what the model reads to choose a tool. Terse labels ("Get user", "Get account") starve it of the detail it needs to disambiguate.`,
  example:{ label:`Example — disambiguating tool description`, body:
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
  quick:[
    {q:`What is the primary mechanism an LLM uses to choose between tools?`,
     options:[`The tool descriptions`,`The order tools appear in the array`,`The tool's return type`,`Alphabetical tool names`],
     correct:0, why:`Descriptions are the primary selection signal; weak ones cause misrouting.`},
    {q:`Two similar tools with minimal descriptions get confused. Best <em>first</em> step?`,
     options:[`Expand each description with inputs, examples, edge cases, and when-to-use boundaries`,`Add a deterministic routing layer that parses keywords`,`Merge them into one generic tool`,`Add 8 few-shot examples`],
     correct:0, why:`Fixing the descriptions targets the root cause with a low-effort, high-leverage change.`},
    {q:`A tool described "Use this for any data-related request" is over-triggered. The fix?`,
     options:[`Narrow it: specific purpose, defined I/O, and explicit non-use cases`,`Lower the temperature so it calls fewer tools`,`Move it last in the tools array`,`Set tool_choice to "any"`],
     correct:0, why:`Over-broad wording matches too many requests; explicit scope and non-use cases stop it.`},
  ],
  scenario:[
    {q:`The agent calls <code>get_customer</code> when users ask about orders ("check my order #12345") instead of <code>lookup_order</code>. Both have minimal descriptions ("Retrieves customer information" / "Retrieves order details") and accept similar identifiers. Most effective first step?`,
     options:[`Expand each tool's description with input formats, example queries, edge cases, and when to use it vs similar tools.`,`Add 5-8 few-shot examples routing order queries to <code>lookup_order</code>.`,`Add a routing layer that pre-selects a tool from detected keywords.`,`Consolidate both into one <code>lookup_entity</code> tool.`],
     correct:0, why:`Descriptions are the primary selection mechanism; expanding them is the low-effort, high-leverage root-cause fix.`,
     traps:{B:`Adds token overhead without fixing the underlying ambiguity.`,C:`Over-engineered; bypasses the model's language understanding.`,D:`A valid bigger change, but more effort than a "first step" warrants.`}},
    {q:`An agent has two tools, <code>analyze_content</code> and <code>analyze_document</code>, each described only as <em>"Analyzes the input and returns results."</em> The model frequently routes PDF-parsing requests to the wrong one. What is the highest-leverage first fix?`,
     options:[`Expand each description with input formats, example queries, edge cases, and an explicit when-to-use-vs-the-other boundary`,`Add a 12-shot prompt of labeled routing examples before every request`,`Insert a deterministic regex routing layer that picks the tool before the model sees the request`,`Merge the two tools into one and branch internally on a mode parameter`],
     correct:0, why:`Tool descriptions are the primary signal for selection, so clarifying formats, examples, and boundaries directly fixes the misrouting at lowest effort.`,
     traps:{B:`Few-shot routing is higher effort and addresses the symptom without fixing the ambiguous descriptions the model actually reads.`,C:`A deterministic layer adds maintenance and removes the model's flexibility when the cheap fix is better descriptions.`,D:`Merging hides the distinction the user genuinely needs and pushes complexity into an opaque mode parameter.`}},
    {q:`A team writes tool descriptions as terse labels (<code>"Get user"</code>, <code>"Get account"</code>) to save tokens. Selection accuracy is poor. Which statement best explains why?`,
     options:[`The description is the primary mechanism the model uses to choose a tool, so terse labels starve it of the signal needed to disambiguate`,`Token count in descriptions directly lowers accuracy, so shorter is always worse regardless of content`,`The model selects tools by array position, so labels are irrelevant to accuracy`,`Tool names alone determine routing, so descriptions never affect selection`],
     correct:0, why:`Descriptions are the model's primary selection input; stripping them to labels removes the distinguishing context required to route correctly.`,
     traps:{B:`It is not raw length but the absence of distinguishing detail; a short-but-clear description can route well.`,C:`Array position does not drive selection; the model reads descriptions, not order.`,D:`Names contribute but descriptions are the primary mechanism, not an inert field.`}},
    {q:`One tool description reads <em>"Use this for any data-related request."</em> The model overuses it, calling it even for unrelated tasks. What design change reduces the over-triggering?`,
     options:[`Replace the broad catch-all wording with a specific purpose, defined inputs/outputs, and explicit non-use cases`,`Lower the model's temperature so it calls fewer tools overall`,`Move the tool to the end of the tools array so it is considered last`,`Set tool_choice to "any" so the model is forced to pick the best tool`],
     correct:0, why:`Over-triggering comes from over-broad wording; narrowing the description with explicit scope and non-use cases stops the tool from matching unrelated requests.`,
     traps:{B:`Temperature does not address an inherently ambiguous description that matches too many requests.`,C:`Array order does not govern selection, so repositioning changes nothing about over-triggering.`,D:`Forcing "any" makes the model call some tool but does not stop this tool from being the wrong match.`}},
    {q:`A single generic <code>process</code> tool accepts a free-form <code>action</code> string and behaves differently per action; the model often passes invalid action values. Which refactor most improves reliable selection?`,
     options:[`Split it into purpose-specific tools, each with a clear description and defined I/O schema`,`Add more example action strings to the existing tool's description only`,`Keep one tool but rename it to <code>smart_process</code> to signal capability`,`Document the valid actions in the system prompt instead of the tool description`],
     correct:0, why:`Splitting a generic tool into purpose-specific tools with defined I/O gives the model unambiguous targets and valid schemas, the recommended fix for overloaded generic tools.`,
     traps:{B:`More examples help marginally but the free-form action field still invites invalid values and ambiguous routing.`,C:`Renaming changes a keyword association but leaves the overloaded single-tool design intact.`,D:`Moving action docs to the system prompt separates them from the selection signal the model reads at the tool.`}},
    {q:`After adding the phrase <em>"the reporting assistant"</em> to a system prompt, the model began over-selecting a <code>generate_report</code> tool even for non-report queries. What does this illustrate about description and prompt design?`,
     options:[`System-prompt wording can bias tool selection through keyword association, so prompt and tool descriptions must be designed together`,`System prompts have no effect on tool selection; the change was coincidental`,`Tool selection depends solely on the tool name matching the prompt verbatim`,`Adding any system prompt text always increases tool-call frequency uniformly`],
     correct:0, why:`Keyword overlap between the system prompt and a tool can bias selection toward that tool, so the two must be co-designed.`,
     traps:{B:`The observed shift shows the system prompt clearly influences selection, not coincidence.`,C:`Bias arises from keyword association, not a requirement for verbatim name matching.`,D:`The effect is targeted by keyword overlap, not a uniform increase across all tools.`}},
    {q:`A reviewer must choose where to invest to fix tool misrouting and has limited time. Which option is the recommended low-effort, high-leverage first step?`,
     options:[`Improve the tool descriptions with formats, example queries, and boundaries before building heavier infrastructure`,`Build a separate ML classifier that pre-routes every request to a tool`,`Add a human-in-the-loop confirmation step before each tool call`,`Increase the model size to improve implicit tool reasoning`],
     correct:0, why:`Expanding descriptions is the low-effort, high-leverage first step compared with classifiers, routing layers, or larger models.`,
     traps:{B:`A separate classifier is heavyweight infrastructure to try before the cheap description fix.`,C:`Human confirmation slows every call without addressing why the model misroutes.`,D:`A larger model is costly and does not fix descriptions that lack distinguishing detail.`}},
    {q:`A tool <code>search</code> is described accurately but omits that it only accepts ISO date ranges, not natural-language dates. The model passes <em>"last week"</em> and calls fail. What should the description add?`,
     options:[`The expected input format and an example query, plus the edge case that natural-language dates are unsupported`,`A note telling the model to retry with different inputs until one works`,`A higher priority flag so this tool is selected more often`,`Nothing — input validation belongs only in the tool's runtime code`],
     correct:0, why:`Stating input formats, example queries, and edge cases in the description steers the model to supply valid arguments up front.`,
     traps:{B:`Blind retry guidance wastes calls and does not teach the model the required format.`,C:`A priority flag affects selection frequency, not the malformed argument problem.`,D:`Runtime validation catches errors after the fact; the description prevents them by guiding input.`}},
    {q:`Two tools legitimately differ but their descriptions share the same opening sentence and overlapping keywords, causing 50/50 misrouting. Besides expanding detail, what additional change directly reduces the overlap?`,
     options:[`Rename and reword the tools so their names and descriptions no longer share distinguishing keywords`,`Lower the maximum number of tools the agent may call per turn`,`Reorder the two tools so the more common one appears first in the array`,`Combine both descriptions into a single shared paragraph referenced by each`],
     correct:0, why:`Renaming to remove overlapping keywords eliminates the ambiguity that drives near-random routing between similar tools.`,
     traps:{B:`Limiting calls per turn does not help the model tell two similar tools apart.`,C:`Array order does not determine selection, so reordering will not fix the overlap.`,D:`A shared paragraph increases overlap, worsening the very ambiguity to be removed.`}},
    {q:`A generic <code>analyze_document</code> tool is asked to do three different jobs — pulling out fields, summarizing, and fact-checking claims — and the model picks the wrong behavior. Which split best fixes selection?`,
     options:[`Split into <code>extract_data_points</code>, <code>summarize_content</code>, and <code>verify_claim_against_source</code>, each with defined I/O`,`Keep one tool and add a <code>mode</code> enum parameter the model must set`,`Keep one tool but expand its single description to cover all three jobs`,`Force <code>tool_choice</code> to <code>analyze_document</code> so it is always selected`],
     correct:0, why:`Purpose-specific tools with distinct descriptions and contracts give the model unambiguous targets for each job — the recommended split of an overloaded generic tool.`,
     traps:{B:`A mode enum re-creates the overloaded tool; the model still has to disambiguate inside one opaque tool.`,C:`One description for three jobs keeps the ambiguity that causes wrong behavior.`,D:`Forcing the tool guarantees it is called but not that the right behavior is chosen.`}},
    {q:`A web-scraping tool named <code>analyze_content</code> keeps getting picked for local-file analysis because its name and description are generic. Which targeted change best stops the confusion?`,
     options:[`Rename it to <code>extract_web_results</code> and give it a web-specific description with non-use cases`,`Add a sentence to the system prompt telling the model to avoid it for files`,`Delete the local-file analysis tool so there is no competition`,`Set both tools' descriptions to identical text for consistency`],
     correct:0, why:`Renaming plus a web-specific, bounded description removes the keyword overlap that caused the misrouting.`,
     traps:{B:`Prompt nudges are probabilistic and don't fix the generic description the model reads.`,C:`Removing a needed tool breaks the legitimate local-file use case.`,D:`Identical descriptions maximize overlap and guarantee misrouting.`}},
  ]},

/* ---------------- 2.2 STRUCTURED ERRORS ---------------- */
'structured-errors':{ domain:'d2', ts:'2.2', title:`Structured error responses`,
  eli5:`<p>When a tool fails, don't just say "oops." Say <strong>what kind</strong> of oops, and whether <strong>trying again would help</strong>. That way the agent knows whether to retry, explain it to the customer, or escalate — instead of guessing.</p>`,
  real:`<p>Use the MCP <code>isError</code> flag plus structured metadata: <code>errorCategory</code> (transient / validation / business / permission), an <code>isRetryable</code> boolean, and a human-readable message. A uniform generic "Operation failed" blocks smart recovery — the agent applies one strategy to every failure and mishandles at least one. The <code>isRetryable</code> boolean is the field that <em>directly</em> tells the agent whether trying again could succeed; the category hints at it, the message is for humans, and <code>isError</code> only signals that something failed.</p>
  <h4>The error taxonomy the model can act on</h4>
  <ul>
    <li><strong>transient</strong> (timeout, rate limit, service unavailable) — <code>isRetryable: true</code>; retry with back-off.</li>
    <li><strong>validation</strong> (invalid input) — not retryable as-is; fix the arguments and call again.</li>
    <li><strong>business</strong> (policy violation, e.g. refund over the limit) — <code>retriable: false</code> + customer-friendly explanation. Retrying can never satisfy a policy.</li>
    <li><strong>permission</strong> (caller lacks scope/unauthorized) — not retryable; escalate or re-auth, don't retry blindly.</li>
  </ul>
  <h4>Recover locally, propagate selectively</h4>
  <ul>
    <li>A subagent should handle <strong>transient</strong> failures locally (retry with back-off) and only propagate to the coordinator what it cannot resolve — along with <strong>partial results</strong> and what was attempted, so the coordinator isn't starting from zero.</li>
  </ul>
  <div class="edge"><b>Edge case: empty ≠ error</b>A query that runs fine but matches nothing is a <strong>valid success with no results</strong>, not a failure. Marking it <code>isError</code> triggers pointless retries on a query that will keep returning the same empty set. The mirror anti-pattern is masking a real <strong>access failure</strong> as an empty success (<code>isError:false, results:[]</code>) — that hides the failure and removes the signal the agent needs to retry or escalate. Keep access failures and valid empty results distinct.</div>`,
  callout:`<b>RETRYABLE BOOLEAN</b> <code>isRetryable</code> is the single field that directly answers "would calling again help?" Category hints; the boolean states it. Business + permission = non-retryable; transient = retryable.`,
  example:{ label:`Example — structured MCP error return`, body:
`return {
  "isError": true,
  "errorCategory": "business",   // transient | validation | business | permission
  "isRetryable": false,
  "message": "Refund of $800 exceeds the $500 policy limit."
}
# valid query, zero matches != error -> return a normal empty result, not isError
# access failure != empty success -> never disguise a failure as results: []` },
  quick:[
    {q:`Which enables the agent to recover intelligently from a tool failure?`,
     options:[`Structured metadata: category + <code>isRetryable</code> + readable message`,`A uniform generic "Operation failed" string`,`Silently returning empty results`,`Crashing the loop`],
     correct:0, why:`Structured error metadata lets the agent decide whether to retry, explain, or escalate.`},
    {q:`A query runs fine but matches nothing. That is:`,
     options:[`A valid empty result (success, no matches)`,`A retryable transient error`,`A permission error`,`A reason to terminate the workflow`],
     correct:0, why:`Empty results are valid successes — distinct from access failures.`},
    {q:`Which single field most directly tells the agent whether retrying could succeed?`,
     options:[`The <code>isRetryable</code> boolean`,`The human-readable <code>message</code>`,`The <code>errorCategory</code> label alone`,`The presence of <code>isError</code>`],
     correct:0, why:`The explicit boolean states retryability directly; the rest only hint or signal that a failure occurred.`},
  ],
  scenario:[
    {q:`A refund request exceeds your policy limit. What should the <code>process_refund</code> tool return so the agent communicates appropriately?`,
     options:[`A structured business error with <code>retriable: false</code> and a customer-friendly explanation.`,`A generic "Operation failed" so the agent retries.`,`An empty success so the conversation continues.`,`A transient error so the agent retries with backoff.`],
     correct:0, why:`A policy violation is a non-retryable business error; structured metadata lets the agent explain it rather than uselessly retry.`,
     traps:{B:`Hides the reason and triggers pointless retries.`,C:`Masking failure as success prevents proper handling.`,D:`It isn't transient; retrying can't satisfy a policy limit.`}},
    {q:`An MCP tool returns <code>{ "isError": true, "message": "Operation failed" }</code> for every failure. The agent cannot decide whether to retry. What metadata should the tool add to enable smart recovery?`,
     options:[`An <code>errorCategory</code> (transient/validation/business/permission), an <code>isRetryable</code> boolean, and a human-readable message`,`A stack trace and the internal exception class name`,`A numeric error code only, leaving interpretation to the agent`,`The full request payload echoed back with no classification`],
     correct:0, why:`Categorizing the error and exposing an explicit retryable flag plus a clear message lets the agent choose the right recovery path.`,
     traps:{B:`A stack trace leaks internals and still leaves the agent guessing whether a retry is safe.`,C:`A bare numeric code without categorization forces the agent to interpret it ad hoc.`,D:`Echoing the payload provides no signal about category or retryability.`}},
    {q:`A payments tool rejects a transfer because it exceeds the customer's daily limit. How should the structured error represent this business-rule violation?`,
     options:[`<code>isRetryable: false</code> with a customer-friendly explanation of the limit`,`<code>isRetryable: true</code> so the agent retries until the limit resets`,`<code>isError: false</code> with an empty result so the flow continues`,`A transient category so the agent backs off and retries shortly`],
     correct:0, why:`A business-rule violation is not retryable and should carry a clear, customer-friendly message rather than inviting retries.`,
     traps:{B:`Marking it retryable causes pointless repeated attempts that will keep failing the same rule.`,C:`Reporting success with an empty result masks the failure and prevents proper handling.`,D:`It is a business rule, not a transient fault, so back-off-and-retry is the wrong category.`}},
    {q:`A query tool returns <code>isError: true</code> when a database lookup finds zero matching rows. Why is this a design flaw?`,
     options:[`A valid query with no matches is a successful empty result, not an error; conflating them blocks correct handling`,`Returning an error for empty results is correct because no data means the call failed`,`Empty results should be returned as <code>isRetryable: true</code> so the agent re-queries`,`Zero rows should always raise a permission-category error`],
     correct:0, why:`An empty result set is a successful query outcome and must be distinguished from an actual access or execution failure.`,
     traps:{B:`No data is a normal valid outcome, not a failed call, so flagging an error is incorrect.`,C:`Re-querying the same successful query will keep returning the same empty set.`,D:`Zero rows is unrelated to permissions; it is simply a successful empty result.`}},
    {q:`A tool sometimes masks access failures by returning an empty success payload (<code>isError: false</code>, <code>results: []</code>). Why does this harm the agent's reliability?`,
     options:[`It makes a real failure indistinguishable from a legitimately empty result, so the agent cannot decide whether to retry`,`It is fine because returning empty data is safer than returning an error`,`It improves reliability by hiding transient noise from the agent`,`It only matters for permission errors, not transient ones`],
     correct:0, why:`Disguising a failure as empty success removes the signal the agent needs to distinguish a retry-worthy failure from a valid no-match.`,
     traps:{B:`Hiding the failure removes the information the agent needs and is not safer.`,C:`Masking failures degrades reliability rather than improving it by suppressing real signals.`,D:`The masking problem applies to any failure type, not just permission errors.`}},
    {q:`An upstream service times out intermittently. How should a well-designed MCP tool classify this error so the agent responds correctly?`,
     options:[`As a transient category with <code>isRetryable: true</code> so the agent can retry with back-off`,`As a validation error so the agent corrects the input`,`As a business error with <code>isRetryable: false</code>`,`As a permission error so the agent requests new credentials`],
     correct:0, why:`An intermittent timeout is a transient fault and should be marked retryable so the agent can safely retry.`,
     traps:{B:`A timeout is not caused by bad input, so a validation category misleads the agent into editing arguments.`,C:`Marking it non-retryable business logic prevents a retry that would likely succeed.`,D:`The failure is a timeout, not an access-rights problem, so credential refresh is irrelevant.`}},
    {q:`A tool returns malformed-argument failures and transient outages under the same generic message. What is the main consequence for the agent?`,
     options:[`Without distinct categories the agent applies one recovery strategy to two different failures and handles at least one wrong`,`The agent will always retry, which is correct for both cases`,`The agent ignores the message entirely and proceeds as if successful`,`Categorization is unnecessary because the model infers the cause from context`],
     correct:0, why:`Different failure types need different responses, so a single generic message forces a one-size strategy that mishandles at least one case.`,
     traps:{B:`Retrying a malformed-argument error repeats the same invalid call and will not succeed.`,C:`A genuine error is not silently ignored; the issue is misclassified recovery, not skipping.`,D:`The model cannot reliably infer category from a generic message; explicit metadata is needed.`}},
    {q:`Which field in a structured MCP error most directly tells the agent whether attempting the call again could succeed?`,
     options:[`The <code>isRetryable</code> boolean`,`The human-readable <code>message</code> string`,`The <code>errorCategory</code> label alone`,`The presence of the <code>isError</code> flag`],
     correct:0, why:`The explicit isRetryable boolean is the field that directly communicates whether a retry is worthwhile.`,
     traps:{B:`A human-readable message aids people but is not a reliable machine signal for the retry decision.`,C:`The category hints at retryability but the boolean states it directly and unambiguously.`,D:`The isError flag only signals that a failure occurred, not whether retrying could help.`}},
    {q:`A permission failure occurs because the caller lacks scope for a resource. How should it be categorized so the agent reacts appropriately rather than retrying blindly?`,
     options:[`As a permission category, typically non-retryable, with a message indicating missing access`,`As a transient category so the agent retries until access is granted`,`As a validation error so the agent edits the resource ID`,`As a successful empty result so the agent moves on`],
     correct:0, why:`A permission failure should be its own non-retryable category so the agent escalates access rather than retrying a call that will keep failing.`,
     traps:{B:`Retrying does not grant missing scope, so a transient classification wastes attempts.`,C:`The arguments may be valid; treating it as validation sends the agent editing the wrong thing.`,D:`Reporting success hides the access failure and prevents the agent from escalating.`}},
    {q:`A reviewer sees a tool that distinguishes <em>access failures</em> from <em>valid empty results</em>. Why is this distinction emphasized in error design?`,
     options:[`Access failures need a retry-or-escalate decision, while valid empty results are successful outcomes needing none; conflating them breaks handling`,`Both should be treated identically since neither returns data`,`Valid empty results should be marked as errors to be safe`,`Access failures should be returned as empty successes to simplify the schema`],
     correct:0, why:`The two require opposite handling, so separating them lets the agent retry or escalate failures while accepting empty results as done.`,
     traps:{B:`Treating them identically destroys the signal that drives correct, opposite responses.`,C:`Marking valid empty results as errors triggers needless retries on successful queries.`,D:`Returning access failures as empty successes masks them, the exact anti-pattern being avoided.`}},
    {q:`A subagent hits an intermittent timeout mid-task, retries with back-off, succeeds on attempt two, and also gathered three of five requested records before a fourth source went down. What should it propagate to the coordinator?`,
     options:[`Only the unresolved failure plus the partial results gathered and what was attempted — it resolved the transient timeout locally`,`Every transient timeout it saw, so the coordinator can decide each retry`,`Nothing, because it should keep retrying the down source until it succeeds`,`A single generic "task failed" with no partial data`],
     correct:0, why:`Subagents recover transient failures locally and propagate only what they can't resolve, attaching partial results and what was attempted so the coordinator can decide next steps.`,
     traps:{B:`Propagating every transient blip floods the coordinator with noise the subagent already handled.`,C:`Infinite local retries on a hard-down source stall the workflow instead of escalating.`,D:`Dropping partial results forces redundant re-work the subagent already completed.`}},
  ]},

/* ---------------- 2.3 TOOL DISTRIBUTION & TOOL_CHOICE ---------------- */
'tool-distribution':{ domain:'d2', ts:'2.3', title:`Tool distribution & tool_choice`,
  eli5:`<p>Don't hand one worker 18 tools — they get overwhelmed and grab the wrong one. Give each worker just the few tools their job needs (about 4-5). And when you absolutely must, you can <strong>force</strong> the model to use a tool (or one specific tool) instead of letting it chat.</p>`,
  real:`<p>Too many tools on one agent (18 vs ~4-5) degrades selection by increasing decision complexity; agents holding out-of-role tools tend to <strong>misuse</strong> them (a synthesis agent with web search will sometimes search when it shouldn't). Scope tools per role with <strong>least privilege</strong>, adding a few <strong>scoped cross-role</strong> tools only for genuinely high-frequency needs. Replace generic tools with constrained alternatives — e.g. swap <code>fetch_url</code> for a <code>load_document</code> that validates document URLs.</p>
  <h4><code>tool_choice</code> modes</h4>
  <ul>
    <li><code>"auto"</code> — model decides; <strong>may answer in text without any tool</strong>. Use when text is a legitimate response.</li>
    <li><code>"any"</code> — must call <em>some</em> tool (model picks which). Guarantees an action over chat.</li>
    <li><code>{"type":"tool","name":"X"}</code> — must call <em>that specific</em> tool. Use to force the first step in an ordering, or to force structured output.</li>
    <li><code>"none"</code> — forbid tools for this turn.</li>
  </ul>
  <h4>Least privilege in practice</h4>
  <ul>
    <li>Scope each role to ~4-5 tools; add a cross-role tool only for a genuinely high-frequency need (the 85% case), keeping the rare/complex 15% delegating through the coordinator. Example: give synthesis a scoped <code>verify_fact</code> for simple checks.</li>
    <li>Don't add destructive or out-of-role tools "just in case" — their mere presence biases the model into using them.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>Array order enforces nothing. <code>tool_choice</code> forces the <em>current</em> turn's call only; a <em>multi-step</em> sequence comes from forcing the first tool, then handling later steps in follow-up turns (or a prerequisite gate). Putting a tool "first in the array" does not guarantee it is called, called first, or called at all.</div>`,
  callout:`<b>~4-5 PER ROLE</b> Scope each agent to the few tools its role needs. Cross-role tools only for high-frequency needs; complex/rare cases route through the coordinator.`,
  example:{ label:`Example — tool_choice modes`, body:
`tool_choice = {"type": "auto"}                          # may answer in text
tool_choice = {"type": "any"}                           # must call SOME tool
tool_choice = {"type": "tool", "name": "extract_meta"}  # must call THAT tool
# scope each agent to ~4-5 role tools; array order does NOT enforce call order` },
  quick:[
    {q:`Giving one agent 18 tools instead of 4-5 tends to:`,
     options:[`Degrade tool-selection reliability`,`Improve flexibility with no downside`,`Reduce token usage`,`Force parallelism`],
     correct:0, why:`More tools = more decision complexity = less reliable selection.`},
    {q:`You must guarantee the model calls <em>some</em> tool rather than replying with text. Use:`,
     options:[`<code>tool_choice: "any"</code>`,`<code>tool_choice: "auto"</code>`,`A longer system prompt`,`<code>stop_reason: "tool_use"</code>`],
     correct:0, why:`<code>"any"</code> forces a tool call (model still picks which).`},
    {q:`You must guarantee one specific tool is called first. Use:`,
     options:[`<code>tool_choice: {"type":"tool","name":"X"}</code>, then handle later steps in follow-up turns`,`List X first in the tools array`,`<code>tool_choice: "any"</code>`,`Mention the order in the system prompt`],
     correct:0, why:`Forced selection guarantees that specific tool; ordering across steps comes from follow-up turns.`},
  ],
  scenario:[
    {q:`Your synthesis agent often needs to verify claims. Today it returns to the coordinator, which invokes the web search agent and re-invokes synthesis — adding 2-3 round trips and +40% latency. 85% of verifications are simple fact-checks; 15% need deep investigation. Best approach?`,
     options:[`Give the synthesis agent a scoped <code>verify_fact</code> tool for simple lookups; complex cases still delegate through the coordinator.`,`Have synthesis batch all verifications and return them to the coordinator at the end.`,`Give the synthesis agent access to all web search tools so it never round-trips.`,`Have the web search agent pre-cache extra context around every source.`],
     correct:0, why:`Least privilege: give synthesis exactly what it needs for the 85% common case while preserving coordination for the complex 15%.`,
     traps:{B:`Batching creates blocking dependencies when later synthesis depends on earlier verified facts.`,C:`Over-provisions the agent and breaks separation of concerns.`,D:`Speculative caching can't reliably predict what's needed.`}},
    {q:`A single agent is configured with 18 tools spanning research, writing, billing, and admin roles, and its tool selection has degraded. What is the recommended remedy?`,
     options:[`Scope tools per role with least privilege, splitting work across agents and adding only a few high-frequency cross-role tools`,`Keep all 18 tools but reorder the array so the most common ones come first`,`Set tool_choice to "any" so the model is forced to pick a tool each turn`,`Increase the temperature so the model explores the tool set more thoroughly`],
     correct:0, why:`Too many tools on one agent degrades selection; scoping per role with least privilege and limited cross-role tools restores reliable choices.`,
     traps:{B:`Array order does not determine selection, so reordering 18 tools does not fix degradation.`,C:`Forcing a tool call does not help the model choose correctly among too many options.`,D:`Higher temperature increases randomness, worsening selection rather than improving it.`}},
    {q:`A synthesis agent's only out-of-role need is occasionally confirming a claim. Rather than giving it the full research toolset, what is the appropriate design?`,
     options:[`Add a single focused cross-role tool such as <code>verify_fact</code> for the high-frequency need`,`Grant the synthesis agent every research tool so it never lacks one`,`Remove all tools and have it request data from the user instead`,`Duplicate the entire research agent inside the synthesis agent`],
     correct:0, why:`A few targeted cross-role tools for high-frequency needs preserve least privilege without bloating the toolset.`,
     traps:{B:`Granting the full research toolset reintroduces tool overload and out-of-role misuse.`,C:`Stripping all tools cripples the agent and pushes work onto the user unnecessarily.`,D:`Duplicating a whole agent's tools defeats role scoping and bloats selection.`}},
    {q:`An agent without a role-appropriate need is given a <code>delete_records</code> tool "just in case." What risk does this introduce?`,
     options:[`Agents tend to misuse out-of-role tools, so the unneeded destructive tool invites incorrect or harmful calls`,`None, because extra tools are always ignored when not relevant`,`It only increases latency but never affects behavior`,`It improves safety by giving the agent more recovery options`],
     correct:0, why:`Out-of-role tools tend to be misused, so an unnecessary destructive tool raises the risk of harmful calls and should be removed.`,
     traps:{B:`Extra tools are not reliably ignored; their presence can bias the model into using them.`,C:`The concern is incorrect behavior, not merely latency.`,D:`An out-of-role destructive tool is a hazard, not a safety improvement.`}},
    {q:`A workflow requires the model to call a specific <code>extract_schema</code> tool to produce structured output before proceeding. Which tool_choice setting guarantees that?`,
     options:[`A forced choice: <code>{"type":"tool","name":"extract_schema"}</code>`,`<code>tool_choice: "auto"</code>`,`<code>tool_choice: "any"</code>`,`Listing <code>extract_schema</code> first in the tools array`],
     correct:0, why:`Forcing a specific tool by name guarantees that exact tool is called, ensuring the structured output step happens.`,
     traps:{B:`"auto" lets the model return plain text instead of calling the tool.`,C:`"any" forces some tool call but not necessarily extract_schema.`,D:`Array order does not guarantee call order or that the tool is chosen at all.`}},
    {q:`An engineer assumes that because a tool is listed first in the tools array, it will be called first. Why is this assumption wrong?`,
     options:[`Array order does not guarantee call order; ordering must be enforced via tool_choice or workflow control`,`It is correct — the model always calls tools top to bottom`,`The model calls tools in reverse array order, so it would be called last`,`Call order is fixed by tool name length, not array position`],
     correct:0, why:`Array position carries no ordering guarantee; deterministic sequencing comes from forced tool_choice or explicit workflow steps.`,
     traps:{B:`The model does not iterate tools top to bottom; position is not a call-order contract.`,C:`There is no reverse-order rule either; order is simply not guaranteed by position.`,D:`Name length has no bearing on when or whether a tool is called.`}},
    {q:`A design must let the model answer directly in text when no tool applies, but call a tool whenever one is relevant. Which configuration fits, and what is the key caveat?`,
     options:[`<code>tool_choice: "auto"</code>, with the caveat that it may return text instead of a tool call`,`<code>tool_choice: "any"</code>, which still allows a plain-text answer`,`A forced specific tool, which also permits text responses`,`<code>tool_choice: "auto"</code>, which guarantees a tool is always called`],
     correct:0, why:`"auto" lets the model choose between text and a tool call, with the caveat that it may legitimately respond in text.`,
     traps:{B:`"any" forces some tool call and does not allow the desired plain-text answer.`,C:`A forced specific tool requires that one tool and does not permit a free text answer.`,D:`"auto" does not guarantee a tool call; the whole point is that it may return text.`}},
    {q:`You must guarantee <code>extract_metadata</code> runs before any enrichment tool. How?`,
     options:[`Force <code>tool_choice: {"type":"tool","name":"extract_metadata"}</code> first, then process later steps in follow-up turns.`,`Put <code>extract_metadata</code> first in the tools array.`,`Mention the ordering in the system prompt.`,`Set <code>tool_choice: "auto"</code>.`],
     correct:0, why:`Forced tool selection guarantees a specific tool is called first; ordering across steps comes from follow-up turns.`,
     traps:{B:`Array order doesn't guarantee call order.`,C:`Prompt ordering is probabilistic.`,D:`<code>"auto"</code> may skip the tool entirely.`}},
    {q:`A research agent has a broad <code>fetch_url</code> tool and keeps pulling arbitrary, sometimes irrelevant pages. You want it to only load valid source documents. Best change?`,
     options:[`Replace <code>fetch_url</code> with a constrained <code>load_document</code> tool that validates document URLs`,`Keep <code>fetch_url</code> but add "only fetch documents" to the system prompt`,`Force <code>tool_choice</code> to <code>fetch_url</code> every turn`,`Give the agent every fetching tool so it has options`],
     correct:0, why:`Replacing a generic tool with a constrained alternative that validates input enforces the boundary at the tool, not via a probabilistic prompt nudge.`,
     traps:{B:`A prompt instruction is probabilistic and doesn't validate URLs.`,C:`Forcing fetch every turn breaks turns where no fetch is needed.`,D:`More fetching tools worsen selection and widen misuse.`}},
    {q:`A synthesis agent has been given the full web-search toolset and now sometimes runs searches instead of synthesizing the material it was handed. What does this illustrate?`,
     options:[`Agents tend to misuse tools outside their specialization, so tool sets should be scoped to the role`,`Synthesis agents always perform better with more tools available`,`Web search tools are incompatible with synthesis and should never coexist in a system`,`Tool misuse is purely a description problem unrelated to which agent holds the tool`],
     correct:0, why:`Out-of-role tools invite misuse; scoping each agent to role-relevant tools prevents cross-specialization errors.`,
     traps:{B:`More tools increase decision complexity and out-of-role misuse, not performance.`,C:`The tools can coexist across the system; they just shouldn't all live on the synthesis agent.`,D:`Even with good descriptions, holding out-of-role tools biases an agent toward misusing them.`}},
  ]},

/* ---------------- 2.4 MCP CONFIGURATION ---------------- */
'mcp-config':{ domain:'d2', ts:'2.4', title:`MCP server configuration`,
  eli5:`<p>Team tools go in the <strong>shared toolbox</strong> everyone gets when they pull the repo. Your personal, experimental tools go in <strong>your own drawer</strong>. And you never paste secret keys into the shared toolbox — you reference them by name.</p>`,
  real:`<p>Project scope = <code>.mcp.json</code> (committed, shared team tooling). User scope = <code>~/.claude.json</code> (personal / experimental). Use environment-variable expansion (e.g. <code>\${GITHUB_TOKEN}</code>) so secrets aren't committed — each developer sets the variable in their own environment. Tools from <strong>all</strong> configured servers are discovered at connection time and available simultaneously. MCP <em>resources</em> expose content catalogs (issue summaries, documentation hierarchies, database schemas) to cut exploratory tool calls. Prefer community servers for standard integrations (Jira, GitHub); reserve custom servers for team-specific workflows.</p>
  <h4>Scope decides who gets the server</h4>
  <ul>
    <li><strong>Project</strong> — <code>.mcp.json</code> committed at the repo root; everyone gets it on clone/pull. This is where team tooling belongs.</li>
    <li><strong>User</strong> — <code>~/.claude.json</code>; only you, never shared via VCS. Good for personal/experimental servers. Copying it to a teammate doesn't scale and leaks personal settings.</li>
  </ul>
  <h4>Secrets &amp; resources</h4>
  <ul>
    <li>Reference secrets via env-var expansion (<code>\${TOKEN}</code>) so the committed config never contains the value. If it works for the author but fails for a teammate, the teammate hasn't set the variable locally — that's expected; each developer provides their own.</li>
    <li>MCP <strong>tools</strong> = actions; MCP <strong>resources</strong> = readable content catalogs (issue summaries, schemas). Exposing resources cuts the exploratory tool calls an agent would otherwise burn discovering what exists.</li>
    <li>Build/buy: use a community server for a standard integration; reserve custom servers for team-specific workflows.</li>
  </ul>
  <h4>Make capable MCP tools win over built-ins</h4>
  <ul>
    <li>An agent will prefer a built-in like <code>Grep</code> over a more capable MCP search tool if the MCP tool's description is thin. Enhance the MCP tool's description to detail its capabilities and outputs so the agent reaches for it.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>"It works for me but a teammate doesn't get it after cloning" almost always means the server lives in <code>~/.claude.json</code> (user scope) — move it to project-scoped <code>.mcp.json</code>. But if the <em>server</em> is shared and only a referenced secret fails, the teammate simply hasn't set the env var. And note: <code>CLAUDE.md</code> holds context/instructions — it does <em>not</em> define MCP servers.</div>`,
  callout:`<b>SCOPE</b> <code>.mcp.json</code> = committed, whole team. <code>~/.claude.json</code> = personal, never shared. Secrets via <code>\${ENV_VAR}</code>, never literal.`,
  example:{ label:`Example — project .mcp.json (committed, shared)`, body:
`{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "\${GITHUB_TOKEN}" }   // env-var, not the secret
    }
  }
}
// personal/experimental servers go in ~/.claude.json instead (not shared)
// tools from ALL configured servers are discovered at connection time` },
  quick:[
    {q:`Where do you configure an MCP server so the whole team gets it via version control?`,
     options:[`<code>.mcp.json</code> (project scope)`,`<code>~/.claude.json</code>`,`Root <code>CLAUDE.md</code>`,`<code>.claude/commands/</code>`],
     correct:0, why:`Project-scoped <code>.mcp.json</code> is committed and shared.`},
    {q:`How do you keep an auth token out of a committed config?`,
     options:[`Use environment-variable expansion like <code>\${GITHUB_TOKEN}</code>`,`Paste it directly; it's fine in private repos`,`Store it in <code>CLAUDE.md</code>`,`Disable the server`],
     correct:0, why:`Env-var expansion references the secret without committing it.`},
    {q:`Your agent keeps using built-in <code>Grep</code> over a richer MCP search tool. Best fix?`,
     options:[`Enhance the MCP tool's description to detail its capabilities and outputs`,`Remove <code>Grep</code> entirely`,`Force <code>tool_choice</code> to the MCP tool every turn`,`Rename <code>Grep</code> to something obscure`],
     correct:0, why:`A richer description makes the agent prefer the more capable tool.`},
  ],
  scenario:[
    {q:`You added an MCP server and it works for you, but a new teammate doesn't get it after cloning the repo. You had configured it in <code>~/.claude.json</code>. Best fix?`,
     options:[`Move the server config to the project-scoped <code>.mcp.json</code> so it's shared via version control.`,`Tell the teammate to copy your <code>~/.claude.json</code>.`,`Add the server to the root <code>CLAUDE.md</code>.`,`Paste your token into a committed file so it just works.`],
     correct:0, why:`<code>~/.claude.json</code> is user-scoped and not shared. Project tooling belongs in committed <code>.mcp.json</code>.`,
     traps:{B:`Copying personal config doesn't scale and leaks personal settings.`,C:`<code>CLAUDE.md</code> holds context/instructions, not server definitions.`,D:`Committing secrets is a security failure; use env-var expansion.`}},
    {q:`A team wants an MCP server available to everyone on the project and tracked in version control. Where should it be configured?`,
     options:[`In <code>.mcp.json</code> at the project root, committed to the repository`,`In <code>~/.claude.json</code> user scope on each developer's machine`,`In a local untracked file that each developer edits independently`,`Hard-coded into the application source so it ships with the build`],
     correct:0, why:`Project scope .mcp.json is committed and shared, making the server available to the whole team through version control.`,
     traps:{B:`User scope ~/.claude.json is personal and not shared via VCS, so the team would not get it.`,C:`A local untracked file defeats sharing and drifts per developer.`,D:`Embedding server config in source is not the MCP configuration mechanism and is unmaintainable.`}},
    {q:`A developer wants to experiment with an MCP server personally without affecting teammates or committing anything. Which scope is appropriate?`,
     options:[`User scope in <code>~/.claude.json</code>, which is personal and not shared via VCS`,`Project scope in <code>.mcp.json</code>, committed to the repo`,`A shared team wiki page describing the server`,`The CI pipeline configuration so it runs everywhere`],
     correct:0, why:`User scope ~/.claude.json keeps the server personal and out of version control, ideal for experimentation.`,
     traps:{B:`Committing to .mcp.json shares it with the whole team, the opposite of personal experimentation.`,C:`A wiki page documents but does not configure or isolate the server.`,D:`CI configuration spreads it to every run rather than keeping it personal.`}},
    {q:`An MCP server needs a GitHub token, but the config file is committed to the repo. How should the token be supplied safely?`,
     options:[`Use environment-variable expansion (e.g. referencing a <code>GITHUB_TOKEN</code> env var) so the secret is not committed`,`Paste the token directly into <code>.mcp.json</code> so it works on every clone`,`Commit the token to a separate file in the same repository`,`Disable the server in version control and re-add the token manually each session`],
     correct:0, why:`Env-var expansion keeps the literal secret out of the committed file while still resolving it at runtime.`,
     traps:{B:`Pasting the token into a committed file leaks the secret to anyone with repo access.`,C:`A separate committed file still places the secret in version control.`,D:`Re-adding the token each session is error-prone and unnecessary when env expansion exists.`}},
    {q:`Two MCP servers are configured — one for Jira, one for an internal service. A developer asks which tools the agent can use. What is true at connection time?`,
     options:[`Tools from all configured servers are discovered at connection and available simultaneously`,`Only the first server's tools load; the second requires an explicit switch command`,`Only one server can be active per session, chosen at startup`,`Tools load lazily and only the most recently used server is reachable`],
     correct:0, why:`At connection time the agent discovers and exposes tools from every configured server simultaneously.`,
     traps:{B:`There is no first-server-only rule; both servers' tools are discovered.`,C:`Multiple servers can be active together; the session is not limited to one.`,D:`Tools are discovered at connection for all servers, not gated to one most-recent server.`}},
    {q:`An agent burns many exploratory tool calls just to list available issues and schemas before doing real work. Which MCP feature is designed to cut this overhead?`,
     options:[`MCP resources, which expose content catalogs like issue summaries and schemas directly`,`Adding more tools so each exploratory step has a dedicated call`,`Raising the per-turn tool-call limit so exploration finishes faster`,`Switching tool_choice to "any" to force quicker tool use`],
     correct:0, why:`MCP resources expose content catalogs such as issue summaries and schemas, reducing the need for exploratory tool calls.`,
     traps:{B:`More tools add selection load and do not replace exploratory discovery with a catalog.`,C:`A higher call limit lets more exploration happen but does not eliminate the need for it.`,D:`Forcing tool use does not provide the catalog content that resources supply.`}},
    {q:`A team needs a standard Jira integration and is deciding between a community MCP server and building a custom one. What is the recommended default?`,
     options:[`Prefer the community server for the standard integration, reserving custom servers for team-specific workflows`,`Always build a custom server to retain full control over every integration`,`Avoid MCP servers entirely and call the Jira REST API by hand each time`,`Build a custom server and contribute it back instead of using the community one`],
     correct:0, why:`Standard integrations like Jira should use community servers; custom servers are reserved for genuinely team-specific workflows.`,
     traps:{B:`Building custom for a standard integration duplicates maintained work unnecessarily.`,C:`Hand-calling the REST API forgoes the MCP tooling the agent is designed to use.`,D:`Reinventing a community-covered integration adds maintenance even if contributed back.`}},
    {q:`A secret referenced via env-var expansion in <code>.mcp.json</code> resolves on the author's machine but fails for a teammate after they clone the repo. What is the most likely cause and fix?`,
     options:[`The teammate hasn't set the referenced environment variable locally; each developer must provide it in their own environment`,`The committed file must contain the literal secret for all clones to work`,`Env-var expansion is unsupported in .mcp.json and must be removed`,`The server must be moved to user scope to read the variable`],
     correct:0, why:`Env-var expansion resolves per environment, so each developer must set the referenced variable locally for it to work after cloning.`,
     traps:{B:`Embedding the literal secret defeats the purpose of expansion and leaks it to the repo.`,C:`Env-var expansion is the supported mechanism; removing it is not the fix.`,D:`Moving scope does not supply a variable the teammate never set; the variable must exist in their environment.`}},
    {q:`You configured a capable MCP code-search server, but the agent keeps falling back to the built-in <code>Grep</code> tool and missing the richer results. What is the recommended fix?`,
     options:[`Enhance the MCP tool's description to explain its capabilities and outputs so the agent prefers it over Grep`,`Disable the built-in Grep tool for the whole session`,`Force <code>tool_choice</code> to the MCP tool on every turn`,`Lower the agent's temperature so it picks the MCP tool`],
     correct:0, why:`Agents default to built-ins when an MCP tool's description is thin; a detailed description of its capabilities and outputs makes the agent prefer it.`,
     traps:{B:`Disabling Grep removes a useful tool and breaks cases where it's the right choice.`,C:`Forcing it every turn breaks legitimate uses of other tools, including Grep.`,D:`Temperature doesn't fix an under-described tool the model can't tell is better.`}},
    {q:`A platform team must decide where to invest: a Jira integration (standard, widely used) and an internal deployment-orchestration workflow unique to their company. What's the right build/buy split?`,
     options:[`Use a community MCP server for Jira; build a custom server for the unique internal deployment workflow`,`Build custom servers for both to keep everything consistent`,`Use community servers for both and bend the Jira one to fit deployment`,`Skip MCP and script both integrations by hand`],
     correct:0, why:`Buy the standard (community Jira), build the team-specific (custom deployment) — the recommended default split.`,
     traps:{B:`Rebuilding Jira duplicates maintained community work for no benefit.`,C:`No community server matches a unique internal workflow; bending Jira's is a hack.`,D:`Hand-scripting forgoes the MCP tooling agents are designed to use.`}},
  ]},

/* ---------------- 2.5 BUILT-IN TOOLS ---------------- */
'builtin-tools':{ domain:'d2', ts:'2.5', title:`Built-in tools (Read/Write/Edit/Bash/Grep/Glob)`,
  eli5:`<p>Different jobs, different tools. <strong>Grep</strong> searches <em>inside</em> files for text. <strong>Glob</strong> finds files <em>by name</em>. <strong>Read/Write</strong> handle whole files; <strong>Edit</strong> makes a precise change but needs a unique spot to anchor to. <strong>Bash</strong> runs shell commands. Picking the right one first saves a pile of wasted steps.</p>`,
  real:`<p>Claude Code's built-in tools each have a sharp purpose. Choosing correctly the <em>first</em> time is the skill being tested.</p>
  <h4>Which tool for which job</h4>
  <ul>
    <li><strong>Grep</strong> — <em>content</em> search. Search file contents for patterns: function names, error messages, import statements, callers of a function. This is your codebase-exploration workhorse.</li>
    <li><strong>Glob</strong> — <em>path/name</em> pattern matching. Find files by name or extension (e.g. <code>**/*.test.tsx</code>, <code>src/**/*.py</code>). It matches paths, not contents.</li>
    <li><strong>Read</strong> — load a full file's contents (then follow imports, trace flows).</li>
    <li><strong>Write</strong> — write/overwrite a full file.</li>
    <li><strong>Edit</strong> — targeted modification via <em>unique</em> text matching. The old string must appear exactly once, or Edit can't find a safe anchor.</li>
    <li><strong>Bash</strong> — run shell commands (build, test, git, scripts). Not for searching code — use Grep/Glob, which are purpose-built and structured.</li>
  </ul>
  <h4>Edit's unique-anchor rule (and the fallback)</h4>
  <ul>
    <li>Edit needs the target text to be <strong>unique</strong> in the file. When the text isn't unique, Edit fails — the reliable fallback is <strong>Read the full file, then Write the modified version</strong>. Don't re-run Edit with the same args (it reproduces the failure) and don't recreate from memory (destructive).</li>
  </ul>
  <h4>Build understanding incrementally</h4>
  <ul>
    <li>Don't read every file upfront. Start with <strong>Grep</strong> to find entry points / a symbol, then <strong>Read</strong> to follow imports and trace flows. Spend reads where they matter.</li>
    <li>To trace a function used across wrapper modules: first identify all exported names, then Grep for each name across the codebase to find every usage.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>Grep vs Glob is the classic mix-up. "Find every <em>caller</em> of <code>processPayment</code>" → <strong>Grep</strong> (searching contents). "Find every <code>*.test.tsx</code> file" → <strong>Glob</strong> (matching paths). Using <code>Bash ls</code>/<code>grep</code> for these works but bypasses the structured, purpose-built tools — pick the dedicated tool first.</div>`,
  callout:`<b>GREP vs GLOB</b> Grep = search <em>inside</em> files (function names, errors, imports). Glob = find files <em>by name/path</em> (<code>**/*.test.tsx</code>). Edit needs a unique anchor; else Read + Write.`,
  example:{ label:`Example — picking the right built-in`, body:
`# find every caller of a function  -> GREP (content search)
Grep  pattern="processPayment\\("   path="src"   output_mode="files_with_matches"

# find all test files by name       -> GLOB (path pattern)
Glob  pattern="**/*.test.tsx"

# targeted change to a unique line   -> EDIT (unique anchor)
Edit  old_string="const PORT = 3000"   new_string="const PORT = 8080"

# anchor text not unique? Edit fails  -> READ the file, then WRITE it back
Read  file_path="src/config.ts"        # then Write the modified contents

# run the suite                       -> BASH (shell)
Bash  command="npm test"` },
  quick:[
    {q:`You need to find every file matching <code>**/*.test.tsx</code> by name. Which tool?`,
     options:[`Glob — path/name pattern matching`,`Grep — content search`,`Read every file and check the name`,`Bash <code>cat</code>`],
     correct:0, why:`Glob matches file paths by pattern; it's the tool for finding files by name/extension.`},
    {q:`You need to find every caller of <code>processPayment</code> across the codebase. Which tool?`,
     options:[`Grep — search file contents for the name`,`Glob — match file paths`,`Read all files and scan manually`,`Bash <code>ls</code>`],
     correct:0, why:`Grep searches file contents for patterns like function names.`},
    {q:`<code>Edit</code> fails because the target text isn't unique in the file. Most reliable fallback?`,
     options:[`Read the full file, then Write the modified version`,`Run <code>Edit</code> again with the same arguments`,`Use Glob to find the file again`,`Delete and recreate the file from memory`],
     correct:0, why:`When Edit can't find a unique anchor, Read + Write reliably applies the change.`},
  ],
  scenario:[
    {q:`You need to find every caller of a function across a large codebase. Which built-in tool is the right first choice?`,
     options:[`Grep — search file contents for the function name.`,`Glob — match file paths by pattern.`,`Read every file and scan manually.`,`Bash <code>ls</code>.`],
     correct:0, why:`Grep searches file contents for patterns like function names.`,
     traps:{B:`Glob matches names/paths, not contents.`,C:`Reading everything is wasteful.`,D:`<code>ls</code> lists files; it doesn't search code.`}},
    {q:`An <code>Edit</code> fails because the target text isn't unique in the file. Most reliable fallback?`,
     options:[`Read the full file, then Write the modified version.`,`Run <code>Edit</code> again with the same arguments.`,`Use Glob to find the file again.`,`Delete and recreate the file from memory.`],
     correct:0, why:`When Edit can't find a unique anchor, Read + Write reliably applies the change.`,
     traps:{B:`Same args reproduce the failure.`,C:`Glob finds files, not edits.`,D:`Recreating from memory is destructive.`}},
    {q:`You want to locate all React test files in a monorepo so you can run them. Which tool finds the files by name?`,
     options:[`Glob with a pattern like <code>**/*.test.tsx</code>`,`Grep for the word "test" inside files`,`Read each directory's index and list manually`,`Bash <code>find / -name</code> across the whole disk`],
     correct:0, why:`Glob matches file paths by name/extension pattern — exactly the job for finding test files.`,
     traps:{B:`Grep searches contents, returning many false positives, not a clean file list.`,C:`Manual listing is slow and error-prone versus a glob pattern.`,D:`A disk-wide find is overbroad; Glob scoped to the repo is the purpose-built choice.`}},
    {q:`You're new to a codebase and need to understand how authentication flows. What's the most efficient approach?`,
     options:[`Grep for an entry point (e.g. "login"/"authenticate"), then Read those files and follow imports`,`Read every file in the repository upfront, then start`,`Glob for all <code>*.ts</code> files and open them in order`,`Run the app under a debugger and step through everything`],
     correct:0, why:`Incremental understanding: Grep to find entry points, then Read to follow imports and trace flows — rather than reading everything upfront.`,
     traps:{B:`Reading all files upfront wastes context and time.`,C:`Globbing every file gives a list, not an understanding of the flow.`,D:`A debugger trace is heavier than needed for reading the flow.`}},
    {q:`You must change a config value <code>const PORT = 3000</code> that appears exactly once in a file. Which tool is the right first choice?`,
     options:[`Edit with the unique <code>old_string</code> as the anchor`,`Write the whole file from scratch`,`Grep to replace the value in place`,`Bash <code>sed -i</code> on the file`],
     correct:0, why:`A unique target text is exactly what Edit is for — a targeted modification with a reliable anchor.`,
     traps:{B:`Rewriting the whole file risks losing surrounding content unnecessarily.`,C:`Grep searches; it does not modify files.`,D:`A raw sed bypasses the purpose-built Edit tool and risks unintended matches.`}},
    {q:`You need to trace how a utility function is used across several wrapper modules that re-export it under different names. What's the right strategy?`,
     options:[`First identify all the exported names, then Grep for each name across the codebase to find every usage`,`Grep only the original function name and stop`,`Glob for the wrapper files and assume the usages`,`Read every file in the repo to be safe`],
     correct:0, why:`Tracing across wrappers means enumerating the exported names first, then searching for each — re-exports hide usages under the original name alone.`,
     traps:{B:`The original name misses usages that go through renamed re-exports.`,C:`Globbing finds the wrapper files but not where the function is actually called.`,D:`Reading everything is wasteful when targeted Grep on each name suffices.`}},
    {q:`You need to run the project's test suite and then commit the result. Which built-in tool handles these shell operations?`,
     options:[`Bash — it runs shell commands like <code>npm test</code> and <code>git commit</code>`,`Grep — search the test files first`,`Edit — modify the test config`,`Glob — list the test files`],
     correct:0, why:`Bash is for running shell commands such as test runners, builds, and git operations.`,
     traps:{B:`Grep searches contents; it doesn't execute commands.`,C:`Edit modifies files; it doesn't run a suite.`,D:`Glob lists files; it doesn't run them.`}},
    {q:`You searched for a string to Edit, but it appears three times in the file and Edit reports a non-unique match. Which approach reliably makes the targeted change?`,
     options:[`Read the file, then Write back the version with only the intended occurrence changed`,`Re-issue the same Edit and hope it picks the right one`,`Glob the file path and retry Edit`,`Delete the file and rewrite it from memory`],
     correct:0, why:`When Edit can't find a unique anchor, Read + Write is the reliable fallback for applying the change.`,
     traps:{B:`The same non-unique args reproduce the failure.`,C:`Glob locates files; it does not resolve a non-unique edit anchor.`,D:`Rewriting from memory risks losing real content and is destructive.`}},
    {q:`A teammate suggests using <code>Bash grep -r</code> to find error-message strings across the repo. What's the recommended built-in for this content search?`,
     options:[`Grep — the purpose-built content-search tool, preferred over raw shell grep`,`Glob — it matches file contents`,`Read — open each file and scan visually`,`Edit — search and replace the strings`],
     correct:0, why:`Grep is the dedicated content-search tool; reach for it before shelling out to raw grep for structured, reliable results.`,
     traps:{B:`Glob matches paths/names, not file contents.`,C:`Reading every file to scan is slow and unnecessary.`,D:`Edit modifies a unique anchor; it isn't a search tool.`}},
    {q:`You need to create a brand-new file that doesn't exist yet. Which tool is correct?`,
     options:[`Write — create or overwrite the full file with the new contents`,`Edit — it can create a file from a unique anchor`,`Read — load the file first`,`Glob — generate the file from a pattern`],
     correct:0, why:`Write creates a new file (or overwrites an existing one) with full contents; Edit needs existing anchor text.`,
     traps:{B:`Edit modifies existing text via a unique anchor; there's nothing to anchor to in a new file.`,C:`Read loads existing content; it can't create a file.`,D:`Glob matches file paths; it doesn't create files.`}},
  ]},

};
