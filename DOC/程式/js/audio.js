/* Local-file audio only. Add tracks through audio-catalog.js. */
var AudioSystem=(()=>{
 const music=new Audio(),effectPlayer=new Audio();music.preload='metadata';effectPlayer.preload='metadata';music.volume=.32;effectPlayer.volume=.65;
 let enabled=true,effects=true,active=false,hidden=false,currentScene='explore',errors=0;
 const suspended=new Set();
 const positions={explore:{index:0,time:0},battle:{index:0,time:0}};
 const playlist=()=>AudioCatalog[currentScene]||[];
 function play(player){if(hidden||suspended.size||player===music&&(!active||!enabled))return;const promise=player.play();if(promise?.catch)promise.catch(()=>{});}
 function loadTrack(){const list=playlist();if(!list.length){music.pause();return}const pos=positions[currentScene];pos.index%=list.length;music.src=list[pos.index];music.load();try{music.currentTime=pos.time}catch{}if(active&&enabled&&!hidden)play(music)}
 music.addEventListener('loadedmetadata',()=>{const t=positions[currentScene].time;if(t>0&&t<music.duration)music.currentTime=t});
 music.addEventListener('ended',()=>{const list=playlist();if(!list.length)return;const pos=positions[currentScene];pos.index=(pos.index+1)%list.length;pos.time=0;errors=0;loadTrack()});
 music.addEventListener('error',()=>{if(++errors>=playlist().length){music.pause();return}const pos=positions[currentScene];pos.index++;pos.time=0;loadTrack()});
 function activate(){active=true;if(!music.src)loadTrack();else if(enabled&&!hidden)play(music)}
 function configure(options){if(Number.isFinite(options.volume))music.volume=Math.max(0,Math.min(1,options.volume));if(typeof options.music==='boolean')enabled=options.music;if(typeof options.effects==='boolean')effects=options.effects;if(!enabled)music.pause();else if(active&&!hidden){if(!music.src)loadTrack();else play(music)}if(!effects)effectPlayer.pause()}
 function scene(name){if(!positions[name]||name===currentScene)return;positions[currentScene].time=music.currentTime||0;music.pause();currentScene=name;errors=0;loadTrack()}
 function effect(name){if(!effects||!active||hidden||suspended.size)return;const list=AudioCatalog.effects[name]||[];if(!list.length)return;effectPlayer.pause();const source=list[Math.floor(Math.random()*list.length)];if(effectPlayer.getAttribute('src')!==source)effectPlayer.src=source;else effectPlayer.currentTime=0;play(effectPlayer)}
 function visibility(value){hidden=value;if(hidden){music.pause();effectPlayer.pause()}else if(active&&enabled)play(music)}
 function suspend(reason='gallery'){suspended.add(reason);music.pause();effectPlayer.pause()}
 function resume(reason='gallery'){if(!suspended.delete(reason))return;if(active&&enabled&&!hidden&&!suspended.size){if(!music.src)loadTrack();else play(music)}}
 return {activate,configure,scene,effect,visibility,suspend,resume,get status(){return {volume:music.volume,scene:currentScene,index:positions[currentScene].index,music:enabled,effects,playing:!music.paused,source:music.src,time:music.currentTime||0,suspended:!!suspended.size}}};
})();

