var Ecology=(()=>{
 const TILE=42,SPEED=5,DETECTION=200/TILE,CONTACT=.65;
 const fierce=new Set(['lion','tiger','leopard','baboon']);
 const directions=[[1,0],[-1,0],[0,1],[0,-1]];
 function open(w,x,y){return x>0&&y>0&&x<w.width-1&&y<w.height-1&&!w.blocked[y*w.width+x]}
 function update(w,player,dt,isDefeated=()=>false,protectedContact=false){
  for(const e of w.entities){
   if((e.type!=='enemy'&&e.type!=='animal')||isDefeated(e))continue;
   e.moving=false;const distance=()=>Math.hypot(e.x-player.x,e.y-player.y);
   e.chasing=(e.type==='enemy'||fierce.has(e.species))&&distance()<=DETECTION;if(e.chasing)e.facingYaw=Math.atan2(player.x-e.x,player.y-e.y);
   if(!protectedContact&&(e.type==='enemy'||fierce.has(e.species))&&distance()<=CONTACT)return e;
   if(!e._motion)e._motion={homeX:e.x,homeY:e.y,target:null,seed:Array.from(e.id||e.species||'patrol').reduce((a,s)=>a+s.charCodeAt(0),17)};
   const m=e._motion;let budget=Math.max(0,Number.isFinite(dt)?dt:0)*(e.chasing?SPEED:SPEED/10);
   while(budget>1e-9){
    // Finish the current cardinal edge before choosing another path. Replanning
    // from rounded fractional positions can otherwise cut corners or teleport.
    if(!m.target){
     if(e.chasing)m.target=World.path(w,e,player)[0]||null;
     else if(Math.abs(e.x-m.homeX)>4||Math.abs(e.y-m.homeY)>4)m.target=World.path(w,e,{x:m.homeX,y:m.homeY})[0]||null;
     else{
      const options=directions.map(([dx,dy])=>({x:e.x+dx,y:e.y+dy})).filter(p=>open(w,p.x,p.y)&&Math.abs(p.x-m.homeX)<=4&&Math.abs(p.y-m.homeY)<=4);
      m.seed=(m.seed*1664525+1013904223)>>>0;
      m.target=options[m.seed%options.length]||null;
     }
     if(!m.target)break;
    }
    const target=m.target,dx=target.x-e.x,dy=target.y-e.y;
    if(!open(w,target.x,target.y)){m.target=null;break}
    const remaining=Math.abs(dx)+Math.abs(dy);
    if(remaining<1e-9){m.target=null;continue}
    // Small collision/contact steps also prevent walking through a player on a
    // long frame while preserving the same total speed across frame rates.
    const step=Math.min(budget,remaining,.2);
    e.facing=dx>0?'right':dx<0?'left':dy>0?'down':'up';
    if(dx)e.x+=Math.sign(dx)*step;else e.y+=Math.sign(dy)*step;
    e.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');e.facingYaw=e.chasing?Math.atan2(player.x-e.x,player.y-e.y):Math.atan2(dx,dy);e.moving=true;budget-=step;
    if(step>=remaining-1e-9){e.x=target.x;e.y=target.y;m.target=null}
    if(!protectedContact&&(e.type==='enemy'||fierce.has(e.species))&&distance()<=CONTACT)return e;
   }
  }
  return null;
 }

 // Civilian life uses its own seeded clock, so wandering never changes quiz randomness.
 const people=new Set(['clue','recruit','side','poet','scribe','captain']);
 const staff=new Set(['armory','academy','shop','clinic','granary','innkeeper','guide']);
 const isPerson=e=>!e.entrance&&(people.has(e.type)||e.id?.startsWith('host-')&&staff.has(e.type));
 const nextRandom=m=>{m.seed=(Math.imul(m.seed,1664525)+1013904223)>>>0;return m.seed/4294967296};
 const facing=(e,x,y)=>{const dx=x-e.x,dy=y-e.y;if(Math.abs(dx)+Math.abs(dy)>.01){e.facingYaw=Math.atan2(dx,dy);e.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up')}};
 function life(e){
  if(e._life)return e._life;
  const indoor=!!e.wander,old=/村長|阿婆|老|先生/.test(e.name||'');
  const radius=indoor?1:e.type==='captain'?4:old||e.type==='poet'||e.type==='scribe'?2:3;
  const speed=indoor?.28:old?.38:e.type==='captain'?.65:e.type==='recruit'?.55:.48;
  const m={homeX:Math.round(e.x),homeY:Math.round(e.y),radius,speed,path:[],wait:0,lastGoal:null,anchor:{x:Math.round(e.x),y:Math.round(e.y)},
   seed:Array.from((e.id||'person')+'|'+(e.name||'')).reduce((h,c)=>(Math.imul(h,31)+c.codePointAt(0))>>>0,17)};
  m.wait=nextRandom(m)*.9;e.walkTempo=speed/.55*.45;
  e._life=m;return m;
 }
 function available(w,e,m,x,y){
  if(!Number.isInteger(x)||!Number.isInteger(y)||x<1||y<1||x>=w.width-1||y>=w.height-1)return false;
  if(e.wander){
   const r=e.wander;
   // This reserved staff aisle is already blocked to player movement.
   if(x<r.minX||x>r.maxX||y<r.minY||y>r.maxY)return false;
  }else{
   if(Math.hypot(x-m.homeX,y-m.homeY)>m.radius||w.blocked[y*w.width+x])return false;
   if(w.entities.some(other=>other!==e&&other.entrance&&Math.hypot(other.x-x,other.y-y)<1.2))return false;
   if(w.entities.some(other=>other!==e&&['camp','puzzle','exit','chest','cargo','room-exit','room-note'].includes(other.type)&&Math.hypot(other.x-x,other.y-y)<.8))return false;
  }
  return !w.entities.some(other=>other!==e&&isPerson(other)&&Math.hypot(other.x-x,other.y-y)<.8);
 }
 function plan(w,e,m){
  const sx=Math.round(e.x),sy=Math.round(e.y),first=sy*w.width+sx;
  const prev=new Map([[first,first]]),queue=[first],candidates=[];
  for(let i=0;i<queue.length;i++){
   const n=queue[i],x=n%w.width,y=Math.floor(n/w.width);
   if(n!==first)candidates.push({x,y,key:n,road:w.tiles[n]===1});
   for(const [dx,dy]of directions){const xx=x+dx,yy=y+dy,key=yy*w.width+xx;
    if(prev.has(key)||!available(w,e,m,xx,yy))continue;prev.set(key,n);queue.push(key);
   }
  }
  if(!candidates.length)return [];
  let options=candidates.filter(p=>p.key!==m.lastGoal);
  if(!options.length)options=candidates;
  const roads=options.filter(p=>p.road);
  if(roads.length&&nextRandom(m)<.8)options=roads;
  const goal=options[Math.floor(nextRandom(m)*options.length)];
  m.lastGoal=goal.key;const path=[];let n=goal.key;
  while(n!==first){path.push({x:n%w.width,y:Math.floor(n/w.width)});n=prev.get(n)}
  return path.reverse();
 }
 function yieldPath(e,m){
  // Return along the unfinished edge before replanning from a grid intersection.
  // Rounding a moving position and turning immediately can cause repeated overshoot.
  m.path=Math.abs(e.x-m.anchor.x)+Math.abs(e.y-m.anchor.y)>1e-8?[{...m.anchor}]:[];
  m.wait=.5;
 }
 function stopPerson(e,player){if(isPerson(e)||['enemy','boss','animal'].includes(e.type)){e.moving=false;if(player)facing(e,player.x,player.y)}}
 function updatePeople(w,player,dt,options={}){
  const elapsed=Number.isFinite(dt)?Math.max(0,Math.min(.25,dt)):0;
  for(const e of w.entities){
   if(!isPerson(e))continue;e.moving=false;
   // Recruited companions have their own following positions; never patrol them.
   if(options.active?.includes(e.name)||e._npcHome)continue;
   const m=life(e),close=Math.hypot(e.x-player.x,e.y-player.y)<=3.2;
   if(options.paused||options.target===e||close){if(close)facing(e,player.x,player.y);continue}
   let budget=elapsed*m.speed,remainingTime=elapsed;
   if(m.wait>0){const waited=Math.min(m.wait,remainingTime);m.wait-=waited;remainingTime-=waited;budget=remainingTime*m.speed}
   while(budget>1e-9){
    if(!m.path.length){m.path=plan(w,e,m);if(!m.path.length){m.wait=1.5;break}}
    const goal=m.path[0];
    if(!available(w,e,m,goal.x,goal.y)){yieldPath(e,m);break}
    const dx=goal.x-e.x,dy=goal.y-e.y,distance=Math.abs(dx)+Math.abs(dy);
    if(distance<1e-9){m.anchor={...goal};m.path.shift();continue}
    const axisDistance=dx?Math.abs(dx):Math.abs(dy),amount=Math.min(axisDistance,budget,.12);
    let nx=e.x+(dx?Math.sign(dx)*amount:0),ny=e.y+(!dx?Math.sign(dy)*amount:0);
    if(amount>=axisDistance-1e-9){if(dx)nx=goal.x;else ny=goal.y}
    if(Math.hypot(nx-player.x,ny-player.y)<=3.0){facing(e,player.x,player.y);break}
    if(w.entities.some(other=>other!==e&&isPerson(other)&&Math.hypot(other.x-nx,other.y-ny)<.75)){yieldPath(e,m);break}
    facing(e,goal.x,goal.y);e.x=nx;e.y=ny;e.moving=true;budget-=amount;
    if(e.interactionPoint&&e.wander)e.interactionPoint={x:Math.round(e.x),y:e.wander.customerY};
    if(amount>=distance-1e-9){
     e.x=goal.x;e.y=goal.y;m.anchor={...goal};m.path.shift();
     if(!m.path.length){m.wait=1.4+nextRandom(m)*2.6;break}
    }
   }
  }
 }
 return {update,updatePeople,stopPerson,TILE,SPEED,DETECTION,CONTACT};

})();
