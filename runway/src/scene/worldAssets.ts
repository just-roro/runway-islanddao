import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Decorative assets in metres: +Z forward, Y up. Cars stand on y=0,
// boats float at y=0, balloon baskets and the pilot's soles begin at y=0.
// Every export is a single non-indexed, vertex-coloured geometry for instancing.
type Point = [number, number, number];
function paint(g:T.BufferGeometry, color:string) {
 const c=new T.Color(color), values=new Float32Array(g.attributes.position.count*3);
 for(let i=0;i<values.length;i+=3){values[i]=c.r;values[i+1]=c.g;values[i+2]=c.b;}
 g.setAttribute('color',new T.Float32BufferAttribute(values,3));return g;
}
function finish(parts:T.BufferGeometry[]) {
 const list=parts.map(g=>{const n=g.index?g.toNonIndexed():g;n.deleteAttribute('uv');return n;});
 const result=mergeGeometries(list)!;
 for(const g of new Set([...list,...parts]))g.dispose();
 result.computeBoundingBox();result.computeBoundingSphere();return result;
}
function face(points:Point[], color:string) {
 const p:number[]=[];
 for(let i=1;i<points.length-1;i++)p.push(...points[0],...points[i],...points[i+1]);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.computeVertexNormals();return paint(g,color);
}
function spar(a:Point,b:Point,width:number,color:string,sides=4) {
 const from=new T.Vector3(...a),to=new T.Vector3(...b),g=new T.CylinderGeometry(width,width,from.distanceTo(to),sides,1,true);
 g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),to.clone().sub(from).normalize()));
 g.translate((a[0]+b[0])*.5,(a[1]+b[1])*.5,(a[2]+b[2])*.5);return paint(g,color);
}

/** Compact hatchback, 1.76 m across the tyres × 3.4 m long × 1.3 m high. */
export function carGeometry() {
 const parts:T.BufferGeometry[]=[],blue='#47b7c9',white='#f7edcf',glass='#153d55';
 const rings:Point[][]=[[-1.7,.64,.49],[-1.35,.8,.73],[.73,.8,.68],[1.7,.61,.48]].map(([z,w,h])=>[[-w,.32,z],[w,.32,z],[w,h,z],[-w,h,z]]);
 for(let i=0;i<rings.length-1;i++)for(let j=0;j<4;j++)parts.push(face([rings[i][j],rings[i][(j+1)%4],rings[i+1][(j+1)%4],rings[i+1][j]],j===2?white:blue));
 parts.push(face([...rings[0]].reverse(),blue),face(rings.at(-1)!,blue));
 const a:Point=[-.65,.70,-1.13],b:Point=[.65,.70,-1.13],c:Point=[.65,.70,.72],d:Point=[-.65,.70,.72];
 const e:Point=[-.48,1.30,-.73],f:Point=[.48,1.30,-.73],g:Point=[.48,1.30,.18],h:Point=[-.48,1.30,.18];
 parts.push(face([a,e,f,b],glass),face([d,c,g,h],glass),face([b,f,g,c],glass),face([a,d,h,e],glass),face([e,h,g,f],white));
 // Window pillars bridge the roof to the body instead of a floating glass box.
 for(const side of[-1,1])parts.push(paint(new T.BoxGeometry(.035,.60,.09).translate(side*.575,1,.0),blue));
 for(const x of[-.79,.79])for(const z of[-1.07,1.07]){
  const tyre=new T.CylinderGeometry(.32,.32,.18,6,1).rotateZ(Math.PI/2).translate(x,.16*Math.sqrt(3),z);
  paint(tyre,'#253447');const colors=tyre.getAttribute('color'),normal=tyre.getAttribute('normal'),steel=new T.Color('#7796a3');
  for(let i=0;i<colors.count;i++)if(Math.abs(normal.getX(i))>.9)colors.setXYZ(i,steel.r,steel.g,steel.b);
  parts.push(tyre);
 }
 for(const side of[-1,1]){
  const left=side*.415-.145,right=side*.415+.145;
  parts.push(face([[left,.36,1.706],[right,.36,1.706],[right,.48,1.706],[left,.48,1.706]],white));
  parts.push(paint(new T.BoxGeometry(.22,.10,.025).translate(side*.43,.49,-1.704),'#f68b65'));
 }
 parts.push(paint(new T.BoxGeometry(.56,.11,.025).translate(0,.37,1.71),glass));
 return finish(parts);
}

/** Five-metre open motorboat with a raised bow, cockpit, windscreen and outboard. */
export function boatGeometry() {
 const parts:T.BufferGeometry[]=[],rim:Point[]=[[-.78,.38,-2.25],[.78,.38,-2.25],[1.04,.42,-.55],[.76,.54,1.54],[0,.65,2.65],[-.76,.54,1.54],[-1.04,.42,-.55]],keel=rim.map(([x,,z])=>[x*.58,-.34,z*.90] as Point);
 for(let i=0;i<rim.length;i++){const j=(i+1)%rim.length;parts.push(face([keel[j],keel[i],rim[i],rim[j]],i%3===0?'#37b2bf':'#eae6cf'));}
 parts.push(face(keel,'#255274'),face([...rim].reverse(),'#dfb984'));
 parts.push(paint(new T.BoxGeometry(1.55,.30,.45).translate(0,.58,-1.55),'#fff0cc'));
 parts.push(paint(new T.BoxGeometry(.74,.65,.55).translate(0,.75,.3),'#f4f2dc'));
 parts.push(paint(new T.BoxGeometry(.79,.42,.045).rotateX(-.3).translate(0,1.24,.44),'#38a2bd'));
 parts.push(paint(new T.BoxGeometry(.64,.25,.55).translate(0,.65,-.47),'#c87f55'));
 parts.push(paint(new T.BoxGeometry(.46,.68,.48).rotateX(-.14).translate(0,.08,-2.43),'#253e53'));
 // A small fabric bimini makes the silhouette readable from the air.
 for(const x of[-.82,.82])for(const z of[-1.20,.65])parts.push(spar([x,.5,z],[x,1.95,z],.025,'#d9e0d8'));
 parts.push(paint(new T.BoxGeometry(1.88,.09,2.15).translate(0,2,-.25),'#f4ae66'));
 parts.push(paint(new T.BoxGeometry(.13,.02,2.17).translate(0,2.055,-.25),'#fff1d5'));
 return finish(parts);
}

/** 8 m envelope, warm alternating gores and a woven basket; origin at basket base. */
export function balloonGeometry() {
 const parts:T.BufferGeometry[]=[],profile=[[.64,3.1],[1.65,4.0],[3.3,5.6],[4,7.65],[3.65,9.65],[2.55,11.15],[1.1,11.9],[0,12.1]],colors=['#e8885a','#f5d797','#47b5c1','#f7e8ba'];
 for(let r=0;r<profile.length-1;r++)for(let side=0;side<8;side++){
  const a=side*Math.PI/4,b=(side+1)*Math.PI/4,[radius,y]=profile[r],[next,h]=profile[r+1];
  const points:Point[]=[[Math.cos(a)*radius,y,Math.sin(a)*radius],[Math.cos(b)*radius,y,Math.sin(b)*radius],[Math.cos(b)*next,h,Math.sin(b)*next],[Math.cos(a)*next,h,Math.sin(a)*next]];
  parts.push(face((next===0?[points[0],points[1],points[2]]:points).reverse(),colors[side%4]));
 }
 parts.push(paint(new T.BoxGeometry(1.4,1,1.4).translate(0,.5,0),'#a16f44'));
 for(const x of[-.58,.58])for(const z of[-.58,.58])parts.push(spar([x,.93,z],[x*.78,3.3,z*.78],.04,'#705143'));
 for(const z of[-.71,.71])parts.push(paint(new T.BoxGeometry(1.5,.13,.1).translate(0,.95,z),'#dab77f'));
 parts.push(paint(new T.ConeGeometry(.18,.45,4).rotateX(Math.PI).translate(0,2.7,0),'#ffc46e'));
 return finish(parts);
}

/** Ambient pilot: 1.8 m body below a 3.4 m ram-air canopy, facing +Z. */
export function skydiverGeometry() {
 const parts:T.BufferGeometry[]=[],cream='#f5e8c9',suit='#de9566',rubber='#263d55';
 const section=[[-.65,-.16],[-.60,.11],[.15,.24],[.65,.1],[.65,-.16]];
 const ring=(x:number):Point[]=>section.map(([z,y])=>[x,3.65-x*x*.13+y,z]);
 for(let i=0;i<6;i++){
  const a=ring(-1.7+i*3.4/6),b=ring(-1.7+(i+1)*3.4/6);
  for(let j=0;j<section.length;j++)parts.push(face([a[(j+1)%section.length],b[(j+1)%section.length],b[j],a[j]],i%3===0?cream:'#e28f69'));
 }
 parts.push(face([...ring(-1.7)].reverse(),cream),face(ring(1.7),cream));
 parts.push(paint(new T.IcosahedronGeometry(.25,0).translate(0,1.55,0),rubber));
 parts.push(paint(new T.PlaneGeometry(.26,.075).translate(0,1.58,.232),'#7debd4'));
 parts.push(paint(new T.CylinderGeometry(.25,.21,.49,4,1).rotateY(Math.PI/4).translate(0,1.10,0),suit));
 parts.push(paint(new T.BoxGeometry(.36,.42,.16).translate(0,1.09,-.22),'#a8b9bd'));
 parts.push(paint(new T.BoxGeometry(.40,.2,.27).translate(0,.77,0),rubber));
 for(const side of[-1,1]){
  parts.push(spar([side*.22,1.28,0],[side*.39,1.09,.05],.09,suit));
  parts.push(spar([side*.39,1.09,.05],[side*.48,1.46,.04],.075,cream));
  parts.push(spar([side*.12,.75,0],[side*.18,.42,.15],.105,suit));
  parts.push(spar([side*.18,.42,.15],[side*.19,.11,.04],.08,rubber));
  parts.push(paint(new T.BoxGeometry(.21,.15,.32).translate(side*.19,.075,.1),cream));
  for(const z of[-.48,.48])parts.push(spar([side*.48,1.47,.04],[side*1.48,3.65-1.48**2*.13-.12,z],.012,'#e6d5b0',3));
 }
 return finish(parts);
}

/** Faceted coastal granite with asymmetry and per-face mineral colour, 80 triangles. */
export function rockGeometry(detail=1) {
 const g=detail===0?new T.OctahedronGeometry(1,0):new T.IcosahedronGeometry(1,detail),p=g.getAttribute('position');
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),shape=1+.10*Math.sin(x*4.7+z*7.3+y*2.1);
  p.setXYZ(i,(x*1.08+.16*y)*shape,Math.max(0,(y+1)*.65),z*.86*shape);
 }
 g.computeVertexNormals();const c=new T.Color(),colors=new Float32Array(p.count*3);
 for(let i=0;i<p.count;i+=3){const tone=.48+.10*Math.sin(p.getX(i)*7+p.getZ(i)*3)+.08*p.getY(i);c.setRGB(tone*.92,tone,tone*1.04,T.SRGBColorSpace);for(let j=0;j<3;j++)colors.set([c.r,c.g,c.b],(i+j)*3);}
 g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.deleteAttribute('uv');g.computeBoundingBox();g.computeBoundingSphere();return g;
}
