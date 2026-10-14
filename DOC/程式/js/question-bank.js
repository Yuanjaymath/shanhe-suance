/* Verified source adaptations. All encounter modes stay inside the current chapter. */
var QuestionBank=(()=>{
 const pools=new Map();
 function pool(profile,type){
  const key=`${profile.chapter}|${type}|${!!profile.animal}|${profile.battleTier}`;
  if(!pools.has(key)){
   const source=profile.battleTier==='legendary'?QuestionData.legendaryQuestions:QuestionData.questions;
   const ids=QuestionData.battlePools[profile.chapter]?.[profile.battleTier],allowed=ids?new Set(ids):null;
   let questions=source.filter(q=>q.chapter===profile.chapter&&q.type===type&&(!allowed||allowed.has(q.id)));
   if(profile.animal&&questions.length>=16){
    // Reduce reading load while keeping this chapter's mathematical unit.
    questions=[...questions].sort((a,b)=>(a.text.length+a.explain.length)-(b.text.length+b.explain.length));
    questions=questions.slice(0,Math.max(8,Math.ceil(questions.length/2)));
   }
   if(!questions.length)throw Error('本章題庫缺少題型 '+type);
   pools.set(key,questions);
  }
  return pools.get(key);
 }
 function generate(profile,type,int){
  const questions=pool(profile,type),base=questions[int(0,questions.length-1)];
  const options=[...base.options];
  for(let i=options.length-1;i>0;i--){const j=int(0,i);[options[i],options[j]]=[options[j],options[i]]}
  return {...base,options,topic:QuestionData.topics[type].name};
 }
 return {generate};
})();
