import {clamp,START_Z,TIMING,DESTINATIONS,type State,type Destination} from '../src/core/simulation';
// QA controller: uses the same input as a player. No teleporting, rewards, or hidden lift.
export function flyRoute(s:State,destination:Destination='jurere',currents=true,currentSide:-1|1=-1){
 if(s.tick<240)return{x:0,y:0};
 if(s.routeTime>=TIMING.glide){
  const d=DESTINATIONS.find(d=>d.id===destination)!;
  const targetX=currents&&destination==='jurere'&&s.lift<23.99?22*currentSide:d.x;
  const x=clamp((targetX-s.x)*.2-s.vx*.04,-.65,.65);
  return{x,y:s.y>d.z+(destination==='jurere'?(currentSide===1?4:8):26)?Math.sqrt(1-x*x):clamp((s.y-d.z)*.18-.6,-1,1)};
 }
 const t=s.routeTime,target=s.objects.find(o=>['sol','term','community','gate'].includes(o.kind)&&o.t>t+.12&&o.t<t+.9&&!o.vertical&&!s.collected.includes(o.id));
 const x=target?.x??Math.sin(t*.3)*4,z=target?.y??START_Z+2;
 return{x:clamp((x-s.x)*1.2,-1,1),y:clamp((s.y-z)*1.2,-1,1)};
}
export const flyToJurere=(s:State)=>flyRoute(s);
