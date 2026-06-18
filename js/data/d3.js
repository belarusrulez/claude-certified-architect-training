/* =========================================================================
   DOMAIN 3 — Claude Code Configuration & Workflows
   Chapters (in order): claudemd, commands-skills, path-rules, plan-mode,
   iterative-refinement, cicd.
   Each topic: { domain, ts, title, eli5, real, callout?, example,
                 quick:[{q,options,correct,why}],
                 scenario:[{q,options,correct,why,traps}] }
   `real`/`eli5` use real inline HTML. Only example.body (rendered in <pre>)
   escapes < > as &lt; &gt;. Literal ${ is written \${ everywhere.
   `correct` is the index of the right option as authored (app shuffles).
   ========================================================================= */
export const D3 = {

/* ------------------------------ 3.1 ------------------------------ */
'claudemd':{ domain:'d3', ts:'3.1', title:`CLAUDE.md hierarchy & modular organization`,
  eli5:`<p>Claude reads "rule notes" before it works. Some notes are just for <strong>you</strong> (your home note), some are for the <strong>whole team</strong> (the project note that ships in the repo), and some only apply in one <strong>room</strong> (a folder note that loads while you work in that folder).</p><p>If a teammate's Claude isn't following your rule, you almost certainly wrote it in your <em>personal</em> home note — which lives only on your machine and never travels with the repo, so they never see it.</p>`,
  real:`<p>CLAUDE.md memory has three tiers, and the only one shared with teammates is the project tier (because it's committed to version control):</p>
  <h4>The configuration hierarchy</h4>
  <ul>
    <li><strong>User-level</strong> — <code>~/.claude/CLAUDE.md</code>: applies to <em>all</em> your projects, lives on your machine, and is <strong>never shared via VCS</strong>. This is the tier that bites teams: a standard placed here works for you but reaches no one else.</li>
    <li><strong>Project-level</strong> — root <code>CLAUDE.md</code> or <code>.claude/CLAUDE.md</code>: committed to the repo, so every teammate gets it on clone/pull. Team standards belong here.</li>
    <li><strong>Directory-level</strong> — a <code>CLAUDE.md</code> inside a subfolder: also committed, but scoped — it loads when you work inside that part of the tree. Good for a monorepo where the backend folder wants Python conventions and the frontend folder wants TypeScript conventions, with no overlap.</li>
  </ul>
  <h4>Keeping it modular</h4>
  <ul>
    <li><strong><code>@import</code></strong> — reference external files from a CLAUDE.md so each package pulls in exactly the standards its maintainer knows are relevant (e.g. a package CLAUDE.md imports <code>./standards/api.md</code>). Keeps any single file focused instead of a giant monolith that dilutes attention.</li>
    <li><strong><code>.claude/rules/</code></strong> — split a long monolith into focused topic files (<code>testing.md</code>, <code>api-conventions.md</code>, <code>deployment.md</code>) instead of one 600-line document Claude starts to skim. (Rules files can also carry a <code>paths</code> glob for conditional loading — see 3.3.)</li>
  </ul>
  <h4>Diagnosing load issues</h4>
  <ul>
    <li>Run <code>/memory</code> to see exactly which memory files are currently loaded. This is the fastest way to catch "I wrote the rule in the wrong scope" or to explain inconsistent behavior across sessions.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>"A teammate's Claude ignores our standards" → the standard is in <code>~/.claude/CLAUDE.md</code> (user scope, private, uncommitted). Move it to project scope. Don't reach for "use a bigger model" (model size is irrelevant to config scoping) and don't have each developer retype the standard into their own home config (it drifts immediately). Note the reverse trap too: a committed project/directory file that a teammate <em>has</em> pulled is the normal case — corruption is never the likely explanation.</div>`,
  callout:`<b>SHARED vs PRIVATE</b> Only committed files travel with the repo: project root, <code>.claude/CLAUDE.md</code>, directory <code>CLAUDE.md</code>, and <code>.claude/rules/</code>. <code>~/.claude/</code> is yours alone.`,
  example:{ label:`Example — modular project CLAUDE.md`, body:
`# CLAUDE.md  (project root — committed, shared with everyone who clones)
@import ./.claude/rules/testing.md
@import ./packages/api/CLAUDE.md      # pull in per-package standards

# team-wide standards live here (project scope, version-controlled).
# personal-only rules go in ~/.claude/CLAUDE.md and are NEVER shared.
# a monorepo backend folder gets its own packages/backend/CLAUDE.md
#   that loads only while working in that subtree.

# run  /memory  to list which memory files actually loaded this session —
# the fast way to diagnose "works for me, not for my teammate".` },
  quick:[
    {q:`A teammate isn't receiving an instruction you wrote. Most likely cause?`,
     options:[`It's in <code>~/.claude/CLAUDE.md</code> (user-level), not project-level`,`Their model version differs`,`<code>@import</code> is deprecated`,`CLAUDE.md only works in CI`],
     correct:0, why:`User-level memory lives on your machine only and is never committed, so a teammate's clone never receives it.`},
    {q:`Which command shows which memory files are currently loaded?`,
     options:[`<code>/compact</code>`,`<code>/memory</code>`,`<code>/resume</code>`,`<code>/files</code>`],
     correct:1, why:`<code>/memory</code> lists the loaded memory files, diagnosing inconsistent behavior across sessions.`},
    {q:`What is <code>@import</code> for in a CLAUDE.md?`,
     options:[`Referencing external files to keep CLAUDE.md modular`,`Forcing a model upgrade`,`Restricting which tools a skill may use`,`Posting findings to a PR`],
     correct:0, why:`<code>@import</code> pulls in external standards files so each package's CLAUDE.md stays focused instead of monolithic.`},
  ],
  scenario:[
    {q:`Your team's coding standards work for you but a new hire's Claude ignores them. You placed them in <code>~/.claude/CLAUDE.md</code>. Best fix?`,
     options:[`Move the standards to the project-level <code>.claude/CLAUDE.md</code> (or root <code>CLAUDE.md</code>) so they're shared via version control.`,`Have the new hire retype the standards into their own home config.`,`Put the standards in a personal skill.`,`Switch the new hire to a larger model.`],
     correct:0, why:`Team-wide standards belong at the project level, which is shared through the repo; user-level config is private to each developer.`,
     traps:{B:`Manual copying doesn't scale and drifts out of sync.`,C:`Skills are on-demand, not always-on standards.`,D:`Model size is irrelevant to config scoping.`}},
    {q:`Your team agreed on a commit-message convention, but a new teammate's clone never applies it even though it works perfectly on your machine. Where is the convention most likely defined?`,
     options:[`In your user-level <code>~/.claude/CLAUDE.md</code>, which is personal and not shared via version control`,`In the project-level <code>.claude/CLAUDE.md</code>, which your teammate simply hasn't pulled yet`,`In a directory-level <code>CLAUDE.md</code> that only loads inside subfolders`,`In the project root <code>CLAUDE.md</code>, which is corrupted in the teammate's clone`],
     correct:0, why:`User-level memory lives only on your machine and is never committed, so a teammate's clone won't receive it.`,
     traps:{B:`A project-level file committed to VCS would arrive on clone, so the teammate would already have it.`,C:`A directory-level file is still version-controlled and would be present after cloning.`,D:`A committed root file arriving intact is the normal case; corruption is not the likely explanation.`}},
    {q:`A company-wide testing standard must apply to every developer on a repository and survive fresh clones. Where should it be placed?`,
     options:[`Project-level <code>.claude/CLAUDE.md</code> committed to the repository`,`User-level <code>~/.claude/CLAUDE.md</code> on each developer's machine`,`A directory-level <code>CLAUDE.md</code> inside the test folder only`,`An uncommitted local settings file ignored by git`],
     correct:0, why:`Project-level memory is version-controlled and shared with the whole team, making it the right home for team standards.`,
     traps:{B:`User-level files are personal and not shared, so each developer would have to recreate the standard manually.`,C:`A test-folder file only loads when editing files there, missing the repo-wide scope required.`,D:`An ignored local file isn't shared and defeats the goal of a team standard.`}},
    {q:`Your <code>CLAUDE.md</code> has grown to 600 lines and Claude seems to ignore some sections. Recommended way to keep it manageable?`,
     options:[`Keep it modular using <code>@import</code> references or split topics into <code>.claude/rules/</code> files`,`Delete the oldest half of the file since memory only reads recent entries`,`Move everything into a single user-level file so it loads faster`,`Convert the file to JSON so Claude parses it more reliably`],
     correct:0, why:`Modularizing with imports or splitting topics into rules files keeps each concern focused and maintainable.`,
     traps:{B:`Memory does not read only recent entries, and deleting content loses real standards.`,C:`Consolidating into a user-level file removes team sharing and doesn't solve the monolith problem.`,D:`CLAUDE.md is Markdown by convention; JSON is not a supported memory format.`}},
    {q:`Claude's behavior is inconsistent across sessions and you suspect a memory file isn't loading. Which step best diagnoses this?`,
     options:[`Run <code>/memory</code> to see which memory files are actually loaded`,`Restart the machine to force all CLAUDE.md files to reload`,`Rename every <code>CLAUDE.md</code> to lowercase so they are detected`,`Delete the project file and rely on the user-level file instead`],
     correct:0, why:`The <code>/memory</code> command lists exactly which memory files are loaded, revealing any that are missing.`,
     traps:{B:`A restart does not surface which files load and is unnecessary for memory resolution.`,C:`Filename casing is not the issue, and renaming risks breaking detection entirely.`,D:`Deleting the project file removes shared standards without diagnosing the load problem.`}},
    {q:`You want a personal scratchpad of shortcuts that should never appear in your teammates' Claude sessions. Where do you put it?`,
     options:[`In your user-level <code>~/.claude/CLAUDE.md</code>`,`In the project root <code>CLAUDE.md</code>`,`In a committed <code>.claude/CLAUDE.md</code>`,`In a <code>.claude/rules/</code> file with a paths glob`],
     correct:0, why:`User-level memory is private to your machine and never shared via version control.`,
     traps:{B:`A root <code>CLAUDE.md</code> is committed and shared with the whole team.`,C:`A committed project file is shared with everyone on the repository.`,D:`Rules files in the repo are version-controlled and visible to teammates.`}},
    {q:`A monorepo has a backend folder needing Python conventions and a frontend folder needing TypeScript conventions, with no overlap. Cleanest memory layout?`,
     options:[`A directory-level <code>CLAUDE.md</code> in each subfolder, holding that folder's conventions`,`One giant root <code>CLAUDE.md</code> listing every convention with folder prefixes`,`Both sets of conventions in your user-level file`,`Separate git repositories so each gets its own root file`],
     correct:0, why:`Directory-level memory files scope conventions to the subfolder where work happens, keeping context relevant.`,
     traps:{B:`A single root file loads all conventions everywhere, polluting context with irrelevant rules.`,C:`User-level files aren't shared with the team and mix unrelated conventions personally.`,D:`Splitting the monorepo is a drastic restructure unjustified by a memory-organization need.`}},
    {q:`Which statement correctly describes the precedence and sharing of Claude Code memory files?`,
     options:[`Project-level files are shared via VCS, while user-level files apply only to you and aren't committed`,`User-level files override and replace all project-level files for everyone`,`Directory-level files are the only ones shared with teammates`,`Only the root <code>CLAUDE.md</code> is ever loaded; subfolder files are ignored`],
     correct:0, why:`Project memory is version-controlled and team-shared, whereas user memory is personal and stays out of VCS.`,
     traps:{B:`User-level files affect only your machine and don't apply to anyone else.`,C:`Directory-level files are shared too if committed; they aren't uniquely the shared tier.`,D:`Subfolder <code>CLAUDE.md</code> files do load when you work in those directories.`}},
    {q:`Your root <code>CLAUDE.md</code> mixes logging rules, AWS naming, and cleanup workflows into one long document that's hard to maintain. Refactor that best preserves sharing while improving structure?`,
     options:[`Split each topic into its own file and reference them with <code>@import</code> from the project <code>CLAUDE.md</code>`,`Move the whole document to <code>~/.claude/CLAUDE.md</code> to declutter the repo`,`Compress the document into a single paragraph to reduce token usage`,`Duplicate the file into every subfolder so each topic is local`],
     correct:0, why:`Splitting topics into imported files keeps the project memory shared and version-controlled while staying modular.`,
     traps:{B:`Moving it to user-level removes team sharing entirely.`,C:`Compressing into one paragraph harms readability and doesn't address modularity.`,D:`Duplicating across folders creates drift and redundant maintenance without real separation.`}},
    {q:`A package maintainer wants their package's CLAUDE.md to pull in only the API and database standards relevant to that package, not the whole repo's standards. Best approach?`,
     options:[`Use <code>@import</code> in the package's CLAUDE.md to reference just the relevant standards files`,`Copy the entire root CLAUDE.md into the package folder`,`Move all standards to user-level config so nothing is package-specific`,`Inline every standard the company has into the package file`],
     correct:0, why:`<code>@import</code> lets each package selectively include the standards its maintainer knows are relevant, keeping its CLAUDE.md focused.`,
     traps:{B:`Copying the whole root file duplicates content and drifts; it isn't selective.`,C:`User-level config isn't shared and can't be package-scoped for the team.`,D:`Inlining everything recreates the monolith problem the maintainer is trying to avoid.`}},
  ]},

/* ------------------------------ 3.2 ------------------------------ */
'commands-skills':{ domain:'d3', ts:'3.2', title:`Custom slash commands & skills`,
  eli5:`<p>A <strong>slash command</strong> is a shortcut button. Save it in the shared project folder and your whole team gets it; save it in your home folder and it's just yours.</p><p>A <strong>skill</strong> is a mini-playbook Claude pulls out for a specific job — it has a name, a short description so Claude knows when to reach for it, and a body of step-by-step instructions. Running a skill "forked" means it works in a side-room, so its mess (verbose output) doesn't pile up in the main conversation.</p>`,
  real:`<p>Three constructs, three jobs — don't mix them up:</p>
  <h4>Command vs skill vs CLAUDE.md</h4>
  <ul>
    <li><strong>Slash command</strong> — a reusable prompt template you invoke explicitly (<code>/review</code>). Project-scoped in <code>.claude/commands/</code> (shared via VCS) or user-scoped in <code>~/.claude/commands/</code> (personal). The command file <em>is</em> the prompt.</li>
    <li><strong>Skill</strong> — an on-demand task workflow: a <code>SKILL.md</code> (plus optional assets) Claude invokes when a job matches. Project skills in <code>.claude/skills/</code>; personal variants in <code>~/.claude/skills/</code> — give a personal variant a <em>different name</em> so it doesn't shadow or affect teammates.</li>
    <li><strong>CLAUDE.md</strong> — always-loaded universal standards. Use it for "every time," not for an occasional task workflow.</li>
  </ul>
  <h4>SKILL.md frontmatter — the configurable knobs</h4>
  <ul>
    <li><code>name</code> / <code>description</code> — required identity. The description is what Claude reads to decide <em>when</em> to invoke the skill, so write it for relevance.</li>
    <li><code>context: fork</code> — runs the skill in an isolated sub-agent so its verbose output (a long codebase analysis) or exploratory context (brainstorming alternatives) doesn't pollute the main conversation.</li>
    <li><code>allowed-tools</code> — deterministically restricts which tools the skill may use during execution (e.g. file writes only, never destructive Bash).</li>
    <li><code>argument-hint</code> — prompts the developer for a required parameter when they invoke the skill with no arguments, instead of failing silently.</li>
  </ul>
  <h4>The body is mandatory</h4>
  <ul>
    <li>Frontmatter alone does nothing. A skill needs an <strong>instruction body</strong> under the <code>---</code> fence telling Claude what to actually do. A name + frontmatter with no body is an empty skill.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>Two isolation knobs, two jobs: <code>context: fork</code> isolates <em>context</em>; <code>allowed-tools</code> restricts <em>tools</em>. Restricting tool access is an <code>allowed-tools</code> job — not a <code>context: fork</code> job, and not <code>paths</code> (that's a path-rules key). A polite request in the skill body ("please don't run rm") is probabilistic; only <code>allowed-tools</code> makes it a guarantee. And "available to the whole team on clone" always means project scope, never <code>~/.claude/</code>.</div>`,
  callout:`<b>WHICH ONE</b> Always-on standard → CLAUDE.md. Explicit shortcut you type → slash command. On-demand workflow Claude invokes for a matching task → skill.`,
  example:{ label:`Example — a /review command + a COMPLETE skill (frontmatter + body)`, body:
`# .claude/commands/review.md   ->  invoked as /review
# (a command is just a reusable prompt — this body IS the command)
Run the team review checklist on the staged diff:
- report correctness & security only; skip style
- output each finding as  file:line - severity - one-line fix


# .claude/skills/release-notes/SKILL.md  (a COMPLETE skill)
---
name: release-notes                        # required identity
description: Draft release notes from PRs merged since a version tag.
context: fork                              # isolate; keep noise out of session
allowed-tools: Read, Grep, Bash(git log:*) # writes/reads only, no destructive Bash
argument-hint: &lt;version-tag&gt;               # prompt when invoked with no args
---
# ^ frontmatter CONFIGURES the skill. The body below is what it DOES —
#   a frontmatter-only file with no body is an empty skill that does nothing.
Given &lt;version-tag&gt;, draft release notes:
1. List merged PRs:  git log &lt;version-tag&gt;..HEAD --merges --oneline
2. Group them by type (feat / fix / chore) from the PR titles.
3. Output a Markdown changelog, newest first, with PR numbers.` },
  quick:[
    {q:`A custom <code>/review</code> command should be available to everyone who pulls the repo. Put it in:`,
     options:[`<code>~/.claude/commands/</code>`,`<code>.claude/commands/</code> in the repo`,`Root <code>CLAUDE.md</code>`,`<code>.claude/config.json</code>`],
     correct:1, why:`Project-scoped <code>.claude/commands/</code> is version-controlled and shared with the team.`},
    {q:`Which frontmatter keeps a verbose skill's output from polluting the main conversation?`,
     options:[`<code>allowed-tools</code>`,`<code>context: fork</code>`,`<code>argument-hint</code>`,`<code>model: opus</code>`],
     correct:1, why:`<code>context: fork</code> runs the skill in an isolated sub-agent context.`},
    {q:`What does a SKILL.md need besides frontmatter to actually do anything?`,
     options:[`An instruction body under the <code>---</code> fence`,`Nothing — frontmatter alone runs it`,`A matching slash command file`,`A <code>paths</code> glob`],
     correct:0, why:`Frontmatter configures the skill; the instruction body is what Claude executes. Frontmatter-only is an empty skill.`},
  ],
  scenario:[
    {q:`You want a custom <code>/review</code> slash command that runs your team's review checklist, available to every developer when they clone or pull the repo. Where should the command file live?`,
     options:[`<code>.claude/commands/</code> in the project repository`,`<code>~/.claude/commands/</code> in each developer's home directory`,`The root <code>CLAUDE.md</code> file`,`A <code>.claude/config.json</code> file with a commands array`],
     correct:0, why:`Project-scoped commands in <code>.claude/commands/</code> are version-controlled and auto-available to everyone on clone/pull.`,
     traps:{B:`User scope isn't shared via version control.`,C:`<code>CLAUDE.md</code> holds context, not command definitions.`,D:`That config mechanism doesn't exist in Claude Code.`}},
    {q:`You wrote a <code>/deploy</code> slash command and want every teammate to get it automatically when they clone the repo. Where does its definition belong?`,
     options:[`In <code>.claude/commands/</code>, which is shared via version control`,`In <code>~/.claude/commands/</code>, which is personal to your machine`,`In the root <code>CLAUDE.md</code> as an always-loaded instruction`,`In <code>.claude/skills/</code> with a SKILL.md frontmatter block`],
     correct:0, why:`Project commands in <code>.claude/commands/</code> are committed and distributed to the whole team on clone.`,
     traps:{B:`User-level commands stay on your machine and aren't shared with teammates.`,C:`CLAUDE.md holds standards, not invokable slash commands.`,D:`A skill is an on-demand workflow, not a slash command, and the question asks about a command.`}},
    {q:`A skill runs a long, verbose audit that prints hundreds of lines. You want its output kept out of the main conversation. Which frontmatter setting achieves this?`,
     options:[`<code>context: fork</code> to run the skill in an isolated sub-agent`,`<code>allowed-tools: none</code> to suppress all output`,`<code>argument-hint: quiet</code> to mute logging`,`<code>context: inline</code> to merge output into the session`],
     correct:0, why:`Setting <code>context: fork</code> runs the skill in an isolated sub-agent so its verbose output doesn't pollute the main session.`,
     traps:{B:`<code>allowed-tools</code> restricts which tools run; it doesn't suppress or isolate output.`,C:`<code>argument-hint</code> prompts for parameters and has nothing to do with muting logs.`,D:`Merging output inline is the opposite of keeping it out of the main conversation.`}},
    {q:`A skill must never be allowed to run shell commands or delete files during its workflow. Which frontmatter field enforces this?`,
     options:[`<code>allowed-tools</code>, which restricts the tools available during the skill`,`<code>context: fork</code>, which blocks dangerous tools automatically`,`<code>argument-hint</code>, which warns the user before risky steps`,`<code>paths</code>, which limits the skill to safe directories`],
     correct:0, why:`The <code>allowed-tools</code> field whitelists tools, so omitting shell and file-deletion tools prevents them.`,
     traps:{B:`<code>context: fork</code> isolates output but does not by itself restrict which tools are permitted.`,C:`<code>argument-hint</code> only prompts for parameters; it grants no tool restrictions.`,D:`<code>paths</code> is a path-rules frontmatter key, not a skill tool-restriction mechanism.`}},
    {q:`You want a skill to prompt the user for a required <em>ticket ID</em> before it runs. Which frontmatter field is intended for this?`,
     options:[`<code>argument-hint</code>, which signals the required parameter to supply`,`<code>allowed-tools</code>, which lists permitted tools`,`<code>context: fork</code>, which isolates the sub-agent`,`<code>paths</code>, which scopes the skill by file glob`],
     correct:0, why:`<code>argument-hint</code> tells the user which arguments the skill expects, prompting for required params like a ticket ID.`,
     traps:{B:`<code>allowed-tools</code> governs tool access, not parameter prompting.`,C:`<code>context: fork</code> controls isolation, not user input collection.`,D:`<code>paths</code> belongs to path rules and doesn't prompt for arguments.`}},
    {q:`When should a workflow be a skill rather than an entry in <code>CLAUDE.md</code>?`,
     options:[`When it's an on-demand task workflow invoked only when needed, versus an always-loaded universal standard`,`When it must be loaded on every single request to stay authoritative`,`When it should be hidden from teammates and never shared`,`When it contains no parameters and never produces output`],
     correct:0, why:`Skills are on-demand task workflows invoked when needed, while CLAUDE.md holds always-loaded universal standards.`,
     traps:{B:`Always-loaded content belongs in CLAUDE.md, which is the opposite of a skill's on-demand nature.`,C:`Sharing or hiding is a location concern, not the skill-versus-memory distinction.`,D:`Skills commonly take arguments and produce output; this isn't the deciding factor.`}},
    {q:`A personal experimental command helps only your workflow and you don't want it cluttering the shared repo. Where should it live?`,
     options:[`In <code>~/.claude/commands/</code>, which is personal and not committed`,`In <code>.claude/commands/</code>, so it's version-controlled`,`In <code>.claude/skills/</code> as a forked skill`,`In the project root <code>CLAUDE.md</code> as a standard`],
     correct:0, why:`User commands in <code>~/.claude/commands/</code> stay on your machine and aren't shared via the repository.`,
     traps:{B:`Project commands are committed and shared with the whole team, the opposite of what's wanted.`,C:`A skill is a different construct and placing it in the repo skills folder still shares it.`,D:`CLAUDE.md is for standards, not personal invokable commands, and a root file is shared.`}},
    {q:`A teammate complains your new skill floods their session with diagnostic noise and occasionally tries to run unexpected tools. Which two frontmatter settings together address both problems?`,
     options:[`<code>context: fork</code> to isolate output and <code>allowed-tools</code> to restrict permitted tools`,`<code>argument-hint</code> to mute noise and <code>paths</code> to block tools`,`<code>context: inline</code> to isolate output and <code>allowed-tools</code> to add tools`,`<code>paths</code> to fork output and <code>argument-hint</code> to restrict tools`],
     correct:0, why:`<code>context: fork</code> keeps verbose output isolated while <code>allowed-tools</code> limits which tools the skill may use.`,
     traps:{B:`<code>argument-hint</code> doesn't mute output and <code>paths</code> doesn't block tools.`,C:`<code>context: inline</code> merges output into the session rather than isolating it.`,D:`<code>paths</code> doesn't fork output and <code>argument-hint</code> doesn't restrict tools.`}},
    {q:`You want a personal variant of a team skill that behaves differently for you but must not change how the skill works for teammates. Best approach?`,
     options:[`Create the variant in <code>~/.claude/skills/</code> with a different name`,`Edit the team skill in <code>.claude/skills/</code> directly`,`Add <code>context: fork</code> to the shared skill`,`Move the team skill to <code>~/.claude/commands/</code>`],
     correct:0, why:`A personal variant in <code>~/.claude/skills/</code> with a different name is private to you and avoids affecting teammates.`,
     traps:{B:`Editing the shared skill changes behavior for everyone, the opposite of the goal.`,C:`<code>context: fork</code> isolates output, not customization, and still changes the shared skill.`,D:`Moving a skill into commands is a category error and loses the on-demand skill behavior.`}},
    {q:`A skill produces verbose exploratory output (brainstorming many alternatives) that you don't want anchoring the rest of the main conversation. Which configuration best fits, and why is the alternative wrong?`,
     options:[`<code>context: fork</code> — it runs the exploration in an isolated sub-agent and returns only what matters`,`<code>allowed-tools</code> — it limits tools so less output is produced`,`<code>argument-hint</code> — it prompts the user to keep output short`,`Put the workflow in CLAUDE.md so it loads every time`],
     correct:0, why:`Isolating exploratory or verbose context is exactly the purpose of <code>context: fork</code>; it keeps the main session uncluttered.`,
     traps:{B:`Restricting tools doesn't isolate the conversational context the output pollutes.`,C:`A parameter hint can't control how much exploratory context the model generates.`,D:`Always-loading exploratory content is the opposite of isolating it on demand.`}},
  ]},

/* ------------------------------ 3.3 ------------------------------ */
'path-rules':{ domain:'d3', ts:'3.3', title:`Path-specific rules`,
  eli5:`<p>Instead of leaving the same note in every single room, you put up <strong>one sign</strong>: "this rule applies to all blue doors anywhere in the building." A glob pattern is the blue-door rule — it finds the right files no matter where they live, and the note only shows up when you actually open a blue door.</p>`,
  real:`<p><code>.claude/rules/</code> files can carry YAML frontmatter with a <code>paths</code> glob (e.g. <code>paths: ["**/*.test.tsx"]</code> or <code>paths: ["terraform/**/*"]</code>). The rule loads <strong>only</strong> when you edit a file matching the glob — conditional activation that cuts irrelevant context and token usage.</p>
  <h4>When path-rules win over a directory CLAUDE.md</h4>
  <ul>
    <li><strong>Convention tied to a file type, not a location</strong> — test files (<code>**/*.test.tsx</code>), migrations (<code>**/*.migration.ts</code>), stories, <code>.sql</code> files — scattered throughout the tree. A glob matches them all regardless of directory; a directory-bound <code>CLAUDE.md</code> can't cover files spread across <code>src/</code>, <code>packages/</code>, and <code>apps/</code> without a copy in every folder (which then drifts).</li>
    <li><strong>Conditional loading</strong> — the rule appears only when an edited file matches, so unrelated context (and the tokens it costs) stays out of the window.</li>
  </ul>
  <h4>Path-rules vs the alternatives</h4>
  <ul>
    <li><strong>Directory <code>CLAUDE.md</code></strong> — location-bound; great for one self-contained subfolder, useless for a file type scattered everywhere.</li>
    <li><strong>Root <code>CLAUDE.md</code> with headers</strong> — loads on <em>every</em> request and relies on the model <em>inferring</em> which section applies; a glob match is explicit and reliable.</li>
    <li><strong>A skill</strong> — must be invoked; a path-rule applies automatically on a matching edit.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>"Apply automatically, by file type, regardless of directory" is the signature of a path-rule glob. If the rule never seems to fire, the usual cause is a <code>paths</code> glob that doesn't match the files being edited — not a missing restart (none required) and not a need to invoke it like a slash command. Distractors that rely on inference ("let Claude know which section applies") or manual invocation are wrong for an <em>automatic</em>, scattered-file convention.</div>`,
  callout:`<b>SCATTERED vs SELF-CONTAINED</b> File type spread across many dirs → path-rule glob. One self-contained subfolder → directory CLAUDE.md.`,
  example:{ label:`Example — path-scoped rule (.claude/rules/)`, body:
`# .claude/rules/tests.md
---
paths: ["**/*.test.tsx", "**/*.spec.ts"]   # glob — matches by file TYPE
---
- one behaviour per test; no snapshot tests for logic
- mock at the network boundary, never the unit under test

# loads ONLY when editing a file matching the glob — regardless of which
# directory it lives in. A directory CLAUDE.md couldn't cover tests spread
# across src/, packages/, and apps/ without a copy in every folder.` },
  quick:[
    {q:`Conventions for test files that are spread across many directories are best handled by:`,
     options:[`A subdirectory <code>CLAUDE.md</code> in each folder`,`<code>.claude/rules/</code> with a glob like <code>**/*.test.tsx</code>`,`The root <code>CLAUDE.md</code> with headers`,`A skill the developer must invoke`],
     correct:1, why:`Glob path-rules apply by file type regardless of directory; directory CLAUDE.md files are location-bound.`},
    {q:`When does a path-scoped rule load?`,
     options:[`On every request`,`Only when editing a file matching its glob`,`At session start only`,`When the user runs <code>/memory</code>`],
     correct:1, why:`Path rules load conditionally on matching edits, reducing irrelevant context.`},
    {q:`Which YAML frontmatter key controls when a <code>.claude/rules/</code> file activates?`,
     options:[`<code>paths</code>, a glob matched against edited files`,`<code>context</code>`,`<code>allowed-tools</code>`,`<code>argument-hint</code>`],
     correct:0, why:`The <code>paths</code> glob determines which edited files trigger the rule to load.`},
  ],
  scenario:[
    {q:`Test files sit next to the code they test (<code>Button.test.tsx</code> beside <code>Button.tsx</code>) throughout the codebase, and you want all tests to follow the same conventions regardless of location. Most maintainable way to apply them automatically?`,
     options:[`Create <code>.claude/rules/</code> files with YAML frontmatter glob patterns that conditionally apply conventions by file path.`,`Consolidate everything in the root <code>CLAUDE.md</code> under headers and rely on Claude to infer which applies.`,`Create a skill per code type with conventions in its <code>SKILL.md</code>.`,`Place a separate <code>CLAUDE.md</code> in each subdirectory.`],
     correct:0, why:`Glob path-rules (e.g. <code>**/*.test.tsx</code>) apply automatically by path regardless of directory — ideal for scattered test files.`,
     traps:{B:`Relies on inference, not explicit matching — unreliable.`,C:`Skills need invocation; this requires automatic application.`,D:`Directory-bound files can't cover files spread across many directories.`}},
    {q:`Your test files use a strict convention, but they're scattered across dozens of directories throughout the tree. Which mechanism applies the convention only when editing a test file, without putting a <code>CLAUDE.md</code> in every folder?`,
     options:[`A <code>.claude/rules/</code> file with frontmatter <code>paths: ["**/*.test.tsx"]</code>`,`A single root <code>CLAUDE.md</code> listing the test convention`,`A directory-level <code>CLAUDE.md</code> in the top-level tests folder`,`A user-level <code>~/.claude/CLAUDE.md</code> entry`],
     correct:0, why:`A path rule loads only when you edit a file matching its glob, covering scattered test files without per-folder memory.`,
     traps:{B:`A root <code>CLAUDE.md</code> loads on every request regardless of file type, wasting context.`,C:`A directory-bound file can't easily reach test files spread across many unrelated directories.`,D:`A user-level file isn't shared with the team and still loads unconditionally.`}},
    {q:`What is the key efficiency advantage of <code>.claude/rules/</code> path rules over an always-loaded root <code>CLAUDE.md</code>?`,
     options:[`They load conditionally only when you edit a matching file, cutting irrelevant context and tokens`,`They load on every request but compress better, saving tokens`,`They override user-level memory to reduce conflicts`,`They run in a forked sub-agent to isolate output`],
     correct:0, why:`Path rules are conditional: they load only on matching edits, so unrelated context and tokens are avoided.`,
     traps:{B:`Path rules are not loaded on every request; conditional loading is the whole point.`,C:`Overriding user memory is unrelated to the token-efficiency benefit.`,D:`Forking sub-agents is a skills feature, not how path rules work.`}},
    {q:`Which YAML frontmatter key in a <code>.claude/rules/</code> file controls when the rule activates?`,
     options:[`<code>paths</code>, a glob that matches files being edited`,`<code>context</code>, set to fork or inline`,`<code>allowed-tools</code>, a whitelist of tools`,`<code>argument-hint</code>, a parameter prompt`],
     correct:0, why:`The <code>paths</code> glob determines which edited files trigger the rule to load.`,
     traps:{B:`<code>context</code> is a skills frontmatter key for isolation, not rule activation.`,C:`<code>allowed-tools</code> restricts tools in skills; it doesn't gate rule loading.`,D:`<code>argument-hint</code> prompts for skill parameters and isn't a path-rule trigger.`}},
    {q:`A convention applies to every <code>.test.tsx</code> file, but they live under <code>src/</code>, <code>packages/</code>, and <code>apps/</code>. Why does a directory-level <code>CLAUDE.md</code> fall short here?`,
     options:[`A directory-bound file can't easily cover files scattered across many unrelated directories`,`Directory-level files never load when editing test files`,`Directory-level files are not shareable via version control`,`Directory-level files load on every request and are too slow`],
     correct:0, why:`A directory-bound memory file is tied to one folder subtree and can't span conventions scattered across the whole tree.`,
     traps:{B:`Directory files do load when you work within their folder; the issue is coverage breadth, not loading.`,C:`Directory-level files are committed and shareable, so sharing isn't the problem.`,D:`Directory files load when working in their subtree, not on every request; speed isn't the issue.`}},
    {q:`When does a path rule with <code>paths: ["**/*.sql"]</code> actually load into context?`,
     options:[`Only when you edit a file matching the <code>.sql</code> glob`,`On every request, regardless of which file you touch`,`Only at session startup, then it stays resident`,`Only when explicitly invoked as a slash command`],
     correct:0, why:`Path rules load conditionally when an edited file matches the configured glob, not before.`,
     traps:{B:`Loading on every request is exactly what path rules avoid.`,C:`They don't load eagerly at startup; loading is triggered by matching edits.`,D:`Path rules are not slash commands and aren't invoked manually.`}},
    {q:`Your monorepo enforces a migration-file standard for files named <code>*.migration.ts</code> in dozens of service folders. Most token-efficient way to apply it?`,
     options:[`A path rule with <code>paths: ["**/*.migration.ts"]</code> in <code>.claude/rules/</code>`,`A line in the root <code>CLAUDE.md</code> describing the migration standard`,`A directory-level <code>CLAUDE.md</code> copied into every service folder`,`A user-level memory entry on each developer's machine`],
     correct:0, why:`A single path rule applies the standard only when editing migration files anywhere in the tree, minimizing context.`,
     traps:{B:`A root entry loads on every request even when no migration file is involved, wasting tokens.`,C:`Copying a file into every folder causes drift and is far harder to maintain.`,D:`User-level entries aren't shared and still load unconditionally.`}},
    {q:`You add a path rule but it never seems to take effect. Most likely cause given how path rules work?`,
     options:[`The <code>paths</code> glob doesn't match the files you're editing, so the rule never triggers`,`Path rules require a restart before any glob is recognized`,`Path rules only work inside a forked skill sub-agent`,`Path rules must be invoked as a slash command to load`],
     correct:0, why:`Path rules load only on matching edits, so a glob that doesn't match the edited files means the rule stays dormant.`,
     traps:{B:`A restart is not a documented requirement for glob recognition.`,C:`Path rules are independent of skills and don't require a forked sub-agent.`,D:`Path rules are conditional on edits, not manual slash-command invocation.`}},
    {q:`Compared with a directory-level <code>CLAUDE.md</code>, when is a <code>.claude/rules/</code> path rule the better choice?`,
     options:[`When a convention spans many directories, like test files scattered throughout the tree`,`When a convention applies to one self-contained subfolder only`,`When you want the convention loaded on every request unconditionally`,`When the rule should be personal and never committed`],
     correct:0, why:`Path rules excel when a convention crosses many directories that a single directory-bound file can't cover.`,
     traps:{B:`A self-contained subfolder is exactly where a directory-level <code>CLAUDE.md</code> works well.`,C:`Unconditional loading is what root memory does, not the conditional path-rule model.`,D:`Path rules placed in the repo are committed; personal-only content belongs in user-level memory.`}},
    {q:`You want Terraform conventions to load only while editing files anywhere under <code>terraform/</code>. Which frontmatter is correct?`,
     options:[`<code>paths: ["terraform/**/*"]</code> in a <code>.claude/rules/</code> file`,`<code>context: fork</code> in a <code>.claude/rules/</code> file`,`<code>allowed-tools: terraform</code> in a SKILL.md`,`<code>@import ./terraform/CLAUDE.md</code> at the repo root`],
     correct:0, why:`A <code>paths</code> glob scoping to <code>terraform/**/*</code> loads the rule conditionally only when editing matching files.`,
     traps:{B:`<code>context: fork</code> is a skills isolation key, not a path-scoping trigger.`,C:`<code>allowed-tools</code> restricts tools in skills; it doesn't conditionally load conventions by path.`,D:`A root <code>@import</code> loads unconditionally on every request, defeating the conditional-loading goal.`}},
  ]},

/* ------------------------------ 3.4 ------------------------------ */
'plan-mode':{ domain:'d3', ts:'3.4', title:`Plan mode vs direct execution`,
  eli5:`<p>For a big remodel you draw <strong>blueprints</strong> first and agree on them before knocking down walls — that's plan mode. For changing a <strong>lightbulb</strong>, you just do it — that's direct execution. And when there's a ton of stuff to inspect first, you send a scout ahead so you don't have to carry every detail back yourself — that's the Explore sub-agent.</p>`,
  real:`<p><strong>Plan mode</strong> is for large, architectural work: changes across many files, multiple valid approaches, or high rework cost — a monolith→microservices restructuring, a 45-file library migration, choosing between integration approaches with different infrastructure. It lets you explore and design <em>before</em> committing to changes, preventing costly rework.</p>
  <p><strong>Direct execution</strong> is for simple, well-scoped changes with a clear path: a single-file bug fix with a known stack trace, adding one date-validation conditional. No planning overhead needed.</p>
  <h4>Which mode fits</h4>
  <ul>
    <li><strong>Plan mode</strong> — scope is large/architectural, touches many files, has multiple valid approaches, or rework is expensive. Explore and agree before changing anything.</li>
    <li><strong>Direct execution</strong> — small, well-scoped, clear path (single-file fix, known stack trace).</li>
    <li><strong>Combined</strong> — use plan mode to investigate and settle an approach (e.g. planning a library migration), then direct-execute the agreed plan.</li>
  </ul>
  <h4>The Explore sub-agent</h4>
  <ul>
    <li>Isolates a verbose discovery phase (reading dozens of files) and returns a concise summary, so the main conversation's context isn't flooded — preventing context-window exhaustion during multi-phase tasks.</li>
    <li>Raising <code>max_tokens</code> doesn't stop context accumulation; offloading discovery to Explore does.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>When complexity is <em>stated up front</em> (dozens of files, service boundaries to decide, competing architectures), choose plan mode now — not "start direct and switch if complexity appears." Starting direct on a known-large task risks costly rework when dependencies surface late. And tool restriction (<code>allowed-tools</code>) and output isolation (forked skill) are separate features — plan mode is about design before changes, not about restricting tools or muting output.</div>`,
  callout:`<b>STATED vs EMERGENT</b> If the brief already names many files / competing approaches, that's a plan-mode signal — don't wait for complexity to "emerge."`,
  example:{ label:`Example — entering plan mode for a big change`, body:
`# large, multi-file, architectural -> plan BEFORE editing
"Use plan mode. Explore the monolith with the Explore sub-agent, map module
 dependencies, and propose service boundaries. Do NOT change any files until
 I approve the plan."

# then, after approval -> direct-execute the agreed plan.
# a one-line fix with a clear stack trace -> skip planning, just direct-execute.` },
  quick:[
    {q:`Restructuring a monolith into microservices (dozens of files, architectural decisions) calls for:`,
     options:[`Direct execution, incrementally`,`Plan mode`,`Batch API`,`<code>fork_session</code> only`],
     correct:1, why:`Large-scale architectural change is exactly what plan mode is for.`},
    {q:`Adding one date-validation conditional to a single function calls for:`,
     options:[`Plan mode with full exploration`,`Direct execution`,`A multi-agent pipeline`,`The Explore sub-agent`],
     correct:1, why:`Simple, well-scoped changes are direct-execution work.`},
    {q:`What does the Explore sub-agent prevent during a multi-phase task?`,
     options:[`Context-window exhaustion from verbose discovery output`,`Tool misuse`,`Duplicate PR comments`,`Memory files failing to load`],
     correct:0, why:`Explore isolates verbose discovery and returns summaries, preserving main-conversation context.`},
  ],
  scenario:[
    {q:`You must restructure a monolith into microservices — changes across dozens of files, plus decisions about service boundaries and module dependencies. Which approach?`,
     options:[`Enter plan mode to explore the codebase, understand dependencies, and design the approach before changing anything.`,`Start with direct execution and let the implementation reveal the service boundaries.`,`Direct execution with comprehensive upfront instructions for each service.`,`Begin in direct execution and switch to plan mode only if unexpected complexity appears.`],
     correct:0, why:`Plan mode is designed for large-scale, multi-approach, architectural work; it enables safe exploration and design before costly changes.`,
     traps:{B:`Risks costly rework when dependencies surface late.`,C:`Assumes you already know the right structure without exploring.`,D:`The complexity is stated up front, not something that might emerge.`}},
    {q:`You're asked to migrate a 45-file library across the codebase with several viable approaches. Which mode fits best?`,
     options:[`Plan mode, to explore and design before changing anything`,`Direct execution, to start editing files immediately`,`Direct execution, since the change touches many files quickly`,`Neither; large migrations should be done manually outside Claude`],
     correct:0, why:`Large, multi-file, multi-approach tasks call for plan mode to explore and design before making changes.`,
     traps:{B:`Jumping straight to edits skips the design exploration a large migration needs.`,C:`Touching many files is a reason for planning, not for rushing into direct execution.`,D:`Claude can absolutely handle the migration; opting out entirely isn't warranted.`}},
    {q:`A single-file bug with a clear stack trace pointing at the offending line needs fixing. Which approach is appropriate?`,
     options:[`Direct execution, since the change is simple and well-scoped`,`Plan mode, to design alternatives before touching the file`,`Plan mode, because every bug fix requires a design phase`,`Plan mode, then abandon the plan and edit anyway`],
     correct:0, why:`A simple, well-scoped fix with a clear cause is ideal for direct execution without planning overhead.`,
     traps:{B:`Designing alternatives for a one-line, clearly-diagnosed fix adds needless overhead.`,C:`Not every bug fix needs a design phase; small scoped fixes don't.`,D:`Entering plan mode only to discard it wastes effort for a trivial change.`}},
    {q:`What is the primary purpose of plan mode?`,
     options:[`To explore and design before changing code on large, architectural, multi-approach tasks`,`To execute approved edits faster by skipping confirmation prompts`,`To restrict which tools Claude may use during a task`,`To isolate verbose command output from the main session`],
     correct:0, why:`Plan mode is for exploring and designing ahead of changes on large or architectural work with multiple valid paths.`,
     traps:{B:`Plan mode is about design, not accelerating execution or skipping confirmations.`,C:`Tool restriction is governed by skill <code>allowed-tools</code>, not plan mode.`,D:`Isolating output is the job of a forked sub-agent, not plan mode itself.`}},
    {q:`During plan mode, what role does the Explore sub-agent play?`,
     options:[`It isolates verbose discovery work and returns concise summaries to preserve main-conversation context`,`It applies the approved edits automatically once planning ends`,`It enforces the <code>paths</code> glob on every file edited`,`It commits the plan to version control for the team`],
     correct:0, why:`The Explore sub-agent isolates noisy investigation and feeds back summaries, keeping the main context clean.`,
     traps:{B:`Explore gathers information; it doesn't apply edits.`,C:`Glob enforcement is a path-rules feature, unrelated to the Explore sub-agent.`,D:`Explore doesn't commit anything to version control.`}},
    {q:`You need to redesign a monolith into microservices, where several architectures are plausible. Why is plan mode preferred over direct execution?`,
     options:[`The task is large and architectural with multiple valid approaches that benefit from upfront design`,`Direct execution can't edit more than one file at a time`,`Plan mode automatically picks the single correct architecture for you`,`Direct execution is disabled for any task touching services`],
     correct:0, why:`Architectural tasks with several valid approaches benefit from exploring and designing before committing to changes.`,
     traps:{B:`Direct execution can edit many files; the limitation isn't file count.`,C:`Plan mode helps you reason about options; it doesn't auto-select the design.`,D:`Direct execution isn't categorically disabled for service work.`}},
    {q:`Can plan mode and direct execution be combined in a single workflow?`,
     options:[`Yes — plan to investigate and agree on an approach, then direct-execute the agreed plan`,`No — choosing plan mode permanently locks the session out of direct edits`,`No — they require separate repositories to coexist`,`Yes, but only if you disable the Explore sub-agent first`],
     correct:0, why:`You can use plan mode to investigate and settle on an approach, then switch to direct execution to implement it.`,
     traps:{B:`Plan mode doesn't permanently lock out direct edits; you can transition to execution.`,C:`No separate repositories are needed to use both modes.`,D:`Combining the modes doesn't require disabling Explore.`}},
    {q:`Which scenario is the clearest signal to choose direct execution over plan mode?`,
     options:[`A well-scoped single-file change with a clear, unambiguous cause`,`A cross-cutting refactor spanning dozens of modules with trade-offs`,`A monolith-to-microservices redesign with competing architectures`,`A library migration touching 45 files across the tree`],
     correct:0, why:`A small, clearly-diagnosed single-file change is exactly the case where direct execution is most efficient.`,
     traps:{B:`A cross-cutting refactor with trade-offs is precisely when planning pays off.`,C:`Competing architectures demand the design exploration plan mode provides.`,D:`A sprawling 45-file migration is a planning candidate, not a direct-execution one.`}},
    {q:`How does the Explore sub-agent help preserve the main conversation's context during a large planning effort?`,
     options:[`It performs verbose discovery in isolation and returns only summaries to the main thread`,`It deletes prior messages to free up the context window`,`It compresses the entire conversation into shorthand`,`It moves the plan into a separate user-level memory file`],
     correct:0, why:`By isolating noisy discovery and returning summaries, the Explore sub-agent keeps the main context uncluttered.`,
     traps:{B:`Explore doesn't delete prior messages; it offloads verbose work to a sub-agent.`,C:`Compressing into shorthand is a different mechanism, not Explore's function.`,D:`Explore doesn't relocate plans into memory files.`}},
    {q:`You must choose between two integration approaches that each require different infrastructure, and the decision affects 30+ files. Best workflow?`,
     options:[`Use plan mode to explore both approaches and their infrastructure implications before committing, then direct-execute the chosen one`,`Direct-execute the first approach and migrate later if it's wrong`,`Pick randomly and rely on tests to catch problems`,`Increase <code>max_tokens</code> and edit all 30 files in one direct pass`],
     correct:0, why:`Multiple valid approaches with architectural and infrastructure trade-offs across many files is the canonical plan-mode case; you can direct-execute after deciding.`,
     traps:{B:`Committing to one approach without exploring risks an expensive migration when the other was better.`,C:`Guessing on an architectural fork is exactly what plan mode exists to prevent.`,D:`A bigger token cap doesn't substitute for exploring competing approaches first.`}},
  ]},

/* ------------------------------ 3.5 (NEW) ------------------------------ */
'iterative-refinement':{ domain:'d3', ts:'3.5', title:`Iterative refinement techniques`,
  eli5:`<p>You rarely get the perfect thing on the first try. So you work in <strong>loops</strong>: ask for a draft, point at exactly what's wrong, get a better draft. The trick is <em>how</em> you point. Vague words ("make it nicer") get vague results. <strong>Concrete examples</strong> — "here's an input and the exact output I want" — and <strong>failing tests</strong> — "here's what broke" — are like handing over a photo instead of describing a face from memory.</p><p>And before building something in an area you don't know well, you let Claude <strong>interview you</strong> — it asks the questions that surface the decisions you forgot to think about.</p>`,
  real:`<p>Progressive refinement is a generate → critique → improve loop. The leverage is in <em>how you communicate the gap</em> between what you got and what you want.</p>
  <h4>Concrete examples over prose</h4>
  <ul>
    <li>When a natural-language description produces inconsistent results, give <strong>2–3 concrete input/output examples</strong>. Examples are the most reliable way to pin down a transformation — prose like "normalize the data" gets interpreted differently each run; an input paired with its exact expected output does not.</li>
    <li>To fix specific edge-case handling (e.g. null values in a migration script), provide a <strong>specific test case</strong>: this input → this expected output.</li>
  </ul>
  <h4>Test-driven iteration</h4>
  <ul>
    <li>Write a test suite first — covering expected behavior, edge cases, and performance requirements — <em>then</em> iterate by sharing the <strong>test failures</strong>. Failures are concrete, unambiguous feedback that guides progressive improvement far better than "it's still not right."</li>
  </ul>
  <h4>The interview pattern</h4>
  <ul>
    <li>In an unfamiliar domain, have Claude <strong>ask you questions before implementing</strong>. It surfaces considerations you may not have anticipated — cache-invalidation strategy, failure modes, concurrency — so design gaps appear before code does, not after.</li>
  </ul>
  <h4>Batch interacting fixes; sequence independent ones</h4>
  <ul>
    <li>When several issues <strong>interact</strong> (a fix for one changes the right fix for another), put them all in a <strong>single detailed message</strong> so the fixes account for each other.</li>
    <li>When issues are <strong>independent</strong>, iterate <strong>sequentially</strong> — simpler, and each fix is verified before the next.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>The strongest lever for "inconsistent results from a prose description" is concrete input/output examples — not "write a longer paragraph," not lowering temperature, not a bigger model. And the batch-vs-sequence call hinges on <em>interaction</em>: interacting bugs go together in one message; independent bugs go one at a time. Refining on a small sample before scaling up is cheaper than discovering the gap after a full run.</div>`,
  callout:`<b>SHOW, DON'T TELL</b> Inconsistent output → give 2–3 input/output examples. Edge case wrong → give that exact case. Behavior drifting → share the failing test.`,
  example:{ label:`Example — examples + test-driven iteration + the interview pattern`, body:
`# 1) Prose was ambiguous -> pin it with concrete input/output examples
"Normalize phone numbers. Examples:
   '(415) 555-0123'   -> '+14155550123'
   '415.555.0123'     -> '+14155550123'
   '555-0123'         -> ERROR: missing area code"

# 2) Test-driven iteration: write tests FIRST, then share failures
#    "Here are the failing cases — fix until green:"
#    FAIL normalize('555-0123')      expected ERROR, got '+1...5550123'
#    FAIL normalize(null)            expected ERROR, got crash

# 3) Interview pattern (unfamiliar domain): ask before building
"Before you implement the cache layer, ask me about invalidation strategy,
 TTLs, and failure modes you need decided."

# 4) Batch vs sequence:
#    issues that INTERACT -> one detailed message together
#    issues that are INDEPENDENT -> fix sequentially, verify each` },
  quick:[
    {q:`A prose description keeps producing inconsistent transformations. Most effective fix?`,
     options:[`Provide 2–3 concrete input/output examples`,`Rewrite the description as a longer paragraph`,`Lower the temperature`,`Switch to a larger model`],
     correct:0, why:`Concrete input/output examples are the most reliable way to communicate an expected transformation.`},
    {q:`You're building in an unfamiliar domain and worry about missing design considerations. Which technique surfaces them first?`,
     options:[`The interview pattern — have Claude ask questions before implementing`,`Implement first and fix later`,`Add more examples of finished code`,`Increase <code>max_tokens</code>`],
     correct:0, why:`The interview pattern surfaces considerations (cache invalidation, failure modes) before any code is written.`},
    {q:`Three review issues: two interact, one is independent. How should you feed them back?`,
     options:[`Two interacting ones together in one message; the independent one separately`,`Strictly one per message, always`,`All three with no detail`,`Only the independent one`],
     correct:0, why:`Interacting fixes belong together so they account for each other; independent ones can go sequentially.`},
  ],
  scenario:[
    {q:`A migration script mishandles null values in one column. You've described the desired behavior in prose twice and Claude keeps getting the edge case wrong. Most effective next step?`,
     options:[`Provide a specific test case: the exact null input and the exact expected output`,`Rewrite the prose description in more detail`,`Lower the temperature and re-run the same prompt`,`Switch to a larger model and re-run the same prompt`],
     correct:0, why:`A concrete input/output example for the failing edge case pins down the behavior far more reliably than more prose.`,
     traps:{B:`More prose is the approach that already failed twice; ambiguity is the problem.`,C:`Temperature doesn't resolve an under-specified transformation.`,D:`Model size doesn't fix a specification gap a concrete example would close.`}},
    {q:`You want a function implemented correctly including edge cases and a performance bound. Which iterative approach communicates requirements most reliably?`,
     options:[`Write a test suite covering behavior, edge cases, and performance first, then iterate by sharing the test failures`,`Describe everything in one long prose prompt and accept the first output`,`Generate three versions and pick whichever looks best`,`Ask for the code, then eyeball it for bugs`],
     correct:0, why:`Test-driven iteration gives concrete, unambiguous feedback (failures) that guides progressive improvement.`,
     traps:{B:`Prose alone is interpreted inconsistently and skips edge-case verification.`,C:`Picking by appearance doesn't verify correctness or performance.`,D:`Eyeballing misses exactly the edge cases a test suite encodes.`}},
    {q:`You're implementing a caching layer in a domain you don't know well, and you're worried about overlooking invalidation strategy and failure modes. Best first move?`,
     options:[`Use the interview pattern: have Claude ask you questions to surface considerations before it implements`,`Have Claude implement immediately and you'll review afterward`,`Provide several examples of finished cache code to copy`,`Force structured output to constrain the design`],
     correct:0, why:`The interview pattern brings hidden design decisions (invalidation, failure modes, concurrency) to the surface before code exists.`,
     traps:{B:`Implement-first invites costly rework once the missed considerations surface.`,C:`Finished-code examples don't surface the decisions you haven't made yet.`,D:`Structured output shapes a response format; it doesn't elicit design considerations.`}},
    {q:`Code review surfaced four issues: three of them interact (fixing one changes the correct fix for the others) and one is fully independent. How should you direct the fixes?`,
     options:[`Send the three interacting issues together in one detailed message; handle the independent one separately`,`Send all four strictly one at a time in sequence`,`Dump all four in one message with no detail`,`Fix only the independent issue and leave the rest`],
     correct:0, why:`Interacting problems must be fixed together so each fix accounts for the others; independent ones can be sequenced.`,
     traps:{B:`Sequencing interacting fixes lets an early fix invalidate a later one.`,C:`No detail yields inconsistent, low-quality fixes.`,D:`Ignoring the interacting issues leaves the code broken.`}},
    {q:`Two reviewer findings are completely independent of each other. What's the simplest reliable way to address them?`,
     options:[`Fix them sequentially, verifying each before moving on`,`Always combine every finding into one giant message`,`Pick one and ignore the other`,`Re-run the whole review three times and vote`],
     correct:0, why:`Independent issues don't influence each other, so sequential fixing is simpler and lets you verify each in isolation.`,
     traps:{B:`Batching is only necessary when fixes interact; forcing it adds no value here.`,C:`Ignoring a real finding leaves a defect.`,D:`Voting across runs suppresses intermittently-caught real issues and wastes effort.`}},
    {q:`You need a transformation applied to 50,000 records and you're unsure the prompt is right. Cheapest way to de-risk before the full run?`,
     options:[`Refine on a small sample with concrete input/output examples until correct, then scale to the full set`,`Run all 50,000 immediately and inspect the output afterward`,`Increase the model size and run the full set once`,`Describe the transformation in more prose and run the full set`],
     correct:0, why:`Refining on a sample with concrete examples surfaces gaps cheaply before you pay for the full-scale run.`,
     traps:{B:`Running everything first wastes the run if the prompt is wrong.`,C:`A bigger model doesn't fix an unverified transformation spec.`,D:`More prose repeats the ambiguity; examples on a sample are what pin it down.`}},
    {q:`Your prose instruction "summarize each ticket concisely" produces wildly different summary styles across runs. Best refinement?`,
     options:[`Give 2–3 example tickets each paired with the exact summary you want`,`Add the word "consistently" to the instruction`,`Lower the temperature to 0 and accept whatever it returns`,`Ask for a longer summary instead`],
     correct:0, why:`Concrete input/output examples communicate the expected style and length far more reliably than adjectives.`,
     traps:{B:`Adding adjectives doesn't operationalize what "concise" means here.`,C:`Temperature affects variability but not the underlying ambiguity about desired style.`,D:`Length isn't the issue; the inconsistent style is, which examples resolve.`}},
    {q:`After sharing a failing test, Claude fixes that test but quietly breaks a previously-passing one. What does this argue for in your iteration loop?`,
     options:[`Keep the full test suite as the feedback signal each iteration, so regressions surface immediately`,`Stop using tests and describe the desired behavior in prose`,`Only ever share one failing test and never re-run the others`,`Switch to a larger model so it never regresses`],
     correct:0, why:`A test suite re-run each iteration catches regressions as concrete failures, which is the whole point of test-driven iteration.`,
     traps:{B:`Prose is exactly the ambiguous feedback tests improve on.`,C:`Hiding the rest of the suite is how regressions go unnoticed.`,D:`No model is regression-proof; the suite is what detects regressions.`}},
    {q:`You give Claude one input/output example and results are still inconsistent on the trickier cases. Reasonable next refinement?`,
     options:[`Add a couple more examples that specifically cover the tricky/edge cases`,`Remove the example and rely on prose`,`Repeat the same single example three times`,`Demand the answer with no further guidance`],
     correct:0, why:`Adding 2–3 examples that cover the edge cases extends the pattern to the cases that were ambiguous.`,
     traps:{B:`Removing the example reintroduces the ambiguity examples were solving.`,C:`Repeating the same example adds no new information about the tricky cases.`,D:`Less guidance won't make inconsistent output consistent.`}},
    {q:`Which statement best captures when to provide all issues in a single message versus fixing them one at a time?`,
     options:[`Combine issues that interact into one message; fix independent issues sequentially`,`Always combine everything to save round-trips`,`Always fix one issue per message regardless of interaction`,`Combine only when there are more than five issues`],
     correct:0, why:`The deciding factor is interaction: interacting fixes must be coordinated together; independent ones are simpler done sequentially.`,
     traps:{B:`Round-trip savings don't justify batching independent fixes that don't interact.`,C:`Forcing one-per-message breaks fixes that depend on each other.`,D:`The count of issues isn't the criterion; whether they interact is.`}},
  ]},

/* ------------------------------ 3.6 ------------------------------ */
'cicd':{ domain:'d3', ts:'3.6', title:`Claude Code in CI/CD`,
  eli5:`<p>To run Claude Code inside an automated robot pipeline, you tell it two things: "<strong>don't wait for me to type</strong>" (so the job doesn't hang) and "give me <strong>machine-readable</strong> output" (so a script can post the findings). And a <strong>fresh reviewer</strong> who didn't write the code catches more than the author grading their own homework.</p>`,
  real:`<p>Running Claude Code in CI comes down to four levers:</p>
  <h4>The headless flags that matter</h4>
  <ul>
    <li><code>-p</code> / <code>--print</code> — non-interactive: process the prompt, print to stdout, exit. Fixes the "job hangs waiting for input" symptom. There is no <code>CLAUDE_HEADLESS</code> env var and no <code>--batch</code> flag.</li>
    <li><code>--output-format json</code> + <code>--json-schema</code> — structured, schema-enforced findings a script can parse and post as inline PR comments, mapped to specific lines. Plain <code>-p</code> prevents hangs but isn't itself structured.</li>
  </ul>
  <h4>CLAUDE.md as CI context</h4>
  <ul>
    <li>CLAUDE.md supplies the project context a good CI review needs: testing standards, fixture conventions, review criteria, and what counts as a valuable test. For test generation, also provide the <strong>existing test files</strong> so it doesn't suggest duplicate scenarios already covered — improving quality and cutting low-value output.</li>
  </ul>
  <h4>Session isolation</h4>
  <ul>
    <li>The same session that generated code is less effective at reviewing its own changes — it retains its generation reasoning and stays anchored to the same assumptions. An <strong>independent review instance</strong>, without that context, catches more subtle issues.</li>
  </ul>
  <h4>Re-runs without duplicate comments</h4>
  <ul>
    <li>On a re-run after new commits, include the <strong>prior findings</strong> in context and instruct Claude to report only new or still-unaddressed issues — so it doesn't repost comments it already made.</li>
  </ul>
  <div class="edge"><b>Exam trap</b>The hang has one right fix — <code>-p</code>/<code>--print</code>. Distractors like <code>CLAUDE_HEADLESS=true</code>, <code>--batch</code>, <code>--interactive=false</code>, or redirecting stdin from <code>/dev/null</code> are non-existent flags or fragile workarounds. Structured output needs <code>--output-format json</code> <em>with</em> <code>--json-schema</code> — <code>-p</code> alone doesn't guarantee a parseable schema. And the better reviewer is always the independent instance, never the generator's own session.</div>`,
  callout:`<b>FOUR LEVERS</b> <code>-p</code> (no hang) · <code>--output-format json</code> + <code>--json-schema</code> (parseable) · CLAUDE.md (context) · independent instance (catches more).`,
  example:{ label:`Example — Claude Code in CI (non-interactive, structured)`, body:
`# -p / --print: process the prompt, print, exit (no input hang)
claude -p "Review this PR for security issues" \\
  --output-format json \\
  --json-schema ./review.schema.json > findings.json

# CLAUDE.md supplies testing standards, fixtures, and review criteria.
# an INDEPENDENT instance (no generation context) catches more than self-review.
# on re-runs, pass prior findings so it reports only new/unaddressed issues:
claude -p "Re-review. Prior findings attached; report only NEW or
  still-unaddressed issues." --output-format json \\
  --json-schema ./review.schema.json < prior-findings.json` },
  quick:[
    {q:`Your CI job runs <code>claude "..."</code> and hangs waiting for input. Fix?`,
     options:[`Set <code>CLAUDE_HEADLESS=true</code>`,`Add the <code>-p</code> (<code>--print</code>) flag`,`Add <code>--batch</code>`,`Redirect stdin from <code>/dev/null</code>`],
     correct:1, why:`<code>-p</code> is the documented non-interactive mode; the others are non-existent flags or fragile workarounds.`},
    {q:`Who catches more subtle issues in generated code?`,
     options:[`The same session that wrote it, asked to self-review`,`An independent review instance without the generator's reasoning context`,`Extended thinking in the same turn`,`A longer system prompt`],
     correct:1, why:`Self-review retains generation bias; an independent instance is more effective.`},
    {q:`What produces machine-parseable findings a script can post as inline PR comments?`,
     options:[`<code>--output-format json</code> with <code>--json-schema</code>`,`<code>-p</code> alone`,`<code>--verbose</code> logging`,`Piping stdout through <code>grep</code>`],
     correct:0, why:`Schema-enforced JSON output is structured and parseable; <code>-p</code> alone isn't.`},
  ],
  scenario:[
    {q:`Your pipeline runs <code>claude "Analyze this PR for security issues"</code> but the job hangs indefinitely; logs show it's waiting for interactive input. Correct way to run Claude Code in an automated pipeline?`,
     options:[`Add the <code>-p</code> flag: <code>claude -p "Analyze this PR for security issues"</code>.`,`Set <code>CLAUDE_HEADLESS=true</code> before running.`,`Redirect stdin: <code>claude "..." &lt; /dev/null</code>.`,`Add a <code>--batch</code> flag.`],
     correct:0, why:`<code>-p</code> / <code>--print</code> is the documented non-interactive mode: it processes the prompt, prints to stdout, and exits.`,
     traps:{B:`No such environment variable.`,C:`A Unix workaround that doesn't address the command's interactive design.`,D:`No such flag.`}},
    {q:`You're running Claude Code inside a CI pipeline and the job hangs waiting for input. Which flag makes it run non-interactively?`,
     options:[`<code>-p</code> / <code>--print</code>, which runs once and prints without waiting for input`,`<code>--batch</code>, which disables all prompts`,`<code>CLAUDE_HEADLESS=1</code>, the headless environment flag`,`<code>--interactive=false</code>, which turns off the REPL`],
     correct:0, why:`The <code>-p</code>/<code>--print</code> flag runs Claude non-interactively and prints output, avoiding input hangs in CI.`,
     traps:{B:`<code>--batch</code> is not a real Claude Code flag.`,C:`<code>CLAUDE_HEADLESS</code> is not a real environment variable.`,D:`<code>--interactive=false</code> is not the documented non-interactive flag.`}},
    {q:`Your CI job needs to post Claude's review findings as inline PR comments, so the output must be machine-parseable. Which combination produces that?`,
     options:[`<code>--output-format json</code> with <code>--json-schema</code> to produce parseable findings`,`<code>-p</code> alone, which always emits JSON by default`,`<code>--batch</code> with <code>CLAUDE_HEADLESS</code> for structured output`,`<code>--print</code> with <code>--interactive</code> for formatted comments`],
     correct:0, why:`Combining <code>--output-format json</code> with <code>--json-schema</code> yields structured, parseable findings for inline comments.`,
     traps:{B:`<code>-p</code> prints output but doesn't by itself guarantee a parseable JSON schema.`,C:`Neither <code>--batch</code> nor <code>CLAUDE_HEADLESS</code> exists.`,D:`<code>--interactive</code> contradicts non-interactive CI and doesn't structure output.`}},
    {q:`Why does an independent Claude review instance in CI catch more issues than having the code generator review its own work?`,
     options:[`Session isolation means the reviewer lacks the generator's reasoning context and isn't anchored to its assumptions`,`The reviewer runs on a larger model automatically`,`Self-review is blocked by the API and always errors`,`The isolated instance has access to more files than the generator`],
     correct:0, why:`An isolated review instance doesn't share the generator's reasoning, so it isn't biased by the same assumptions and catches more.`,
     traps:{B:`Isolation doesn't imply a larger model; the benefit is independence, not model size.`,C:`Self-review isn't API-blocked; it's just less effective, not impossible.`,D:`File access isn't the differentiator; freedom from shared reasoning is.`}},
    {q:`On a re-run of an automated PR review, how do you prevent Claude from posting duplicate comments for issues it already flagged?`,
     options:[`Include the prior findings so it reports only new or still-unaddressed issues`,`Add <code>--batch</code> so each run starts completely fresh`,`Set <code>CLAUDE_HEADLESS</code> to deduplicate comments automatically`,`Disable JSON output so comments can't repeat`],
     correct:0, why:`Feeding prior findings into the re-run lets Claude skip resolved items and report only new or unaddressed ones.`,
     traps:{B:`<code>--batch</code> isn't a real flag, and a fresh start would re-flag everything.`,C:`<code>CLAUDE_HEADLESS</code> isn't real and doesn't deduplicate.`,D:`Turning off JSON output breaks parsing without preventing duplicates.`}},
    {q:`What role does <code>CLAUDE.md</code> play when Claude runs an automated review in CI?`,
     options:[`It supplies CI context such as testing standards, fixtures, and review criteria`,`It selects the non-interactive flag for the runner`,`It defines the JSON schema for parseable output`,`It isolates the review session from the generator`],
     correct:0, why:`<code>CLAUDE.md</code> provides the project context — testing standards, fixtures, and criteria — that grounds the CI review.`,
     traps:{B:`Flag selection is done on the command line, not in CLAUDE.md.`,C:`The JSON schema is specified via <code>--json-schema</code>, not CLAUDE.md.`,D:`Session isolation comes from running a separate instance, not from CLAUDE.md.`}},
    {q:`A teammate proposes <code>CLAUDE_HEADLESS=1</code> and <code>--batch</code> to run Claude in CI. What's the problem with this plan?`,
     options:[`Neither is a real flag; the correct non-interactive approach is <code>-p</code>/<code>--print</code>`,`Both work but only on self-hosted runners`,`They work but require disabling JSON output`,`They are valid but slower than interactive mode`],
     correct:0, why:`<code>CLAUDE_HEADLESS</code> and <code>--batch</code> don't exist; <code>-p</code>/<code>--print</code> is the real non-interactive mechanism.`,
     traps:{B:`They don't work on any runner because they aren't real flags.`,C:`Since they aren't real, JSON output considerations are moot.`,D:`Non-existent flags can't be valid or compared on speed.`}},
    {q:`Your CI review step must emit findings that a script can read and map to specific lines for inline comments. Which output configuration is correct?`,
     options:[`<code>--output-format json</code> combined with <code>--json-schema</code>`,`<code>--print</code> with default plain-text output`,`<code>--batch</code> with verbose logging`,`<code>CLAUDE_HEADLESS</code> with markdown output`],
     correct:0, why:`<code>--output-format json</code> plus <code>--json-schema</code> produces structured findings a script can parse and map to lines.`,
     traps:{B:`Plain-text output isn't reliably machine-parseable for line mapping.`,C:`<code>--batch</code> isn't a real flag and verbose logs aren't structured findings.`,D:`<code>CLAUDE_HEADLESS</code> doesn't exist and markdown isn't a parseable schema.`}},
    {q:`Which practice best improves the quality of an automated Claude review in CI?`,
     options:[`Run it as an independent, session-isolated instance separate from whatever generated the code`,`Always reuse the generator's exact session so it remembers its choices`,`Skip <code>CLAUDE.md</code> so the review stays unbiased`,`Use interactive mode so a human can intervene mid-run`],
     correct:0, why:`A session-isolated reviewer without the generator's reasoning context catches more issues than self-review.`,
     traps:{B:`Reusing the generator's session re-introduces the same blind spots that hurt self-review.`,C:`Dropping <code>CLAUDE.md</code> removes the testing standards and criteria the review needs.`,D:`Interactive mode hangs CI and defeats the point of an automated pipeline step.`}},
    {q:`You're generating tests in CI and Claude keeps proposing scenarios already covered by the existing suite. Best way to reduce this low-value output?`,
     options:[`Provide the existing test files in context so it avoids duplicating covered scenarios`,`Switch to <code>--batch</code> mode`,`Remove CLAUDE.md so it has fewer constraints`,`Lower the temperature to 0`],
     correct:0, why:`Supplying the existing tests lets Claude see what's already covered and focus on genuinely new scenarios, improving quality.`,
     traps:{B:`<code>--batch</code> isn't a real flag and wouldn't address duplicate scenarios.`,C:`Removing CLAUDE.md drops the testing standards that improve generation quality.`,D:`Temperature doesn't tell the model which scenarios are already covered.`}},
  ]},

};
