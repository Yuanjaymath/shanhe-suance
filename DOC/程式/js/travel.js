/* Movement costs only actual outdoor distance. Remainder survives save/reload. */
var Travel=(()=>{
 const normal=10,scout=15;
 function advance(s,distance,indoor=false){if(indoor||s.hp<=0||!Number.isFinite(distance)||distance<=0)return 0;const rate=s.active.includes('阿青')?scout:normal;s.travelDistance=(s.travelDistance||0)+distance;s.foodProgress=(s.foodProgress||0)+distance/rate;const spent=Math.floor(s.foodProgress+1e-8);s.foodProgress-=spent;const paid=Math.min(s.food,spent),missing=spent-paid;s.food-=paid;s.hp=Math.max(0,s.hp-missing*2);return spent}
 return {advance,normal,scout};
})();
