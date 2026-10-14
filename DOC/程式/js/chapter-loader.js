/* Each chapter is a local HTML document, safe for file:// and static hosting. */
var ChapterLoader=(()=>{
 const frames=new Map();let ready;
 function load(id){return new Promise((resolve,reject)=>{
  const frame=document.createElement('iframe');frame.hidden=true;frame.title='第 '+(id+1)+' 章資料';
  const timer=setTimeout(()=>finish(new Error('無法載入第 '+(id+1)+' 章，請確認 DOC/關卡 完整。')),10000);
  function finish(error,ch){clearTimeout(timer);window.removeEventListener('message',receive);frame.remove();frames.delete(id);error?reject(error):resolve(ch)}
  function receive(event){if(event.source!==frame.contentWindow||event.data?.type!=='shanhe-chapter')return;const ch=event.data.chapter;if(ch?.id!==id||!ch.title||!Array.isArray(ch.clues)||ch.clues.length!==2||!ch.puzzle||!ch.recruit)return finish(new Error('章節資料格式錯誤：第 '+(id+1)+' 章'));const gate=QuestionData.gates?.[ch.questionKey??id];if(!gate||gate.clues?.length!==2||!gate.puzzle)return finish(new Error('題庫缺少第 '+(id+1)+' 章機關'));ch.clues=ch.clues.map((c,i)=>({...c,text:gate.clues[i]}));ch.puzzle={...gate.puzzle,...ch.puzzle};finish(null,ch)}
  window.addEventListener('message',receive);frame.onerror=()=>finish(new Error('章節載入失敗：第 '+(id+1)+' 章'));frames.set(id,frame);frame.src='DOC/關卡/chapter-'+String(id).padStart(2,'0')+'.html';document.body.appendChild(frame);
 })}
 async function initialize(){const chapters=await Promise.all(Array.from({length:18},(_,id)=>load(id)));Story.chapters=chapters;return chapters}
 ready=initialize();return {ready,load};
})();
