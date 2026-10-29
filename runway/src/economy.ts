import {START_CASH,type State} from './core/simulation';
export const eventNames:Record<string,string>={'star':'STAR BONUS','sequence-ring':'RING CLEARED','sequence-complete':'FULL SEQUENCE!','sequence-missed':'SEQUENCE MISSED',magnet:'MAGNET · 8 SECONDS',sol:'SOL collected',term:'Term sheet signed',community:'Community showed up',delivery:'Delivery bonus',gas:'ETH gas fee',rug:'Rug pulled',hacked:'Security breach',tower:'Watch the skyline',water:'Hydrated · next hit protected',precision:'Through the eye',risk:'Calculated risk',rare:'Rare cargo recovered',beach:'Beach touchdown',terrace:'Terrace touchdown',jurere:'Jurerê touchdown','safe-landing':'Safely on the island',emergency:'Emergency landing','landing-bonus':'Landing bonus',splashdown:'Capital lost at sea','rescue-failed':'Rescue failed'};
export function economicFrame(s:State,progress:number){const tick=Math.min(1,Math.max(0,progress))*s.tick,events=s.events.filter(e=>e.tick<=tick);return {tick,events,cash:progress>=1?s.result?.cashFinal??s.cash:events.at(-1)?.balance??START_CASH};}

export function capitalSegments(points:[number,number][]){
 let direction:'gain'|'loss'='gain';
 return points.slice(1).map((to,i)=>{const from=points[i];if(to[1]!==from[1])direction=to[1]<from[1]?'loss':'gain';return {from,to,direction};});
}

// Ordered step history: same-tick events remain separate vertices, including zero.
export function financialWindow(events:State['events'],tick:number){
 const start=Math.max(0,tick-600),end=Math.max(start+1,tick);let balance=START_CASH;
 for(const e of events){if(e.tick>=start)break;balance=e.balance;}
 const points:[number,number][]=[[start,balance]];
 for(const e of events){if(e.tick<start||e.tick>tick)continue;points.push([e.tick,balance],[e.tick,e.balance]);balance=e.balance;}
 points.push([end,balance]);const values=points.map(p=>p[1]),low=Math.min(...values),high=Math.max(...values),span=Math.max(75000,high-low),spare=(span-(high-low))/2;
 return {start,end,points,low:low-spare-span*.12,high:high+spare+span*.12,balance};
}
export function feedEntries(events:State['events']){
 const groups:(State['events'][number]&{index:number;count:number})[]=[];
 events.forEach((e,index)=>{const prev=groups.at(-1);if(e.kind==='sol'&&prev?.kind==='sol'&&e.tick-prev.tick<=6){prev.delta+=e.delta;prev.balance=e.balance;prev.tick=e.tick;prev.count++;}else groups.push({...e,index,count:1});});return groups;
}
