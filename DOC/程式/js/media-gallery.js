/* Optional listening and preview overlays do not change game progress. */
var MediaGallery=(()=>{
 const root=document.createElement('div');root.id='media-viewer';root.className='media-backdrop';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-labelledby','media-title');document.body.appendChild(root);
 const audio=new Audio();audio.id='listening-audio';audio.preload='metadata';audio.hidden=true;
 const VIDEO='kZKWI1pqCa8',VOLUME_KEY='shanhe-listening-volume-v1';
 let hooks={},mode='',index=0,volume=.5,returnFocus=null,blocked=[],generation=0,playRequest=0,videoFrame=null,videoPlayer=null,apiPromise=null,resumePreview=false;
 try{const value=localStorage.getItem(VOLUME_KEY);if(value!==null&&Number.isFinite(Number(value)))volume=Math.max(0,Math.min(1,Number(value)))}catch{}
 audio.volume=volume;
 const $=id=>root.querySelector('#'+id);
 const tracks=()=>AudioCatalog.listen||[];
 const current=()=>tracks()[index];
 const showingMusic=()=>!root.hidden&&mode==='music';
 const clock=t=>{const s=Math.max(0,Math.floor(Number.isFinite(t)?t:0));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
 function message(text){const node=$('media-message');if(node)node.textContent=text}
 function sync(){
  if(!showingMusic())return;
  const playing=!audio.paused,ready=Number.isFinite(audio.duration)&&audio.duration>0;
  $('listening-play').textContent=playing?'❚❚ 暫停':'▶ 播放';$('listening-play').setAttribute('aria-pressed',String(playing));
  $('media-current').classList.toggle('is-playing',playing);$('listening-time').textContent=clock(audio.currentTime)+' / '+clock(audio.duration);
  $('listening-progress').disabled=!ready;$('listening-progress').value=ready?Math.round(audio.currentTime/audio.duration*1000):0;
  $('listening-volume').value=Math.round(audio.volume*100);$('listening-volume-value').textContent=Math.round(audio.volume*100)+'%';
 }
 async function play(){
  if(!showingMusic())return;if(document.hidden){resumePreview=true;return}const request=++playRequest,view=generation;
  try{await audio.play();if(showingMusic()&&view===generation&&request===playRequest){message('正在欣賞：'+current().title);sync()}}
  catch(error){if(showingMusic()&&view===generation&&request===playRequest&&error.name!=='AbortError'){message('目前無法播放，請再次按播放或選擇另一首曲目。');sync()}}
 }
 function selectTrack(i,start=false){
  const list=tracks();if(!list.length)return;playRequest++;audio.pause();index=(i+list.length)%list.length;
  $('listening-track').value=String(index);$('media-current-title').textContent=current().title;$('media-current-group').textContent=current().group;
  audio.src=current().src;audio.load();message('已選擇曲目，按播放開始欣賞。');sync();if(start)play();
 }
 function saveVolume(){volume=audio.volume;try{localStorage.setItem(VOLUME_KEY,String(volume))}catch{}sync()}
 function init(value){hooks=value}
 function show(kind){
  if(!root.hidden||typeof RankCelebration!=='undefined'&&RankCelebration.active)return;
  returnFocus=document.activeElement;mode=kind;generation++;root.hidden=false;hooks.beforeOpen?.();AudioSystem.suspend('media-gallery');
  root.innerHTML='<section class="media-panel"><header><div class="media-heading"><span class="media-kicker">山河之聲・旅途小憩</span><h2 id="media-title">'+(kind==='music'?'欣賞背景音樂':'欣賞預告MV')+'</h2></div><div class="media-header-actions"><button id="media-close" class="close-button" aria-label="關閉欣賞視窗">×</button></div></header><div id="media-content" class="media-content"></div></section>';
  if(kind==='music')musicView();else videoView();
  blocked=[...document.body.children].filter(node=>node!==root&&node.tagName!=='SCRIPT').map(node=>[node,node.inert]);for(const [node]of blocked)node.inert=true;
  $('media-close').onclick=close;$('media-close').focus({preventScroll:true});
 }
 function musicView(){
  const list=tracks(),content=$('media-content');content.innerHTML='<p class="media-intro">選一首曲子，讓山河陪你歇一歇。關閉後回到原畫面。</p><label class="listening-choice">選擇音樂<select id="listening-track" aria-label="選擇背景音樂"></select></label><div id="media-current" class="media-current"><span class="media-disc" aria-hidden="true">♪</span><div><small id="media-current-group"></small><h3 id="media-current-title"></h3></div></div><div class="listening-controls"><button id="listening-previous" aria-label="上一首">◀ 上一首</button><button id="listening-play" class="primary" aria-pressed="false">▶ 播放</button><button id="listening-next" aria-label="下一首">下一首 ▶</button></div><label class="listening-slider"><span>播放進度 <output id="listening-time">0:00 / 0:00</output></span><input id="listening-progress" aria-label="音樂播放進度" type="range" min="0" max="1000" value="0" disabled></label><label class="listening-slider"><span>欣賞音量 <output id="listening-volume-value">50%</output></span><input id="listening-volume" aria-label="欣賞音樂音量" type="range" min="0" max="100" value="50"></label><p id="media-message" class="media-message" role="status" aria-live="polite"></p>';
  content.appendChild(audio);const groups=new Map();
  list.forEach((track,i)=>{let group=groups.get(track.group);if(!group){group=document.createElement('optgroup');group.label=track.group;groups.set(track.group,group);$('listening-track').appendChild(group)}const option=document.createElement('option');option.value=String(i);option.textContent=track.title;group.appendChild(option)});
  $('listening-track').onchange=e=>selectTrack(Number(e.target.value),true);
  $('listening-play').onclick=()=>{if(audio.paused)play();else{playRequest++;audio.pause();message('已暫停，隨時可以繼續欣賞。');sync()}};
  $('listening-previous').onclick=()=>selectTrack(index-1,true);$('listening-next').onclick=()=>selectTrack(index+1,true);
  $('listening-volume').oninput=e=>{audio.volume=Number(e.target.value)/100;saveVolume()};
  $('listening-progress').oninput=e=>{if(Number.isFinite(audio.duration)&&audio.duration>0){audio.currentTime=Number(e.target.value)/1000*audio.duration;sync()}};
  if(list.length)selectTrack(Math.min(index,list.length-1));else{for(const button of content.querySelectorAll('button,select'))button.disabled=true;message('目前沒有可欣賞的音樂。')}
 }
 function loadAPI(){
  if(window.YT?.Player)return Promise.resolve(window.YT);
  if(apiPromise)return apiPromise;
  apiPromise=new Promise((resolve,reject)=>{
   const script=document.createElement('script'),previous=window.onYouTubeIframeAPIReady;
   let timer,done=false;
   const finish=error=>{if(done)return;done=true;clearTimeout(timer);if(window.onYouTubeIframeAPIReady===ready)window.onYouTubeIframeAPIReady=previous;if(error){apiPromise=null;script.remove();reject(error)}else resolve(window.YT)};
   const ready=()=>{try{previous?.()}finally{finish()}};
   window.onYouTubeIframeAPIReady=ready;script.src='https://www.youtube.com/iframe_api';script.async=true;script.onerror=()=>finish(new Error('video unavailable'));
   timer=setTimeout(()=>finish(new Error('video unavailable')),12000);document.body.appendChild(script);
  });return apiPromise;
 }
 function videoView(){
  const view=generation,content=$('media-content');
  root.querySelector('.media-panel').classList.add('media-panel-video');
  root.querySelector('.media-header-actions').insertAdjacentHTML('afterbegin','<a id="media-youtube" class="media-youtube" target="_blank" rel="noopener noreferrer" aria-label="前往 YouTube 欣賞預告（另開分頁）">前往 YouTube 欣賞 ↗</a>');
  content.innerHTML='<p class="media-intro">點影片的播放鍵欣賞預告，按右上角 × 返回原畫面。此功能需要網路連線。</p><div id="media-video" class="media-video"></div><p id="media-message" class="media-message" role="status" aria-live="polite">正在連線至 YouTube…</p>';
  $('media-youtube').href='https://youtu.be/'+VIDEO;
  const frame=document.createElement('iframe');frame.id='preview-mv';frame.title='山河算策・劉備傳｜預告MV';frame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';
  const origin=/^https?:$/.test(location.protocol)?'&origin='+encodeURIComponent(location.origin):'';
  frame.src='https://www.youtube-nocookie.com/embed/'+VIDEO+'?enablejsapi=1&playsinline=1&rel=0'+origin;videoFrame=frame;$('media-video').appendChild(frame);
  const valid=()=>!root.hidden&&mode==='video'&&view===generation;
  const unavailable=()=>{if(valid())message('若影片無法在這裡播放，可按視窗右上方的「前往 YouTube 欣賞」。')};
  loadAPI().then(api=>{if(!valid())return;videoPlayer=new api.Player(frame,{events:{onReady:()=>{if(valid())message('點影片的播放鍵，即可開始欣賞。')},onError:unavailable}})}).catch(unavailable);
 }
 function close(){
  if(root.hidden)return;generation++;playRequest++;resumePreview=false;audio.pause();audio.removeAttribute('src');audio.load();
  try{videoPlayer?.destroy()}catch{}videoPlayer=null;if(videoFrame){videoFrame.removeAttribute('src');videoFrame.remove();videoFrame=null}
  root.hidden=true;mode='';for(const [node,inert]of blocked)node.inert=inert;blocked=[];AudioSystem.resume('media-gallery');
  if(returnFocus?.isConnected&&!returnFocus.disabled)returnFocus.focus({preventScroll:true});hooks.afterClose?.();
 }
 for(const event of ['loadedmetadata','timeupdate','play','pause','volumechange'])audio.addEventListener(event,sync);
 audio.addEventListener('volumechange',saveVolume);
 audio.addEventListener('ended',()=>{if(showingMusic())selectTrack(index+1,true)});
 audio.addEventListener('error',()=>{if(showingMusic()){message('這首曲目暫時無法讀取，請選擇另一首。');sync()}});
 root.addEventListener('click',e=>{if(e.target===root)close()});
 window.addEventListener('keydown',e=>{if(root.hidden)return;e.stopImmediatePropagation();if(e.key==='Escape'){e.preventDefault();if(!e.repeat)close();return}if(e.key!=='Tab')return;
  const controls=[...root.querySelectorAll('button:not(:disabled),select:not(:disabled),input:not(:disabled),a[href],iframe')].filter(node=>node.getClientRects().length),first=controls[0],last=controls[controls.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
 },true);
 document.addEventListener('visibilitychange',()=>{if(!showingMusic())return;if(document.hidden){resumePreview=!audio.paused;audio.pause()}else if(resumePreview){resumePreview=false;play()}});
 for(const [id,kind]of [['title-music','music'],['title-mv','video']])document.getElementById(id).onclick=()=>show(kind);
 return {init,openMusic:()=>show('music'),openMV:()=>show('video'),close,get active(){return !root.hidden},get status(){return {active:!root.hidden,mode,index,playing:showingMusic()&&!audio.paused,volume:audio.volume,source:audio.getAttribute('src')||'',time:audio.currentTime||0,duration:Number.isFinite(audio.duration)?audio.duration:0,videoId:mode==='video'?VIDEO:null}}};
})();
