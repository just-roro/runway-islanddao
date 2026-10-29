// Supplied WAV variants. Replace a filename here without changing event timing.
export type SoundSpec={files?:string[];gain:number;gap:number;priority:number;bus?:'ui'|'voice';synth?:'tone'|'noise';hz?:number;end?:number;duration?:number};
const variants=(base:string,n:number)=>Array.from({length:n},(_,i)=>`${base}_${String(i+1).padStart(2,'0')}.${['ui_press','npc_blip','results_count_tick'].includes(base)?'wav':'m4a'}`);
const wav=(base:string,n:number,gain:number,gap:number,priority=1,bus?:SoundSpec['bus']):SoundSpec=>({files:variants(base,n),gain,gap,priority,bus});
export const SFX:Record<string,SoundSpec>={
 ui:wav('ui_press',3,.45,.045,2,'ui'),back:wav('ui_back',2,.42,.12,2,'ui'),confirm:wav('ui_confirm',2,.48,.12,2,'ui'),
 select:wav('ui_skin_change',3,.42,.07,2,'ui'),buy:wav('shop_buy_ok',2,.52,.3,4,'ui'),denied:wav('shop_buy_denied',2,.45,.2,4,'ui'),equip:wav('ui_confirm',2,.5,.12,3,'ui'),unlock:wav('rare_cargo',2,.48,.5,4,'ui'),
 sol:wav('sol_pickup',5,.34,.065),delivery:wav('sol_pickup',5,.28,.1),community:wav('island_token',2,.43,.12,2),term:wav('reward_big',3,.5,.2,4),boost:wav('boost_air',2,.26,.25,2),rare:wav('rare_cargo',2,.48,.2,4),
 magnet:wav('powerup_magnet',2,.45,.15,3),water:wav('powerup_water',2,.4,.15,3),star:wav('star_activate',2,.46,.15,3),ring:wav('ring_note',8,.36,.07,2),sequence:wav('sequence_complete',2,.52,.25,4),
 loss:wav('hit_cash_loss',3,.53,.1,5),defeat:wav('fail_air',2,.55,.5,6),bonus:wav('land_bonus',2,.4,.4,4),reveal:wav('island_reveal_shimmer',2,.65,1,6),
 countStart:wav('results_count_start',1,.3,.5,2),countTick:wav('results_count_tick',3,.3,.11),final:wav('results_final',1,.43,.5,4),
 type:wav('npc_blip',6,.22,.09,1,'voice'),
 welcome:{synth:'tone',hz:440,end:660,duration:.13,gain:.025,gap:.1,priority:3,bus:'voice'},
 curious:{synth:'tone',hz:580,end:850,duration:.13,gain:.025,gap:.1,priority:3,bus:'voice'},
 warning:{synth:'tone',hz:280,end:170,duration:.16,gain:.025,gap:.1,priority:3,bus:'voice'},
 confident:{synth:'tone',hz:720,end:570,duration:.12,gain:.025,gap:.1,priority:3,bus:'voice'},
 celebrate:{synth:'tone',hz:660,end:1040,duration:.17,gain:.025,gap:.1,priority:3,bus:'voice'},
 door:{synth:'noise',hz:160,end:700,duration:1.1,gain:.22,gap:1,priority:3},
 jump:{synth:'noise',hz:280,end:2800,duration:.65,gain:.6,gap:1,priority:6},
 parachute:{synth:'noise',hz:2100,end:180,duration:.8,gain:.55,gap:1,priority:5},
 landing:{synth:'noise',hz:220,end:65,duration:.25,gain:.6,gap:.5,priority:5},
 cloud:{synth:'noise',hz:160,end:95,duration:1.5,gain:.25,gap:1,priority:3},
 thunder:{synth:'noise',hz:150,end:65,duration:1.7,gain:.35,gap:1.2,priority:3},
};
export const AMBIENCE={fall:'amb_freefall_placeholder_01.m4a',glide:'amb_glide_placeholder_01.m4a',updraft:'updraft_placeholder_01.m4a'};
export const AUDIO_FILES=[...new Set([...Object.values(SFX).flatMap(s=>s.files??[]),...Object.values(AMBIENCE)])];
export function eventSound(kind:string,delta?:number){
 if(delta!==undefined&&delta<0)return ['splashdown','out-of-runway','rescue-failed'].includes(kind)?undefined:'loss';
 const map:Record<string,string>={'sequence-ring':'ring','sequence-complete':'sequence','landing-bonus':'bonus'};
 if(map[kind])return map[kind];
 if(['sol','delivery','community','term','rare','magnet','water','star'].includes(kind))return kind;
 return undefined;
}
