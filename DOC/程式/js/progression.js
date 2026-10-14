/* Named ranks use lifetime XP, so progress remains visible across chapter revisits. */
var Progression=(()=>{
 const names=['鐵牌','青銅','白銀','黃金','白金','翡翠','鑽石','菁英','大師','宗師','傳奇'];
 const totals=[0,80,320,1000,2600,5600,10300,16700,24700,34500,45000];
 const ranks=names.map((name,i)=>Object.freeze({name,total:totals[i]}));
 function info(s){
  const total=Math.max(0,Math.floor(s.xp||0));let index=0;
  while(index<ranks.length-1&&total>=ranks[index+1].total)index++;
  const current=ranks[index],next=ranks[index+1],needed=next?next.total-current.total:0;
  return {name:current.name,level:index+1,total,progress:total-current.total,needed,next:next?.name||null,remaining:next?next.total-total:0,percent:next?Math.min(100,(total-current.total)/needed*100):100,max:!next};
 }
 function grant(s,amount,key=null){
  const before=info(s),xp=Math.max(0,Math.floor(amount)||0);
  if(!xp||s.gameOver||key&&s.flags[key])return {xp:0,levels:0,name:before.name};
  if(key)s.flags[key]=true;s.xp=before.total+xp;s.progressionVersion=2;
  const after=info(s),levels=after.level-before.level;s.level=after.level;
  if(levels){s.maxHp+=12*levels;if(s.hp>0)s.hp=Math.min(s.maxHp,s.hp+12*levels)}
  return {xp,levels,name:after.name,fromLevel:before.level,toLevel:after.level};
 }
 function earn(s,kind,options={}){
  const ch=Math.max(0,Math.min(17,Math.floor(options.chapter??s.chapter)||0));
  const rewards={answer:10+ch*2,animalAnswer:6+ch,battle:24+ch*4,boss:90+ch*12,animal:12+ch*2,clue:15+ch*2,puzzle:60+ch*8,cargo:20+ch*2,chest:15+ch*2,recruit:50+ch*6,scholar:60+ch*8,patrol:70+ch*10,side:50+ch*6,chapter:60+ch*8,lesson:20+ch*3};
  return grant(s,rewards[kind]||0,options.key?'xp-'+ch+'-'+options.key:null);
 }
 return {ranks:Object.freeze(ranks),info,grant,earn,attack:s=>(info(s).level-1)*6};
})();
