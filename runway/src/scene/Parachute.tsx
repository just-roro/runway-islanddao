import {deploymentPose,ease} from '../services/choreography';
import {useEffect,useMemo,useRef,type RefObject} from 'react';
import {useFrame} from '@react-three/fiber';
import * as T from 'three';
import {landingSurface} from '../core/simulation';
import type {Runtime} from '../services/runtime';
import type {Presentation} from '../services/presentation';
import {shopColor,shopItem} from '../shopCatalog';
import {profile} from '../services/session';

// Faceted ram-air canopy: individual inflated cells, continuous curved chord and real rigging.
export function canopyGeometry(color='#ffdb14'){
 const positions:number[]=[],colors:number[]=[],indices:number[]=[],uvs:number[]=[];
 const point=(u:number,v:number,lower=false)=>{const a=u*1.12;return new T.Vector3(Math.sin(a)*2.55,1.7+Math.cos(a)*1.5+(lower?-.22:Math.sin(v*Math.PI)*.32+Math.sin((u+1)*5*Math.PI)**2*.075), (v-.5)*1.8);};
 for(let cell=0;cell<10;cell++)for(let row=0;row<4;row++)for(const lower of[false,true]){
  const tint=new T.Color(cell%3===1?'#09394f':color);if(cell%3!==1&&row===0)tint.lerp(new T.Color('#ffffff'),.22);if(lower)tint.multiplyScalar(.72);
  const base=positions.length/3;
  for(const [u,v] of[[cell/5-1,row/4],[(cell+1)/5-1,row/4],[(cell+1)/5-1,(row+1)/4],[cell/5-1,(row+1)/4]]){const p=point(u,v,lower);positions.push(p.x,p.y,p.z);uvs.push((u+1)/2,v);colors.push(tint.r,tint.g,tint.b);}
  indices.push(base,base+1,base+2,base,base+2,base+3);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();
 const ropes:{start:T.Vector3;end:T.Vector3}[]=[];
 for(const side of[-1,1])for(let i=0;i<5;i++)for(const z of[-.75,.75])ropes.push({start:new T.Vector3(side*.63,.7,.05),end:point(side*(.12+i*.22),z<0?0:1,true)});
 return {canopy:g,ropes};
}
export function canopySpring(state:{value:number;velocity:number},target:number,dt:number){
 // Bounded presentation spring. Never feeds back into input or the replay physics.
 for(let left=Math.min(dt,.1);left>0;){const h=Math.min(left,1/120);state.velocity+=((target-state.value)*42-state.velocity*9)*h;state.value+=state.velocity*h;left-=h;}return state.value;
}

export function Parachute({run,body,presentation,preview,color,itemId}:{preview?:boolean;color?:string;itemId?:string;presentation:Presentation;run?:Runtime|null;body:RefObject<T.Group|null>}){
 const finish=shopItem(itemId??profile.shop!.canopy)!,pattern=Math.max(0,['legacy','solid','split','checker','waves','stars','aurora'].indexOf(finish.pattern??'legacy'));
 const patternUniforms=useMemo(()=>({canopyMode:{value:0},canopyA:{value:new T.Color()},canopyB:{value:new T.Color()}}),[]);patternUniforms.canopyMode.value=pattern;patternUniforms.canopyA.value.set(finish.color??'#ffdb14');patternUniforms.canopyB.value.set(finish.secondary??'#09394f');
 const root=useRef<T.Group>(null),sail=useRef<T.Mesh>(null),lines=useRef<T.InstancedMesh>(null),geometry=useMemo(()=>canopyGeometry(color??shopColor(itemId??profile.shop!.canopy)),[color,itemId,profile.shop!.canopy]);
 const motion=useRef({bank:{value:0,velocity:0},pitch:{value:0,velocity:0},vx:0,vy:0}),dummy=useMemo(()=>new T.Object3D(),[]),end=useMemo(()=>new T.Vector3(),[]),direction=useMemo(()=>new T.Vector3(),[]),up=useMemo(()=>new T.Vector3(0,1,0),[]);
 const grips=useMemo(()=>[new T.Vector3(),new T.Vector3()],[]),gripReady=useRef([false,false]);

 const detached=useRef<{at:number;origin:T.Vector3;rotation:T.Quaternion;scale:T.Vector3;grips:T.Vector3[]}|null>(null),flight=useRef(run),savedWorld=useMemo(()=>new T.Matrix4(),[]),localMatrix=useMemo(()=>new T.Matrix4(),[]),worldPosition=useMemo(()=>new T.Vector3(),[]),worldRotation=useMemo(()=>new T.Quaternion(),[]),worldScale=useMemo(()=>new T.Vector3(),[]);
 const reduced=useMemo(()=>matchMedia('(prefers-reduced-motion: reduce)').matches,[]);
 useEffect(()=>()=>geometry.canopy.dispose(),[geometry]);
 useFrame(()=>{
  if(!root.current||!sail.current||!lines.current)return;
  const reset=flight.current!==run;
  if(!presentation.dt&&!reset)return;
  const dt=Math.min(presentation.dt,.05),s=run?.state,t=s?.routeTime??0,opening=deploymentPose(t),age=preview?2:opening.age,u=preview?1:opening.u;
  if(flight.current!==run){detached.current=null;flight.current=run;motion.current.bank={value:0,velocity:0};motion.current.pitch={value:0,velocity:0};}
  const release=!!s?.outcome&&age>0&&(s.outcome!=='landed'||presentation.landingAge>=.28);
  if(release&&!detached.current){savedWorld.decompose(worldPosition,worldRotation,worldScale);detached.current={at:presentation.time,origin:worldPosition.clone(),rotation:worldRotation.clone(),scale:worldScale.clone(),grips:grips.map(g=>g.clone())};}
  const loose=detached.current,looseAge=loose?presentation.time-loose.at:0;
  root.current.visible=(!!preview||!!s&&age>0)&&(!loose||looseAge<3.2);
  if(!root.current.visible)return;
  body.current?.updateWorldMatrix(true,true);
  if(loose&&body.current){
   // Once released, retain a world-space transform. It no longer rides the torso/camera.
   worldPosition.copy(loose.origin).add(new T.Vector3((presentation.orbit!==null&&presentation.orbit<0?1:-1)*3.6*looseAge,1.1*looseAge-2.2*looseAge*looseAge,1.2*looseAge));
   worldPosition.y=Math.max(landingSurface(worldPosition.x,worldPosition.z)+.2,worldPosition.y);
   worldRotation.copy(loose.rotation).multiply(new T.Quaternion().setFromEuler(new T.Euler(-.35*ease(0,1.8,looseAge),0,.15*Math.sin(looseAge*2))));
   localMatrix.compose(worldPosition,worldRotation,loose.scale).premultiply(new T.Matrix4().copy(body.current.matrixWorld).invert());localMatrix.decompose(root.current.position,root.current.quaternion,root.current.scale);
  }else{
   root.current.position.set(0,0,0);root.current.scale.setScalar(1);
   const yaw=new T.Quaternion().setFromAxisAngle(up,body.current?.rotation.y??Math.PI);if(body.current)root.current.quaternion.copy(body.current.quaternion).invert().multiply(yaw);
  }
  const collapse=loose?1-ease(.05,1.3,looseAge)*.92:1;
  const m=motion.current,ax=T.MathUtils.clamp(((s?.vx||0)-m.vx)/Math.max(dt,.01),-15,15),ay=T.MathUtils.clamp(((s?.vy||0)-m.vy)/Math.max(dt,.01),-15,15);m.vx=s?.vx||0;m.vy=s?.vy||0;
  const bank=canopySpring(m.bank,T.MathUtils.clamp(-m.vx*.018-ax*.008,-.35,.35),dt),pitch=canopySpring(m.pitch,T.MathUtils.clamp((m.vy+10.4)*.012+ay*.007,-.25,.25),dt);
  const inflation=ease(.08,.8,age)+(reduced?0:opening.rebound*.11);
  sail.current.scale.set(Math.max(.025,preview?1:inflation),Math.max(.035,(.22+.78*u)*collapse),Math.max(.035,preview?1:inflation));
  sail.current.rotation.set(pitch+(reduced?0:opening.rebound*.12)-(1-collapse)*.25,0,bank);sail.current.position.set(0,(preview?0:-opening.pull*.22),0);sail.current.updateMatrix();
  root.current.updateWorldMatrix(true,false);
  if(!loose){for(const [i,suffix] of ['L','R'].entries()){const grip=body.current?.getObjectByName('pilot-grip-'+suffix);gripReady.current[i]=!!grip;if(grip){grip.getWorldPosition(grips[i]);root.current.worldToLocal(grips[i]);}}}
  geometry.ropes.forEach((r,i)=>{end.copy(r.end).applyMatrix4(sail.current!.matrix);const side=r.start.x<0?0:1,start=loose?loose.grips[side].clone().add(new T.Vector3(0,-Math.min(1,looseAge)*.7,0)):gripReady.current[side]?grips[side]:r.start;direction.copy(end).sub(start);const length=direction.length();dummy.position.copy(start).add(end).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,direction.normalize());dummy.scale.set(1,length,1);dummy.updateMatrix();lines.current!.setMatrixAt(i,dummy.matrix);});lines.current.instanceMatrix.needsUpdate=true;
  const fade=loose?1-ease(2.35,3.2,looseAge):1;for(const mesh of [sail.current,lines.current]){const material=mesh.material as T.MeshStandardMaterial;material.opacity=fade;material.transparent=fade<1;material.depthWrite=fade===1;}
  root.current.updateWorldMatrix(true,false);if(!loose)savedWorld.copy(root.current.matrixWorld);
  if(import.meta.env.DEV&&new URLSearchParams(location.search).get('qa')==='1')Object.assign(window,{__RUNWAY_CANOPY_QA__:{visible:root.current.visible,opening:u,bank,pitch,detached:!!loose,looseAge,opacity:fade,world:root.current.getWorldPosition(worldPosition).toArray(),gripsAttached:loose?[false,false]:[...gripReady.current]}});
 });
 return <group ref={root} visible={false}>
  <mesh name="pilot-canopy" ref={sail} geometry={geometry.canopy} castShadow><meshStandardMaterial vertexColors side={T.DoubleSide} roughness={.65} metalness={.03} color="#ffffff" customProgramCacheKey={()=>'canopy-patterns-42'} onBeforeCompile={shader=>{Object.assign(shader.uniforms,patternUniforms);shader.vertexShader='varying vec2 canopyUv;\n'+shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\ncanopyUv=uv;');shader.fragmentShader='varying vec2 canopyUv;uniform float canopyMode;uniform vec3 canopyA;uniform vec3 canopyB;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 if(canopyMode>.5){vec2 p=canopyUv;float f=0.;
 if(canopyMode>1.5&&canopyMode<2.5)f=step(.5,p.x);
 if(canopyMode>2.5&&canopyMode<3.5)f=mod(floor(p.x*10.)+floor(p.y*4.),2.);
 if(canopyMode>3.5&&canopyMode<4.5)f=smoothstep(.35,.65,.5+.5*sin(p.x*30.+sin(p.y*9.)*2.));
 if(canopyMode>4.5&&canopyMode<5.5){vec2 q=fract(p*vec2(12.,5.))-.5;f=1.-smoothstep(.07,.13,abs(q.x)+abs(q.y));}
 if(canopyMode>5.5)f=.5+.5*sin(p.x*8.+sin(p.y*5.)*2.);
 diffuseColor.rgb=mix(canopyA,canopyB,f);}
 `);}}/></mesh>
  <instancedMesh ref={lines} args={[undefined,undefined,20]} frustumCulled={false}><cylinderGeometry args={[.014,.014,1,4]}/><meshStandardMaterial color="#fff5d5" roughness={.85}/></instancedMesh>
 </group>;
}
