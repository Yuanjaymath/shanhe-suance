/* Original canvas effects, layered over the real 3D arena. No downloads or bitmap sheets. */
var BattleEffects=(()=>{
 const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
 const smooth=n=>{n=clamp(n);return n*n*(3-2*n)};
 const labels={slash:'青鋒破陣',lightning:'天雷破陣',counter:'敵軍反擊',claw:'猛獸撲擊',guard:'護心符 · 格擋'};
 function action(correct,options={}){
  const type=correct?(options.lightning?'lightning':'slash'):options.guard?'guard':options.animal?'claw':'counter';
  return {type,label:labels[type],correct,damage:options.damage||0,win:!!options.win,elapsed:0,duration:options.reduced?650:1550,reduced:!!options.reduced};
 }
 function pose(a){
  if(!a)return {heroX:-1.8,enemyX:1.8,heroSwing:null,enemySwing:null,recoil:0};
  const p=clamp(a.elapsed/a.duration),strike=smooth((p-.22)/.27),returning=smooth((p-.66)/.30);
  const lunge=smooth((p-.14)/.24)*(1-returning)*2.1;
  const recoil=p>.46?Math.sin((p-.46)*24)*Math.exp(-(p-.46)*6)*.22:0;
  if(a.reduced)return {heroX:-1.8,enemyX:1.8,heroSwing:null,enemySwing:null,recoil:0};
  return {heroX:-1.8+(a.correct?lunge:-Math.abs(recoil)),enemyX:1.8+(a.correct?Math.abs(recoil):-lunge),
   heroSwing:a.correct&&p<.82?strike:null,enemySwing:!a.correct&&a.type==='counter'&&p<.82?strike:null,recoil};
 }
 function draw(ctx,w,h,a,project){
  ctx.clearRect(0,0,w,h);if(!a)return;
  const p=clamp(a.elapsed/a.duration);if(p>=1)return;
  const hero=project(-1.8,1.10,0),enemy=project(1.8,1.10,0);
  if(!hero||!enemy)return;
  const target=a.correct?enemy:hero,source=a.correct?hero:enemy;
  const scale=Math.max(12,Math.min(h*.28,w*.11)),fade=1-smooth((p-.72)/.28);
  ctx.save();
  const path=(points,width,color,blur=0)=>{
   ctx.beginPath();points.forEach((pt,i)=>i?ctx.lineTo(pt.x,pt.y):ctx.moveTo(pt.x,pt.y));
   ctx.lineWidth=width;ctx.strokeStyle=color;ctx.lineCap='round';ctx.lineJoin='round';ctx.shadowBlur=blur;ctx.shadowColor=color;ctx.stroke();
  };
  const circle=(x,y,r,color,width=2)=>{
   ctx.beginPath();ctx.arc(x,y,Math.max(1,r),0,Math.PI*2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
  };
  if(a.reduced){
   ctx.globalAlpha=.85*fade;circle(target.x,target.y,scale*.7,a.correct?'#f4cc54':'#a84832',3);
  }else{
   ctx.globalCompositeOperation='lighter';
   if(p<.40){
    const charge=Math.sin(clamp(p/.4)*Math.PI)*.65;ctx.globalAlpha=charge;
    ctx.shadowBlur=10;ctx.shadowColor=a.type==='lightning'?'#45afff':'#ffe291';
    circle(source.x,source.y,scale*(.20+p),a.correct?'#ffe193':'#f19376',3);
    for(let i=0;i<8;i++){const angle=i*Math.PI/4+p*4;
     const r=scale*(.35+.22*Math.sin(p*8));circle(source.x+Math.cos(angle)*r,source.y+Math.sin(angle)*r,2,'#fff3bc',2)}
   }
   const cut=clamp((p-.25)/.34);
   if(p>.25&&p<.76){
    const dx=target.x-source.x,dy=target.y-source.y;
    for(let i=2;i>=0;i--){
     const progress=clamp(cut-i*.09),x=source.x+dx*progress,y=source.y+dy*progress;
     const lean=(a.correct?1:-1),radius=scale*(.65+i*.16);
     ctx.globalAlpha=(.85-i*.20)*fade;ctx.shadowBlur=i?16:8;ctx.shadowColor=a.correct?'#ffce50':'#ee7255';
     ctx.beginPath();ctx.ellipse(x,y,radius*.62,radius*1.2,lean*-.65,-2.3+progress*.9,.7+progress*.6);
     ctx.lineWidth=i===0?Math.max(3,scale*.11):Math.max(4,scale*.18);
     ctx.strokeStyle=i===0?'#fffce1':a.correct?'#ffbf3f':'#ff785b';ctx.stroke();
    }
   }
   if(a.type==='lightning'&&p>.27&&p<.70){
    const alpha=clamp((p-.27)/.11)*fade;
    ctx.globalAlpha=alpha;
    for(let branch=0;branch<3;branch++){
     const end={x:target.x+(branch-1)*scale*.33,y:target.y+scale*.3};
     const start={x:target.x+(branch-1)*scale*1.1,y:Math.max(5,target.y-scale*2.6)};
     const points=[start];for(let i=1;i<9;i++){
      const f=i/9,jag=Math.sin(i*17+branch*9+Math.floor(p*12))*scale*.34;
      points.push({x:start.x+(end.x-start.x)*f+jag,y:start.y+(end.y-start.y)*f});
     }points.push(end);
     path(points,Math.max(4,scale*.13),'#378eff',18);path(points,Math.max(1.5,scale*.045),'#e5fcff',6);
    }
   }
   if(a.type==='claw'&&p>.3&&p<.70){
    ctx.globalAlpha=fade;
    for(let i=-1;i<=1;i++)path([{x:target.x-scale*.45+i*scale*.22,y:target.y-scale*.7},
      {x:target.x+scale*.45+i*scale*.22,y:target.y+scale*.55}],Math.max(3,scale*.07),'#ffbd99',8);
   }
   if(p>.43){
    const age=(p-.43)/.57,bloom=1-smooth(age);
    ctx.globalAlpha=bloom*.85;ctx.shadowBlur=14;ctx.shadowColor=a.correct?'#ffc44e':'#ff8065';
    const glow=ctx.createRadialGradient(target.x,target.y,0,target.x,target.y,scale*.95);
    glow.addColorStop(0,a.correct?'#fff4c7':'#ffd8bd');glow.addColorStop(.25,a.correct?'#ffc85299':'#f07b6599');glow.addColorStop(1,'#ffd16c00');
    ctx.fillStyle=glow;ctx.fillRect(target.x-scale,target.y-scale,scale*2,scale*2);
    circle(target.x,target.y,scale*(.35+age*1.25),a.type==='lightning'?'#80dfff':'#ffd771',Math.max(2,scale*.06));
    for(let i=0;i<22;i++){
     const angle=i*2.39996,speed=.55+(i%6)*.14,r=scale*(age*speed*2+.05);
     const x=target.x+Math.cos(angle)*r,y=target.y+Math.sin(angle)*r+age*age*scale*.7;
     path([{x,y},{x:x-Math.cos(angle)*scale*.13,y:y-Math.sin(angle)*scale*.13}],2.5,
      a.type==='lightning'?(i%2?'#a4e9ff':'#53aaff'):i%2?'#fff7c9':'#ffa641',5);
    }
   }
   if(a.type==='guard'&&p>.2){
    ctx.globalAlpha=fade*.8;ctx.shadowBlur=12;ctx.shadowColor='#50bdff';
    ctx.beginPath();ctx.ellipse(target.x,target.y,scale*.65,scale*1.0,0,0,Math.PI*2);
    ctx.strokeStyle='#84daff';ctx.lineWidth=4;ctx.stroke();
   }
  }
  // Damage is painted on an opaque cream plate so the number stays readable.
  if(p>.40){
   ctx.globalCompositeOperation='source-over';ctx.globalAlpha=fade;
   ctx.shadowBlur=0;const text=a.damage?'-'+a.damage:'格擋',size=clamp(h*.095,15,28);
   ctx.font='bold '+size+'px Microsoft JhengHei, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
   const tw=ctx.measureText(text).width+20,y=clamp(target.y-scale*.9-(p-.4)*scale*.8,size*.7,h-size*.7);
   ctx.fillStyle='#fff3d8';ctx.fillRect(target.x-tw/2,y-size*.65,tw,size*1.3);
   ctx.strokeStyle=a.correct?'#c49232':'#a4553f';ctx.lineWidth=2;ctx.strokeRect(target.x-tw/2,y-size*.65,tw,size*1.3);
   ctx.fillStyle='#171717';ctx.fillText(text,target.x,y);
  }
  ctx.restore();
 }
 return {action,pose,draw};
})();
