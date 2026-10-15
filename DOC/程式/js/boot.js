/* Bind input before images finish; only the selected chapter gates world entry. */
(async()=>{
 const status=document.getElementById('boot-status');
 try{
  await ChapterLoader.ready;let saved;try{saved=Core.load(localStorage.getItem('shanhe-save-v1'))}catch{}
  TitleLaunch.watchChapter(saved?.chapter||0);
  for(const file of ['DOC/程式/js/puzzle-bank.js','DOC/程式/js/game.js'])await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=file;script.onload=resolve;script.onerror=()=>reject(new Error('遊戲程式未能載入。'));document.body.appendChild(script)});
  if(!Renderer.status.ready)throw new Error(Renderer.status.error||'此瀏覽器無法啟動 3D 畫面。');
  status.textContent='可先啟程 · 圖片於背景準備中';TitleLaunch.ready();
  if(saved?.chapter)SpriteActors.preloadChapter(saved.chapter).catch(()=>{});
  const message='第一章已就緒 · 其餘章節準備中';
  SpriteActors.ready.then(()=>{if(status.textContent==='可先啟程 · 圖片於背景準備中')status.textContent=message}).catch(()=>{if(status.textContent==='可先啟程 · 圖片於背景準備中')status.textContent='圖片準備中斷 · 按啟程可重試'});
  SpriteActors.background().then(()=>{if(status.textContent===message)status.textContent=ImagePreloader.status.errors.length?'第一章已就緒 · 部分圖片將於進入章節時重試':'3D 山河已就緒 · 十八章旅程'}).catch(()=>{});
 }catch(error){status.textContent='載入失敗：'+(error.message||'請保留完整 DOC 資料夾。');TitleLaunch.fail(status.textContent);console.error(error)}
})();
