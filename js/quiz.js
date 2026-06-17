/* =========================================================================
   QUIZ ENGINE — renders question sets, records answers, grades, and scores.

   Option order is shuffled per question, but deterministically from a stored
   per-instance seed, so reloading restores the exact layout the learner saw
   (and their saved answer indices still line up). Answers + graded state are
   persisted on every interaction; scenario/mixed scores update the bests.
   ========================================================================= */
import { state, persist, KEYS, makeSeed, rngFor } from './state.js';

export const SCEN_EXAM_OPTS = { scorebox:true, intro:'Exam-style scenarios for this chapter. Answer all, then check — scored to the 720 line.' };
export const QUICK_OPTS    = { intro:'Fast concept checks. Answer all, then check.' };
export const MIXED_OPTS    = { scorebox:true, intro:'Answer all ten, then check. Score scales to the 720 pass line.' };

/* Shuffle a question's options with a supplied RNG, remapping correct + traps. */
function shuffleOptions(q, rng){
  const idx = q.options.map((_,i)=>i);
  for(let i=idx.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [idx[i],idx[j]]=[idx[j],idx[i]]; }
  const newOptions = idx.map(i=>q.options[i]);
  const newCorrect = idx.indexOf(q.correct);
  let newTraps = q.traps;
  if(q.traps){
    newTraps = {};
    idx.forEach((orig,ni)=>{ if(orig===q.correct) return; const t=q.traps[KEYS[orig]]; if(t!==undefined) newTraps[KEYS[ni]]=t; });
  }
  return { ...q, options:newOptions, correct:newCorrect, traps:newTraps };
}

/* Prepare (and cache) the shuffled question set for an instance, using its
   persisted seed so the order is stable across reloads. */
export function prepareSet(inst, raw){
  if(state.qsets[inst]) return state.qsets[inst];
  if(!state.seeds[inst]){ state.seeds[inst] = makeSeed(); persist(); }
  const seed = state.seeds[inst];
  state.qsets[inst] = raw.map((q,i)=>shuffleOptions(q, rngFor(seed, i)));
  return state.qsets[inst];
}

function optionHTML(qi,oi,opt,inst,graded,chosen,correctIdx){
  let cls='opt', mark='';
  if(graded){ if(oi===correctIdx){cls+=' correct';mark='correct';} else if(chosen){cls+=' wrong';mark='your pick';} }
  else if(chosen){ cls+=' sel'; }
  return `<button class="${cls}" data-inst="${inst}" data-q="${qi}" data-o="${oi}" ${graded?'disabled':''}>
    <span class="key">${KEYS[oi]}</span><span class="otext">${opt}</span>${mark?`<span class="mark">${mark}</span>`:''}</button>`;
}

export function quizHTML(inst,questions,opts){
  const qz = state.quizzes[inst] || (state.quizzes[inst] = { answers:{}, graded:false });
  let h='';
  if(opts.scorebox) h+=`<div class="scorebox" id="score-${inst}"><div class="st"><div class="num" id="score-num-${inst}">0 / 0</div><div class="verdict" id="score-v-${inst}"></div></div><div class="scaled" id="score-s-${inst}"></div><div class="bar"><div class="bar-fill" id="score-bar-${inst}"></div><div class="bar-mark"></div></div></div>`;
  if(opts.intro) h+=`<p class="q-intro">${opts.intro}</p>`;
  questions.forEach((item,qi)=>{
    const chosen=qz.answers[qi];
    const optsH=item.options.map((o,oi)=>optionHTML(qi,oi,o,inst,qz.graded,chosen===oi,item.correct)).join('');
    let exp='';
    if(qz.graded){
      const traps=item.traps?Object.entries(item.traps).map(([k,v])=>`<div><b>${k}</b> — ${v}</div>`).join(''):'';
      exp=`<div class="explain show"><h4>Why ${KEYS[item.correct]} is right</h4><p>${item.why}</p>${traps?`<h4>Why the others fail</h4><div class="traps">${traps}</div>`:''}</div>`;
    }
    h+=`<div class="q ${qz.graded?'graded':''}">
      <div class="q-head"><div class="q-num">${qi+1}</div><div>${item.domainLabel?`<div class="q-domain">${item.domainLabel}</div>`:''}<div class="q-text">${item.q}</div></div></div>
      <div class="opts">${optsH}</div>${exp}</div>`;
  });
  h+=`<div class="q-actions">
    <button class="primary" id="check-${inst}">${opts.checkLabel||'Check answers'}</button>
    <button class="ghost" id="reset-${inst}" style="display:${qz.graded?'inline-block':'none'}">Reset</button>
    <span class="hint" id="prog-${inst}"></span></div>`;
  return h;
}

export function wireQuiz(inst,questions,opts){
  const qz=state.quizzes[inst];
  const checkBtn=document.getElementById('check-'+inst);
  const resetBtn=document.getElementById('reset-'+inst);
  const prog=document.getElementById('prog-'+inst);
  function updateProg(){
    if(qz.graded){ prog.textContent=''; return; }
    const n=Object.keys(qz.answers).length;
    prog.textContent=`${n} / ${questions.length} answered`;
    checkBtn.disabled=n<questions.length;
  }
  document.querySelectorAll(`.opt[data-inst="${inst}"]`).forEach(btn=>{
    btn.onclick=()=>{ if(qz.graded)return; qz.answers[+btn.dataset.q]=+btn.dataset.o; persist(); rerenderQuiz(inst,questions,opts); };
  });
  checkBtn.onclick=()=>{
    if(Object.keys(qz.answers).length<questions.length)return;
    qz.graded=true; persist(); rerenderQuiz(inst,questions,opts);
    if(opts.scorebox) showScore(inst,questions,opts);
  };
  resetBtn.onclick=()=>{ qz.answers={}; qz.graded=false; persist(); rerenderQuiz(inst,questions,opts); const s=document.getElementById('score-'+inst); if(s)s.classList.remove('show'); };
  updateProg();
}

export function rerenderQuiz(inst,questions,opts){
  const host=document.getElementById('quizhost-'+inst);
  host.innerHTML=quizHTML(inst,questions,opts);
  wireQuiz(inst,questions,opts);
  if(state.quizzes[inst].graded && opts.scorebox) showScore(inst,questions,opts);
}

export function showScore(inst,questions,opts){
  const qz=state.quizzes[inst];
  let correct=0; questions.forEach((it,qi)=>{ if(qz.answers[qi]===it.correct)correct++; });
  const total=questions.length, scaled=Math.round(correct/total*1000), pass=scaled>=720;
  document.getElementById('score-num-'+inst).textContent=`${correct} / ${total} correct`;
  const v=document.getElementById('score-v-'+inst); v.textContent=pass?'PASS':'BELOW LINE'; v.className='verdict '+(pass?'pass':'fail');
  document.getElementById('score-s-'+inst).textContent=`Scaled ≈ ${scaled} / 1000  (pass mark 720)`;
  document.getElementById('score-'+inst).classList.add('show');
  requestAnimationFrame(()=>{ document.getElementById('score-bar-'+inst).style.width=(scaled/10)+'%'; });
  // record bests
  if(inst==='mixed'){
    if(scaled>state.bestMixed){ state.bestMixed=scaled; persist(); }
  } else if(inst.endsWith('-scenario')){
    const tid=inst.slice(0,-'-scenario'.length);
    if(scaled>(state.chapterBest[tid]||0)){ state.chapterBest[tid]=scaled; persist(); }
  }
}

export function quizBlock(inst,questions,opts={}){
  return `<div id="quizhost-${inst}">${quizHTML(inst,questions,opts)}</div>`;
}
