import {useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as T from 'three';
import {UPDRAFTS} from '../core/simulation';
import {smooth} from '../services/presentation';
import type {Runtime} from '../services/runtime';
import {atmosphere,CLOUD_REVEAL} from './atmosphere';
const transform=new T.Object3D();

// A rising, tapered ribbon with an arrowhead; two instanced draws for both columns.
function windRibbon(){
 const positions:number[]=[],uv:number[]=[],index:number[]=[];
 for(let i=0;i<=16;i++){
  const u=i/16,w=i===16?0:i>=13?.72:.24;
  for(const side of [-1,1]){positions.push(Math.sin(u*2.8)*.8+side*w,u*7,0);uv.push((side+1)/2,u);}
  if(i<16){const n=i*2;index.push(n,n+1,n+2,n+1,n+3,n+2);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();return g;
}
export function Updrafts({run}:{run:Runtime|null}){
 const ribbons=useRef<T.InstancedMesh>(null),bounds=useRef<T.InstancedMesh>(null);
 const geometry=useMemo(windRibbon,[]),reduced=useMemo(()=>matchMedia('(prefers-reduced-motion: reduce)').matches,[]);
 const uniforms=useMemo(()=>({...T.UniformsUtils.clone(T.UniformsLib.fog),visibility:{value:0}}),[]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 useFrame(({camera})=>{
  const t=run?.presentation.time??0,route=run?.presentation.route??0,visibility=run&&!run.state.outcome?smooth(CLOUD_REVEAL.start-1,CLOUD_REVEAL.end,route):0;

  if(!ribbons.current||!bounds.current)return;
  // Update the material mounted by R3F, not the configuration object used to construct it.
  (ribbons.current.material as T.ShaderMaterial).uniforms.visibility.value=visibility;
  ribbons.current.visible=bounds.current.visible=visibility>0;
  for(let d=0;d<UPDRAFTS.length;d++){
   const column=UPDRAFTS[d],height=column.high-column.low;
   for(let i=0;i<18;i++){
    const life=((i/18+(reduced?0:t*.15))%1),a=i*2.399+(reduced?0:t*.27),fade=smooth(0,.12,life)*(1-smooth(.78,1,life));
    transform.position.set(column.x+Math.cos(a)*column.r*.79,column.low+life*(height-7),column.z+Math.sin(a)*column.r*.79);
    transform.rotation.set(0,Math.atan2(camera.position.x-transform.position.x,camera.position.z-transform.position.z),0);transform.scale.set(fade,1,fade);transform.updateMatrix();ribbons.current.setMatrixAt(d*18+i,transform.matrix);
   }
   for(let i=0;i<3;i++){
    transform.position.set(column.x,column.low+i*height/2,column.z);transform.rotation.set(-Math.PI/2,0,0);transform.scale.setScalar(column.r);transform.updateMatrix();bounds.current.setMatrixAt(d*3+i,transform.matrix);
   }
  }
  ribbons.current.instanceMatrix.needsUpdate=bounds.current.instanceMatrix.needsUpdate=true;
  (bounds.current.material as T.MeshBasicMaterial).opacity=.19*visibility;
  if(import.meta.env.DEV)(window as any).__RUNWAY_DRAFT_QA__={visibility,time:t,ribbons:36,radii:UPDRAFTS.map(d=>d.r),triangles:36*32+6*48*2};
 });
 return <group name="updraft-directions" userData={{collidable:false}}>
  <instancedMesh ref={ribbons} args={[geometry,undefined,36]} frustumCulled={false}>
   <shaderMaterial transparent depthWrite={false} side={T.DoubleSide} forceSinglePass fog uniforms={uniforms} vertexShader={`varying vec2 ribbonUv;
    #include <fog_pars_vertex>
    void main(){ribbonUv=uv;vec4 mvPosition=modelViewMatrix*instanceMatrix*vec4(position,1.);gl_Position=projectionMatrix*mvPosition;
    #include <fog_vertex>
    }`} fragmentShader={`uniform float visibility;varying vec2 ribbonUv;
    #include <fog_pars_fragment>
    void main(){float edge=smoothstep(0.,.15,ribbonUv.x)*(1.-smoothstep(.85,1.,ribbonUv.x));float tail=smoothstep(0.,.3,ribbonUv.y);gl_FragColor=vec4(.1,1.1,.65,edge*tail*.52*visibility);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
    }`}/>
  </instancedMesh>
  <instancedMesh ref={bounds} args={[undefined,undefined,6]} frustumCulled={false}><ringGeometry args={[.985,1,48]}/><meshBasicMaterial color="#73ffd0" transparent opacity={.19} side={T.DoubleSide} forceSinglePass depthWrite={false}/></instancedMesh>
 </group>;
}
export function Rainbow({run}:{run:Runtime|null}){
 const root=useRef<T.Mesh>(null),uniforms=useMemo(()=>({...T.UniformsUtils.clone(T.UniformsLib.fog),visibility:{value:0}}),[]);
 useFrame(()=>{if(!root.current)return;const value=run?atmosphere(run.presentation.route).clearing:0;(root.current.material as T.ShaderMaterial).uniforms.visibility.value=value;root.current.visible=value>0;});
 return <mesh ref={root} name="distant-rainbow" position={[30,2,-260]}>
  <ringGeometry args={[138,146,80,1,0,Math.PI]}/>
  <shaderMaterial uniforms={uniforms} transparent depthWrite={false} side={T.DoubleSide} forceSinglePass fog vertexShader={`varying vec2 arc;
   #include <fog_pars_vertex>
   void main(){arc=position.xy;vec4 mvPosition=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mvPosition;
   #include <fog_vertex>
   }`} fragmentShader={`uniform float visibility;varying vec2 arc;
   #include <fog_pars_fragment>
   void main(){float t=clamp((length(arc)-138.)/8.,0.,1.);float hue=(1.-t)*.73;vec3 rgb=clamp(abs(fract(hue+vec3(0.,2./3.,1./3.))*6.-3.)-1.,0.,1.);rgb=mix(vec3(.82),rgb,.62);
   float alpha=smoothstep(0.,.14,t)*(1.-smoothstep(.86,1.,t))*smoothstep(0.,55.,arc.y)*.48*visibility;
   gl_FragColor=vec4(rgb,alpha);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
   #include <fog_fragment>
   }`}/>
 </mesh>;
}
