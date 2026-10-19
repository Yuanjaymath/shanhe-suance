/* Only unanswered enemy encounters accumulate pressure; learning activities remain untimed. */
var BattlePressure=(()=>{
 const labels=['簡單','一般','中等','進階','高難度'];
 const recipes=[
  'multiple digit zero_facts prime_factor_one factor_options',
  'factor_count prime_count rect_count factor_form factor_sum factor_pair gcd lcm coprime fraction_multiplier product_identity exponent_limit',
  'digit_cards product_primes product_form gcd3 lcm3 gcd_lcm_total exponent_common bus_time tree_spacing tile_square group_total ribbon common_count multiple_divisor both_divisible factor_list_gcd near_multiple weekday cube_cut cube_pack lamp_overlap state_cycle next_event factor_parameter division_tree division_missing inverse_identity pair_inverse factor_price semiprime prime_power exponent_divisor',
  'factor_rank password prime_boundary missing_prime remove_sequence digit_multi remainder_gcd same_remainder lap_meet period_compare gcd_candidates nested denominator factor_chain double_digit_min joined_rect board_partition rect_perimeter strip_alignment identity_reason largest_proper monotonic small_factor_gcd min_prime_sum power_reason coprime_ratio scaled_coprime triple_product strict_rect',
  'prime_parity equal_products rational_height exclude_multiples exact_two legend_inverse_filter legend_partition_remainder legend_area_cycles'
 ];
 const levels=new Map(recipes.flatMap((list,i)=>list.split(' ').map(name=>[name,i+1])));
 function rule(q={},s={}){
  let level=levels.get(q.recipe)||4;const v=q.values||{},numbers=[];
  const collect=value=>{if(typeof value==='number'&&Number.isFinite(value))numbers.push(Math.abs(value));else if(Array.isArray(value))value.forEach(collect);else if(value&&typeof value==='object')Object.values(value).forEach(collect)};collect(v);
  const largest=Math.max(0,...numbers);
  if(q.recipe==='digit')level=(v.ds?.length===1&&[2,5].includes(v.ds[0])&&!v.rem)?1:2;
  if(q.recipe==='factor_count'&&v.n<=36)level=1;
  if(['factor_count','factor_form','factor_sum','product_form','prime_count','rect_count','factor_pair'].includes(q.recipe)&&largest>=200)level=Math.min(4,level+1);
  if(q.recipe==='prime_count'&&v.hi-v.lo>40)level=Math.max(level,3);
  if(largest>=1000&&level<4)level++;
  if(Number.isInteger(q.pressureLevel)&&q.pressureLevel>=1&&q.pressureLevel<=5)level=q.pressureLevel;
  const rank=Progression.info(s).level,base=rank===1?10:rank<=5?15:rank<=8?20:25;
  return {level,label:level<=2?'簡單':'較難',difficultyLabel:labels[level-1],seconds:level<=2?10:20,damage:base+(level>=3?5:0)};
 }
 function create(q,b,s){if(!b||b.animal||b.done)return null;const r=rule(q,s);return {rule:r,remaining:r.seconds,pending:false,struck:false,attacks:0}}
 function tick(clock,elapsed,active){if(!clock||!active||clock.pending||!Number.isFinite(elapsed)||elapsed<=0)return false;clock.remaining=Math.max(0,clock.remaining-elapsed);if(clock.remaining>1e-7)return false;clock.remaining=0;clock.pending=true;return true}
 function strike(s,b,clock){
  if(!clock||!clock.pending||clock.struck||!b||b.done||s.gameOver||s.hp<=0)return {ignored:true};
  clock.rule=rule({pressureLevel:clock.rule.level},s);clock.struck=true;clock.attacks++;
  const guarded=!!b.guard,armor=Math.floor(Gear.defense(s)/2),ally=s.active.includes('張飛')?3:0,harm=guarded?0:Math.max(1,clock.rule.damage-armor-ally);
  b.guard=false;s.hp=Math.max(0,s.hp-harm);if(!s.hp)b.done=true;
  return {damage:harm,guard:guarded,lose:!s.hp};
 }
 function restart(clock){if(clock){clock.remaining=clock.rule.seconds;clock.pending=false;clock.struck=false}}
 return {rule,create,tick,strike,restart};
})();
