/* Pure game rules. No network or browser dependency. */
var Gear = (() => {
  const catalog={
    bronze_sword:{name:'青銅劍',slot:'weapon',price:120,attack:7,defense:0,chapter:0,upgradeAttack:3,view:'blade'},
    iron_spear:{name:'精鐵槍',slot:'weapon',price:280,attack:20,defense:0,chapter:3,upgradeAttack:4,view:'spear'},
    frost_sword:{name:'寒星劍',slot:'weapon',price:480,attack:36,defense:0,chapter:6,upgradeAttack:5,view:'frost'},
    dragon_blade:{name:'青龍偃月刀',slot:'weapon',price:740,attack:55,defense:0,chapter:9,upgradeAttack:6,view:'dragon'},
    army_spear:{name:'破軍槍',slot:'weapon',price:1040,attack:78,defense:0,chapter:12,upgradeAttack:7,view:'army'},
    heaven_halberd:{name:'天衡戟',slot:'weapon',price:1400,attack:106,defense:0,chapter:15,upgradeAttack:8,view:'halberd'},
    wood_shield:{name:'藤木盾',slot:'shield',price:60,attack:0,defense:2,chapter:0},
    bronze_shield:{name:'青銅盾',slot:'shield',price:180,attack:0,defense:4,chapter:4},
    guardian_shield:{name:'玄武盾',slot:'shield',price:380,attack:0,defense:7,chapter:10,challenge:true},
    cloth_armor:{name:'行軍布甲',slot:'armor',price:80,attack:0,defense:3,chapter:0},
    iron_armor:{name:'玄鐵鎧',slot:'armor',price:220,attack:0,defense:6,chapter:4},
    tiger_armor:{name:'白虎戰甲',slot:'armor',price:450,attack:0,defense:10,chapter:10,challenge:true}
  };
  const maxUpgrade=3,has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
  const item=id=>has(catalog,id)?catalog[id]:null;
  const legacy={sword:{price:120,attack:8,to:'bronze_sword'},spear:{price:300,attack:15,to:'iron_spear'}};
  const fresh=()=>({schema:2,highestChapter:0,creditGold:0,saleCreditGold:0,migration:null,owned:{},equipped:{weapon:null,armor:null,shield:null},claimed:[]});
  function load(v){
    if(v===undefined)return fresh();
    if(!v||!v.owned||Array.isArray(v.owned)||typeof v.owned!=='object'||!v.equipped||!Array.isArray(v.claimed))return null;
    const g=fresh();if(v.schema!==undefined&&v.schema!==1&&v.schema!==2)return null;g.schema=v.schema??1;
    if(v.highestChapter!==undefined&&(!Number.isInteger(v.highestChapter)||v.highestChapter<0||v.highestChapter>17))return null;g.highestChapter=v.highestChapter??0;
    if(v.creditGold!==undefined&&(!Number.isInteger(v.creditGold)||v.creditGold<0||v.creditGold>420))return null;g.creditGold=v.creditGold??0;
    if(v.saleCreditGold!==undefined&&(!Number.isInteger(v.saleCreditGold)||v.saleCreditGold<0||v.saleCreditGold>10000000))return null;g.saleCreditGold=v.saleCreditGold??0;
    if(v.migration!=null){const m=v.migration;if(m.version!==1||!Array.isArray(m.legacyItems)||m.legacyItems.some(id=>!has(legacy,id))||new Set(m.legacyItems).size!==m.legacyItems.length)return null;const refund=m.legacyItems.reduce((n,id)=>n+legacy[id].price,0),removed=m.legacyItems.reduce((n,id)=>n+legacy[id].attack,0);if(m.refundGold!==refund||m.attackRemoved!==removed||g.creditGold>refund)return null;g.migration={version:1,legacyItems:[...m.legacyItems],refundGold:refund,attackRemoved:removed}}
    else if(g.creditGold)return null;
    for(const [id,n] of Object.entries(v.owned)){if(!item(id)||!Number.isInteger(n)||n<0||n>maxUpgrade)return null;g.owned[id]=n}
    for(const slot of ['weapon','armor','shield']){const id=slot==='shield'&&v.equipped[slot]===undefined?null:v.equipped[slot];if(id!==null&&(!item(id)||item(id).slot!==slot||!has(g.owned,id)))return null;g.equipped[slot]=id}
    if(v.claimed.some(id=>!item(id))||new Set(v.claimed).size!==v.claimed.length)return null;g.claimed=[...v.claimed];return g;
  }
  function unlockedChapter(s){
    let highest=Math.max(s.gear.highestChapter||0,s.chapter);
    for(let ch=0;ch<18;ch++)if(s.flags?.[ch+'-boss']||s.flags?.[ch+'-chapter-passed'])highest=Math.max(highest,Math.min(17,ch+1));
    s.gear.highestChapter=Math.min(17,highest);return s.gear.highestChapter;
  }
  const pendingGold=s=>(s.gear.creditGold||0)+(s.gear.saleCreditGold||0);
  function addGold(s,amount){if(!Number.isInteger(amount)||amount<0)return false;const gold=s.gold+amount,overflow=Math.max(0,gold-10000000);if((s.gear.saleCreditGold||0)+overflow>10000000)return false;s.gold=Math.min(10000000,gold);s.gear.saleCreditGold=(s.gear.saleCreditGold||0)+overflow;return true}
  function redeemCredit(s){let total=0;for(const key of ['creditGold','saleCreditGold']){const amount=Math.min(s.gear[key]||0,Math.max(0,10000000-s.gold));s.gold+=amount;s.gear[key]=(s.gear[key]||0)-amount;total+=amount}return total}
  function price(s,id,action='buy'){const it=item(id);if(!it)return 0;const n=s.gear.owned[id];if(action==='sell')return n===undefined?0:Math.floor(it.price*.4+n*it.price*.1);if(action==='upgrade')return n===undefined||n>=maxUpgrade?0:Math.ceil(it.price*(it.slot==='weapon'?.25:.4)*(n+1));return it.price}
  function effectiveRank(s,id){const it=item(id);if(!it||!has(s.gear.owned,id)||unlockedChapter(s)<it.chapter)return 0;return Math.min(s.gear.owned[id],Math.max(0,unlockedChapter(s)-it.chapter+1))}
  function status(s,id,action='buy'){
    const it=item(id),deny=(code,reason,requiredChapter=null)=>({ok:false,code,reason,requiredChapter});if(!it)return deny('unknown','找不到這件裝備。');
    const highest=unlockedChapter(s),owned=has(s.gear.owned,id),rank=s.gear.owned[id]||0;
    if(highest<it.chapter)return deny('chapter',`第 ${it.chapter+1} 章解鎖；目前最高已解鎖第 ${highest+1} 章。`,it.chapter+1);
    if(action==='buy'||action==='award'){
      if(owned)return deny('owned','已持有這件裝備。');
      if(action==='award'&&s.gear.claimed.includes(id))return deny('claimed','這件裝備的挑戰獎勵已領取。');
      if(action==='buy'&&it.challenge)return deny('challenge','請完成工匠試煉取得這件裝備。');
    }else if(!owned)return deny('unowned','尚未持有這件裝備。');
    if(action==='upgrade'){
      if(rank>=maxUpgrade)return deny('max','已升至最高級 +3。');
      const required=Math.min(17,it.chapter+rank);if(highest<required)return deny('upgradeChapter',`+${rank+1} 需解鎖第 ${required+1} 章；目前最高第 ${highest+1} 章。`,required+1);
    }
    if((action==='buy'||action==='upgrade')&&s.gold+pendingGold(s)<price(s,id,action))return deny('gold',`軍資不足：需要 ${price(s,id,action)} 錢。`);
    return {ok:true,code:'ready',reason:'',requiredChapter:it.chapter+1};
  }
  function buy(s,id){if(!status(s,id,'buy').ok)return false;redeemCredit(s);s.gold-=price(s,id);s.gear.owned[id]=0;redeemCredit(s);return true}
  function sell(s,id){const it=item(id);if(!it||!has(s.gear.owned,id)||!addGold(s,price(s,id,'sell')))return false;delete s.gear.owned[id];if(s.gear.equipped[it.slot]===id)s.gear.equipped[it.slot]=null;redeemCredit(s);return true}
  function equip(s,id){if(!status(s,id,'equip').ok)return false;s.gear.equipped[item(id).slot]=id;return true}
  function upgrade(s,id){if(!status(s,id,'upgrade').ok)return false;redeemCredit(s);s.gold-=price(s,id,'upgrade');s.gear.owned[id]++;redeemCredit(s);return true}
  function award(s,id){if(!status(s,id,'award').ok)return false;s.gear.claimed.push(id);s.gear.owned[id]=0;return true}
  function weaponId(s){unlockedChapter(s);const id=s.gear?.equipped.weapon;return id&&status(s,id,'equip').ok?id:null}
  function bonus(s,slot,stat,step){unlockedChapter(s);const id=s.gear?.equipped[slot],it=item(id);return it&&status(s,id,'equip').ok?it[stat]+effectiveRank(s,id)*(it.upgradeAttack||step):0}
  function migrate(s){
    const g=s.gear,old=g.schema!==2,ids=s.equipment.filter(id=>has(legacy,id));
    if(!g.migration&&(old||ids.length)){
      const refund=ids.reduce((n,id)=>n+legacy[id].price,0),removed=ids.reduce((n,id)=>n+legacy[id].attack,0);
      s.attack=Math.max(0,s.attack-removed);g.creditGold+=refund;g.migration={version:1,legacyItems:ids,refundGold:refund,attackRemoved:removed};
    }
    s.equipment=s.equipment.filter(id=>!has(legacy,id));g.schema=2;redeemCredit(s);unlockedChapter(s);
    if(old){
      for(const slot of ['weapon','armor','shield']){const id=g.equipped[slot];if(id&&!status(s,id,'equip').ok)g.equipped[slot]=null}
      if(!g.equipped.weapon){const available=Object.keys(g.owned).filter(id=>item(id).slot==='weapon'&&status(s,id,'equip').ok).sort((a,b)=>(item(b).attack+effectiveRank(s,b)*item(b).upgradeAttack)-(item(a).attack+effectiveRank(s,a)*item(a).upgradeAttack));if(available.length)g.equipped.weapon=available[0]}
    }
    return s;
  }
  return {catalog,maxUpgrade,fresh,load,price,buy,sell,equip,upgrade,award,unlockedChapter,status,effectiveRank,weaponId,migrate,redeemCredit,pendingGold,addGold,legacyTarget:id=>legacy[id]?.to||null,attack:s=>bonus(s,'weapon','attack',3),defense:s=>bonus(s,'armor','defense',1)+bonus(s,'shield','defense',1)};
})();
var Core = (() => {
  const gcd=(a,b)=>b?gcd(b,a%b):a;
  const lcm=(a,b)=>a/gcd(a,b)*b;
  const int=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
  const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=int(0,i);[a[i],a[j]]=[a[j],a[i]]}return a};
  const items={herb:{name:'金瘡藥',price:18,desc:'恢復 45 點體力',icon:'herb'},rice:{name:'行軍乾糧',price:15,desc:'補充 30 糧食',icon:'rice'},scroll:{name:'孔明錦囊',price:25,desc:'戰鬥中揭示解題步驟',icon:'scroll'},shield:{name:'護心符',price:30,desc:'抵擋下一次答錯傷害或敵軍主動反擊',icon:'shield'}};
  const fresh=()=>({version:1,progressionVersion:2,gameOver:false,room:null,puzzleSeed:int(1,9999999),chapter:0,x:10,y:34,hp:100,maxHp:100,gold:80,food:120,foodProgress:0,travelDistance:0,xp:0,level:1,attack:24,bag:{herb:3,rice:2,scroll:2,shield:1},equipment:[],gear:Gear.fresh(),party:[],active:[],flags:{},wrong:[],correct:0,total:0,steps:0,finished:false});
  const enemyTier=e=>{
    if(e.type==='animal')return 'animal';
    if(e.name==='呂布'||e.battleTier==='legendary')return 'legendary';
    if(e.type==='boss'||/(?:[將将][軍军帥帅領领]|[主副大上守騎骑戰战][將将]|[主元渠][帥帅]|[統统][帥帅領领]|都督|督[軍军])/.test(e.name))return 'general';
    return e.battleTier||(/隊長|校尉/.test(e.name)?'elite':'soldier');
  };
  const canChallenge=(s,e)=>!e.requiresMainBoss||!!s.flags[s.chapter+'-boss'];
  function battle(chapter,boss,options={}){const animal=!!options.animal,fierce=!!options.fierce,tier=options.battleTier||(animal?'animal':boss?'general':'soldier'),hp=animal?(fierce?30:20)+chapter*2:tier==='legendary'?160+chapter*12:tier==='elite'?72+chapter*6:boss?100+chapter*9:48+chapter*5;return {hp,maxHp:hp,boss,chapter,animal,fierce,tier,combo:0,done:false,guard:false}}

  const attack=s=>s.attack+Progression.attack(s)+Gear.attack(s);
  function answer(s,b,correct){
    if(b.done)return {ignored:true};s.total++;
    if(correct){
      s.correct++;b.combo++;
      const boost=(s.active.includes('關羽')?6:0)+(s.active.includes('黃忠')?8:0),damage=attack(s)+boost+Math.min(b.combo-1,4)*3;
      b.hp=Math.max(0,b.hp-damage);
      const progress=Progression.earn(s,b.animal?'animalAnswer':'answer');
      if(!b.hp){
        b.done=true;const gold=b.animal?0:(b.boss?85:24)+b.chapter*7,food=b.animal?(b.fierce?28:16):b.boss?30:12;
        Gear.addGold(s,gold);s.food+=food;
        const reward=Progression.earn(s,b.animal?'animal':b.boss?'boss':'battle',{key:b.entity?.id,chapter:b.chapter});
        return {damage,win:true,gold,food,xp:progress.xp+reward.xp,levels:progress.levels+reward.levels,name:reward.name,fromLevel:progress.fromLevel??Progression.info(s).level-progress.levels-reward.levels,toLevel:Progression.info(s).level};
      }return {damage,...progress};
    }
    b.combo=0;const damage=b.guard?0:Math.max(2,(b.animal?(b.fierce?11:7):14)+b.chapter-Gear.defense(s)-(s.active.includes('張飛')?7:0));
    b.guard=false;s.hp=Math.max(0,s.hp-damage);if(!s.hp){b.done=true;return {damage,lose:true}}return {damage,xp:0};
  }
  function buy(s,id){const target=Gear.legacyTarget(id);if(target)return Gear.buy(s,target);const item=items[id];if(!item||s.gold+Gear.pendingGold(s)<item.price)return false;Gear.redeemCredit(s);s.gold-=item.price;s.bag[id]++;Gear.redeemCredit(s);return true}
  function use(s,id,b){if(!s.bag[id])return false;if(id==='herb'){if(s.hp===s.maxHp)return false;s.hp=Math.min(s.maxHp,s.hp+45)}else if(id==='rice')s.food+=30;else if(id==='shield'){if(!b||b.guard)return false;b.guard=true}else if(id!=='scroll'||!b)return false;s.bag[id]--;return true}
  function load(text){try{const v=JSON.parse(text);if(!v||v.version!==1||v.progressionVersion!==undefined&&v.progressionVersion!==2)return null;if(v.puzzleSeed!==undefined&&(!Number.isInteger(v.puzzleSeed)||v.puzzleSeed<1||v.puzzleSeed>9999999))return null;for(const k of ['chapter','x','y','hp','maxHp','gold','food','xp','level','attack','correct','total','steps'])if(!Number.isFinite(v[k])||v[k]<0||v[k]>1e7)return null;if(!Number.isInteger(v.chapter)||v.chapter>17||v.hp>v.maxHp||v.maxHp<1||v.x<.5||v.x>94.5||v.y<.5||v.y>62.5)return null;const s=fresh();Object.keys(s).forEach(k=>{if(typeof s[k]==='number')s[k]=v[k]});s.foodProgress=Number.isFinite(v.foodProgress)&&v.foodProgress>=0&&v.foodProgress<1?v.foodProgress:0;s.travelDistance=Number.isFinite(v.travelDistance)&&v.travelDistance>=0?v.travelDistance:0;s.puzzleSeed=v.puzzleSeed===undefined?1:v.puzzleSeed;for(const k of ['party','active','equipment']){if(!Array.isArray(v[k])||v[k].some(x=>typeof x!=='string'||x.length>20))return null;s[k]=[...new Set(v[k])]}s.active=s.active.filter(x=>s.party.includes(x)).slice(0,3);if(!v.bag||!v.flags||typeof v.flags!=='object'||Array.isArray(v.flags))return null;for(const k of Object.keys(s.bag)){if(!Number.isInteger(v.bag[k])||v.bag[k]<0||v.bag[k]>1e5)return null;s.bag[k]=v.bag[k]}for(const [k,val] of Object.entries(v.flags)){if(/^[a-z0-9_-]{1,60}$/i.test(k)&&typeof val==='boolean')s.flags[k]=val}s.wrong=Array.isArray(v.wrong)?v.wrong.filter(x=>x&&typeof x.text==='string'&&typeof x.explain==='string'&&x.text.length<500&&x.explain.length<1000).slice(-60):[];s.gear=Gear.load(v.gear);if(!s.gear)return null;s.finished=v.finished===true;s.gameOver=s.hp<=0||v.gameOver===true;if(v.room!=null){const r=v.room;if(!r||!['shop','armory','academy','clinic','granary','granary-store','inn','station','tower'].includes(r.id)||!Number.isFinite(r.x)||!Number.isFinite(r.y)||r.x<1.5||r.x>19.5||r.y<1.5||r.y>15.5)return null;s.room={id:r.id,x:r.x,y:r.y}}if(v.progressionVersion!==2){s.xp=35*v.level*(v.level-1)+v.xp;s.attack=Math.max(24,v.attack-Math.max(0,v.level-1)*3);const visited=Math.max(s.chapter,...Object.keys(s.flags).filter(k=>s.flags[k]&&/^\d+-/.test(k)).map(k=>Number(k.split('-')[0])));for(let i=0;i<Math.min(18,visited);i++){s.flags[i+'-chapter-passed']=true;s.flags['xp-'+i+'-chapter-passed']=true}}s.level=Progression.info(s).level;s.progressionVersion=2;Gear.migrate(s);return s}catch{return null}}
  const battleTypes=new Map();
  function profile(chapter,options={}){
    const ch=Math.max(0,Math.min(17,Math.floor(chapter)||0));
    const battleTier=options.battleTier||'all';
    if(battleTier==='legendary'&&ch!==17)throw Error('武神試煉在終章解鎖');
    const key=ch+'|'+battleTier;
    if(!battleTypes.has(key)){
      const ids=QuestionData.battlePools[ch]?.[battleTier],allowed=ids?new Set(ids):null;
      const pool=battleTier==='legendary'?QuestionData.legendaryQuestions:allowed?QuestionData.questions.filter(q=>allowed.has(q.id)):null;
      battleTypes.set(key,pool?[...new Set(pool.map(q=>q.type))]:QuestionData.chapterTypes[ch]);
    }
    const level=ch+1,types=battleTypes.get(key);
    return {chapter:ch,animal:!!options.animal,battleTier,level,min:QuestionData.range.baseMin+level,max:QuestionData.range.baseMax+level,types};
  }
  const topics=QuestionData.topics;
  const questionHistory=new Map();
  const questionKey=QuestionBank.signature;
  function question(chapter,settings={}){
    const prof=profile(chapter,settings),forced=Number.isInteger(settings.type)&&prof.types.includes(settings.type);
    const types=forced?[settings.type]:prof.types,key=`${prof.level}|${!!settings.animal}|${prof.battleTier}|${forced?settings.type:'all'}`;
    if(!questionHistory.has(key))questionHistory.set(key,{recent:[],reserve:null,typeCounts:new Map(),groupCounts:new Map(),lastGroups:new Map(),lastType:null});
    const history=questionHistory.get(key);
    const remember=q=>{history.recent.push(questionKey(q));if(history.recent.length>6)history.recent.shift();history.lastType=q.type;history.typeCounts.set(q.type,(history.typeCounts.get(q.type)||0)+1);const group=QuestionBank.groupKey(q);history.groupCounts.set(group,(history.groupCounts.get(group)||0)+1);history.lastGroups.set(q.type,group);return q};
    const chooseType=()=>{
      // Small late-game subpools may exhaust their unseen questions. Wait for
      // them to leave the recent window instead of repeating a solved question.
      let available=types.filter(type=>QuestionBank.hasFresh(prof,type,history.recent));if(!available.length)available=types;
      const different=available.filter(type=>type!==history.lastType);if(different.length)available=different;
      const least=Math.min(...available.map(type=>history.typeCounts.get(type)||0)),choices=available.filter(type=>(history.typeCounts.get(type)||0)===least);
      return choices[int(0,choices.length-1)];
    };
    for(let attempt=0;attempt<16;attempt++){
      const q=generateQuestion(prof,chooseType(),int,history);
      if(!history.recent.includes(questionKey(q)))return remember(q);
    }
    // A bounded, independently seeded reserve still works when Math.random is stuck.
    // Cache distinct questions so a small pool can rotate without retrying forever.
    if(!history.reserve){
      history.reserve=[];const seen=new Set();let seed=12345+prof.level*977+types[0]*131;
      const reserveInt=(a,b)=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return a+Math.floor(seed/4294967296*(b-a+1))};
      for(let attempt=0;attempt<512&&history.reserve.length<24;attempt++){
        const q=generateQuestion(prof,types[attempt%types.length],reserveInt),signature=questionKey(q);
        if(!seen.has(signature)){seen.add(signature);history.reserve.push(q)}
      }
    }
    const available=history.reserve.find(q=>!history.recent.includes(questionKey(q)));
    const q=available||history.reserve.reduce((oldest,next)=>history.recent.lastIndexOf(questionKey(next))<history.recent.lastIndexOf(questionKey(oldest))?next:oldest);
    return remember({...q,options:shuffle([...q.options])});
  }
  function generateQuestion(prof,type,int,history){return QuestionBank.generate(prof,type,int,history)}
  return {gcd,lcm,int,profile,question,topics,fresh,battle,answer,buy,use,load,items,attack,enemyTier,canChallenge,earn:Progression.earn};
})();
