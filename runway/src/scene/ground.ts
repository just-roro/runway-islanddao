import * as THREE from 'three';
import {COAST,terrainHeight,coastDistance,DESTINATIONS} from '../core/simulation';
export function terrain(){
 const outline=COAST.map(([x,z])=>new THREE.Vector2(x,z));
 // Cut the rendered land at the exact platform perimeter. The old coarse
 // triangles bridged across the flattened analytical pads and pierced the deck.
 // Collider, coast and authoritative terrain heights remain unchanged.
 const holes=DESTINATIONS.map(d=>Array.from({length:32},(_,i)=>new THREE.Vector2(d.x+Math.sin(i*Math.PI/16)*d.radius,d.z+Math.cos(i*Math.PI/16)*d.radius)));
 const triangles=THREE.ShapeUtils.triangulateShape(outline,holes),points=[...outline,...holes.flat()],p:number[]=[],c:number[]=[],normals:number[]=[],masks:number[]=[];
 const emit=(a:THREE.Vector2,b:THREE.Vector2,d:THREE.Vector2,depth=0)=>{if(depth<11&&Math.max(a.distanceTo(b),b.distanceTo(d),d.distanceTo(a))>9){const ab=a.distanceTo(b),bd=b.distanceTo(d),da=d.distanceTo(a);if(ab>=bd&&ab>=da){const m=a.clone().lerp(b,.5);emit(a,m,d,depth+1);emit(m,b,d,depth+1);}else if(bd>=da){const m=b.clone().lerp(d,.5);emit(a,b,m,depth+1);emit(a,m,d,depth+1);}else{const m=d.clone().lerp(a,.5);emit(a,b,m,depth+1);emit(m,b,d,depth+1);}return;}
  for(const v of[a,d,b]){const h=terrainHeight(v.x,v.y),shore=coastDistance(v.x,v.y),dx=(terrainHeight(v.x+.6,v.y)-terrainHeight(v.x-.6,v.y))/1.2,dz=(terrainHeight(v.x,v.y+.6)-terrainHeight(v.x,v.y-.6))/1.2,slope=Math.hypot(dx,dz);normals.push(...new THREE.Vector3(-dx,1,-dz).normalize().toArray());const color=new THREE.Color('#ffe3a1').lerp(new THREE.Color('#4ba76b'),THREE.MathUtils.smoothstep(shore,.5,6));color.lerp(new THREE.Color('#a4c96a'),(.5+.5*Math.sin(v.x*.035+v.y*.022))*.3*THREE.MathUtils.smoothstep(shore,4,10));color.lerp(new THREE.Color('#7d9388'),THREE.MathUtils.smoothstep(h,13,25)*THREE.MathUtils.smoothstep(slope,.15,.65)*.65);masks.push(shore,slope);p.push(v.x,Math.max(.04,h),v.y);c.push(color.r,color.g,color.b);}};

 for(const [a,b,c]of triangles)emit(points[a],points[b],points[c]);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.setAttribute('groundMask',new THREE.Float32BufferAttribute(masks,2));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));return g;
}
// Sample the rendered triangles, not the analytic height between their vertices.
// Decoration stays on the mesh without changing the authoritative landing surface.
export function surfaceSampler(g:THREE.BufferGeometry){
 const p=g.attributes.position,cells=new Map<string,number[]>(),cell=8;
 for(let i=0;i<p.count;i+=3){const xs=[p.getX(i),p.getX(i+1),p.getX(i+2)],zs=[p.getZ(i),p.getZ(i+1),p.getZ(i+2)];for(let x=Math.floor(Math.min(...xs)/cell);x<=Math.floor(Math.max(...xs)/cell);x++)for(let z=Math.floor(Math.min(...zs)/cell);z<=Math.floor(Math.max(...zs)/cell);z++){const key=`${x}:${z}`;if(!cells.has(key))cells.set(key,[]);cells.get(key)!.push(i);}}
 return (x:number,z:number)=>{for(const i of cells.get(`${Math.floor(x/cell)}:${Math.floor(z/cell)}`)??[]){const ax=p.getX(i),az=p.getZ(i),bx=p.getX(i+1),bz=p.getZ(i+1),cx=p.getX(i+2),cz=p.getZ(i+2),den=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz);if(Math.abs(den)<1e-9)continue;const a=((bz-cz)*(x-cx)+(cx-bx)*(z-cz))/den,b=((cz-az)*(x-cx)+(ax-cx)*(z-cz))/den,c=1-a-b;if(Math.min(a,b,c)>=-1e-5)return a*p.getY(i)+b*p.getY(i+1)+c*p.getY(i+2);}return terrainHeight(x,z);};
}
