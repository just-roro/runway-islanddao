import {useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {COAST,isSafeLanding,terrainHeight} from '../core/simulation';
import {residentPlaces} from './habitat';
import type {Runtime} from '../services/runtime';
const dummy=new T.Object3D();
function painted(g:T.BufferGeometry,color:string){const c=new T.Color(color),a=new Float32Array(g.attributes.position.count*3);for(let i=0;i<a.length;i+=3){a[i]=c.r;a[i+1]=c.g;a[i+2]=c.b;}g.setAttribute('color',new T.Float32BufferAttribute(a,3));return g;}
function merged(parts:T.BufferGeometry[]){const list=parts.map(g=>{const n=g.index?g.toNonIndexed():g;n.deleteAttribute('uv');return n;}),g=mergeGeometries(list);list.forEach(g=>g.dispose());parts.forEach(g=>g.dispose());return g;}
function person(){const p:T.BufferGeometry[]=[];const add=(g:T.BufferGeometry,c:string,x:number,y:number,z:number,part=0)=>{g.translate(x,y,z);g.setAttribute('bodyPart',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count).fill(part),1));p.push(painted(g,c));};
 add(new T.IcosahedronGeometry(.29,1),'#17334c',0,1.48,0);
 add(new T.CylinderGeometry(.21,.21,.07,8),'#a7c3ce',0,1.24,0);
 add(new T.PlaneGeometry(.29,.085),'#5af1cb',0,1.50,.27);
 add(new T.BoxGeometry(.40,.52,.25),'#f4a073',0,1.04,0);
 add(new T.OctahedronGeometry(.29,0).scale(1,.56,.58),'#24465b',0,.77,0);
 for(const [side,index] of [[-1,0],[1,1]]){
  add(new T.BoxGeometry(.13,.27,.15),'#284c65',side*.12,.63,0,5+index*2);
  add(new T.BoxGeometry(.11,.28,.13),'#bfa57b',side*.12,.36,0,6+index*2);
  add(new T.BoxGeometry(.16,.13,.24),'#f4dfb2',side*.12,.18,.06,6+index*2);
  add(new T.BoxGeometry(.12,.24,.14),'#f4a073',side*.27,1.1,0,1+index*2);
  add(new T.BoxGeometry(.10,.22,.12),'#bfa57b',side*.27,.87,0,2+index*2);
 }return merged(p);}
function residentMaterial(time:{value:number},surf=false){const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.83});material.onBeforeCompile=s=>{
 s.uniforms.residentTime=time;
 s.vertexShader=`attribute float bodyPart;uniform float residentTime;
 vec3 turnLimb(vec3 p,vec3 pivot,float a){float c=cos(a),s=sin(a);p-=pivot;p.yz=mat2(c,s,-s,c)*p.yz;return p+pivot;}
 void articulate(inout vec3 p,inout vec3 n){
 float seed=instanceMatrix[3].x*.7+instanceMatrix[3].z*.13;
 float mode=${surf?'3.':'mod(floor(abs(instanceMatrix[0].w)),3.)'};
 float phase=sin(residentTime*3.8+seed),side=bodyPart<3.||(bodyPart>=5.&&bodyPart<7.)?-1.:1.;
 float hip=mode<.5?phase*side*.44*walkAmount:mode>1.5?-.95:0.;
 float knee=mode<.5?max(0.,-phase*side)*.65*walkAmount:mode>1.5?1.35:0.;
 float shoulder=mode<.5?-phase*side*.36*walkAmount:mode<1.5?.16+sin(residentTime*1.6+seed)*.12:mode<2.5?-.12:-.35;
 float elbow=mode<.5?-.18:mode<1.5?-.7-.18*sin(residentTime*1.6+seed):-.35;
 if(bodyPart>=5.){if(mod(bodyPart,2.)<.5){p=turnLimb(p,vec3(side*.12,.50,0.),knee);n=turnLimb(n,vec3(0.),knee);}p=turnLimb(p,vec3(side*.12,.77,0.),hip);n=turnLimb(n,vec3(0.),hip);}
 else if(bodyPart>0.){if(mod(bodyPart,2.)<.5){p=turnLimb(p,vec3(side*.27,.98,0.),elbow);n=turnLimb(n,vec3(0.),elbow);}p=turnLimb(p,vec3(side*.27,1.22,0.),shoulder);n=turnLimb(n,vec3(0.),shoulder);}
 if(mode>1.5&&mode<2.5)p.y-=.25;
 }
 `+s.vertexShader;
 // Encode behaviour in a dedicated instance attribute, never in the transform matrix.
 s.vertexShader=s.vertexShader.replace('attribute float bodyPart;','attribute float bodyPart;attribute float behaviour;attribute float walkAmount;').replace('mod(floor(abs(instanceMatrix[0].w)),3.)','behaviour');
 s.vertexShader=s.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nvec3 normalPoint=position;articulate(normalPoint,objectNormal);');
 s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvec3 ignoredNormal=normal;articulate(transformed,ignoredNormal);');
 };material.customProgramCacheKey=()=> 'runway-resident23-'+surf;return material;}
function umbrella(){const parts:T.BufferGeometry[]=[painted(new T.CylinderGeometry(.045,.045,2.3,5).translate(0,1.15,0),'#e5bd83')];for(let i=0;i<8;i++){const a=i*Math.PI/4,b=(i+1)*Math.PI/4,v=[0,2.6,0,Math.cos(a)*1.6,2.1,Math.sin(a)*1.6,Math.cos(b)*1.6,2.1,Math.sin(b)*1.6],g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.computeVertexNormals();parts.push(painted(g,i%2?'#fff0cd':'#fa7857'));}return merged(parts);}
export function BeachLife({run,surface=terrainHeight}:{run:Runtime|null;surface?:(x:number,z:number)=>number}){
 const folk=useRef<T.InstancedMesh>(null),surf=useRef<T.InstancedMesh>(null),boards=useRef<T.InstancedMesh>(null),canopies=useRef<T.InstancedMesh>(null);
 const view=useMemo(()=>({frustum:new T.Frustum(),matrix:new T.Matrix4(),sphere:new T.Sphere(new T.Vector3(),3)}),[]);
 const places=useMemo(()=>residentPlaces().map(p=>({...p,h:surface(p.x,p.z)})),[surface]),body=useMemo(person,[]),shade=useMemo(umbrella,[]),board=useMemo(()=>new T.SphereGeometry(1,8,4).scale(.42,.09,1.5),[]),time=useMemo(()=>({value:0}),[]),material=useMemo(()=>residentMaterial(time),[]),surfMaterial=useMemo(()=>residentMaterial(time,true),[]);
 const surfers=useMemo(()=>[...Array.from({length:8},(_,i)=>({x:-18+i*7,z:130+(i%3)*8})),...Array.from({length:4},(_,i)=>({x:-38,z:55+i*12}))].map(p=>({x:-p.x,z:-p.z})).filter(p=>!isSafeLanding(p.x,p.z)),[]);
 useEffect(()=>{body.setAttribute('walkAmount',new T.InstancedBufferAttribute(new Float32Array(places.length).fill(1),1));body.setAttribute('behaviour',new T.InstancedBufferAttribute(new Float32Array(places.map(p=>p.variant)),1));if(canopies.current){places.filter(p=>p.variant===2).forEach((p,i)=>{dummy.position.set(p.x,p.h,p.z);dummy.rotation.set(0,p.yaw,0);dummy.scale.setScalar(1);dummy.updateMatrix();canopies.current!.setMatrixAt(i,dummy.matrix);});canopies.current.instanceMatrix.needsUpdate=true;}return()=>{body.dispose();shade.dispose();board.dispose();material.dispose();surfMaterial.dispose();};},[]);
 useFrame(({clock,camera})=>{view.frustum.setFromProjectionMatrix(view.matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));const t=matchMedia('(prefers-reduced-motion: reduce)').matches?0:run?.presentation.time??clock.elapsedTime;time.value=t;
  let count=0,shadeCount=0;const gait=body.getAttribute('walkAmount') as T.InstancedBufferAttribute,behaviour=body.getAttribute('behaviour') as T.InstancedBufferAttribute;
  places.forEach((p,i)=>{
   view.sphere.center.set(p.x,p.h+1,p.z);if(!view.frustum.intersectsSphere(view.sphere)||view.sphere.center.distanceTo(camera.position)>230)return;
   const walk=p.variant===0?Math.sin(t*.42+i)*.9:0,x=p.x+Math.sin(p.yaw)*walk,z=p.z+Math.cos(p.yaw)*walk;
   dummy.position.set(x,surface(x,z)-.115*p.scale+.02,z);dummy.rotation.set(0,p.yaw+(p.variant===0?Math.PI*T.MathUtils.smoothstep(-Math.cos(t*.42+i),-.25,.25):0),0);dummy.scale.setScalar(p.scale);dummy.updateMatrix();folk.current?.setMatrixAt(count,dummy.matrix);
   if(gait){gait.setX(count,Math.abs(Math.cos(t*.42+i)));behaviour.setX(count,p.variant);}count++;
   if(p.variant===2){dummy.position.set(p.x,p.h,p.z);dummy.rotation.set(0,p.yaw,0);dummy.scale.setScalar(1);dummy.updateMatrix();canopies.current?.setMatrixAt(shadeCount++,dummy.matrix);}
  });
  if(gait){gait.needsUpdate=true;behaviour.needsUpdate=true;}
  if(folk.current){folk.current.count=count;folk.current.visible=count>0;folk.current.instanceMatrix.needsUpdate=true;}
  if(canopies.current){canopies.current.count=shadeCount;canopies.current.visible=shadeCount>0;canopies.current.instanceMatrix.needsUpdate=true;}
  surfers.forEach((p,i)=>{const wave=Math.sin(t*1.2+i),x=p.x+Math.sin(t*.23+i)*2,z=p.z+Math.cos(t*.3+i)*1.7,h=.25+wave*.25;dummy.position.set(x,h,z);dummy.rotation.set(wave*.08,.45+Math.sin(t*.23+i)*.3,-wave*.09);dummy.scale.set(1,1,1);dummy.updateMatrix();boards.current?.setMatrixAt(i,dummy.matrix);dummy.position.y+=.15;dummy.scale.setScalar(.9);dummy.rotation.z-=.14;dummy.updateMatrix();surf.current?.setMatrixAt(i,dummy.matrix);});if(boards.current)boards.current.instanceMatrix.needsUpdate=true;if(surf.current)surf.current.instanceMatrix.needsUpdate=true;
 });
 return <><instancedMesh name="island-residents" ref={folk} args={[body,material,places.length]} frustumCulled={false}/><instancedMesh ref={canopies} args={[shade,undefined,places.filter(p=>p.variant===2).length]} frustumCulled={false}><meshStandardMaterial vertexColors side={T.DoubleSide} roughness={.8}/></instancedMesh><instancedMesh ref={surf} args={[body,surfMaterial,surfers.length]} frustumCulled={false}/><instancedMesh ref={boards} args={[board,undefined,surfers.length]} frustumCulled={false}><meshStandardMaterial color="#ffe05d" roughness={.4}/></instancedMesh></>;
}
// Surf ribbons follow the real coastline. No foam crossing the interior of bays or land.
export function ShoreBreak({run}:{run:Runtime|null}){const mesh=useRef<T.Mesh>(null),material=useRef<T.ShaderMaterial>(null);const geometry=useMemo(()=>{const p:number[]=[],uv:number[]=[],normals=COAST.map((a,i)=>{const b=COAST[(i+1)%COAST.length],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);let x=-dz/len,z=dx/len;if(isSafeLanding((a[0]+b[0])/2+x,(a[1]+b[1])/2+z)){x=-x;z=-z;}return{x,z};});
 const edge=COAST.map((_,i)=>{const n=normals[i],prev=normals[(i+COAST.length-1)%COAST.length],length=Math.hypot(n.x+prev.x,n.z+prev.z)||1;return{x:(n.x+prev.x)/length,z:(n.z+prev.z)/length};});let distance=0;
 for(let i=0;i<COAST.length;i++){const next=(i+1)%COAST.length,a=COAST[i],b=COAST[next],na=edge[i],nb=edge[next],len=Math.hypot(b[0]-a[0],b[1]-a[1]);const vertices=[[a[0]+na.x*.4,a[1]+na.z*.4,distance,0],[b[0]+nb.x*.4,b[1]+nb.z*.4,distance+len,0],[a[0]+na.x*5,a[1]+na.z*5,distance,1],[b[0]+nb.x*5,b[1]+nb.z*5,distance+len,1]];for(const j of[0,1,2,2,1,3]){const v=vertices[j];p.push(v[0],.06,v[1]);uv.push(v[2],v[3]);}distance+=len;}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));return g;},[]);useEffect(()=>()=>geometry.dispose(),[geometry]);useFrame(({clock})=>{if(material.current)material.current.uniforms.time.value=run?.presentation.time??clock.elapsedTime;});return <mesh ref={mesh} geometry={geometry}><shaderMaterial ref={material} transparent depthWrite={false} side={T.DoubleSide} fog uniforms={{time:{value:0},...T.UniformsUtils.clone(T.UniformsLib.fog)}} vertexShader={`varying vec2 vUv;
#include <fog_pars_vertex>
void main(){vUv=uv;vec4 mvPosition=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mvPosition;
#include <fog_vertex>
}`} fragmentShader={`uniform float time;varying vec2 vUv;
#include <fog_pars_fragment>
void main(){float phase=fract(vUv.y*2.+time*.17+sin(vUv.x*.25)*.02);float crest=pow(max(0.,1.-abs(phase-.5)*9.),2.);float ripple=.65+.35*sin(vUv.x*1.8+time*.7);float alpha=crest*ripple*(1.-smoothstep(.65,1.,vUv.y))*.38;gl_FragColor=vec4(.8,1.,.94,alpha);
#include <fog_fragment>
#include <colorspace_fragment>
}`}/></mesh>;}
