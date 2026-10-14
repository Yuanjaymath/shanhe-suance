/* Original local WebGL engine: real perspective, depth-tested geometry and lit materials. */
var Renderer=(()=>{
 const color={grass:[.34,.46,.29],road:[.68,.58,.40],water:[.20,.44,.49],wood:[.56,.40,.24],roof:[.18,.31,.28],wall:[.48,.52,.40]};
 const yawOf=d=>({down:0,up:Math.PI,left:-Math.PI/2,right:Math.PI/2}[d]||0);
 const normalize=v=>{const n=Math.hypot(...v)||1;return v.map(x=>x/n)},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((n,x,i)=>n+x*b[i],0);
 function multiply(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return o}
 function cameraMatrix(eye,target,aspect){const z=normalize(eye.map((v,i)=>v-target[i])),right=normalize(cross([0,1,0],z)),up=cross(z,right);const view=new Float32Array([right[0],up[0],z[0],0,right[1],up[1],z[1],0,right[2],up[2],z[2],0,-dot(right,eye),-dot(up,eye),-dot(z,eye),1]);const f=1/Math.tan(.52),near=.1,far=160;const projection=new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]);return {matrix:multiply(projection,view),eye,right,up,forward:z.map(v=>-v),aspect}}
 function geometry(){const values=[];
  function triangle(points,n,c,mat=0,uv=[[0,0],[1,0],[1,1]],normals=null){for(let i=0;i<3;i++)values.push(...points[i],...(normals?normals[i]:n),...c,(mat+uv[i][0]*.96+.02)/16,uv[i][1]*.96+.02)}
  function box(x,y,z,w,h,d,c,angle=0,mat=0){const ca=Math.cos(angle),sa=Math.sin(angle),rotate=p=>[x+p[0]*ca+p[2]*sa,y+p[1],z-p[0]*sa+p[2]*ca];const faces=[[[0,0,1],[[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]]],[[0,0,-1],[[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]]],[[1,0,0],[[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1]]],[[-1,0,0],[[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1]]],[[0,1,0],[[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1]]],[[0,-1,0],[[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1]]]];
   for(const [normal,points]of faces){const n=[normal[0]*ca+normal[2]*sa,normal[1],-normal[0]*sa+normal[2]*ca],verts=points.map(p=>rotate([p[0]*w/2,p[1]*h/2,p[2]*d/2]));triangle([verts[0],verts[1],verts[2]],n,c,mat);triangle([verts[0],verts[2],verts[3]],n,c,mat)}
  }
  function cone(x,y,z,r,h,c,sides=9){for(let i=0;i<sides;i++){const a=i*Math.PI*2/sides,b=(i+1)*Math.PI*2/sides,mid=(a+b)/2;triangle([[x+Math.cos(a)*r,y,z+Math.sin(a)*r],[x,y+h,z],[x+Math.cos(b)*r,y,z+Math.sin(b)*r]],normalize([Math.cos(mid),r/h,Math.sin(mid)]),c,2)}}
  function roof(x,y,z,w,d,h,c){const corners=[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]];for(let i=0;i<4;i++){const a=corners[i],b=corners[(i+1)%4],pts=[[x+a[0],y,z+a[1]],[x,y+h,z],[x+b[0],y,z+b[1]]];const n=normalize(cross(pts[1].map((v,k)=>v-pts[0][k]),pts[2].map((v,k)=>v-pts[0][k])));triangle(pts,n,c,2)}}
  // Smooth normals keep curved shapes rounded without large model files.
  function ellipsoid(x,y,z,rx,ry,rz,c,angle=0,segments=10,rings=6,mat=13){
   const ca=Math.cos(angle),sa=Math.sin(angle),rotate=v=>[v[0]*ca+v[2]*sa,v[1],-v[0]*sa+v[2]*ca];
   const point=(row,col)=>{const phi=row*Math.PI/rings,theta=col*2*Math.PI/segments,v=[Math.sin(phi)*Math.cos(theta),Math.cos(phi),Math.sin(phi)*Math.sin(theta)],q=rotate([v[0]*rx,v[1]*ry,v[2]*rz]),n=normalize(rotate([v[0]/rx,v[1]/ry,v[2]/rz]));return {p:[x+q[0],y+q[1],z+q[2]],n}};
   for(let row=0;row<rings;row++)for(let col=0;col<segments;col++){const a=point(row,col),b=point(row+1,col),d=point(row,col+1),e=point(row+1,col+1);if(row>0)triangle([a.p,d.p,b.p],a.n,c,mat,undefined,[a.n,d.n,b.n]);if(row<rings-1)triangle([d.p,e.p,b.p],d.n,c,mat,undefined,[d.n,e.n,b.n])}
  }
  function segment(a,b,r1,r2,c,sides=8,mat=0){const axis=normalize(b.map((v,i)=>v-a[i])),u=normalize(cross(axis,Math.abs(axis[1])>.9?[1,0,0]:[0,1,0])),v=cross(axis,u),length=Math.hypot(...b.map((x,i)=>x-a[i]));
   const radial=i=>{const theta=i*Math.PI*2/sides;return u.map((x,k)=>x*Math.cos(theta)+v[k]*Math.sin(theta))};
   for(let i=0;i<sides;i++){const n=radial(i),m=radial(i+1),normal=q=>normalize(q.map((x,k)=>x+axis[k]*(r1-r2)/length)),pa=a.map((x,k)=>x+n[k]*r1),pb=b.map((x,k)=>x+n[k]*r2),pc=a.map((x,k)=>x+m[k]*r1),pd=b.map((x,k)=>x+m[k]*r2);triangle([pa,pc,pb],n,c,mat,undefined,[normal(n),normal(m),normal(n)]);triangle([pc,pd,pb],m,c,mat,undefined,[normal(m),normal(m),normal(n)]);triangle([a,pc,pa],axis.map(x=>-x),c,mat);triangle([b,pb,pd],axis,c,mat)}
  }
  // Extruded convex outlines give blades an edge, bevel and real thickness.
  function prism(points,depth,c){
   const n=normalize(cross(points[1].map((v,i)=>v-points[0][i]),points[2].map((v,i)=>v-points[0][i])));
   const front=points.map(p=>p.map((v,i)=>v+n[i]*depth/2)),back=points.map(p=>p.map((v,i)=>v-n[i]*depth/2));
   for(let i=1;i<points.length-1;i++){triangle([front[0],front[i],front[i+1]],n,c,13);triangle([back[0],back[i+1],back[i]],n.map(v=>-v),c,13)}
   for(let i=0;i<points.length;i++){const j=(i+1)%points.length,side=normalize(cross(points[j].map((v,k)=>v-points[i][k]),n));
    triangle([back[i],back[j],front[j]],side,c,13);triangle([back[i],front[j],front[i]],side,c,13)}
  }
  function sign(x,y,z,w,h,slot){const points=[[x-w/2,y-h/2,z],[x+w/2,y-h/2,z],[x+w/2,y+h/2,z],[x-w/2,y+h/2,z]],n=[0,0,1],c=[1,1,1];triangle([points[0],points[1],points[2]],n,c,slot,[[0,1],[1,1],[1,0]]);triangle([points[0],points[2],points[3]],n,c,slot,[[0,1],[1,0],[0,0]])}
  function mesh(data,x,z,angle,baseY=0){const ca=Math.cos(angle),sa=Math.sin(angle);for(let i=0;i<data.length;i+=11)values.push(x+data[i]*ca+data[i+2]*sa,data[i+1]+baseY,z-data[i]*sa+data[i+2]*ca,data[i+3]*ca+data[i+5]*sa,data[i+4],-data[i+3]*sa+data[i+5]*ca,data[i+6],data[i+7],data[i+8],data[i+9],data[i+10])}
  return {triangle,box,cone,roof,ellipsoid,segment,prism,sign,mesh,create:geometry,data:()=>new Float32Array(values)};
 }
 function raised(g,h){if(!h)return g;return {...g,triangle:(pts,n,...rest)=>g.triangle(pts.map(p=>[p[0],p[1]+h,p[2]]),n,...rest),box:(x,y,z,...rest)=>g.box(x,y+h,z,...rest),cone:(x,y,z,...rest)=>g.cone(x,y+h,z,...rest),roof:(x,y,z,...rest)=>g.roof(x,y+h,z,...rest),ellipsoid:(x,y,z,...rest)=>g.ellipsoid(x,y+h,z,...rest),segment:(a,b,...rest)=>g.segment([a[0],a[1]+h,a[2]],[b[0],b[1]+h,b[2]],...rest),prism:(pts,...rest)=>g.prism(pts.map(p=>[p[0],p[1]+h,p[2]]),...rest),sign:(x,y,z,...rest)=>g.sign(x,y+h,z,...rest),mesh:(data,x,z,yaw,offset=0)=>g.mesh(data,x,z,yaw,h+offset)}}
 function frustumPlanes(camera){const m=camera.matrix;return [[0,1],[0,-1],[1,1],[1,-1],[2,1],[2,-1]].map(([row,sign])=>[m[3]+sign*m[row],m[7]+sign*m[4+row],m[11]+sign*m[8+row],m[15]+sign*m[12+row]])}
 function inFrustum(planes,group){return planes.every(p=>p[0]*(p[0]>=0?group.hi[0]:group.lo[0])+p[1]*(p[1]>=0?group.hi[1]:group.lo[1])+p[2]*(p[2]>=0?group.hi[2]:group.lo[2])+p[3]>=0)}
 function engine(canvas){const gl=canvas.getContext('webgl',{alpha:false,antialias:true,powerPreference:'high-performance'});if(!gl)throw Error('這個瀏覽器未提供 WebGL，請啟用硬體加速或改用支援 3D 的瀏覽器。');
  const vs=`attribute vec3 p;attribute vec3 n;attribute vec3 c;attribute vec2 uv;uniform mat4 vp;varying vec3 col;varying vec3 normal;varying vec3 pos;varying vec2 tex;void main(){pos=p;normal=n;col=c;tex=uv;gl_Position=vp*vec4(p,1.);}`;
  const fragment=`precision mediump float;varying vec3 col;varying vec3 normal;varying vec3 pos;varying vec2 tex;uniform sampler2D material;uniform vec3 eye;uniform vec3 fogColor;void main(){float light=.48+.52*max(0.,dot(normalize(normal),normalize(vec3(-.5,1.,.35))));vec3 color=col*texture2D(material,tex).rgb*light;float fog=smoothstep(22.,65.,distance(pos,eye));gl_FragColor=vec4(mix(color,fogColor,fog*.8),1.);}`;
  function shader(type,code){const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
  const program=gl.createProgram(),shaders=[shader(gl.VERTEX_SHADER,vs),shader(gl.FRAGMENT_SHADER,fragment)];for(const s of shaders)gl.attachShader(program,s);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
  const atlas=document.createElement('canvas');atlas.width=2048;atlas.height=128;const ctx=atlas.getContext('2d');
  for(let type=0;type<16;type++){const left=type*128;ctx.fillStyle='#ffffff';ctx.fillRect(left,0,128,128);if(type===0||type===1||type===15){TerrainModels.material(ctx,left,type)}else if(type<4){ctx.strokeStyle=['#e3e7dd','#dae2d1','#dde4dc','#eee4cb'][type];ctx.lineWidth=type===1?2:1;for(let n=0;n<128;n+=type===1?16:32){ctx.beginPath();ctx.moveTo(left+n,0);ctx.lineTo(left+n,128);ctx.stroke();if(type!==2){ctx.beginPath();ctx.moveTo(left,n);ctx.lineTo(left+128,n);ctx.stroke()}}}else if(TerrainModels.labels[type-4]){ctx.fillStyle='#eee0b9';ctx.fillRect(left,0,128,128);ctx.strokeStyle='#725229';ctx.lineWidth=5;ctx.strokeRect(left+4,4,120,120);ctx.fillStyle='#171717';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold '+Math.min(34,Math.floor(110/TerrainModels.labels[type-4].length))+'px Microsoft JhengHei, sans-serif';ctx.save();ctx.translate(left+64,64);ctx.scale(1,3.25);ctx.fillText(TerrainModels.labels[type-4],0,0);ctx.restore()}}
  const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlas);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  const buffers=[gl.createBuffer(),gl.createBuffer(),gl.createBuffer()];const attrs=[['p',3,0],['n',3,12],['c',3,24],['uv',2,36]].map(([key,n,offset])=>({location:gl.getAttribLocation(program,key),n,offset}));const vp=gl.getUniformLocation(program,'vp'),eye=gl.getUniformLocation(program,'eye'),fogColor=gl.getUniformLocation(program,'fogColor'),actorPass=SpriteActors.pass(gl);let staticCount=0,detailCount=0,groups=[];
  function bind(buffer){gl.bindBuffer(gl.ARRAY_BUFFER,buffer);for(const a of attrs){gl.enableVertexAttribArray(a.location);gl.vertexAttribPointer(a.location,a.n,gl.FLOAT,false,44,a.offset)}}
  function setStatic(data){const buckets=new Map();for(let i=0;i<data.length;i+=33){const x=(data[i]+data[i+11]+data[i+22])/3,z=(data[i+2]+data[i+13]+data[i+24])/3,key=Math.floor(x/12)+','+Math.floor(z/12);if(!buckets.has(key))buckets.set(key,{values:[],minX:Infinity,maxX:-Infinity,minZ:Infinity,maxZ:-Infinity,minY:Infinity,maxY:-Infinity});const group=buckets.get(key);for(let k=0;k<33;k++)group.values.push(data[i+k]);for(let k=0;k<33;k+=11){group.minX=Math.min(group.minX,data[i+k]);group.maxX=Math.max(group.maxX,data[i+k]);group.minZ=Math.min(group.minZ,data[i+k+2]);group.maxZ=Math.max(group.maxZ,data[i+k+2]);group.minY=Math.min(group.minY,data[i+k+1]);group.maxY=Math.max(group.maxY,data[i+k+1])}}const sorted=new Float32Array(data.length);groups=[];let offset=0;for(const group of buckets.values()){sorted.set(group.values,offset);const cx=(group.minX+group.maxX)/2,cz=(group.minZ+group.maxZ)/2,r=Math.hypot(group.maxX-group.minX,group.maxZ-group.minZ)/2+7;groups.push({first:offset/11,count:group.values.length/11,cx,cz,r,lo:[group.minX,group.minY,group.minZ],hi:[group.maxX,group.maxY,group.maxZ]});offset+=group.values.length}bind(buffers[0]);gl.bufferData(gl.ARRAY_BUFFER,sorted,gl.STATIC_DRAW);staticCount=data.length/11;return {data:sorted,groups}}
  function setDetails(data){bind(buffers[2]);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);detailCount=data.length/11}
  function render(camera,dynamic,actors=[],sky=[.65,.75,.70]){gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(...sky,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.useProgram(program);gl.bindTexture(gl.TEXTURE_2D,texture);gl.uniformMatrix4fv(vp,false,camera.matrix);gl.uniform3fv(eye,camera.eye);gl.uniform3fv(fogColor,sky);bind(buffers[0]);const planes=frustumPlanes(camera);for(const group of groups){if(Math.hypot(group.cx-camera.eye[0],group.cz-camera.eye[2])>65+group.r||!inFrustum(planes,group))continue;gl.drawArrays(gl.TRIANGLES,group.first,group.count)}if(detailCount){bind(buffers[2]);gl.drawArrays(gl.TRIANGLES,0,detailCount)}if(dynamic.length){bind(buffers[1]);gl.bufferData(gl.ARRAY_BUFFER,dynamic,gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,dynamic.length/11)}actorPass.draw(camera,actors)}
  return {setStatic,setDetails,render,get detailVertices(){return detailCount},get spriteStatus(){return actorPass.status},dispose(){actorPass.dispose();for(const b of buffers)gl.deleteBuffer(b);gl.deleteTexture(texture);gl.deleteProgram(program);for(const s of shaders)gl.deleteShader(s);gl.getExtension('WEBGL_lose_context')?.loseContext()},gl};
 }
 document.addEventListener('visibilitychange',()=>{if(battleView)battleView.lastAt=null});
 const staticCache=new WeakMap(),occlusionCache=new WeakMap();let canvas,mini,main,worldRef,labels,W=0,H=0,camera,camYaw=0,camPitch=.08,distance=15,battleView=null,lastMini=0,frameCount=0,error=null,forceRedraw=false,detailWorld=null,detailCell='';
 function init(c,m){canvas=c;mini=m;labels=document.createElement('div');labels.className='world-labels';c.parentElement.appendChild(labels);try{main=engine(c)}catch(e){error=e.message;const warning=document.createElement('p');warning.className='webgl-warning';warning.textContent=error;c.parentElement.appendChild(warning)}resize();window.addEventListener('resize',resize)}
 function resize(){if(!canvas)return;const r=canvas.getBoundingClientRect();W=Math.max(1,r.width);H=Math.max(1,r.height);const ratio=Math.min(devicePixelRatio||1,W<600?1.25:1.5);canvas.width=Math.round(W*ratio);canvas.height=Math.round(H*ratio);worldRef=null}
 function scene(w){const base=geometry(),g=base;if(w.interior)g.box(w.width/2,-.14,w.height/2,w.width,.20,w.height,[.55,.40,.27],0,3);else TerrainModels.ground(g,w);for(let y=0;y<w.height;y++)for(let x=0;x<w.width;x++){const type=w.tiles[y*w.width+x];if(type===1)TerrainModels.road(g,w,x,y);if(type===2)g.box(x+.5,-.055,y+.5,1,.04,1,w.palette?.water||color.water);if(type===3)TerrainModels.bridge(g,x,y);if(type===4)g.box(x+.5,.85+World.elevation(w,x+.5,y+.5),y+.5,1,1.8,1,color.wall);if(!w.interior&&type===7&&(x===1||x===20||y===1))g.box(x+.5,1.2,y+.5,1,2.5,1,[.71,.64,.48]);if(type===8)g.box(x+.5,-.005,y+.5,.96,.025,1,[.45,.24,.21])}
  if(w.interior)TerrainModels.interiorShell(g,w);
  for(const p of w.props){const x=p.x+.5,z=p.y+.5,h=World.elevation(w,p.type==='house'?p.x+p.w/2:x,p.type==='house'?p.y+p.h/2:z),g=raised(base,h);
   if(p.type==='tree')TerrainModels.tree(g,p,Story.chapters[Game?.state?.chapter||0]?.season==='春');
   else if(p.type==='house'){const cx=p.x+p.w/2,cz=p.y+p.h/2;g.box(cx,1.45,cz,p.w,2.9,p.h,[.73,.66,.48],0,3);g.roof(cx,2.9,cz,p.w+.8,p.h+.8,1.8,color.roof);g.box(cx,.90,p.y+p.h+.012,1.65,1.8,.035,[.27,.24,.17]);g.sign(cx,1.50,p.y+p.h+.040,1.58,.48,4+TerrainModels.labels.indexOf(p.label));for(let i=1;i<p.w-1;i++){if(Math.abs(i-p.w/2)<1)continue;g.box(p.x+i,1.45,p.y+p.h+.028,.40,.7,.05,[.19,.29,.26])}}
   else if(p.type==='furniture'){const cx=p.x+p.w/2,cz=p.y+p.h/2;g.box(cx,.45,cz,p.w*.92,.9,p.h*.92,p.kind==='bed'?[.65,.73,.64]:color.wood,0,3);if(p.kind==='board'){g.box(cx,1.85,cz,p.w*.95,1.2,.12,[.16,.31,.25]);for(let i=0;i<4;i++)g.box(cx-1.3+i*.6,1.87,cz+.075,.35,.04,.02,[.91,.87,.70])}if(p.kind==='rack')for(let i=0;i<3;i++)g.box(cx-.45+i*.45,1.4,cz,.06,1.9,.08,[.71,.77,.74],0,2);if(p.kind==='shelf'||p.kind==='medicine')for(let i=0;i<p.w*3;i++)g.box(p.x+.2+i*.3,1.03,cz,.19,.35,.25,[.39+(i%3)*.13,.48,.35]);if(p.kind==='bed')g.box(cx,.92,cz,p.w*.82,.06,p.h*.86,[.78,.85,.76]);if(p.kind==='forge')g.box(cx,.83,cz,.9,.65,.6,[.29,.27,.23]);if(p.kind==='sacks')for(let i=0;i<3;i++)g.cone(cx-.35+i*.32,.92,cz,.27,.6,[.76,.63,.40],7)}
   else if(TerrainModels.landmark(g,p,w)){}else if(p.type==='mountain')g.cone(x,0,z,2.2,5.5,[.35,.44,.36],7);else if(p.type==='rock')TerrainModels.rock(g,p);else if(p.type==='tent')g.cone(x,0,z,1.1,1.9,[.67,.54,.35],4);else if(p.type==='boat')g.box(x,.04,z,1.6,.35,.7,color.wood);else if(p.type==='field')g.box(x,.07,z,1.4,.14,.8,[.35,.46,.23]);else if(p.type==='shrine'){g.box(x,.40,z,.6,.8,.6,[.53,.59,.48]);g.roof(x,.8,z,.9,.9,.5,color.roof)}
  }return g.data();
 }
 function visible(w,s){return w.entities.filter(e=>Core.canChallenge(s,e)&&!(s.flags[s.chapter+'-'+e.id]&&['enemy','boss','chest','cargo','animal'].includes(e.type))&&!(!e.entrance&&s.active.includes(e.name)))}
 function person(g,actors,name,x,z,yaw,moving,t,chapter,detail=1,pose=null,tempo=1){
  if(SpriteActors.add(actors,name.split('・')[0],chapter,x,z,yaw,moving,t,{tempo,swing:pose?.swing,enemy:pose?.enemy})){
   g.ellipsoid(x,.007,z,.30,.009,.22,[.23,.27,.20],0,10,4);return;
  }ActorModels.person(g,name,x,z,yaw,moving,t*tempo,detail,pose);
 }
 function animal(g,actors,species,x,z,yaw,moving,t,chapter,detail=1){
  const name={deer:'鹿',sheep:'羊',pig:'豬',lion:'獅子',tiger:'老虎',leopard:'豹',baboon:'狒狒'}[species];
  if(SpriteActors.add(actors,name,chapter,x,z,yaw,moving,t)){g.ellipsoid(x,.007,z,.55,.009,.40,[.23,.27,.20],0,10,4);return}
  ActorModels.animal(g,species,x,z,yaw,moving,t,detail);
 }
 function entity(g,e,t,actors,chapter){const h=World.elevation(worldRef,e.x+.5,e.y+.5),before=actors.length;drawEntity(raised(g,h),e,t,actors,chapter);for(let i=before;i<actors.length;i++)actors[i].base+=h}
 function drawEntity(g,e,t,actors,chapter){const x=e.x+.5,z=e.y+.5;
  if(e.entrance){g.box(x,.035,z,.72,.05,.45,[.83,.70,.35]);return}if(e.type==='animal'){animal(g,actors,e.species,x,z,e.facingYaw??yawOf(e.dir),e.moving,t,chapter,Math.hypot(x-camera.eye[0],z-camera.eye[2])>10?0:1);return}
  if(['clue','recruit','side','poet','scribe','captain','armory','academy','shop','clinic','granary','innkeeper','guide','enemy','boss'].includes(e.type)){person(g,actors,e.type==='enemy'?e.name+'・'+e.id:e.name,x,z,e.facingYaw??yawOf(e.dir),e.moving,t,chapter,Math.hypot(x-camera.eye[0],z-camera.eye[2])>10?0:1,null,e.walkTempo||1);return}
  if(e.type==='camp'){g.cone(x,0,z,.95,1.45,[.74,.65,.45],4);g.box(x-1,.95,z,.045,1.9,.05,color.wood);g.box(x-.65,1.7,z,.7,.32,.04,[.57,.20,.15])}
  else if(e.type==='chest'||e.type==='cargo'){g.box(x,.26,z,.6,.5,.44,[.50,.35,.18],0,3);g.box(x,.32,z+.23,.07,.20,.03,[.81,.67,.29])}
  else if(e.type==='puzzle'){g.box(x,.27,z,.85,.55,.8,[.42,.52,.43]);g.box(x,.8,z,.40,.65,.35,[.50,.62,.50]);g.box(x,.82,z+.18,.12,.15,.015,[.50,.86,.72])}
  else if(e.type==='exit'||e.type==='previous-exit'){SpriteActors.gate(actors,e);g.box(x,.025,z,3.8,.04,.48,[.49,.44,.31])}
  else if(e.type==='room-exit')g.box(x,.03,z,.8,.05,.55,[.84,.71,.40]);else if(e.type==='room-note'){g.box(x,.75,z,.55,1.5,.12,color.wood);g.box(x,.92,z+.07,.42,.5,.025,[.88,.80,.59])}
 }

 function characterClass(e,s){
  if(e.type==='enemy'||e.type==='boss')return 'enemy';
  if(e.type==='animal')return e.fierce?'beast':'animal';
  if(e.name==='劉備'||s.active.includes(e.name)||e.type==='recruit')return 'ally';
  if(e.type==='academy'||e.type==='scribe')return 'scholar';
  if(e.type==='clinic')return 'doctor';
  if(['shop','armory','granary','innkeeper'].includes(e.type))return 'merchant';
  if(e.type==='captain'||e.type==='guide')return 'guard';
  return 'civilian';
 }
 const isPerson=e=>!e.entrance&&['clue','recruit','side','poet','scribe','captain','armory','academy','shop','clinic','granary','innkeeper','guide','enemy','boss','animal'].includes(e.type);
 function labelPosition(w,e){const p=baseLabelPosition(w,e);p[1]+=World.elevation(w,p[0],p[2]);return p}
 function baseLabelPosition(w,e){
if(e.type==='room-exit'){const door=TerrainModels.exitGeometry(w);return [door.x,door.labelY,door.z-.27]}if(e.entrance){const house=w.props.find(p=>p.type==='house'&&p.label===e.name.replace('・入口',''));if(house)return [house.x+house.w/2,5.15,house.y+house.h/2]}if(e.type==='exit'||e.type==='previous-exit')return [e.x+.5,5.1,e.y+.5];const bounds=SpriteActors.bounds(e.name,Game.state.chapter);return [e.x+.5,(bounds?.height||(['enemy','boss'].includes(e.type)?1.95:1.85))+.18,e.y+.5]}
 function labelClear(w,e){const p=labelPosition(w,e),d=p.map((v,i)=>v-camera.eye[i]),length=Math.hypot(...d);return !occluded({o:camera.eye,d:normalize(d)},occlusionCache.get(w),length)}
 function project(x,y,z){if(!camera)return null;const m=camera.matrix,p=[x,y,z,1],v=Array.from({length:4},(_,r)=>m[r]*p[0]+m[4+r]*p[1]+m[8+r]*p[2]+m[12+r]);if(v[3]<=0||v[2]/v[3]>1)return null;return {x:(v[0]/v[3]+1)*W/2,y:(1-v[1]/v[3])*H/2}}
 function draw(w,s,player,t,route){if(!main||!W)return;if(!document.getElementById('pause-menu').hidden||document.hidden){if(battleView)battleView.lastAt=null;return;}if(!forceRedraw&&worldRef===w&&(!document.getElementById('modal').hidden||!document.getElementById('cutscene').hidden)){if(battleView)updateBattle(t);return}if(worldRef!==w){worldRef=w;if(!staticCache.has(w))staticCache.set(w,scene(w));const index=main.setStatic(staticCache.get(w));staticCache.set(w,index.data);occlusionCache.set(w,index)}const radius=W<600?8:11,cx=Math.floor(player.x/4)*4+2,cy=Math.floor(player.y/4)*4+2,key=cx+'|'+cy+'|'+radius;if(detailWorld!==w||detailCell!==key){const detail=geometry();TerrainModels.groundcover(detail,w,cx,cy,radius);main.setDetails(detail.data());detailWorld=w;detailCell=key}const px=player.x+.5,pz=player.y+.5,eye=[px,1.58+World.elevation(w,px,pz),pz],forward=[Math.sin(camYaw)*Math.cos(camPitch),-Math.sin(camPitch),Math.cos(camYaw)*Math.cos(camPitch)];camera=cameraMatrix(eye,eye.map((v,i)=>v+forward[i]),W/H);const g=geometry(),actors=[],shown=visible(w,s).filter(e=>Math.hypot(e.x-player.x,e.y-player.y)<33);
  for(const e of shown)entity(g,e,t,actors,s.chapter);
  for(let i=0;i<route.length;i+=3){const p=route[i];g.box(p.x+.5,.025+World.elevation(w,p.x+.5,p.y+.5),p.y+.5,.13,.05,.13,[.92,.80,.42])}
  if(!w.interior)for(let y=Math.max(1,Math.floor(player.y)-18);y<Math.min(w.height-1,player.y+18);y+=2)for(let x=Math.max(1,Math.floor(player.x)-23);x<Math.min(w.width-1,player.x+23);x+=3)if(w.tiles[Math.floor(y)*w.width+x]===2)g.box(x+.5+Math.sin(y+t)*.3,-.02,y+(t*.9)%1,.7,.01,.035,[.63,.82,.78]);
  for(const p of w.props.filter(p=>p.kind==='forge'))g.cone(p.x+p.w/2,.92,p.y+p.h/2,.30,.48+Math.sin(t*7)*.15,[.99,.53,.16],7);
  main.render(camera,g.data(),actors,w.palette?.sky);forceRedraw=false;frameCount++;
  if(frameCount%6===0){labels.replaceChildren();for(const e of shown.filter(e=>!['chest','cargo','room-exit'].includes(e.type))){const pos=project(...labelPosition(w,e));if(!pos||pos.x<0||pos.x>W||pos.y<0||pos.y>H||Math.hypot(e.x-player.x,e.y-player.y)>22||!labelClear(w,e))continue;const node=document.createElement('span');node.className='world-label'+(isPerson(e)?' name-tag name-'+characterClass(e,s):'');node.textContent=e.entrance?e.name.replace('・入口',''):e.name;node.style.left=pos.x+'px';node.style.top=pos.y+'px';labels.appendChild(node)}}
  if(performance.now()-lastMini>200){lastMini=performance.now();map(mini,w,s,player);const navigation=document.getElementById('navigation-map');if(navigation)map(navigation,w,s,player)}if(battleView)updateBattle(t);
 }
 function map(c,w,s,player){const ctx=c.getContext('2d'),sx=c.width/w.width,sy=c.height/w.height;ctx.fillStyle=w.interior?'#ac926e':'#7f956b';ctx.fillRect(0,0,c.width,c.height);for(let y=0;y<w.height;y++)for(let x=0;x<w.width;x++){const type=w.tiles[y*w.width+x];if(type){ctx.fillStyle=w.blocked[y*w.width+x]&&type!==2?'#465847':type===2?'#588a8e':'#bcad85';ctx.fillRect(x*sx,y*sy,sx+1,sy+1)}}for(const e of visible(w,s)){if(e.type==='animal'||(e.type==='enemy'&&e.hidden))continue;ctx.fillStyle=e.type==='enemy'||e.type==='boss'?'#b65542':e.entrance?'#f4d577':'#efdca4';ctx.fillRect(e.x*sx-2,e.y*sy-2,4,4)}for(const e of visible(w,s).filter(e=>['exit','previous-exit'].includes(e.type))){
 const x=(e.x+.5)*sx,y=(e.y+.5)*sy,r=Math.max(9,Math.min(13,c.width/40));
 ctx.fillStyle=e.type==='exit'?'#e00020':'#184ba0';ctx.strokeStyle='#fff';ctx.lineWidth=Math.max(1.5,r*.18);
 ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+r,y);ctx.lineTo(x,y+r);ctx.lineTo(x-r,y);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#fff';ctx.font='bold '+Math.max(12,r)+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(e.type==='exit'?'下':'上',x,y+.4);
 }ctx.fillStyle='#fffaf0';ctx.beginPath();ctx.arc((player.x+.5)*sx,(player.y+.5)*sy,3,0,7);ctx.fill()}
 function ray(x,y){if(!camera)return null;const nx=x/W*2-1,ny=1-y/H*2,tan=Math.tan(.52);return {o:camera.eye,d:camera.forward.map((v,i)=>v+camera.right[i]*nx*tan*camera.aspect+camera.up[i]*ny*tan)}}
 function toWorld(x,y){const r=ray(x,y);if(!r||!worldRef)return {x:-1,y:-1};let prev=0;for(let t=.1;t<150;t+=.25){const px=r.o[0]+r.d[0]*t,pz=r.o[2]+r.d[2]*t;if(px<0||pz<0||px>=worldRef.width||pz>=worldRef.height){prev=t;continue}if(r.o[1]+r.d[1]*t<=World.elevation(worldRef,px,pz)){let lo=prev,hi=t;for(let i=0;i<12;i++){const mid=(lo+hi)/2,mx=r.o[0]+r.d[0]*mid,mz=r.o[2]+r.d[2]*mid;if(r.o[1]+r.d[1]*mid>World.elevation(worldRef,mx,mz))lo=mid;else hi=mid}return {x:Math.round(r.o[0]+r.d[0]*hi-.5),y:Math.round(r.o[2]+r.d[2]*hi-.5)}}prev=t}return {x:-1,y:-1}}
 function hitBox(r,lo,hi){let near=0,far=Infinity;for(let i=0;i<3;i++){if(Math.abs(r.d[i])<1e-9){if(r.o[i]<lo[i]||r.o[i]>hi[i])return null;continue}const a=(lo[i]-r.o[i])/r.d[i],b=(hi[i]-r.o[i])/r.d[i];near=Math.max(near,Math.min(a,b));far=Math.min(far,Math.max(a,b));if(far<near)return null}return far>=0?near:null}
 function occluded(r,data,limit){if(!data)return false;if(data.groups){for(const group of data.groups){const near=hitBox(r,group.lo,group.hi);if(near!==null&&near<limit&&occluded(r,data.data.subarray(group.first*11,(group.first+group.count)*11),limit))return true}return false}for(let i=0;i<data.length;i+=33){const ax=data[i],ay=data[i+1],az=data[i+2],ex=data[i+11]-ax,ey=data[i+12]-ay,ez=data[i+13]-az,fx=data[i+22]-ax,fy=data[i+23]-ay,fz=data[i+24]-az,px=r.d[1]*fz-r.d[2]*fy,py=r.d[2]*fx-r.d[0]*fz,pz=r.d[0]*fy-r.d[1]*fx,det=ex*px+ey*py+ez*pz;if(Math.abs(det)<1e-8)continue;const inv=1/det,tx=r.o[0]-ax,ty=r.o[1]-ay,tz=r.o[2]-az,u=(tx*px+ty*py+tz*pz)*inv;if(u<0||u>1)continue;const qx=ty*ez-tz*ey,qy=tz*ex-tx*ez,qz=tx*ey-ty*ex,v=(r.d[0]*qx+r.d[1]*qy+r.d[2]*qz)*inv;if(v<0||u+v>1)continue;const t=(fx*qx+fy*qy+fz*qz)*inv;if(t>1e-5&&t<limit-1e-4)return true}return false}
 function pick(w,s,x,y){const r=ray(x,y);if(!r||worldRef!==w)return null;const candidates=visible(w,s).filter(e=>Math.hypot(e.x+.5-r.o[0],e.y+.5-r.o[2])<40);const named=candidates.filter(e=>!['enemy','animal','chest','cargo'].includes(e.type)).map(e=>({e,p:project(...labelPosition(w,e)),d:Math.hypot(e.x+.5-r.o[0],e.y+.5-r.o[2])})).filter(({e,p})=>p&&labelClear(w,e)&&x>=p.x-(e.name.length*11+14)/2&&x<=p.x+(e.name.length*11+14)/2&&y>=p.y-23&&y<=p.y+2).sort((a,b)=>a.d-b.d);if(named.length)return named[0].e;
  const hits=[];for(const e of candidates){const bounds=SpriteActors.bounds(e.name,s.chapter),door=e.type==='room-exit'?TerrainModels.exitGeometry(w):null,h=door?3.2:['exit','previous-exit'].includes(e.type)?4.8:e.entrance?.12:bounds?bounds.height:e.type==='animal'?ActorModels.animalBounds(e.species).height:e.type==='chest'||e.type==='cargo'?.6:e.type==='puzzle'?1.2:2.05,radius=door?door.width/2:['exit','previous-exit'].includes(e.type)?1.9:bounds?bounds.radius:e.type==='animal'?ActorModels.animalBounds(e.species).radius:.56,z=door?door.z:e.y+.5,depth=door?.34:['exit','previous-exit'].includes(e.type)?.2:radius,base=World.elevation(w,e.x+.5,e.y+.5),t=hitBox(r,[e.x+.5-radius,base,z-depth],[e.x+.5+radius,base+h,z+depth]);if(t!==null)hits.push({e,t})}hits.sort((a,b)=>a.t-b.t);for(const hit of hits)if(!occluded(r,occlusionCache.get(w),hit.t))return hit.e;return null;
 }

 function refresh(){forceRedraw=true}
 function rotate(dx,dy){camYaw-=dx*.005;camPitch=Math.max(-1.15,Math.min(1.15,camPitch+dy*.004))}function zoom(amount){/* First-person viewpoint stays at the hero's eyes. */}

 function releaseBattle(){
  if(!battleView)return;const old=battleView;battleView=null;old.action?.resolve(false);old.engine.dispose();old.effects.remove();old.names.remove();
 }
 function mountBattle(c,s,e){
  releaseBattle();
  const eng=engine(c),g=geometry();
  g.box(0,-.12,0,13,.2,8,[.40,.47,.31]);
  for(const x of [-4.8,4.8]){g.box(x,1.3,-2.0,.09,2.6,.09,color.wood);g.box(x+.33,2.28,-2.0,.65,.48,.035,[.56,.20,.15]);}
  for(let i=0;i<5;i++)g.cone(-6+i*3,-.05,-5,2.2,2.6+(i%2),[.31,.42,.33],9);
  eng.setStatic(g.data());
  const effects=document.createElement('canvas');effects.className='battle-effects';effects.setAttribute('aria-hidden','true');c.after(effects);
  const names=document.createElement('div');names.className='battle-name-tags';c.after(names);
  battleView={canvas:c,effects,names,nameNodes:[],ctx:effects.getContext('2d'),engine:eng,s,e,lastAt:null,action:null};
  updateBattle(0);
 }
 function updateBattle(t){
  if(!battleView)return;if(!battleView.canvas.isConnected){releaseBattle();return}
  const view=battleView,{canvas:c,effects,ctx,engine:eng,s,e}=view,g=geometry(),actors=[],rect=c.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,1.25);
  if(rect.width<=0||rect.height<=0){view.lastAt=null;return}
  const cw=Math.max(1,Math.round(rect.width*ratio)),ch=Math.max(1,Math.round(rect.height*ratio));
  if(c.width!==cw||c.height!==ch){c.width=effects.width=cw;c.height=effects.height=ch}
  else if(effects.width!==cw||effects.height!==ch){effects.width=cw;effects.height=ch}
  const now=performance.now(),a=view.action;
  if(a){a.elapsed+=view.lastAt===null?0:Math.max(0,now-view.lastAt);if(a.elapsed>=a.duration){view.action=null;a.resolve(true)}}
  view.lastAt=now;
  const current=view.action,pose=BattleEffects.pose(current),weapon=s.gear?.equipped.weapon;
  const heroPose={swing:pose.heroSwing,weapon:weapon==='iron_spear'?'spear':weapon==='dragon_blade'?'dragon':'blade'};
  person(g,actors,'劉備',pose.heroX,0,Math.PI/2,!!current&&!current.reduced,t,s.chapter,1,heroPose);
  s.active.forEach((name,i)=>{const p=[[-3.0,-.1],[-4.2,-.1],[-5.4,-.1]][i]||[-6.6-i*.8,-.1];
   person(g,actors,name,p[0],p[1],Math.PI/2,false,t,s.chapter,1,name==='關羽'?{swing:null,weapon:'dragon'}:null)});
  if(e.type==='animal')animal(g,actors,e.species,pose.enemyX,0,-Math.PI/2,!!current&&!current.correct&&!current.reduced,t,s.chapter);
  else person(g,actors,e.type==='enemy'?e.name+'・'+e.id:e.name,pose.enemyX,0,-Math.PI/2,!!current&&!current.correct&&!current.reduced,t,s.chapter,1,{swing:pose.enemySwing,weapon:ActorModels.weaponFor(e.name),enemy:true},1);
  
  const participants=[{name:'劉備',type:'recruit',x:-1.8,z:0,nowX:pose.heroX},...s.active.map((name,i)=>({name,type:'recruit',x:-3-i*1.2,z:-.1})),{...e,x:1.8,z:0,nowX:pose.enemyX}];
  const bounds=participants.map(p=>{const a=SpriteActors.bounds(p.name,s.chapter)||(p.type==='animal'?ActorModels.animalBounds(p.species):{height:2.4,radius:.55});return {...p,height:a.height,radius:a.radius}});
  const low=Math.min(...bounds.map(p=>p.x-p.radius)),high=Math.max(...bounds.map(p=>p.x+p.radius)),height=Math.max(...bounds.map(p=>p.height))+.24,center=(low+high)/2,aspect=cw/ch;
  const z=Math.max(height/(2*Math.tan(.52)*.80),(high-low)/(2*Math.tan(.52)*aspect*.89))+.13,shake=current&&!current.reduced?pose.recoil*.08:0,targetY=height*.53;
  const viewCamera=cameraMatrix([center+shake,targetY,z],[center,targetY,0],aspect);

  eng.render(viewCamera,g.data(),actors);
  const projectBattle=(x,y,z)=>{const m=viewCamera.matrix,p=[x,y,z,1],v=Array.from({length:4},(_,r)=>m[r]*p[0]+m[4+r]*p[1]+m[8+r]*p[2]+m[12+r]);return v[3]>0?{x:(v[0]/v[3]+1)*cw/2,y:(1-v[1]/v[3])*ch/2}:null};
  
  while(view.nameNodes.length<bounds.length){const node=document.createElement('span');node.className='world-label name-tag';view.names.appendChild(node);view.nameNodes.push(node)}
  bounds.forEach((p,i)=>{const node=view.nameNodes[i],pos=projectBattle(p.nowX??p.x,p.height+.08,p.z);node.textContent=p.name;node.className='world-label name-tag name-'+characterClass(p,s);node.hidden=!pos;if(pos){node.style.left=pos.x/ratio+'px';node.style.top=pos.y/ratio+'px'}});
  if(ctx)BattleEffects.draw(ctx,cw,ch,current,projectBattle);

 }
 function feedbackBattle(correct,options={}){
  if(!battleView)return {label:'算策命中',finished:Promise.resolve(false)};
  battleView.action?.resolve(false);
  const reduced=document.body.classList.contains('reduce-motion')||matchMedia('(prefers-reduced-motion:reduce)').matches;
  const a=BattleEffects.action(correct,{...options,reduced,animal:battleView.e.type==='animal',lightning:correct&&(options.combo>=3&&options.combo%3===0||battleView.s.active.includes('諸葛亮'))});
  const finished=new Promise(resolve=>{a.resolve=resolve});
  battleView.action=a;battleView.lastAt=performance.now();
  updateBattle(0);
  return {label:a.label,finished};
 }

 return {init,resize,draw,refresh,map,toWorld,rotate,zoom,mountBattle,feedbackBattle,visible,project,pick,get yaw(){return camYaw},get status(){return {mode:'WebGL 3D',view:'first-person',ready:!!main,error,frames:frameCount,yaw:camYaw,pitch:camPitch,eye:camera?.eye.slice(),actorStyle:'eight-views',actors:main?.spriteStatus,grassVertices:main?.detailVertices,battleActors:battleView?.engine.spriteStatus}},resetCamera(yaw=0){camYaw=yaw;camPitch=.08}};
})();
