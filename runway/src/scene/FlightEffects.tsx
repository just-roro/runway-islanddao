import {useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {objectPose,worldZ,WORLD_SCALE} from '../core/simulation';
import type {Runtime} from '../services/runtime';
import {ringFragment,RING_SEGMENTS,RING_LIFE} from './particleMotion';
const dummy=new THREE.Object3D();
const fragmentColors=[new THREE.Color('#ff352c').multiplyScalar(1.35),new THREE.Color('#fff4e3').multiplyScalar(1.35)];
const gold=new THREE.Color('#ffdb70'),coral=new THREE.Color('#ff846c'),cream=new THREE.Color('#fff8d2');
export function FlightEffects({run}:{run:Runtime}){
 const fragmentGeometry=useMemo(()=>new THREE.TorusGeometry(1,.075,4,2,Math.PI*2/RING_SEGMENTS*.92).translate(-Math.cos(Math.PI/RING_SEGMENTS*.92),-Math.sin(Math.PI/RING_SEGMENTS*.92),0),[]);
 const fragments=useRef<THREE.InstancedMesh>(null),fragmentAlpha=useMemo(()=>new THREE.InstancedBufferAttribute(new Float32Array(16*RING_SEGMENTS),1),[]);
 const trails=useRef<THREE.InstancedMesh>(null),sparks=useRef<THREE.InstancedMesh>(null),rings=useRef<THREE.InstancedMesh>(null);
 useEffect(()=>()=>fragmentGeometry.dispose(),[fragmentGeometry]);
 useFrame(()=>{
  const s=run.state,t=s.routeTime,h=s.altitude;let n=0;
  if(trails.current){for(const o of s.objects){if(s.collected.includes(o.id)||['gate','risk','star'].includes(o.kind))continue;const pose=objectPose(o,t),height=pose.y;if(height<h-95||height>h+8)continue;const p={x:pose.x,y:pose.z},bad=['gas','rug','hacked'].includes(o.kind);
   for(let j=0;j<5&&n<480;j++){const age=(j+(t*4%1))*.2;dummy.position.set(p.x*WORLD_SCALE+Math.sin(j+o.t)*age*.09,height+age*(o.fallSpeed??2)*Math.min(2,Math.abs(s.verticalSpeed)/20),worldZ(p.y,o.t));dummy.scale.setScalar((1-age)*.065);dummy.rotation.set(t+j,j,0);dummy.updateMatrix();trails.current.setMatrixAt(n,dummy.matrix);trails.current.setColorAt(n,(bad?coral:gold).clone().lerp(cream,age));n++;}
  }trails.current.count=n;trails.current.instanceMatrix.needsUpdate=true;if(trails.current.instanceColor)trails.current.instanceColor.needsUpdate=true;}
  let particleCount=0,ringCount=0,fragmentCount=0;const seen=new Set<string>();
  for(const e of run.presentation.cues.slice(-16)){const age=run.presentation.time-e.at;if(age<0||age>1.1||!e.sourceId)continue;const p={x:e.position[0],y:e.position[2]},y=e.position[1]+e.velocity*age,bad=e.delta<0;
   if(e.kindOfObject==='gate'){
    if(age>RING_LIFE||seen.has(e.sourceId))continue;seen.add(e.sourceId);
    for(let j=0;j<RING_SEGMENTS;j++){const f=ringFragment(age,j,e.radius),a=f.angle;dummy.position.set(e.position[0],e.position[1]+e.velocity*age*1.05-3*age*age,e.position[2]);dummy.rotation.set(e.vertical?0:-Math.PI/2,0,0);const center=a+Math.PI/RING_SEGMENTS*.92;dummy.translateX(Math.cos(center)*f.radius);dummy.translateY(Math.sin(center)*f.radius);dummy.translateZ(f.normal);dummy.rotateZ(a);dummy.rotateX(f.spin);dummy.scale.setScalar(e.radius*(1-age/RING_LIFE*.28));dummy.updateMatrix();fragments.current?.setMatrixAt(fragmentCount,dummy.matrix);fragments.current?.setColorAt(fragmentCount,fragmentColors[j%2]);fragmentAlpha.setX(fragmentCount++,f.alpha*(e.kind==='sequence-missed'?.5:1));}continue;
   }

   for(let j=0;j<12;j++){const a=j*2.399,r=age*2.6;dummy.position.set(p.x*WORLD_SCALE+Math.cos(a)*r,y-age*3,p.y+Math.sin(a)*r);dummy.scale.set(.1*(1-age/1.1),.04,.1*(1-age/1.1));dummy.rotation.set(age*8,a,a);dummy.updateMatrix();sparks.current?.setMatrixAt(particleCount,dummy.matrix);sparks.current?.setColorAt(particleCount,bad?coral:gold);particleCount++;}
   const gate=e.kindOfObject==='gate'||e.kindOfObject==='risk';dummy.position.set(p.x*WORLD_SCALE,y,p.y);dummy.rotation.set(e.vertical?0:-Math.PI/2,0,0);dummy.scale.setScalar((gate?e.radius*WORLD_SCALE:.5)+age*1.8);dummy.updateMatrix();rings.current?.setMatrixAt(ringCount,dummy.matrix);rings.current?.setColorAt(ringCount,(bad?coral:cream).clone().multiplyScalar(Math.max(.08,1-age/1.1)));ringCount++;
  }
  const splashAge=s.outcome==='water'?run.presentation.landingAge:-1;
  if(splashAge>=0&&splashAge<2.5){
   const a=splashAge;for(let j=0;j<20&&particleCount<192;j++){const theta=j*2.399,r=.4+a*2.5;dummy.position.set(s.x+Math.cos(theta)*r,.2+Math.max(0,Math.sin(a/2.5*Math.PI))*(1+j%3*.4),s.y+Math.sin(theta)*r);dummy.scale.setScalar(.14*(1-a/2.5));dummy.updateMatrix();sparks.current?.setMatrixAt(particleCount,dummy.matrix);sparks.current?.setColorAt(particleCount,cream);particleCount++;}
   if(ringCount<16){dummy.position.set(s.x,.05,s.y);dummy.rotation.set(-Math.PI/2,0,0);dummy.scale.setScalar(.5+a*3);dummy.updateMatrix();rings.current?.setMatrixAt(ringCount,dummy.matrix);rings.current?.setColorAt(ringCount,cream.clone().multiplyScalar(1-a/2.5));ringCount++;}
  }
  if(fragments.current){fragments.current.count=fragmentCount;fragments.current.instanceMatrix.needsUpdate=true;if(fragments.current.instanceColor)fragments.current.instanceColor.needsUpdate=true;fragmentAlpha.needsUpdate=true;}
  if(sparks.current){sparks.current.count=particleCount;sparks.current.instanceMatrix.needsUpdate=true;if(sparks.current.instanceColor)sparks.current.instanceColor.needsUpdate=true;}
  if(rings.current){rings.current.count=ringCount;rings.current.instanceMatrix.needsUpdate=true;if(rings.current.instanceColor)rings.current.instanceColor.needsUpdate=true;}
 });
 return <><instancedMesh name="ring-fragments" ref={fragments} args={[undefined,undefined,16*RING_SEGMENTS]} frustumCulled={false}><primitive object={fragmentGeometry} attach="geometry"><primitive attach="attributes-fragmentAlpha" object={fragmentAlpha}/></primitive><meshBasicMaterial transparent depthWrite={false} toneMapped={false} onBeforeCompile={shader=>{shader.vertexShader='attribute float fragmentAlpha;varying float fade;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfade=fragmentAlpha;');shader.fragmentShader='varying float fade;\n'+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=fade;');}}/></instancedMesh><instancedMesh ref={trails} args={[undefined,undefined,480]} frustumCulled={false}><octahedronGeometry args={[1,0]}/><meshBasicMaterial toneMapped={false}/></instancedMesh><instancedMesh ref={sparks} args={[undefined,undefined,192]} frustumCulled={false}><octahedronGeometry args={[1,0]}/><meshBasicMaterial toneMapped={false}/></instancedMesh><instancedMesh ref={rings} args={[undefined,undefined,16]} frustumCulled={false}><torusGeometry args={[1,.025,4,32]}/><meshBasicMaterial toneMapped={false} transparent opacity={.7} depthWrite={false} blending={THREE.AdditiveBlending}/></instancedMesh></>;
}
