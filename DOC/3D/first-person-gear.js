/* Local vector viewmodels show the equipment actually worn by the player. */
var GearView=(()=>{
 let root,key='';
 const svg=(body,label)=>'<svg viewBox="0 0 260 420" role="img" aria-label="'+label+'" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="steel"><stop stop-color="#effaff"/><stop offset=".24" stop-color="#a9bbc4"/><stop offset=".48" stop-color="#f9ffff"/><stop offset=".52" stop-color="#617c89"/><stop offset="1" stop-color="#243e4c"/></linearGradient><linearGradient id="gold"><stop stop-color="#412709"/><stop offset=".3" stop-color="#e5be57"/><stop offset=".55" stop-color="#fff1a1"/><stop offset="1" stop-color="#806019"/></linearGradient><linearGradient id="leather"><stop stop-color="#724729"/><stop offset=".55" stop-color="#291c16"/><stop offset="1" stop-color="#956542"/></linearGradient><linearGradient id="skin"><stop stop-color="#e8bd91"/><stop offset="1" stop-color="#a46b4a"/></linearGradient></defs>'+body+'</svg>';
 function weapon(id){
  const spear=/spear/.test(id),dragon=id==='dragon_blade',bronze=id==='bronze_sword',name=Gear.catalog[id]?.name||Core.items[id]?.name||'雙股劍';
  const metal=bronze?'url(#gold)':'url(#steel)',grip='<path d="M149 337Q151 316 166 316L184 333 173 386 143 379Z" fill="url(#skin)" stroke="#704d35" stroke-width="2"/><path d="M119 371L177 377 210 420H98Z" fill="#234638" stroke="#122c25" stroke-width="3"/><path d="M126 372L181 378 178 390 118 383Z" fill="url(#gold)"/>';
  let blade;
  if(spear)blade='<path d="M160 420L186 105" stroke="url(#leather)" stroke-width="11"/><path d="M163 419L189 107" stroke="#a67e46" stroke-width="2"/><path d="M177 119L169 87 202 7 201 95 191 122Z" fill="'+metal+'" stroke="#344c56" stroke-width="2"/><path d="M186 112L202 7 192 98Z" fill="#eff9fb"/><path d="M177 119Q141 138 164 162M187 119Q207 137 185 158" fill="none" stroke="#9e2331" stroke-width="6"/>';
  else if(dragon)blade='<path d="M156 420L181 154" stroke="url(#leather)" stroke-width="13"/><path d="M175 164Q125 133 136 74Q145 18 220 3Q177 58 212 102Q215 139 182 157Z" fill="'+metal+'" stroke="#405561" stroke-width="3"/><path d="M136 75Q144 23 220 3Q192 31 183 53Q154 53 150 79Z" fill="#e8f5f7"/><path d="M156 104Q172 81 196 106Q174 119 165 99M157 106L144 121M188 105L199 126" fill="none" stroke="url(#gold)" stroke-width="5"/><path d="M166 159L192 161" stroke="url(#gold)" stroke-width="11"/><path d="M177 165Q137 189 164 230" fill="none" stroke="#135e4f" stroke-width="8"/>';
  else blade='<g transform="rotate(13 170 340)"><path d="M158 291L156 82 169 12 184 80 182 291Z" fill="'+metal+'" stroke="#43565d" stroke-width="2"/><path d="M169 12L167 288 157 283 156 82Z" fill="'+(bronze?'#ffdd78':'#edfaff')+'" opacity=".85"/><path d="M164 298L178 298 179 365 163 365Z" fill="url(#leather)" stroke="#372616" stroke-width="2"/><path d="M132 296Q169 277 207 297L199 306Q169 294 140 307Z" fill="url(#gold)" stroke="#705123" stroke-width="2"/><path d="M163 309L180 316M163 322L180 329M163 335L180 342M163 348L180 355" stroke="#af8c59" stroke-width="2"/><ellipse cx="171" cy="370" rx="13" ry="10" fill="url(#gold)"/><circle cx="172" cy="298" r="6" fill="#2d857e" stroke="#ebd585"/></g>';
  if(id==='twin-swords')blade='<g opacity=".82" transform="translate(-48 38) rotate(-13 150 330)">'+blade+'</g>'+blade;
  return svg(blade+grip,name);
 }
 function shield(id){
  const item=Gear.catalog[id],wood=id==='wood_shield',dark=id==='guardian_shield',fill=wood?'#67452e':dark?'#174e50':'#8a713a';
  return svg('<path d="M36 212Q58 153 128 143Q199 153 224 212L206 329Q184 385 130 414Q75 384 51 329Z" fill="'+fill+'" stroke="#1b2526" stroke-width="7"/><path d="M43 214Q66 163 129 152Q192 163 215 214L198 326Q178 373 130 401Q83 373 60 326Z" fill="none" stroke="url(#gold)" stroke-width="9"/>'+(wood?'<path d="M83 166L86 369M113 156L114 395M146 157L146 397M178 169L175 372" stroke="#392718" stroke-width="5"/><path d="M85 178L88 357M119 169L119 373M153 171L153 376" stroke="#a47949" stroke-width="2"/>':'<path d="M130 175L91 222 69 293 131 367 194 293 170 222Z" fill="none" stroke="'+(dark?'#70a69a':'#d9bc6b')+'" stroke-width="4"/><path d="M130 199L106 243 130 225 154 244Z" fill="url(#gold)"/>')+'<ellipse cx="130" cy="279" rx="49" ry="53" fill="#263536" stroke="url(#gold)" stroke-width="8"/><ellipse cx="130" cy="277" rx="35" ry="40" fill="url(#steel)"/><ellipse cx="124" cy="269" rx="15" ry="24" fill="#dde7dc" opacity=".45"/><g fill="#e1c272" stroke="#594627">'+[ [71,202],[190,202],[65,320],[195,320],[130,383] ].map(p=>'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="5"/>').join('')+'</g>',item.name);
 }
 function update(s){
  root??=document.querySelector('.gear-view');if(!root)return;
  const id=s.gear.equipped.weapon||(s.equipment.includes('spear')?'spear':s.equipment.includes('sword')?'sword':'twin-swords'),sid=s.gear.equipped.shield;
  const next=id+'|'+sid+'|'+(s.gear.owned[id]||0)+'|'+(s.gear.owned[sid]||0);if(key===next)return;key=next;
  root.innerHTML='<div class="held-weapon" data-weapon="'+id+'">'+weapon(id)+'</div>'+(sid?'<div class="held-shield" data-shield="'+sid+'">'+shield(sid)+'</div>':'');
  root.setAttribute('aria-label','目前武器：'+(Gear.catalog[id]?.name||Core.items[id]?.name||'雙股劍')+(sid?'；盾牌：'+Gear.catalog[sid].name:''));
 }
 function animate(moving,t){if(!root)return;root.style.setProperty('--gear-bob',(moving?Math.sin(t*9)*9:0)+'px');root.style.setProperty('--gear-sway',(moving?Math.cos(t*4.5)*6:0)+'px');root.style.setProperty('--gear-tilt',(moving?Math.sin(t*4.5)*1.5:0)+'deg')}
 return {update,animate};
})();
