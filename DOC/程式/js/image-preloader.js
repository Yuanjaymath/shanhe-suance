/* Shared image queue: decode chapter one first, then warm later chapters. */
var ImagePreloader=(()=>{
 const records=new Map(),errors=new Map(),queue=[];let active=0,serial=0;
 const rank=priority=>priority==='high'?2:priority==='low'?0:1;
 const key=source=>new URL(source,document.baseURI).href;
 function pump(){
  queue.sort((a,b)=>b.priority-a.priority||a.serial-b.serial);
  while(active<4&&queue.length){
   const job=queue.shift(),image=new Image();job.image=image;job.state='loading';active++;
   image.decoding='async';image.fetchPriority=job.priority===2?'high':job.priority===0?'low':'auto';let finished=false;
   const timer=setTimeout(()=>finish(new Error('圖片載入逾時：'+job.source)),20000);
   function finish(error){
    if(finished)return;finished=true;clearTimeout(timer);image.onload=image.onerror=null;active--;
    if(error){job.state='failed';records.delete(job.key);errors.set(job.key,job.source);image.src='';job.reject(error)}
    else{job.state='ready';errors.delete(job.key);job.resolve(image)}
    pump();
   }
   image.onload=()=>Promise.resolve().then(()=>image.decode?.()).then(()=>finish(),()=>finish(new Error('無法解碼圖片：'+job.source)));
   image.onerror=()=>finish(new Error('無法載入圖片：'+job.source));image.src=job.source;
  }
 }
 function load(source,priority='auto'){
  const url=key(source),existing=records.get(url);
  if(existing){if(rank(priority)>existing.priority){existing.priority=rank(priority);if(existing.image)existing.image.fetchPriority=priority}return existing.promise}
  const job={key:url,source,priority:rank(priority),serial:serial++,state:'queued'};
  job.promise=new Promise((resolve,reject)=>{job.resolve=resolve;job.reject=reject});records.set(url,job);queue.push(job);pump();return job.promise;
 }
 const chapterSource=title=>'DOC/美術素材/各章節開幕圖/'+encodeURIComponent(title)+'.webp';
 // The head preload starts chapter one; adopt it before chapter data initializes.
 const firstChapter=load(chapterSource('涿郡少年'),'high');firstChapter.catch(()=>{});
 return {load,chapterSource,firstChapter,get(source){const job=records.get(key(source));return job?.state==='ready'?job.image:null},get status(){return {active,queued:queue.length,ready:[...records.values()].filter(r=>r.state==='ready').length,errors:[...errors.values()]}}};
})();
