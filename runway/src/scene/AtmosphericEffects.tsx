import {itemVisualSize} from './itemVisibility';
import {useRef,useLayoutEffect} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {objectPose,START_Z,AIRCRAFT,landingSurface,terrainHeight} from '../core/simulation';
import type {Runtime} from '../services/runtime';
const dummy=new THREE.Object3D(),positive=new THREE.Color('#32ffad'),negative=new THREE.Color('#ff4836');
export function ObjectGlows({run}:{run:Runtime}){
 const mesh=useRef<THREE.InstancedMesh>(null);
 useFrame(({camera})=>{if(!mesh.current)return;const s=run.state,t=s.routeTime;let count=0;for(const o of s.objects){if(count>=128||s.collected.includes(o.id)||['star','gate','risk'].includes(o.kind)||!!o.vertical!==(s.phase==='land'||s.phase==='finish'))continue;const p=objectPose(o,t);if(p.y>s.altitude+25||p.y<s.altitude-140)continue;const bad=['gas','rug','hacked'].includes(o.kind),r=itemVisualSize(o);dummy.position.set(p.x,p.y,p.z);dummy.quaternion.copy(camera.quaternion);dummy.rotateZ(t*.55+o.t*1.7);dummy.scale.setScalar(r*5.2);dummy.updateMatrix();mesh.current.setMatrixAt(count,dummy.matrix);mesh.current.setColorAt(count,bad?negative:positive);count++;}mesh.current.count=count;mesh.current.instanceMatrix.needsUpdate=true;if(mesh.current.instanceColor)mesh.current.instanceColor.needsUpdate=true;});
 return <instancedMesh ref={mesh} args={[undefined,undefined,128]} frustumCulled={false}><planeGeometry/><shaderMaterial transparent depthWrite={false} blending={THREE.AdditiveBlending} vertexColors fog uniforms={THREE.UniformsUtils.clone(THREE.UniformsLib.fog)} vertexShader={`varying vec2 vUv;varying vec3 glow;
 #include <fog_pars_vertex>
 void main(){vUv=uv;glow=instanceColor;vec4 mvPosition=modelViewMatrix*instanceMatrix*vec4(position,1.);gl_Position=projectionMatrix*mvPosition;
 #include <fog_vertex>
 }`} fragmentShader={`varying vec2 vUv;varying vec3 glow;
 #include <fog_pars_fragment>
 void main(){vec2 p=(vUv-.5)*2.;float r=length(p);vec2 d=abs(p);float aa=max(fwidth(r),.006);
 float support=1.-smoothstep(.88,1.,r);
 float halo=exp(-r*r*7.)*.18;
 float crossRay=exp(-min(d.x,d.y)*65.)*pow(max(0.,1.-max(d.x,d.y)),1.1);
 vec2 diagonal=abs(vec2(p.x+p.y,p.x-p.y))*.7071;
 float secondary=exp(-min(diagonal.x,diagonal.y)*90.)*(1.-smoothstep(.12,.65,max(diagonal.x,diagonal.y)))*.28;
 float core=1.-smoothstep(.035-aa,.065+aa,r);
 float alpha=(halo+crossRay*1.4+secondary+core*.45)*support*(1.-smoothstep(65.,200.,vFogDepth));
 gl_FragColor=vec4(glow*3.8,alpha);}`}/></instancedMesh>;
}
export function ContactShadow({run}:{run:Runtime|null}){
 const ref=useRef<THREE.Mesh>(null),material=useRef<THREE.ShaderMaterial>(null);
 useFrame(()=>{if(!ref.current||!material.current)return;const s=run?.state,t=(s?.tick||0)/60,menu=!s||t<3,floor=menu?AIRCRAFT.floor+.065:landingSurface(s.x,s.y)+.035,above=s?s.altitude-floor:1.4;ref.current.visible=menu||above<8;if(!ref.current.visible)return;ref.current.position.set(s?.x||0,floor,s?.y??START_Z+5);ref.current.scale.setScalar(menu?2.8:2.4+above*.22);material.current.uniforms.alpha.value=menu?.38:Math.max(0,.32-above*.032);});
 return <mesh ref={ref} rotation={[-Math.PI/2,0,0]}><planeGeometry/><shaderMaterial ref={material} transparent depthWrite={false} uniforms={{alpha:{value:.2}}} vertexShader="varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}" fragmentShader="varying vec2 vUv;uniform float alpha;void main(){float d=length(vUv-.5)*2.;gl_FragColor=vec4(.015,.06,.075,pow(max(0.,1.-d),1.8)*alpha);}"/></mesh>;
}

// Terrain-conforming contact shadows: one batched draw, no mobile shadow map.
export function BuildingShadows({buildings}:{buildings:{x:number;z:number;w:number;d:number;h:number}[]}){
 const mesh=useRef<THREE.InstancedMesh>(null);
 useLayoutEffect(()=>{if(!mesh.current)return;for(let i=0;i<buildings.length;i++){const b=buildings[i];dummy.position.set(b.x+.7,terrainHeight(b.x,b.z)+.05,b.z+.7);dummy.rotation.set(-Math.PI/2,0,0);dummy.scale.set(b.w*1.9,b.d*1.9,1);dummy.updateMatrix();mesh.current.setMatrixAt(i,dummy.matrix);}mesh.current.instanceMatrix.needsUpdate=true;},[buildings]);
 return <instancedMesh ref={mesh} args={[undefined,undefined,buildings.length]}><planeGeometry/><shaderMaterial transparent depthWrite={false} fog uniforms={THREE.UniformsUtils.clone(THREE.UniformsLib.fog)} vertexShader={`varying vec2 vUv;
 #include <fog_pars_vertex>
 void main(){vUv=uv;vec4 mvPosition=modelViewMatrix*instanceMatrix*vec4(position,1.);gl_Position=projectionMatrix*mvPosition;
 #include <fog_vertex>
 }`} fragmentShader={`varying vec2 vUv;
 #include <fog_pars_fragment>
 void main(){float d=length((vUv-.5)*2.);float a=pow(max(0.,1.-d),1.5)*.28;gl_FragColor=vec4(.02,.08,.10,a);
 #include <fog_fragment>
 }`}/></instancedMesh>;
}
