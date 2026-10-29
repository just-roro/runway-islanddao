import {useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as T from 'three';
import type {Runtime} from '../services/runtime';
import {carGeometry,boatGeometry,balloonGeometry,skydiverGeometry,rockGeometry} from './worldAssets';
import {ROADS,carPose} from './roads';
import {coastalRocks,BOAT_ROUTES,boatPose,swimmerPlaces,groundSlope} from './worldLayout';
const transform=new T.Object3D(),localEuler=new T.Euler(),up=new T.Vector3(0,1,0),yawQ=new T.Quaternion(),pitchQ=new T.Quaternion();
const vehicleCount=10;
function swimmerGeometry(){
  // Canopy and suspension lines precede/follow the body in the merged asset;
  // filter triangles above the hands, preserving body triangles in local space.
  const source=skydiverGeometry(),positions=source.getAttribute('position'),keep:number[]=[];
  for(let i=0;i<positions.count;i+=3)if(Math.max(positions.getY(i),positions.getY(i+1),positions.getY(i+2))<1.81)keep.push(i,i+1,i+2);
  for(const name of ['position','normal','color']){const a=source.getAttribute(name);source.setAttribute(name,new T.Float32BufferAttribute(keep.flatMap(i=>[a.getX(i),a.getY(i),a.getZ(i)]),3));}source.computeBoundingSphere();
return source;
}
export function WorldLife({run,surface}:{run:Runtime|null;surface:(x:number,z:number)=>number}){
 const refs=useRef<Record<string,T.InstancedMesh|null>>({});
 const assets=useMemo(()=>({cars:carGeometry(),boats:boatGeometry(),balloons:balloonGeometry(),divers:skydiverGeometry(),rocks:rockGeometry(),rockDistant:rockGeometry(0),swimmers:swimmerGeometry()}),[]);
 // Reuse the pilot language (helmet, suit, articulated limbs) for swimmers, with
 // the canopy removed from this dedicated copy rather than a second character rig.
 const swimmers=useMemo(swimmerPlaces,[]),rocks=useMemo(coastalRocks,[]),reduced=useMemo(()=>matchMedia('(prefers-reduced-motion: reduce)').matches,[]);
 const frustum=useMemo(()=>new T.Frustum(),[]),projection=useMemo(()=>new T.Matrix4(),[]),bounds=useMemo(()=>new T.Sphere(),[]);
 const swimmerTime=useMemo(()=>({value:0}),[]);
 const material=useMemo(()=>new T.MeshStandardMaterial({vertexColors:true,roughness:.64,metalness:.06,alphaHash:true}),[]);
 const rockMaterials=useMemo(()=>[false,true].map(near=>{const m=new T.MeshStandardMaterial({vertexColors:true,roughness:.85,alphaHash:true});m.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <alphahash_fragment>',`float distanceToRock=length(vViewPosition);float detailed=1.-smoothstep(55.,95.,distanceToRock);float visibility=1.-smoothstep(480.,620.,distanceToRock);float noise=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);if(noise>visibility)discard;if(${near?'noise>=detailed':'noise<detailed'})discard;`);};m.customProgramCacheKey=()=>near?'coast45-near':'coast45-far';return m;}),[]);
 const swimmerMaterial=useMemo(()=>new T.MeshStandardMaterial({vertexColors:true,roughness:.65}),[]);
 useEffect(()=>{
  material.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <alphahash_fragment>','diffuseColor.a*=1.-smoothstep(230.,330.,length(vViewPosition));\n#include <alphahash_fragment>');};material.customProgramCacheKey=()=> 'world39-distance';material.needsUpdate=true;
  swimmerMaterial.onBeforeCompile=s=>{s.uniforms.swimTime=swimmerTime;s.vertexShader='uniform float swimTime;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   float phase=swimTime*2.2+instanceMatrix[3].x;
   if(abs(position.x)>.25&&position.y>.9)transformed.z+=sin(phase+sign(position.x)*1.57)*.20;
   if(position.y<.7)transformed.z+=sin(phase*1.6+sign(position.x)*1.57)*.12;
  `);};swimmerMaterial.needsUpdate=true;
  return()=>{Object.values(assets).forEach(g=>g.dispose());material.dispose();swimmerMaterial.dispose();rockMaterials.forEach(m=>m.dispose());};
 },[assets,material,swimmerMaterial,swimmerTime,rockMaterials]);
 useFrame(({clock,camera})=>{
  frustum.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
  const t=reduced?0:run?.presentation.time??clock.elapsedTime;swimmerTime.value=t;
  const visible=(x:number,y:number,z:number,range=330)=>Math.hypot(x-camera.position.x,y-camera.position.y,z-camera.position.z)<range;
  const emit=(key:string,index:number,x:number,y:number,z:number,yaw:number,scale=1,pitch=0,roll=0)=>{const mesh=refs.current[key];if(!mesh)return;transform.position.set(x,y,z);yawQ.setFromAxisAngle(up,yaw);pitchQ.setFromEuler(localEuler.set(pitch,0,roll));transform.quaternion.copy(yawQ).multiply(pitchQ);transform.scale.setScalar(scale);transform.updateMatrix();mesh.setMatrixAt(index,transform.matrix);};
  const finish=(key:string,count:number)=>{const mesh=refs.current[key];if(mesh){mesh.count=count;mesh.visible=count>0;mesh.instanceMatrix.needsUpdate=true;}};
  let n=0;
  for(let i=0;i<vehicleCount;i++){
   const road=ROADS[1+i%5],p=carPose(road,i*33+t*(1.45+(i%3)*.13),.8),s=groundSlope(surface,p.x,p.z,p.yaw,2.14*.85,1.58*.85);
   if(visible(p.x,s.y,p.z))emit('cars',n++,p.x,s.y+.04,p.z,p.yaw,.85,s.pitch,s.roll);
  }finish('cars',n);n=0;
  for(let i=0;i<BOAT_ROUTES.length;i++){const p=boatPose(i,t);if(visible(p.x,0,p.z))emit('boats',n++,p.x,.16+Math.sin(t*1.1+i)*.10,p.z,p.yaw,1,Math.sin(t+i)*.025,Math.sin(t*.7+i)*.035);}finish('boats',n);n=0;
  // Keep stable island silhouettes from the air. Cull only beyond zero coverage.
  let distant=0;for(const p of rocks){const y=Math.max(-.4,surface(p.x,p.z)-.10*p.scale),distance=Math.hypot(p.x-camera.position.x,y-camera.position.y,p.z-camera.position.z);
   bounds.center.set(p.x,y+p.scale*.7,p.z);bounds.radius=p.scale*1.8;if(!frustum.intersectsSphere(bounds))continue;
   if(distance<95+p.scale*2)emit('rocks',n++,p.x,y,p.z,p.yaw,p.scale);
   if(distance>55-p.scale*2&&distance<620+p.scale*2)emit('rockDistant',distant++,p.x,y,p.z,p.yaw,p.scale);
  }finish('rocks',n);finish('rockDistant',distant);n=0;
  for(let i=0;i<3;i++){const x=[-230,185,260][i],z=[-170,215,-240][i],y=[130,175,115][i]+Math.sin(t*.07+i)*2;emit('balloons',n++,x,y,z,Math.sin(t*.015+i)*.15,1.3+i*.25);}finish('balloons',n);n=0;
  for(let i=0;i<5;i++){const x=(i%2?1:-1)*(43+i*9)+Math.sin(t*.045+i)*8,z=55-i*44+Math.cos(t*.035+i)*18,y=Math.max(14,163+i*17-t*1.65)+Math.sin(t*.25+i)*.8;if(visible(x,y,z))emit('divers',n++,x,y,z,Math.PI+Math.sin(t*.045+i)*.25,1.1,Math.sin(t*.8+i)*.025,Math.sin(t*.5+i)*.07);}finish('divers',n);n=0;
  for(const [i,p] of swimmers.entries()){const x=p.x+Math.sin(t*.16+i)*.5,z=p.z+Math.cos(t*.16+i)*.5;if(visible(x,0,z,200))emit('swimmers',n++,x,-.08+Math.sin(t*1.1+i)*.04,z,p.yaw,1,-Math.PI/2+.1);}finish('swimmers',n);
  if(import.meta.env.DEV)(window as any).__RUNWAY_WORLD_QA__={counts:Object.fromEntries(Object.entries(refs.current).map(([k,v])=>[k,v?.count??0])),roads:ROADS.length,rockCandidates:rocks.length,time:t};
 });
 return <group name="decorative-world-life" userData={{collidable:false,units:'metres'}}>{Object.entries(assets).map(([key,g])=><instancedMesh key={key} name={`world-${key}`} ref={m=>{refs.current[key]=m;}} args={[g,key==='rocks'?rockMaterials[1]:key==='rockDistant'?rockMaterials[0]:key==='swimmers'?swimmerMaterial:material,(key==='rocks'||key==='rockDistant')?rocks.length:key==='cars'?vehicleCount:key==='boats'?BOAT_ROUTES.length:key==='swimmers'?swimmers.length:key==='balloons'?3:5]} frustumCulled={false}/>)}</group>;
}
