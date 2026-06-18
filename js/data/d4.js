// Domain 4 — Prompt Engineering & Structured Output
// Chapters (in order): explicit-criteria, few-shot, structured-output,
// validation-retry, batch, review-architectures.
export const D4 = {

'explicit-criteria':{ domain:'d4', ts:'4.1', title:`Explicit criteria & false positives`,
  eli5:`<p>"Be careful" doesn't help anyone. "Flag it <strong>only</strong> when the comment claims one thing and the code does another" does. Specific rules beat vague vibes — and one noisy category of false alarms trains people to ignore the good alarms too.</p>`,
  real:`<p>Explicit <strong>categorical</strong> criteria beat vague instructions — "be conservative" or "only report high-confidence findings" don't actually improve precision because they give the model no operational definition of what counts. High false-positive categories erode developer trust in the accurate ones. Define exactly which issues to report (correctness bugs, security) vs skip (minor style, local patterns), with a concrete code example per severity level. You can temporarily disable a noisy category while you fix its prompt rather than letting it poison the whole tool.</p>
  <h4>Why vague confidence language fails</h4>
  <ul>
    <li>"Be conservative" / "only high-confidence findings" / "be important" gives the model no <em>operational</em> definition — precision barely moves. It is the same ambiguity restated as a hedge.</li>
    <li>Precision comes from <strong>categorical criteria</strong>: name exactly which issue classes to report (null-deref, resource leaks, injection, broken authz) and which to skip (formatting, naming), versus relying on confidence-based filtering.</li>
    <li>Contrast: "flag comments only when the claimed behavior contradicts the actual code behavior" is operational; "check that comments are accurate" is not.</li>
  </ul>
  <h4>Trust is a system property</h4>
  <ul>
    <li>One noisy category trains developers to ignore the tool — <em>including</em> its accurate findings. Precision in the categories you keep matters more than coverage.</li>
    <li><strong>Temporarily disable</strong> a high-false-positive category while you fix its prompt, so its noise stops eroding trust in the accurate categories. This is an interim lever, not a permanent surrender.</li>
  </ul>
  <h4>Severity that classifies consistently</h4>
  <ul>
    <li>Define each severity level (critical, major, minor) with <strong>concrete code examples</strong> of what belongs in each — an anchored rubric, not "use good judgment" or an unanchored 1-100 score.</li>
    <li>List acceptable, idiomatic patterns explicitly so the model excludes them, instead of flagging intentional patterns as bugs.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>Levers that don't address criteria ambiguity are distractors: lowering temperature, switching models, majority-voting three runs (which actually <em>suppresses</em> real bugs caught only intermittently), or weighting/merging categories. None of these define what counts as worth reporting.</div>`,
  callout:`<b>The precision lever</b>Specific categorical report/skip criteria with per-severity examples — never vague confidence language ("be conservative", "high-confidence only"), temperature, model swaps, or voting.`,
  example:{ label:`Example — categorical review criteria (/review)`, body:
`# .claude/commands/review.md
Report ONLY:
- correctness bugs (null deref, off-by-one, race conditions)
- security issues (injection, broken authz, leaked secrets)
SKIP: style, naming, formatting, local idiomatic patterns.
For each finding: file:line - severity(critical|major) - one-line fix.
# specific categories beat "be conservative / only high-confidence".` },
  quick:[
    {q:`Adding "only report high-confidence findings" to a noisy reviewer prompt will:`,
     options:[`Reliably improve precision`,`Not meaningfully improve precision — it's vague`,`Eliminate all false positives`,`Force structured output`],
     correct:1, why:`Vague confidence instructions don't improve precision; specific categorical criteria do.`},
    {q:`Best lever to cut false positives in a code reviewer?`,
     options:[`Explicit categorical criteria + concrete examples`,`Telling it to "be conservative"`,`A larger context window`,`More tools`],
     correct:0, why:`Specific criteria define what to report vs skip; vague guidance doesn't.`},
    {q:`A reviewer's "security" findings are excellent but its "naming" findings are wrong half the time, eroding trust in the good ones. Sound interim step?`,
     options:[`Temporarily disable the naming category while you fix its prompt`,`Increase the weight of security findings`,`Raise temperature for naming checks`,`Merge all categories into one score`],
     correct:0, why:`Disabling a noisy category stops its false positives from eroding trust in accurate categories while you repair it.`},
  ],
  scenario:[
    {q:`Your automated reviewer flags too many non-issues, and developers are starting to ignore it. Most effective improvement?`,
     options:[`Define explicit categorical criteria for what to report (bugs, security) vs skip (minor style), with concrete examples per severity.`,`Add "be conservative and only flag high-confidence issues" to the prompt.`,`Lower the model temperature.`,`Run the same review three times and vote.`],
     correct:0, why:`Precision comes from specific categorical criteria, not confidence-based hedging.`,
     traps:{B:`Vague confidence language doesn't improve precision.`,C:`Temperature doesn't address criteria ambiguity.`,D:`Voting can suppress real but intermittently-caught issues.`}},
    {q:`A teammate suggests adding "Be conservative and only report high-confidence findings" to a noisy reviewer. Why is this likely to underperform?`,
     options:[`Vague instructions like "be conservative" don't reliably improve precision; you must define which categories to report vs skip.`,`Conservative phrasing increases temperature, raising randomness.`,`It eliminates true positives along with false positives at an equal rate.`,`Confidence language only works when paired with a JSON schema.`],
     correct:0, why:`Explicit categorical criteria outperform vague conservatism, which does not actually move precision.`,
     traps:{B:`Prompt wording doesn't change the temperature parameter.`,C:`The problem is unspecified criteria, not a guaranteed equal-rate loss.`,D:`A schema governs output shape, not which findings qualify.`}},
    {q:`A reviewer produces accurate security findings but many false-positive "style" complaints, and developers ignore all its output. Best first move?`,
     options:[`Define explicitly which issues to report (bugs, security) and which to skip (minor style), with concrete examples per severity.`,`Lower temperature to 0 so it stops inventing style issues.`,`Run the prompt three times and majority-vote each finding.`,`Add "do not be pedantic" to the end of the prompt.`],
     correct:0, why:`Explicit inclusion/exclusion criteria with examples fix which categories get reported, restoring trust.`,
     traps:{B:`Temperature controls randomness, not whether nitpicks meet the bar.`,C:`Voting on an ambiguous criterion just averages the same ambiguity.`,D:`"Do not be pedantic" is exactly the vague instruction that fails.`}},
    {q:`Two candidate instructions: (A) "Report null-deref, resource-leak, and injection bugs; skip formatting and naming" or (B) "Report important issues only." Which yields more consistent precision?`,
     options:[`A, because explicit categorical criteria define exactly what qualifies, unlike the subjective word "important".`,`B, because shorter prompts always generalize better.`,`B, because "important" lets the model use broader judgment.`,`Neither differs; both depend only on temperature.`],
     correct:0, why:`Naming concrete categories to include and exclude produces consistent precision; "important" is undefined.`,
     traps:{B:`Brevity is irrelevant; an undefined term is the problem.`,C:`Broad subjective judgment is exactly what causes inconsistency.`,D:`Criteria clarity, not temperature, drives the difference.`}},
    {q:`A stakeholder insists "only report high-confidence findings" will cut false positives. Before changing the categorical criteria, what should you tell them?`,
     options:[`That phrase doesn't reliably improve precision on its own; the fix is concrete report/skip categories with examples.`,`That phrase guarantees a measurable precision gain of about 30%.`,`Confidence wording only works at temperature 0.`,`High-confidence wording must be paired with majority voting to take effect.`],
     correct:0, why:`"Only report high-confidence findings" is the canonical vague instruction that does not actually improve precision.`,
     traps:{B:`There is no guaranteed precision gain from that phrasing.`,C:`Temperature does not activate confidence wording.`,D:`Voting does not rescue an ambiguous criterion.`}},
    {q:`You want each reported issue to carry a meaningful severity so triage is reliable. Most effective prompt design?`,
     options:[`Define each severity level (critical, major, minor) with concrete examples of what belongs in each.`,`Instruct the model to "use good judgment on severity".`,`Ask for a numeric 1-100 score with no rubric.`,`Let severity emerge from running the prompt at higher temperature.`],
     correct:0, why:`Concrete per-severity examples turn an ambiguous label into a consistent, applicable rule.`,
     traps:{B:`"Good judgment" is the vague instruction that fails to standardize severity.`,C:`An unanchored numeric score is just as subjective as a vague label.`,D:`Temperature adds variance, not a usable rubric.`}},
    {q:`The reviewer keeps flagging intentional, idiomatic patterns as bugs. Which criteria change best reduces this?`,
     options:[`Explicitly list which patterns are acceptable and excluded from reporting, with examples.`,`Tell the model to "avoid false positives".`,`Switch the model to a smaller, faster variant.`,`Increase the number of findings requested per file.`],
     correct:0, why:`Naming acceptable patterns to exclude gives the model a concrete boundary, cutting those false positives.`,
     traps:{B:`"Avoid false positives" is vague and specifies nothing.`,C:`Model size doesn't encode which patterns are intentional.`,D:`Requesting more findings increases false positives.`}},
    {q:`Why does a single noisy reporting category pose an outsized risk to a reviewer's adoption?`,
     options:[`Its false positives erode developer trust in the reviewer's other, accurate categories too.`,`It increases the token cost of every other category.`,`It forces the model into a higher temperature globally.`,`It permanently corrupts the model's weights for that repo.`],
     correct:0, why:`High false-positive categories erode trust in the accurate ones, so one bad category can sink adoption.`,
     traps:{B:`A noisy category doesn't raise other categories' token cost.`,C:`Categories don't change the temperature parameter.`,D:`Prompting doesn't alter model weights.`}},
    {q:`You're drafting criteria for a new "dependency-risk" check. Which approach most directly produces dependable output?`,
     options:[`State the exact conditions to report (known-CVE versions, unmaintained packages) and what to skip, with an example of each.`,`Instruct it to "flag anything risky about dependencies".`,`Provide only a temperature setting and let the model decide scope.`,`Ask it to vote across three runs without defining the criteria.`],
     correct:0, why:`Exact report/skip conditions with examples give the check a concrete, repeatable definition.`,
     traps:{B:`"Anything risky" is undefined and yields inconsistent scope.`,C:`Temperature is not a substitute for defined criteria.`,D:`Voting on undefined criteria cannot create a definition.`}},
    {q:`Which prompt phrasing reflects an operational criterion rather than a vague one?`,
     options:[`"Flag a comment only when its claimed behavior contradicts the actual code behavior."`,`"Check that comments are accurate."`,`"Be thorough but conservative about comments."`,`"Only report comment issues you're confident about."`],
     correct:0, why:`A contradiction-with-code rule is operational and testable; "accurate", "conservative", and "confident" are undefined.`,
     traps:{B:`"Accurate" leaves the bar undefined.`,C:`"Conservative" is the canonical vague hedge.`,D:`"Confident about" is confidence-based filtering, not a criterion.`}},
  ]},

'few-shot':{ domain:'d4', ts:'4.2', title:`Few-shot prompting`,
  eli5:`<p><strong>Show, don't just tell.</strong> Give Claude 2-4 worked examples of the tricky cases — including <em>why</em> one answer was chosen over a plausible alternative — and it copies that judgment, even on new cases it hasn't seen.</p>`,
  real:`<p>Few-shot examples are the <strong>most effective</strong> technique when detailed instructions still produce inconsistent output. 2-4 targeted examples covering the <em>ambiguous</em> cases (with the reasoning for the pick over a plausible alternative) teach <strong>generalizable</strong> judgment — the model extends to novel patterns rather than matching only the pre-specified ones. They also pin the exact output format (location, issue, severity, fix), reduce extraction hallucination, and distinguish acceptable patterns from real issues to cut false positives.</p>
  <h4>What good few-shot examples do</h4>
  <ul>
    <li>Teach <strong>generalizable judgment</strong> by covering the ambiguous cases (ambiguous tool selection, branch-level coverage gaps) and including the reasoning for the pick — not just easy ones. The model generalizes to novel patterns instead of memorizing.</li>
    <li>Pin the <strong>exact output format</strong> (location, issue, severity, suggested fix), reducing format drift.</li>
    <li>Reduce <strong>extraction hallucination</strong>: examples of varied document structures (inline citations vs bibliographies, methodology sections vs embedded details) and informal measurements address empty/null extraction of required fields.</li>
    <li>Distinguish acceptable code patterns from genuine issues, cutting false positives while still generalizing.</li>
  </ul>
  <h4>How many, and when</h4>
  <ul>
    <li>2-4 targeted examples is the sweet spot — enough to teach judgment without bloating the prompt. 20+ or one-per-input is over-fitting and token waste; 0-1 rarely spans the ambiguous range.</li>
    <li>Reach for few-shot when <em>detailed instructions still give inconsistent results</em>. It outperforms a longer/sterner instruction, "think carefully", a bigger model, or lowering temperature for the inconsistency problem.</li>
    <li>Each example should show a <strong>fully formed output</strong> with every field populated — not just field names, not inputs alone, not informal prose.</li>
  </ul>
  <div class="edge"><b>Related: the interview pattern</b>In an unfamiliar domain where you fear missing considerations (cache invalidation, failure modes), have Claude <em>ask you questions first</em> to surface design considerations before implementing — examples of finished code assume the design is already settled and can't surface unknowns.</div>`,
  callout:`<b>When instructions still fail</b>2-4 examples on the <em>ambiguous</em> cases, each with reasoning, generalize judgment — more than a sterner prompt, a bigger model, or temperature tuning.`,
  example:{ label:`Example — 2-4 few-shot routing examples`, body:
`&lt;example&gt;
Input: "check my order #12345"
Tool:  lookup_order    # order number present -> order tool, not get_customer
&lt;/example&gt;
&lt;example&gt;
Input: "update my email address"
Tool:  get_customer    # profile change -> customer tool
&lt;/example&gt;
# cover the AMBIGUOUS cases and show WHY, so judgment generalizes.` },
  quick:[
    {q:`Detailed instructions still give inconsistent formatting. Best fix?`,
     options:[`A few-shot examples (2-4 targeted)`,`A longer, sterner instruction`,`A bigger model`,`More tools`],
     correct:0, why:`Few-shot examples are the most effective fix for inconsistent output.`},
    {q:`How many targeted few-shot examples are typically recommended for ambiguous cases?`,
     options:[`0-1`,`2-4`,`20+`,`One per possible input`],
     correct:1, why:`2-4 targeted examples teach generalizable judgment without bloat.`},
    {q:`What makes a few-shot example most valuable for an ambiguous task?`,
     options:[`It covers an edge case and includes the reasoning for the decision`,`It is the simplest, most obvious case`,`It is drawn at random`,`It omits reasoning so the model isn't constrained`],
     correct:0, why:`Ambiguous cases with their reasoning teach judgment that generalizes to novel patterns.`},
  ],
  scenario:[
    {q:`Your agent inconsistently routes ambiguous requests between two valid tools, even though the descriptions are good. Most effective next step?`,
     options:[`Add 2-4 few-shot examples showing the chosen action for ambiguous cases, including the reasoning for picking it over the alternative.`,`Tell it to "think carefully" before choosing.`,`Remove one of the tools.`,`Increase <code>max_tokens</code>.`],
     correct:0, why:`Few-shot examples demonstrate judgment on the exact ambiguous cases and generalize to new ones.`,
     traps:{B:`Vague encouragement doesn't fix inconsistent judgment.`,C:`Removing capability isn't a routing fix.`,D:`Token limit isn't the issue.`}},
    {q:`Detailed written instructions still yield inconsistent extraction output. Generally the most effective next step?`,
     options:[`Add 2-4 targeted few-shot examples covering the ambiguous cases, including the reasoning for each choice.`,`Rewrite the instructions to be twice as long and more emphatic.`,`Lower temperature to 0 and resubmit unchanged.`,`Switch to a larger model and keep the same prompt.`],
     correct:0, why:`Few-shot examples are the most effective technique when detailed instructions still produce inconsistent output.`,
     traps:{B:`Verbose instructions repeat what already failed; examples teach judgment.`,C:`Temperature reduces variance but doesn't resolve the ambiguity.`,D:`A bigger model still lacks demonstrations of the desired judgment.`}},
    {q:`Your extraction occasionally hallucinates fields not present in the source document. How can few-shot examples help?`,
     options:[`Examples that demonstrate the exact output format and show absent fields handled correctly reduce extraction hallucination.`,`Examples raise temperature, which dilutes hallucinated tokens.`,`Examples force the API to validate against a schema automatically.`,`Examples only help with classification, never extraction.`],
     correct:0, why:`Few-shot examples demonstrate the exact output format and reduce extraction hallucination.`,
     traps:{B:`Examples don't change temperature.`,C:`Few-shot prompting doesn't invoke automatic schema validation.`,D:`Examples help extraction, including format and hallucination control.`}},
    {q:`A reviewer prompt flags too many acceptable patterns as defects. Which few-shot strategy best cuts these false positives?`,
     options:[`Include paired examples distinguishing an acceptable pattern from a genuine issue, with the reasoning.`,`Include only examples of real issues so the model errs toward flagging.`,`Include 20+ examples to overwhelm the ambiguity.`,`Include examples without labels so the model infers freely.`],
     correct:0, why:`Examples distinguishing acceptable patterns from real issues directly cut false positives while still generalizing.`,
     traps:{B:`Only positive examples bias toward more false positives.`,C:`2-4 targeted examples suffice; 20+ dilutes focus.`,D:`Unlabeled examples remove the contrast that teaches the distinction.`}},
    {q:`You want few-shot examples to lock in a consistent output structure (location, issue, severity, fix). What should each example show?`,
     options:[`A fully formed output with all four fields populated exactly as you want them.`,`Only the input, leaving the model to invent the structure.`,`The four field names listed but left blank.`,`A prose paragraph describing the issue informally.`],
     correct:0, why:`Examples demonstrating the exact output format teach the precise structure.`,
     traps:{B:`Inputs alone don't demonstrate the desired output structure.`,C:`Blank fields don't show how the fields should be filled.`,D:`Informal prose contradicts the structured format you want.`}},
    {q:`You're implementing in an unfamiliar domain and worry about missing considerations like cache invalidation or failure modes. Which technique surfaces them first?`,
     options:[`The interview pattern — have Claude ask you questions to surface considerations before implementing.`,`Implement first and fix later.`,`Add more few-shot examples of finished code.`,`Force <code>tool_choice: "any"</code>.`],
     correct:0, why:`The interview pattern surfaces design considerations before any code is written.`,
     traps:{B:`Implement-first invites costly rework.`,C:`Finished-code examples assume the design is already settled.`,D:`A forced schema governs output shape, not design discovery.`}},
    {q:`A colleague argues that since the instructions are already detailed, adding examples is redundant. Strongest counterpoint?`,
     options:[`Few-shot examples teach generalizable judgment that detailed instructions alone failed to produce consistently.`,`Examples are required by the API whenever instructions exceed a length limit.`,`Examples replace the need for any instructions at all.`,`Examples are only useful for reducing token cost.`],
     correct:0, why:`Examples are the most effective technique precisely when detailed instructions still produce inconsistent output.`,
     traps:{B:`There is no API rule tying examples to instruction length.`,C:`Examples complement instructions; they don't replace them.`,D:`Examples can increase token cost; their value is consistency.`}},
    {q:`Extraction returns empty/null for a required field across documents with varied structures (inline citations vs bibliographies). Best few-shot fix?`,
     options:[`Add examples showing correct extraction from each varied document format.`,`Mark the field required so the model must fill it.`,`Increase max_tokens so the model writes more.`,`Switch to tool_choice "auto".`],
     correct:0, why:`Examples spanning varied document structures address empty/null extraction by demonstrating where the field lives in each.`,
     traps:{B:`A required field pressures fabrication, not correct location.`,C:`Token limit isn't why fields come back empty.`,D:`"auto" governs tool calling, not extraction coverage.`}},
    {q:`Why do a few well-chosen examples beat enumerating every possible case as an example?`,
     options:[`2-4 ambiguous examples let the model generalize to novel patterns; one-per-case overfits and wastes tokens.`,`The API caps examples at four.`,`More examples always lower accuracy.`,`Enumerated cases disable the model's reasoning entirely.`],
     correct:0, why:`Few-shot teaches generalizable judgment; exhaustively enumerating cases overfits and bloats the prompt.`,
     traps:{B:`There is no hard four-example API cap.`,C:`The issue is overfitting and cost, not a guaranteed accuracy drop.`,D:`Examples guide reasoning; they don't disable it.`}},
    {q:`Your agent must judge branch-level test-coverage gaps but is inconsistent on borderline branches. Best lever?`,
     options:[`Provide 2-4 examples of borderline branches labeled covered vs gap, each with the reasoning.`,`Tell it to "be thorough about coverage".`,`Raise temperature for more ideas.`,`Ask for prose explanations instead of structured findings.`],
     correct:0, why:`Examples on the ambiguous borderline cases with reasoning teach judgment that generalizes to new branches.`,
     traps:{B:`"Be thorough" is vague and doesn't define the borderline.`,C:`Temperature adds variance, not judgment.`,D:`Prose worsens consistency rather than improving it.`}},
  ]},

'structured-output':{ domain:'d4', ts:'4.3', title:`Structured output via tool_use`,
  eli5:`<p>Want the answer as a <strong>clean filled-in form</strong> instead of a paragraph? Hand Claude the form — a JSON schema wrapped as a tool — and make it fill that out. No more broken brackets or missing commas. But a tidy form can still hold wrong numbers.</p>`,
  real:`<p><code>tool_use</code> with a JSON schema is the <strong>most reliable</strong> way to get schema-valid structured output — it eliminates JSON <em>syntax</em> errors. <code>tool_choice: "auto"</code> lets the model return prose instead of calling a tool; <code>"any"</code> guarantees <em>some</em> tool call (model picks which); forced <code>{"type":"tool","name":"…"}</code> guarantees a <em>specific</em> tool runs (e.g. before enrichment steps). Crucially, strict schemas kill syntax errors but <strong>not semantic</strong> ones (line items that don't sum, values in the wrong field). Make fields <strong>nullable/optional</strong> when the source may lack them so the model returns <code>null</code> instead of fabricating to satisfy a required field.</p>
  <h4>Syntax vs semantic — the line schemas can't cross</h4>
  <ul>
    <li>A schema guarantees <strong>shape and types</strong> (valid JSON, right fields). It does <em>not</em> guarantee the values are correct — line items can still fail to sum to the stated total, or a value can land in the wrong field.</li>
    <li>Catch semantics downstream (see validation-retry): extract <code>calculated_total</code> alongside <code>stated_total</code> and compare; add a <code>conflict_detected</code> boolean.</li>
  </ul>
  <h4>tool_choice — three modes</h4>
  <ul>
    <li><code>"auto"</code> — the model <em>may</em> answer in prose; don't use it when you must guarantee structure.</li>
    <li><code>"any"</code> — forces a tool call but the model chooses which; ideal when multiple extraction schemas exist and the document type is unknown.</li>
    <li>Forced <code>{"type":"tool","name":"extract_metadata"}</code> — guarantees a specific tool runs, e.g. metadata extraction before enrichment.</li>
  </ul>
  <h4>Schema design that prevents fabrication</h4>
  <ul>
    <li>Make a field <strong>nullable/optional</strong> when the source may not contain it — the model returns <code>null</code> instead of inventing a value to satisfy a required field. Making <em>every</em> field required is what <em>causes</em> fabrication.</li>
    <li>For open category sets, add an <code>"other"</code> enum value (with a detail string) and an <code>"unclear"</code> value, so edge cases aren't force-fit to a wrong label or dropped.</li>
    <li>Put <strong>format-normalization rules</strong> in the prompt alongside the strict schema to handle inconsistent source formatting (dates, currencies, units).</li>
  </ul>
  <div class="edge"><b>Exam trap</b>Making every field required <em>causes</em> fabrication. <code>tool_choice: "auto"</code> may skip the tool entirely — use <code>"any"</code> or a forced tool when structure must be guaranteed. And a strict schema never fixes arithmetic: that's a semantic check, not a syntax one.</div>`,
  callout:`<b>tool_choice cheat-sheet</b><code>auto</code> = may reply in prose; <code>any</code> = some tool, model picks; <code>{"type":"tool","name":…}</code> = that exact tool. Schemas kill syntax errors, never semantic ones.`,
  example:{ label:`Example — schema-constrained extraction`, body:
`tools = [{
  "name": "extract_invoice",
  "input_schema": { "type": "object",
    "properties": {
      "total":     { "type": ["number", "null"] },  // nullable -&gt; no fabrication
      "po_number": { "type": ["string", "null"] }
    }, "required": ["total"] }
}]
tool_choice = {"type": "tool", "name": "extract_invoice"}
# schema kills SYNTAX errors, not SEMANTIC ones (e.g. lines that don't sum).` },
  quick:[
    {q:`Most reliable way to get guaranteed schema-compliant structured output?`,
     options:[`Ask for JSON in the prompt and parse the text`,`<code>tool_use</code> with a JSON schema`,`Regex over the model's prose`,`A longer system prompt`],
     correct:1, why:`Tool use with a JSON schema eliminates syntax errors.`},
    {q:`Strict JSON schemas via tool use eliminate which errors?`,
     options:[`Both syntax and semantic errors`,`Syntax errors only (not semantic ones like totals that don't sum)`,`Semantic errors only`,`Neither`],
     correct:1, why:`Schemas guarantee shape/syntax, not correctness of values.`},
    {q:`Multiple extraction schemas exist and the document type is unknown. Best tool_choice?`,
     options:[`<code>"any"</code> — forces a tool call, model picks the right schema`,`<code>"auto"</code> — may answer in prose`,`Forced specific tool every time`,`No tool_choice; rely on the prompt`],
     correct:0, why:`"any" guarantees a structured tool call while letting the model select the matching schema.`},
  ],
  scenario:[
    {q:`Your extraction sometimes <em>fabricates</em> a value for a required field when the source simply doesn't contain it. Best schema fix?`,
     options:[`Make that field nullable/optional so the model can return <code>null</code> when the info is absent.`,`Make every field required so the model tries harder.`,`Remove the schema and parse free text.`,`Switch to <code>tool_choice: "auto"</code>.`],
     correct:0, why:`Nullable/optional fields let the model represent "not present" instead of being forced to fabricate.`,
     traps:{B:`Required fields are exactly what pressures fabrication.`,C:`Free text reintroduces syntax errors and unreliability.`,D:`<code>auto</code> may skip the tool entirely; it doesn't fix fabrication.`}},
    {q:`You need machine-parseable JSON and keep hitting malformed-JSON parse failures. Most reliable fix?`,
     options:[`Use tool_use with a JSON schema, which eliminates JSON syntax errors.`,`Ask for JSON in the prompt and add "return valid JSON only".`,`Post-process the text output with a regex JSON repair pass.`,`Lower temperature to 0 and hope for clean braces.`],
     correct:0, why:`tool_use with a JSON schema is the most reliable way to get schema-valid output and eliminates syntax errors.`,
     traps:{B:`A prompt instruction doesn't guarantee valid JSON.`,C:`Regex repair is brittle and reactive.`,D:`Temperature reduces variance but doesn't guarantee valid structure.`}},
    {q:`You must guarantee the model calls a tool (rather than replying in prose) on every request. Which setting?`,
     options:[`Set tool_choice to "any" so a tool call is guaranteed.`,`Set tool_choice to "auto" and add a strong instruction.`,`Set temperature to 0.`,`Provide only one tool and rely on the model to notice.`],
     correct:0, why:`tool_choice "any" guarantees a tool call.`,
     traps:{B:`"auto" lets the model answer in prose instead.`,C:`Temperature doesn't force a tool call.`,D:`Offering one tool doesn't force its invocation.`}},
    {q:`You need to guarantee a specific tool (extract_metadata) runs before enrichment steps. Which configuration?`,
     options:[`Force the tool with tool_choice {"type":"tool","name":"extract_metadata"}.`,`Use tool_choice "any" and hope the right one is picked.`,`List the desired tool first and rely on positional bias.`,`Set tool_choice "auto" with a detailed description.`],
     correct:0, why:`A forced tool_choice of type tool with a name guarantees that specific tool is called.`,
     traps:{B:`"any" guarantees a tool call but not which.`,C:`Ordering alone doesn't guarantee the choice.`,D:`"auto" may not call the tool at all.`}},
    {q:`Your strict schema eliminated all JSON syntax errors, yet invoices still come back where line items don't sum to the stated total. Why?`,
     options:[`Strict schemas kill syntax errors but not semantic errors like a sum mismatch.`,`The schema must have been invalid; strict schemas catch arithmetic too.`,`tool_choice was set to "auto" instead of "any".`,`Temperature was above 0, corrupting the numbers.`],
     correct:0, why:`A strict schema guarantees valid structure but cannot catch semantic errors such as line items not summing.`,
     traps:{B:`Schemas validate shape and types, not arithmetic.`,C:`tool_choice governs whether a tool is called, not arithmetic.`,D:`Temperature is not why the math fails to reconcile.`}},
    {q:`Some documents lack a "tax_id" field, and your required-field schema causes the model to fabricate one. Right schema change?`,
     options:[`Make the field nullable/optional so the model returns null instead of fabricating.`,`Keep it required but add "do not guess" to the prompt.`,`Force a tool call so the field is always populated.`,`Raise temperature so the model varies its guesses.`],
     correct:0, why:`Nullable/optional lets the model return null when the source lacks the field, instead of fabricating.`,
     traps:{B:`A required field still pressures invention.`,C:`Forcing a tool call doesn't make a missing value present.`,D:`Higher temperature produces more varied fabrications.`}},
    {q:`Your classification schema uses a fixed enum, but real inputs occasionally fall outside the categories and get jammed into a wrong bucket. Which design handles this?`,
     options:[`Add an extensible "other" value with a detail string (and "unclear" for ambiguous cases).`,`Remove the enum and accept free-text labels.`,`Add more required fields to compensate.`,`Force the closest enum match via the prompt.`],
     correct:0, why:`Extensible enums ("other" + detail, "unclear") handle out-of-enum inputs cleanly.`,
     traps:{B:`Free text discards the controlled vocabulary entirely.`,C:`Extra required fields don't address out-of-enum.`,D:`Forcing the closest match is the wrong-bucket behavior to avoid.`}},
    {q:`Which statement best captures the boundary of what a strict tool_use JSON schema guarantees?`,
     options:[`It guarantees syntactically valid, schema-conformant output but not semantic correctness of the values.`,`It guarantees both valid syntax and correct arithmetic.`,`It guarantees the model calls the correct tool every time without tool_choice.`,`It guarantees absent source fields are filled with accurate values.`],
     correct:0, why:`Strict schemas eliminate syntax/structure errors but cannot ensure values are semantically correct.`,
     traps:{B:`Schemas don't validate arithmetic.`,C:`Tool selection requires tool_choice.`,D:`Schemas can't supply values absent from the source.`}},
    {q:`Source documents format dates and currencies inconsistently. How do you handle this alongside a strict output schema?`,
     options:[`Add format-normalization rules in the prompt (e.g. dates to ISO 8601) alongside the strict schema.`,`Make the date field required so the model fixes the format.`,`Switch to free-text output and normalize later.`,`Lower temperature so formats stabilize.`],
     correct:0, why:`Normalization rules in the prompt handle inconsistent source formatting; the schema enforces the resulting shape.`,
     traps:{B:`Required-ness doesn't define a target format.`,C:`Free text abandons the structured guarantee.`,D:`Temperature doesn't normalize formats.`}},
    {q:`A field frequently has no answer in the source, and you want the model to be honest about that. Best combination?`,
     options:[`Make the field nullable so the model returns null when data is genuinely absent.`,`Mark it required and lower temperature to discourage guessing.`,`Use tool_choice "any" so the field is always emitted with a value.`,`Add a second required copy of the field for redundancy.`],
     correct:0, why:`A nullable field lets the model return null for absent data rather than fabricating.`,
     traps:{B:`A required field still pushes toward fabrication regardless of temperature.`,C:`Forcing a tool call still demands a value for a required field.`,D:`Duplicating a required field doubles the fabrication.`}},
  ]},

'validation-retry':{ domain:'d4', ts:'4.4', title:`Validation, retry & feedback loops`,
  eli5:`<p>If the answer fails a check, tell Claude <strong>exactly</strong> what was wrong and let it fix that. But if the information simply <strong>isn't in the document</strong>, retrying won't conjure it out of thin air — that's a different problem entirely.</p>`,
  real:`<p><strong>Retry-with-error-feedback</strong>: on failure, send a follow-up containing the original document, the failed extraction, and the <em>specific</em> validation error so the model self-corrects. This works for <strong>format/structural</strong> errors but is useless when the required info is <strong>absent from the source</strong> (e.g. it lives only in an external document you never provided). Add <strong>semantic self-checks</strong> — extract <code>calculated_total</code> alongside <code>stated_total</code> to flag arithmetic mismatches, add a <code>conflict_detected</code> boolean for contradictory source data — and track a <code>detected_pattern</code> field to analyze which constructs drive dismissed (false-positive) findings.</p>
  <h4>What retry can and can't fix</h4>
  <ul>
    <li><strong>Can fix</strong> — format/structural errors (wrong date format, missing field, malformed output). The follow-up must include the original input, the failed output, and the <em>specific</em> error so the fix is targeted.</li>
    <li><strong>Can't fix</strong> — information genuinely absent from the source. No retry conjures a figure that was never provided; that's a data-availability problem, not a format one. Identifying this up front saves wasted calls.</li>
  </ul>
  <h4>Make validation semantic, not just structural</h4>
  <ul>
    <li>Tool-use schemas already eliminate syntax errors. Semantic errors slip through: extract <code>calculated_total</code> next to <code>stated_total</code> and flag arithmetic mismatches the schema would pass.</li>
    <li>Add a <code>conflict_detected</code> boolean when the source itself contains contradictory information the model had to reconcile.</li>
    <li>Add a <code>detected_pattern</code> field to each finding so you can analyze, over time, which code constructs trigger false positives developers dismiss.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>Independent review beats self-review: asking the same session that produced an output to "review more carefully" keeps its generation bias (covered in review-architectures). Treating absent-data failures like format failures just burns retries. A schema can't catch arithmetic — that needs a semantic self-check.</div>`,
  callout:`<b>Retry decision rule</b>Format/structural error -&gt; retry with the specific error fed back. Required data absent from source -&gt; retry is hopeless; it's a data problem, not a format one.`,
  example:{ label:`Example — retry-with-error-feedback`, body:
`# only format/structural failures are worth retrying - feed the SPECIFIC error
followup = [
  {"role": "user",      "content": original_doc},
  {"role": "assistant", "content": failed_extraction},
  {"role": "user",      "content": "date must be ISO 8601 (YYYY-MM-DD). Re-extract."}
]
# data absent from the source can't be conjured by retrying - don't.
# semantic self-check: emit calculated_total beside stated_total; flag mismatch.` },
  quick:[
    {q:`A required value is simply not present in the source document. Will retry-with-feedback fix it?`,
     options:[`Yes, eventually`,`No — the information is absent; retries can't create it`,`Only with a bigger model`,`Only in batch mode`],
     correct:1, why:`Retries help with format/structural errors, not missing source information.`},
    {q:`Which failure is a good candidate for retry-with-error-feedback?`,
     options:[`Data that doesn't exist in the document`,`A format mismatch / structural output error`,`A network outage`,`A policy violation`],
     correct:1, why:`Format and structural errors are correctable by feeding back the specific error.`},
    {q:`How do you flag invoices where extracted line items don't match the stated total?`,
     options:[`Extract calculated_total alongside stated_total and flag mismatches`,`Tighten the JSON schema to forbid mismatches`,`Set tool_choice to "any"`,`Lower temperature so the math is more accurate`],
     correct:0, why:`A calculated_total vs stated_total self-check catches a semantic error a schema cannot.`},
  ],
  scenario:[
    {q:`Two failures: (1) a date came back in the wrong format, and (2) a required revenue figure that only exists in an external document you never provided. Which is worth retrying with error feedback?`,
     options:[`Only #1 (format mismatch) — #2's information is absent from the source, so retrying can't fix it.`,`Both, identically.`,`Only #2 — retries always eventually succeed.`,`Neither; never retry extractions.`],
     correct:0, why:`Retry-with-feedback corrects format/structural errors; it can't supply information that isn't in the source.`,
     traps:{B:`Treating absent-data the same as a format error wastes calls.`,C:`Retries can't conjure missing information.`,D:`Retry is valuable for the right failure classes.`}},
    {q:`Your first extraction fails a structural validation check. Best retry strategy for self-correction?`,
     options:[`Send a follow-up with the original document, the failed extraction, and the specific validation error.`,`Resubmit the same prompt unchanged and hope for variance.`,`Lower temperature and retry without mentioning the error.`,`Switch to the Batches API for the retry.`],
     correct:0, why:`Retry-with-error-feedback (original doc, failed extraction, specific error) lets the model self-correct.`,
     traps:{B:`Blind resubmission gives nothing to correct.`,C:`Without the specific error the model can't target the fix.`,D:`Batching changes throughput, not the correction mechanism.`}},
    {q:`A required value isn't present anywhere in the source. Why will retry-with-error-feedback fail?`,
     options:[`Retry feedback corrects format/structural errors but is useless when the required info is absent from the source.`,`Retry feedback only works at temperature 0.`,`Retry feedback requires the Batches API to function.`,`Retry feedback can only run once per document.`],
     correct:0, why:`Retry works for format/structural errors but is useless when the info is absent from the source.`,
     traps:{B:`Temperature is unrelated to whether the data exists.`,C:`Retry doesn't depend on the Batches API.`,D:`There's no inherent one-retry limit; the issue is missing data.`}},
    {q:`You want a structured signal whenever the source contains contradictory information the model had to reconcile. Cleanest way?`,
     options:[`Add a conflict_detected boolean field to the output schema.`,`Ask the model to mention conflicts in free-text prose.`,`Increase temperature so conflicts become visible.`,`Run the extraction twice and diff the outputs.`],
     correct:0, why:`A conflict_detected boolean gives a structured, queryable signal of source contradictions.`,
     traps:{B:`Free-text mentions are hard to parse programmatically.`,C:`Temperature doesn't expose source conflicts.`,D:`Diffing two runs detects model variance, not source contradictions.`}},
    {q:`Your reviewer produces false positives and you want to analyze them systematically over time. Which output addition helps most?`,
     options:[`Track a detected_pattern field so you can later analyze which patterns drive false positives.`,`Remove all metadata to keep outputs small.`,`Raise temperature to diversify the findings.`,`Disable structured output and read the prose.`],
     correct:0, why:`A detected_pattern field lets you analyze which code constructs drive dismissed findings over time.`,
     traps:{B:`Stripping metadata removes the signal needed for analysis.`,C:`More randomness obscures the patterns.`,D:`Unstructured prose is far harder to aggregate.`}},
    {q:`When retry-with-error-feedback IS appropriate, which inputs must the follow-up include for effective self-correction?`,
     options:[`The original document, the failed extraction, and the specific validation error.`,`Only the specific validation error, to keep the prompt short.`,`Only the original document, so the model starts fresh.`,`A larger model name and nothing else.`],
     correct:0, why:`The follow-up must include the original document, the failed extraction, and the specific error.`,
     traps:{B:`The error alone gives no context to fix.`,C:`Starting fresh discards the failed attempt and the targeted error.`,D:`Swapping models isn't the retry mechanism.`}},
    {q:`A schema-valid extraction passes structurally, but a reviewer notices a value landed in the wrong field. Why didn't the schema catch it, and what does?`,
     options:[`Wrong-field placement is a semantic error; a self-check comparing extracted values against source context catches it.`,`The schema was malformed; fixing it catches wrong-field placement.`,`tool_choice "auto" caused it; switch to "any".`,`Temperature corrupted the mapping; lower it.`],
     correct:0, why:`Values in the wrong field are semantic, not syntax; schemas pass them, so a semantic self-check is required.`,
     traps:{B:`A valid schema still can't validate which value belongs where.`,C:`tool_choice governs tool invocation, not field semantics.`,D:`Temperature isn't the cause of field mis-mapping.`}},
    {q:`A batch of extractions failed because the documents exceeded the context limit. Is retry-with-error-feedback the right tool?`,
     options:[`No — that's a structural input problem; chunk the documents and resubmit, rather than feeding back a validation error.`,`Yes — feed back "too long" and the model will shorten the source.`,`Yes — retries always fix context-limit failures.`,`No — context-limit failures are never recoverable.`],
     correct:0, why:`Context-limit failures are fixed by chunking the input and resubmitting, not by error-feedback retries.`,
     traps:{B:`The model can't shorten a source it can't fully read.`,C:`Retry feedback doesn't address an input that doesn't fit.`,D:`Chunking makes them recoverable.`}},
    {q:`You want self-correction validation that flags arithmetic discrepancies automatically. Which design fits?`,
     options:[`Have the model emit calculated_total alongside stated_total and compare them programmatically.`,`Add "double-check the math" to the prompt and trust the prose.`,`Make the total field required.`,`Run the extraction in batch mode for accuracy.`],
     correct:0, why:`Emitting both totals and comparing is a concrete semantic self-check the schema can't perform.`,
     traps:{B:`Prose "double-check" yields no queryable signal.`,C:`Required-ness doesn't validate arithmetic.`,D:`Batch mode doesn't improve correctness.`}},
    {q:`After a format-mismatch retry succeeds, a second field still fails because that data was never in the document. What's the correct read of the situation?`,
     options:[`Mixed failure: the format error was retry-correctable; the absent-data field is not and shouldn't be retried.`,`All failures in one extraction share the same cause; retry both.`,`The retry corrupted the second field; revert.`,`Absent data becomes available after one successful retry.`],
     correct:0, why:`Failures must be classified individually: format errors retry well; absent-data errors never will.`,
     traps:{B:`Failures can have different causes within one extraction.`,C:`A successful format retry doesn't corrupt unrelated fields.`,D:`A retry can't make absent data appear.`}},
  ]},

'batch':{ domain:'d4', ts:'4.5', title:`Batch processing`,
  eli5:`<p>Two checkout lanes. The <strong>express lane</strong> is instant but full price — use it for things you're standing there waiting on. The <strong>overnight drop-box</strong> is half price and ready by tomorrow — use it for things that can wait.</p>`,
  real:`<p>The <strong>Message Batches API</strong>: ~<strong>50% cheaper</strong>, up to a <strong>24-hour</strong> processing window, <strong>no latency SLA</strong>, no multi-turn tool calling within a single request, and <code>custom_id</code> to correlate request/response pairs. Use it for non-blocking, latency-tolerant work (overnight reports, weekly audits, nightly test generation) — never for blocking pre-merge checks where a developer is waiting. Resubmit only failed <code>custom_id</code>s; refine your prompt on a sample first to lift first-pass success.</p>
  <h4>The batch trade-off</h4>
  <ul>
    <li><strong>Win:</strong> ~50% cheaper; up to a 24-hour window; <code>custom_id</code> correlates each request to its response (order is not guaranteed, so never rely on array position).</li>
    <li><strong>Cost:</strong> no latency SLA (minutes to hours — the 24h is a maximum, not a fixed duration), and no multi-turn tool calling within a single request (can't execute a tool mid-request and feed results back).</li>
  </ul>
  <h4>Match the API to the workload</h4>
  <ul>
    <li><strong>Latency-tolerant, non-blocking</strong> (overnight reports, weekly audits, bulk extraction) -&gt; batch. Schedule with margin (e.g. submit every 4 hours to guarantee a 30-hour SLA against a 24-hour window) and resubmit only the failed <code>custom_id</code>s, with modifications such as chunking documents that exceeded the context limit.</li>
    <li><strong>Blocking, a developer is waiting</strong> (pre-merge check) -&gt; synchronous API. Polling doesn't make batch acceptable here.</li>
    <li>Refine the prompt on a sample set first to raise first-pass success and reduce iterative resubmission cost before committing the full batch.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>"Move both workflows to batch for the savings" is the bait — split them: batch the overnight job, keep the blocking check synchronous. Distractors invoke fake blockers ("batch ordering issues" — <code>custom_id</code> handles correlation), claim sub-second turnaround (no SLA), or add needless complexity ("batch with a real-time timeout fallback").</div>`,
  callout:`<b>Batch fit test</b>Latency-tolerant &amp; non-blocking -&gt; batch (~50% off, &le;24h, no SLA, <code>custom_id</code> to correlate, resubmit only failures). A developer waiting on results -&gt; synchronous, always.`,
  example:{ label:`Example — Message Batches submission`, body:
`# ~50% cheaper, up to 24h window, no latency SLA, no in-request multi-turn tools
client.messages.batches.create(requests=[
  {"custom_id": "doc-001", "params": { ...one-shot request... }},
  {"custom_id": "doc-002", "params": { ...one-shot request... }}
])
# resubmit only FAILED custom_ids (chunk any that exceeded context).
# never use batch for a blocking pre-merge check.` },
  quick:[
    {q:`A blocking pre-merge check that developers wait on should use:`,
     options:[`The Message Batches API for the cost savings`,`The synchronous API`,`Either, with polling`,`Whichever finishes first`],
     correct:1, why:`Batch has no latency SLA (up to 24h) — unsuitable for blocking workflows.`},
    {q:`The Message Batches API offers roughly:`,
     options:[`50% cost savings, up to a 24-hour window`,`Guaranteed sub-second latency`,`Free processing`,`Multi-turn tool calling within one request`],
     correct:0, why:`~50% cheaper, up to 24h, no SLA, no in-request multi-turn tool calling.`},
    {q:`After a batch of 5,000, how do you match each response to its request?`,
     options:[`Use the custom_id you assigned to each request`,`Rely on response array order`,`Match by timestamp`,`Hash the response body`],
     correct:0, why:`custom_id correlates request/response pairs; order is not guaranteed.`},
  ],
  scenario:[
    {q:`Your manager wants to move <em>both</em> workflows to batch for 50% savings: (1) a blocking pre-merge check developers wait on, and (2) an overnight technical-debt report. How do you evaluate this?`,
     options:[`Use batch only for the overnight report; keep real-time (synchronous) calls for the pre-merge check.`,`Switch both to batch with status polling.`,`Keep real-time for both to avoid batch ordering issues.`,`Switch both to batch with a timeout fallback to real-time.`],
     correct:0, why:`Batch's up-to-24h window with no SLA suits the overnight job but not a blocking check developers wait on.`,
     traps:{B:`Polling doesn't make batch acceptable for a blocking workflow.`,C:`<code>custom_id</code> handles correlation; the overnight job is a clear win.`,D:`Adds needless complexity vs matching each API to its use case.`}},
    {q:`A pre-merge CI check blocks the developer until results return. Is the Batches API a good fit, and why?`,
     options:[`No — batches have no latency SLA and up to a 24-hour window, wrong for blocking work where a developer waits.`,`Yes — the ~50% discount outweighs any latency concern.`,`Yes — batches guarantee sub-second turnaround for small jobs.`,`No — batches cannot return JSON output at all.`],
     correct:0, why:`Batches have no latency SLA and a window up to 24 hours, so never use them for blocking pre-merge checks.`,
     traps:{B:`Cost savings don't justify blocking a waiting developer.`,C:`There is no sub-second guarantee; no latency SLA.`,D:`Batches can return JSON; the issue is latency.`}},
    {q:`You run a weekly, latency-tolerant audit of an entire repository overnight. Which API choice optimizes cost without hurting the workflow?`,
     options:[`The Message Batches API, ~50% cheaper and fit for non-blocking, latency-tolerant work.`,`The standard synchronous API for predictable speed.`,`A forced tool call on each file synchronously.`,`Streaming responses to reduce cost.`],
     correct:0, why:`The Batches API is ~50% cheaper and ideal for non-blocking, latency-tolerant work like overnight or weekly audits.`,
     traps:{B:`Synchronous forgoes the ~50% discount with no benefit overnight.`,C:`Forcing tool calls doesn't address cost or batching.`,D:`Streaming affects delivery, not the batch discount.`}},
    {q:`Out of 5,000 batched requests, 80 failed (some exceeded the context limit). Recommended recovery?`,
     options:[`Resubmit only the failed custom_ids, chunking the ones that exceeded context.`,`Resubmit the whole batch to be safe.`,`Switch the failed ones to the synchronous API permanently.`,`Discard the failures since batches are best-effort.`],
     correct:0, why:`Resubmit only the failed custom_ids with modifications (e.g. chunking) rather than reprocessing everything.`,
     traps:{B:`Reprocessing all 5,000 wastes cost when only 80 failed.`,C:`Permanently switching APIs is unnecessary.`,D:`Discarding loses data you can simply resubmit.`}},
    {q:`Your batch workflow needs a multi-turn tool-calling conversation within a single request. Which constraint applies?`,
     options:[`The Batches API doesn't support multi-turn tool calling within a single request.`,`The Batches API supports unlimited multi-turn tool calling.`,`Multi-turn tool calling only works if tool_choice is "any".`,`Multi-turn tool calling requires a 24-hour window flag.`],
     correct:0, why:`The Batches API does not support multi-turn tool calling in a single request.`,
     traps:{B:`That's the opposite of the actual constraint.`,C:`tool_choice doesn't enable multi-turn within a batch.`,D:`The 24h window is the processing limit, not a multi-turn enabler.`}},
    {q:`You must process 100 documents nightly with results needed by 8am; the window can be up to 24h. Soundest strategy?`,
     options:[`Submit via the Batches API with margin (early evening) and resubmit only failed custom_ids.`,`Fire synchronous calls one-by-one at 7:55am.`,`Require sub-second latency from the batch.`,`Avoid batch because results "might" be late.`],
     correct:0, why:`A latency-tolerant nightly job is the ideal batch case; scheduling with margin plus targeted resubmission hits the deadline at half cost.`,
     traps:{B:`Last-minute synchronous calls are costly and risky.`,C:`Batch has no latency SLA.`,D:`Margin handles the variance.`}},
    {q:`You need results within a 30-hour SLA and batch processing can take up to 24 hours. How do you schedule submissions?`,
     options:[`Submit on a recurring window (e.g. every ~4-6 hours) so any batch finishes within the 30-hour SLA even at the 24h max.`,`Submit once a day and hope it lands in time.`,`Submit synchronously to guarantee the SLA.`,`Reduce the batch window flag to 6 hours.`],
     correct:0, why:`Frequent submission windows guarantee an SLA even when a batch hits the 24-hour maximum.`,
     traps:{B:`A single daily submission can blow the SLA if it hits 24h.`,C:`Synchronous abandons the cost savings for a latency-tolerant job.`,D:`There is no configurable batch-window flag; 24h is the max.`}},
    {q:`Before launching a 20,000-request batch, how do you maximize the first-pass success rate?`,
     options:[`Refine your prompt on a small sample first, then submit the full batch.`,`Submit all 20,000 immediately to get results sooner.`,`Set the window to its minimum so failures surface fast.`,`Use tool_choice "auto" to let the model self-correct.`],
     correct:0, why:`Refining the prompt on a sample lifts first-pass success before committing the full batch.`,
     traps:{B:`Launching unvalidated risks 20,000 low-quality results.`,C:`There's no configurable minimum window that improves quality.`,D:`"auto" doesn't address prompt quality across the batch.`}},
    {q:`A team worries the 24-hour window means overnight reports could take a full day. What's accurate about batch timing?`,
     options:[`Up to 24 hours is the maximum with no SLA; many batches finish well before, which suits overnight work.`,`Batches always take exactly 24 hours to complete.`,`Batches guarantee completion within one hour.`,`The window can be reduced to force a 5-minute SLA.`],
     correct:0, why:`The 24-hour window is a maximum with no latency SLA; latency-tolerant overnight work fits this model.`,
     traps:{B:`24h is the maximum, not a fixed duration.`,C:`There's no one-hour completion guarantee.`,D:`There's no configurable SLA on batches.`}},
    {q:`A colleague proposes "batch everything, with a real-time fallback that fires if a batch isn't done in 5 minutes." How do you assess this?`,
     options:[`Over-engineered — match each workload to its API; latency-tolerant jobs go to batch, blocking ones stay synchronous.`,`Sound — it captures batch savings while protecting latency.`,`Required — every batch needs a real-time fallback.`,`Best — it doubles throughput.`],
     correct:0, why:`A timeout-fallback hybrid adds complexity and pays for both paths; the right answer is matching each workload to one API.`,
     traps:{B:`Firing synchronous after 5 minutes pays twice and defeats the savings.`,C:`Latency-tolerant batches need no fallback.`,D:`It doesn't double throughput; it duplicates work.`}},
  ]},

'review-architectures':{ domain:'d4', ts:'4.6', title:`Multi-instance & multi-pass review`,
  eli5:`<p>The person who wrote an essay is the worst proofreader of it — they read what they <em>meant</em>. A <strong>fresh reader</strong> who never saw the draft being written catches more. And for a giant report, one read of the whole thing skims; reading it <strong>section by section</strong> then checking how the sections fit together catches far more.</p>`,
  real:`<p>A model that just generated something retains its <strong>generation reasoning</strong> in-session, so it's less likely to question its own decisions — "review more carefully" or extended thinking still carry that bias. An <strong>independent instance</strong> with no prior reasoning context catches more subtle issues. For large reviews, split into focused <strong>per-file local passes</strong> plus separate <strong>cross-file integration passes</strong> to avoid attention dilution and contradictory findings. Add <strong>verification passes</strong> where the model self-reports confidence per finding to enable calibrated routing.</p>
  <h4>Self-review bias vs independent review</h4>
  <ul>
    <li>Self-review limitation: the same session retains the reasoning that produced the output, making it less likely to challenge its own decisions. Asking it to "review more carefully" or adding extended thinking doesn't remove that bias.</li>
    <li><strong>Independent review instance</strong> — a second Claude with no generation context — is more effective at catching subtle issues. Session isolation is the mechanism: no shared reasoning, no shared blind spots.</li>
  </ul>
  <h4>Multi-pass: local + integration</h4>
  <ul>
    <li>Large multi-file reviews suffer <strong>attention dilution</strong> and produce contradictory findings when done in one pass.</li>
    <li>Split into <strong>per-file local passes</strong> (issues confined to one file) plus separate <strong>cross-file integration passes</strong> (data flow, contract mismatches between files).</li>
  </ul>
  <h4>Multiple passes / multiple reviewers</h4>
  <ul>
    <li>Run multiple passes per dimension (correctness, security, performance) rather than one undifferentiated pass; consider N independent reviewers and consensus when stakes are high and subtle misses are costly.</li>
    <li>Run a <strong>verification pass</strong> where the model self-reports a confidence level alongside each finding, so you can route low-confidence findings to human review or a second reviewer (calibrated routing).</li>
  </ul>
  <div class="edge"><b>Exam trap</b>"Tell the same session to review more carefully" and "add extended thinking to the generation turn" are distractors — both keep generation bias. The fix is an <em>independent</em> instance (or several). And majority-voting identical self-reviews shares the same blind spots; independence, not repetition, is what helps.</div>`,
  callout:`<b>Independence beats effort</b>A second instance with no generation context catches what the author can't — not "review harder," not extended thinking on the same turn. Split big reviews into per-file + integration passes.`,
  example:{ label:`Example — independent reviewer + multi-pass split`, body:
`# 1) independent review: fresh instance, NO generator reasoning context
review = client.messages.create(
  messages=[{"role":"user","content": f"Review this diff for bugs:\\n{diff}"}]
)   # session isolation -&gt; no shared blind spots

# 2) large change -&gt; split passes
for f in changed_files:        # per-file LOCAL pass
    review_local(f)
review_integration(changed_files)   # cross-file DATA-FLOW pass

# 3) verification pass: each finding carries self-reported confidence
#    low-confidence -&gt; route to a human or a second reviewer.` },
  quick:[
    {q:`Why is asking the generating session to review its own output weaker than using a second instance?`,
     options:[`The same session retains its generation reasoning and is less likely to question its own decisions`,`Second instances are always cheaper`,`The first session runs out of tokens`,`Self-review is disallowed by the API`],
     correct:0, why:`A model retains generation context in-session, creating bias an independent instance avoids.`},
    {q:`A large multi-file review produces contradictory findings. Best structure?`,
     options:[`One giant pass over all files at once`,`Per-file local passes plus a separate cross-file integration pass`,`Review only the largest file`,`Lower the temperature`],
     correct:1, why:`Splitting into local + integration passes avoids attention dilution and contradictions.`},
    {q:`What does a verification pass that self-reports confidence per finding enable?`,
     options:[`Calibrated routing — send low-confidence findings to human or second review`,`Guaranteed elimination of all false positives`,`Cheaper tokens`,`Forced tool calls`],
     correct:0, why:`Per-finding confidence lets you route uncertain findings rather than trust them blindly.`},
  ],
  scenario:[
    {q:`You ask the same Claude session that generated some code to review its own changes, and it misses subtle bugs. Better approach?`,
     options:[`Use a second, independent Claude instance — without the generator's reasoning context — to review.`,`Tell the same session to "review more carefully."`,`Add extended thinking to the generation turn.`,`Generate the code twice and diff it.`],
     correct:0, why:`A model retains its generation reasoning; an independent instance catches more subtle issues.`,
     traps:{B:`Same-session bias persists.`,C:`Extended thinking still carries generation bias.`,D:`Regenerating isn't an independent review.`}},
    {q:`A 30-file refactor review keeps producing findings that contradict each other and misses cross-file data-flow bugs. Most effective restructuring?`,
     options:[`Run focused per-file local passes, then a separate integration pass for cross-file data flow.`,`Review all 30 files in a single prompt with a bigger context window.`,`Review only the three largest files.`,`Run the single-pass review three times and majority-vote.`],
     correct:0, why:`Local + integration passes avoid attention dilution and surface cross-file issues a single pass dilutes.`,
     traps:{B:`A bigger window doesn't fix attention dilution across many files.`,C:`Skipping files misses real issues.`,D:`Voting on a diluted single pass repeats the same blind spots.`}},
    {q:`A teammate suggests adding extended thinking to the generation turn so the model "double-checks itself" instead of running a separate reviewer. Why is independent review still preferred for subtle issues?`,
     options:[`Extended thinking on the generation turn still carries the generator's reasoning context and bias; an independent instance does not.`,`Extended thinking is slower, which is the only drawback.`,`Extended thinking disables tool use.`,`Independent review is only about cost.`],
     correct:0, why:`Extended thinking in the same turn keeps generation bias; independence is what catches subtle issues.`,
     traps:{B:`Speed isn't the point; bias is.`,C:`Extended thinking doesn't disable tools.`,D:`The value is bias-free review, not cost.`}},
    {q:`For a high-stakes security review where a missed issue is very costly, how can multiple reviewers help beyond a single independent pass?`,
     options:[`Run several independent reviewers and reconcile via consensus, surfacing issues any single reviewer missed.`,`Run the same reviewer instance N times and majority-vote.`,`Raise the temperature so one reviewer explores more.`,`Use one reviewer but a much longer prompt.`],
     correct:0, why:`Multiple independent reviewers with consensus catch subtle misses; independence (not repetition) is the mechanism.`,
     traps:{B:`Repeating the same instance shares its blind spots.`,C:`Temperature adds variance, not independence.`,D:`A longer prompt to one reviewer doesn't add independent perspectives.`}},
    {q:`You want to route review findings: trust high-confidence ones, escalate uncertain ones. What review design supports this?`,
     options:[`A verification pass where the model self-reports confidence alongside each finding, enabling calibrated routing.`,`A single pass with no confidence signal, trusting all findings equally.`,`Lowering temperature so every finding is high-confidence.`,`Forcing tool_choice "any" on the reviewer.`],
     correct:0, why:`Self-reported per-finding confidence enables calibrated routing of uncertain findings to humans or a second reviewer.`,
     traps:{B:`No confidence signal means no basis for routing.`,C:`Temperature doesn't produce calibrated confidence.`,D:`tool_choice governs tool calls, not confidence.`}},
    {q:`Which factor most makes an independent review instance more effective than self-review?`,
     options:[`Session isolation — it has no prior reasoning context from the generation step.`,`It runs on a larger model by default.`,`It always uses a longer context window.`,`It runs in batch mode for cost savings.`],
     correct:0, why:`The absence of shared generation context (session isolation) is what removes the shared blind spot.`,
     traps:{B:`Independence isn't about model size.`,C:`Window size isn't the mechanism.`,D:`Batch mode is unrelated to review independence.`}},
    {q:`A single review pass over a large codebase change flags issue X in file A but a contradictory "X is fine" note tied to file B. What's the root cause and fix?`,
     options:[`Attention dilution across files; split into per-file passes plus an integration pass to reconcile cross-file behavior.`,`A schema error; tighten the output schema.`,`Temperature too high; set it to 0.`,`The model is too small; upgrade it.`],
     correct:0, why:`Contradictory findings in a single large pass signal attention dilution, fixed by local + integration passes.`,
     traps:{B:`A schema governs shape, not contradictory reasoning.`,C:`Temperature isn't the cause of attention dilution.`,D:`Model size doesn't fix single-pass dilution structurally.`}},
    {q:`You generate code, then want the most reliable check before merging. Which pipeline best reduces bias?`,
     options:[`Hand the diff to a fresh, independent instance with no generation context for review.`,`Ask the generating session "are you sure?" and accept its answer.`,`Re-run the same generation prompt and compare outputs.`,`Add a sterner system prompt to the generator.`],
     correct:0, why:`A fresh instance without generation context provides the unbiased review the original session can't.`,
     traps:{B:`Same-session self-assurance keeps the bias.`,C:`Re-running shares the same reasoning, not independence.`,D:`A sterner prompt doesn't remove generation bias.`}},
    {q:`When does splitting a review into per-file local passes plus an integration pass add the most value?`,
     options:[`When the change spans many files with cross-file data flow that a single pass would dilute or contradict.`,`When the change is a single small file.`,`Only when using the Batches API.`,`Only for security reviews, never correctness.`],
     correct:0, why:`Local + integration passes pay off when scale and cross-file interactions cause attention dilution.`,
     traps:{B:`A single small file doesn't need the split.`,C:`The split is independent of which API delivers it.`,D:`It applies to correctness as much as security.`}},
    {q:`A reviewer marks a subtle finding as low-confidence. In a calibrated multi-pass design, what should happen next?`,
     options:[`Route it to a human or a second independent reviewer rather than auto-accepting or auto-discarding it.`,`Auto-discard it to keep precision high.`,`Auto-accept it since the model raised it.`,`Re-run the same reviewer until confidence rises.`],
     correct:0, why:`Calibrated routing sends low-confidence findings to additional review instead of blindly accepting or dropping them.`,
     traps:{B:`Auto-discarding may drop real subtle issues.`,C:`Auto-accepting low-confidence findings inflates false positives.`,D:`Re-running the same reviewer shares its blind spots.`}},
  ]},

};
