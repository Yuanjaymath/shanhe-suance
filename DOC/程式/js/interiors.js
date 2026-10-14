/* Walkable rooms share the outdoor movement, dialogue and service systems. */
var Interiors=(()=>{
 const rooms={
  armory:{name:'武器館・百鍊堂',type:'armory',host:'武器館掌櫃',style:'forge',welcome:'爐火映著兵刃。掌櫃在櫃檯後等候，左側是試煉與鍛造區。',note:'工匠手記：先答對，再出招。升級可增加攻擊或防禦，卻不能替你算出答案。'},
  academy:{name:'ㄚ杰課後班',type:'academy',host:'ㄚ杰',style:'classroom',welcome:'黑板上寫著今日課題。穿著現代帽衫的ㄚ杰招手：「先理解，再練習！」',note:'ㄚ杰的便條：因數像分隊，要分得剛剛好；倍數像集合，數著數著又碰頭。錯題也是線索！'},
  shop:{name:'行商鋪',type:'shop',host:'行商鋪掌櫃',style:'shop',welcome:'藥草與乾糧擺滿貨架。掌櫃正在核對帳本，歡迎旅人補充物資。',note:'貨架告示：金瘡藥補生命，乾糧補糧食；錦囊與盾牌可在戰鬥時使用。'},
  clinic:{name:'醫館',type:'clinic',host:'醫館郎中',style:'clinic',welcome:'藥香伴著窗光。郎中在診療桌旁，病床留給疲憊的旅人。',note:'醫者叮嚀：出城前先確認生命。答錯題時看懂解析，下一次就能少受一點傷。'},
  granary:{name:'糧行',type:'granary',host:'糧行掌櫃',style:'granary',welcome:'米袋整齊堆疊，秤盤微微晃動。掌櫃在櫃檯等你採買行軍糧。',note:'糧倉笑話：米袋最怕什麼數？「餓」數！行軍會消耗糧食，進城記得補給。'},
  'granary-store':{name:'糧棧',type:'granary',host:'糧棧管事',style:'granary',welcome:'各地運來的糧食分批入庫。管事一邊點袋數，一邊替旅人準備補給。',note:'倉簿：把不同數量的米豆平均分給最多隊，用最大公因數；定期送糧何時相遇，用最小公倍數。'},
  inn:{name:'客舍',type:'innkeeper',host:'客舍掌櫃',style:'inn',welcome:'茶水溫著，床鋪已整理妥當。掌櫃招呼你放下行囊歇歇腳。',note:'客舍留言：若想找到本章機關的答案，先訪兩位知情人，再看任務手札。'},
  station:{name:'驛站',type:'innkeeper',host:'驛站驛丞',style:'inn',welcome:'信件依路程排好，驛丞為遠行者準備茶水。窗邊掛著各地路線。',note:'驛路提醒：全境圖可點選目的地尋路，路上遇敵仍會交戰。林間露出的盔甲可能是伏兵。'},
  tower:{name:'望樓',type:'guide',host:'望樓守衛',style:'tower',welcome:'登上木樓，遠處山河盡收眼底。守衛正在沙盤旁標記道路。',note:'守望手札：敵軍靠近後會追逐，但比你慢。看清河流與橋樑，別把退路留在城牆旁。'}
 };
 function create(id){const info=rooms[id];if(!info)return null;
  const width=22,height=17,tiles=new Uint8Array(width*height).fill(6),blocked=new Uint8Array(width*height),props=[],entities=[];
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(x<2||x>19||y<2||y>15){tiles[y*width+x]=7;blocked[y*width+x]=1}
  for(let y=9;y<16;y++)for(let x=10;x<=12;x++)tiles[y*width+x]=8;
  const furniture=(kind,x,y,w=1,h=1,label='')=>{props.push({type:'furniture',kind,x,y,w,h,label});for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)blocked[yy*width+xx]=1};
  furniture('counter',9,7,5,1);furniture('shelf',3,2,4,1);furniture('shelf',15,2,4,1);
  if(info.style==='classroom'){furniture('board',8,2,6,1,'ㄚ杰課後班');for(const x of [4,7,15,18])for(const y of [10,13])furniture('desk',x,y);}
  else if(info.style==='forge'){furniture('rack',4,5,2,3);furniture('forge',16,5,2,2);furniture('anvil',16,10,2,1);furniture('rack',4,11,2,2);}
  else if(info.style==='clinic'){for(const y of [5,10])furniture('bed',4,y,2,3);furniture('medicine',16,5,2,2);furniture('desk',16,11,2,1);}
  else if(info.style==='granary'){for(const x of [4,16])for(const y of [5,10,13])furniture('sacks',x,y,2,2);}
  else if(info.style==='inn'){for(const x of [4,16])furniture('bed',x,5,2,3);furniture('tea',4,11,3,2);furniture('tea',16,11,2,2);}
  else if(info.style==='tower'){furniture('maptable',4,10,4,2);furniture('rack',16,5,2,2);furniture('tea',16,11,2,2);}
  else{for(const x of [4,16])for(const y of [5,10])furniture('goods',x,y,2,2);}
  // Keep the host one tile behind the counter, with a customer-side approach.
  const host={id:'host-'+id,type:info.type,name:info.host,x:11,y:6,dir:'down',interactionPoint:{x:11,y:8},interactionRange:2.1,wander:{minX:10,maxX:12,minY:6,maxY:6,customerY:8}};
  entities.push(host);for(let x=10;x<=12;x++)blocked[6*width+x]=1;
  entities.push({id:'room-note',type:'room-note',name:info.style==='classroom'?'課堂留言板':'店內手札',x:7,y:8,text:info.note});
  entities.push({id:'room-exit',type:'room-exit',name:'返回街道',x:11,y:15});
  return {width,height,tiles,blocked,props,entities,start:{x:11,y:14},interior:id,info,river:-100,theme:info.style};
 }
 return {rooms,create};
})();
