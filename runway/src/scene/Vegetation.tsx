import {useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {treePlaces,grassPlaces} from './habitat';
import type {Runtime} from '../services/runtime';
const dummy=new T.Object3D();
function paint(g:T.BufferGeometry,color:string,leaf=false){const c=new T.Color(color),a=new Float32Array(g.attributes.position.count*3),flex=new Float32Array(g.attributes.position.count);for(let i=0;i<flex.length;i++){a.set(c.toArray(),i*3);flex[i]=leaf?Math.max(0,g.attributes.position.getY(i)-2)*.055:Math.max(0,g.attributes.position.getY(i))*.008;}g.setAttribute('color',new T.Float32BufferAttribute(a,3));g.setAttribute('flex',new T.Float32BufferAttribute(flex,1));return g;}
export function treeGeometry(variant:number,low=false){
 const parts:T.BufferGeometry[]=[],height=variant===1?5.7:variant===2?4.2:5.2,lean=variant===1?1.1:.5;
 const curve=new T.CatmullRomCurve3([new T.Vector3(),new T.Vector3(lean*.1,height*.35,0),new T.Vector3(lean*.5,height*.72,0),new T.Vector3(lean,height,0)]);
 parts.push(paint(new T.TubeGeometry(curve,low?3:6,.19,low?4:5,false),'#ad8265'));
 if(variant===2){for(let i=0;i<(low?2:4);i++)parts.push(paint(new T.IcosahedronGeometry(1,0).scale(1.7,1.05,1.5).translate(lean+Math.sin(i*2.4)*.65,height-.2+Math.cos(i*2.4)*.5,Math.cos(i*2.4)*.65),i%2?'#77b653':'#399b66',true));}
 else {const leaves=low?6:9,segments=low?2:4;for(let i=0;i<leaves;i++){const angle=i/leaves*Math.PI*2+variant*.3,vertices:number[]=[];for(let j=0;j<segments;j++){const t=j/segments,u=(j+1)/segments;const p=(f:number,side:number)=>{const length=(2.5+.35*Math.sin(i*2.4))*f,width=Math.sin(f*Math.PI)*.47+(low?.09:0);return [lean+Math.cos(angle)*length-Math.sin(angle)*width*side,height+.75*Math.sin(f*Math.PI)-f*f*.9+Math.abs(side)*.08*Math.sin(f*12.),Math.sin(angle)*length+Math.cos(angle)*width*side];};vertices.push(...p(t,-1),...p(u,-1),...p(t,1),...p(t,1),...p(u,-1),...p(u,1));}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.computeVertexNormals();parts.push(paint(g,i%2?'#8bc94e':'#42a969',true));}}
 const list=parts.map(g=>{const n=g.index?g.toNonIndexed():g;n.deleteAttribute('uv');return n;}),result=mergeGeometries(list);list.forEach(g=>g.dispose());parts.forEach(g=>g.dispose());return result;
}
export function grassGeometry(){const p:number[]=[];for(let i=0;i<5;i++){
 const a=i*2.399,c=Math.cos(a),s=Math.sin(a),x=c*.16,z=s*.16,w=.055+(i%2)*.018,h=.34+(i%3)*.095;
 const point=(side:number,y:number,bend:number)=>[x+c*side-s*bend,y,z+s*side+c*bend];
 p.push(...point(-w,0,0),...point(w,0,0),...point(w*.45,h*.64,.07),...point(-w,0,0),...point(w*.45,h*.64,.07),...point(0,h,.16));
 }const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.computeVertexNormals();const result=paint(g,'#80b957',true),colors=result.attributes.color;const root=new T.Color('#355d3a'),tip=new T.Color('#a5cb69'),color=new T.Color();for(let i=0;i<colors.count;i++){color.copy(root).lerp(tip,Math.max(0,result.attributes.position.getY(i))/.65);colors.setXYZ(i,color.r,color.g,color.b);}return result;}
export function Vegetation({run,surface}:{run:Runtime|null;surface:(x:number,z:number)=>number}){
 const trees=useMemo(()=>treePlaces().map(p=>({...p,h:surface(p.x,p.z)})),[surface]),grass=useMemo(()=>grassPlaces(trees).map(p=>({...p,h:surface(p.x,p.z)})),[trees,surface]),meshes=useRef<(T.InstancedMesh|null)[]>([]),tufts=useRef<T.InstancedMesh>(null),time=useMemo(()=>({value:0}),[]);
 const reduced=useMemo(()=>matchMedia('(prefers-reduced-motion: reduce)').matches,[]),visibility=useMemo(()=>({last:new T.Vector3(Infinity,0,0),direction:new T.Vector3(),look:new T.Vector3(),frustum:new T.Frustum(),matrix:new T.Matrix4(),sphere:new T.Sphere(new T.Vector3(),2),count:0}),[]);
 const geometries=useMemo(()=>[...Array.from({length:6},(_,i)=>treeGeometry(i%3,i>=3)),grassGeometry()],[]);
 const material=useMemo(()=>{const m=new T.MeshStandardMaterial({vertexColors:true,roughness:.88,side:T.DoubleSide});m.onBeforeCompile=s=>{s.uniforms.lifeTime=time;s.vertexShader='attribute float flex;uniform float lifeTime;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
float seed=instanceMatrix[3].x*.31+instanceMatrix[3].z*.17;
transformed.x+=sin(lifeTime*.85+seed+position.y*.4)*flex;
transformed.z+=cos(lifeTime*.64+seed)*flex*.6;
`);};m.customProgramCacheKey=()=> 'runway-foliage-motion23';return m;},[]);
 const treeMaterials=useMemo(()=>[true,false].map(near=>{const m=material.clone();m.alphaHash=true;m.onBeforeCompile=shader=>{material.onBeforeCompile(shader,null as any);shader.fragmentShader=shader.fragmentShader.replace('#include <alphahash_fragment>',`float detailed=1.-smoothstep(45.,65.,length(vViewPosition));float noise=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);if(${near?'noise>=detailed':'noise<detailed'})discard;`);};m.customProgramCacheKey=()=>near?'tree45-near':'tree45-far';return m;}),[material]);
 const grassMaterial=useMemo(()=>{const m=material.clone();m.onBeforeCompile=s=>{s.uniforms.lifeTime=time;s.vertexShader='uniform float lifeTime;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
float distanceToViewer=distance(cameraPosition,(modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.)).xyz);
float visibility=1.-smoothstep(90.,170.,distanceToViewer);
transformed.y*=visibility;transformed.x+=sin(lifeTime+instanceMatrix[3].z+position.y)*position.y*.12*visibility;
`);};m.customProgramCacheKey=()=> 'runway-grass-island29';return m;},[material]);
 useEffect(()=>()=>{geometries.forEach(g=>g.dispose());material.dispose();grassMaterial.dispose();treeMaterials.forEach(m=>m.dispose());},[geometries,material,grassMaterial,treeMaterials]);
 useFrame(({camera,clock})=>{
  camera.getWorldDirection(visibility.look);
  if(visibility.last.distanceToSquared(camera.position)>.36||visibility.direction.dot(visibility.look)<.999){
   visibility.last.copy(camera.position);visibility.direction.copy(visibility.look);
   visibility.frustum.setFromProjectionMatrix(visibility.matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
   const nearby=grass.map((p,i)=>({i,d:(camera.position.x-p.x)**2+(camera.position.y-p.h)**2+(camera.position.z-p.z)**2})).filter(({i,d})=>{visibility.sphere.radius=2;visibility.sphere.center.set(grass[i].x,grass[i].h,grass[i].z);return d<170*170&&visibility.frustum.intersectsSphere(visibility.sphere);}).sort((a,b)=>a.d-b.d).slice(0,768);
   nearby.forEach(({i},index)=>{const p=grass[i];dummy.position.set(p.x,p.h-.025,p.z);dummy.rotation.set(0,p.yaw,0);dummy.scale.setScalar(p.scale);dummy.updateMatrix();tufts.current?.setMatrixAt(index,dummy.matrix);});
   visibility.count=nearby.length;if(tufts.current){tufts.current.count=nearby.length;tufts.current.instanceMatrix.needsUpdate=true;}
  }
  time.value=reduced?0:run?.presentation.time??clock.elapsedTime;
  const counts=[0,0,0,0,0,0];let nearCount=0;
  trees.forEach(p=>{visibility.sphere.center.set(p.x,p.h+3,p.z);visibility.sphere.radius=6;if(!visibility.frustum.intersectsSphere(visibility.sphere))return;
   const d=visibility.sphere.center.distanceTo(camera.position);dummy.position.set(p.x,p.h-.025,p.z);dummy.rotation.set(0,p.yaw,0);dummy.scale.setScalar(p.scale);dummy.updateMatrix();
   if(d<71){meshes.current[p.variant]?.setMatrixAt(counts[p.variant]++,dummy.matrix);nearCount++;}
   if(d>39)meshes.current[p.variant+3]?.setMatrixAt(counts[p.variant+3]++,dummy.matrix);
  });meshes.current.forEach((m,i)=>{if(m){m.count=counts[i];m.visible=counts[i]>0;m.instanceMatrix.needsUpdate=true;}});
  if(import.meta.env.DEV&&new URLSearchParams(location.search).get('qa')==='1')Object.assign(window,{__RUNWAY_HABITAT_QA__:{trees:trees.length,near:nearCount,grass:grass.length,visibleGrass:visibility.count}});
 });
 return <>{geometries.slice(0,6).map((g,i)=><instancedMesh name={`island-trees-${i}`} key={i} ref={m=>{meshes.current[i]=m;}} args={[g,treeMaterials[i<3?0:1],112]} frustumCulled={false}/>)}<instancedMesh name="island-grass" ref={tufts} args={[geometries[6],grassMaterial,768]} frustumCulled={false}/></>;
}
