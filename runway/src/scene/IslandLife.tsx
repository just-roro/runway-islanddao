import {useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

import {terrainHeight,TIMING} from '../core/simulation';
import {smooth} from '../services/presentation';
import {BRIDGE,bridgeHeight} from './environmentLayout';
import type {Runtime} from '../services/runtime';
const BIRDS=15,SKIS=4;
const transform=new T.Object3D();

function paint(g:T.BufferGeometry,color:string){
 const c=new T.Color(color),colors=new Float32Array(g.attributes.position.count*3);
 for(let i=0;i<colors.length;i+=3){colors[i]=c.r;colors[i+1]=c.g;colors[i+2]=c.b;}
 g.setAttribute('color',new T.Float32BufferAttribute(colors,3));return g;
}
function join(parts:T.BufferGeometry[]){
 const buffers=parts.map(g=>{const p=g.index?g.toNonIndexed():g;p.deleteAttribute('uv');return p;});
 const result=mergeGeometries(buffers);buffers.forEach(g=>g.dispose());parts.forEach(g=>g.dispose());
 result.computeBoundingSphere();return result;
}
function beam(a:T.Vector3,b:T.Vector3,width:number,depth=width){
 const g=new T.BoxGeometry(width,a.distanceTo(b),depth);
 const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize());
 g.applyQuaternion(q).translate((a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2);return g;
}

// One merged draw: detailed suspension span near shore, sparse viaduct in haze.
export function createBridgeGeometry(surface=terrainHeight){
 const parts:T.BufferGeometry[]=[],steel='#d88669',rail='#ffc18d',concrete='#d9ccb1';
 const add=(g:T.BufferGeometry,c:string)=>parts.push(paint(g,c));
 const bar=(a:number[],b:number[],w:number,c=steel,d=w)=>{const g=beam(new T.Vector3(...a),new T.Vector3(...b),w,d),index=Array.from(g.index!.array);g.setIndex([...index.slice(0,12),...index.slice(24)]);add(g,c);};
 const w=BRIDGE.width/2,base=surface(BRIDGE.x,BRIDGE.z);
 for(let z=0;z<BRIDGE.length;){const end=Math.min(BRIDGE.length,z+(z<70?5:z<350?20:100)),y=bridgeHeight(z,base),next=bridgeHeight(end,base);
  bar([0,y-.4,z],[0,next-.4,end],BRIDGE.width,concrete,.8);
  bar([0,y+.015,z],[0,next+.015,end],BRIDGE.width-.65,'#384e57',.045);
  for(const side of[-w,w])bar([side,y+.7,z],[side,next+.7,end],.16,rail);
  if(z>22&&z<800&&z%20===10||z>=350&&z<800)bar([0,-1,z],[0,y-.8,z],1.5,concrete,2.4);
  if(z<350)add(new T.BoxGeometry(.13,.025,Math.min(3,end-z)).translate(0,(y+next)/2+.05,(z+end)/2),'#f8dd9f');
  z=end;
 }
 for(const z of[105,235]){
  for(const x of[-w,w]){add(new T.BoxGeometry(3,6,5).translate(x,2,z),concrete);add(new T.BoxGeometry(1.2,35,1.7).translate(x,21,z),steel);}
  for(const y of[14,25,36]){bar([-w,y,z],[w,y,z],.65,rail);if(y<36){bar([-w,y,z],[w,y+11,z],.3);bar([w,y,z],[-w,y+11,z],.3);}}
 }
 for(const x of[-w,w]){
  const cable=(z:number)=>z<105?10+(z-65)/40*28:z>235?38-(z-235)/65*28:16+22*((z-170)/65)**2;
  for(let z=65;z<300;z+=5){bar([x,cable(z),z],[x,cable(z+5),z+5],.23,rail);if(z%10===5)bar([x,10,z],[x,cable(z),z],.1,rail);}
  bar([x,8,65],[x,8,300],.4);for(let z=65;z<300;z+=10){bar([x,8,z],[x,9.2,z+5],.2);bar([x,9.2,z+5],[x,8,z+10],.2);}
 }
 const g=join(parts);g.rotateY(BRIDGE.yaw).translate(BRIDGE.x,0,BRIDGE.z);g.computeBoundingSphere();return g;
}

export function createBirdGeometry(){
 const parts:T.BufferGeometry[]=[paint(new T.IcosahedronGeometry(.22,0).scale(.68,.8,2),'#fff3d7')];
 for(const side of[-1,1]){
  const p=new T.BufferGeometry();
  p.setAttribute('position',new T.Float32BufferAttribute([
   side*.1,0,-.22,side*1.05,.05,.1,side*.65,0,.36,
   side*.1,0,-.22,side*.65,0,.36,side*.13,0,.22,
  ],3));p.computeVertexNormals();parts.push(paint(p,'#f5e9d1'));
  const tip=new T.BufferGeometry();tip.setAttribute('position',new T.Float32BufferAttribute([
   side*1.05,.05,.1,side*1.43,.02,.32,side*.65,0,.36,
  ],3));tip.computeVertexNormals();parts.push(paint(tip,'#30465c'));
 }
 parts.push(paint(new T.ConeGeometry(.065,.2,4).rotateX(-Math.PI/2).translate(0,0,-.48),'#f3bd63'));
 return join(parts);
}

export function createJetskiGeometry(){
 const parts:T.BufferGeometry[]=[],add=(g:T.BufferGeometry,c:string)=>parts.push(paint(g,c));
 add(new T.SphereGeometry(1,8,4).scale(.72,.3,1.6),'#fcbd49');
 add(new T.BoxGeometry(1.08,.15,2.25).translate(0,.12,.05),'#17394d');
 add(new T.BoxGeometry(.9,.45,.85).rotateX(-.2).translate(0,.38,-.62),'#25bdb1');
 add(new T.BoxGeometry(.55,.28,1.15).translate(0,.45,.25),'#26394a');
 add(new T.BoxGeometry(.88,.08,.08).translate(0,.82,-.55),'#e9dfc5');
 // Seated rider silhouette: knees, elbows, dark vest and pale sun helmet.
 add(new T.BoxGeometry(.42,.65,.3).rotateX(-.24).translate(0,1.12,.2),'#f17b57');
 add(new T.IcosahedronGeometry(.23,0).translate(0,1.61,.03),'#fff0c7');
 add(new T.BoxGeometry(.3,.11,.08).translate(0,1.61,-.18),'#243e59');
 for(const side of[-1,1]){
  const limb=(a:number[],b:number[],w:number,c:string)=>add(beam(new T.Vector3(...a),new T.Vector3(...b),w),c);
  limb([side*.27,.8,.3],[side*.45,.5,-.05],.22,'#214c62');
  limb([side*.45,.5,-.05],[side*.46,.22,.42],.18,'#b67b59');
  limb([side*.23,1.32,.13],[side*.4,1.01,-.12],.13,'#b67b59');
  limb([side*.4,1.01,-.12],[side*.35,.83,-.55],.12,'#b67b59');
 }
 return join(parts);
}

export function IslandLife({run,surface}:{run:Runtime|null;surface:(x:number,z:number)=>number}){
 const birds=useRef<T.InstancedMesh>(null),skis=useRef<T.InstancedMesh>(null),wakes=useRef<T.InstancedMesh>(null);
 const reduced=useMemo(()=>matchMedia('(prefers-reduced-motion: reduce)').matches,[]);
 const geometry=useMemo(()=>({bridge:createBridgeGeometry(surface),bird:createBirdGeometry(),ski:createJetskiGeometry(),wake:new T.PlaneGeometry(5,12).rotateX(-Math.PI/2).translate(0,0,7)}),[]);
 const wingTime=useMemo(()=>({value:0}),[]);
 const birdMaterial=useMemo(()=>new T.MeshStandardMaterial({vertexColors:true,roughness:.85,side:T.DoubleSide}),[]);
 useEffect(()=>{
  birdMaterial.onBeforeCompile=shader=>{
   shader.uniforms.wingTime=wingTime;
   shader.vertexShader='uniform float wingTime;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    float wing=max(0.,abs(position.x)-.15);
    transformed.y+=wing*sin(wingTime*3.2+instanceMatrix[3].z*.1)*.24;
   `);
  };
  birdMaterial.needsUpdate=true;
  return()=>{Object.values(geometry).forEach(g=>g.dispose());birdMaterial.dispose();};
 },[geometry,birdMaterial,wingTime]);
 useFrame(({clock})=>{
  const t=reduced?0:run?.presentation.time??clock.elapsedTime;wingTime.value=t;
  for(let i=0;i<BIRDS;i++){
   const flock=Math.floor(i/3),phase=t*.075+flock*1.8,offset=i%3-1;
   const side=flock%2?1:-1,x=side*(78+Math.sin(phase)*11)+offset*2.4,z=-105+flock*47+Math.cos(phase)*15+Math.abs(offset)*2;
   const route=run?.presentation.route??0,h=run?.presentation.position[1]??0;
   const join=run&&flock<2?smooth(TIMING.cloud-1,TIMING.glide+.5,route)*smooth(7,28,h):0;
   const nearbyX=(run?.presentation.position[0]??0)+side*(5.8+flock*3)+offset*1.5+Math.sin(phase)*.7;
   const nearbyZ=(run?.presentation.position[2]??0)-8-flock*5+Math.abs(offset)*2;
   transform.position.set(T.MathUtils.lerp(x,nearbyX,join),T.MathUtils.lerp(34+flock*9+Math.sin(phase*2)*2,h+1.6+flock*2+Math.sin(phase*2)*.6,join),T.MathUtils.lerp(z,nearbyZ,join));
   const ambientYaw=Math.atan2(-side*Math.cos(phase)*11,Math.sin(phase)*15),flightYaw=Math.atan2(-(run?.state.vx??0),-(run?.state.vy??-1));
   transform.rotation.set(0,ambientYaw+Math.atan2(Math.sin(flightYaw-ambientYaw),Math.cos(flightYaw-ambientYaw))*join,Math.sin(phase)*.10);
   transform.scale.setScalar(.62+(i%3)*.04);transform.updateMatrix();birds.current?.setMatrixAt(i,transform.matrix);
  }
  if(birds.current)birds.current.instanceMatrix.needsUpdate=true;
  for(let i=0;i<SKIS;i++){
   const side=i%2?1:-1,phase=t*.12+i*2.1,width=side<0?3:5;
   const x=side*((side<0?88:97)+Math.sin(phase)*width),z=-30+Math.floor(i/2)*75+Math.cos(phase)*34;
   const yaw=Math.atan2(-side*Math.cos(phase)*width,Math.sin(phase)*34);
   transform.position.set(x,.28+Math.sin(t*2+i)*.045,z);
   transform.rotation.set(Math.sin(t*2+i)*.025,yaw,Math.cos(phase)*.1);transform.scale.setScalar(1.2);transform.updateMatrix();skis.current?.setMatrixAt(i,transform.matrix);
   transform.position.y=.37;transform.rotation.set(0,yaw,0);transform.updateMatrix();wakes.current?.setMatrixAt(i,transform.matrix);
  }
  if(skis.current)skis.current.instanceMatrix.needsUpdate=true;if(wakes.current)wakes.current.instanceMatrix.needsUpdate=true;
 });
 return <>
  <mesh name="floripa-bridge" geometry={geometry.bridge}><meshStandardMaterial vertexColors alphaHash roughness={.62} metalness={.18} customProgramCacheKey={()=>'bridge-island29'} onBeforeCompile={s=>{s.fragmentShader=s.fragmentShader.replace('#include <alphahash_fragment>',`
 // Dithered distance coverage preserves depth and fades into the actual background.
 diffuseColor.a*=1.-smoothstep(${BRIDGE.hazeNear.toFixed(1)},${BRIDGE.hazeFar.toFixed(1)},length(vViewPosition));
 #include <alphahash_fragment>`);}}/></mesh>
  <instancedMesh ref={birds} args={[geometry.bird,birdMaterial,BIRDS]} frustumCulled={false}/>
  <instancedMesh ref={skis} args={[geometry.ski,undefined,SKIS]} frustumCulled={false}><meshStandardMaterial vertexColors roughness={.48} metalness={.08}/></instancedMesh>
  <instancedMesh ref={wakes} args={[geometry.wake,undefined,SKIS]} frustumCulled={false}><shaderMaterial transparent depthWrite={false} side={T.DoubleSide} forceSinglePass fog uniforms={T.UniformsUtils.clone(T.UniformsLib.fog)} vertexShader={`varying vec2 vUv;
   #include <fog_pars_vertex>
   void main(){vUv=uv;vec4 mvPosition=modelViewMatrix*instanceMatrix*vec4(position,1.);gl_Position=projectionMatrix*mvPosition;
   #include <fog_vertex>
   }`} fragmentShader={`varying vec2 vUv;
   #include <fog_pars_fragment>
   void main(){float tail=1.-vUv.y;float side=abs(vUv.x-.5);float edge=exp(-pow((side-tail*.42)*30.,2.));float fade=smoothstep(0.,.14,tail)*(1.-smoothstep(.5,1.,tail));gl_FragColor=vec4(.73,1.,.95,edge*fade*.48);
   #include <fog_fragment>
   #include <colorspace_fragment>
   }`}/></instancedMesh>
 </>;
}
