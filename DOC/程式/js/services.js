/* Town services use the same local modal and save system as the main game. */
var Services=(()=>{
 let ui;
 function init(hooks){ui=hooks}
 function changed(){ui.save();ui.update()}
 function armory(inventoryOnly=false){
  const s=ui.state,c=ui.modal(inventoryOnly?'隨身裝備':'武器館・百鍊堂','武器 · 防具 · 升級'),gear=s.gear,highest=Gear.unlockedChapter(s);
  c.innerHTML=`<p class="prose">${inventoryOnly?'可切換已擁有裝備，買賣升級請到武器館。':'六階武器於第 1、4、7、10、13、16 章開放。每階的 +1／+2／+3 隨三章逐步開放；依曾解鎖最高章節計算，回訪不會倒退。每件裝備的挑戰獎勵限領一次，答對算題才會造成武器傷害。'}<br>軍資 ${s.gold} 錢 · 攻擊 ${Core.attack(s)} · 防禦 ${Gear.defense(s)} · 最高已解鎖第 ${highest+1} 章</p><div class="card-grid gear-grid"></div>`;
  if(gear.migration?.refundGold||Gear.pendingGold(s)){const p=document.createElement('p');p.className='note';p.textContent=(gear.migration?.refundGold?`舊版永久武器已一次性換回 ${gear.migration.refundGold} 錢，原永久攻擊已併回單一裝備制度；金錢與階級進度保留。`:'')+(Gear.pendingGold(s)?`另有 ${Gear.pendingGold(s)} 錢待領，消費後會自動入帳。`:'');c.insertBefore(p,c.querySelector('.card-grid'))}
  const grid=c.querySelector('.card-grid');
  for(const [id,item]of Object.entries(Gear.catalog)){
   const owned=Object.prototype.hasOwnProperty.call(gear.owned,id);if(inventoryOnly&&!owned)continue;
   const rank=gear.owned[id]||0,effective=Gear.effectiveRank(s,id),card=document.createElement('article');card.className='item-card gear-card';card.dataset.gear=id;
   const step=item.slot==='weapon'?`每級攻擊 +${item.upgradeAttack}`:'每級防禦 +1',schedule=[1,2,3].map(n=>`+${n}：第 ${Math.min(18,item.chapter+n)} 章`).join(' · ');
   card.innerHTML=`<div class="item-icon ${item.slot==='weapon'?'sword':'shield'}"></div><div><h3>${item.name}${owned?' +'+rank:''}</h3><p>${item.slot==='weapon'?'武器':'防具'} · 基礎攻擊 +${item.attack||0}／防禦 +${item.defense||0}<br>第 ${item.chapter+1} 章開放 · ${step}<br>${schedule}${owned&&(highest<item.chapter||effective<rank)?`<br>舊存檔資產保留：${highest<item.chapter?'本裝備暫時封存':`目前 +${effective} 生效，其餘升級暫時封存`}；解鎖對應章節後自動恢復。`:''}</p><div class="gear-actions"></div><p class="note gear-lock-reason"></p></div>`;
   const row=card.querySelector('.gear-actions');
   const reasons=[],action=(text,kind,fn,message='',already=false)=>{const check=Gear.status(s,id,kind),b=ui.button(text,()=>{if(fn()){changed();armory(inventoryOnly);if(message)ui.receipt(message)}else ui.toast(Gear.status(s,id,kind).reason||'裝備狀態已變更，請重新選擇。')},'',row);b.disabled=already||!check.ok;b.title=check.reason;if(!check.ok&&!reasons.includes(check.reason))reasons.push(check.reason);return b};
   if(owned){const worn=gear.equipped[item.slot]===id;action(worn?'裝備中':'裝備','equip',()=>Gear.equip(s,id),'',worn);if(!inventoryOnly){const cost=Gear.price(s,id,'upgrade');action(rank>=Gear.maxUpgrade?'已升至最高級':`升級 +${rank+1} · ${cost} 錢`,'upgrade',()=>Gear.upgrade(s,id),`升級完成：${item.name} +${rank} → +${rank+1}，支付 ${cost} 錢。`);ui.button(`出售 ${Gear.price(s,id,'sell')} 錢`,()=>{const sale=Gear.price(s,id,'sell'),confirm=ui.modal('出售裝備','確認交易');confirm.innerHTML=`<p class="prose">出售「${item.name} +${rank}」可得 ${sale} 錢。若正在裝備，出售後會卸下；升級等級不保留。</p>`;ui.button('確認出售',()=>{if(Gear.sell(s,id)){changed();armory();ui.receipt(`出售成交：${item.name} +${rank} ×1，獲得 ${sale} 錢。`)}},'primary',confirm);ui.button('取消',()=>armory(),'secondary',confirm)},'',row)}}
   else if(!inventoryOnly){if(!item.challenge)action(`購買 ${Gear.price(s,id)} 錢`,'buy',()=>Gear.buy(s,id),`購買成交：${item.name} ×1，支付 ${Gear.price(s,id)} 錢。`);const check=Gear.status(s,id,'award'),b=ui.button(gear.claimed.includes(id)?'挑戰獎勵已領取':'答題挑戰換裝備',()=>challenge(id),'',row);b.disabled=!check.ok;b.title=check.reason;if(!check.ok&&!reasons.includes(check.reason))reasons.push(check.reason)}
   card.querySelector('.gear-lock-reason').textContent=reasons.join(' ');
   grid.appendChild(card);
  }
  if(inventoryOnly&&!Object.keys(gear.owned).length){const p=document.createElement('p');p.className='note';p.textContent='尚無新式裝備。前往城內武器館購買，或完成挑戰取得。';c.appendChild(p)}
 }
 function challenge(id){
  const item=Gear.catalog[id],s=ui.state,check=Gear.status(s,id,'award');if(!check.ok){ui.toast(check.reason);return}
  let count=0;
  function round(){const check=Gear.status(s,id,'award');if(!check.ok){ui.toast(check.reason);armory();return}const question=Core.question(item.chapter),c=ui.modal(item.name+'・工匠試煉',`連續答對 ${count} / 3 題 · 第 ${item.chapter+1} 章算題`);ScreenUI.mode('quiz');c.innerHTML='<p class="question"></p><div class="answers"></div><div class="feedback" hidden></div>';c.querySelector('.question').textContent=question.text;let answered=false;
   for(const n of question.options)ui.button(String(n),()=>{if(answered)return;answered=true;const ok=n===question.answer;s.total++;if(ok){s.correct++;count++;ui.earn('answer',null,{chapter:item.chapter})}else{count=0;s.wrong.push({text:question.text,explain:question.explain});s.wrong=s.wrong.slice(-60)}ui.tone(ok);document.querySelector('.modal').classList.add('answered');const f=c.querySelector('.feedback');f.hidden=false;f.textContent=(ok?'答對！':'答錯了，連續答對次數歸零。')+question.explain;for(const b of c.querySelectorAll('.answers button'))b.disabled=true;changed();ui.button(count===3?'領取裝備':'下一題',()=>{if(count===3){const awarded=Gear.award(s,id);if(awarded)ui.earn('recruit','gear-'+id,{chapter:item.chapter});changed();armory();ui.toast(awarded?'工匠贈你 '+item.name+'！可在裝備清單選擇使用。':'此裝備獎勵已領取。')}else round()},'primary',f)},'answer',c.querySelector('.answers'));
   ui.button('離開挑戰',()=>armory(),'text-button',c)
  }round()
 }
 function clinic(){const s=ui.state,c=ui.modal('醫館・仁心堂','療傷 · 藥材');const cost=Math.max(5,Math.ceil((s.maxHp-s.hp)/5));c.innerHTML=`<p class="prose">「大夫，我的傷能約分嗎？」「先把傷養好，再把分數約好！」<br>目前體力 ${s.hp} / ${s.maxHp}，軍資 ${s.gold} 錢。營地也提供免費休整。</p>`;const heal=ui.button(`診療至全滿 · ${cost} 錢`,()=>{if(s.hp<s.maxHp&&s.gold>=cost){const recovered=s.maxHp-s.hp;s.gold-=cost;s.hp=s.maxHp;changed();clinic();ui.receipt(`診療完成：恢復 ${recovered} 點體力，支付 ${cost} 錢。`)}},'primary',c);heal.disabled=s.hp===s.maxHp||s.gold<cost;const row=document.createElement('div');row.className='button-row';c.appendChild(row);ui.button('購買金瘡藥 · 18 錢',()=>{if(Core.buy(s,'herb')){changed();clinic();ui.receipt('購買成交：金瘡藥 ×1，支付 18 錢。')}else ui.toast('軍資不足，可回營地免費休整。')},'secondary',row)}
 function granary(){const s=ui.state,c=ui.modal('糧棧・軍需補給','補給 · 行軍');c.innerHTML='<p class="prose">「兵馬未動，糧草先行。」購買乾糧後可在行囊使用，每份補充 30 糧。<br>軍資 '+s.gold+' 錢 · 乾糧 '+s.bag.rice+' 份</p>';ui.button('購買乾糧 · 15 錢',()=>{if(Core.buy(s,'rice')){changed();granary();ui.receipt('購買成交：行軍乾糧 ×1，支付 15 錢。')}else ui.toast('軍資不足，可在營地領取基本補給。')},'primary',c)}
 return {init,armory,clinic,granary};
})();
