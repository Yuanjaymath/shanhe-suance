var World=(()=>{
 function create(chapter){
  const ch=Story.chapters[chapter],land=ch.world?.landscape||{};
  const width=96,height=64,tiles=new Uint8Array(width*height),blocked=new Uint8Array(width*height),props=[],entities=[];let seed=chapter*9329+127;
  const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  const put=(x,y,t,b=0)=>{if(x>=0&&x<width&&y>=0&&y<height){tiles[y*width+x]=t;blocked[y*width+x]=b}};
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){put(x,y,0);if(x===0||y===0||x===width-1||y===height-1)put(x,y,4,1)}
  // River is a genuine barrier; three bridges connect the regions.
  const river=land.riverX??42+(chapter%3)*4,riverWidth=land.riverWidth||4;
  const riverLeft=y=>river+Math.round(Math.sin((y+chapter*7)/13)*(land.riverMeander||0));
  const inRiver=(x,y)=>x>=riverLeft(y)&&x<riverLeft(y)+riverWidth;
  for(let y=1;y<height-1;y++)for(let x=riverLeft(y);x<riverLeft(y)+riverWidth;x++)put(x,y,2,1);
  const roads=[[10,34,31,34],[31,18,31,51],[31,18,82,18],[31,34,82,34],[18,51,82,51],[18,34,18,51],[82,12,82,51],[60,18,60,51]];
  for(const [x1,y1,x2,y2] of roads){for(let y=Math.min(y1,y2);y<=Math.max(y1,y2);y++)for(let x=Math.min(x1,x2);x<=Math.max(x1,x2);x++)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)put(x+dx,y+dy,inRiver(x+dx,y+dy)?3:1)}
  // Walled town in the western region. Open gates face the through roads.
  for(let x=5;x<=26;x++)for(const y of [24,43])if(Math.abs(x-18)>2)put(x,y,4,1);
  for(let y=24;y<=43;y++)for(const x of [5,26])if(Math.abs(y-34)>2)put(x,y,4,1);
  const buildings=[[8,26,5,4,'客舍'],[17,26,6,4,'糧行'],[8,37,5,3,'武器館'],[18,37,5,3,'ㄚ杰課後班'],[8,45,5,4,'行商鋪'],[20,19,5,3,'糧棧'],[20,45,5,4,'醫館'],[66,22,6,4,'驛站'],[74,40,6,4,'望樓']];
  for(const [x,y,w,h,label] of buildings){props.push({type:'house',x,y,w,h,label});for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)put(xx,yy,5,1)}
  const add=(id,type,name,x,y,extra={})=>entities.push({id,type,name,x,y,...extra});
  add('camp','camp','義軍營地',10,34);add('shop','shop','行商鋪掌櫃',10,50);add('elder','clue',ch.clues[0].name,24,34,{clue:0});
  add('sage','clue',ch.clues[1].name,31,18,{clue:1});add('recruit','recruit',ch.recruit,60,34);
  add('puzzle','puzzle',ch.puzzle.name,60,18);add('boss','boss',ch.boss,82,18);add('exit','exit',chapter===17?'天下巡遊':'下一章',82,12);
  if(chapter===17)add('lvbu-trial','boss','呂布',82,44,{battleTier:'legendary',optional:true,requiresMainBoss:true});
  if(chapter>0)add('previous-exit','previous-exit','上一章',8,34);
  add('side','side','驛站旅人',31,51);add('cargo','cargo','失落物資',18,51);add('poet','poet','說書人',74,51);
  add('scribe','scribe','遊學先生',31,10);add('captain','captain','巡防隊長',74,34);
  add('armory','armory','武器館掌櫃',10,41);add('clinic','clinic','醫館郎中',22,50);
  add('granary','granary','糧行掌櫃',20,31);add('academy','academy','ㄚ杰',20,41);add('granary-store','granary','糧棧管事',22,23);
  const forests=[[36,9],[68,9],[87,43],[10,55],[36,43],[69,56]];
  forests.forEach(([x,y],i)=>add('forestEnemy'+i,'enemy','林間伏兵',x,y,{hidden:true}));
  [['deer','鹿',35,12],['sheep','羊',14,48],['pig','豬',28,46],['lion','獅子',70,10],['tiger','老虎',87,46],['leopard','豹',68,55],['baboon','狒狒',36,45]].forEach(([species,name,x,y])=>add('animal-'+species,'animal',name,x,y,{species,fierce:['lion','tiger','leopard','baboon'].includes(species)}));
  for(let y=10;y<18;y++)for(let x=30;x<33;x++)put(x,y,1);
  [[37,34],[55,18],[70,18],[82,28],[60,44],[46,51],[72,34],[35,51]].forEach(([x,y],i)=>add('enemy'+i,'enemy',['巡邏步卒','山道槍兵','守營刀兵'][i%3],x,y));
  [[36,8,31,18],[68,8,60,18],[89,42,82,51],[8,53,18,51]].forEach(([x,y,ax,ay],i)=>{add('chest'+i,'chest','隱藏寶箱',x,y);for(let xx=Math.min(x,ax);xx<=Math.max(x,ax);xx++)put(xx,y,1);for(let yy=Math.min(y,ay);yy<=Math.max(y,ay);yy++)put(ax,yy,1)});
  // Decorative trees never occupy roads or entity clearings.
  for(let i=0;i<550;i++){const x=2+Math.floor(rand()*92),y=2+Math.floor(rand()*60);if(tiles[y*width+x]!==0||entities.some(e=>Math.abs(e.x-x)<3&&Math.abs(e.y-y)<3))continue;if(rand()<.72*(land.treeDensity??1)){props.push({type:'tree',x,y,variant:Math.floor(rand()*3)})}else if(rand()<.30)props.push({type:'rock',x,y})}
  // Place shoreline encounters on dry land, never on isolated islands in the river.
  for(const e of entities){if(tiles[e.y*width+e.x]===2){let found=null;for(let r=1;r<width&&!found;r++)for(const dx of [-r,r]){const x=e.x+dx;if(x>2&&x<width-3&&!blocked[e.y*width+x]&&!inRiver(x-2,e.y)&&!inRiver(x+2,e.y)){found=x;break}}if(found!==null)e.x=found}
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(e.x+dx>0&&e.x+dx<95&&e.y+dy>0&&e.y+dy<63)put(e.x+dx,e.y+dy,inRiver(e.x+dx,e.y+dy)?3:1)}
  // Dense canopies conceal patrols visually; their ground remains walkable.
  for(const [cx,cy] of forests.slice(0,land.forestCount??6))for(let dy=-4;dy<=4;dy++)for(let dx=-5;dx<=5;dx++){const x=cx+dx,y=cy+dy;if(dx*dx/25+dy*dy/16>1||blocked[y*width+x]||rand()>.8)continue;if(!props.some(p=>p.type==='tree'&&p.x===x&&p.y===y))props.push({type:'tree',x,y,variant:Math.floor(rand()*3),forest:true})}
  // Distinct terrain motifs, kept clear of the traversable road network.
  const themes=['orchard','orchard','camp','mountain','camp','town','mountain','orchard','river','river','town','mountain','town','mountain','river','mountain','town','orchard'];
  const theme=ch.world?.theme||themes[chapter];
  for(let i=0;i<(land.name?0:20);i++){const x=3+Math.floor(rand()*88),y=3+Math.floor(rand()*55);if(tiles[y*width+x]===0&&!entities.some(e=>Math.abs(e.x-x)<5&&Math.abs(e.y-y)<4)&&!props.some(p=>Math.abs(p.x-x)<3&&Math.abs(p.y-y)<3))props.push({type:theme==='mountain'?'mountain':theme==='camp'?'tent':theme==='town'?'field':'shrine',x,y})}
  if(!land.name&&theme==='river')for(const y of [7,25,42,56])props.push({type:'boat',x:river+1,y});
  // Reflect the regional road plan to vary approach directions while preserving connectivity.
  const flipX=ch.world?.flipX??chapter%4>=2,flipY=ch.world?.flipY??(chapter%4===1||chapter%4===3);
  let finalTiles=tiles,finalBlocked=blocked;
  if(flipX||flipY){finalTiles=new Uint8Array(tiles.length);finalBlocked=new Uint8Array(blocked.length);for(let y=0;y<height;y++)for(let x=0;x<width;x++){const nx=flipX?width-1-x:x,ny=flipY?height-1-y:y;finalTiles[ny*width+nx]=tiles[y*width+x];finalBlocked[ny*width+nx]=blocked[y*width+x]}for(const e of entities){if(flipX)e.x=width-1-e.x;if(flipY)e.y=height-1-e.y}for(const p of props){if(flipX)p.x=width-1-p.x-((p.w||1)-1);if(flipY)p.y=height-1-p.y-((p.h||1)-1)}}
  // Door markers replace outdoor shopkeepers; doors always face the visible front.
  const doors=[['shop','行商鋪','shop'],['armory','武器館','armory'],['academy','ㄚ杰課後班','academy'],['clinic','醫館','clinic'],['granary','糧行','granary'],['granary-store','糧棧','granary'],['inn','客舍','innkeeper'],['station','驛站','innkeeper'],['tower','望樓','guide']];
  for(const [id,label,type] of doors){const house=props.find(p=>p.type==='house'&&p.label===label);const x=house.x+Math.floor(house.w/2),y=house.y+house.h;let e=entities.find(e=>e.id===id);if(!e){e={id,type};entities.push(e)}Object.assign(e,{x,y,name:label+'・入口',entrance:true,roomId:id});
   // Keep a perimeter path to the door after chapter reflection, without entering walls.
   for(let yy=house.y-1;yy<=y+1;yy++)for(let xx=house.x-1;xx<=house.x+house.w;xx++)if(xx>=1&&xx<width-1&&yy>=1&&yy<height-1&&!(xx>=house.x&&xx<house.x+house.w&&yy>=house.y&&yy<y)){const k=yy*width+xx;if(finalTiles[k]!==2&&finalTiles[k]!==4){finalTiles[k]=1;finalBlocked[k]=0}}
  }
  for(const e of entities){const edit=ch.world?.entityOverrides?.[e.id];if(edit&&Number.isFinite(edit.x)&&Number.isFinite(edit.y)&&edit.x>0&&edit.x<95&&edit.y>0&&edit.y<63&&!finalBlocked[Math.round(edit.y)*width+Math.round(edit.x)])Object.assign(e,edit)}
  // One person can carry several story roles without spawning a second body.
  const people=new Map();for(let i=0;i<entities.length;i++){const e=entities[i];if(!['clue','recruit','side','poet','scribe','captain'].includes(e.type))continue;const prior=people.get(e.name);if(!prior){people.set(e.name,e);continue}if(e.type==='recruit')prior.recruitable=true;prior.roleIds=[...(prior.roleIds||[prior.id]),e.id];entities.splice(i--,1)}
  const camp=entities.find(e=>e.id==='camp');
  // Face along the open road through the town gate, including reflected chapters.
  const w={width,height,tiles:finalTiles,blocked:finalBlocked,props,entities,start:{x:camp.x+(flipX?-2:2),y:camp.y,yaw:flipX?-Math.PI/2:Math.PI/2,pitch:-.10},river:flipX?width-river-riverWidth:river,riverWidth,theme};
  if(land.name)landscape(w,land,chapter,flipX,flipY,riverLeft);
  for(const e of w.entities){
    if(!['enemy','boss'].includes(e.type))continue;
    const tier=Core.enemyTier(e);
    if(tier==='general'||tier==='legendary'){e.battleTier=tier;continue}
    const elite=tier==='elite'||(!e.hidden&&['enemy3','enemy6'].includes(e.id));
    e.battleTier=elite?'elite':'soldier';
    if(elite&&!/隊長|校尉/.test(e.name))e.name+='・精英隊長';
  }
  return w;
 }
 function path(w,start,end){
  const sx=Math.round(start.x),sy=Math.round(start.y),ex=Math.round(end.x),ey=Math.round(end.y);if(ex<1||ey<1||ex>=w.width-1||ey>=w.height-1||w.blocked[ey*w.width+ex])return [];
  const first=sy*w.width+sx,last=ey*w.width+ex,prev=new Int32Array(w.width*w.height).fill(-1),queue=[first];prev[first]=first;
  for(let i=0;i<queue.length;i++){const n=queue[i];if(n===last)break;const x=n%w.width,y=Math.floor(n/w.width);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=ny*w.width+nx;if(nx<1||ny<1||nx>=w.width-1||ny>=w.height-1||prev[k]!==-1||w.blocked[k])continue;prev[k]=n;queue.push(k)}}
  if(prev[last]===-1)return [];const result=[];let p=last;while(p!==first){result.push({x:p%w.width,y:Math.floor(p/w.width)});p=prev[p]}return result.reverse();
 }
 function elevation(w,x,z){
  if(!w.elevation||w.interior)return 0;const xx=Math.max(0,Math.min(w.width-1,x)),yy=Math.max(0,Math.min(w.height-1,z)),ix=Math.floor(xx),iy=Math.floor(yy),nx=Math.min(ix+1,w.width-1),ny=Math.min(iy+1,w.height-1),fx=xx-ix,fy=yy-iy,a=w.elevation[iy*w.width+ix],b=w.elevation[ny*w.width+ix],c=w.elevation[iy*w.width+nx],d=w.elevation[ny*w.width+nx];
  // Match the exact b-c diagonal used by the visible ground and road meshes.
  return fx+fy<=1?a*(1-fx-fy)+c*fx+b*fy:d*(fx+fy-1)+c*(1-fy)+b*(1-fx);
 }
 function landscape(w,land,chapter,flipX,flipY,riverLeft){
  w.landscape=land;w.palette={grass:land.grass,road:land.road,water:land.water,sky:land.sky};
  const mirror=(x,y)=>({x:flipX?w.width-1-x:x,y:flipY?w.height-1-y:y});
  const wetVertices=new Uint8Array(w.width*w.height);
  for(let y=0;y<w.height;y++)for(let x=0;x<w.width;x++){const t=w.tiles[y*w.width+x];if(t!==2&&t!==3)continue;for(const dx of [0,1])for(const dy of [0,1])if(x+dx<w.width&&y+dy<w.height){const k=(y+dy)*w.width+x+dx;wetVertices[k]=Math.max(wetVertices[k],t===3?2:1)}}
  const levelWater=()=>{for(let k=0;k<wetVertices.length;k++)if(wetVertices[k])w.elevation[k]=wetVertices[k]===2?.1275:0};
  const peaks=land.peaks.map(([x,y,rx,ry,h])=>({...mirror(x,y),rx,ry,h}));
  const heightAt=(x,y)=>peaks.reduce((sum,p)=>{const d=((x-p.x)/p.rx)**2+((y-p.y)/p.ry)**2;return sum+p.h*Math.exp(-d*2)},0);
  const platforms=w.props.filter(p=>p.type==='house').map(p=>({...p,h:heightAt(p.x+p.w/2,p.y+p.h/2),depth:p.h}));
  // Heights are sampled once. Camera, actors, picking and meshes share this grid.
  w.elevation=new Float32Array(w.width*w.height);
  for(let y=0;y<w.height;y++)for(let x=0;x<w.width;x++){
   let h=heightAt(x,y);for(const p of platforms){const distance=Math.max(Math.abs(x-(p.x+p.w/2))-p.w/2,Math.abs(y-(p.y+p.depth/2))-p.depth/2);if(distance<=0)h=p.h;else if(distance<2){const t=distance/2;h=p.h*(1-t)+h*t}}
   let waterDistance=5;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<w.width&&yy<w.height&&[2,3].includes(w.tiles[yy*w.width+xx]))waterDistance=Math.min(waterDistance,Math.hypot(dx,dy))}
   h*=Math.min(1,Math.max(0,(waterDistance-.5)/3));w.elevation[y*w.width+x]=h;
  }
  levelWater();
  const protectedCells=new Set();for(const e of w.entities)for(const p of [e,...path(w,w.start,e)])for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)protectedCells.add((Math.round(p.y)+dy)*w.width+Math.round(p.x)+dx);
  for(let y=2;y<w.height-2;y++)for(let x=2;x<w.width-2;x++){const k=y*w.width+x;if(w.elevation[k]>5.8&&w.tiles[k]===0&&!protectedCells.has(k)){w.tiles[k]=6;w.blocked[k]=1}}
  const troop=land.enemyNames;for(const e of w.entities.filter(e=>e.type==='enemy')){const i=Number(e.id.match(/\d+$/)?.[0]||0);e.name=troop[e.hidden?3:i%3]}
  // Authored regional landmarks, kept outside the protected interaction routes.
  const locations=[[36,5],[67,5],[87,39],[9,54],[36,39],[69,55],[56,25],[84,57],[29,23],[57,56],[80,7],[64,44],[28,56],[89,25],[57,8]];
  for(let i=0;i<locations.length;i++){
   let p=mirror(...locations[i]);const type=land.features[i%land.features.length],radius=['palisade','pavilion','quarry'].includes(type)?2:1;
   const foundation=!['field','orchard','bamboo','dock'].includes(type);
   const clearAt=q=>{for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){const xx=q.x+dx,yy=q.y+dy,k=yy*w.width+xx;if(xx<2||yy<2||xx>=w.width-2||yy>=w.height-2||protectedCells.has(k)||w.blocked[k]||w.tiles[k]!==0)return false}if(foundation)for(let dy=-radius-4;dy<=radius+4;dy++)for(let dx=-radius-4;dx<=radius+4;dx++){const xx=q.x+dx,yy=q.y+dy;if(xx>=0&&yy>=0&&xx<w.width&&yy<w.height&&wetVertices[yy*w.width+xx])return false}return true};
   if(!clearAt(p)){let found=null;for(let r=1;r<=8&&!found;r++)for(let dy=-r;dy<=r&&!found;dy++)for(let dx=-r;dx<=r;dx++){const q={x:p.x+dx,y:p.y+dy};if(clearAt(q)){found=q;break}}if(!found)continue;p=found}w.props=w.props.filter(q=>Math.hypot(q.x-p.x,q.y-p.y)>radius+1);w.props.push({type,...p,chapter,w:radius*2+1,h:radius*2+1,foundation:!['field','orchard','bamboo','dock'].includes(type)});
   if(!['field','orchard','bamboo'].includes(type))for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){const k=(p.y+dy)*w.width+p.x+dx;w.blocked[k]=1;w.tiles[k]=6}
  }
  // Flatten every solid footprint before rendering. Neighboring slopes blend into
  // the foundation; the interior of another foundation is never overwritten.
  const foundations=w.props.filter(p=>p.type==='house'||p.foundation).map(p=>{const house=p.type==='house',x=house?p.x+p.w/2:p.x+.5,y=house?p.y+p.h/2:p.y+.5;return {x,y,rx:house?p.w/2+1:p.w/2+1,ry:house?p.h/2+1:p.h/2+1,h:elevation(w,x,y)}}),original=w.elevation.slice();
  for(let y=0;y<w.height;y++)for(let x=0;x<w.width;x++){
   if([2,3].includes(w.tiles[y*w.width+x]))continue;
   const distances=foundations.map(p=>({p,d:Math.max(Math.abs(x-p.x)-p.rx,Math.abs(y-p.y)-p.ry)})).sort((a,b)=>a.d-b.d),near=distances[0];if(!near||near.d>=2)continue;
   const t=Math.max(0,near.d)/2;w.elevation[y*w.width+x]=near.p.h*(1-t)+original[y*w.width+x]*t;
  }
  levelWater();
  if(land.fleet){let count=0;for(const y of [6,12,24,29,40,45,58])for(let offset=3;offset<land.riverWidth-2;offset+=5){if(count>=land.fleet)break;const p=mirror(riverLeft(y)+offset,y);w.props.push({type:'warship',...p,chapter,enemy:chapter===9||chapter===14,sail:true});count++}}
  if(land.fleet)for(const y of [18,34,51]){const p=mirror(riverLeft(y)-1,y);w.props.push({type:'dock',...p,chapter,w:3,h:4})}
  w.props=w.props.filter(p=>p.type!=='tree'||w.elevation[Math.round(p.y)*w.width+Math.round(p.x)]<5.8);
  if(land.winter)for(const p of w.props.filter(p=>p.type==='tree'))p.snow=true;
 }
 return {create,path,elevation};
})();
