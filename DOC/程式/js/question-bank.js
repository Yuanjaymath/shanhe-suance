/* Verified source adaptations. All encounter modes stay inside the current chapter. */
var QuestionBank=(()=>{
 const pools=new Map();
 const signature=q=>`${q.type}|${q.text}|${q.answer}`;
 function groupKey(q){
  const values=q.values||{};
  const variant=q.recipe==='digit'||q.recipe==='digit_multi'?values.ds:q.recipe==='multiple'?values.a:values.mode;
  return q.recipe+'|'+JSON.stringify(variant??null);
 }
 function groups(questions){const result=new Map();for(const q of questions){const key=groupKey(q);if(!result.has(key))result.set(key,[]);result.get(key).push(q)}return result}
 function pool(profile,type){
  const key=`${profile.chapter}|${type}|${!!profile.animal}|${profile.battleTier}`;
  if(!pools.has(key)){
   const source=profile.battleTier==='legendary'?QuestionData.legendaryQuestions:QuestionData.questions;
   const ids=QuestionData.battlePools[profile.chapter]?.[profile.battleTier],allowed=ids?new Set(ids):null;
   let questions=source.filter(q=>q.chapter===profile.chapter&&q.type===type&&(!allowed||allowed.has(q.id)));
   if(profile.animal&&questions.length>=16){
    // Shorten within each method; a global cutoff can remove every divisor but five.
    questions=[...groups(questions).values()].flatMap(items=>[...items].sort((a,b)=>(a.text.length+a.explain.length)-(b.text.length+b.explain.length)).slice(0,Math.max(8,Math.ceil(items.length/2))));
   }
   if(!questions.length)throw Error('本章題庫缺少題型 '+type);
   pools.set(key,questions);
  }
  return pools.get(key);
 }
 function generate(profile,type,int,history){
  let questions=pool(profile,type);
  if(history){const fresh=questions.filter(q=>!history.recent.includes(signature(q)));if(fresh.length)questions=fresh}
  const variants=groups(questions),usage=key=>history?.groupCounts.get(key)||0;
  const least=Math.min(...[...variants.keys()].map(usage));
  let choices=[...variants.keys()].filter(key=>usage(key)===least);
  if(choices.length>1)choices=choices.filter(key=>key!==history?.lastGroups.get(type));
  const candidates=variants.get(choices[int(0,choices.length-1)]),base=candidates[int(0,candidates.length-1)];
  const options=[...base.options];
  for(let i=options.length-1;i>0;i--){const j=int(0,i);[options[i],options[j]]=[options[j],options[i]]}
  return {...base,options,topic:QuestionData.topics[type].name};
 }
 const hasFresh=(profile,type,recent)=>pool(profile,type).some(q=>!recent.includes(signature(q)));
 return {generate,groupKey,signature,hasFresh};
})();
