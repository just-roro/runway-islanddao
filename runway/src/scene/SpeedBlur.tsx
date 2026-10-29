import {useEffect,useMemo} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import{TIMING}from'../core/simulation';
import{SUN_DIRECTION}from'./lighting';
import{atmosphere}from'./atmosphere';
import{exteriorBlend,doorDazzle}from'./environments';
import{AIRCRAFT,START_Z}from'../core/simulation';
import type {Runtime} from '../services/runtime';
// HDR scene → quarter-resolution prefilter → Gaussian X → composite Gaussian Y.
// Prefilter must precede blur: sampling the full-size source on a quarter-size grid
// produces separate replicas of small highlights. UI remains outside this pipeline.
export function SpeedBlur({run}:{run:Runtime|null}){
 const {gl,size}=useThree();
 const effect=useMemo(()=>{
  const hdr=gl.extensions.has('EXT_color_buffer_float');
  const target=new THREE.WebGLRenderTarget(1,1,{depthBuffer:true,samples:Math.min(2,gl.capabilities.maxSamples),type:hdr?THREE.HalfFloatType:THREE.UnsignedByteType});
  const glow=new THREE.WebGLRenderTarget(1,1,{depthBuffer:false,type:hdr?THREE.HalfFloatType:THREE.UnsignedByteType});
  const prefilter=glow.clone();
  const vertex='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
  const extract=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{frame:{value:target.texture},stepUv:{value:new THREE.Vector2()},pixel:{value:new THREE.Vector2()},threshold:{value:1}},vertexShader:vertex,fragmentShader:`uniform sampler2D frame;uniform vec2 stepUv;uniform vec2 pixel;uniform float threshold;varying vec2 vUv;
  vec3 light(vec2 uv){
   // Four-source downsample prevents isolated HDR pixels becoming square bloom blocks.
   vec3 c=(texture2D(frame,uv+pixel).rgb+texture2D(frame,uv-pixel).rgb+texture2D(frame,uv+vec2(pixel.x,-pixel.y)).rgb+texture2D(frame,uv+vec2(-pixel.x,pixel.y)).rgb)*.25;
   float peak=max(c.r,max(c.g,c.b));float knee=smoothstep(threshold*.65,threshold*1.4,peak);
   return c*knee;
  }
  void main(){gl_FragColor=vec4(light(vUv),1.);}`});
  const blur=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{frame:{value:prefilter.texture},stepUv:{value:new THREE.Vector2()}},vertexShader:vertex,fragmentShader:`uniform sampler2D frame;uniform vec2 stepUv;varying vec2 vUv;
  void main(){vec3 c=texture2D(frame,vUv).rgb*.227027;c+=(texture2D(frame,vUv+stepUv*1.384615).rgb+texture2D(frame,vUv-stepUv*1.384615).rgb)*.316216;c+=(texture2D(frame,vUv+stepUv*3.230769).rgb+texture2D(frame,vUv-stepUv*3.230769).rgb)*.070270;gl_FragColor=vec4(c,1.);}`});
  const material=new THREE.ShaderMaterial({uniforms:{frame:{value:target.texture},glow:{value:glow.texture},glowStep:{value:new THREE.Vector2()},strength:{value:0},bloom:{value:.4},aspect:{value:1},sunUv:{value:new THREE.Vector2(-5,-5)},flare:{value:0},outside:{value:0},apertureUv:{value:new THREE.Vector2()},apertureGlare:{value:0},exposure:{value:1},cloudVeil:{value:0}},depthTest:false,depthWrite:false,vertexShader:vertex,fragmentShader:`uniform sampler2D frame;uniform sampler2D glow;uniform vec2 glowStep;uniform float strength;uniform float bloom;uniform float aspect;uniform vec2 sunUv;uniform float flare;uniform float outside;uniform vec2 apertureUv;uniform float apertureGlare;uniform float exposure;uniform float cloudVeil;varying vec2 vUv;
  void main(){vec2 d=vUv-vec2(.5,.52);float edge=smoothstep(.24,.56,length(d))*smoothstep(.18,.46,abs(d.x));vec2 stepUv=d*strength*edge;vec4 c=texture2D(frame,vUv)*.4;c+=texture2D(frame,vUv-stepUv)*.24;c+=texture2D(frame,vUv-stepUv*2.)*.18;c+=texture2D(frame,vUv-stepUv*3.)*.12;c+=texture2D(frame,vUv-stepUv*4.)*.06;vec3 g=texture2D(glow,vUv).rgb*.227027;g+=(texture2D(glow,vUv+glowStep*1.384615).rgb+texture2D(glow,vUv-glowStep*1.384615).rgb)*.316216;g+=(texture2D(glow,vUv+glowStep*3.230769).rgb+texture2D(glow,vUv-glowStep*3.230769).rgb)*.070270;c.rgb+=g*bloom;vec2 axis=vec2(.5)-sunUv;float halo=exp(-length(vUv-sunUv)*38.);vec2 ghost=sunUv+axis*1.5;float ring=exp(-abs(length((vUv-ghost)*vec2(aspect,1.))-.055)*125.);float orb=exp(-length((vUv-(sunUv+axis*1.05))*vec2(aspect,1.))*65.);float ghost2=exp(-length((vUv-(sunUv+axis*1.85))*vec2(aspect,1.))*32.);float streak=exp(-abs(vUv.y-sunUv.y)*550.)*exp(-abs(vUv.x-sunUv.x)*8.);c.rgb+=flare*(vec3(1.,.57,.23)*(halo*.45+streak*.2+orb*.08)+vec3(.15,.65,.48)*(ring*.06+ghost2*.04));vec2 door=(vUv-apertureUv)*vec2(aspect,1.);float veil=exp(-dot(door,door)*12.);float doorRay=exp(-abs(door.y)*95.)*exp(-abs(door.x)*3.5);c.rgb+=vec3(1.,.88,.65)*apertureGlare*(veil*.65+doorRay*.2);
  // Forward scatter is strongest in bright sky, with a restrained center to retain
  // the pilot and course. This veil and bloom share the canopy / cloud-exit clock.
  c.rgb+=vec3(1.,.94,.78)*cloudVeil*(.35+.65*smoothstep(.05,.7,length(d)));
  float luma=dot(c.rgb,vec3(.2126,.7152,.0722));c.rgb=mix(vec3(luma),c.rgb,1.+outside*.06)*exposure;
  float noise=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5;c.rgb+=noise/255.*edge;gl_FragColor=c;
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  }`});
  const geometry=new THREE.PlaneGeometry(2,2),scene=new THREE.Scene(),quad=new THREE.Mesh(geometry,material);scene.add(quad);
  return{target,prefilter,glow,extract,blur,material,geometry,scene,quad,camera:new THREE.Camera(),sunPoint:new THREE.Vector3(),doorPoint:new THREE.Vector3(),hdr,direction:new THREE.Vector3()};
 },[gl]);
 useEffect(()=>{gl.info.autoReset=false;return()=>{gl.info.autoReset=true;effect.target.dispose();effect.prefilter.dispose();effect.glow.dispose();effect.extract.dispose();effect.blur.dispose();effect.material.dispose();effect.geometry.dispose();};},[effect,gl]);
 useFrame(({scene,camera})=>{
  gl.info.reset();const t=run?run.state.routeTime:0,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ratio=gl.getPixelRatio(),w=Math.round(size.width*ratio),h=Math.round(size.height*ratio),gw=Math.max(1,Math.round(w/4)),gh=Math.max(1,Math.round(h/4));
  if(effect.target.width!==w||effect.target.height!==h){effect.target.setSize(w,h);effect.glow.setSize(gw,gh);effect.prefilter.setSize(gw,gh);effect.blur.uniforms.stepUv.value.set(1/gw,0);effect.extract.uniforms.pixel.value.set(1/w,1/h);effect.material.uniforms.glowStep.value.set(0,1/gh);}
  effect.material.uniforms.strength.value=run&&!reduced&&t>TIMING.exit&&t<TIMING.cloud&&!run.paused?.028*Math.min(1.3,Math.abs(run.state.verticalSpeed)/32)*Math.min(1,(t-TIMING.exit)/2):0;
  const outside=exteriorBlend(t),dazzle=run?doorDazzle(t):0,sky=atmosphere(t,reduced);
  effect.material.uniforms.outside.value=outside;
  effect.extract.uniforms.threshold.value=effect.hdr?THREE.MathUtils.lerp(1.3,.95,outside):.78;
  effect.material.uniforms.bloom.value=THREE.MathUtils.lerp(.28,ratio<1?.56:.72,outside)*(1-sky.immersion*.45)+dazzle*.28+sky.bloom;
  effect.material.uniforms.exposure.value=sky.exposure-dazzle*(reduced?.06:.16);
  effect.material.uniforms.cloudVeil.value=sky.veil;
  effect.doorPoint.set(0,AIRCRAFT.floor+2.1,START_Z).project(camera);
  effect.material.uniforms.apertureUv.value.set(effect.doorPoint.x*.5+.5,effect.doorPoint.y*.5+.5);
  effect.material.uniforms.apertureGlare.value=effect.doorPoint.z<1&&Math.abs(effect.doorPoint.x)<1.3&&Math.abs(effect.doorPoint.y)<1.3?dazzle*(reduced?.3:1):0;
  effect.material.uniforms.aspect.value=size.width/size.height;
  effect.sunPoint.copy(camera.position).addScaledVector(SUN_DIRECTION,1000).project(camera);camera.getWorldDirection(effect.direction);
  const visible=effect.direction.dot(SUN_DIRECTION)>0&&Math.abs(effect.sunPoint.x)<1.3&&Math.abs(effect.sunPoint.y)<1.3;
  effect.material.uniforms.sunUv.value.set(effect.sunPoint.x*.5+.5,effect.sunPoint.y*.5+.5);
  effect.material.uniforms.flare.value=visible&&run&&t>1.15&&!run.state.outcome?THREE.MathUtils.smoothstep(t,1.15,1.8)*(1-sky.immersion):0;
  if(import.meta.env.DEV&&new URLSearchParams(location.search).get('qa')==='1')Object.assign(window,{__RUNWAY_FX_QA__:{immersion:sky.immersion,cloudExit:sky.exit,veil:sky.veil,hdr:effect.hdr,bloom:effect.material.uniforms.bloom.value,exposure:effect.material.uniforms.exposure.value,aperture:effect.material.uniforms.apertureGlare.value,flare:effect.material.uniforms.flare.value,sun:effect.material.uniforms.sunUv.value.toArray(),samples:effect.target.samples,dpr:ratio}});
  gl.setRenderTarget(effect.target);gl.render(scene,camera);
  effect.quad.material=effect.extract;gl.setRenderTarget(effect.prefilter);gl.render(effect.scene,effect.camera);
  effect.quad.material=effect.blur;gl.setRenderTarget(effect.glow);gl.render(effect.scene,effect.camera);
  effect.quad.material=effect.material;gl.setRenderTarget(null);gl.render(effect.scene,effect.camera);
 },1);
 return null;
}
