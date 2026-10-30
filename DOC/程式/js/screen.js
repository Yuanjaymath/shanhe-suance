var ScreenUI=(()=>{
 let cleanupDialogue=()=>{};
 const panel=()=>document.querySelector('.modal');
 function mode(value){cleanupDialogue();cleanupDialogue=()=>{};panel().dataset.mode=value;panel().classList.remove('answered','hint-open')}
 const isFullscreen=()=>!!(document.fullscreenElement||document.webkitFullscreenElement);
 let escapeLocked=false,escapePending=null,escapeEpoch=0,escapeMode='none';
 function unlockEscape(){const held=escapeLocked||escapePending;escapeEpoch++;escapeLocked=false;escapePending=null;escapeMode='none';if(held)try{navigator.keyboard?.unlock?.()}catch{}}
 function lockEscape(){
  if(!isFullscreen())return Promise.resolve(false);
  if(!navigator.keyboard?.lock){escapeMode='browser-requested';return Promise.resolve(false)}
  if(escapeLocked)return Promise.resolve(true);
  if(escapePending)return escapePending;
  const epoch=escapeEpoch,request=Promise.resolve().then(()=>{if(epoch!==escapeEpoch||!isFullscreen())return false;return Promise.resolve(navigator.keyboard.lock(['Escape'])).then(()=>true)}).then(locked=>{
   if(!locked||epoch!==escapeEpoch||!isFullscreen())return false;
   escapeLocked=true;escapeMode='keyboard';return true;
  }).catch(()=>{if(epoch===escapeEpoch)escapeMode='unavailable';return false}).finally(()=>{if(escapePending===request)escapePending=null});
  escapePending=request;return request;
 }
 async function fullscreen(){try{
  if(isFullscreen()){await (document.exitFullscreen?.()||document.webkitExitFullscreen?.());unlockEscape()}
  else{const el=document.documentElement;
   if(el.requestFullscreen){const options={navigationUI:'hide'};if(!navigator.keyboard?.lock)options.keyboardLock='browser';
    try{await el.requestFullscreen(options)}catch(error){if(options.keyboardLock&&error.name==='NotSupportedError')await el.requestFullscreen({navigationUI:'hide'});else throw error}
   }else if(el.webkitRequestFullscreen)el.webkitRequestFullscreen();else return false;
   await lockEscape();
  }return true;
 }catch{return false}}
 function syncFullscreen(){const active=isFullscreen();if(active)lockEscape();else unlockEscape();const button=document.getElementById('fullscreen-button');const titleButton=document.getElementById('title-fullscreen');if(titleButton){titleButton.textContent=active?'退出全螢幕':'全螢幕';titleButton.setAttribute('aria-pressed',String(active))}if(button){button.textContent=active?'退出全螢幕':'全螢幕';button.setAttribute('aria-pressed',String(active))}resourceKey='';fitResources();if(typeof Renderer!=='undefined')Renderer.resize()}
 document.addEventListener('fullscreenchange',syncFullscreen);document.addEventListener('webkitfullscreenchange',syncFullscreen);
 function dialogue(content,text,note){
  const body=content.querySelector('.dialogue-text');let noteEl=content.querySelector('.note');if(!noteEl){noteEl=document.createElement('div');noteEl.className='note';body.after(noteEl)}
  const nav=document.createElement('div');nav.className='dialogue-pagination';content.querySelector('.dialogue-actions').before(nav);let index=0;
  function render(){
   const width=Math.min(innerWidth-40,680),height=window.visualViewport?.height||innerHeight;
   const limit=Math.max(40,Math.min(180,Math.floor((height-230)/25)*Math.floor((width-90)/18)));
   const chunks=value=>MathText.chunks(value,limit);
   // Preserve brief dialogue + note on one page. Long text is paged, never clipped.
   const pages=(text.length+note.length<=limit)?[{body:text,note}]:[...chunks(text).map(body=>({body,note:''})),...chunks(note).map(note=>({body:'補充線索',note}))];
   index=Math.min(index,pages.length-1);MathText.set(body,pages[index].body);MathText.set(noteEl,pages[index].note);noteEl.hidden=!pages[index].note;nav.replaceChildren();nav.hidden=pages.length===1;
   if(pages.length>1){const prev=document.createElement('button'),next=document.createElement('button'),counter=document.createElement('span');prev.textContent='上一頁';next.textContent='下一頁';counter.textContent=(index+1)+' / '+pages.length;prev.disabled=index===0;next.disabled=index===pages.length-1;prev.onclick=()=>{index--;render()};next.onclick=()=>{index++;render()};nav.append(prev,counter,next)}
  }
  render();const resize=()=>{if(content.contains(nav))render();else window.removeEventListener('resize',resize)};window.addEventListener('resize',resize);cleanupDialogue=()=>window.removeEventListener('resize',resize);
 }
 let resourceKey='';
 function fitResources(force=false){const container=document.querySelector('.resources'),numbers=Array.from(container.querySelectorAll('b')),key=innerWidth+'|'+container.clientWidth+'|'+numbers.map(n=>n.textContent).join('|');if(!container.clientWidth||(!force&&key===resourceKey))return;resourceKey=key;for(const n of numbers){n.style.removeProperty('font-size');const span=n.parentElement,required=span.scrollWidth,available=span.clientWidth;if(required>available){const width=n.getBoundingClientRect().width,fixed=required-width,size=parseFloat(getComputedStyle(n).fontSize),ratio=Math.max(.2,Math.min(1,(available-fixed-2)/width));n.style.fontSize=(size*ratio)+'px'}}}

 window.addEventListener('resize',()=>{resourceKey='';fitResources()});
 function fitBattle(){const m=panel();if(m.dataset.mode!=='battle'||m.classList.contains('hint-open'))return;const stage=m.querySelector('.battle-3d');if(!stage)return;stage.style.removeProperty('height');const base=stage.getBoundingClientRect().height,available=(window.visualViewport?.height||innerHeight)-32,other=m.scrollHeight-base;stage.style.setProperty('height',Math.max(60,Math.min(base,available-other-2))+'px','important')}
 window.addEventListener('resize',fitBattle);window.visualViewport?.addEventListener('resize',fitBattle);
 function fitTitles(){
  for(const title of document.querySelectorAll('.title-copy h1,#cutscene-title')){
   if(!title.getClientRects().length||!title.clientWidth)continue;title.style.removeProperty('font-size');
   const range=document.createRange();range.selectNodeContents(title);const available=title.clientWidth-2;
   for(let i=0;i<4;i++){const width=range.getBoundingClientRect().width;if(width<=available)break;const size=parseFloat(getComputedStyle(title).fontSize);title.style.fontSize=Math.max(16,size*available/width-.4)+'px'}
  }
 }
 window.addEventListener('resize',fitTitles);document.fonts?.ready.then(fitTitles);fitTitles();
 return {mode,fullscreen,dialogue,fitBattle,fitResources,fitTitles,get fullscreenStatus(){return {active:isFullscreen(),escape:escapeMode}}};
})();
