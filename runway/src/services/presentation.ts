import {launchPose,fallBody,advanceFall,type FallBody} from './choreography';
import {TIMING,objectPose,type CashEvent,type State} from '../core/simulation';

// Client-only choreography. No value in this module is consumed by the replay rules.
export const smooth=(a:number,b:number,x:number)=>{const u=Math.max(0,Math.min(1,(x-a)/(b-a)));return u*u*(3-2*u);};
export type VisualCue=CashEvent&{id:string;index:number;at:number;route:number;position:[number,number,number];velocity:number;kindOfObject?:string;vertical?:boolean;radius:number};
export type Presentation={resultFraming?:{x:number;y:number;height:number};position:[number,number,number];fall:FallBody|null;time:number;dt:number;route:number;phase:string;departure:number;airborne:number;canopy:number;landingAge:number;resultAge:number;ax:number;ay:number;vx:number;vy:number;orbit:number|null;cues:VisualCue[]};
export function createPresentation():Presentation{return {position:[0,0,0],fall:null,time:0,dt:0,route:0,phase:'airport',departure:0,airborne:0,canopy:0,landingAge:-1,resultAge:-1,ax:0,ay:0,vx:0,vy:0,orbit:null,cues:[]};}
export function captureCues(p:Presentation,s:State,from:number,runId:string,verticalSpeed:number){
 for(let index=from;index<s.events.length;index++){
  const e=s.events[index],o=s.objects.find(o=>o.id===e.sourceId),point=o?objectPose(o,s.routeTime):{x:s.x,y:s.altitude,z:s.y};
  p.cues.push({...e,id:`${runId}:${index}`,index,at:s.tick/60,route:s.routeTime,position:[point.x,point.y,point.z],velocity:verticalSpeed,kindOfObject:o?.kind,vertical:o?.vertical,radius:o?.r??.5});
 }
}
export function updatePresentation(p:Presentation,s:State,dt:number){
 p.dt=dt;p.time+=dt;p.route=s.routeTime;p.phase=s.phase;
 p.departure=smooth(1.65,3.5,s.routeTime);p.airborne=smooth(2.65,4.8,s.routeTime);p.canopy=smooth(TIMING.cloud,TIMING.glide,s.routeTime);
 if(s.outcome)p.landingAge=p.landingAge<0?0:p.landingAge+dt;else p.landingAge=-1;
 if(s.result)p.resultAge=p.resultAge<0?0:p.resultAge+dt;else p.resultAge=-1;
 if(s.outcome==='bankrupt'||s.outcome==='water'&&s.altitude>3){if(!p.fall)p.fall=fallBody(s);advanceFall(p.fall,dt);p.position=[...p.fall.position];}else {p.fall=null;p.position=[s.x,s.altitude+(s.outcome?0:launchPose(s.routeTime).lift),s.y];}
 const a=1-Math.exp(-dt*10);p.ax+=(Math.max(-35,Math.min(35,(s.vx-p.vx)/Math.max(dt,1/120)))-p.ax)*a;p.ay+=(Math.max(-35,Math.min(35,(s.vy-p.vy)/Math.max(dt,1/120)))-p.ay)*a;p.vx=s.vx;p.vy=s.vy;
}
export function activeImpact(p:Presentation){for(let i=p.cues.length-1;i>=0;i--){const e=p.cues[i];if(e.delta<0&&p.time-e.at<.48)return e;}return undefined;}

export function buildingReaction(p:Presentation){const hit=p.cues.filter(e=>e.kind==='tower').at(-1);if(!hit)return 0;const age=p.time-hit.at;return age>=0&&age<1.05?smooth(0,.08,age)*(1-smooth(.32,1.05,age)):0;}
