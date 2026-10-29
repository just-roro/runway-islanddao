import {itemVisualSize,featuredPickup} from './itemVisibility';
import {RecognitionCrown} from './RecognitionCrown';
import {Updrafts,Rainbow} from './GlideEnvironment';
import {starEffect} from './starEffect';
import {publicUrl} from '../urls';
import {createConversation,advanceConversation,advanceProjection,expressionIndex,type ConversationMotion} from '../services/dialogue';
import {diveStrength,deploymentPose} from '../services/choreography';
import {useRef,useMemo,useEffect} from 'react';
import {Canvas,useFrame,useThree,useLoader} from '@react-three/fiber';
import * as THREE from 'three';
import{GLTFLoader}from'three/addons/loaders/GLTFLoader.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import perks from '../perks';
import type {TutorialFrame} from '../NarrativeTutorial';
import {itemShader} from './itemArt';
import {propGeometry} from './props';
import{avoidScenery,constrainAircraftCamera,landingOrbit,orbitRadius,orbitAngle}from'./camera';
import {atmosphere} from './atmosphere';
import{Parachute,canopyGeometry}from'./Parachute';
import {dialogueSound} from '../services/audio';
import type {HologramKind} from '../services/dialogue';
import{SummerSky,Clouds,Storm,SunLight,DoorLight,stormIntensity}from'./Weather';
import {Island} from './Island';
import {PilotBody,PILOT_MODEL_URL} from './PilotBody';
import {reflectionRig,exteriorBlend,doorOpening} from './environments';
import {FlightEffects} from './FlightEffects';
import {SpeedBlur} from './SpeedBlur';
import {ObjectGlows,ContactShadow} from './AtmosphericEffects';
import {sequenceActive,ringReveal,objectPose,FALL_SPEED,GLIDE_SPEED,altitudeAt,landingSurface,WORLD_SCALE,PILOT_SCALE,AIRCRAFT,worldZ,TIMING,START_Z,type Kind,type CashEvent} from '../core/simulation';
import {createPresentation,activeImpact,buildingReaction,type Presentation} from '../services/presentation';
import {advance,type Runtime} from '../services/runtime';
import {profile} from '../services/session';
import type {ShopPreview} from '../Shop';
import {shopItem,portraitUrl} from '../shopCatalog';
import {useCosmeticPortrait} from './cosmeticPortrait';
import {PilotTrail} from './PilotTrail';
const ledWords=['COMBO','BIG WIN','BONUS','LOST','DANGER','PERFECT','SOL +',...perks.map(p=>p.name.toUpperCase()),'^_^','o_o','>_<',';)','\\o/','-_-'];
// Clear only on explicit graphics recovery; ordinary skin changes retain all caches.
export function retrySceneAssets(){for(const url of [PILOT_MODEL_URL,publicUrl('/assets/models/runway-aircraft.glb?v=routes-21'),publicUrl('/assets/models/runway-hatch.glb?v=routes-21'),publicUrl('/assets/models/runway-city.glb?v=motion-23'),publicUrl('/assets/models/runway-jurere-provisional.glb?v=motion-23')])useLoader.clear(GLTFLoader,url);useLoader.clear(THREE.TextureLoader,perks.map((_,i)=>portraitUrl(i)));}
const dummy=new THREE.Object3D();
const paintedMaterial=new THREE.MeshStandardMaterial({name:'RUNWAY trim',vertexColors:true,roughness:.75,metalness:.12,side:THREE.DoubleSide});
function paint(geometry:THREE.BufferGeometry,color:string){const c=new THREE.Color(color),values=new Float32Array(geometry.attributes.position.count*3);for(let i=0;i<values.length;i+=3){values[i]=c.r;values[i+1]=c.g;values[i+2]=c.b;}geometry.setAttribute('color',new THREE.BufferAttribute(values,3));return geometry;}
function Solid({position=[0,0,0],scale=[1,1,1],color='#fff',shape='box',rotation=[0,0,0]}:{position?:[number,number,number];scale?:[number,number,number];color?:string;shape?:'box'|'sphere'|'cylinder'|'capsule';rotation?:[number,number,number]}){const geometry=useMemo(()=>paint(shape==='capsule'?new THREE.CapsuleGeometry(.5,.6,4,10):shape==='sphere'?new THREE.SphereGeometry(1,12,8):shape==='cylinder'?new THREE.CylinderGeometry(1,1,1,10):new RoundedBoxGeometry(1,1,1,1,.13),color),[shape,color]);useEffect(()=>()=>geometry.dispose(),[geometry]);return <mesh position={position} scale={scale} rotation={rotation} geometry={geometry} material={paintedMaterial} castShadow receiveShadow dispose={null}/>;}
export function Pilot({pilot=0,run,hero=false,inspect=false,crew=false,presentation,preview,conversation}:{conversation?:ConversationMotion;preview?:ShopPreview;presentation:Presentation;briefing?:TutorialFrame|null;inspect?:boolean;pilot?:number;suit?:number;run?:Runtime|null;hero?:boolean;crew?:boolean}){
 const color=crew?'#42cfc2':perks[pilot].accent,selection=useRef({pilot,at:-10000,selected:false}),targetColor=useMemo(()=>new THREE.Color(color),[color]);
 useEffect(()=>{if(selection.current.pilot!==pilot||!!preview&&!selection.current.selected)selection.current={pilot,at:performance.now(),selected:!!preview};else selection.current.selected=!!preview;},[pilot,!!preview]);
 
 const ledPhase=useRef(0);
 const messageClock=useRef<{event:CashEvent|undefined;started:number}>({event:undefined,started:0});
 const reduced=useMemo(()=>matchMedia('(prefers-reduced-motion: reduce)').matches,[]);
 const led=useRef<(THREE.MeshPhysicalMaterial & {uniforms:Record<string,{value:any}>})|null>(null);
 const root=useRef<THREE.Group>(null),previousRun=useRef(run);
 const textures=useLoader(THREE.TextureLoader,perks.map((_,i)=>portraitUrl(i)));for(const t of textures){t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.colorSpace=THREE.SRGBColorSpace;}
 const accessory=crew?undefined:preview?.category==='accessory'?preview.accessory:profile.shop!.accessories[pilot],accessoryItem=accessory?shopItem(accessory):undefined;
 const {texture,previous:previousTexture,revision:portraitRevision}=useCosmeticPortrait(accessoryItem?.pilot===pilot?accessoryItem.image:undefined,textures[pilot%12]);
 const rim=shopItem(preview?.helmet??profile.shop!.helmet)!;
 const suitUniform=useMemo(()=>({value:new THREE.Color(color)}),[]);
 useEffect(()=>{const u=led.current?.uniforms??ledUniforms;u.previousPortrait.value=previousTexture;u.portrait.value=texture;u.skinMix.value=0;},[texture,previousTexture,portraitRevision]);
 const ledUniforms=useMemo(()=>({portrait:{value:texture},previousPortrait:{value:texture},skinMix:{value:1},time:{value:0},pulse:{value:0},message:{value:-1},messageAge:{value:0},accent:{value:new THREE.Color(color)},crew:{value:crew?1:0},rimA:{value:new THREE.Color()},rimB:{value:new THREE.Color()},rimMode:{value:0},messages:{value:null as THREE.Texture|null}}),[]);
 const messages=useMemo(()=>{const canvas=document.createElement('canvas');canvas.width=512;canvas.height=ledWords.length*64;const ctx=canvas.getContext('2d')!;ctx.clearRect(0,0,512,canvas.height);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 60px monospace';ledWords.forEach((text,i)=>{ctx.fillStyle='#ffe45c';ctx.fillText(text,256,i*64+32,490);});return new THREE.CanvasTexture(canvas);},[]);
 useEffect(()=>()=>messages.dispose(),[messages]);
 ledUniforms.messages.value=messages;
 const screenMaterial=useMemo(()=>{const m=new THREE.MeshPhysicalMaterial({name:'RUNWAY LED',color:'#06101c',roughness:.19,metalness:.28,clearcoat:.5,clearcoatRoughness:.16,envMapIntensity:1.05,transparent:crew});
 (m as unknown as {uniforms:typeof ledUniforms}).uniforms=ledUniforms;
 m.onBeforeCompile=shader=>{Object.assign(shader.uniforms,ledUniforms);shader.vertexShader='varying vec2 ledUv;\n'+shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\nledUv=uv;');shader.fragmentShader='varying vec2 ledUv;\n'+'uniform sampler2D portrait;uniform sampler2D previousPortrait;uniform float skinMix;uniform sampler2D messages;uniform float time;uniform float pulse;uniform float message;uniform float messageAge;uniform vec3 accent;uniform float crew;uniform vec3 rimA;uniform vec3 rimB;uniform float rimMode;\n ' +shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`vec2 grid=ledUv*vec2(96.,48.);vec2 cell=fract(grid)-.5;float aa=max(fwidth(length(cell)),.025);float dots=1.-smoothstep(.32-aa,.43+aa,length(cell));float lod=1.-smoothstep(.5,1.4,max(length(dFdx(grid)),length(dFdy(grid))));dots=mix(.72,dots,lod);vec2 panel=vec2(fract(ledUv.x*3.-time*.045),(ledUv.y-.25)*2.);vec3 color=crew>.5?vec3(.001,.006,.008):vec3(.015,.10,.13);if(crew<.5&&panel.y>0.&&panel.y<1.)color=mix(texture2D(previousPortrait,clamp(panel,.01,.99)).rgb,texture2D(portrait,clamp(panel,.01,.99)).rgb,skinMix);float wave=.5+.5*sin(ledUv.x*30.-time*3.);if(ledUv.y<.25||ledUv.y>.75){color=accent*(.2+.5*wave);if(rimMode>.5){float blend=0.;float light=.72;
 if(rimMode>1.5&&rimMode<2.5)blend=.5+.5*sin(ledUv.x*6.283-time*.3);
 if(rimMode>2.5&&rimMode<3.5)blend=step(.5,ledUv.y);
 if(rimMode>3.5&&rimMode<4.5){blend=step(.55,fract(floor(ledUv.x*24.)/24.-time*.16));light=.42+.65*blend;}
 if(rimMode>4.5&&rimMode<5.5){blend=.5+.5*sin(ledUv.x*12.+time*.8+sin(ledUv.x*24.-time*.4));light=.65+.2*sin(ledUv.x*7.-time);}
 if(rimMode>5.5){blend=step(.8,fract(ledUv.x*18.-time*.5));light=.5+.65*blend;}
 color=mix(rimA,rimB,blend)*light;}}
float stripe=smoothstep(.34,.37,ledUv.y)*(1.-smoothstep(.61,.64,ledUv.y));vec2 textUv=vec2(fract(ledUv.x*2.-(crew>.5?0.:messageAge*.3)),(24.-max(0.,message)+clamp((ledUv.y-.34)/.3,0.,1.))/25.);vec4 textColor=texture2D(messages,textUv);color=mix(color,textColor.rgb,step(0.,message)*stripe*textColor.a*(.85+min(.15,pulse)));float boot=.82+.18*smoothstep(0.,.15,mod(time,11.));totalEmissiveRadiance=mix(vec3(.001,.003,.005),color*boot*(1.35+pulse*.9),dots);

 `);};m.customProgramCacheKey=()=> 'runway-led-cosmetics-v2';return m;},[]);
 led.current=screenMaterial as typeof led.current;
 useEffect(()=>()=>screenMaterial.dispose(),[screenMaterial]);
 useFrame(()=>{if(!root.current)return;const reset=!!previousRun.current&&previousRun.current!==run;previousRun.current=run;if(!presentation.dt&&!reset)return;const dt=Math.min(presentation.dt,.05),s=run?.state,t=presentation.time,land=s?.phase==='land'||!!s?.outcome,deployment=presentation.canopy;
 suitUniform.value.lerp(targetColor,1-Math.exp(-dt*12));ledUniforms.accent.value.copy(suitUniform.value);ledUniforms.rimA.value.set(rim.color??color);ledUniforms.rimB.value.set(rim.secondary??rim.color??color);ledUniforms.rimMode.value=crew?0:Math.max(0,['original','solid','gradient','duo','chase','aurora','circuit'].indexOf(rim.pattern??'original'));
 const turn=THREE.MathUtils.clamp((s?.vx||0)/(s?.phase==='land'?17.33:16.55),-1,1),pitch=THREE.MathUtils.clamp(((s?.vy||0)+(s?.phase==='land'?GLIDE_SPEED:0))/(s?.phase==='land'?17.33:16.55),-1,1);
 const failed=!!presentation.fall,collision=buildingReaction(presentation),dive=s&&!s.outcome?diveStrength(s):0,opening=deploymentPose(presentation.route);
 const settled=THREE.MathUtils.smootherstep(presentation.landingAge,.65,3),finalYaw=presentation.orbit??0;
 const pose=(current:number,target:number)=>reset?target:THREE.MathUtils.damp(current,target,9,dt);
 root.current.rotation.z=pose(root.current.rotation.z,failed?(reduced?.45:Math.sin(presentation.landingAge*2)*.45):s&&!s.outcome?-turn*.34+presentation.ax*.0018+collision*.5:0);
 root.current.rotation.y=pose(root.current.rotation.y,(failed?Math.PI+(reduced?0:Math.min(presentation.landingAge,4)*.7):s?.outcome?THREE.MathUtils.lerp(Math.PI,finalYaw,reduced?1:settled):crew?(conversation?.frame.tutorial?.45:.25):inspect?0:Math.PI+(conversation?.focus??0)*2.15)+(inspect&&!reduced?Math.sin(t*.4)*.18:turn*.12));
 const runLean=s&&s.routeTime>1.15?-.07*Math.min(1,Math.abs(s.vy)/8):0;
 root.current.rotation.x=pose(root.current.rotation.x,failed?(-1.6+(reduced?0:Math.min(presentation.landingAge,3)*1.4)):(land||inspect||hero?0:s?THREE.MathUtils.lerp(runLean,-1.28-dive*.3+pitch*.17+presentation.ay*.002,presentation.airborne)*(1-deployment):0)+opening.pull*.22-opening.rebound*.12+collision*.55);
 if(led.current){led.current.uniforms.skinMix.value=THREE.MathUtils.damp(led.current.uniforms.skinMix.value,1,reduced?100:12,dt);const event=activeImpact(presentation)??presentation.cues.filter(e=>e.kind!=='sequence-missed').at(-1);if(messageClock.current.event!==event)messageClock.current={event,started:t};const age=event&&s?Math.max((s.tick-event.tick)/60,t-messageClock.current.started):9;if(!reduced&&(!s?.outcome||presentation.landingAge<2.4))ledPhase.current+=Math.min(presentation.dt,.05);led.current.uniforms.time.value=ledPhase.current;led.current.uniforms.pulse.value=s?.landed?.65:age<.8?(1-age/.8)*(reduced?.45:1):0;led.current.uniforms.messageAge.value=age;led.current.uniforms.message.value=age>=1.1?-1:s?.outcome==='landed'?5:event&&event.delta<0?3:event?.kind==='sequence-complete'?0:event?.kind==='sequence-ring'?5:event?.kind==='sequence-missed'?4:event&&['magnet','water','star','landing-bonus'].includes(event.kind)?2:event&&event.delta>=100000?1:s&&s.events.filter(e=>e.delta>0&&s.tick-e.tick<90).length>=3?0:6;}
 if(led.current&&!run){const u=led.current.uniforms,age=(performance.now()-selection.current.at)/1000;if(crew){const frame=conversation?.frame,blink=!reduced&&t%3.8<.11;u.message.value=blink||!frame?.letters?24:expressionIndex[conversation?.projectedExpression??frame.expression];u.messageAge.value=0;u.pulse.value=frame?.talking?.12+.08*Math.sin(frame.letters*1.7):.04;screenMaterial.opacity=conversation?.presence??0;}else{u.message.value=age<1?7+pilot:-1;u.messageAge.value=age;u.pulse.value=age<1?.4:0;}}
 if(import.meta.env.DEV&&new URLSearchParams(location.search).get('qa')==='1'&&led.current&&!crew&&(!inspect||!!preview))Object.assign(window,{__RUNWAY_LED_QA__:{phase:ledPhase.current,material:screenMaterial.uuid,pilot,color:suitUniform.value.getHexString(),portrait:led.current.uniforms.portrait.value?.image?.src,accessory,helmet:rim.id,rimMode:ledUniforms.rimMode.value,mix:led.current.uniforms.skinMix.value,message:led.current.uniforms.message.value},__RUNWAY_POSE_QA__:{turn,pitch,dive,collision,failed,rotation:root.current.rotation.toArray(),position:root.current.position.toArray()}});
 // The skeleton absorbs impact. Root scale stays invariant, preserving the helmet and grips.
 root.current.scale.setScalar(1);root.current.position.set(0,(s&&(s.phase==='land'||s.outcome==='landed')?.22*(1-THREE.MathUtils.smoothstep(s.altitude-landingSurface(s.x,s.y),1.2,3)):0)-opening.pull*.12+opening.rebound*.07,0);
 if(s?.outcome&&!failed){
  if(s.outcome==='water')root.current.position.y=-.12*(1-Math.exp(-presentation.landingAge*2));
  else {const yaw=root.current.rotation.y;root.current.position.x=-.18-Math.cos(yaw)*.18;root.current.position.z=Math.sin(yaw)*.18;}
 }
 },-1);



 return <group ref={root} name={crew?'tutorial-crew':'pilot-body'}>
 <PilotBody previewGlide={preview?.category==='canopy'} run={run} presentation={presentation} conversation={conversation} color={color} crew={crew} reduced={reduced} head={<group position={[0,.13,0]} scale={.72}>
 {!crew&&<RecognitionCrown/>}
 <mesh name="pilot-led-helmet" position={[0,.61,0]} onAfterRender={import.meta.env.DEV&&!crew?()=>{Object.assign(window,{__RUNWAY_HEAD_DRAW_QA__:performance.now()});}:undefined}><sphereGeometry args={[.8,32,24]}/><primitive object={screenMaterial} attach="material"/></mesh>
 {profile.cosmetic===0&&[0,1,2].map(i=><mesh key={i} position={[0,.61,0]} rotation={[0,0,i*.28]}><torusGeometry args={[.824,.018,4,24,Math.PI*.8]}/><meshBasicMaterial color={color}/></mesh>)}
 </group>}/>

 <Parachute run={run} body={root} presentation={presentation} preview={preview?.category==='canopy'} itemId={preview?.canopy}/>{preview?.category==='trail'&&<PilotTrail presentation={presentation} preview itemId={preview.trail}/>}
 </group>;
}
function PilotCarousel({preview,presentation}:{preview:ShopPreview;presentation:Presentation}){
 const actor=useRef<THREE.Group>(null);
 useFrame(()=>{if(actor.current)actor.current.rotation.y=THREE.MathUtils.damp(actor.current.rotation.y,preview.category==='trail'?Math.PI*.8:0,8,presentation.dt);});
 return <group name="shop-carousel" position={[0,altitudeAt(0),START_Z+5]}>
  <mesh position={[0,2,-4]}><planeGeometry args={[100,100]}/><meshBasicMaterial color="#10283b" fog={false}/></mesh>
  <mesh position={[0,-1.42,0]}><cylinderGeometry args={[1.6,1.75,.16,32]}/><meshStandardMaterial color="#173e50" roughness={.6} metalness={.3}/></mesh>
  <mesh position={[0,-1.34,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[1.51,1.55,48]}/><meshBasicMaterial color="#60e9d4" toneMapped={false}/></mesh>
  <pointLight position={[2,4,4]} intensity={15} distance={12} color="#daefff"/><pointLight position={[-3,2,0]} intensity={9} distance={9} color="#50dcca"/>
  <group ref={actor} name="shop-preview-actor" scale={PILOT_SCALE}><Pilot pilot={preview.pilot} inspect hero presentation={presentation} preview={preview}/></group></group>;
}
const kinds:Kind[]=['sol','term','community','gate','star','risk','delivery','gas','rug','hacked','water','rare','magnet'];
function Items({run}:{run:Runtime}){
 const refs=useRef<Record<string,THREE.InstancedMesh|null>>({}),ringClock=useMemo(()=>({value:0}),[]);
 const flash=useMemo(()=>new THREE.InstancedBufferAttribute(new Float32Array(128),1),[]),reduced=useMemo(()=>matchMedia('(prefers-reduced-motion: reduce)').matches,[]);
 const geometries=useMemo(()=>{const g=Object.fromEntries(kinds.map(k=>[k,propGeometry(k)]));g.star.setAttribute('starFlash',flash);return g;},[flash]);
 useEffect(()=>()=>Object.values(geometries).forEach(g=>g.dispose()),[geometries]);
 useFrame(()=>{const s=run.state,t=s.routeTime;ringClock.value=t;
  for(const kind of kinds){const mesh=refs.current[kind];if(!mesh)continue;let i=0;
   for(const o of s.objects){if(o.kind!==kind||!sequenceActive(s,o))continue;const collected=s.collected.includes(o.id),event=collected?s.events.find(e=>e.sourceId===o.id):undefined,age=event?(s.tick-event.tick)/60:10;if(collected&&(kind==='gate'||kind!=='star'&&age>.22))continue;
    const star=kind==='star'?starEffect(o,t,run.presentation.time,run.presentation.cues.find(e=>e.sourceId===o.id),reduced):null;
    const p=star?{x:star.position[0],y:star.position[1],z:star.position[2]}:objectPose(o,t),height=p.y;
    if(height<0||height>s.altitude+36||(!o.vertical&&height<s.altitude-170))continue; // Only cull behind the camera; distant objects dissolve into fog.
    dummy.position.set(p.x*WORLD_SCALE,height,p.z);
    const size=itemVisualSize(o);
    if(collected&&kind!=='star'){const f=Math.min(1,age/.22);dummy.position.lerp(new THREE.Vector3(s.x,s.altitude-.25,s.y),f);}
    dummy.scale.setScalar(size*(collected&&kind!=='star'?Math.max(.001,(1-age/.22)**2):o.sequence?ringReveal(s,o):1));
    const ring=kind==='gate'||kind==='risk'||kind==='star';dummy.rotation.set(o.vertical?0:-Math.PI/2,ring?0:Math.sin(t+o.t)*.15,star?star.angle:ring?0:t*.7);if(!o.attracted&&!!o.vertical!==(s.phase==='land'||s.phase==='finish'))continue;
    if(star)flash.setX(i,star.flash);dummy.updateMatrix();mesh.setMatrixAt(i++,dummy.matrix);
   }mesh.count=i;mesh.instanceMatrix.needsUpdate=true;
  }flash.needsUpdate=true;
 });
 return <group>{kinds.map(kind=><instancedMesh name={`course-${kind}`} key={kind} ref={r=>{refs.current[kind]=r;}} args={[geometries[kind],undefined,128]} frustumCulled={false}><PropMaterial kind={kind} ringClock={ringClock}/></instancedMesh>)}</group>;
}
function PropMaterial({kind,ringClock,hologram}:{kind:HologramKind;ringClock:{value:number};hologram?:{value:number}}){return <meshStandardMaterial transparent={!!hologram} depthWrite={!hologram} side={kind==='canopy'?THREE.DoubleSide:THREE.FrontSide} customProgramCacheKey={()=>(kind==='gate'?'striped-gate-v34':kind==='star'?'stationary-star-v43':'course-props-v34')+(hologram?'-holo'+(kind==='canopy'?'-canopy':''):featuredPickup(kind as Kind)?'-featured':'')} vertexColors roughness={kind==='sol'?.3:.58} metalness={kind==='sol'?.45:.08} emissive={['gas','rug','hacked'].includes(kind)?'#ff392e':kind==='sol'||kind==='star'?'#ffae18':'#23ff9d'} emissiveIntensity={kind==='sol'?.06:.12} onBeforeCompile={shader=>{if(kind!=='canopy')itemShader(shader);if(kind==='star'&&!hologram){shader.vertexShader='attribute float starFlash;varying float activation;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nactivation=starFlash;');shader.fragmentShader='varying float activation;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(4.,2.,.01)*activation;');}if(hologram){shader.uniforms.holoReveal=hologram;shader.uniforms.holoClock=ringClock;shader.vertexShader='varying vec3 holoPosition;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nholoPosition=position;');shader.fragmentShader='varying vec3 holoPosition;uniform float holoReveal;uniform float holoClock;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <dithering_fragment>',`#include <dithering_fragment>
float scan=.9+.1*sin(holoPosition.y*44.-holoClock*7.);gl_FragColor.rgb*=scan;gl_FragColor.rgb+=vec3(.02,.16,.18)*pow(max(0.,sin(holoPosition.y*8.-holoClock*3.)),14.);gl_FragColor.a*=holoReveal;`);}if(kind==='gate'){shader.uniforms.ringClock=ringClock;shader.vertexShader='varying vec3 ringPosition;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nringPosition=position;');shader.fragmentShader='varying vec3 ringPosition;uniform float ringClock;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
if(length(ringPosition.xy)<1.1){float stripe=step(.5,fract(atan(ringPosition.y,ringPosition.x)*2.54648-ringClock*.65));diffuseColor.rgb=mix(vec3(.97,.91,.8),vec3(.85,.025,.018),stripe);}else if(ringPosition.y>1.17){diffuseColor.rgb=vec3(2.5,.06,.025)*(.35+.65*step(.2,sin(ringClock*7.)));}`);}shader.fragmentShader=shader.fragmentShader.replace('#include <fog_fragment>',`#ifdef USE_FOG
float courseHaze=smoothstep(${featuredPickup(kind as Kind)?'70.,170.':'30.,110.'},vFogDepth);
gl_FragColor.rgb=mix(gl_FragColor.rgb,fogColor,courseHaze);
#endif`);}}/>;}
const hologramKinds:Kind[]=['delivery','gas','gate','star','community'];
function TutorialObjects({conversation,presentation,crew}:{conversation:ConversationMotion;presentation:Presentation;crew:React.RefObject<THREE.Group|null>}){
 const root=useRef<THREE.Group>(null),projection=useRef({kind:null as HologramKind|null,alpha:0}),meshes=useRef<Record<string,THREE.Mesh|null>>({}),ringClock=useMemo(()=>({value:0}),[]),reveal=useMemo(()=>({value:0}),[]),beam=useRef<THREE.LineSegments>(null),base=useRef<THREE.Mesh>(null);
 const reduced=useMemo(()=>matchMedia('(prefers-reduced-motion: reduce)'),[]),hand=useMemo(()=>new THREE.Vector3(),[]),destination=useMemo(()=>new THREE.Vector3(),[]);
 const rays=useMemo(()=>new Float32Array(24),[]);
 const geometries=useMemo(()=>{const g:Record<string,THREE.BufferGeometry>=Object.fromEntries(hologramKinds.map(k=>[k,propGeometry(k)]));g.canopy=canopyGeometry().canopy;g.canopy.translate(0,-2.5,0);return g;},[]);
 useEffect(()=>()=>Object.values(geometries).forEach(g=>g.dispose()),[geometries]);
 useFrame(()=>{const dt=presentation.dt;if(!dt||!root.current)return;const c=conversation,models=c.frame.models,elapsed=c.time-c.stepAt,wanted=c.presence>.3&&c.focus>.2&&models.length?models[Math.floor(Math.max(0,elapsed)/3.1)%models.length]:null;
  const p=advanceProjection(projection.current,wanted,dt);ringClock.value=presentation.time;reveal.value=p.alpha;
  const socket=crew.current?.getObjectByName('pilot-grip-R');if(!socket)return;socket.getWorldPosition(hand);hand.y+=.055;
  root.current.visible=p.alpha>.001;root.current.position.copy(hand);root.current.updateMatrixWorld();
  // The same wrist socket that anchors the live parachute rig drives the beam origin.
  destination.set(0,p.kind==='canopy'?1.05:.76,0); // World-up offset stays directly above the animated wrist.
  for(const [kind,mesh]of Object.entries(meshes.current)){if(!mesh)continue;mesh.visible=kind===p.kind;mesh.position.copy(destination).multiplyScalar(reduced.matches?1:THREE.MathUtils.smoothstep(p.alpha,0,1));mesh.rotation.y=reduced.matches?.3:.3+Math.sin(presentation.time*.65)*.42;mesh.scale.setScalar((kind==='canopy'?.16:kind==='gate'||kind==='star'?.30:.30)*(reduced.matches?1:.7+.3*p.alpha));}
  for(let i=0;i<4;i++){const a=i*Math.PI/2,j=i*6;rays[j]=rays[j+1]=rays[j+2]=0;rays[j+3]=destination.x+Math.cos(a)*.32;rays[j+4]=destination.y+Math.sin(a)*.32;rays[j+5]=destination.z;}
  if(beam.current){beam.current.geometry.attributes.position.needsUpdate=true;(beam.current.material as THREE.LineBasicMaterial).opacity=.32*p.alpha;(beam.current.material as THREE.LineBasicMaterial).color.set(p.kind==='gas'?'#ff6d75':p.kind==='delivery'?'#5fff9d':'#65fff0');}
  if(base.current){base.current.scale.setScalar(.75+.25*p.alpha);(base.current.material as THREE.MeshBasicMaterial).opacity=p.alpha;(base.current.material as THREE.MeshBasicMaterial).color.set(p.kind==='gas'?'#ff6d75':p.kind==='delivery'?'#5fff9d':'#65fff0');}
  const expression=c.frame.tutorial&&c.frame.step===1&&p.kind==='gas'&&p.alpha>.05?'warning':c.frame.expression;
  if(c.projectedExpression!==expression){c.gestureAt=c.time;if(c.frame.tutorial&&c.frame.step===1&&c.projectedExpression)dialogueSound(expression);c.projectedExpression=expression;}
  if(import.meta.env.DEV&&new URLSearchParams(location.search).get('qa')==='1')Object.assign(window,{__RUNWAY_HOLOGRAM_QA__:{kind:p.kind,alpha:p.alpha,wanted,models,hand:hand.toArray(),position:destination.clone().add(hand).toArray(),expression}});
 });
 return <group ref={root} name="tutorial-projection" visible={false}>
  {[...hologramKinds,'canopy' as const].map(kind=><mesh ref={el=>{meshes.current[kind]=el;}} key={kind} name={`projection-${kind}`} geometry={geometries[kind]}><PropMaterial kind={kind} ringClock={ringClock} hologram={reveal}/></mesh>)}
  <mesh ref={base} name="hand-projector" rotation={[-Math.PI/2,0,0]}><sphereGeometry args={[.065,12,8]}/><meshBasicMaterial color="#6dfff1" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} toneMapped={false}/></mesh>
  <lineSegments ref={beam} frustumCulled={false}><bufferGeometry><bufferAttribute attach="attributes-position" args={[rays,3]}/></bufferGeometry><lineBasicMaterial color="#65fff0" transparent opacity={0} depthWrite={false} toneMapped={false}/></lineSegments>
 </group>;
}
function RingSigns({run}:{run:Runtime}){
 const indices=useMemo(()=>new THREE.InstancedBufferAttribute(new Float32Array(16*2),2),[]);
 const mesh=useRef<THREE.InstancedMesh>(null),atlas=useMemo(()=>{const c=document.createElement('canvas');c.width=768;c.height=512;const ctx=c.getContext('2d')!;ctx.fillStyle='#092331';ctx.fillRect(0,0,768,512);ctx.font='bold 43px monospace';ctx.textAlign='center';ctx.textBaseline='middle';for(let count=3;count<=6;count++)for(let i=0;i<count;i++){ctx.fillStyle='#ffef98';ctx.fillText(`${i+1}/${count}`,i*128+64,(count-3)*128+64);}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;},[]);
 useEffect(()=>()=>atlas.dispose(),[atlas]);
 useFrame(()=>{if(!mesh.current)return;let n=0;const s=run.state;for(const o of s.objects){if(o.kind!=='gate'||!sequenceActive(s,o)||s.collected.includes(o.id)||!!o.vertical!==(s.phase==='land'))continue;const p=objectPose(o,s.routeTime);if(p.y>s.altitude+25||p.y<s.altitude-140)continue;dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(o.vertical?0:-Math.PI/2,0,0);const reveal=ringReveal(s,o);dummy.translateY(o.r*1.03*reveal);dummy.translateZ(.12);dummy.scale.set(o.r*.52*reveal,o.r*.25*reveal,1);dummy.updateMatrix();mesh.current.setMatrixAt(n,dummy.matrix);indices.setXY(n,(o.order??0)/6,(6-(o.count??4))/4);n++;}mesh.current.count=n;mesh.current.instanceMatrix.needsUpdate=true;indices.needsUpdate=true;});
 return <instancedMesh name="course-ring-signs" ref={mesh} args={[undefined,undefined,16]} frustumCulled={false}><planeGeometry><primitive attach="attributes-ledIndex" object={indices}/></planeGeometry><shaderMaterial side={THREE.DoubleSide} uniforms={{atlas:{value:atlas},...THREE.UniformsUtils.clone(THREE.UniformsLib.fog)}} fog vertexShader={`attribute vec2 ledIndex;varying vec2 ledUv;
#include <fog_pars_vertex>
void main(){ledUv=uv*vec2(1./6.,.25)+ledIndex;vec4 mvPosition=modelViewMatrix*instanceMatrix*vec4(position,1.);gl_Position=projectionMatrix*mvPosition;
#include <fog_vertex>
}`} fragmentShader={`uniform sampler2D atlas;varying vec2 ledUv;
#include <fog_pars_fragment>
void main(){gl_FragColor=texture2D(atlas,ledUv);
#include <colorspace_fragment>
#include <fog_fragment>
}`}/></instancedMesh>;
}
function Aircraft({run}:{run:Runtime|null}){const model=useLoader(GLTFLoader,publicUrl('/assets/models/runway-aircraft.glb?v=routes-21')),hatchModel=useLoader(GLTFLoader,publicUrl('/assets/models/runway-hatch.glb?v=routes-21')),root=useRef<THREE.Group>(null),hatch=useRef<THREE.Group>(null);useEffect(()=>{for(const asset of[model,hatchModel])asset.scene.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;for(const m of Array.isArray(o.material)?o.material:[o.material]){if(m instanceof THREE.MeshStandardMaterial){const metal=m.name.includes('Brushed'),rubber=m.name.includes('Rubber');m.roughness=metal?.33:rubber?.87:.57;m.metalness=metal?.72:rubber?0:.18;m.envMapIntensity=metal?.8:.55;}}}});},[model,hatchModel]);useFrame(()=>{const t=run?run.state.routeTime:0;if(root.current){root.current.visible=t<18;root.current.position.set(0,AIRCRAFT.floor,START_Z+Math.max(0,t-4)*16);}if(hatch.current)hatch.current.rotation.x=-doorOpening(t)*Math.PI*.5;});return <group ref={root} name="aircraft"><primitive object={model.scene}/><pointLight position={[-2.65,3.65,6.4]} color="#ffe0b0" intensity={26} distance={10} decay={2}/><pointLight position={[2.7,2.9,2.2]} color="#89d9ff" intensity={16} distance={9} decay={2}/>{[-1,1].map(side=><group key={side} name={`aircraft-signal-${side}`} position={[side*3.22,2.85,1.2]} rotation={[0,-side*Math.PI/2,0]}><Solid scale={[.55,.48,.24]} color="#133549"/><mesh position={[0,0,.17]}><sphereGeometry args={[.14,12,8]}/><meshStandardMaterial color={run?'#7affbd':'#ff7064'} emissive={run?'#28ff8d':'#ff3524'} emissiveIntensity={2.5} toneMapped={false}/></mesh></group>)}<group ref={hatch} name="aircraft-hatch"><primitive object={hatchModel.scene}/></group></group>;}
function Effects({run}:{run:Runtime}){
 const particles=useRef<THREE.InstancedMesh>(null),wind=useRef<THREE.InstancedMesh>(null);
 const tokens=useMemo(()=>propGeometry('sol'),[]);useEffect(()=>()=>tokens.dispose(),[tokens]);
 useFrame(()=>{const s=run.state,t=s.routeTime,h=s.altitude,event=run.presentation.cues.filter(e=>e.delta<0).at(-1),age=event?run.presentation.time-event.at:10;
  if(particles.current){let count=0;if(age<2&&event?.delta){for(let i=0;i<24;i++){const a=i*2.399,r=age*(2+i%5*.55);
   dummy.position.set(event!.position[0]+Math.cos(a)*r,event!.position[1]+age*(event!.velocity-2+i%3)-age*age*5,event!.position[2]+Math.sin(a)*r);
   dummy.scale.setScalar((.12+(i%4)*.025)*Math.max(0,1-age/2));dummy.rotation.set(a+age*4,a,0);dummy.updateMatrix();particles.current.setMatrixAt(count,dummy.matrix);particles.current.setColorAt(count,new THREE.Color('#ffdc7c'));count++;
  }}particles.current.count=count;particles.current.instanceMatrix.needsUpdate=true;if(particles.current.instanceColor)particles.current.instanceColor.needsUpdate=true;}
  if(wind.current){wind.current.visible=t>TIMING.exit&&!s.outcome;for(let i=0;i<40;i++){dummy.position.set(s.x+(i%2?-1:1)*(4+Math.abs(Math.sin(i*3.77))*7),h-35+((i*6+t*(t<TIMING.glide?28:8))%65),worldZ(s.y,t)+Math.cos(i*1.7)*11);dummy.scale.set(.045,t<TIMING.glide?3.5:.8,.045);dummy.rotation.set(0,0,0);dummy.updateMatrix();wind.current.setMatrixAt(i,dummy.matrix);}wind.current.instanceMatrix.needsUpdate=true;}

 });
 return <><instancedMesh ref={particles} args={[tokens,undefined,24]} frustumCulled={false}><meshStandardMaterial vertexColors roughness={.45} metalness={.2}/></instancedMesh><instancedMesh ref={wind} args={[undefined,undefined,40]} frustumCulled={false}><boxGeometry/><meshBasicMaterial color="#f5ffec" transparent opacity={.55} depthWrite={false}/></instancedMesh></>;
}
function Scene({run,pilot,suit,onTick,onReady,inspect,briefing,shop}:{shop?:ShopPreview|null;briefing?:TutorialFrame|null;inspect?:boolean;run:Runtime|null;pilot:number;suit:number;onTick:()=>void;onLost:()=>void;onReady?:(prepared:Runtime|null)=>void}){
 const char=useRef<THREE.Group>(null),island=useRef<THREE.Group>(null),prev=useRef(0),{camera,scene,setDpr,gl,size}=useThree();
 const radiance=useRef<ReturnType<typeof reflectionRig>|null>(null),fill=useRef<THREE.DirectionalLight>(null),hemi=useRef<THREE.HemisphereLight>(null),ambient=useRef<THREE.AmbientLight>(null);
 useEffect(()=>{const rig=reflectionRig(gl);radiance.current=rig;scene.environment=rig.sky;scene.environmentIntensity=.8;rig.apply(scene);return()=>{scene.environment=null;radiance.current=null;rig.dispose();};},[scene,gl]);
 useEffect(()=>{radiance.current?.apply(scene);},[run,pilot,shop,scene]);
 const landingShot=useRef<{run:Runtime;position:THREE.Vector3;aim:THREE.Vector3;fov:number;plan:ReturnType<typeof landingOrbit>}|null>(null);
 const debugClock=useRef(0),framing=useRef(new THREE.Vector2()),airport=useRef(createPresentation()),previousPilot=useRef(new THREE.Vector3());
 const conversation=useRef(createConversation()),crewGroup=useRef<THREE.Group>(null),aircraftGroup=useRef<THREE.Group>(null),carousel=useRef<THREE.Group>(null),projectionFraming=useRef(0);
 const quality=useRef({age:0,low:0,high:0,reduced:false});
 const fpsTime=useRef(0),fpsFrames=useRef(0),lastRun=useRef<Runtime|null|undefined>(undefined),target=new THREE.Vector3(),obstructionFocus=useRef(new THREE.Vector3()),look=useRef(new THREE.Vector3());
 // Readiness belongs to the committed scene, not the first pre-render callback.
 useEffect(()=>{let cancelled=false;const paint=()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
 void(async()=>{await paint();if(cancelled)return;await gl.compileAsync(scene,camera);await paint();if(!cancelled)onReady?.(run);})();
 return()=>{cancelled=true;};},[run,gl,scene,camera]);
 useEffect(()=>{scene.fog=new THREE.Fog('#92becb',65,200);scene.background=new THREE.Color('#92becb');return()=>{scene.fog=null;};},[scene]);
 useFrame((_,rawDt)=>{let dt=Math.min(rawDt,.05);const p=run?.presentation??airport.current;if(!run){p.dt=document.hidden?0:dt;p.time+=p.dt;}const outside=exteriorBlend(run?.presentation.route??0);if(radiance.current)radiance.current.uniforms.runwayExterior.value=outside;scene.userData.exteriorBlend=outside;if(fill.current)fill.current.intensity=THREE.MathUtils.lerp(.12,.55,outside);if(hemi.current)hemi.current.intensity=THREE.MathUtils.lerp(.22,.65,outside);if(ambient.current)ambient.current.intensity=THREE.MathUtils.lerp(.055,.12,outside);if(run){run.renderStats.calls=Math.max(run.renderStats.calls,gl.info.render.calls);run.renderStats.triangles=Math.max(run.renderStats.triangles,gl.info.render.triangles);advance(run,rawDt);}const s=run?.state,t=s?s.routeTime:0,h=s?p.position[1]:altitudeAt(0),x=s?p.position[0]:0,z=s?p.position[2]:START_Z+5,cam=camera as THREE.PerspectiveCamera;
  dt=Math.min(p.dt,.05);
  const c=conversation.current;advanceConversation(c,run?null:briefing??null,dt);projectionFraming.current=THREE.MathUtils.damp(projectionFraming.current,c.frame.models.length&&c.focus>.2?1:0,5,dt);
  if(crewGroup.current){crewGroup.current.visible=!run&&c.presence>.001&&(!shop||c.focus>.01);crewGroup.current.position.set((c.frame.tutorial?-3.25:-2.7)+c.presence*(c.frame.tutorial?.8:1.15)-(shop?1-c.focus:0)*.85,AIRCRAFT.floor+1.4,START_Z+(c.frame.tutorial?10.1:6.1)-(shop?1-c.focus:0)*5.5);}
  if(carousel.current)carousel.current.visible=!!shop&&!run&&c.focus<.3;
  if(aircraftGroup.current)aircraftGroup.current.visible=!shop||!!run||c.focus>=.3;
  const drop=p.departure,glide=p.canopy,ended=p.landingAge,surface=scene.getObjectByName('island-terrain')?.userData.cameraSurface??landingSurface;
  target.set(x+(s?.vx||0)*.025,h+4.65+glide*2.85,z+1.88+glide*7.2);const aim=new THREE.Vector3(x+(s?.vx||0)*.045,h-.25-glide*.3,z-.3-glide*.9);
  if(!run||t<6){const u=run?drop:0;const inside=new THREE.Vector3(x+1.65,h+.76,z+5.0),insideAim=new THREE.Vector3(x,h+.02,z-.25);target.lerp(inside,1-u);aim.lerp(insideAim,1-u);}
  if(shop&&!run){
   // Fit a fixed-size actor into the measured UI viewport; never shrink the rig.
   const canopy=shop.category==='canopy',portrait=shop.category==='accessory'||shop.category==='helmet',f=shop.frame,halfTan=Math.tan(THREE.MathUtils.degToRad(48/2));
   const distance=Math.max((canopy?2.8:portrait?1.9:2.8)/(2*halfTan*(f?.height??.48)),(canopy?5:portrait?1.9:3)/(2*halfTan*(size.width/size.height)*(f?.width??.5)))*1.12;
   const focus=canopy?2.2:portrait?.65:0;
   target.set(0,h+focus+(canopy?distance*.3:.3),z+distance);aim.set(0,h+focus,z);
  }
  if(!run&&c.focus>0){if(c.frame.tutorial){
   const distance=Math.max(3.8,(size.width>size.height?3.1:2.65)/(2*Math.tan(THREE.MathUtils.degToRad(24))*(size.width/size.height)));
   target.lerp(new THREE.Vector3(.4,AIRCRAFT.floor+2.15,START_Z+10.1+distance),c.focus);
   aim.lerp(new THREE.Vector3(-2.2,AIRCRAFT.floor+1.95,START_Z+10.1),c.focus);
  }else{const q=projectionFraming.current;target.lerp(new THREE.Vector3(-1.55+q*.55,h+.85,START_Z+10.2+q*2),c.focus);aim.lerp(new THREE.Vector3(-1.55+q*.55,h+.4,START_Z+6.1),c.focus);}}
  if((!run||t<6)&&(!shop||c.focus>=.3))constrainAircraftCamera(target);
  if(run&&ended>=0&&!p.fall){
   const focus=new THREE.Vector3(x,h-.1,z),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
   if(landingShot.current?.run!==run){const start=Math.atan2(cam.position.x-x,cam.position.z-z),plan=landingOrbit(focus,start,24,surface);if(reduced)plan.arc=0;landingShot.current={run,position:cam.position.clone(),aim:look.current.clone(),fov:cam.fov,plan};p.orbit=plan.start+plan.arc;}
   const shot=landingShot.current,u=THREE.MathUtils.smootherstep(ended,0,reduced?1.2:3),angle=shot.plan.start+orbitAngle(u,shot.plan.arc);
   const distance=THREE.MathUtils.clamp(p.resultFraming?8.6*.32/p.resultFraming.height:8.6,8.6,24);
   const radius=reduced?THREE.MathUtils.lerp(Math.hypot(shot.position.x-x,shot.position.z-z),distance,u):orbitRadius(u,distance,Math.hypot(shot.position.x-x,shot.position.z-z));
   target.set(x+Math.sin(angle)*radius,THREE.MathUtils.lerp(shot.position.y,focus.y+shot.plan.elevation,u),z+Math.cos(angle)*radius);
   aim.copy(shot.aim).lerp(focus,u);
  }else if(!run)landingShot.current=null;
  if(p.fall){target.set(x+2.8,h+2.5,z+6.4);aim.set(x,h-.25,z);}
  obstructionFocus.current.set(x,h+.2,z);if(run&&h<55)avoidScenery(target,obstructionFocus.current,false,surface);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;if(run&&!reduced&&!s?.outcome&&t>5){const turbulence=stormIntensity(t);target.x+=Math.sin(t*29)*.085*turbulence;target.y+=Math.cos(t*37)*.06*turbulence;}
  const impact=activeImpact(p),hitAge=impact?p.time-impact.at:9;if(!reduced&&hitAge<.35){const envelope=(1-hitAge/.35)**2;target.x+=Math.sin(hitAge*65)*.04*envelope;}
  const reset=lastRun.current===undefined||!!lastRun.current&&lastRun.current!==run;
  if(reset){cam.position.copy(target);look.current.copy(aim);}else{if(run&&(!s?.outcome||p.fall)&&lastRun.current===run){const travelled=new THREE.Vector3(x,h,z).sub(previousPilot.current);cam.position.add(travelled);look.current.add(travelled);}cam.position.lerp(target,1-Math.exp(-dt*8));look.current.lerp(aim,1-Math.exp(-dt*8));}if(run&&h<55)avoidScenery(cam.position,obstructionFocus.current,false,surface);if((!run||t<6)&&(!shop||c.focus>=.3))constrainAircraftCamera(cam.position);lastRun.current=run;cam.lookAt(look.current);if(run&&!reduced&&!s?.outcome)cam.rotateZ(Math.sin(t*31)*.012*stormIntensity(t)+(hitAge<.35?Math.sin(hitAge*65)*.005*(1-hitAge/.35)**2:0));const speed=s?Math.abs(s.verticalSpeed):0,wantedFov=p.fall?58:ended>=0?THREE.MathUtils.lerp(landingShot.current?.fov??80,48,THREE.MathUtils.smootherstep(ended,0,3)):!run?THREE.MathUtils.lerp(48,c.frame.tutorial?Math.min(48,THREE.MathUtils.radToDeg(2*Math.atan((size.width>size.height?3.1:2.65)/(2*3.8*(size.width/size.height))))):44+projectionFraming.current*4,c.focus):THREE.MathUtils.lerp(48,THREE.MathUtils.lerp(78+10*THREE.MathUtils.clamp((speed/FALL_SPEED-1)/.25,0,1),80+4*THREE.MathUtils.clamp((speed/GLIDE_SPEED-1)/.25,0,1),glide),drop);cam.fov=reset?wantedFov:THREE.MathUtils.damp(cam.fov,wantedFov,8,dt);
  // Off-axis framing reserves space for the UI without tilting the scene into the ground.
  const wide=size.width>size.height,settled=ended>=0?THREE.MathUtils.smoothstep(ended,0,p.fall?.65:2.5):0;
  const resultFrame=p.resultFraming;
  if(reset)framing.current.set(0,0);framing.current.lerp(new THREE.Vector2(resultFrame?.x!==undefined?.5-resultFrame.x:!run&&shop?.frame&&c.focus<.01?.5-shop.frame.x:!run&&c.frame.tutorial&&c.focus>.01?(size.width>size.height&&size.height<600?.13*c.focus:0):!run&&wide?Math.max(c.focus*.2,shop?.16:0):wide?.24*settled:0,resultFrame?.y!==undefined?.5-resultFrame.y:!run&&c.focus>.01?(c.frame.tutorial&&size.width>size.height&&size.height<600?.06:.13)*c.focus:shop&&!run?(shop.frame?.y!==undefined?.5-shop.frame.y:(shop.category==='canopy'?.08:.03)):THREE.MathUtils.lerp(-.10*glide,wide?0:.22,settled)),1-Math.exp(-dt*8));
  cam.setViewOffset(size.width,size.height,framing.current.x*size.width,framing.current.y*size.height,size.width,size.height);
  cam.updateProjectionMatrix();cam.updateMatrixWorld();previousPilot.current.set(x,h,z);if(import.meta.env.DEV&&new URLSearchParams(location.search).get('qa')==='1')Object.assign(window,{__RUNWAY_SCENE_QA__:{scene,camera:cam,renderer:gl,runId:run?.id??null},__RUNWAY_CAMERA_QA__:{time:t,position:cam.position.toArray(),target:target.toArray(),fov:cam.fov,pilotNdc:new THREE.Vector3(x,h,z).project(cam).toArray(),pilot:[x,h,z],pitch:Math.atan2(cam.position.y-look.current.y,Math.hypot(cam.position.x-look.current.x,cam.position.z-look.current.z))*180/Math.PI}});
  // Development-only fixed views: the real renderer, culling and LOD all use this camera.
  if(import.meta.env.DEV&&new URLSearchParams(location.search).get('qa')==='1'){const view=(window as unknown as {__RUNWAY_ENV_VIEW__?:{position:[number,number,number];target:[number,number,number]}}).__RUNWAY_ENV_VIEW__;if(view){cam.clearViewOffset();cam.position.set(...view.position);cam.lookAt(new THREE.Vector3(...view.target));cam.fov=52;cam.updateProjectionMatrix();cam.updateMatrixWorld();}}
  const shade=1-.42*atmosphere(t).immersion;if(fill.current)fill.current.intensity*=shade;if(hemi.current)hemi.current.intensity*=shade;
  if(scene.fog instanceof THREE.Fog){const a=atmosphere(t);scene.fog.near=52*(1-a.immersion)+12*a.immersion;scene.fog.far=1550*(1-a.immersion)+68*a.immersion;scene.fog.color.set('#65a5ef').lerp(new THREE.Color('#85c8e4'),a.clearing).lerp(new THREE.Color('#737e91'),a.immersion);}
  if(char.current){char.current.visible=!shop||c.focus>.3;char.current.position.set(x,h,z);char.current.scale.setScalar(PILOT_SCALE);}
  debugClock.current+=rawDt;if(import.meta.env.DEV&&new URLSearchParams(location.search).get('qa')==='1')Object.assign(window,{__RUNWAY_LIGHT_QA__:{blend:outside,environment:scene.environment?.uuid,exposure:gl.toneMappingExposure,hemi:hemi.current?.intensity,fill:fill.current?.intensity}});
  if(import.meta.env.DEV&&new URLSearchParams(location.search).get('qa')==='1'&&char.current&&debugClock.current>.2){debugClock.current=0;char.current.updateWorldMatrix(true,true);let low=Infinity,high=-Infinity,left=Infinity,right=-Infinity;const p=new THREE.Vector3();const parts=[char.current.getObjectByName('pilot-skeletal-suit'),char.current.getObjectByName('pilot-led-helmet')];for(const part of parts)part?.traverseVisible(mesh=>{if(!(mesh instanceof THREE.Mesh))return;const positions=mesh.geometry.attributes.position;for(let i=0;i<positions.count;i++){p.fromBufferAttribute(positions,i);if(mesh instanceof THREE.SkinnedMesh)mesh.applyBoneTransform(i,p);p.applyMatrix4(mesh.matrixWorld).project(cam);low=Math.min(low,p.y);high=Math.max(high,p.y);left=Math.min(left,p.x);right=Math.max(right,p.x);}});Object.assign(window,{__RUNWAY_PRESENTATION_QA__:{sampleAt:performance.now(),viewport:[size.width,size.height],crew:c.presence>.001,conversation:{presence:c.presence,focus:c.focus,expression:c.projectedExpression??c.frame.expression,letters:c.frame.letters,talking:c.frame.talking,position:crewGroup.current?.position.toArray(),heroYaw:char.current?.getObjectByName('pilot-body')?.rotation.y},step:briefing?.step??null,heroHeight:(high-low)/2,heroBounds:{left:(left+1)/2,right:(right+1)/2,top:(1-high)/2,bottom:(1-low)/2},calls:gl.info.render.calls,triangles:gl.info.render.triangles}});}

  if(island.current)island.current.visible=!!run;
  if(performance.now()-prev.current>50){prev.current=performance.now();onTick();}
  fpsTime.current+=rawDt;fpsFrames.current++;quality.current.age+=rawDt;if(fpsTime.current>2){const fps=fpsFrames.current/fpsTime.current;if(run){run.renderFps.push(fps);if(run.renderFps.length>300)run.renderFps.shift();}
   // Shader compilation/loading must not permanently reduce resolution. Hysteresis prevents oscillation.
   const q=quality.current;if(q.age>6){q.low=fps<32?q.low+1:0;q.high=fps>52?q.high+1:0;if(q.low>=2&&!q.reduced){setDpr(.85);q.reduced=true;q.high=0;}else if(q.high>=3&&q.reduced){setDpr(Math.min(devicePixelRatio,1.5));q.reduced=false;q.low=0;}}fpsFrames.current=0;fpsTime.current=0;}
 },-3);
 return <><SummerSky run={run}/><ambientLight ref={ambient} intensity={.055}/><SunLight run={run}/><DoorLight run={run}/><directionalLight ref={fill} position={[25,15,40]} intensity={.12} color="#9cddff"/><hemisphereLight ref={hemi} args={['#d2edff','#253440',.22]}/><Clouds run={run}/><Storm run={run}/><group ref={aircraftGroup}><Aircraft run={run}/></group><group ref={crewGroup} visible={false} scale={PILOT_SCALE}><Pilot pilot={2} hero crew conversation={conversation.current} presentation={airport.current}/><pointLight position={[.7,1.1,1.7]} color="#c2fffa" intensity={4} distance={4}/></group>{!run&&<TutorialObjects conversation={conversation.current} presentation={airport.current} crew={crewGroup}/>}<Updrafts run={run}/><Rainbow run={run}/>{run&&<><Effects run={run}/><PilotTrail run={run} presentation={run.presentation}/><FlightEffects run={run}/><Items run={run}/><ObjectGlows run={run}/><RingSigns run={run}/></>}<group ref={island}><Island run={run}/></group><ContactShadow run={run}/><group ref={char} visible={!shop}><Pilot presentation={run?.presentation??airport.current} conversation={conversation.current} briefing={briefing} inspect={inspect} pilot={pilot} suit={suit} run={run} hero={!run}/></group><group ref={carousel}>{shop&&!run&&<PilotCarousel preview={shop} presentation={airport.current}/>}</group></>;
}
function ContextRecovery({onLost}:{onLost:()=>void}){const {gl}=useThree();const callback=useRef(onLost);callback.current=onLost;useEffect(()=>{const lost=(e:Event)=>{e.preventDefault();callback.current();};gl.domElement.addEventListener('webglcontextlost',lost);return()=>gl.domElement.removeEventListener('webglcontextlost',lost);},[gl]);return null;}
export function World(props:{shop?:ShopPreview|null;briefing?:TutorialFrame|null;inspect?:boolean;run:Runtime|null;pilot:number;suit:number;onTick:()=>void;onLost:()=>void;onReady?:(prepared:Runtime|null)=>void}){return <Canvas shadows dpr={[.75,1.5]} gl={{antialias:true,alpha:true,powerPreference:'high-performance'}} camera={{position:[0,0,14],near:.1,far:3000}}><ContextRecovery onLost={props.onLost}/><Scene {...props}/><SpeedBlur run={props.run}/></Canvas>}
