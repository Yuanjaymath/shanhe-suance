/* Original curved tree models and continuous walkable wooden decks. */
var TerrainModels=(()=>{
 const labels=['客舍','糧行','武器館','ㄚ杰課後班','行商鋪','糧棧','醫館','驛站','望樓',null,'返回街道']; // Slot 13 stays plain for curved actors.
 function bridge(g,x,y){
  // Boards lie flat. No vertical fences are placed across the walking route.
  g.box(x+.5,.025,y+.5,1,.16,1,[.46,.32,.18],0,3);
  for(let i=0;i<4;i++){const grain=.025*(i%2);g.box(x+.125+i*.25,.115,y+.5,.246,.025,1,[.58+grain,.42+grain,.25],0,3)}
 }
 function tree(g,p,spring){const x=p.x+.5,z=p.y+.5,k=((p.x*73+p.y*29+p.variant*19)%97)/97,height=3.5+k*.8,spread=p.forest?.90:1.08,leaf=p.snow?[.80,.83,.80]:spring&&p.variant===0?[.83,.48,.60]:p.variant===1?[.19,.36,.22]:[.24,.43,.23];
  g.segment([x,0,z],[x+.09,height*.70,z-.07],.15,.075,[.40,.29,.17],8,3);
  const branches=[[-.64,.14],[.61,.24],[.05,-.62]];
  branches.forEach(([dx,dz],i)=>g.segment([x,height*.39+i*.13,z],[x+dx*.8,height*.73+i*.06,z+dz*.8],.075,.025,[.44,.32,.19],6,3));
  const lobes=[[-.58,.70,.05,.75],[.57,.72,.18,.77],[.02,.79,-.52,.80],[.04,.90,.11,.86],[-.22,.74,.61,.67]];
  for(let i=0;i<lobes.length;i++){const [dx,dy,dz,r]=lobes[i],c=leaf.map((v,j)=>Math.min(1,v+(i%3-1)*.035+(j===1?k*.035:0)));g.ellipsoid(x+dx*spread,dy*height,z+dz*spread,r*spread,(p.variant===1?.85:.63)*r,r*spread,c,k*1.7,10,5,13)}
 }

 function exitGeometry(w){const exit=w.entities.find(e=>e.type==='room-exit');return {x:(exit?.x??w.width/2)+.5,z:w.height-1-.08,width:2.4,height:2.65,labelY:2.4}}
 function interiorShell(g,w){
  const left=2,right=w.width-2,back=2,front=w.height-1,cx=(left+right)/2,cz=(back+front)/2,width=right-left,depth=front-back,door=exitGeometry(w),doorLeft=door.x-door.width/2,doorRight=door.x+door.width/2;
  const plaster=w.info.style==='classroom'?[.79,.80,.66]:w.info.style==='clinic'?[.79,.80,.72]:[.80,.73,.59],wood=[.43,.29,.16],trim=[.58,.40,.22],bronze=[.86,.67,.29];
  // Four solid walls, split around the doorway. Geometry stays on blocked borders.
  g.box(left-.5,1.8,cz,1,3.6,depth+2,plaster);
  g.box(right+.5,1.8,cz,1,3.6,depth+2,plaster);
  g.box(cx,1.8,back-.5,width,3.6,1,plaster);
  g.box((left+doorLeft)/2,1.8,front+.5,doorLeft-left,3.6,1,plaster);
  g.box((doorRight+right)/2,1.8,front+.5,right-doorRight,3.6,1,plaster);
  g.box(door.x,(3.6+door.height)/2,front+.5,door.width,3.6-door.height,1,plaster);
  // The ceiling's underside is rendered too, so looking up never reveals the sky.
  g.box(cx,3.6,cz,width+.1,.24,depth+.1,[.70,.56,.37],0,3);
  g.roof(cx,3.74,cz,width+1,depth+1,1.6,[.24,.34,.29]);
  for(const z of [back+1.5,cz,front-1.5]){
   g.box(cx,3.24,z,width,.22,.24,wood,0,3);
   for(const x of [left,right])g.box(x,1.6,z,.12,3.2,.24,trim,0,3);
  }
  for(const x of [left+3.2,cx,right-3.2])g.box(x,3.43,cz,.14,.16,depth,trim,0,3);
  // Low wood panels and window lattices distinguish the wall from empty space.
  for(const x of [left,right])g.box(x,.23,cz,.045,.46,depth,trim,0,3);
  g.box(cx,.23,back,.045+width,.46,.045,trim,0,3);
  for(const x of [left+.015,right-.015])for(const z of [back+3.4,front-3.4]){
   g.box(x,1.78,z,.03,1.12,1.5,[.72,.82,.75],0,13);
   for(const y of [1.16,1.78,2.40])g.box(x,y,z,.05,.09,1.7,wood,0,3);
   for(const offset of [-.8,-.4,0,.4,.8])g.box(x,1.78,z+offset,.05,1.3,.075,wood,0,3);
  }
  // A real, closed double door is opened by the existing E / tap interaction.
  for(const x of [doorLeft-.08,doorRight+.08])g.box(x,door.height/2,door.z,.22,door.height+.12,.25,wood,0,3);
  g.box(door.x,door.height+.04,door.z,door.width+.4,.22,.28,wood,0,3);
  g.box(door.x,.025,door.z-.12,door.width+.24,.08,.46,trim,0,3);
  for(const side of [-1,1]){
   const x=door.x+side*door.width/4,leafWidth=door.width/2-.025;
   g.box(x,1.29,door.z,leafWidth,2.56,.12,[.59,.39,.21],0,3);
   for(const offset of [-.4,-.2,0,.2,.4])g.box(x+offset,1.29,door.z-.066,.013,2.42,.014,wood,0,13);
   for(const y of [.28,1.18,2.28])g.box(x,y,door.z-.085,leafWidth-.07,.095,.065,trim,0,3);
   for(const y of [.45,2.12])g.box(x+side*.47,y,door.z-.09,.13,.10,.05,bronze,0,13);
   const handleX=door.x+side*.17;
   g.box(handleX,1.27,door.z-.095,.10,.18,.045,bronze,0,13);
   g.segment([handleX,1.19,door.z-.155],[handleX,1.32,door.z-.155],.025,.025,bronze,8,13);
  }
  g.box(door.x,1.29,door.z-.01,.035,2.56,.11,wood,0,3);
  g.box(door.x,door.labelY,door.z-.19,1.94,.46,.10,wood,0,3);
  const plaque=g.create();plaque.sign(0,door.labelY,0,1.82,.35,14);g.mesh(plaque.data(),door.x,door.z-.245,Math.PI);
 }


 // Stable noise keeps scenery identical when revisiting a chapter.
 function noise(x,y,k=0){let v=(Math.imul(Math.floor(x)+1,73856093)^Math.imul(Math.floor(y)+1,19349663)^Math.imul(k+1,83492791))>>>0;v=Math.imul(v^(v>>>16),2246822519)>>>0;v=Math.imul(v^(v>>>13),3266489917)>>>0;return ((v^(v>>>16))>>>0)/4294967295}
 const unit=v=>{const n=Math.hypot(...v)||1;return v.map(a=>a/n)};
 function ground(g,w){
  const paint=w.palette?.grass||[.34,.46,.29];
  for(let y=0;y<w.height;y++)for(let x=0;x<w.width;x++){
   const type=w.tiles[y*w.width+x];if(type===2||type===3||LandscapeView.mouth(w,x,y))continue;
   const point=(xx,zz)=>[xx,LandscapeView.edgeHeight(w,xx,zz)-.035,zz],normal=(xx,zz)=>unit([World.elevation(w,xx-.1,zz)-World.elevation(w,xx+.1,zz),.2,World.elevation(w,xx,zz-.1)-World.elevation(w,xx,zz+.1)]);
   const a=point(x,y),b=point(x,y+1),c=point(x+1,y),d=point(x+1,y+1),shade=.94+noise(x,y,11)*.10;
   const color=(type===6&&World.elevation(w,x,y)>4?(w.landscape.winter?[.76,.77,.76]:[.47,.48,.40]):paint).map(v=>v*shade),na=normal(x,y),nb=normal(x,y+1),nc=normal(x+1,y),nd=normal(x+1,y+1);
   g.triangle([a,b,c],[0,1,0],color,0,undefined,[na,nb,nc]);g.triangle([c,b,d],[0,1,0],color,0,undefined,[nc,nb,nd]);
  }
 }
 function face(g,pts,c,mat=13){const a=pts[1].map((v,i)=>v-pts[0][i]),b=pts[2].map((v,i)=>v-pts[0][i]),n=unit([a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]);g.triangle(pts,n,c,mat);g.triangle([pts[2],pts[1],pts[0]],n.map(v=>-v),c,mat)}
 function groundcover(g,w,cx,cy,radius=10){
  if(w.interior)return;
  for(let y=Math.max(1,cy-radius);y<Math.min(w.height-1,cy+radius);y++)for(let x=Math.max(1,cx-radius);x<Math.min(w.width-1,cx+radius);x++){
   if(w.tiles[y*w.width+x]!==0||w.blocked[y*w.width+x]||Math.hypot(x-cx,y-cy)>radius)continue;
   const count=noise(x,y,2)>.26?2:1;
   for(let clump=0;clump<count;clump++){
    const px=x+.25+noise(x,y,3+clump)*.48,pz=y+.25+noise(x,y,5+clump)*.48,groundY=World.elevation(w,px,pz);
    for(let blade=0;blade<4;blade++){
     const k=clump*19+blade*5,angle=noise(x,y,k+8)*Math.PI*2,rx=Math.cos(angle),rz=Math.sin(angle),h=.16+noise(x,y,k+9)*.27,width=.026+noise(x,y,k+10)*.016,bend=.05+noise(x,y,k+11)*.06;
     const base=[px+rx*.025,groundY+.012,pz+rz*.025],middle=[base[0]+rz*bend*.45,groundY+h*.54,base[2]-rx*bend*.45],tip=[base[0]+rz*bend,groundY+h,base[2]-rx*bend];
     const left=[base[0]-rx*width,base[1],base[2]-rz*width],right=[base[0]+rx*width,base[1],base[2]+rz*width];
     const mleft=[middle[0]-rx*width*.63,middle[1],middle[2]-rz*width*.63],mright=[middle[0]+rx*width*.63,middle[1],middle[2]+rz*width*.63];
     const shade=noise(x,y,k+12),green=[.28+shade*.10,.49+shade*.13,.15+shade*.09];
     face(g,[left,right,mleft],green);face(g,[right,mright,mleft],green);face(g,[mleft,mright,tip],green.map((v,i)=>v+(i===1?.055:.025)));
    }
   }
  }
 }
 function road(g,w,x,y){
  const k=noise(x,y,1),cx=x+.5,cz=y+.5,c=(w.palette?.road||[.68,.56,.36]).map(v=>v+k*.045);
  const lift=pts=>pts.map(p=>[p[0],p[1]+World.elevation(w,p[0],p[2]),p[2]]);
  face(g,lift([[x,.018,y],[x,.018,y+1],[x+1,.018,y]]),c,1);face(g,lift([[x+1,.018,y],[x,.018,y+1],[x+1,.018,y+1]]),c,1);
  const route=(xx,yy)=>[1,3].includes(w.tiles[yy*w.width+xx]),vertical=Number(route(x,y-1))+Number(route(x,y+1)),horizontal=Number(route(x-1,y))+Number(route(x+1,y));
  if(vertical===2&&horizontal===2)return;
  const turn=vertical>horizontal,offset=(k-.5)*.045,dark=c.map(v=>v*.87),light=c.map(v=>Math.min(1,v*1.03));
  for(const side of [-1,1]){
   const t=side*.25+offset,a=turn?[cx+t-.024,.023,y]:[x,.023,cz+t-.024],b=turn?[cx+t+.024,.023,y]:[x,.023,cz+t+.024],d=turn?[cx+t-.021,.023,y+1]:[x+1,.023,cz+t-.021],e=turn?[cx+t+.021,.023,y+1]:[x+1,.023,cz+t+.021];
   face(g,lift([a,d,b]),dark,1);face(g,lift([b,d,e]),dark,1);
   if(noise(x,y,side+7)>.5){const px=cx+(turn?side*.43:offset),pz=cz+(turn?offset:side*.43);face(g,lift([[px-.10,.024,pz-.08],[px+.13,.024,pz-.05],[px+.03,.025,pz+.13]]),light,1)}
  }
 }
 function rock(g,p){
  const x=p.x+.5,z=p.y+.5,seed=noise(p.x,p.y,17),rx=.28+seed*.26,rz=.24+noise(p.x,p.y,18)*.25,ry=.14+noise(p.x,p.y,19)*.14,cy=ry*.69,angle=seed*6.28,ca=Math.cos(angle),sa=Math.sin(angle),segments=14,rings=7;
  const point=(row,col)=>{const phi=row*Math.PI/rings,theta=col*2*Math.PI/segments,sp=Math.sin(phi),v=[sp*Math.cos(theta),Math.cos(phi),sp*Math.sin(theta)],warp=1+.14*Math.sin(theta*3+seed*9)+.06*Math.cos(theta*5+phi*3),px=v[0]*rx*warp,pz=v[2]*rz*warp,py=cy+v[1]*ry*(.94+.06*Math.sin(phi*3+seed*9))+sp*.022*Math.sin(theta*3+seed*8),n=unit([v[0]/rx,v[1]/ry,v[2]/rz]);
   return {p:[x+px*ca+pz*sa,py,z-px*sa+pz*ca],n:[n[0]*ca+n[2]*sa,n[1],-n[0]*sa+n[2]*ca]}}
  const warm=noise(p.x,p.y,20),gray=[.52+warm*.11,.53+warm*.08,.48+warm*.10];
  for(let row=0;row<rings;row++)for(let col=0;col<segments;col++){
   const a=point(row,col),b=point(row+1,col),d=point(row,col+1),e=point(row+1,col+1),moss=seed>.68&&row<3&&col<5,c=moss?[.38,.45,.28]:gray;
   if(row>0)g.triangle([a.p,d.p,b.p],a.n,c,15,undefined,[a.n,d.n,b.n]);
   if(row<rings-1)g.triangle([d.p,e.p,b.p],d.n,c,15,undefined,[d.n,e.n,b.n]);
  }
 }
 function material(ctx,left,type){
  ctx.save();ctx.beginPath();ctx.rect(left,0,128,128);ctx.clip();ctx.fillStyle=type===1?'#eee8dd':'#fff';ctx.fillRect(left,0,128,128);
  const count=type===1?1900:type===15?1100:800;
  for(let i=0;i<count;i++){const k=noise(type,i,4),x=left+noise(type,i,5)*128,y=noise(type,i,6)*128,shade=Math.floor((type===1?183:211)+k*(type===1?65:42));ctx.fillStyle='rgb('+shade+','+shade+','+(type===1?shade-8:shade)+')';const size=type===15?1.1+k*1.6:.5+k*.9;ctx.fillRect(x,y,size,size)}
  if(type===1){ctx.strokeStyle='#b5a89155';ctx.lineWidth=.55;for(let i=0;i<35;i++){const x=left+noise(type,i,9)*128,y=noise(type,i,10)*128;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+4,y-2,x+10,y-1);ctx.stroke()}}
  if(type===15){ctx.strokeStyle='#9a9a9340';ctx.lineWidth=.8;for(let i=0;i<8;i++){const x=left+noise(type,i,12)*128,y=noise(type,i,13)*128;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+8,y+3);ctx.lineTo(x+13,y-3);ctx.stroke()}}
  ctx.restore();
 }
 function landmark(g,p,w){
  const x=p.x+.5,z=p.y+.5,wood=[.43,.29,.17],stone=[.48,.49,.43],roof=[.19,.29,.26],cloth=p.chapter===2?[.86,.72,.22]:p.chapter===9?[.30,.33,.43]:[.67,.28,.21];
  if(p.type==='warship'){
   g.ellipsoid(x,.05,z,1.25,.42,3.1,wood,0,10,4,3);g.box(x,.32,z,2.35,.16,5.1,[.65,.47,.27],0,3);
   for(const side of [-1,1]){g.box(x+side*1.1,.64,z,.12,.6,4.6,wood,0,3);for(let i=0;i<4;i++)g.segment([x+side*1.05,.35,z-1.8+i*1.2],[x+side*2.3,.05,z-1.8+i*1.2],.035,.018,wood,6,3)}
   g.box(x,.85,z+1.5,1.45,.95,1.3,[.54,.38,.23],0,3);g.roof(x,1.33,z+1.5,1.8,1.55,.45,roof);
   g.box(x,2.75,z-.6,.13,4.6,.13,wood,0,3);g.box(x,3.1,z-.6,2.1,.12,.13,wood,0,3);
   const sail=[.83,.76,.58];face(g,[[x-1,1.7,z-.65],[x+1,1.7,z-.65],[x+1,4.3,z-.55]],sail,3);face(g,[[x-1,1.7,z-.65],[x+1,4.3,z-.55],[x-1,4.3,z-.55]],sail,3);
   for(const y of [2,2.5,3,3.5,4])g.box(x,y,z-.53,2.05,.032,.028,[.47,.37,.23],0,3);
   g.box(x+.43,4.7,z-.6,.85,.46,.025,cloth,0,13);return true;
  }
  if(p.type==='watchtower'){g.box(x,.25,z,2.4,.5,2.4,stone,0,15);for(const dx of [-.85,.85])for(const dz of [-.85,.85])g.box(x+dx,2.25,z+dz,.18,4.2,.18,wood,0,3);g.box(x,3.65,z,2.6,.18,2.6,wood,0,3);g.roof(x,4.35,z,3.1,3.1,1.2,roof);for(const side of [-1,1])g.box(x,4.02,z+side*1.17,2.6,.5,.12,wood,0,3);return true}
  if(p.type==='palisade'){for(let i=-2;i<=2;i++){g.segment([x+i*.6,0,z],[x+i*.6,2.35,z],.13,.08,wood,7,3);g.cone(x+i*.6,2.35,z,.09,.25,wood,6)}for(const y of [.75,1.6])g.box(x,y,z,3.2,.11,.13,wood,0,3);return true}
  if(p.type==='pavilion'||p.type==='altar'){g.box(x,.25,z,3.8,.5,3.8,stone,0,15);for(const dx of [-1.5,1.5])for(const dz of [-1.5,1.5])g.box(x+dx,1.75,z+dz,.18,3,.18,wood,0,3);g.roof(x,3.3,z,4.6,4.6,1.6,roof);if(p.type==='altar'){g.box(x,.7,z,1.5,.6,.8,wood,0,3);g.cone(x,1.03,z,.20,.30,[.77,.61,.32],8)}return true}
  if(p.type==='banner'||p.type==='beacon'){g.box(x,2.15,z,.15,4.3,.15,wood,0,3);g.box(x+.6,3.9,z,1.25,.85,.04,cloth,0,13);if(p.type==='beacon'){g.box(x,.3,z,2,.6,2,stone,0,15);for(let i=0;i<4;i++)g.segment([x-.6,.65,z-.5+i*.3],[x+.6,.65,z+.5-i*.3],.07,.05,wood,6,3);g.cone(x,.7,z,.35,.9,[.97,.43,.13],7)}return true}
  if(p.type==='dock'){for(let i=-2;i<=2;i++)g.box(x+i*.3,.10,z,.29,.16,3.9,[.58,.41,.23],0,3);for(const dx of [-.7,.7])for(const dz of [-1.7,1.7])g.box(x+dx,.42,z+dz,.13,1.4,.13,wood,0,3);return true}
  if(p.type==='cart'){g.box(x,.75,z,1.5,.2,2,wood,0,3);for(const dx of [-.88,.88])g.ellipsoid(x+dx,.48,z,.12,.5,.5,[.30,.22,.13],0,10,4,3);g.box(x,1.2,z,1.25,.7,1.6,[.78,.69,.46],0,3);for(const dx of [-.5,.5])g.segment([x+dx,.65,z+1],[x+dx,.55,z+2.1],.035,.035,wood,6,3);return true}
  if(p.type==='quarry'){for(let i=0;i<5;i++)g.box(x-1.3+(i%3)*.85,.35+Math.floor(i/3)*.7,z+Math.floor(i/3)*.6,.78,.65,.55,stone,0,15);g.box(x,1.7,z-1.2,2.9,.3,.4,wood,0,3);for(const dx of [-1.2,1.2])g.box(x+dx,.85,z-1.2,.3,1.7,.4,wood,0,3);return true}
  if(p.type==='sacks'){for(let i=0;i<6;i++)g.ellipsoid(x-.7+(i%3)*.7,.35+Math.floor(i/3)*.6,z+Math.floor(i/3)*.2,.38,.36,.28,[.72,.62,.40],0,8,4,3);return true}
  if(p.type==='well'){g.box(x,.45,z,1.4,.9,1.4,stone,0,15);g.box(x,.92,z,.95,.03,.95,[.13,.24,.24]);for(const dx of [-.65,.65])g.box(x+dx,1.2,z,.13,2.4,.13,wood,0,3);g.roof(x,2.4,z,2,2,.6,roof);return true}
  if(p.type==='orchard'){for(const dx of [-.8,.8])tree(g,{x:p.x+dx,y:p.y,variant:0},true);return true}
  if(p.type==='bamboo'){for(let i=0;i<9;i++){const xx=x-1+(i%3)*.7,zz=z-1+Math.floor(i/3)*.7;g.segment([xx,0,zz],[xx+.12,3.5,zz],.045,.025,[.32,.48,.24],6,3);for(let k=0;k<3;k++)g.ellipsoid(xx+(k%2?.25:-.25),2.1+k*.45,zz,.52,.11,.16,[.28,.43,.22],k*.9,6,3)}return true}
  if(p.type==='field'){g.box(x,.018,z,2.8,.05,2.8,[.35,.31,.18],0,1);for(let i=-2;i<=2;i++)for(let k=-2;k<=2;k++)g.segment([x+i*.45,.05,z+k*.45],[x+i*.45,.40,z+k*.45],.035,.012,[.62,.65,.23],5,13);return true}
  return false;
 }
 return {labels,bridge,tree,interiorShell,exitGeometry,groundcover,ground,road,rock,material,landmark};

})();
