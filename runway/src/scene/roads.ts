import {BRIDGE,bridgePoint} from './environmentLayout';

export type RoadPoint={x:number;z:number;distance:number};
// Compressed SC-401 north/south spine, northern urban streets and an eastern
// connector. These are scenic routes fitted to the existing OSM island, not a
// surveyed street map. +X is west after the shared 180-degree world rotation.
const junction:[number,number]=[17,0];
const outlines:[number,number][][]=[
 [[BRIDGE.x,BRIDGE.z],[bridgePoint(-10).x,bridgePoint(-10).z],junction],
 [junction,[8,8],[-5,12],[-18,5],[-30,-5],[-32,-18],[-30,-35],[-26,-40],[-10,-43],[10,-43],[10,-55],[10,-67],[-28,-67],[-29,-79],[-28,-96],[-15,-105]],
 [junction,[15,17],[10,31],[6,41],[6,47],[12,51],[13,57],[31,65],[32,80],[36,96],[36,110],[43,118],[38,137],[38,158]],
 [[-28,-67],[-29,-55],[10,-55]],
 [[-29,-79],[10,-79]],
 [junction,[8,9],[-2,18],[-13,23]],
];
export const ROAD_HALF_WIDTH=1.7;
function rounded(points:[number,number][]){
 const result:RoadPoint[]=[];
 const add=(x:number,z:number)=>{const last=result.at(-1),d=last?Math.hypot(x-last.x,z-last.z):0;if(last&&d<.001)return;result.push({x,z,distance:(last?.distance??0)+d});};
 const line=(x:number,z:number)=>{const a=result.at(-1)!;const n=Math.ceil(Math.hypot(x-a.x,z-a.z)/.6);for(let j=1;j<=n;j++)add(a.x+(x-a.x)*j/n,a.z+(z-a.z)*j/n);};
 add(...points[0]);
 for(let i=1;i<points.length-1;i++){
  const a=points[i-1],p=points[i],b=points[i+1],al=Math.hypot(p[0]-a[0],p[1]-a[1]),bl=Math.hypot(b[0]-p[0],b[1]-p[1]),r=Math.min(1.4,al*.2,bl*.2),u=[p[0]+(a[0]-p[0])*r/al,p[1]+(a[1]-p[1])*r/al],v=[p[0]+(b[0]-p[0])*r/bl,p[1]+(b[1]-p[1])*r/bl];
  line(u[0],u[1]);for(let j=1;j<=8;j++){const t=j/8;add((1-t)**2*u[0]+2*t*(1-t)*p[0]+t*t*v[0],(1-t)**2*u[1]+2*t*(1-t)*p[1]+t*t*v[1]);}
 }
 line(...points.at(-1)!);return result;
}
export const ROADS=outlines.map(rounded);
export function roadDistance(x:number,z:number){let closest=Infinity;for(const road of ROADS)for(let i=1;i<road.length;i++){const a=road[i-1],b=road[i],dx=b.x-a.x,dz=b.z-a.z,u=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz)));closest=Math.min(closest,Math.hypot(x-a.x-u*dx,z-a.z-u*dz));}return closest;}
export const roadClear=(x:number,z:number,margin=0)=>roadDistance(x,z)>ROAD_HALF_WIDTH+.6+margin;
export function sampleRoad(road:RoadPoint[],distance:number){
 const d=Math.max(0,Math.min(road.at(-1)!.distance,distance));let lo=1,hi=road.length-1;while(lo<hi){const m=(lo+hi)>>1;if(road[m].distance<d)lo=m+1;else hi=m;}
 const a=road[lo-1],b=road[lo],u=(d-a.distance)/(b.distance-a.distance);return {x:a.x+(b.x-a.x)*u,z:a.z+(b.z-a.z)*u,yaw:Math.atan2(b.x-a.x,b.z-a.z)};
}
// Closed two-lane route: continuous semicircle at either end, never teleport or
// rotate a moving car in place. The turn fits inside the rounded road endpoint.
export function carPose(road:RoadPoint[],travel:number,lane=.7){
 const length=road.at(-1)!.distance,turn=Math.PI*lane,period=length*2+turn*2,t=((travel%period)+period)%period;
 if(t<length||t>=length+turn&&t<2*length+turn){const back=t>=length+turn,p=sampleRoad(road,back?2*length+turn-t:t),side=back?-lane:lane;return {x:p.x+Math.cos(p.yaw)*side,z:p.z-Math.sin(p.yaw)*side,yaw:p.yaw+(back?Math.PI:0)};}
 const end=t<length+turn,p=sampleRoad(road,end?length:0),a=(t-(end?length:2*length+turn))/lane,sign=end?1:-1,side=sign*Math.cos(a)*lane,along=sign*Math.sin(a)*lane;
 return {x:p.x+Math.cos(p.yaw)*side+Math.sin(p.yaw)*along,z:p.z-Math.sin(p.yaw)*side+Math.cos(p.yaw)*along,yaw:p.yaw+(end?0:Math.PI)-a};
}
