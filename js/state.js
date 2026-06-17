/* =========================================================================
   STATE — the single in-memory app state plus persistence glue.

   `state` is mutated directly by the view/quiz code; `persist()` snapshots
   the durable slices into the store. Keeping this in one module lets nav,
   quiz, and app share state without import cycles.
   ========================================================================= */
import { store, log } from './store.js';

export const KEYS = ['A','B','C','D','E'];

export const state = {
  view:'home',
  pendingTab:null,
  studied:new Set(),     // topic ids visited
  chapterBest:{},         // tid -> best scaled scenario-exam score
  bestMixed:0,            // best scaled mixed-exam score
  quizzes:{},             // inst -> { answers:{qi:oi}, graded:bool }
  qsets:{},               // inst -> prepared (shuffled) question array (runtime)
  seeds:{},               // inst -> integer seed (persisted, drives the shuffle)
  mixed:null,             // runtime mixed question array
  mixedSel:null,          // persisted [{tid, idx}] selection for the mixed exam
};

/* Build the durable snapshot and hand it to the store. */
export function persist(){
  store.save({
    studied:[...state.studied],
    chapterBest:state.chapterBest,
    bestMixed:state.bestMixed,
    quizzes:state.quizzes,
    seeds:state.seeds,
    mixedSel:state.mixedSel,
    lastView:state.view,
  });
}

/* Apply a loaded snapshot into live state. */
export function hydrate(saved){
  state.studied = new Set(saved.studied || []);
  state.chapterBest = saved.chapterBest || {};
  state.bestMixed = saved.bestMixed || 0;
  state.quizzes = saved.quizzes || {};
  state.seeds = saved.seeds || {};
  state.mixedSel = saved.mixedSel || null;
  log.debug(`hydrated — view ${saved.lastView}, ${state.studied.size} studied`);
  return saved.lastView || 'home';
}

/* ---- deterministic RNG so a resumed quiz restores its exact shuffle ---- */
export function makeSeed(){
  // 31-bit positive int; varies per call without needing it to be cryptographic
  return (Math.floor(Math.random() * 0x7fffffff)) || 1;
}
function mulberry32(a){
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/* A per-instance RNG, optionally salted (e.g. by question index) so each
   question shuffles independently yet reproducibly from the stored seed. */
export function rngFor(seed, salt = 0){
  return mulberry32((seed ^ Math.imul(salt + 1, 0x9E3779B1)) >>> 0);
}
