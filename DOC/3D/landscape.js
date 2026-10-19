/* 各章邊界外的山河與田園。遠景不加入實體或碰撞，直接開檔亦可使用。 */
var LandscapeView=(()=>{
 const sources=['DOC/美術素材/山河遠景/農舍.webp','DOC/美術素材/山河遠景/田園生靈.webp','DOC/美術素材/山河遠景/遠山圖集.webp','DOC/美術素材/山河遠景/白雲.webp','DOC/美術素材/山河遠景/農田.webp','DOC/美術素材/山河遠景/城樓.webp','DOC/美術素材/山河遠景/碼頭.webp','DOC/美術素材/山河遠景/柳竹林.webp','DOC/美術素材/山河遠景/軍營.webp','DOC/美術素材/山河遠景/草廬.webp'];
 const sourceOf={farm:0,city:5,dock:6,grove:7,camp:8,cottage:9,farmer:1,ox:1,bird:1};
 const profiles=[
  {name:'涿郡阡陌',mountain:0,farms:6,riverWidth:9,landmarks:['farm','grove','farm','cottage']},
  {name:'桃園春耕',mountain:0,farms:5,riverWidth:9,landmarks:['farm','cottage','grove','farm']},
  {name:'潁川烽煙',mountain:0,farms:1,riverWidth:10,landmarks:['camp','camp','city','grove']},
  {name:'安喜山麓',mountain:1,farms:2,riverWidth:8,landmarks:['cottage','camp','grove','city']},
  {name:'虎牢雄關',mountain:1,farms:0,riverWidth:9,landmarks:['city','camp','city','camp']},
  {name:'徐州城外',mountain:0,farms:4,riverWidth:12,landmarks:['city','farm','city','camp']},
  {name:'汝南古道',mountain:0,farms:2,riverWidth:12,landmarks:['farm','camp','grove','cottage']},
  {name:'隆中煙嵐',mountain:1,farms:4,riverWidth:10,landmarks:['cottage','grove','cottage','farm']},
  {name:'長坂漢水',mountain:1,farms:2,riverWidth:24,landmarks:['dock','camp','farm','grove']},
  {name:'赤壁江天',mountain:1,farms:0,riverWidth:38,landmarks:['dock','camp','dock','camp']},
  {name:'湘水稻香',mountain:0,farms:6,riverWidth:25,landmarks:['city','farm','dock','grove']},
  {name:'蜀道群峰',mountain:1,farms:1,riverWidth:13,landmarks:['cottage','camp','grove','city']},
  {name:'成都沃野',mountain:1,farms:8,riverWidth:16,landmarks:['city','farm','cottage','farm']},
  {name:'定軍山勢',mountain:1,farms:1,riverWidth:13,landmarks:['camp','city','camp','grove']},
  {name:'荊州江城',mountain:1,farms:2,riverWidth:30,landmarks:['city','dock','camp','city']},
  {name:'祁山雪嶺',mountain:2,farms:0,riverWidth:10,landmarks:['camp','city','camp','city']},
  {name:'洛陽城郭',mountain:0,farms:5,riverWidth:20,landmarks:['city','city','farm','dock']},
  {name:'太平山河',mountain:0,farms:8,riverWidth:30,landmarks:['farm','city','cottage','dock']}
 ];
 const images=new Map(),errors=new Set(),cache=new WeakMap(),axesCache=new WeakMap();let pending=null,offline=null;
 function preload(priority='high'){
  if(images.size===sources.length)return Promise.resolve();if(pending)return pending;
  if(!offline)offline=location.protocol==='file:'?new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='DOC/美術素材/山河遠景/離線景觀.js';s.onload=resolve;s.onerror=()=>{offline=null;s.remove();reject(Error('離線景觀未能載入，請保留完整 DOC 資料夾。'))};document.head.appendChild(s)}):Promise.resolve();
  pending=offline.then(()=>Promise.all(sources.map(src=>ImagePreloader.load(location.protocol==='file:'?LandscapeImageData[src]:src,priority).then(im=>{images.set(src,im);errors.delete(src)},e=>{errors.add(src);throw e})))).finally(()=>{pending=null});return pending;
 }
 const wallVisible=(w,x,z)=>!!w.interior||x!==0&&z!==0&&x!==w.width-1&&z!==w.height-1;
 function river(w,z,p){const edge=z<=0?1:w.height-2,xs=[];for(let x=1;x<w.width-1;x++)if([2,3].includes(w.tiles[edge*w.width+x]))xs.push(x);const center=xs.length?(xs[0]+xs[xs.length-1]+1)/2:w.river+w.riverWidth/2,d=Math.max(0,-z,z-w.height);return {x:center+Math.sin(d/27)*Math.min(6,d*.15),width:w.riverWidth+(p.riverWidth-w.riverWidth)*Math.min(1,d/24)}}
 function sampleHeight(w,x,z,p){const xx=Math.max(0,Math.min(w.width,x)),zz=Math.max(0,Math.min(w.height,z)),d=Math.hypot(x-xx,z-zz),edge=World.elevation(w,xx,zz);let h=edge*Math.exp(-d/28)+Math.min(1,d/14)*(.10+Math.sin(x*.073)*Math.cos(z*.061)*.24);if(z<=0||z>=w.height){const r=river(w,z,p),bank=Math.abs(x-r.x)-r.width/2;if(bank<2)h=h*Math.max(0,bank/2)-.36*(1-Math.max(0,bank/2))}return h-.035}
 function plan(w,chapter){
  if(cache.has(w))return cache.get(w);const p=profiles[chapter]||profiles[0],props=[],life=[],fields=[];
  const locations=[[17,-20],[76,-24],[w.width+19,12],[w.width+22,51],[76,w.height+22],[17,w.height+20],[-20,50],[-19,12]];
  locations.forEach(([x,z],i)=>{let kind=p.landmarks[(i+Math.floor(chapter/3))%p.landmarks.length];if(z<0||z>w.height){const r=river(w,z,p);if(Math.abs(x-r.x)<r.width/2+7)x=r.x+(x<r.x?-1:1)*(r.width/2+14)}props.push({kind,x,z,width:({city:30,grove:12,farm:14,cottage:11,camp:18,dock:15})[kind],seed:i})});
  if(p.landmarks.includes('dock'))for(const z of [-30,w.height+30]){const r=river(w,z,p);props.push({kind:'dock',x:r.x+r.width*.32,z,width:15,seed:8})}
  const sites=[[18,-10],[77,-12],[-11,18],[-12,48],[w.width+12,17],[w.width+13,48],[19,w.height+12],[77,w.height+12]];
  sites.slice(0,p.farms).forEach(([x,z],i)=>{if(z<0||z>w.height){const r=river(w,z,p);if(Math.abs(x-r.x)<r.width/2+9)x=r.x+(x<r.x?-1:1)*(r.width/2+12)}fields.push({x,z,width:15,depth:10});life.push({kind:'farmer',x:x-3,z:z+1,phase:i*2.3},{kind:'ox',x:x+1,z:z-2,phase:i*1.7})});
  const birds=Array.from({length:5},(_,i)=>({phase:i*Math.PI*2/5+chapter*.31,radius:55+i*6,height:8+i*.7}));
  const result={profile:p,props,life,fields,birds};cache.set(w,result);return result;
 }
 function animated(w,chapter,t){const p=plan(w,chapter),items=p.life.map(e=>{const walk=e.kind==='ox'?Math.sin(t*.13+e.phase)*3.2:0,x=e.x+walk,z=e.z;return {...e,x,z,base:elevation(w,x,z,p.profile)+.045,frame:Math.floor(t*(e.kind==='ox'?3:1.7)+e.phase)%4,flip:e.kind==='ox'&&Math.cos(t*.13+e.phase)<0}});for(const b of p.birds){const a=t*.047+b.phase;items.push({kind:'bird',x:w.width/2+Math.cos(a)*b.radius*1.25,z:w.height/2+Math.sin(a)*b.radius,base:b.height+Math.sin(t*.35+b.phase)*.5,frame:[0,1,3,2][Math.floor(t*4+b.phase)%4],vx:-Math.sin(a)*b.radius*1.25*.047,vz:Math.cos(a)*b.radius*.047})}return items}
 // 邊界逐格對齊原地面；向遠處逐漸減少頂點。河床與景物共用此網格。
 const distances=[1,2,3,4,6,8,12,16,20,24,28,32,36,40,44,48,56,64,72,80,88,96];
 function axes(w){if(!axesCache.has(w)){const axis=n=>[...distances].reverse().map(v=>-v).concat(Array.from({length:n+1},(_,i)=>i),distances.map(v=>n+v));axesCache.set(w,{x:axis(w.width),z:axis(w.height)})}return axesCache.get(w)}
 function bracket(a,v){let lo=0,hi=a.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(a[mid]>v)hi=mid;else lo=mid}return [a[lo],a[hi]]}
 function elevation(w,x,z,p){if(x>0&&z>0&&x<w.width&&z<w.height)return World.elevation(w,x,z)-.035;const a=axes(w),[x0,x1]=bracket(a.x,x),[z0,z1]=bracket(a.z,z),fx=(x-x0)/(x1-x0),fz=(z-z0)/(z1-z0),h00=sampleHeight(w,x0,z0,p),h10=sampleHeight(w,x1,z0,p),h01=sampleHeight(w,x0,z1,p),h11=sampleHeight(w,x1,z1,p);return fx+fz<=1?h00*(1-fx-fz)+h10*fx+h01*fz:h11*(fx+fz-1)+h10*(1-fz)+h01*(1-fx)}
 function edgeHeight(w,x,z){if(w.interior||x>0&&z>0&&x<w.width&&z<w.height)return World.elevation(w,x,z);return sampleHeight(w,x,z,cache.get(w)?.profile||profiles[0])+.035}
 function mouth(w,x,z){return !w.interior&&(z===0&&[2,3].includes(w.tiles[w.width+x])||z===w.height-1&&[2,3].includes(w.tiles[(w.height-2)*w.width+x]))}
 function ground(g,w,chapter){if(w.interior)return;const p=plan(w,chapter).profile,paint=w.palette?.grass||[.34,.46,.29],a=axes(w);
  for(let j=0;j<a.z.length-1;j++)for(let i=0;i<a.x.length-1;i++){const x=a.x[i],z=a.z[j],xx=a.x[i+1],zz=a.z[j+1];if(x>=0&&z>=0&&xx<=w.width&&zz<=w.height)continue;const point=(x,z)=>[x,sampleHeight(w,x,z,p),z],c=p.mountain===2?[.69,.73,.69]:paint.map(v=>v*(.99+.035*Math.sin(x+z)));g.triangle([point(x,z),point(x,zz),point(xx,z)],[0,1,0],c,0);g.triangle([point(xx,z),point(x,zz),point(xx,zz)],[0,1,0],c,0)}
 }
 function pass(gl){
  const shaders=[],programs=[],textures=new Map(),buffer=gl.createBuffer();let last={name:'',sprites:0,birds:0,water:false};const max=gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
  function program(vertex,fragment){const p=gl.createProgram();for(const [type,code]of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));gl.attachShader(p,s);shaders.push(s)}gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));programs.push(p);return p}
  const skyProgram=program('attribute vec2 p;varying vec2 screen;void main(){screen=p;gl_Position=vec4(p,0.,1.);}',`precision mediump float;varying vec2 screen;uniform vec3 forward;uniform vec3 right;uniform vec3 up;uniform float aspect;uniform float clock;uniform float ridge;uniform sampler2D mountains;uniform sampler2D clouds;
   void main(){vec3 d=normalize(forward+right*screen.x*.57256*aspect+up*screen.y*.57256);vec3 haze=vec3(.76,.86,.92),blue=mix(vec3(.16,.44,.75),vec3(.28,.47,.69),step(1.5,ridge));vec3 col=mix(haze,blue,pow(max(0.,d.y),.48));float sun=pow(max(0.,dot(d,normalize(vec3(-.5,.65,.35)))),80.);col+=sun*.12;
   vec2 cuv=fract(d.xz/max(d.y,.12)*.18+vec2(clock*.0013,clock*.00025));vec4 cloud=texture2D(clouds,cuv);col=mix(col,cloud.rgb,cloud.a*smoothstep(.035,.23,d.y)*.93);
   if(d.y>-.055&&d.y<.32){float u=abs(fract(atan(d.x,d.z)/6.2831853*2.)*2.-1.);float v=clamp((.32-d.y)/.375,0.,.999);vec4 mountain=texture2D(mountains,vec2(u,(ridge+v)/3.));vec3 tint=mix(mountain.rgb,haze,.30);mountain.a*=1.-smoothstep(.77,1.,v);col=mix(col,tint,mountain.a);}
   gl_FragColor=vec4(col,1.);}`);
  const spriteProgram=program('attribute vec3 p;attribute vec2 uv;uniform mat4 vp;varying vec2 tex;varying vec3 pos;void main(){pos=p;tex=uv;gl_Position=vp*vec4(p,1.);}',`precision mediump float;uniform sampler2D image;uniform vec3 eye;uniform vec3 haze;uniform float shadow;varying vec2 tex;varying vec3 pos;void main(){if(shadow>.5){vec2 q=tex*2.-1.;float a=exp(-dot(q,q)*3.)*.24;gl_FragColor=vec4(.14,.19,.11,a);return;}vec4 c=texture2D(image,tex);if(c.a<.09)discard;float fog=smoothstep(38.,155.,distance(pos,eye));gl_FragColor=vec4(mix(c.rgb,haze,fog*.46),c.a);}`);
  const waterProgram=program('attribute vec3 p;uniform mat4 vp;varying vec3 pos;void main(){pos=p;gl_Position=vp*vec4(p,1.);}',`precision mediump float;uniform float clock;uniform vec3 eye;uniform vec3 water;varying vec3 pos;void main(){vec2 q=pos.xz;float a=sin(q.x*3.1+q.y*1.2-clock*1.7),b=sin(q.x*6.7-q.y*3.8-clock*2.6);float wave=(a+b)*.5;float glint=pow(max(0.,sin(q.y*10.-clock*3.4+sin(q.x*2.))),20.)*.12*smoothstep(.1,.7,sin(q.x*1.8+q.y*.16+clock*.21)*.5+.5);float fresnel=1.-clamp((eye.y-pos.y)/max(.1,distance(eye,pos)),0.,1.);vec3 c=mix(water,vec3(.66,.81,.87),fresnel*.35)+wave*.035+glint;gl_FragColor=vec4(mix(c,vec3(.76,.86,.92),smoothstep(40.,155.,distance(eye,pos))*.48),1.);}`);
  const uniformCache=new WeakMap();const loc=(p,n)=>{if(!uniformCache.has(p))uniformCache.set(p,new Map());const m=uniformCache.get(p);if(!m.has(n))m.set(n,gl.getUniformLocation(p,n));return m.get(n)};
  function bind(p,stride,attrs,data){gl.useProgram(p);for(let i=0;i<max;i++)gl.disableVertexAttribArray(i);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data instanceof Float32Array?data:new Float32Array(data),gl.DYNAMIC_DRAW);for(const [name,size,offset]of attrs){const a=gl.getAttribLocation(p,name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,size,gl.FLOAT,false,stride,offset)}}
  function texture(src,slot){const image=images.get(src);if(!image)return false;let tex=textures.get(src);gl.activeTexture(gl.TEXTURE0+slot);if(!tex){tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);textures.set(src,tex)}else gl.bindTexture(gl.TEXTURE_2D,tex);return true}
  function sky(camera,w,chapter,t){if(w.interior||images.size!==sources.length)return;gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.disable(gl.BLEND);gl.depthMask(false);bind(skyProgram,8,[['p',2,0]],[-1,-1,1,-1,1,1,-1,-1,1,1,-1,1]);gl.uniform3fv(loc(skyProgram,'forward'),camera.forward);gl.uniform3fv(loc(skyProgram,'right'),camera.right);gl.uniform3fv(loc(skyProgram,'up'),camera.up);gl.uniform1f(loc(skyProgram,'aspect'),camera.aspect);gl.uniform1f(loc(skyProgram,'clock'),t);gl.uniform1f(loc(skyProgram,'ridge'),plan(w,chapter).profile.mountain);texture(sources[2],0);texture(sources[3],1);gl.uniform1i(loc(skyProgram,'mountains'),0);gl.uniform1i(loc(skyProgram,'clouds'),1);gl.drawArrays(gl.TRIANGLES,0,6);gl.activeTexture(gl.TEXTURE0);gl.depthMask(true);gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE)}
  const waterMeshes=new WeakMap();
  function waterMesh(w,chapter){if(waterMeshes.has(w))return waterMeshes.get(w);const data=[],quad=(x0,z0,x1,z1)=>data.push(x0,-.023,z0,x0,-.023,z1,x1,-.023,z0,x1,-.023,z0,x0,-.023,z1,x1,-.023,z1);for(let z=0;z<w.height;z++)for(let x=0;x<w.width;x++)if(w.tiles[z*w.width+x]===2||mouth(w,x,z))quad(x,z,x+1,z+1);
   const p=plan(w,chapter).profile;for(const [a,b]of [[-96,0],[w.height,w.height+96]])for(let z=a;z<b;z+=2){const r=river(w,z,p),s=river(w,z+2,p),left=r.x-r.width/2,right=r.x+r.width/2,nextLeft=s.x-s.width/2,nextRight=s.x+s.width/2;data.push(left,-.023,z,nextLeft,-.023,z+2,right,-.023,z,right,-.023,z,nextLeft,-.023,z+2,nextRight,-.023,z+2)}const mesh=new Float32Array(data);waterMeshes.set(w,mesh);return mesh}
  const rects={"farm":[29,154,712,459],"city":[6,127,755,488],"dock":[40,127,702,551],"grove":[51,57,683,644],"camp":[16,58,735,606],"cottage":[38,118,717,527]};
  function vertices(item,camera,w,p){const im=images.get(sources[sourceOf[item.kind]]);let rect=rects[item.kind],width=item.width||1,height,base=item.base??elevation(w,item.x,item.z,p)+.045;
   if(item.kind==='ox'){rect=[item.frame*384+3,60,378,240];width=2.8}
   if(item.kind==='farmer'){rect=[item.frame*384+4,308,376,400];width=1.85}
   if(item.kind==='bird'){rect=[item.frame*384+3,711,378,310];width=1.8}
   height=width*rect[3]/rect[2];const dx=camera.eye[0]-item.x,dz=camera.eye[2]-item.z,len=Math.hypot(dx,dz)||1,rx=dz/len,rz=-dx/len,x=item.x,z=item.z,a=[x-rx*width/2,base,z-rz*width/2],b=[x+rx*width/2,base,z+rz*width/2],c=[b[0],base+height,b[2]],d=[a[0],base+height,a[2]];let u0=rect[0]/im.width,u1=(rect[0]+rect[2])/im.width;const v0=rect[1]/im.height,v1=(rect[1]+rect[3])/im.height;const flip=item.kind==='bird'?item.vx*rx+item.vz*rz<0:item.flip;if(flip)[u0,u1]=[u1,u0];return [...a,u0,v1,...b,u1,v1,...c,u1,v0,...a,u0,v1,...c,u1,v0,...d,u0,v0]}
  // 農田不會移動，先細分貼地並快取，避免每一影格重新計算。
  const fieldMeshes=new WeakMap();
  function fieldMesh(w,p){if(fieldMeshes.has(w))return fieldMeshes.get(w);const data=[];for(const f of p.fields){const nx=Math.ceil(f.width),nz=Math.ceil(f.depth),point=(u,v)=>{const x=f.x-f.width/2+u*f.width,z=f.z-f.depth/2+v*f.depth;return [x,elevation(w,x,z,p.profile)+.065,z,u,v]};for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=point(i/nx,j/nz),b=point((i+1)/nx,j/nz),c=point((i+1)/nx,(j+1)/nz),d=point(i/nx,(j+1)/nz);data.push(...a,...b,...c,...a,...c,...d)}}const mesh=new Float32Array(data);fieldMeshes.set(w,mesh);return mesh}
  function draw(camera,w,chapter,t){if(w.interior||images.size!==sources.length){last={name:'室內',sprites:0,birds:0,water:false};return}const p=plan(w,chapter),water=waterMesh(w,chapter);gl.disable(gl.CULL_FACE);gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.disable(gl.BLEND);bind(waterProgram,12,[['p',3,0]],water);gl.uniformMatrix4fv(loc(waterProgram,'vp'),false,camera.matrix);gl.uniform1f(loc(waterProgram,'clock'),t);gl.uniform3fv(loc(waterProgram,'eye'),camera.eye);gl.uniform3fv(loc(waterProgram,'water'),w.palette?.water||[.2,.44,.49]);gl.drawArrays(gl.TRIANGLES,0,water.length/3);
   const items=[...p.props,...animated(w,chapter,t)].filter(e=>Math.hypot(e.x-camera.eye[0],e.z-camera.eye[2])<150).sort((a,b)=>Math.hypot(b.x-camera.eye[0],b.z-camera.eye[2])-Math.hypot(a.x-camera.eye[0],a.z-camera.eye[2]));
   gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);bind(spriteProgram,20,[['p',3,0],['uv',2,12]],[]);gl.uniformMatrix4fv(loc(spriteProgram,'vp'),false,camera.matrix);gl.uniform3fv(loc(spriteProgram,'eye'),camera.eye);gl.uniform3fv(loc(spriteProgram,'haze'),[.76,.86,.92]);gl.uniform1i(loc(spriteProgram,'image'),0);gl.uniform1f(loc(spriteProgram,'shadow'),0.);
   texture(sources[4],0);const fields=fieldMesh(w,p);if(fields.length){gl.bufferData(gl.ARRAY_BUFFER,fields,gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,fields.length/5)}
   gl.uniform1f(loc(spriteProgram,'shadow'),1.);for(const e of p.props){const width=e.width*.58,depth=e.width*.18,point=(x,z)=>[x,elevation(w,x,z,p.profile)+.045,z],a=point(e.x-width,e.z-depth),b=point(e.x+width,e.z-depth),c=point(e.x+width,e.z+depth),d=point(e.x-width,e.z+depth);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([...a,0,0,...b,1,0,...c,1,1,...a,0,0,...c,1,1,...d,0,1]),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,6)}gl.uniform1f(loc(spriteProgram,'shadow'),0.);
   for(const e of items){texture(sources[sourceOf[e.kind]],0);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices(e,camera,w,p.profile)),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,6)}gl.disable(gl.BLEND);gl.enable(gl.CULL_FACE);gl.activeTexture(gl.TEXTURE0);last={name:p.profile.name,sprites:items.length,birds:items.filter(e=>e.kind==='bird').length,water:true};
  }
  return {sky,draw,get status(){return last},dispose(){gl.deleteBuffer(buffer);for(const t of textures.values())gl.deleteTexture(t);for(const p of programs)gl.deleteProgram(p);for(const s of shaders)gl.deleteShader(s)}};
 }
 return {sources,profiles,preload,wallVisible,plan,animated,ground,groundHeight:elevation,edgeHeight,riverAt:river,mouth,pass,get status(){return {ready:images.size===sources.length,loaded:images.size,total:sources.length,errors:[...errors]}}};
})();
