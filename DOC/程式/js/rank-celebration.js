/* An independent overlay preserves the dialogue, quiz and battle beneath it. */
var RankCelebration=(()=>{
 const root=document.createElement('section');root.id='rank-celebration';root.hidden=true;root.className='rank-celebration';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-labelledby','promotion-title');document.body.appendChild(root);
 let pending=null,timer=null,returnFocus=null,onDone=null,blocked=[];
 function restore(){for(const [node,inert] of blocked)node.inert=inert;blocked=[]}
 const focusable=node=>node?.isConnected&&!node.disabled&&node.getClientRects().length>0;
 function dismiss(){if(root.hidden)return;root.hidden=true;restore();const fn=onDone;onDone=null;const panel=['pause-menu','cutscene','modal','game'].map(id=>document.getElementById(id)).find(node=>node&&!node.hidden),fallback=panel&&[...panel.querySelectorAll('button.primary,button,input')].find(focusable);(focusable(returnFocus)?returnFocus:fallback)?.focus({preventScroll:true});fn?.()}
 function reset(){clearTimeout(timer);pending=null;root.hidden=true;onDone=null;restore()}
 function queue(from,to,motion,done){
  if(to<=from)return;pending={from:Math.min(pending?.from??from,from),to:Math.max(pending?.to??to,to),motion,done};clearTimeout(timer);
  timer=setTimeout(()=>{const p=pending;pending=null;show(p)},0);
 }
 function show(p){
  const ranks=Progression.ranks;returnFocus=document.activeElement;onDone=p.done;root.classList.toggle('no-motion',!p.motion||matchMedia('(prefers-reduced-motion: reduce)').matches);
  root.innerHTML='<div class="promotion-card"><div class="promotion-rays" aria-hidden="true"></div><div class="promotion-sparks" aria-hidden="true">'+Array.from({length:24},(_,i)=>'<i style="--angle:'+i*15+'deg;--delay:'+(i%6)*.12+'s"></i>').join('')+'</div><div class="promotion-kicker">每一道解答，成就更好的你</div><h2 id="promotion-title">榮耀晉升</h2><div class="promotion-transition" aria-live="polite"><div class="promotion-old"><span>原階級</span><strong>'+ranks[p.from-1].name+'</strong></div><div class="promotion-arrow" aria-hidden="true">➜</div><div class="promotion-new"><span>新階級</span><strong>'+ranks[p.to-1].name+'</strong></div></div><p class="promotion-reward">生命上限 +'+(p.to-p.from)*12+'　・　階級攻擊 +'+(p.to-p.from)*6+'</p><ol class="promotion-route" aria-label="完整十一階成長路線">'+ranks.map((r,i)=>'<li class="'+(i+1<p.from?'achieved':i+1===p.from?'origin':i+1<=p.to?'promoted':'future')+'" style="--step-delay:'+Math.max(0,i+1-p.from)*.25+'s"><span class="rank-gem">'+(i+1)+'</span><strong>'+r.name+'</strong><small>'+r.total.toLocaleString()+' EXP</small></li>').join('')+'</ol><p class="promotion-message">'+(p.to===11?'傳奇已至，學習與旅程仍將繼續。':'從'+ranks[p.from-1].name+'邁向'+ranks[p.to-1].name+'，山河見證你的成長。')+'</p><button class="primary" id="promotion-continue">繼續旅途 →</button></div>';
  if(!blocked.length){blocked=[...document.body.children].filter(node=>node!==root&&node.tagName!=='SCRIPT').map(node=>[node,node.inert]);for(const [node] of blocked)node.inert=true}
  root.hidden=false;root.querySelector('button').onclick=dismiss;root.querySelector('button').focus({preventScroll:true});
 }
 window.addEventListener('keydown',e=>{if(root.hidden)return;e.stopImmediatePropagation();if(e.key==='Escape'){e.preventDefault();dismiss()}else if(e.key==='Tab'){e.preventDefault();root.querySelector('button').focus()}},true);
 return {queue,reset,dismiss,get active(){return !root.hidden}};
})();
