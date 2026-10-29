import {useEffect,useMemo,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as T from 'three';
import type {Runtime} from '../services/runtime';
import {AIRCRAFT,START_Z,CLOUD_DECK} from '../core/simulation';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {doorOpening} from './environments';
import {cloudField,type CloudLobe} from './cloudField';
import {stormBank} from './stormBank';
import {atmosphere} from './atmosphere';
import {thunder} from '../services/audio';
const dummy=new T.Object3D(),cloudColor=new T.Color();
export {SUN_DIRECTION} from './lighting';
import {SUN_DIRECTION} from './lighting';
export function SummerSky({run}:{run:Runtime|null}){const root=useRef<T.Mesh>(null),haze=useMemo(()=>({value:new T.Color('#8ed4e4')}),[]),immersion=useMemo(()=>({value:0}),[]);useFrame(({camera,scene})=>{if(!root.current)return;root.current.position.copy(camera.position);const u=(root.current.material as T.ShaderMaterial).uniforms;u.immersion.value=atmosphere(run?.presentation.route??0).immersion;if(scene.fog instanceof T.Fog)u.haze.value.copy(scene.fog.color);});return <mesh ref={root} renderOrder={-10} frustumCulled={false}><sphereGeometry args={[2200,24,12]}/><shaderMaterial side={T.BackSide} depthWrite={false} toneMapped={false} uniforms={{sun:{value:SUN_DIRECTION},haze,immersion}} vertexShader={`varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`} fragmentShader={`varying vec3 direction;uniform vec3 sun;uniform vec3 haze;uniform float immersion;
 void main(){vec3 d=normalize(direction);float h=smoothstep(-.2,.7,d.y);vec3 c=mix(vec3(1.,.64,.29),vec3(.035,.20,.62),h);float horizon=exp(-abs(d.y+.02)*10.);c=mix(c,vec3(1.,.30,.53),horizon*.62);c=mix(mix(vec3(.04,.22,.70),haze,smoothstep(-1.,-.03,d.y)),c,smoothstep(-.03,.06,d.y));float a=max(0.,dot(d,sun));c+=vec3(1.,.56,.2)*pow(a,110.)*.45;c+=vec3(4.,2.7,1.35)*smoothstep(.999,.99965,a);c=mix(c,haze*(.88+.12*max(d.y,0.)),immersion);gl_FragColor=vec4(c,1.);}`}/></mesh>;}
export const stormIntensity=(t:number)=>atmosphere(t).immersion;

// A small original atlas, baked once on load. Transparent gutters and rounded alpha
// profiles keep the distant cloud cards free of rectangular silhouettes / mip seams.
function cloudAtlas(){
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
 const ctx=canvas.getContext('2d')!;
 for(let tile=0;tile<8;tile++){
  ctx.save();ctx.translate(tile%4*256,Math.floor(tile/4)*256);ctx.beginPath();ctx.rect(0,0,256,256);ctx.clip();
  const lobes=5+tile%4;
  for(let l=0;l<lobes;l++){
   const x=48+l/(lobes-1)*157,y=151-Math.sin((l+.5)/lobes*Math.PI)*(25+tile%3*12),r=32+(l*17+tile*11)%22;
   const glow=ctx.createRadialGradient(x-9,y-r*.32,r*.12,x,y,r);
   glow.addColorStop(0,'rgba(255,255,255,1)');glow.addColorStop(.86,'rgba(255,255,255,1)');glow.addColorStop(1,'rgba(255,255,255,0)');
   ctx.fillStyle=glow;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  }
  const shade=ctx.createLinearGradient(0,75,0,200);shade.addColorStop(0,'#fff8ea');shade.addColorStop(.45,'#f4f8ff');shade.addColorStop(1,'#aecce9');ctx.globalCompositeOperation='source-in';ctx.fillStyle=shade;ctx.fillRect(0,0,256,256);
  ctx.restore();
 }
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;return texture;
}
export function Clouds({run}:{run:Runtime|null}){
 const near=useRef<T.InstancedMesh>(null),middle=useRef<T.InstancedMesh>(null),cards=useRef<T.InstancedMesh>(null);
 const storm=useRef<(T.InstancedMesh|null)[]>([]),banks=useMemo(()=>[stormBank(0),stormBank(1)],[]);
 const data=useMemo(()=>cloudField(),[]),atlas=useMemo(cloudAtlas,[]);
 const clear=useMemo(()=>data.near.filter(c=>c.storm===undefined),[data]);
 const layers=useMemo(()=>banks.map((_,i)=>data.near.filter(c=>c.storm===i)),[data,banks]);
 const geometry=useMemo(()=>{const g=new T.PlaneGeometry(1,1);g.setAttribute('cloudTile',new T.InstancedBufferAttribute(new Float32Array(data.far.length),1));return g;},[data]);
 const uniforms=useMemo(()=>({atlas:{value:atlas},haze:{value:new T.Color()},immersion:{value:0}}),[atlas]);
 const sorted=useMemo(()=>data.far.map(c=>({...c,distance:0})),[data]);
 const visibility=useMemo(()=>({frustum:new T.Frustum(),matrix:new T.Matrix4(),sphere:new T.Sphere()}),[]);
 useEffect(()=>()=>{atlas.dispose();geometry.dispose();banks.forEach(g=>g.dispose());},[atlas,geometry,banks]);
 useFrame(({camera,scene})=>{
  visibility.frustum.setFromProjectionMatrix(visibility.matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
  const fill=(mesh:T.InstancedMesh|null,rows:CloudLobe[])=>{if(!mesh)return 0;let count=0;
   for(const c of rows){visibility.sphere.center.set(c.x,c.y,c.z);visibility.sphere.radius=Math.max(c.sx,c.sy,c.sz)*1.05;if(!visibility.frustum.intersectsSphere(visibility.sphere))continue;
    dummy.position.set(c.x,c.y,c.z);dummy.scale.set(c.sx,c.sy,c.sz);dummy.rotation.set(0,c.rotation,0);dummy.updateMatrix();mesh.setMatrixAt(count,dummy.matrix);mesh.setColorAt(count++,cloudColor.set(c.shade??'#ffffff'));
   }mesh.count=count;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;return count;
  };
  const n=fill(near.current,clear),m=fill(middle.current,data.middle),s=layers.reduce((count,rows,i)=>count+fill(storm.current[i],rows),0);let f=0;
  if(scene.fog instanceof T.Fog)uniforms.haze.value.copy(scene.fog.color);
  uniforms.immersion.value=atmosphere(run?.presentation.route??0).immersion;
  if(cards.current){
   const mounted=(cards.current.material as T.ShaderMaterial).uniforms;mounted.immersion.value=uniforms.immersion.value;mounted.haze.value.copy(uniforms.haze.value);
   for(const c of sorted)c.distance=(camera.position.x-c.x)**2+(camera.position.y-c.y)**2+(camera.position.z-c.z)**2;
   sorted.sort((a,b)=>b.distance-a.distance);const tile=geometry.getAttribute('cloudTile');
   for(const c of sorted){visibility.sphere.center.set(c.x,c.y,c.z);visibility.sphere.radius=c.width*.65;if(!visibility.frustum.intersectsSphere(visibility.sphere))continue;
    dummy.position.set(c.x,c.y,c.z);dummy.scale.set(c.width,c.height,1);dummy.rotation.set(0,0,0);dummy.updateMatrix();cards.current.setMatrixAt(f,dummy.matrix);tile.setX(f++,c.tile);
   }cards.current.count=f;cards.current.instanceMatrix.needsUpdate=true;tile.needsUpdate=true;
  }
  if(import.meta.env.DEV&&new URLSearchParams(location.search).get('qa')==='1')Object.assign(window,{__RUNWAY_CLOUD_QA__:{near:n+s,storm:s,middle:m,far:f,triangles:n*80+s*176+m*80+f*2,extent:2100,immersion:uniforms.immersion.value}});
 });
 const fog=(shader:T.WebGLProgramParametersWithUniforms)=>{shader.uniforms.bankImmersion=uniforms.immersion;shader.fragmentShader='uniform float bankImmersion;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <fog_fragment>',`#ifdef USE_FOG
 float cloudHaze=smoothstep(fogNear,fogFar,vFogDepth);
 gl_FragColor.rgb=mix(gl_FragColor.rgb,fogColor,cloudHaze*(.55+.42*bankImmersion));
 #endif`);};
 return <group name="cloud-field">
  <instancedMesh name="clouds-foreground" ref={near} args={[undefined,undefined,clear.length]} frustumCulled={false}><icosahedronGeometry args={[1,1]}/><meshStandardMaterial color="#f4f7ff" roughness={1} onBeforeCompile={fog}/></instancedMesh>
  {banks.map((g,i)=><instancedMesh key={i} name={`clouds-storm-bank-${i}`} ref={mesh=>{storm.current[i]=mesh;}} args={[g,undefined,layers[i].length]} frustumCulled={false}><meshStandardMaterial vertexColors roughness={1} onBeforeCompile={fog}/></instancedMesh>)}
  <instancedMesh name="clouds-wide-deck" ref={middle} args={[undefined,undefined,data.middle.length]} frustumCulled={false}><icosahedronGeometry args={[1,1]}/><meshStandardMaterial color="#eef4ff" roughness={1} onBeforeCompile={fog}/></instancedMesh>
  <instancedMesh name="clouds-horizon" ref={cards} args={[geometry,undefined,data.far.length]} frustumCulled={false} renderOrder={1}>
   <shaderMaterial transparent depthWrite={false} uniforms={uniforms} vertexShader={`attribute float cloudTile;varying vec2 cloudUv;varying float cloudDistance;
    void main(){vec4 center=modelViewMatrix*instanceMatrix*vec4(0.,0.,0.,1.);cloudDistance=length(center.xyz);center.xy+=position.xy*vec2(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz));cloudUv=(uv*.98+.01+vec2(mod(cloudTile,4.),floor(cloudTile/4.)))/vec2(4.,2.);gl_Position=projectionMatrix*center;}`}
    fragmentShader={`uniform sampler2D atlas;uniform vec3 haze;uniform float immersion;varying vec2 cloudUv;varying float cloudDistance;
    void main(){vec4 c=texture2D(atlas,cloudUv);if(c.a<.003)discard;float distanceHaze=1.-exp(-cloudDistance*.00024);c.rgb=mix(c.rgb*1.25,haze,distanceHaze*.65+immersion*.25);c.a*=1.-immersion*.8;gl_FragColor=c;
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    }`}/>
  </instancedMesh>
 </group>;
}
export function Storm({run}:{run:Runtime|null}){
 const rain=useRef<T.InstancedMesh>(null),bolt=useRef<T.Mesh>(null),light=useRef<T.PointLight>(null),lastThunder=useRef(-1),reduced=useMemo(()=>matchMedia('(prefers-reduced-motion: reduce)').matches,[]);
 const geometry=useMemo(()=>{const pieces:T.BufferGeometry[]=[];const points=[new T.Vector3(0,30,0),new T.Vector3(2,18,1),new T.Vector3(-2,12,0),new T.Vector3(1,3,-1),new T.Vector3(-3,-8,0),new T.Vector3(0,-20,1)];for(let i=1;i<points.length;i++)pieces.push(new T.TubeGeometry(new T.LineCurve3(points[i-1],points[i]),1,.12,4));pieces.push(new T.TubeGeometry(new T.CatmullRomCurve3([points[2],new T.Vector3(-7,7,2),new T.Vector3(-10,0,3)]),3,.065,4));const g=mergeGeometries(pieces);pieces.forEach(p=>p.dispose());return g;},[]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 useFrame(()=>{const s=run?.state,t=s?s.routeTime:0,amount=s&&!s.outcome?stormIntensity(t):0,active=amount>0;
  if(rain.current){rain.current.visible=active;const m=rain.current.material as T.MeshBasicMaterial;m.opacity=.78*amount;if(active){for(let i=0;i<240;i++){dummy.position.set(s!.x+Math.sin(i*12.89)*19,s!.altitude-25+(i*5.3+t*57)%50,s!.y+Math.cos(i*8.31)*24);dummy.scale.set(.025,reduced?.9:2.7,.025);dummy.rotation.set(0,0,.13);dummy.updateMatrix();rain.current.setMatrixAt(i,dummy.matrix);}rain.current.instanceMatrix.needsUpdate=true;}}
  const index=Math.floor((t-CLOUD_DECK.enter)/3.4),strike=CLOUD_DECK.enter+index*3.4,age=t-strike,flash=active&&index>=0&&age<.8?Math.sin(age/.8*Math.PI)*amount:0;
  if(active&&index>=0&&index!==lastThunder.current&&age>.35&&age<1){lastThunder.current=index;thunder();}
  if(bolt.current){bolt.current.visible=flash>0;bolt.current.position.set((s?.x||0)+(index%2?7:-7),(s?.altitude||0)-18,(s?.y||0)-10);(bolt.current.material as T.MeshBasicMaterial).opacity=flash*(reduced?.3:1);}
  if(light.current){light.current.position.set((s?.x||0)-16,(s?.altitude||0)+12,(s?.y||0)-20);light.current.intensity=reduced?0:flash*105;}
  if(import.meta.env.DEV&&new URLSearchParams(location.search).get('qa')==='1')Object.assign(window,{__RUNWAY_STORM_QA__:{amount,rain:active,lightning:flash}});
 });
 return <><instancedMesh ref={rain} args={[undefined,undefined,240]} frustumCulled={false}><boxGeometry/><meshBasicMaterial color="#d9f5ff" transparent opacity={.4} depthWrite={false}/></instancedMesh><mesh ref={bolt} geometry={geometry} visible={false}><meshBasicMaterial color={[3,4,5]} toneMapped={false} fog={false} transparent depthWrite={false}/></mesh><pointLight ref={light} color="#b8d7ff" distance={110} decay={1} intensity={0}/></>;
}
export function SunLight({run}:{run:Runtime|null}){
 const sun=useRef<T.DirectionalLight>(null),target=useMemo(()=>new T.Object3D(),[]),{scene}=useThree();
 useEffect(()=>{scene.add(target);return()=>{scene.remove(target);};},[scene,target]);
 useFrame(()=>{const s=run?.state,h=s?.altitude??AIRCRAFT.floor+2,x=s?.x??0,z=s?.y??START_Z+5;if(sun.current){const exterior=scene.userData.exteriorBlend??0;sun.current.intensity=T.MathUtils.lerp(.8,3.6,exterior)*(1-.65*stormIntensity(s?s.routeTime:0));sun.current.position.set(x+T.MathUtils.lerp(-2.65,SUN_DIRECTION.x*48,exterior),h+T.MathUtils.lerp(2.25,SUN_DIRECTION.y*48,exterior),z+T.MathUtils.lerp(1.4,SUN_DIRECTION.z*48,exterior));target.position.set(x,h-1,z);sun.current.target=target;}});
 return <directionalLight ref={sun} castShadow intensity={2.2} color="#ffd5a2" shadow-mapSize={[1024,1024]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-camera-near={1} shadow-camera-far={90} shadow-bias={-.0003} shadow-normalBias={.015} shadow-radius={3}/>;
}

export function DoorLight({run}:{run:Runtime|null}){
 const light=useRef<T.SpotLight>(null),{scene}=useThree(),target=useMemo(()=>new T.Object3D(),[]);
 useEffect(()=>{target.position.set(0,AIRCRAFT.floor+1.4,START_Z+7);scene.add(target);return()=>{scene.remove(target);};},[scene,target]);
 useFrame(()=>{if(!light.current)return;const t=run?.presentation.route??0;
  light.current.intensity=170*doorOpening(t)*(1-T.MathUtils.smoothstep(t,2.5,4.8));
  light.current.target=target;
 });
 return <spotLight ref={light} name="doorway-daylight" position={[0,AIRCRAFT.floor+3.3,START_Z-2]} color="#fff2d8" intensity={0} angle={.85} penumbra={.8} distance={18} decay={1.4}/>;
}
