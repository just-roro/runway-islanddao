import {publicUrl} from '../urls';
import{useEffect,useMemo,useRef}from'react';
import{useFrame,useLoader}from'@react-three/fiber';
import * as THREE from'three';
import{GLTFLoader}from'three/addons/loaders/GLTFLoader.js';
import{BeachLife,ShoreBreak}from'./BeachLife';
import{Vegetation}from'./Vegetation';
import{terrain,surfaceSampler}from'./ground';
import{roadTexture,ROAD_MAP}from'./roadTexture';
import{WorldLife}from'./WorldLife';
import{LandingZones}from'./LandingZones';
import{IslandLife}from'./IslandLife';
import{SUN_DIRECTION}from'./Weather';
import{BuildingShadows}from'./AtmosphericEffects';
import type{Runtime}from'../services/runtime';
import{COAST,isSafeLanding,coastDistance,DESTINATIONS,BUILDINGS}from'../core/simulation';
// A low-detail horizon representation disappears in the departure haze; the
// full island below the cloud deck keeps its authoritative world transform.
export function HorizonIsland({run}:{run:Runtime|null}){const ref=useRef<THREE.Group>(null),material=useRef<THREE.MeshBasicMaterial>(null),sea=useRef<THREE.MeshBasicMaterial>(null),geometry=useMemo(()=>{const v:number[]=[];for(let i=0;i<COAST.length;i++){const a=COAST[i],b=COAST[(i+1)%COAST.length];v.push(0,14,0,a[0],0,a[1],b[0],0,b[1]);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.computeVertexNormals();return g;},[]);useEffect(()=>()=>geometry.dispose(),[geometry]);useFrame(()=>{const t=(run?.state.tick||0)/60;if(ref.current)ref.current.visible=t<2;const fade=1-THREE.MathUtils.smoothstep(t,0,2);if(material.current)material.current.opacity=.85*fade;if(sea.current)sea.current.opacity=.7*fade;});return <group ref={ref} position={[0,580,-950]}><mesh rotation={[-Math.PI/2,0,0]} position={[0,-2,0]}><planeGeometry args={[6000,6000]}/><meshBasicMaterial ref={sea} color="#6f9eac" transparent opacity={.7} depthWrite={false}/></mesh><mesh geometry={geometry} scale={.6}><meshBasicMaterial ref={material} color="#518d76" fog={false} transparent opacity={.85} depthWrite={false}/></mesh></group>;}
function LandingSigns({run}:{run:Runtime|null}){const root=useRef<THREE.Group>(null);useFrame(()=>{if(root.current)root.current.visible=!!run&&!run.state.outcome;});const textures=useMemo(()=>DESTINATIONS.map(d=>{const c=document.createElement('canvas');c.width=1024;c.height=128;const ctx=c.getContext('2d')!;ctx.fillStyle='#102b3b';ctx.fillRect(0,0,1024,128);ctx.fillStyle='#ffdf71';ctx.fillRect(0,120,1024,8);ctx.font='bold 31px sans-serif';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(`WELCOME 🌴    ${d.name.toUpperCase()}    ${d.style}    `,12,64);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=THREE.RepeatWrapping;t.repeat.x=.44;return t;}),[]);useFrame(({clock})=>textures.forEach(t=>{t.offset.x=((run?.presentation.time??clock.elapsedTime)*.045)%1;}));useEffect(()=>()=>textures.forEach(t=>t.dispose()),[textures]);return <group ref={root}>{DESTINATIONS.map((d,i)=><sprite key={d.id} position={[d.x,d.height+5,d.z-8]} scale={[26,6.5,1]}><spriteMaterial map={textures[i]} depthWrite={false} transparent fog/></sprite>)}</group>;}
function horizonWater(){const shape=new THREE.Shape();shape.moveTo(-2500,-2500);shape.lineTo(2500,-2500);shape.lineTo(2500,2500);shape.lineTo(-2500,2500);shape.closePath();const hole=new THREE.Path();hole.moveTo(-260,-320);hole.lineTo(-260,320);hole.lineTo(260,320);hole.lineTo(260,-320);hole.closePath();shape.holes.push(hole);return new THREE.ShapeGeometry(shape);}
function coastDepth(){const w=128,h=160,data=new Uint8Array(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const wx=(x/(w-1)-.5)*520,wz=(y/(h-1)-.5)*640,d=isSafeLanding(wx,wz)?0:coastDistance(wx,wz);const i=(y*w+x)*4;data[i]=Math.round(Math.min(1,d/60)*255);data[i+1]=data[i+2]=data[i];data[i+3]=255;}const t=new THREE.DataTexture(data,w,h);t.minFilter=t.magFilter=THREE.LinearFilter;t.needsUpdate=true;return t;}
export function Island({run}:{run:Runtime|null}){const city=useLoader(GLTFLoader,publicUrl('/assets/models/runway-city.glb?v=motion-23'));const mesh=useMemo(terrain,[]),horizon=useMemo(horizonWater,[]),water=useRef<THREE.ShaderMaterial>(null);const surface=useMemo(()=>surfaceSampler(mesh),[mesh]);const depth=useMemo(coastDepth,[]);const uniforms=useMemo(()=>({coastMap:{value:depth},sun:{value:SUN_DIRECTION},time:{value:0},...THREE.UniformsUtils.clone(THREE.UniformsLib.fog)}),[]);useEffect(()=>()=>{mesh.dispose();horizon.dispose();depth.dispose();},[mesh]);useFrame(({clock})=>{if(water.current)water.current.uniforms.time.value=run?.presentation.time??clock.elapsedTime;});return <group>
 <mesh geometry={horizon} rotation={[-Math.PI/2,0,0]} position={[0,-.2,0]}><meshBasicMaterial color="#027f9c"/></mesh><mesh rotation={[-Math.PI/2,0,0]} position={[0,-.2,0]}><planeGeometry args={[520,640,32,40]}/><shaderMaterial ref={water} uniforms={uniforms} fog vertexShader={`uniform float time;varying vec2 sea;varying vec3 oceanPosition;
 #include <fog_pars_vertex>
 void main(){sea=position.xy;vec3 p=position;float edge=1.-smoothstep(.8,1.,max(abs(sea.x)/260.,abs(sea.y)/320.));p.z+=edge*(.3*sin(sea.y*.075+sea.x*.026+time*1.1)+.12*sin(sea.x*.11-sea.y*.039+time*.73));oceanPosition=(modelMatrix*vec4(p,1.)).xyz;vec4 mvPosition=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mvPosition;
 #include <fog_vertex>
 }`} fragmentShader={`uniform float time;uniform sampler2D coastMap;uniform vec3 sun;varying vec2 sea;varying vec3 oceanPosition;
 #include <fog_pars_fragment>
 void main(){float depth=texture2D(coastMap,vec2(sea.x/520.+.5,-sea.y/640.+.5)).r;float shallow=1.-smoothstep(.015,.6,depth);vec3 color=mix(vec3(.008,.11,.29),vec3(.025,.59,.51),shallow);float a=sea.y*.075+sea.x*.026+time*1.1,b=sea.x*.11-sea.y*.039+time*.73;vec3 normal=normalize(vec3(-.0078*cos(a)-.0132*cos(b),1.,.0225*cos(a)-.00468*cos(b)));vec3 view=normalize(cameraPosition-oceanPosition);float fresnel=pow(1.-max(0.,dot(normal,view)),3.);float highlight=pow(max(0.,dot(reflect(-sun,normal),view)),64.)*.38;float swell=sin(a)*.7+sin(b)*.3;color+=swell*.018;
 // Crossed travelling waves: broad crests and broken caustics, no tiled grid.
 float weave=sin(sea.x*.27+sin(sea.y*.18+time*.3)*1.4+time*.5)+sin(sea.y*.24+sin(sea.x*.23-time*.2)*1.5-time*.4);
 float caustic=pow(max(0.,1.-abs(weave)*2.2),5.);
 color+=vec3(.10,.18,.12)*caustic*shallow*.22;
 float glint=pow(max(0.,sin(a*4.3+sin(b*2.7))*.5+sin(b*3.8)*.5),16.);
 color+=vec3(.8,.9,.75)*glint*(.012+fresnel*.06);color=mix(color,vec3(.91,.55,.51),fresnel*.2);color+=vec3(1.,.83,.55)*highlight;float crest=smoothstep(.94,1.,swell)*.012;color+=crest;float edge=1.-smoothstep(.8,1.,max(abs(sea.x)/260.,abs(sea.y)/320.));color=mix(vec3(.000607,.21223,.33245),color,edge);gl_FragColor=vec4(color,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 #include <fog_fragment>
 }`}/></mesh>
 <mesh name="island-terrain" geometry={mesh} userData={{cameraSurface:surface}} receiveShadow><GroundMaterial/></mesh><primitive object={city.scene}/><BuildingShadows buildings={BUILDINGS}/><LandingSigns run={run}/><EventVenue/><LandingZones run={run}/><Vegetation run={run} surface={surface}/><BeachLife run={run} surface={surface}/><WorldLife run={run} surface={surface}/><ShoreBreak run={run}/><IslandLife run={run} surface={surface}/>
 </group>;}

function GroundMaterial(){const roads=useMemo(roadTexture,[]);useEffect(()=>()=>roads.dispose(),[roads]);return <meshStandardMaterial vertexColors roughness={.92} side={THREE.DoubleSide} customProgramCacheKey={()=>'runway-ground-world39'} onBeforeCompile={s=>{
 s.uniforms.roadMap={value:roads};
 s.vertexShader='attribute vec2 groundMask;varying vec3 groundPosition;varying vec2 groundRegion;\n'+s.vertexShader;
 s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ngroundPosition=position;groundRegion=groundMask;');
 s.fragmentShader=`uniform sampler2D roadMap;varying vec3 groundPosition;varying vec2 groundRegion;
 float soilHash(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
 float soilNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(soilHash(i),soilHash(i+vec2(1.,0.)),f.x),mix(soilHash(i+vec2(0.,1.)),soilHash(i+1.),f.x),f.y);}
 `+s.fragmentShader;
 s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float patches=soilNoise(groundPosition.xz*.075)*.65+soilNoise(groundPosition.xz*.31)*.35;
 float detail=soilNoise(groundPosition.xz*5.2);
 float fine=1.-smoothstep(25.,125.,length(vViewPosition));
 float shore=groundRegion.x+(patches-.5)*2.;
 float vegetation=smoothstep(1.8,5.8,shore)*(1.-smoothstep(.55,1.,groundRegion.y));
 float rock=smoothstep(.35,.85,groundRegion.y)*smoothstep(4.,12.,groundPosition.y);

 vec3 sand=mix(vec3(.68,.49,.25),vec3(.95,.78,.45),patches);
 vec3 meadow=mix(vec3(.055,.20,.045),vec3(.26,.43,.075),patches);
 // Continuous turf at aerial distances; the same palette carries into real tufts.
 float blades=soilNoise(groundPosition.xz*vec2(8.,3.5));
 meadow*=.89+.20*detail+.12*blades*fine;
 vec3 stone=mix(vec3(.20,.25,.23),vec3(.44,.43,.34),patches);
 diffuseColor.rgb=mix(mix(sand,meadow,vegetation),stone,rock*.8);

 diffuseColor.rgb*=.96+(detail-.5)*.06*fine;
 // One baked distance field keeps asphalt, shoulders and the vegetation
 // exclusion on the same route, including the physical bridge abutment.
 vec2 roadUV=(groundPosition.xz-vec2(${ROAD_MAP.x.toFixed(1)},${ROAD_MAP.z.toFixed(1)}))/vec2(${ROAD_MAP.width.toFixed(1)},${ROAD_MAP.depth.toFixed(1)});
 vec2 road=texture2D(roadMap,roadUV).rg;float roadDistance=road.r*4.;
 float shoulder=1.-smoothstep(1.9,2.4,roadDistance);
 float asphalt=1.-smoothstep(1.60,1.78,roadDistance);
 diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.42,.37,.25),shoulder);
 vec3 paving=vec3(.075,.105,.115)*(1.+(detail-.5)*.14);
 float centreLine=(1.-smoothstep(.12,.31,roadDistance))*smoothstep(.3,.7,road.g);
 paving=mix(paving,vec3(.95,.77,.39),centreLine*.75);
 diffuseColor.rgb=mix(diffuseColor.rgb,paving,asphalt);
 `);
 s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
 roughnessFactor=clamp(.82+patches*.12+detail*.025*fine,.76,.98);
 `);
 s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
 vec3 dpdx=dFdx(-vViewPosition),dpdy=dFdy(-vViewPosition);
 vec3 r1=cross(dpdy,normal),r2=cross(normal,dpdx);
 float determinant=dot(dpdx,r1);
 float relief=(detail-.5)*.012*fine*vegetation*(1.-asphalt);
 normal=normalize(normal-sign(determinant)*(dFdx(relief)*r1+dFdy(relief)*r2)/max(abs(determinant),.0001));
 `);
 }}/>;}
// Replace only this visual group when event photographs arrive. Y up, 1 unit = 1 m,
// +Z toward the approach. The functional landing platform remains a separate child.
export function EventVenue(){
 const d=DESTINATIONS.find(d=>d.id==='jurere')!,asset=useLoader(GLTFLoader,publicUrl('/assets/models/runway-jurere-provisional.glb?v=motion-23'));
 return <group name="jurere-event-venue" position={[d.x,d.height,d.z]} userData={{units:'metres',up:'Y',forward:'+Z',provisional:true,destination:d.id}}>
  <group name="replaceable-venue-visuals"><primitive object={asset.scene}/></group>
 </group>;
}
