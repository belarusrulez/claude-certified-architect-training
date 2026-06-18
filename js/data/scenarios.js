/* =========================================================================
   EXAM SCENARIOS — the six production scenarios from the exam guide. The real
   exam presents 4 of these 6 at random; each frames a set of questions and
   names its primary domains. Shown so practice matches the exam structure.
   ========================================================================= */
export const SCENARIOS = [
  { n:1, title:`Customer Support Resolution Agent`, domains:["d1", "d2", "d5"],
    desc:`You are building a customer support resolution agent using the Claude Agent SDK. The agent handles high-ambiguity requests like returns, billing disputes, and account issues. It has access to your backend systems through custom Model Context Protocol (MCP) tools (get_customer, lookup_order, process_refund, escalate_to_human). Your target is 80%+ first-contact resolution while knowing when to escalate.` },
  { n:2, title:`Code Generation with Claude Code`, domains:["d3", "d5"],
    desc:`You are using Claude Code to accelerate software development. Your team uses it for code generation, refactoring, debugging, and documentation. You need to integrate it into your development workflow with custom slash commands, CLAUDE.md configurations, and understand when to use plan mode vs direct execution.` },
  { n:3, title:`Multi-Agent Research System`, domains:["d1", "d2", "d5"],
    desc:`You are building a multi-agent research system using the Claude Agent SDK. A coordinator agent delegates to specialized subagents: one searches the web, one analyzes documents, one synthesizes findings, and one generates reports. The system researches topics and produces comprehensive, cited reports.` },
  { n:4, title:`Developer Productivity with Claude`, domains:["d2", "d3", "d1"],
    desc:`You are building developer productivity tools using the Claude Agent SDK. The agent helps engineers explore unfamiliar codebases, understand legacy systems, generate boilerplate code, and automate repetitive tasks. It uses the built-in tools (Read, Write, Bash, Grep, Glob) and integrates with Model Context Protocol (MCP) servers.` },
  { n:5, title:`Claude Code for Continuous Integration`, domains:["d3", "d4"],
    desc:`You are integrating Claude Code into your Continuous Integration/Continuous Deployment (CI/CD) pipeline . The system runs automated code reviews, generates test cases, and provides feedback on pull requests. You need to design prompts that provide actionable feedback and minimize false positives.` },
  { n:6, title:`Structured Data Extraction`, domains:["d4", "d5"],
    desc:`You are building a structured data extraction system using Claude. The system extracts information from unstructured documents, validates the output using JavaScript Object Notation (JSON) schemas, and maintains high accuracy. It must handle edge cases gracefully and integrate with downstream systems.` },
];
