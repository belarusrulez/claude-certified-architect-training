/* =========================================================================
   DOMAIN MODEL  —  five exam domains and their weightings. Each topic id
   listed here must have a matching entry in topics.js.
   ========================================================================= */
export const DOMAINS = [
  { id:'d1', title:'Agentic Architecture & Orchestration', weight:'27%',
    topics:['agent-loop','multi-agent','hooks','decomposition'] },
  { id:'d2', title:'Tool Design & MCP Integration', weight:'18%',
    topics:['tool-descriptions','structured-errors','tool-distribution','mcp-config'] },
  { id:'d3', title:'Claude Code Configuration & Workflows', weight:'20%',
    topics:['claudemd','commands-skills','path-rules','plan-mode','cicd'] },
  { id:'d4', title:'Prompt Engineering & Structured Output', weight:'20%',
    topics:['explicit-criteria','few-shot','structured-output','validation-retry','batch'] },
  { id:'d5', title:'Context Management & Reliability', weight:'15%',
    topics:['context-preservation','escalation','error-propagation','provenance'] },
];

export const DOMAIN_NAME = Object.fromEntries(
  DOMAINS.map(d => [d.id, `Domain ${d.id[1]}: ${d.title}`])
);
