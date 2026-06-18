/* =========================================================================
   APP — navigation, views (home / topic / mixed), routing, boot, and the
   sidebar data tools (reset / export / import). Entry point loaded as a
   module from index.html.
   ========================================================================= */
import { DOMAINS, DOMAIN_NAME } from './data/domains.js';
import { TOPICS, getChapterScenarios } from './data/topics.js';
import { store, log } from './store.js';
import { state, persist, hydrate } from './state.js';
import {
  prepareSet, quizBlock, wireQuiz, showScore,
  SCEN_EXAM_OPTS, QUICK_OPTS, MIXED_OPTS,
} from './quiz.js';

const nav    = document.getElementById('nav');
const main   = document.getElementById('main');
const sidebar= document.getElementById('sidebar');
const scrim  = document.getElementById('scrim');

function closeMenu(){ sidebar.classList.remove('open'); scrim.classList.remove('open'); }
document.getElementById('menuBtn').onclick=()=>{ sidebar.classList.add('open'); scrim.classList.add('open'); };
scrim.onclick=closeMenu;

/* ---------- navigation ---------- */
function studiedCount(){ return [...state.studied].filter(t=>TOPICS[t]).length; }
const TOTAL_TOPICS = Object.keys(TOPICS).length;

function buildNav(){
  let h=`<button class="nav-item ${state.view==='home'?'active':''}" data-view="home"><span class="ico">⌂</span> Overview</button>`;
  DOMAINS.forEach(d=>{
    h+=`<div class="nav-group"><span>Domain ${d.id[1]}</span><span class="w">${d.weight}</span></div>`;
    d.topics.forEach(tid=>{
      const t=TOPICS[tid];
      h+=`<button class="nav-item nav-topic ${state.view===tid?'active':''} ${state.studied.has(tid)?'done':''}" data-view="${tid}"><span class="ico">›</span> ${t.title}<span class="dot"></span></button>`;
    });
  });
  h+=`<div class="nav-group"><span>Exam</span></div>`;
  h+=`<button class="nav-item ${state.view==='mixed'?'active':''}" data-view="mixed"><span class="ico">✦</span> Mixed exam</button>`;
  h+=dataToolsHTML();
  nav.innerHTML=h;
  nav.querySelectorAll('.nav-item').forEach(b=>b.onclick=()=>{ go(b.dataset.view); closeMenu(); });
  wireDataTools();
}

function dataToolsHTML(){
  return `<div class="side-tools">
    <span class="st-label">Your progress</span>
    <div class="st-stat"><b>${studiedCount()}</b> / ${TOTAL_TOPICS} chapters · best mixed <b>${state.bestMixed||'—'}</b></div>
    <div class="st-row">
      <button class="mini" id="tool-export">Export</button>
      <button class="mini" id="tool-import">Import</button>
      <button class="mini danger" id="tool-reset">Reset</button>
    </div>
    <input type="file" id="tool-import-file" accept="application/json,.json" hidden>
  </div>`;
}

function wireDataTools(){
  const exportBtn=document.getElementById('tool-export');
  const importBtn=document.getElementById('tool-import');
  const importFile=document.getElementById('tool-import-file');
  const resetBtn=document.getElementById('tool-reset');
  if(exportBtn) exportBtn.onclick=()=>{
    const blob=new Blob([store.exportJSON()],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob); a.download='cca-progress.json';
    a.click(); URL.revokeObjectURL(a.href);
  };
  if(importBtn) importBtn.onclick=()=>importFile.click();
  if(importFile) importFile.onchange=()=>{
    const f=importFile.files[0]; if(!f) return;
    const r=new FileReader();
    r.onload=()=>{
      const saved=store.importJSON(String(r.result));
      if(!saved){ alert('That file is not a valid progress export.'); return; }
      Object.assign(state,{qsets:{},mixed:null}); // drop runtime caches
      hydrate(saved);
      buildNav(); render();
    };
    r.readAsText(f);
  };
  if(resetBtn) resetBtn.onclick=()=>{
    if(!confirm('Reset all progress? This clears studied chapters, answers, and scores on this device.')) return;
    store.clear();
    state.studied=new Set(); state.chapterBest={}; state.bestMixed=0;
    state.quizzes={}; state.qsets={}; state.seeds={}; state.mixed=null; state.mixedSel=null;
    go('home');
  };
}

function applyView(view,tab){ state.view=view; state.pendingTab=tab||null; if(TOPICS[view]) state.studied.add(view); persist(); buildNav(); render(); }
function parseHash(){ const raw=location.hash.replace(/^#/,''); const p=raw.split('/'); return {view:p[0]||'home', tab:p[1]||null}; }
function activateTopicTab(key){
  const map={eli5:'p-real',real:'p-real',quick:'p-quick',scen:'p-scen'}; const pid=map[key]; if(!pid) return;
  const tabs=main.querySelectorAll('.tab'); if(!tabs.length) return;
  main.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  main.querySelectorAll('.panel').forEach(x=>x.classList.remove('show'));
  const tab=[...tabs].find(t=>t.dataset.p===pid); if(tab) tab.classList.add('active');
  const panel=document.getElementById(pid); if(panel) panel.classList.add('show');
}
function onHashChange(){ const {view,tab}=parseHash(); const v=(view==='mixed'||TOPICS[view])?view:'home'; if(v!==state.view){ applyView(v,tab); window.scrollTo({top:0,behavior:'smooth'}); } else if(tab){ activateTopicTab(tab); } }
function go(view){ applyView(view,null); const cur=location.hash.replace(/^#/,'').split('/')[0]; if(cur!==view) location.hash=view; window.scrollTo({top:0,behavior:'smooth'}); }

/* ---------- views ---------- */
function topicProgress(d){
  const done=d.topics.filter(t=>state.studied.has(t)).length;
  return Math.round(done/d.topics.length*100);
}
function renderHome(){
  main.innerHTML=`
    <div class="eyebrow">Claude Certified Architect — Foundations</div>
    <h1>Your training console</h1>
    <p class="lead">Walk each domain topic by topic. Every topic runs the same ladder: Learn the real engineering (with a hover-for-ELI5 simple take), then quick checks, then exam-style scenarios. When you're ready, the mixed exam shuffles scenarios across all five domains like the real thing.</p>
    <div class="meta-row">
      <span class="tag">60 questions on the real exam</span>
      <span class="tag">10+ scenarios per chapter</span>
      <span class="tag">pass = 720 / 1000</span>
      <span class="tag">best mixed: ${state.bestMixed||'—'}</span>
    </div>
    <div class="home-grid">
      ${DOMAINS.map(d=>`<button class="dcard" data-view="${d.topics[0]}">
        <div class="dn">DOMAIN ${d.id[1]} · ${d.weight}</div>
        <h3>${d.title}</h3>
        <div class="dw">${d.topics.length} chapters</div>
        <div class="dprog"><div style="width:${topicProgress(d)}%"></div></div>
      </button>`).join('')}
    </div>`;
  main.querySelectorAll('.dcard').forEach(c=>c.onclick=()=>go(c.dataset.view));
}
function renderTopic(tid){
  const t=TOPICS[tid];
  const inst5=tid+'-quick', instS=tid+'-scenario';
  const quick=prepareSet(inst5,t.quick);
  const scen=prepareSet(instS,getChapterScenarios(tid));
  main.innerHTML=`
    <div class="eyebrow">${DOMAIN_NAME[t.domain]}${t.ts?` · ${t.ts}`:''}</div>
    <h1>${t.title}</h1>
    <div class="tabs">
      <button class="tab active" data-p="p-real">Learn</button>
      <button class="tab" data-p="p-quick">Quick checks <span class="n">${t.quick.length}</span></button>
      <button class="tab" data-p="p-scen">Scenario questions <span class="n">${scen.length}</span></button>
    </div>
    <div class="panel show" id="p-real">
      <div class="eli5-wrap" tabindex="0" aria-label="Explain like I'm 5">
        <span class="eli5-chip"><span class="ico">◔</span> Explain like I'm 5 <span class="hov">— hover</span></span>
        <div class="eli5-pop"><div class="stage-label">◔ Explain like I'm 5</div>${t.eli5}</div>
      </div>
      <div class="stage-card stage-real"><div class="stage-label">◑ The real deal</div><div class="stage-card-inner">${t.real}</div></div>${t.callout?`<div class="callout">${t.callout}</div>`:''}${t.example?`<div class="example"><b>${t.example.label}</b><pre><code>${t.example.body}</code></pre></div>`:''}</div>
    <div class="panel" id="p-quick">${quizBlock(inst5,quick,QUICK_OPTS)}</div>
    <div class="panel" id="p-scen">${quizBlock(instS,scen,SCEN_EXAM_OPTS)}</div>`;
  const TKEY={'p-real':'real','p-quick':'quick','p-scen':'scen'};
  main.querySelectorAll('.tab').forEach(tab=>tab.onclick=()=>{
    main.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    main.querySelectorAll('.panel').forEach(x=>x.classList.remove('show'));
    tab.classList.add('active'); document.getElementById(tab.dataset.p).classList.add('show');
    const k=TKEY[tab.dataset.p]; if(k) location.hash=tid+'/'+k;
  });
  wireQuiz(inst5,quick,QUICK_OPTS);
  wireQuiz(instS,scen,SCEN_EXAM_OPTS);
  if(state.quizzes[instS]&&state.quizzes[instS].graded) showScore(instS,scen,SCEN_EXAM_OPTS);
  if(state.pendingTab){ activateTopicTab(state.pendingTab); state.pendingTab=null; }
}

/* Build the mixed exam: persist the selection so a reload restores the same
   ten questions (and their seeded option order). */
function buildMixed(fresh){
  if(fresh || !state.mixedSel){
    const refs=[];
    Object.keys(TOPICS).forEach(tid=>getChapterScenarios(tid).forEach((_,idx)=>refs.push({tid,idx})));
    for(let i=refs.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[refs[i],refs[j]]=[refs[j],refs[i]];}
    state.mixedSel=refs.slice(0,10);
    state.quizzes['mixed']={answers:{},graded:false};
    delete state.qsets['mixed'];
    delete state.seeds['mixed'];
  }
  state.mixed=state.mixedSel.map(({tid,idx})=>{
    const q=getChapterScenarios(tid)[idx];
    return { ...q, domainLabel:DOMAIN_NAME[TOPICS[tid].domain] };
  });
  persist();
}
function renderMixed(){
  if(!state.mixed) buildMixed(false);
  const qs=prepareSet('mixed',state.mixed);
  main.innerHTML=`
    <div class="eyebrow">Mixed exam</div>
    <h1>Cross-domain scenario set</h1>
    <p class="lead">Ten scenario questions pulled at random from every domain — the closest thing to sitting the real exam. Each one is tagged with its domain so you can see where you're strong.</p>
    <div style="margin-top:24px">${quizBlock('mixed',qs,MIXED_OPTS)}</div>
    <div class="q-actions"><button class="ghost" id="reshuffle">↻ New random set</button></div>`;
  wireQuiz('mixed',qs,MIXED_OPTS);
  if(state.quizzes['mixed'].graded) showScore('mixed',qs,MIXED_OPTS);
  document.getElementById('reshuffle').onclick=()=>{ buildMixed(true); renderMixed(); window.scrollTo({top:0,behavior:'smooth'}); };
}
function render(){
  if(state.view==='home') renderHome();
  else if(state.view==='mixed') renderMixed();
  else if(TOPICS[state.view]) renderTopic(state.view);
  else renderHome();
}

/* ---------- boot ---------- */
(function boot(){
  log.info('booting CCA trainer');
  const lastView = hydrate(store.load());
  const h=parseHash();
  state.view=(h.view==='mixed'||TOPICS[h.view])?h.view:(TOPICS[lastView]||lastView==='mixed'?lastView:'home');
  state.pendingTab=h.tab;
  buildNav(); render();
  window.addEventListener('hashchange',onHashChange);
})();
