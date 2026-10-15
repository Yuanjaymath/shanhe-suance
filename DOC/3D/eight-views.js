/* All chapters use the supplied eight-view sheets with the existing depth buffer. */
var SpriteActors=(()=>{
 const data={...(typeof EightViewData==='undefined'?{}:EightViewData),...(typeof GateArtData==='undefined'?{}:GateArtData)},images=new Map(),portraits=new Map(),errors=new Map(),pending=new Map();
 let firstReady=false,allReady=null;
 // file:// images cannot be exported to portrait canvases or WebGL textures.
 // Only the local-file edition loads this data-URL fallback; HTTP stays staged.
 const sourceReady=location.protocol==='file:'?new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='DOC/3D8視角圖/離線圖像.js';
  script.onload=()=>{for(const [name,asset]of Object.entries(EightViewData))if(data[name])data[name].image=asset.image;resolve()};
  script.onerror=()=>reject(new Error('離線人物圖像載入失敗，請保留完整 DOC 資料夾。'));document.head.appendChild(script);
 }):Promise.resolve();
 const aliases={'關隘守衛':'望樓守衛','虎牢守將':'山寨督軍','整軍啟程':'驛站驛丞','義軍營地':'巡防隊長','荊州密使':'江岸密使','長坂船夫':'船夫'};
 function resolve(name){
  const clean=String(name).split('・')[0];if(Object.hasOwn(data,clean))return clean;
  const alias=aliases[clean];if(alias&&Object.hasOwn(data,alias))return alias;
  // Troop labels describe the current chapter; the provided generic sheets are
  // shared appearances. Exact-name sheets always take priority when added later.
  const troop=/伏兵/.test(clean)?'林間伏兵':/槍兵/.test(clean)?'山道槍兵':/騎兵/.test(clean)?'追擊騎將':/刀兵|攻城兵|水兵|山賊|匪徒/.test(clean)?'守營刀兵':/兵|步卒/.test(clean)?'巡邏步卒':null;
  return troop&&Object.hasOwn(data,troop)?troop:null;
 }
 function load(name,priority='low'){
  if(images.has(name))return Promise.resolve(images.get(name));const asset=data[name];if(!asset)return Promise.reject(new Error('缺少人物素材：'+name));
  const request=ImagePreloader.load(asset.image,priority);if(pending.has(name))return pending.get(name);
  const result=request.then(image=>{images.set(name,image);errors.delete(name);return image},error=>{errors.set(name,name+'：圖集載入失敗');throw error}).finally(()=>pending.delete(name));pending.set(name,result);return result;
 }
 function chapterNames(chapter){
  const ch=Story.chapters[chapter];if(!ch)throw new Error('章節不存在：'+chapter);
  return [...new Set(['劉備',...ch.clues.map(c=>c.name),ch.recruit,ch.boss,...(ch.world?.landscape?.enemyNames||[]),'驛站旅人','說書人','遊學先生','巡防隊長',...Object.values(Interiors.rooms).map(r=>r.host),'鹿','羊','豬','獅子','老虎','豹','狒狒','__gate-next','__gate-previous'].map(resolve).filter(Boolean))];
 }
 function preloadChapter(chapter,priority='high'){
  const ch=Story.chapters[chapter];if(!ch)return Promise.reject(new Error('章節不存在：'+chapter));
  return sourceReady.then(()=>Promise.all([LandscapeView.preload(priority),ImagePreloader.load(ImagePreloader.chapterSource(ch.title),priority),ImagePreloader.load('DOC/美術素材/勝利小女孩.webp',priority),ImagePreloader.load('DOC/美術素材/自製圖片/道具圖鑑.webp',priority),...chapterNames(chapter).map(name=>load(name,priority))])).then(result=>{if(chapter===0)firstReady=true;return result});
 }
 const ready=Promise.all([ChapterLoader.ready,sourceReady]).then(()=>Promise.all([preloadChapter(0),ImagePreloader.load('DOC/美術素材/勝利小女孩.webp','high'),ImagePreloader.load('DOC/美術素材/自製圖片/道具圖鑑.webp','high')])).then(()=>{firstReady=true});
 ready.catch(()=>{});
 function chapterReady(chapter){const ch=Story.chapters[chapter];return !!ch&&LandscapeView.status.ready&&!!ImagePreloader.get(ImagePreloader.chapterSource(ch.title))&&!!ImagePreloader.get('DOC/美術素材/勝利小女孩.webp')&&!!ImagePreloader.get('DOC/美術素材/自製圖片/道具圖鑑.webp')&&chapterNames(chapter).every(name=>images.has(name))}
 function chapterProgress(chapter){
  const ch=Story.chapters[chapter];if(!ch)return {ready:0,total:0,percent:0,failed:0};
  const common=[ImagePreloader.chapterSource(ch.title),'DOC/美術素材/勝利小女孩.webp','DOC/美術素材/自製圖片/道具圖鑑.webp'],names=chapterNames(chapter);
  const ready=common.filter(source=>ImagePreloader.get(source)).length+names.filter(name=>images.has(name)).length+LandscapeView.status.loaded,total=common.length+names.length+LandscapeView.sources.length;
  const failed=names.filter(name=>errors.has(name)).length+common.filter(source=>ImagePreloader.status.errors.includes(source)).length+LandscapeView.status.errors.length;
  return {ready,total,percent:Math.floor(ready/total*100),failed};
 }
 function background(){
  if(!allReady)allReady=Promise.all([ChapterLoader.ready,sourceReady]).then(()=>preloadChapter(0)).then(()=>{
   const jobs=[ImagePreloader.load('DOC/美術素材/自製圖片/山河同慶.webp','low')];
   for(let chapter=1;chapter<18;chapter++)jobs.push(preloadChapter(chapter,'low'));
   for(const name of Object.keys(data))jobs.push(load(name,'low'));
   return Promise.allSettled(jobs);
  }).catch(error=>{allReady=null;throw error});return allReady;
 }
 const has=(name,chapter)=>{const key=resolve(name);return Number.isInteger(chapter)&&chapter>=0&&chapter<18&&!!key&&!data[key].gate};
 // The source turns clockwise on screen: front, front-right, right, ... .
 // A camera on world -X sees the actor's face pointing to screen right.
 function view(yaw,eye,x,z){const angle=yaw-Math.atan2(eye[0]-x,eye[2]-z);return ((Math.round(angle/(Math.PI/4))%8)+8)%8}
 function bounds(name,chapter){if(!has(name,chapter))return null;const a=data[resolve(name)];return {height:a.heightWorld+.06,radius:Math.max(...a.frames.map(f=>Math.max(f.pivot,f.w-f.pivot)/f.h*a.heightWorld))}}
 function add(list,name,chapter,x,z,yaw,moving,t,options={}){
  const key=resolve(name);if(!has(name,chapter)||!images.has(key))return false;
  const a=data[key],tempo=options.tempo||1,phase=t*10*tempo;
  list.push({name,assetName:key,asset:a,image:images.get(key),x,z,yaw,
   base:.02+(moving?Math.abs(Math.sin(phase))*.028:0),
   height:a.heightWorld,tilt:(moving?Math.sin(phase)*.015:0)+(options.swing==null?0:Math.sin(options.swing*Math.PI)*(options.enemy?-.10:.10))});
  return true;
 }
 function quad(actor,camera){
  const {asset:a,x,z}=actor,index=view(actor.yaw,camera.eye,x,z),f=a.frames[index];
  const dx=camera.eye[0]-x,dz=camera.eye[2]-z,length=Math.hypot(dx,dz)||1;
  const side=actor.fixed&&dx*Math.sin(actor.yaw)+dz*Math.cos(actor.yaw)<0?-1:1;
  const rx=actor.fixed?Math.cos(actor.yaw)*side:dz/length,rz=actor.fixed?-Math.sin(actor.yaw)*side:-dx/length,unit=actor.height/f.h,left=-f.pivot*unit,right=(f.w-f.pivot)*unit;
  const bottom=actor.base,top=bottom+actor.height,tilt=actor.tilt*actor.height;
  const p=(side,y,sway=0)=>[x+(side+sway)*rx,y,z+(side+sway)*rz];
  const u0=f.x/a.width,u1=(f.x+f.w)/a.width,v0=1-(f.y+f.h)/a.height,v1=1-f.y/a.height;
  const vertices=[...p(left,bottom),u0,v0,...p(right,bottom),u1,v0,...p(right,top,tilt),u1,v1,
   ...p(left,bottom),u0,v0,...p(right,top,tilt),u1,v1,...p(left,top,tilt),u0,v1];
  return {data:new Float32Array(vertices),index};
 }

 function gate(list,e){
  const name=e.type==='previous-exit'?'__gate-previous':'__gate-next',asset=data[name],image=images.get(name);
  if(!asset||!image)return false;
  list.push({name,asset,image,x:e.x+.5,z:e.y+.5,yaw:0,base:.01,height:asset.heightWorld,tilt:0,fixed:true});return true;
 }
 function portrait(name,chapter,index=0){

  const source=resolve(name);if(!has(name,chapter)||!images.has(source))return null;
  index=((Math.round(index)%8)+8)%8;const key=source+'|'+index;if(portraits.has(key))return portraits.get(key);
  const f=data[source].frames[index],canvas=document.createElement('canvas');canvas.width=f.w;canvas.height=f.h;
  canvas.getContext('2d').drawImage(images.get(source),f.x,f.y,f.w,f.h,0,0,f.w,f.h);
  const url=canvas.toDataURL('image/png');portraits.set(key,url);return url;
 }
 function pass(gl){
  const shaders=[];
  function shader(type,code){const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error(error)}shaders.push(s);return s}
  const program=gl.createProgram();
  gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec3 p;attribute vec2 uv;uniform mat4 vp;varying vec2 tex;varying vec3 pos;void main(){pos=p;tex=uv;gl_Position=vp*vec4(p,1.);}'));
  gl.attachShader(program,shader(gl.FRAGMENT_SHADER,'precision mediump float;uniform sampler2D actor;uniform vec3 eye;varying vec2 tex;varying vec3 pos;void main(){vec4 color=texture2D(actor,tex);if(color.a<.12)discard;float fog=smoothstep(22.,65.,distance(pos,eye));gl_FragColor=vec4(mix(color.rgb,vec3(.65,.75,.70),fog*.8),color.a);}'));
  gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  const buffer=gl.createBuffer(),textures=new Map(),position=gl.getAttribLocation(program,'p'),uv=gl.getAttribLocation(program,'uv'),matrix=gl.getUniformLocation(program,'vp'),eye=gl.getUniformLocation(program,'eye'),sampler=gl.getUniformLocation(program,'actor');
  const maxAttributes=gl.getParameter(gl.MAX_VERTEX_ATTRIBS);let serial=0,last=[];
  function texture(actor){
   const key=actor.assetName||actor.name;let entry=textures.get(key);
   if(!entry){const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,actor.image);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    entry={texture:tex,used:serial};textures.set(key,entry);
   }entry.used=serial;gl.bindTexture(gl.TEXTURE_2D,entry.texture);
  }
  function inView(q,camera){
   const m=camera.matrix,clips=[];
   for(let i=0;i<q.data.length;i+=5){const x=q.data[i],y=q.data[i+1],z=q.data[i+2];clips.push([m[0]*x+m[4]*y+m[8]*z+m[12],m[1]*x+m[5]*y+m[9]*z+m[13],m[2]*x+m[6]*y+m[10]*z+m[14],m[3]*x+m[7]*y+m[11]*z+m[15]])}
   return !clips.every(p=>p[3]<=0)&&[0,1,2].every(axis=>!clips.every(p=>p[axis]<-p[3])&&!clips.every(p=>p[axis]>p[3]));
  }
  function draw(camera,actors=[]){
   serial++;last=[];const queue=actors.map(actor=>({actor,q:quad(actor,camera),distance:Math.hypot(actor.x-camera.eye[0],actor.z-camera.eye[2])})).filter(p=>inView(p.q,camera)).sort((a,b)=>b.distance-a.distance);
   if(queue.length){
    gl.useProgram(program);gl.uniformMatrix4fv(matrix,false,camera.matrix);gl.uniform3fv(eye,camera.eye);gl.uniform1i(sampler,0);gl.activeTexture(gl.TEXTURE0);
    gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(true);
    for(let i=0;i<maxAttributes;i++)gl.disableVertexAttribArray(i);
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,3,gl.FLOAT,false,20,0);gl.enableVertexAttribArray(uv);gl.vertexAttribPointer(uv,2,gl.FLOAT,false,20,12);
    for(const {actor,q}of queue){texture(actor);gl.bufferData(gl.ARRAY_BUFFER,q.data,gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,6);last.push({name:actor.name,source:actor.assetName||actor.name,view:q.index})}
    gl.disable(gl.BLEND);gl.enable(gl.CULL_FACE);
   }
   // Keep visible sheets cached, reclaim sheets that have left the scene.
   if(textures.size>16)for(const [name,entry]of [...textures].sort((a,b)=>a[1].used-b[1].used)){if(textures.size<=16||entry.used===serial)break;gl.deleteTexture(entry.texture);textures.delete(name)}
  }
  return {draw,get status(){return {drawn:last.map(a=>({...a})),textures:textures.size}},dispose(){for(const e of textures.values())gl.deleteTexture(e.texture);textures.clear();gl.deleteBuffer(buffer);gl.deleteProgram(program);for(const s of shaders)gl.deleteShader(s)}};
 }
 return {ready,background,preloadChapter,chapterReady,chapterProgress,chapterNames,has,resolve,view,bounds,add,gate,quad,portrait,pass,get status(){return {ready:firstReady,loaded:images.size===Object.keys(data).length,count:images.size,errors:[...errors.values()]}}};
})();
