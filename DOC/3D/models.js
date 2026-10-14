/* Original procedural models. Every named person has a unique costume/material key. */
var ActorModels=(()=>{
 const cache=new Map();const hash=name=>Array.from(name).reduce((h,c)=>(Math.imul(h,31)+c.codePointAt(0))>>>0,17);
 const hue=(h,s=.42,l=.42)=>{const f=n=>{const k=(n+h/30)%12,a=s*Math.min(l,1-l);return l-a*Math.max(-1,Math.min(k-3,9-k,1))};return [f(0),f(8),f(4)]};
 function get(name){if(cache.has(name))return cache.get(name);const h=hash(name),female=/婆|娘|姊|妹|婦/.test(name),old=/婆|長|老|先生|郎中/.test(name);const specials={'劉備':[.22,.49,.35],'關羽':[.16,.43,.25],'張飛':[.29,.22,.19],'趙雲':[.72,.77,.76],'諸葛亮':[.75,.78,.64],'ㄚ杰':[.36,.72,.61],'曹操':[.24,.29,.42],'周瑜':[.68,.36,.30],'黃蓋':[.62,.50,.32],'呂布':[.48,.24,.24],'夏侯淵':[.25,.30,.38],'司馬懿':[.30,.32,.45],'韓玄':[.39,.31,.47]};const info={name,key:h,coat:specials[name]||(/黃巾/.test(name)?[.64,.55,.26]:/曹|魏軍/.test(name)?[.27,.31,.41]:/董卓|西涼/.test(name)?[.42,.29,.26]:/吳軍|東吳/.test(name)?[.42,.34,.27]:hue((h%36000)/100)),trim:/黃巾/.test(name)?[.94,.79,.19]:hue((h+117)%360,.65,.64),hair:old?[.68,.68,.63]:[.12,.10,.08],skin:[.75+(h%8)*.012,.57+(h%5)*.014,.42+(h%4)*.018],female,old,beard:!female&&(old||['關羽','張飛','劉備','曹操','黃蓋','司馬懿'].includes(name)),hat:name==='ㄚ杰'?0:(h%4)+1,variant:h%5,height:old?.92:1,modern:name==='ㄚ杰'};cache.set(name,info);return info}
 const weaponFor=name=>/弓/.test(name)?'bow':/槍|騎兵/.test(name)?'spear':'blade';
 const meshCache=new Map();
 function person(api,name,x,z,yaw=0,moving=false,t=0,detail=1,pose=null){
  if(!api.mesh||!api.create)return sculpt(api,name,x,z,yaw,moving,t,pose);
  const phase=moving?Math.floor(((t*10)%(Math.PI*2))/(Math.PI*2)*12):-1;
  const cut=pose?.swing==null?null:Math.round(Math.max(0,Math.min(1,pose.swing))*12)/12;
  const key=name+'|'+phase+'|'+detail+(pose?'|'+pose.weapon+'|'+cut:'');let data=meshCache.get(key);
  if(!data){const g=api.create();if(!detail){const oval=g.ellipsoid,tube=g.segment;g.ellipsoid=(x,y,z,rx,ry,rz,c,angle)=>oval(x,y,z,rx,ry,rz,c,angle,6,4);g.segment=(a,b,r1,r2,c,sides,mat)=>tube(a,b,r1,r2,c,6,mat)}
   sculpt(g,name,0,0,0,moving,phase<0?0:phase*Math.PI*2/120,pose?{...pose,swing:cut}:null);data=g.data();
   if(meshCache.size>=96)meshCache.delete(meshCache.keys().next().value);meshCache.set(key,data);
  }api.mesh(data,x,z,yaw)
 }

 function sculpt(api,name,x,z,yaw=0,moving=false,t=0,pose=null){
  const a=get(name),scale=a.height,ca=Math.cos(yaw),sa=Math.sin(yaw),point=(lx,y,lz)=>[x+(lx*ca+lz*sa)*scale,y*scale,z+(-lx*sa+lz*ca)*scale];
  const oval=(lx,y,lz,rx,ry,rz,c,segments=8,rings=4)=>{const p=point(lx,y,lz);api.ellipsoid(...p,rx*scale,ry*scale,rz*scale,c,yaw,segments,rings)};
  const limb=(from,to,r1,r2,c)=>api.segment(point(...from),point(...to),r1*scale,r2*scale,c,8,1);
  const flat=(lx,y,lz,w,h,d,c,mat=0)=>{const p=point(lx,y,lz);api.box(...p,w*scale,h*scale,d*scale,c,yaw,mat)};
  const swing=moving?Math.sin(t*10)*.13:0,pants=a.modern?[.22,.34,.43]:a.coat,shoe=[.14,.13,.11];
  for(const side of [-1,1]){const step=side*swing,lx=side*.145;limb([lx,.62,0],[lx,.32,step*.45],.105,.085,pants);limb([lx,.32,step*.45],[lx,.105,step],.085,.068,pants);oval(lx,.07,step+.065,.115,.07,.18,shoe);}
  oval(0,.95,0,.285,.35,.18,a.coat);if(!a.modern){limb([0,.64,0],[0,.91,0],.31,.255,a.coat);oval(0,.53,0,.31,.105,.21,a.coat)}
  // Overlapping lapels, sash, buckle and tunic seams.
  flat(0,.81,.18,.55,.072,.032,a.trim);oval(0,.81,.204,.055,.048,.023,[.81,.66,.33]);
  limb([-.13,1.20,.145],[.14,.89,.178],.033,.029,a.trim);if(!a.modern)limb([.12,1.20,.145],[-.11,.94,.18],.028,.022,a.trim);
  const cut=pose?.swing??0,hand=pose?[-.36,pose.swing===null?.77:1.20+Math.sin(cut*Math.PI)*.12,.16+cut*.22]:null;
  for(const side of [-1,1]){const swingArm=-side*swing,shoulder=[side*.29,1.12,0],elbow=pose&&side===-1?[-.43,hand[1]-.14,.13]:[side*.35,.90,swingArm*.35],wrist=pose&&side===-1?hand:[side*.37,.67,swingArm];oval(...shoulder,.115,.145,.135,a.coat);limb(shoulder,elbow,.108,.091,a.coat);limb(elbow,wrist,.091,.065,a.coat);oval(...wrist,.068,.087,.073,a.skin);}
  const bow=grip=>{const [gx,gy,gz]=grip,arc=[[gx,gy-.62,gz],[gx,gy-.36,gz+.20],[gx,gy,gz+.30],[gx,gy+.36,gz+.20],[gx,gy+.62,gz]];for(let i=1;i<arc.length;i++)limb(arc[i-1],arc[i],.027,.025,[.56,.36,.18]);limb(arc[0],arc[4],.006,.006,[.88,.82,.63]);limb([gx,gy,gz-.22],[gx,gy,gz+.93],.008,.008,[.52,.35,.20]);flat(gx,gy,gz+.94,.055,.06,.13,[.75,.81,.79],13)};
  if(pose?.weapon==='bow')bow(hand);
  else if(pose&&api.prism){
   const angle=pose.swing===null?.35:-.82+cut*2.8,dy=Math.cos(angle),dz=Math.sin(angle);
   const length=pose.weapon==='dragon'?1.32:1.04,base=[hand[0],hand[1]+dy*.23,hand[2]+dz*.23];
   const weaponPoint=(along,width=0)=>point(base[0],base[1]+dy*along-dz*width,base[2]+dz*along+dy*width);
   const gripEnd=point(hand[0],hand[1]-dy*.20,hand[2]-dz*.20),gripTop=weaponPoint(0);
   api.segment(gripEnd,gripTop,.043,.041,[.29,.19,.11],8,13);
   api.segment(weaponPoint(0,-.14),weaponPoint(0,.16),.030,.025,[.86,.68,.28],8,13);
   if(pose.weapon==='spear'){
    api.segment(gripEnd,weaponPoint(1.15),.025,.020,[.43,.29,.15],8,13);
    api.prism([weaponPoint(1.02,-.07),weaponPoint(1.48,0),weaponPoint(1.02,.07)].map(v=>v),.035,[.87,.92,.92]);
   }else{
    const outline=[[0,-.055],[length*.74,-.055],[length,0],[length*.92,.15],[length*.54,.23],[0,.11]];
    api.prism(outline.map(([d,w])=>weaponPoint(d,w)),.045,[.74,.84,.87]);
    api.prism([[0,-.055],[length*.74,-.055],[length,0],[length*.84,.025],[0,-.02]].map(([d,w])=>weaponPoint(d,w)),.051,[.97,.98,.91]);
   }
   api.ellipsoid(...gripEnd,.053,.053,.053,[.84,.67,.29],yaw,8,4);
  }
  limb([0,1.19,0],[0,1.35,0],.075,.080,a.skin);
  oval(0,1.51,.01,.20,.24,.173,a.skin,12,8);for(const side of [-1,1])oval(side*.198,1.50,.01,.039,.071,.052,a.skin);
  // Curved rear hair and crown leave the face visible from the front.
  oval(0,1.53,-.112,.203,.225,.087,a.hair,10,6);oval(0,1.70,-.026,.203,.065,.16,a.hair,10,4);
  for(const side of [-1,1]){oval(side*.095,1.553,.167,.045,.027,.021,[.92,.90,.80]);oval(side*.095,1.552,.188,.018,.020,.012,[.09,.09,.07]);limb([side*.062,1.594,.162],[side*.128,1.593,.150],.014,.014,a.hair);oval(side*.113,1.469,.155,.039,.024,.012,a.skin.map((v,i)=>i===0?Math.min(1,v+.055):v-.02));}
  oval(0,1.50,.190,.033,.053,.039,a.skin);oval(0,1.428,.173,.053,.012,.012,[.49,.26,.21]);
  if(a.beard){oval(0,1.413,.168,.091,.027,.026,a.hair);oval(0,name==='關羽'?1.25:1.355,.13,name==='關羽'?.108:.126,name==='關羽'?.21:.078,.064,a.hair,8,6)}
  if(a.female){for(const side of [-1,1])oval(side*.214,1.62,-.064,.082,.10,.085,a.hair);oval(0,1.21,-.15,.155,.22,.06,a.coat)}
  if(/黃巾/.test(name))flat(0,1.665,.045,.44,.10,.35,[.94,.79,.19],13);
  if(a.hat&&!/黃巾/.test(name)){oval(0,1.77,-.02,.225,a.hat===3?.135:.074,.19,a.hat===1?a.trim:a.coat,10,4);if(a.hat===2)oval(0,1.728,.06,.274,.023,.22,a.trim,10,4);oval(0,1.78,.167,.03,.027,.015,a.trim)}
  if(a.modern){oval(0,1.23,-.145,.21,.15,.10,a.coat);flat(0,.97,.176,.24,.16,.022,[.83,.94,.87]);limb([-.07,1.15,.18],[-.07,1.00,.19],.009,.009,[.94,.95,.88]);limb([.07,1.15,.18],[.07,1.00,.19],.009,.009,[.94,.95,.88]);flat(.43,.68,.10,.17,.24,.05,[.77,.68,.44]);}
  else if(!pose&&/羽|飛|雲|超|忠|延|平|贊|兵|將|軍|守|帥|宗師/.test(name)){
   const weapon=weaponFor(name);if(weapon==='bow')bow([.43,.86,.08]);else if(weapon==='spear'){limb([.50,.09,0],[.50,1.78,0],.024,.023,[.51,.37,.20]);flat(.50,1.88,0,.11,.30,.035,[.72,.80,.78],2)}else{limb([.46,.46,.08],[.46,.70,.08],.027,.025,[.42,.27,.13]);flat(.46,.74,.08,.24,.05,.05,[.79,.61,.27],13);flat(.46,1.05,.08,.075,.58,.035,[.74,.83,.85],13)}
  }
 }
 const animalCache=new Map();
 function animal(api,species,x,z,yaw=0,moving=false,t=0,detail=1){if(!api.mesh||!api.create)return sculptAnimal(api,species,x,z,yaw,moving,t);const phase=moving?Math.floor(((t*8)%(Math.PI*2))/(Math.PI*2)*12):-1,key=species+'|'+phase+'|'+detail;let data=animalCache.get(key);if(!data){const g=api.create();if(!detail){const oval=g.ellipsoid,tube=g.segment;g.ellipsoid=(x,y,z,rx,ry,rz,c,angle)=>oval(x,y,z,rx,ry,rz,c,angle,6,4);g.segment=(a,b,r1,r2,c,n,mat)=>tube(a,b,r1,r2,c,6,mat)}sculptAnimal(g,species,0,0,0,moving,phase<0?0:phase*Math.PI*2/96);data=g.data();if(animalCache.size>=96)animalCache.delete(animalCache.keys().next().value);animalCache.set(key,data)}api.mesh(data,x,z,yaw)}
 function animalBounds(species){return {height:species==='deer'?2.25:species==='baboon'?1.72:species==='lion'?1.56:species==='sheep'?1.40:species==='pig'?1.10:1.44,radius:1.2}}
 function sculptAnimal(api,species,x,z,yaw,moving,t){
  const colors={deer:[.60,.40,.23],sheep:[.86,.84,.73],pig:[.84,.57,.51],lion:[.77,.54,.27],tiger:[.89,.52,.19],leopard:[.78,.65,.32],baboon:[.39,.32,.25]},coat=colors[species]||colors.deer,dark=[.16,.12,.09],cream=[.86,.80,.63],ca=Math.cos(yaw),sa=Math.sin(yaw),point=(lx,y,lz)=>[x+lx*ca+lz*sa,y,z-lx*sa+lz*ca];
  const oval=(lx,y,lz,rx,ry,rz,c=coat,n=10,rings=6)=>api.ellipsoid(...point(lx,y,lz),rx,ry,rz,c,yaw,n,rings);
  const tube=(a,b,r1,r2,c=coat,n=8)=>api.segment(point(...a),point(...b),r1,r2,c,n,13);
  const swing=moving?Math.sin(t*8)*.13:0;
  if(species==='baboon'){
   oval(0,.80,0,.29,.38,.26);oval(0,.77,.19,.21,.26,.11,[.56,.44,.32]);oval(0,1.27,.27,.21,.25,.19,coat,12,8);
   oval(0,1.27,.415,.145,.17,.095,[.74,.48,.38]);oval(0,1.18,.53,.12,.10,.13,[.65,.38,.31]);oval(0,1.24,.63,.055,.032,.021,[.31,.19,.15]);
   for(const side of [-1,1]){oval(side*.22,1.31,.27,.055,.083,.05,[.70,.47,.37]);oval(side*.07,1.33,.49,.035,.025,.015,cream);oval(side*.07,1.33,.507,.016,.018,.012,dark);tube([side*.19,.70,-.14],[side*.21,.39,-.24+side*swing*.4],.11,.078);tube([side*.21,.39,-.24+side*swing*.4],[side*.24,.07,-.18+side*swing],.078,.05);oval(side*.24,.05,-.13+side*swing,.075,.05,.12,dark);tube([side*.25,1.03,.12],[side*.32,.58,.30],.105,.065);tube([side*.32,.58,.30],[side*.34,.08,.45-side*swing],.065,.045);oval(side*.34,.05,.45-side*swing,.072,.05,.09,[.61,.43,.31]);}
   tube([0,.84,-.22],[.09,1.02,-.62],.055,.04);tube([.09,1.02,-.62],[.16,.96,-1.02],.04,.02);oval(0,1.11,.63,.06,.012,.018,[.30,.15,.12]);return;
  }
  const deer=species==='deer',pig=species==='pig',sheep=species==='sheep',bodyY=deer?.83:pig?.48:sheep?.61:.59,rx=pig?.39:sheep?.34:.30,ry=pig?.30:sheep?.31:.27,rz=pig?.62:.61;
  oval(0,bodyY,0,rx,ry,rz);oval(0,bodyY-.17,.06,rx*.81,.11,rz*.78,species==='pig'?[.91,.69,.61]:cream);
  for(const side of [-1,1])for(const front of [-1,1]){const step=side*front*swing,hipY=bodyY-.05,kneeY=(bodyY-.12)*.5,hip=[side*rx*.69,hipY,front*.39],knee=[side*rx*.76,kneeY,front*.39+step*.45],foot=[side*rx*.82,.06,front*.40+step];tube(hip,knee,deer?.055:.086,deer?.039:.062);tube(knee,foot,deer?.039:.062,deer?.026:.043);oval(...foot,deer?.058:.087,.06,deer?.075:.115,deer||sheep?dark:coat,8,4)}
  let headY=deer?1.44:pig?.66:sheep?.95:.98,headZ=deer?.63:pig?.60:sheep?.62:.64;
  if(deer){tube([0,.92,.40],[0,1.30,.59],.15,.095);oval(0,1.20,.52,.13,.24,.13)}
  else oval(0,headY-.12,headZ-.19,.21,.23,.22);
  if(species==='lion'){oval(0,headY,.48,.37,.38,.22,[.46,.29,.13]);for(let i=0;i<8;i++){const angle=i*Math.PI/4;oval(Math.cos(angle)*.26,headY+Math.sin(angle)*.28,.47,.12,.16,.115,[.42+(i%3)*.04,.27,.13],8,4)}}
  if(sheep){for(let i=0;i<9;i++){const side=i%3-1,depth=Math.floor(i/3)-1;oval(side*.20,bodyY+.18,depth*.31,.225,.205,.26,[.94-(i%2)*.025,.92-(i%3)*.012,.81],8,4)}}
  const face= sheep?[.42,.39,.31]:coat;
  oval(0,headY,headZ,pig?.26:deer?.16:.22,pig?.22:deer?.21:.23,pig?.25:deer?.24:.23,face,12,8);
  const snoutZ=headZ+(pig?.26:deer?.20:.21);
  oval(0,headY-.055,snoutZ,pig?.177:deer?.10:.15,pig?.105:.092,pig?.073:.11,pig?[.92,.68,.62]:cream);
  if(pig){for(const side of [-1,1])oval(side*.058,headY-.05,snoutZ+.073,.025,.031,.012,[.50,.28,.23],8,4)}
  else oval(0,headY-.005,snoutZ+.10,deer?.042:.052,.034,.022,dark,8,4);
  for(const side of [-1,1]){
   const eyeX=side*(pig?.152:deer?.12:.143),eyeZ=headZ+(pig?.19:deer?.16:.173);
   oval(eyeX,headY+.075,eyeZ,.029,.028,.018,[.93,.89,.73],8,4);oval(eyeX,headY+.075,eyeZ+.018,.016,.020,.012,dark,8,4);
   oval(side*(pig?.225:deer?.17:.20),headY+.19,headZ-.035,pig?.09:deer?.065:.074,pig?.14:deer?.17:.095,pig?.045:deer?.055:.057,face,8,4);
   if(!pig)oval(side*.065,headY-.06,snoutZ+.05,.062,.057,.064,cream,8,4);
   if(deer){const a=[side*.13,1.61,.58],b=[side*.18,1.88,.54],c=[side*.23,2.14,.45];tube(a,b,.023,.018,[.51,.39,.23]);tube(b,c,.018,.01,[.51,.39,.23]);tube(b,[side*.39,2.06,.64],.014,.009,[.51,.39,.23]);tube([side*.20,1.98,.50],[side*.36,2.15,.37],.012,.007,[.51,.39,.23]);}
   if(sheep){const originX=side*.22;for(let i=0;i<5;i++){const a=i*.6,b=(i+1)*.6;const horn=ang=>[originX+side*Math.sin(ang)*.10,headY+.13+Math.cos(ang)*.115,headZ-.06+Math.sin(ang)*.055];tube(horn(a),horn(b),.030-i*.003,.027-i*.003,[.61,.53,.35],6)}}
   if(['lion','tiger','leopard'].includes(species))for(let i=0;i<2;i++)tube([side*.10,headY-.04,snoutZ+.06],[side*(.23+i*.015),headY-.045+i*.04,snoutZ+.10],.004,.003,cream,6);
  }
  oval(0,headY-.12,snoutZ+.082,.049,.008,.014,[.44,.25,.18],8,4);
  if(species==='tiger'){for(let i=0;i<5;i++){const dz=-.43+i*.21,reach=Math.sqrt(1-(dz/rz)**2);oval(0,bodyY+ry*reach+.005,dz,rx*reach*.86,.012,.036,dark,8,4);for(const side of [-1,1])oval(side*(rx*reach-.008),bodyY+.025,dz,.022,.135,.037,dark,8,4)}for(const side of [-1,1])oval(side*.15,headY+.12,headZ+.14,.045,.02,.024,dark,8,4);}
  if(species==='leopard'){for(const side of [-1,1])for(let i=0;i<12;i++){const dz=-.43+(i%4)*.28,dy=(Math.floor(i/4)-1)*.13,reach=Math.sqrt(Math.max(.02,1-(dz/rz)**2-(dy/ry)**2));oval(side*(rx*reach+.003),bodyY+dy,dz,.014,.03,.037,dark,6,4)}for(const side of [-1,1])for(let i=0;i<3;i++)oval(side*(.13+i*.017),headY+.07-i*.06,headZ+.14,.018,.019,.019,dark,6,4)}
  if(pig){for(let i=0;i<8;i++){const a=i*.7,b=(i+1)*.7,tail=ang=>[Math.cos(ang)*.066,bodyY+.06+Math.sin(ang)*.066,-.70];tube(tail(a),tail(b),.016,.015,coat,6)}}
  else if(deer||sheep){oval(0,bodyY+.06,-.65,.07,.07,.13,sheep?cream:coat,8,4)}
  else{const a=[0,bodyY+.06,-.55],b=[.10+swing*.2,bodyY+.07,-.88],c=[.22+swing*.3,bodyY+.30,-1.08];tube(a,b,.045,.030);tube(b,c,.030,.018);oval(...c,.052,.064,.067,species==='lion'?dark:coat,8,4)}
 }

 function portrait(name,dir='front'){const a=get(name),rgb=c=>'rgb('+c.map(v=>Math.round(v*255)).join(',')+')',side=dir==='left'||dir==='right',back=dir==='back';const mirror=dir==='left'?' transform="translate(160 0) scale(-1 1)"':'';return `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="190" viewBox="0 0 160 190"><rect width="160" height="190" fill="#d8d4bb"/><ellipse cx="80" cy="179" rx="34" ry="6" fill="#667c6455"/><g${mirror}><path d="M50 100 L110 100 L118 165 L42 165Z" fill="${rgb(a.coat)}"/><rect x="48" y="124" width="64" height="8" fill="${rgb(a.trim)}"/><rect x="56" y="162" width="17" height="22" fill="#343d37"/><rect x="87" y="162" width="17" height="22" fill="#343d37"/><rect x="${side?65:56}" y="48" width="${side?34:48}" height="52" rx="12" fill="${back?rgb(a.hair):rgb(a.skin)}"/><path d="M54 59Q80 21 107 59Z" fill="${rgb(a.hair)}"/>${back?'':`<circle cx="${side?89:67}" cy="70" r="3"/><circle cx="91" cy="70" r="3"/>`}${a.beard&&!back?'<path d="M65 86L94 86L80 115Z" fill="'+rgb(a.hair)+'"/>':''}${a.hat?'<rect x="52" y="42" width="56" height="13" fill="'+rgb(a.trim)+'"/>':''}</g><text x="80" y="18" text-anchor="middle" font-size="13" fill="#273e32">${name}</text></svg>`}
 function companions(w,s,p){const yaw=p.yaw??({down:0,up:Math.PI,left:-Math.PI/2,right:Math.PI/2}[p.dir]||0),used=new Set();return s.active.map((name,i)=>{let x=p.x-Math.sin(yaw)*(i+1)*.75+(i%2?-.4:.4),y=p.y-Math.cos(yaw)*(i+1)*.75;const open=(xx,yy)=>xx>=1&&yy>=1&&xx<w.width-1&&yy<w.height-1&&!w.blocked[Math.round(yy)*w.width+Math.round(xx)]&&!used.has(Math.round(xx)+','+Math.round(yy));if(!open(x,y)){const candidates=[];for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const xx=Math.round(p.x)+dx,yy=Math.round(p.y)+dy;if(open(xx,yy))candidates.push({x:xx,y:yy,d:Math.hypot(xx-x,yy-y)})}const closest=candidates.sort((a,b)=>a.d-b.d)[0];if(closest){x=closest.x;y=closest.y}else{x=p.x;y=p.y}}used.add(Math.round(x)+','+Math.round(y));return {name,x,y,yaw}})}
 return {get,person,animal,animalBounds,portrait,companions,weaponFor};
})();
