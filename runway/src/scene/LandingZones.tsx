import {useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {DESTINATIONS,terrainHeight,rng} from '../core/simulation';
import {hasPlatformVictory} from './worldLayout';
import type {Runtime} from '../services/runtime';
const dummy=new T.Object3D(),axis=new T.Vector3(0,1,0),direction=new T.Vector3();
export function platformGeometry(){
 const parts:T.BufferGeometry[]=[];
 const add=(g:T.BufferGeometry,c:string,x:number,y:number,z:number)=>{const n=g.index?g.toNonIndexed():g;g!==n&&g.dispose();n.deleteAttribute('uv');n.translate(x,y,z);const color=new T.Color(c),data=new Float32Array(n.attributes.position.count*3);for(let i=0;i<data.length;i+=3)data.set([color.r,color.g,color.b],i);n.setAttribute('color',new T.Float32BufferAttribute(data,3));parts.push(n);};
 for(const d of DESTINATIONS){
  add(new T.CylinderGeometry(d.radius,d.radius,.9,32),'#344e60',d.x,d.height-.45,d.z);
  add(new T.RingGeometry(d.radius*.88,d.radius*.98,32).rotateX(-Math.PI/2),d.color,d.x,d.height+.012,d.z);
  add(new T.RingGeometry(d.radius*.68,d.radius*.70,32).rotateX(-Math.PI/2),'#b2c5b6',d.x,d.height+.014,d.z);
  // Thick paired chevrons read as a landing symbol from above, not a building.
  for(const row of[-.16,.16])for(const side of[-1,1])add(new T.PlaneGeometry(d.radius*.085,d.radius*.48).rotateZ(side*.72).rotateX(-Math.PI/2),'#fff1bf',d.x+side*d.radius*.15,d.height+.018,d.z+row*d.radius);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;add(new T.BoxGeometry(.46,.18,.46),d.color,d.x+Math.sin(a)*d.radius*.92,d.height+.10,d.z+Math.cos(a)*d.radius*.92);}
  for(const side of[-1,1]){
   const x=d.x+side*(d.radius+2.5),z=d.z-5,h=terrainHeight(x,z);
   add(new T.CylinderGeometry(.65,.8,.4,8),'#526674',x,h+.2,z);
   add(new T.BoxGeometry(.8,1,.7),'#203b51',x,h+.8,z);
   add(new T.CylinderGeometry(.47,.39,.38,8),'#b6e9df',x,h+1.45,z);
  }
 }
 const result=mergeGeometries(parts);parts.forEach(g=>g.dispose());return result;
}
const beamVertex=`varying vec2 beamUv;
#include <fog_pars_vertex>
void main(){beamUv=uv;vec4 mvPosition=modelViewMatrix*instanceMatrix*vec4(position,1.);gl_Position=projectionMatrix*mvPosition;
#include <fog_vertex>
}`;
const beamFragment=`varying vec2 beamUv;
#include <fog_pars_fragment>
void main(){float height=beamUv.y;float fade=smoothstep(0.,.12,height)*(1.-smoothstep(.48,1.,height));float side=pow(abs(sin(beamUv.x*6.28318)),2.);gl_FragColor=vec4(.42,1.25,.95,fade*(.035+.045*side));
#include <tonemapping_fragment>
#include <colorspace_fragment>
#include <fog_fragment>
}`;
export function LandingZones({run}:{run:Runtime|null}){
 const platform=useMemo(platformGeometry,[]),lights=useRef<T.InstancedMesh>(null),reduced=useMemo(()=>matchMedia('(prefers-reduced-motion: reduce)').matches,[]);
 const cone=useMemo(()=>new T.CylinderGeometry(3.6,.12,32,12,1,true).translate(0,16,0),[]);
 useEffect(()=>()=>{platform.dispose();cone.dispose();},[platform,cone]);
 useFrame(({clock,camera})=>{let i=0;const t=reduced?0:run?.presentation.time??clock.elapsedTime;
  for(const d of DESTINATIONS)for(const side of[-1,1]){
   const x=d.x+side*(d.radius+2.5),z=d.z-5,h=terrainHeight(x,z)+1.65;
   if(camera.position.distanceTo(direction.set(x,h,z))>280)continue;
   dummy.position.set(x,h,z);direction.set(side*(.22+Math.sin(t*.24+d.z)*.06),1,-.14+Math.cos(t*.21+d.z)*.07).normalize();dummy.quaternion.setFromUnitVectors(axis,direction);dummy.scale.setScalar(1);dummy.updateMatrix();lights.current?.setMatrixAt(i++,dummy.matrix);
  }
  if(lights.current){lights.current.count=i;lights.current.visible=i>0;lights.current.instanceMatrix.needsUpdate=true;}
 });
 return <><mesh name="functional-landing-platforms" geometry={platform} receiveShadow><meshStandardMaterial vertexColors roughness={.54} metalness={.22}/></mesh>
  <instancedMesh name="landing-searchlights" ref={lights} args={[cone,undefined,6]} frustumCulled={false}><shaderMaterial transparent depthWrite={false} side={T.DoubleSide} forceSinglePass blending={T.AdditiveBlending} fog uniforms={T.UniformsUtils.clone(T.UniformsLib.fog)} vertexShader={beamVertex} fragmentShader={beamFragment}/></instancedMesh>
  <PlatformFireworks run={run}/>
 </>;
}
function fireworksGeometry(){const random=rng(39003),position:number[]=[],velocity:number[]=[],birth:number[]=[],color:number[]=[];
 for(let burst=0;burst<3;burst++)for(let i=0;i<64;i++){
  const a=i/64*Math.PI*2,z=random()*2-1,r=Math.sqrt(1-z*z),speed=2.2+random()*2.3,c=new T.Color(['#ffd47f','#69ffd2','#a1dcff'][burst]);
  position.push((burst-1)*4.2,4+(burst%2)*1.6,-3);velocity.push(Math.cos(a)*r*speed,z*speed*.8+1.2,Math.sin(a)*r*speed);birth.push(.10+burst*.50);color.push(c.r*3,c.g*3,c.b*3);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(position,3));g.setAttribute('velocity',new T.Float32BufferAttribute(velocity,3));g.setAttribute('birth',new T.Float32BufferAttribute(birth,1));g.setAttribute('color',new T.Float32BufferAttribute(color,3));return g;
}
function PlatformFireworks({run}:{run:Runtime|null}){
 const ref=useRef<T.Points>(null),g=useMemo(fireworksGeometry,[]),uniforms=useMemo(()=>({age:{value:-1},pixelRatio:{value:1},...T.UniformsUtils.clone(T.UniformsLib.fog)}),[]);
 useEffect(()=>()=>g.dispose(),[g]);
 useFrame(({gl})=>{const age=run?.presentation.landingAge??-1,valid=!!run&&hasPlatformVictory(run.state),visible=valid&&age>=0&&age<4.8;if(ref.current){ref.current.visible=visible;if(visible){const d=DESTINATIONS.find(d=>d.id===run!.state.destination)!;ref.current.position.set(d.x,d.height,d.z);}}if(ref.current){const material=ref.current.material as T.ShaderMaterial;material.uniforms.age.value=age;material.uniforms.pixelRatio.value=gl.getPixelRatio();}
  if(import.meta.env.DEV)(window as any).__RUNWAY_PLATFORM_QA__={valid,fireworks:visible,age,shaderAge:ref.current?(ref.current.material as T.ShaderMaterial).uniforms.age.value:-1};
 });
 return <points name="platform-victory-fireworks" ref={ref} geometry={g} frustumCulled={false} visible={false}><shaderMaterial transparent vertexColors depthWrite={false} blending={T.AdditiveBlending} fog uniforms={uniforms} vertexShader={`attribute vec3 velocity;attribute float birth;uniform float age;uniform float pixelRatio;varying float alive;varying vec3 sparkColor;
 #include <fog_pars_vertex>
 void main(){float t=age-birth;alive=step(0.,t)*(1.-smoothstep(.65,2.8,t));t=max(0.,t);vec3 p=position+velocity*(1.-exp(-t*.75))/.75;p.y-=t*t*1.25;vec4 mvPosition=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mvPosition;gl_PointSize=clamp(210.*pixelRatio/max(1.,-mvPosition.z),1.,8.);sparkColor=color;
 #include <fog_vertex>
 }`} fragmentShader={`varying float alive;varying vec3 sparkColor;
 #include <fog_pars_fragment>
 void main(){float r=length(gl_PointCoord-.5)*2.;float a=(1.-smoothstep(.25,1.,r))*alive;if(a<.01)discard;gl_FragColor=vec4(sparkColor,a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 #include <fog_fragment>
 }`}/></points>;
}
