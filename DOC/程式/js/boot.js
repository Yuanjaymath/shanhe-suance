/* First chapter unlocks play; saved and later chapters warm independently. */
(async()=>{
 const newButton=document.getElementById('new-game'),continueButton=document.getElementById('continue-game'),status=document.getElementById('boot-status');newButton.disabled=continueButton.disabled=true;
 try{
  await ChapterLoader.ready;await SpriteActors.ready;let saved;try{saved=Core.load(localStorage.getItem('shanhe-save-v1'))}catch{}
  for(const file of ['DOC/程式/js/puzzle-bank.js','DOC/程式/js/game.js'])await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=file;script.onload=resolve;script.onerror=reject;document.body.appendChild(script)});
  if(!Renderer.status.ready)throw new Error(Renderer.status.error||'此瀏覽器無法啟動 3D 畫面。');newButton.disabled=false;
  const message='第一章已就緒 · 其餘章節準備中';status.textContent=message;
  if(saved?.chapter){
   continueButton.disabled=true;
   SpriteActors.preloadChapter(saved.chapter).then(()=>{continueButton.disabled=false},()=>{continueButton.disabled=false;if(status.textContent===message)status.textContent='第一章已就緒 · 存檔章節圖片待重試，可先開始新旅程'});
  }
  SpriteActors.background().then(()=>{if(status.textContent===message)status.textContent=ImagePreloader.status.errors.length?'第一章已就緒 · 部分圖片將於進入章節時重試':'3D 山河已就緒 · 十八章旅程'});
 }catch(error){newButton.disabled=continueButton.disabled=true;status.textContent='載入失敗：'+(error.message||'請保留完整 DOC 資料夾。');console.error(error)}
})();
