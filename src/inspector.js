// Optional field guide. Gameplay remains on the canvas; these cards are touch/keyboard readable.
(function (root) {
  'use strict';
  const B = root.BF, T = root.TECHS, A = root.ART;
  let panel, canvas, active, closeCallback, trigger;
  const escape = (text) => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const names = { power:'Power', move:'Travel', food:'Food', water:'Water', home:'Homes', make:'Making', waste:'Reuse', wild:'Nature' };
  function setup() {
    if (panel) return;
    panel = document.createElement('div'); panel.className = 'guide-shade'; panel.hidden = true;
    document.body.appendChild(panel);
    panel.addEventListener('pointerdown', e => { if (e.target === panel) close(); e.stopPropagation(); });
    panel.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
      if (e.key === 'Tab') { const list = [...panel.querySelectorAll('button, summary, [tabindex="0"]')].filter(el => !el.closest('details:not([open])') || el.tagName === 'SUMMARY'); const first=list[0], last=list[list.length-1]; if (e.shiftKey && document.activeElement===first) { last.focus();e.preventDefault(); } else if (!e.shiftKey && document.activeElement===last) {first.focus();e.preventDefault();} }
    });
  }
  function mount(body, cb) {
    setup(); trigger=document.activeElement; closeCallback=cb; panel.innerHTML='<section class="field-guide" role="dialog" aria-modal="true" aria-labelledby="guide-title"><button class="guide-close" aria-label="Close field guide">×</button>'+body+'<button class="guide-done">Back to my town →</button></section>'; panel.hidden=false;
    panel.querySelector('.guide-close').onclick=close; panel.querySelector('.guide-done').onclick=close;
    panel.querySelector('.guide-close').focus();
    canvas=panel.querySelector('canvas');
  }
  function close() { if (!panel || panel.hidden) return; panel.hidden=true; active=null; canvas=null; const cb=closeCallback; closeCallback=null; if (cb) cb(); if (trigger && trigger.focus) trigger.focus(); }
  function techName(axis, era) { return T.tech(axis, era, 'leaf').name; }
  function discoveryList(s, axis) {
    const unlocked = B.discoveries ? B.discoveries(s) : [];
    const list = (B.DISCOVERIES || []).map(d => Object.assign({},d,{unlocked:unlocked.some(u=>u.id===d.id)}));
    return list.filter(d => !axis || d.requires.some(r => r[0] === axis)).map(d => '<article class="connection '+(d.unlocked?'connected':'')+'"><div class="connection-title">'+(d.unlocked?'✓ ':'○ ')+escape(d.name)+'</div><div class="connection-tracks">'+d.requires.map(([a,e])=>'<span class="'+(s.era[a]>=e?'met':'')+'">'+escape(techName(a,e))+'</span>').join('<b> + </b>')+'</div><p>'+escape(d.bonusText)+'</p><small>'+(d.unlocked?'Connected! The bonus is active.':'A bonus to discover as you upgrade.')+'</small></article>').join('');
  }
  // v0.10 tech tree: what this step needs first, and what it opens the way to.
  function stepName(axis, era) { return era === 3 ? 'its future' : T.tech(axis, era).name; }
  function treeSection(s, axis, era) {
    if (!B.needsOf) return '';
    const needs = B.needsOf(axis, era), opens = era < 3 ? B.unlocksOf(axis, era) : [];
    if (!needs.length && !opens.length) return '';
    let html = '<div class="tech-tree"><h3>Tech tree</h3>';
    for (const n of needs) {
      const met = n.kind === 'sky' ? (s.era[axis] >= era || B.skyClear(s)) : s.era[n.axis] >= n.era;
      const label = n.kind === 'sky' ? 'a clear sky' : T.tech(n.axis, n.era).name;
      html += '<p class="tree-need '+(met?'met':'')+'"><b>'+(met?'✓ ':'🔒 ')+'Needs '+escape(label)+'.</b> '+escape(B.LOCK_REASONS[n.why])+'</p>';
    }
    for (const o of opens) html += '<p class="tree-open"><b>→ Opens the way to '+escape(stepName(o.axis, o.era))+'.</b> '+escape(B.LOCK_REASONS[o.why])+'</p>';
    return html + '</div>';
  }
  // v0.12 Paragon card: one trophy per track, made from all three futures.
  function openParagon(cd, s, cb) {
    const pg=T.PARAGONS[cd.axis], fut=['leaf','star','magic'].map(v=>T.tech(cd.axis,3,v).name);
    mount('<div class="guide-kicker">Paragon · '+names[cd.axis]+'</div><h2 id="guide-title">'+escape(pg.name)+'</h2><div class="truth-badge imagine">Imagine</div><div class="guide-intro"><div class="guide-picture"><canvas width="560" height="340" aria-label="Animated '+escape(pg.name)+' illustration"></canvas></div><div><p class="tech-line">'+escape(pg.line)+'</p><p class="truth-note">'+escape(T.statusNote('Imagine'))+'</p><h3>In your town</h3><p>'+escape(pg.town)+'</p></div></div><div class="future-effect paragon-effect"><b>♛ Made from all three futures</b><br>❧ '+escape(fut[0])+' + ★ '+escape(fut[1])+' + ✧ '+escape(fut[2])+'</div><details><summary>How it blends Nature, Future and Magic</summary><p>'+escape(pg.weave)+'</p></details>',cb);
    active=cd;
  }
  function open(cd, s, cb) {
    if (cd.kind==='paragon' && T.PARAGONS && T.PARAGONS[cd.axis]) return openParagon(cd, s, cb);
    const tc=T.tech(cd.axis,cd.era,cd.variant), status=tc.status || 'Today';
    const simulation = cd.era === 3 ? '<div class="future-effect"><b>'+(cd.variant==='magic'?'✧ Magic future':cd.variant==='star'?'★ Tech future':'❧ Nature future')+'</b><br>'+escape(T.futureBonus(cd.variant))+'</div>' : '';
    const temp=Object.assign({},s,{era:Object.assign({},s.era,{[cd.axis]:cd.era}),variant:Object.assign({},s.variant,{[cd.axis]:cd.variant})});
    const good=[],bad=[];
    for (const other of B.AXES) for(const op of B.linkOps(temp,cd.axis,other)) {
      const text=names[other]+': '+B.REASONS[op.why]+'.';
      const list=op.v>0?good:bad; if(!list.includes(text))list.push(text);
    }
    let details='<details><summary>Why these neighbours?</summary><p class="explain-hint">These are the town’s game rules. Clean-air scores simplify real technology.</p>';
    if (good.length) details+='<h3>♥ Happy neighbours</h3><ul>'+good.map(x=>'<li>'+escape(x)+'</li>').join('')+'</ul>';
    if (bad.length) details+='<h3>☁ Tricky neighbours</h3><ul>'+bad.map(x=>'<li>'+escape(x)+'</li>').join('')+'</ul>';
    details+='</details>';
    const connections=discoveryList(s,cd.axis);
    if(connections) details+='<details><summary>Connected discoveries</summary>'+connections+'</details>';
    const tree=treeSection(s,cd.axis,cd.treeEra||cd.era);
    mount('<div class="guide-kicker">'+(cd.kind==='new'?'New discovery':cd.kind==='locked'?'Locked for now · '+names[cd.axis]:cd.kind==='next'?'Next step · '+names[cd.axis]:'Your town · '+names[cd.axis])+'</div><h2 id="guide-title">'+escape(tc.name)+'</h2><div class="truth-badge '+status.toLowerCase()+'">'+status+'</div><div class="guide-intro"><div class="guide-picture"><canvas width="560" height="340" aria-label="Animated '+escape(tc.name)+' illustration"></canvas></div><div><p class="tech-line">'+escape(tc.line)+'</p><p class="truth-note">'+escape(T.statusNote(status,cd.variant))+'</p><h3>In your town</h3><p>'+escape(tc.town)+'</p></div></div>'+(cd.kind==='locked'?tree+simulation:simulation+tree)+details,cb);
    active=cd;
  }
  function discoveries(s,cb) {
    const ds=B.DISCOVERIES, n=B.discoveries(s).length;
    mount('<div class="guide-kicker">Little ideas, working together</div><h2 id="guide-title">Town connections</h2><p>Discover helpful pairs as you upgrade. Follow any path you like.</p><div class="discovery-count">'+n+' of '+ds.length+' discovered</div>'+discoveryList(s)+'<p class="truth-note">Each connected pair adds +1 sunbeam when you place the two kinds beside each other. Future bonuses can add another +1.</p>',cb);
    active={kind:'discoveries'};
  }
  function tick(t) {
    if (!canvas || !active || !active.axis) return;
    const g=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
    g.clearRect(0,0,w,h); const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,active.variant==='magic'?'#d8c6f4':'#b9e4ee');gr.addColorStop(1,active.variant==='magic'?'#fff0db':'#f6f4d7');g.fillStyle=gr;g.fillRect(0,0,w,h);
    A.circle(g,w*.79,h*.23,25,'#ffe49a');
    for(let i=0;i<3;i++) {let x=((i*220+t*7)%(w+170))-85;A.ell(g,x,58+i*27,62,14,'#fff9e6');}
    A.ell(g,w/2,h*.92,w*.45,h*.2,'#93b978');
    if (active.kind==='paragon' && A.drawParagon) A.drawParagon(g,active.axis,w/2,h*.74,Math.min(w*.16,h*.24),t,false);
    else A.drawBuilding(g,active.axis,active.era,active.variant,w/2,h*.85,Math.min(w*.3,h*.48),t,false);
  }
  root.INSPECTOR={open,close,discoveries,tick,get isOpen(){return !!panel && !panel.hidden;}};
})(window);
