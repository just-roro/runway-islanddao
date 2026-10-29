import * as T from 'three';
import {ROADS} from './roads';
export const ROAD_MAP={x:-85,z:-155,width:145,depth:335};
// Bake distance to asphalt once. Painting the actual terrain avoids a coplanar
// road mesh, floating ribbons and a second terrain draw on mobile.
export function roadTexture(){
 const w=580,h=1340,data=new Uint8Array(w*h*4);for(let i=0;i<w*h;i++){data[i*4]=255;data[i*4+3]=255;}
 for(const road of ROADS)for(let j=1;j<road.length;j++){
  const a=road[j-1],b=road[j],dx=b.x-a.x,dz=b.z-a.z;
  const x0=Math.max(0,Math.floor((Math.min(a.x,b.x)-4-ROAD_MAP.x)/ROAD_MAP.width*w)),x1=Math.min(w-1,Math.ceil((Math.max(a.x,b.x)+4-ROAD_MAP.x)/ROAD_MAP.width*w));
  const z0=Math.max(0,Math.floor((Math.min(a.z,b.z)-4-ROAD_MAP.z)/ROAD_MAP.depth*h)),z1=Math.min(h-1,Math.ceil((Math.max(a.z,b.z)+4-ROAD_MAP.z)/ROAD_MAP.depth*h));
  for(let z=z0;z<=z1;z++)for(let x=x0;x<=x1;x++){
   const wx=ROAD_MAP.x+(x+.5)/w*ROAD_MAP.width,wz=ROAD_MAP.z+(z+.5)/h*ROAD_MAP.depth,u=T.MathUtils.clamp(((wx-a.x)*dx+(wz-a.z)*dz)/(dx*dx+dz*dz),0,1),d=Math.hypot(wx-a.x-u*dx,wz-a.z-u*dz),i=(z*w+x)*4,code=Math.round(Math.min(1,d/4)*255);
   if(code<data[i]){data[i]=code;data[i+1]=(a.distance+u*(b.distance-a.distance))%4<1.8?255:0;}
  }
 }
 const texture=new T.DataTexture(data,w,h);texture.magFilter=T.LinearFilter;texture.minFilter=T.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;return texture;
}
