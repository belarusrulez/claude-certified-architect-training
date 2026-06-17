/* =========================================================================
   STORE — single-user local persistence via localStorage.

   Replaces the old `window.storage` host bridge (which only existed inside
   the artifact sandbox and silently no-op'd on a real file:// / served page).
   Everything a single learner accumulates lives under one key and survives
   reloads: studied chapters, per-chapter best scenario score, best mixed
   score, every quiz's answers + graded state, the per-quiz shuffle seed (so a
   resumed quiz restores the exact option order the learner saw), the mixed
   exam's selected questions, and the last view.

   Schema is versioned so a future migration can upgrade old blobs.
   ========================================================================= */

const KEY = 'cca_progress';
const VERSION = 2;

/* ---- leveled logging (verbose 0 … critical 5); default warn+ in prod ---- */
const LEVELS = { verbose:0, debug:1, info:2, warning:3, error:4, critical:5 };
const THRESHOLD = LEVELS.debug; // dev default; raise to LEVELS.warning to quiet
export const log = {
  _emit(lvl, msg){ if(LEVELS[lvl] >= THRESHOLD) console[lvl==='error'||lvl==='critical'?'error':lvl==='warning'?'warn':'log'](`[store] ${msg}`); },
  debug(m){ this._emit('debug', m); },
  info(m){ this._emit('info', m); },
  warning(m){ this._emit('warning', m); },
  error(m){ this._emit('error', m); },
};

function emptyState(){
  return { v:VERSION, studied:[], chapterBest:{}, bestMixed:0, quizzes:{}, seeds:{}, mixedSel:null, lastView:'home' };
}

/* migrate older shapes forward; unknown/missing → fresh */
function migrate(raw){
  if(!raw || typeof raw !== 'object') return emptyState();
  if(raw.v === VERSION) return { ...emptyState(), ...raw };
  // v1 (or pre-version) only had {studied, bestMixed}
  log.info(`migrating progress from v${raw.v||'1'} → v${VERSION}`);
  const fresh = emptyState();
  if(Array.isArray(raw.studied)) fresh.studied = raw.studied;
  if(typeof raw.bestMixed === 'number') fresh.bestMixed = raw.bestMixed;
  return fresh;
}

export const store = {
  /* Load returns a plain object (never throws). */
  load(){
    log.debug('load() entry');
    try {
      const txt = localStorage.getItem(KEY);
      if(!txt){ log.debug('load() no saved progress; fresh state'); return emptyState(); }
      const data = migrate(JSON.parse(txt));
      log.debug(`load() exit — ${data.studied.length} studied, bestMixed ${data.bestMixed}`);
      return data;
    } catch(e){
      log.error(`load() failed (${e}); returning fresh state`);
      return emptyState();
    }
  },

  /* Persist a snapshot built by the caller from live app state. */
  save(snapshot){
    try {
      snapshot.v = VERSION;
      localStorage.setItem(KEY, JSON.stringify(snapshot));
      log.debug('save() ok');
    } catch(e){
      log.error(`save() failed: ${e}`);
    }
  },

  /* Wipe all progress (Reset button). */
  clear(){
    try { localStorage.removeItem(KEY); log.info('progress cleared'); }
    catch(e){ log.error(`clear() failed: ${e}`); }
  },

  /* Export current blob as a pretty JSON string for download. */
  exportJSON(){
    const txt = localStorage.getItem(KEY);
    return JSON.stringify(txt ? JSON.parse(txt) : emptyState(), null, 2);
  },

  /* Import a JSON string (from a prior export). Returns the migrated state,
     or null if the text isn't valid/compatible. */
  importJSON(text){
    try {
      const data = migrate(JSON.parse(text));
      localStorage.setItem(KEY, JSON.stringify(data));
      log.info('progress imported');
      return data;
    } catch(e){
      log.error(`importJSON() failed: ${e}`);
      return null;
    }
  },
};
