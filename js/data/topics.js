/* =========================================================================
   TOPICS — aggregates the five per-domain chapter modules into one map.

   Each domain lives in its own module (d1.js … d5.js) so chapters can be
   maintained independently. A chapter:
     { domain, ts, title, eli5, real, callout?, example:{label,body},
       quick:[{q,options,correct,why}], scenario:[{q,options,correct,why,traps}] }

   Examples and scenario banks now live ON the chapter (no separate
   examples.js / extra.js / extra-more.js).
   ========================================================================= */
import { D1 } from './d1.js';
import { D2 } from './d2.js';
import { D3 } from './d3.js';
import { D4 } from './d4.js';
import { D5 } from './d5.js';

export const TOPICS = { ...D1, ...D2, ...D3, ...D4, ...D5 };

/* A chapter's graded scenario set. */
export function getChapterScenarios(tid){
  return (TOPICS[tid] && TOPICS[tid].scenario) || [];
}
