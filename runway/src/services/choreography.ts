import {TIMING,boostFactor,landingSurface,type State} from '../core/simulation';
export const ease=(a:number,b:number,t:number)=>{const u=Math.max(0,Math.min(1,(t-a)/(b-a)));return u*u*(3-2*u);};
// Presentation-only launch arc, zero at either end; controls still begin at t=4.
// Takeoff follows the feet reaching the end of the lowered 4.22-unit ramp.
export function launchPose(t:number){
 const load=ease(2.05,2.38,t)*(1-ease(2.38,2.62,t)),flight=ease(2.46,2.7,t)*(1-ease(3.05,4,t));
 return {load,lift:Math.max(0,Math.sin(Math.PI*Math.max(0,Math.min(1,(t-2.46)/1.54))))*.82,flight,spread:ease(2.72,4.7,t)};
}
export function deploymentPose(route:number){const age=route-TIMING.cloud,u=ease(0,1,age),pull=ease(.12,.32,age)*(1-ease(.32,.65,age)),rebound=age<.3?0:Math.sin((age-.3)*11)*Math.exp(-(age-.3)*3.3)*ease(.3,.43,age);return {age,u,pull,rebound};}
export const diveStrength=(s:State)=>Math.max(0,(boostFactor(s)-1)*4);
export type FallBody={position:[number,number,number];velocity:[number,number,number];grounded:boolean};
export function fallBody(s:State):FallBody{return {position:[s.x,s.altitude,s.y],velocity:[s.vx,Math.min(-2,s.verticalSpeed),s.vy],grounded:false};}
export function advanceFall(body:FallBody,dt:number){
 // Small fixed substeps keep the terminal fall stable even at 30 FPS. No score/input mutation.
 for(let left=Math.min(dt,.1);left>1e-8&&!body.grounded;){const h=Math.min(left,1/120);body.velocity[1]=Math.max(-60,body.velocity[1]-23*h);body.position[0]+=body.velocity[0]*h;body.position[1]+=body.velocity[1]*h;body.position[2]+=body.velocity[2]*h;const floor=landingSurface(body.position[0],body.position[2])+.65;if(body.position[1]<=floor){body.position[1]=floor;body.velocity=[0,0,0];body.grounded=true;}left-=h;}return body;
}
