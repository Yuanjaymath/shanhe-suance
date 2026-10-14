/* Chapter locations in Han geography, not administrative borders.
   Reference: Academia Sinica E. Han map, https://gis.sinica.edu.tw/ccts/ (ad0140).
   Repeated locations have callouts; fictional Taiping sits beside Luoyang. */
var CampaignMap=(()=>{
 const locations=[
  {name:'涿郡',lon:115.97,lat:39.48,dx:-25,dy:5},
  {name:'桃園・涿郡',lon:115.97,lat:39.48,dx:80,dy:8},
  {name:'潁川',lon:113.82,lat:34.13,dx:17,dy:12},
  {name:'安喜',lon:114.99,lat:38.52,dx:27,dy:51},
  {name:'虎牢關',lon:113.16,lat:34.84,dx:1,dy:-39},
  {name:'徐州',lon:117.18,lat:34.26,dx:47,dy:1},
  {name:'汝南',lon:114.36,lat:33.0,dx:63,dy:32},
  {name:'隆中',lon:112.02,lat:31.98,dx:-28,dy:3},
  {name:'長坂',lon:111.79,lat:30.82,dx:-66,dy:30},
  {name:'赤壁',lon:113.60,lat:29.90,dx:48,dy:26},
  {name:'長沙',lon:112.98,lat:28.20,dx:3,dy:20},
  {name:'葭萌關',lon:105.96,lat:32.34,dx:13,dy:41},
  {name:'成都',lon:104.06,lat:30.67,dx:7,dy:52},
  {name:'漢中',lon:107.03,lat:33.07,dx:7,dy:-5},
  {name:'荊州・江陵',lon:112.24,lat:30.33,dx:10,dy:9},
  {name:'祁山',lon:105.18,lat:34.22,dx:-15,dy:-19},
  {name:'洛陽',lon:112.45,lat:34.62,dx:-55,dy:-62},
  {name:'太平城＊',lon:112.45,lat:34.62,dx:-81,dy:3}
 ];
 const project=(lon,lat)=>({x:60+(lon-104)*32,y:66+(40-lat)*26});
 const safe=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 let lastKey='',lastState=null;
 function progress(s){const completed=locations.map((_,i)=>!!(s.flags?.[i+'-boss']||s.flags?.[i+'-chapter-passed']));const count=completed.filter(Boolean).length;return {completed,count,complete:count===18}}
 function render(s,prefix='campaign',fresh=[]){
  const p=progress(s),id=prefix+'-',titles=typeof Story==='undefined'?[]:Story.chapters;
  const path=coords=>'M'+coords.map(([lon,lat])=>{const a=project(lon,lat);return a.x.toFixed(1)+','+a.y.toFixed(1)}).join(' L');
  return '<svg viewBox="0 0 640 485" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="漢末章節地點圖，北上南下，已完成 '+p.count+' 章"><defs><linearGradient id="'+id+'paper" x2="0" y2="1"><stop stop-color="#fff1d1"/><stop offset="1" stop-color="#cdb07a"/></linearGradient><radialGradient id="'+id+'jade"><stop stop-color="#569276"/><stop offset="1" stop-color="#173f35"/></radialGradient></defs>'+
   '<rect x="5" y="5" width="630" height="475" rx="16" fill="#233f35" stroke="#c09d56" stroke-width="4"/><rect x="15" y="15" width="610" height="455" rx="10" fill="url(#'+id+'paper)"/><text x="320" y="48" text-anchor="middle" font-family="serif" font-size="27" font-weight="bold" letter-spacing="6" fill="#42331c">'+(prefix==='campaign'?'十八章山河':'漢末山河・十八章旅程')+'</text>'+
   '<path d="M28 82L156 70 217 103 303 87 418 65 490 92 510 126 490 168 537 176 562 234 584 278 550 344 500 405 440 423 358 419 255 434 171 412 118 433 56 395 37 327 27 244Z" fill="#b9b783" stroke="#8d8050" stroke-width="2" opacity=".65"/>'+
   '<path d="'+path([[103.2,35.5],[106,36],[107.5,37.2],[110.5,37.3],[110.5,35],[112.4,34.7],[114,34.8],[116,35.4],[118.4,37.5]])+'" fill="none" stroke="#548f99" stroke-width="4" stroke-linejoin="round"/><path d="'+path([[103.2,29.5],[105,28.9],[106.4,29.6],[109,30.7],[111,30.8],[112.3,30.3],[113.6,29.9],[115,30],[117,30.8],[119.5,32]])+'" fill="none" stroke="#548f99" stroke-width="5" stroke-linejoin="round"/>'+
   '<g fill="#6a6743" font-family="serif" font-size="20" opacity=".8"><text x="124" y="168">秦嶺</text><text x="58" y="362">益州</text><text x="260" y="414">荊州</text><text x="513" y="363">揚州</text><text x="435" y="151">冀州</text><text x="478" y="68">幽州</text></g><g fill="#356976" font-family="serif" font-size="20"><text x="475" y="170">黃河</text><text x="488" y="297">長江</text></g>'+
   '<path d="M585 115V78M577 89L585 77 593 89" fill="none" stroke="#60482c" stroke-width="2"/><text x="585" y="69" text-anchor="middle" font-size="22" fill="#60482c">北</text>'+
   locations.map((r,i)=>{const a=project(r.lon,r.lat),x=a.x+r.dx,y=a.y+r.dy;return '<g class="campaign-mark'+(p.completed[i]?' is-cleared':'')+'"><title>第 '+(i+1)+' 章・'+safe(titles[i]?.title||r.name)+'・'+safe(r.name)+'・'+(p.completed[i]?'已完成':'尚未完成')+'</title>'+(r.dx||r.dy?'<path d="M'+a.x+' '+a.y+'L'+x+' '+y+'" stroke="#7e6540" stroke-width="1.8"/><circle cx="'+a.x+'" cy="'+a.y+'" r="3" fill="#6d5432"/>':'')+'<circle class="campaign-region'+(p.completed[i]?' is-cleared':'')+(fresh.includes(i)?' just-cleared':'')+'" data-chapter="'+i+'" cx="'+x+'" cy="'+y+'" r="18" fill="'+(p.completed[i]?'url(#'+id+'jade)':'#ecdbb3')+'" stroke="'+(p.completed[i]?'#f8d680':'#856639')+'" stroke-width="2"/><text x="'+x+'" y="'+(y+7)+'" text-anchor="middle" font-size="22" font-weight="bold" fill="'+(p.completed[i]?'#fff0b4':'#47351e')+'">'+(i+1)+'</text><text x="'+x+'" y="'+(y+38)+'" text-anchor="middle" font-size="22" font-weight="bold" fill="#42351f" stroke="#f4e6c7" stroke-width="3" paint-order="stroke">'+safe(prefix==='campaign'?r.name.split('・')[0].replace('＊',''):r.name)+'</text></g>'}).join('')+
   '<text x="320" y="463" text-anchor="middle" font-size="24" font-weight="bold" fill="#302b1c">'+(p.complete?'天下歸一・十八章功成':p.count+' / 18　山河已定')+'</text></svg>';
 }
 function update(s){
  const p=progress(s),key=p.completed.map(v=>v?'1':'0').join(''),root=document.getElementById('campaign-map');if(!root)return p;
  root.setAttribute('aria-label','十八章成就版圖：已完成 '+p.count+' / 18 章，可從旅途選單查看');root.classList.toggle('is-unified',p.complete);root.dataset.completed=p.count;
  if(key!==lastKey||s!==lastState){const fresh=p.completed.flatMap((done,i)=>done&&s===lastState&&lastKey[i]==='0'?[i]:[]);root.innerHTML=render(s,'campaign',fresh);lastKey=key;lastState=s}return p;
 }
 return {locations:Object.freeze(locations.map(r=>Object.freeze(r))),progress,render,update};
})();
