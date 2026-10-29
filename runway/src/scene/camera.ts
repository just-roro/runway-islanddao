import{Box3,Ray,Vector3,MathUtils}from'three';
import{BUILDINGS,LANDMARK_BLOCKERS,AIRCRAFT,START_Z,landingSurface}from'../core/simulation';
// The rendered city and the collision world share these architecture envelopes.
const boxes=[...BUILDINGS,...LANDMARK_BLOCKERS].map(b=>new Box3(new Vector3(b.x-b.w/2-.3,'bottom'in b?Number(b.bottom)-.3:0,b.z-b.d/2-.3),new Vector3(b.x+b.w/2+.3,b.h+('style'in b?3:.3),b.z+b.d/2+.3)));
type Surface=(x:number,z:number)=>number;
const floor=(x:number,z:number,surface:Surface)=>Math.max(landingSurface(x,z),surface(x,z));
const ray=new Ray(),direction=new Vector3(),hit=new Vector3(),candidate=new Vector3();
// Camera body / near-plane clearance, including portrait, landscape and view offsets.
// Same heightfield and landing platforms as the scene; no terrain/collider edits.
export function cameraFloor(x:number,z:number,surface:Surface=landingSurface){let height=floor(x,z,surface);for(let i=0;i<8;i++){const a=i*Math.PI/4;height=Math.max(height,floor(x+Math.cos(a)*.7,z+Math.sin(a)*.7,surface));}return height+.7;}
export function cameraHasClearView(position:Vector3,focus:Vector3,surface:Surface=landingSurface){
 const length=direction.subVectors(position,focus).length();ray.set(focus,direction.normalize());
 if(position.y<cameraFloor(position.x,position.z,surface)||boxes.some(box=>ray.intersectBox(box,hit)&&hit.distanceTo(focus)<length+.3))return false;
 const steps=Math.ceil(length/.65);for(let i=1;i<steps;i++){const u=i/steps,x=focus.x+(position.x-focus.x)*u,y=focus.y+(position.y-focus.y)*u,z=focus.z+(position.z-focus.z)*u;if(y<floor(x,z,surface)+.15)return false;}
 return true;
}
export function avoidScenery(position:Vector3,focus:Vector3,orbit=false,surface:Surface=landingSurface){
 position.y=Math.max(position.y,cameraFloor(position.x,position.z,surface));
 if(cameraHasClearView(position,focus,surface))return;
 if(orbit){const x=position.x-focus.x,z=position.z-focus.z;for(let i=1;i<=8;i++)for(const sign of[1,-1]){const a=i*.25*sign;candidate.set(focus.x+x*Math.cos(a)-z*Math.sin(a),position.y,focus.z+x*Math.sin(a)+z*Math.cos(a));if(cameraHasClearView(candidate,focus,surface)){position.copy(candidate);return;}}}
 for(let i=0;i<18;i++){position.y+=2;if(cameraHasClearView(position,focus,surface))return;}
}

// Physical cabin constraint. The camera is free once it clears the rear opening,
// even while the pilot is still in the exit animation. Never pin it to a timer.
export function constrainAircraftCamera(position:Vector3,aircraftZ=START_Z){
 const z=position.z-aircraftZ;
 if(z>-.3&&z<AIRCRAFT.length&&position.y>AIRCRAFT.floor-.5){
  position.x=Math.max(-2.4,Math.min(2.4,position.x));
  position.y=Math.max(AIRCRAFT.floor+.65,Math.min(AIRCRAFT.floor+3.75,position.y));
 }
}

// Select once at contact: test the entire intended arc, not a new side each frame.
export function orbitRadius(progress:number,endRadius:number,startRadius=9.2){
 // Turn inside the flanking venue pillars, then dolly out after clearing them.
 const close=MathUtils.lerp(startRadius,6.5,MathUtils.smoothstep(progress,0,.16));
 return MathUtils.lerp(close,endRadius,MathUtils.smoothstep(progress,.78,1));
}
export const orbitAngle=(progress:number,arc:number)=>arc*MathUtils.smoothstep(progress,.16,.74);
export function landingOrbit(focus:Vector3,start=0,maxRadius=24,surface:Surface=landingSurface){
 // Check the moving radial envelope: the shot pulls back as it orbits, never
 // visiting the far radius at the initial bearing behind nearby buildings.
 for(const elevation of [1.65,3.5,6,9])for(const arc of [Math.PI*2/3,-Math.PI*2/3,Math.PI/3,-Math.PI/3,Math.PI/6,-Math.PI/6]){
  let clear=true;for(let i=0;i<=32&&clear;i++)for(const endRadius of [8.6,12,18,maxRadius]){const radius=orbitRadius(i/32,endRadius),a=start+orbitAngle(i/32,arc);candidate.set(focus.x+Math.sin(a)*radius,focus.y+elevation,focus.z+Math.cos(a)*radius);if(!cameraHasClearView(candidate,focus,surface)){clear=false;break;}}
  if(clear)return {start,arc,elevation};
 }return {start,arc:0,elevation:12};
}
