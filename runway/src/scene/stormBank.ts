import {BufferGeometry,Float32BufferAttribute,Color,Vector3} from 'three';

// A single closed, lofted bank rather than intersecting spheres. The two profiles
// have irregular shoulders, scalloped crests and a flattened, shaded rain shelf.
// 90 shared vertices / 176 triangles; built once and instanced, no transparency.
export function stormBank(variant=0){
 const slices=11,sides=8,positions:number[]=[],colors:number[]=[],indices:number[]=[];
 const shadow=new Color('#627086'),light=new Color('#fff5e7'),color=new Color();
 const bulge=(x:number,center:number,width:number)=>Math.exp(-(((x-center)/width)**2));
 const add=(x:number,y:number,z:number,shade:number)=>{positions.push(x,y,z);color.copy(shadow).lerp(light,shade);colors.push(color.r,color.g,color.b);};
 for(let i=0;i<slices;i++){
  const x=-.94+i/(slices-1)*1.88,envelope=Math.sqrt(1-x*x);
  const crest=.68+.20*bulge(x,-.45+variant*.16,.48)+.17*bulge(x,.27+variant*.18,.42);
  const depth=(.70+.12*Math.sin(x*6+variant*1.6))*envelope;
  const center=.06*Math.sin(x*3.9+variant),bend=.18*Math.sin(x*3.1+variant*.8);
  for(let j=0;j<sides;j++){
   const a=j/sides*Math.PI*2,s=Math.sin(a),c=Math.cos(a);
   // The bottom stays broad while the upper crest has real valleys between peaks.
   const y=center+(s>0?s*crest*envelope:s*.38*envelope);
   const z=bend+c*depth*(1+.12*Math.sin(x*8+j*1.4+variant));
   const shade=Math.max(.08,Math.min(1,.36+.46*Math.max(s,0)+.13*c-.08*bulge(x,.02,.22)));
   add(x,y,z,shade);
  }
 }
 const first=positions.length/3;add(-1.12,-.02,-.05,.43);const last=positions.length/3;add(1.12,.02,variant?.02:.12,.51);
 for(let i=0;i<slices-1;i++)for(let j=0;j<sides;j++){
  const a=i*sides+j,b=i*sides+(j+1)%sides,c=a+sides,d=b+sides;
  indices.push(a,c,b,b,c,d);
 }
 for(let j=0;j<sides;j++){indices.push(first,j,(j+1)%sides);const a=(slices-1)*sides+j,b=(slices-1)*sides+(j+1)%sides;indices.push(last,b,a);}
 // Keep the unit-radius culling and lane-clearance contract of cloudField.
 let radius=0;const point=new Vector3();for(let i=0;i<positions.length;i+=3)radius=Math.max(radius,point.fromArray(positions,i).length());
 for(let i=0;i<positions.length;i++)positions[i]/=radius;
 const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(positions,3));geometry.setAttribute('color',new Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingSphere();
 return geometry;
}
