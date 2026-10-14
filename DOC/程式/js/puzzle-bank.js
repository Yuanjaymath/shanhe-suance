/* One reproducible source adaptation supplies both NPC clues and the integer gate answer. */
var PuzzleBank=(()=>{
 const base=JSON.parse(JSON.stringify(Story.chapters));
 const byId=new Map(QuestionData.questions.map(q=>[q.id,q]));
 const recent=new Map();let activeSeed=null,practiceSeed=2;
 function selected(chapter,id){
  const ch=JSON.parse(JSON.stringify(base[chapter])),q=byId.get(id);
  if(!q||q.chapter!==chapter||!Number.isInteger(q.answer)||q.answer<=0)throw Error('機關題目不符合本章整數條件');
  ch.clues=ch.clues.map((c,i)=>({...c,text:q.clues[i]}));
  ch.puzzle={...QuestionData.gates[chapter].puzzle,name:ch.puzzle.name,questionId:q.id,answer:q.answer,unit:q.unit,explain:q.explain,hint:q.hint};
  return ch;
 }
 function make(chapter,seed=1){
  const gate=QuestionData.gates[chapter];
  const hash=(Math.imul((seed+chapter*10007)>>>0,1664525)+1013904223)>>>0;
  return selected(chapter,seed===1?gate.puzzle.questionId:gate.pool[hash%gate.pool.length]);
 }
 function configure(seed=1){
  if(activeSeed===seed)return;activeSeed=seed;
  for(let c=0;c<18;c++)Story.chapters[c]=make(c,seed);
 }
 function practice(chapter){
  const seen=recent.get(chapter)||[];let ch;
  for(let attempt=0;attempt<32;attempt++){
   ch=make(chapter,practiceSeed++);
   if(!seen.includes(ch.puzzle.questionId))break;
  }
  if(seen.includes(ch.puzzle.questionId)){
   const id=QuestionData.gates[chapter].pool.find(id=>!seen.includes(id));
   if(id)ch=selected(chapter,id);
  }
  seen.push(ch.puzzle.questionId);recent.set(chapter,seen.slice(-6));return ch;
 }
 return {configure,practice,make};
})();
