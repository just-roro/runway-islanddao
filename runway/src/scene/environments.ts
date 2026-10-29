import * as T from 'three';
import {SUN_DIRECTION} from './lighting';
// Small static radiance maps. PMREM is prepared once by Three, never captured per frame.
function radiance(interior:boolean){const w=512,h=256,data=new Uint16Array(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){
 const u=(x+.5)/w,v=(y+.5)/h,latitude=(v-.5)*Math.PI,up=Math.sin(latitude),azimuth=(u-.5)*Math.PI*2;
 const direction=new T.Vector3(Math.cos(latitude)*Math.cos(azimuth),up,Math.cos(latitude)*Math.sin(azimuth));
 const horizon=Math.exp(-Math.abs(up)*7);
 let r=.055+Math.max(up,0)*.19+horizon*.4,g=.09+Math.max(up,0)*.42+horizon*.3,b=.19+Math.max(up,0)*.95+horizon*.28;
 if(interior){
  // Soft radiance sources, not binary UV rectangles. Angular distance gives round
  // highlights even near the poles; linear filtering avoids magnified texel squares.
  r=.045;g=.06;b=.08;
  for(const a of [.12,.38,.62,.88]){const lon=(a-.5)*Math.PI*2,lat=.12*Math.PI;
   const dot=direction.x*Math.cos(lat)*Math.cos(lon)+direction.y*Math.sin(lat)+direction.z*Math.cos(lat)*Math.sin(lon);
   const lamp=Math.exp((dot-1)*240)*5;r+=lamp;g+=lamp*.87;b+=lamp*.64;
  }
  const door=Math.exp(-((Math.min(Math.abs(u-.25),1-Math.abs(u-.25))/.11)**2+((v-.5)/.19)**2));
  r+=door*.65;g+=door*1.05;b+=door*1.6;
 }else{
  const sun=Math.exp((direction.dot(SUN_DIRECTION)-1)*1050)*18;
  r+=sun;g+=sun*.8;b+=sun*.52;
  const cloud=Math.max(0,Math.sin(u*39)+Math.cos(u*17))*Math.exp(-(((v-.61)/.08)**2));
  r+=cloud*.8;g+=cloud*.8;b+=cloud*.82;
 }
 const i=(y*w+x)*4;data[i]=T.DataUtils.toHalfFloat(r);data[i+1]=T.DataUtils.toHalfFloat(g);data[i+2]=T.DataUtils.toHalfFloat(b);data[i+3]=T.DataUtils.toHalfFloat(1);
 }const texture=new T.DataTexture(data,w,h,T.RGBAFormat,T.HalfFloatType);texture.mapping=T.EquirectangularReflectionMapping;texture.minFilter=texture.magFilter=T.LinearFilter;texture.needsUpdate=true;return texture;}
export const CABIN_ENV=radiance(true),SKY_ENV=radiance(false);

// Shared by diffuse/specular IBL: one continuous transition, fixed world orientation.
export const doorOpening=(route:number)=>T.MathUtils.smoothstep(route,.1,1.15);
// Aperture-driven ingress; adaptation settles before established freefall.
export const doorDazzle=(route:number)=>doorOpening(route)*(1-T.MathUtils.smoothstep(route,.8,3.2));
export function exteriorBlend(route:number){return T.MathUtils.smootherstep(route,2.2,4.8);}
const hooks=new WeakMap<T.Material,{compile:T.Material['onBeforeCompile'];key:string;owner:object}>();
export function reflectionRig(renderer:T.WebGLRenderer){
 const generator=new T.PMREMGenerator(renderer),cabin=generator.fromEquirectangular(CABIN_ENV),sky=generator.fromEquirectangular(SKY_ENV);generator.dispose();
 const uniforms={runwaySky:{value:sky.texture},runwayExterior:{value:0}},owner={};
 const chunk=T.ShaderChunk.envmap_physical_pars_fragment.replace(/textureCubeUV\( envMap, ([^;]+) \)/g,'runwayRadiance( $1 )');
 const blend=`
 #ifdef ENVMAP_TYPE_CUBE_UV
 uniform sampler2D runwaySky;uniform float runwayExterior;
 vec4 runwayRadiance(vec3 direction,float roughness){
  // Uniform branches avoid a second lookup outside the brief doorway transition.
  if(runwayExterior<=0.)return textureCubeUV(envMap,direction,roughness)*.55;
  if(runwayExterior>=1.)return textureCubeUV(runwaySky,direction,roughness);
  return mix(textureCubeUV(envMap,direction,roughness)*.55,textureCubeUV(runwaySky,direction,roughness),runwayExterior);
 }
 #endif
 `;
 return {cabin:cabin.texture,sky:sky.texture,uniforms,apply(root:T.Object3D){root.traverse(object=>{
  if(!(object instanceof T.Mesh))return;
  for(const material of Array.isArray(object.material)?object.material:[object.material]){
   if(!(material instanceof T.MeshStandardMaterial)||!(/Woven flight suit|Rubber and harness|Satin hardware|^runway-(aircraft|hatch)|^RUNWAY (LED|trim)/.test(material.name)))continue;
   const saved=hooks.get(material);if(saved?.owner===owner)continue;
   const compile=saved?.compile??material.onBeforeCompile,key=saved?.key??material.customProgramCacheKey();
   hooks.set(material,{compile,key,owner});material.envMap=cabin.texture;
   material.onBeforeCompile=(shader,gl)=>{compile.call(material,shader,gl);Object.assign(shader.uniforms,uniforms);shader.fragmentShader=shader.fragmentShader.replace('#include <envmap_physical_pars_fragment>',blend+chunk);};
   material.customProgramCacheKey=()=>key+'-radiance-blend32';material.needsUpdate=true;
  }
 });},dispose(){cabin.dispose();sky.dispose();}};
}
