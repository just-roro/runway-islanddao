import {rng,isSafeLanding,coastDistance,terrainHeight,DESTINATIONS,BUILDINGS,LANDMARK_BLOCKERS} from '../core/simulation';
import {bridgeClear} from './environmentLayout';
import {roadClear} from './roads';
export type Place={x:number;z:number;h:number;variant:number;scale:number;yaw:number};
// Clear physical destinations, approach spine, real architecture and camera orbits.
export function decorationClear(x:number,z:number,margin=3){return roadClear(x,z,margin)&&bridgeClear(x,z,margin)&&isSafeLanding(x,z)&&coastDistance(x,z)>margin&&!(Math.abs(x)<8&&z>-125&&z<55)&&!DESTINATIONS.some(d=>Math.hypot(x-d.x,z-d.z)<d.radius+9+margin)&&![...BUILDINGS,...LANDMARK_BLOCKERS].some(b=>Math.abs(x-b.x)<b.w/2+margin&&Math.abs(z-b.z)<b.d/2+margin)&&!(z>-98&&z<-42&&Math.abs(Math.abs(x)-12)<2.8+margin);}
export function treePlaces(){const random=rng(23096),rows:Place[]=[],centres=[[-40,-110],[-33,-20],[32,65],[28,130],[-30,-60],[12,102],[-42,45]];for(let i=0;i<12000&&rows.length<112;i++){const c=centres[i%centres.length],cluster=i<2500,x=cluster?c[0]+(random()-.5)*28:-75+random()*130,z=cluster?c[1]+(random()-.5)*38:-145+random()*310;if(!decorationClear(x,z,3.4)||rows.some(p=>Math.hypot(x-p.x,z-p.z)<3.7))continue;rows.push({x,z,h:terrainHeight(x,z),variant:rows.length%3,scale:.82+random()*.55,yaw:random()*Math.PI*2});}return rows;}
export function grassPlaces(_trees:Place[]){
 const random=rng(23256),rows:Place[]=[];
 // Stratified coverage over the whole island; do not spend every tuft under trees.
 for(let z=-146;z<173;z+=1.65)for(let x=-82;x<53;x+=1.65){
  const px=x+random()*1.5,pz=z+random()*1.5,h=terrainHeight(px,pz);
  // Low groundcover may fill the approach and the platform surroundings; tall
  // trees retain the larger camera/flight clearance above. Never cover asphalt.
  if(!isSafeLanding(px,pz)||coastDistance(px,pz)<3.5||!roadClear(px,pz,.35)||!bridgeClear(px,pz,.4)||DESTINATIONS.some(d=>Math.hypot(px-d.x,pz-d.z)<d.radius+.65)||[...BUILDINGS,...LANDMARK_BLOCKERS].some(b=>Math.abs(px-b.x)<b.w/2+.5&&Math.abs(pz-b.z)<b.d/2+.5))continue;
  const slope=Math.hypot(terrainHeight(px+.5,pz)-h,terrainHeight(px,pz+.5)-h)*2;
  if(slope>.65||random()<.16)continue;
  rows.push({x:px,z:pz,h,variant:0,scale:.8+random()*1.0,yaw:random()*Math.PI*2});
 }return rows;
}
export function residentPlaces(){const random=rng(23064),rows:Place[]=[];for(let i=0;i<16000&&rows.length<64;i++){const x=-70+random()*120,z=-140+random()*300,shore=coastDistance(x,z);if(!decorationClear(x,z,2)||shore>11||rows.some(p=>Math.hypot(x-p.x,z-p.z)<2.5))continue;rows.push({x,z,h:terrainHeight(x,z),variant:rows.length%3,scale:1.04+random()*.14,yaw:random()*Math.PI*2});}return rows;}
