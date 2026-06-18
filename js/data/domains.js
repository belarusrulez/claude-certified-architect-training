/* =========================================================================
   DOMAIN MODEL — the five exam domains, their weightings, and the chapters
   under each. Chapters map 1:1 to the exam guide's task statements (the `ts`
   tag lives on each chapter in js/data/d{N}.js). 30 chapters total.
   ========================================================================= */
export const DOMAINS = [
  { id:'d1', title:'Agentic Architecture & Orchestration', weight:'27%',
    topics:['agent-loop','multi-agent','subagent-config','workflow-enforcement','hooks','decomposition','sessions'] },
  { id:'d2', title:'Tool Design & MCP Integration', weight:'18%',
    topics:['tool-descriptions','structured-errors','tool-distribution','mcp-config','builtin-tools'] },
  { id:'d3', title:'Claude Code Configuration & Workflows', weight:'20%',
    topics:['claudemd','commands-skills','path-rules','plan-mode','iterative-refinement','cicd'] },
  { id:'d4', title:'Prompt Engineering & Structured Output', weight:'20%',
    topics:['explicit-criteria','few-shot','structured-output','validation-retry','batch','review-architectures'] },
  { id:'d5', title:'Context Management & Reliability', weight:'15%',
    topics:['context-preservation','escalation','error-propagation','codebase-context','human-review','provenance'] },
];

export const DOMAIN_NAME = Object.fromEntries(
  DOMAINS.map(d => [d.id, `Domain ${d.id[1]}: ${d.title}`])
);
