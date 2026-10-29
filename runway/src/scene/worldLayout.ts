import {COAST,DESTINATIONS,coastDistance,isSafeLanding,rng,terrainHeight} from '../core/simulation';
import {bridgeClear} from './environmentLayout';
import {roadClear} from './roads';
export function coastalRocks(){
 const random=rng(39081),points:{x:number;z:number;scale:number;yaw:number}[]=[];
 for(let i=0;i<COAST.length;i++){
  const a=COAST[i],b=COAST[(i+1)%COAST.length],length=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.ceil(length/5);
  for(let j=0;j<n;j++){
   const t=(j+.25+random()*.5)/n,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;
   const scale=random()<.28?1.7+random()*1.2:.45+random()*.8;
   if(!bridgeClear(x,z,scale+1)||!roadClear(x,z,scale)||DESTINATIONS.some(d=>Math.hypot(x-d.x,z-d.z)<d.radius+5+scale))continue;
   points.push({x,z,scale,yaw:random()*Math.PI*2});
  }
 }return points;
}
export const BOAT_ROUTES=[{x:-105,z:-85,rx:12,rz:42,speed:.025},{x:110,z:24,rx:16,rz:48,speed:.019},{x:71,z:139,rx:7,rz:24,speed:.03},{x:-62,z:88,rx:8,rz:29,speed:.022},{x:70,z:-112,rx:10,rz:22,speed:.024}];
export function boatPose(i:number,t:number){const r=BOAT_ROUTES[i],a=t*r.speed+i*1.37;return {x:r.x+Math.sin(a)*r.rx,z:r.z+Math.cos(a)*r.rz,yaw:Math.atan2(Math.cos(a)*r.rx,-Math.sin(a)*r.rz)};}
export function swimmerPlaces(){
 const result:{x:number;z:number;yaw:number}[]=[];
 // Shallow water by real beaches, never inside the coast or below the bridge.
 for(let i=0;i<COAST.length&&result.length<10;i+=2){const [x,z]=COAST[i];for(const side of[-1,1]){const px=x+side*5,pz=z+2;if(!isSafeLanding(px,pz)&&coastDistance(px,pz)>3&&coastDistance(px,pz)<7&&bridgeClear(px,pz,6)&&result.every(p=>Math.hypot(px-p.x,pz-p.z)>18)){result.push({x:px,z:pz,yaw:i*.71});break;}}}
 return result;
}
export const hasPlatformVictory=(state:{outcome:string|null;destination:string|null;x:number;y:number;altitude:number})=>state.outcome==='landed'&&DESTINATIONS.some(d=>d.id===state.destination&&Math.hypot(state.x-d.x,state.y-d.z)<=d.radius+.01&&Math.abs(state.altitude-d.height-1.2)<.3);
// Four-wheel support on the actual rendered mesh, including cross-slope. The
// final lift clears all contact points on non-planar triangles instead of sinking
// the uphill wheels while only the centre of the car follows the terrain.
export function groundSlope(surface:typeof terrainHeight,x:number,z:number,yaw:number,wheelbase=2.14,track=1.58){
 const sy=Math.sin(yaw),cy=Math.cos(yaw),dx=sy*wheelbase/2,dz=cy*wheelbase/2;
 const front=surface(x+dx,z+dz),back=surface(x-dx,z-dz),right=surface(x+cy*track/2,z-sy*track/2),left=surface(x-cy*track/2,z+sy*track/2);
 const pitch=-Math.atan2(front-back,wheelbase),roll=Math.atan2(right-left,track),cp=Math.cos(pitch),sp=Math.sin(pitch),cr=Math.cos(roll),sr=Math.sin(roll);
 let y=-Infinity;
 for(const side of[-1,1])for(const end of[-1,1]){const lx=side*track/2,lz=end*wheelbase/2,rx=cr*lx,ry=cp*sr*lx-sp*lz,rz=sp*sr*lx+cp*lz;
  y=Math.max(y,surface(x+cy*rx+sy*rz,z-sy*rx+cy*rz)-ry);
 }
 return {y,pitch,roll};
}
