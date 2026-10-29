import {useMemo} from 'react';
import * as THREE from 'three';
import {useCeoSnapshot,crownPlace} from '../services/recognition';
/** Closed, faceted crown. One mesh, 256 triangles, no extra lights or shadow pass. */
export function crownGeometry(){
 const points:number[]=[],quad=(a:number[],b:number[],c:number[],d:number[])=>points.push(...a,...b,...c,...a,...c,...d);
 // Inner lip meets the radius-.8 helmet at y=.69 above its center.
 const n=32,r=.54,inner=.41;
 const point=(i:number,radius:number,top:boolean)=>{const a=i/n*Math.PI*2;return [Math.sin(a)*radius,top?.13+(i%4===0?.19:0):0,Math.cos(a)*radius];};
 for(let i=0;i<n;i++){const j=(i+1)%n,a=point(i,r,false),b=point(j,r,false),c=point(j,r,true),d=point(i,r,true),e=point(i,inner,false),f=point(j,inner,false),g=point(j,inner,true),h=point(i,inner,true);quad(a,b,c,d);quad(f,e,h,g);quad(d,c,g,h);quad(e,f,b,a);}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geometry.computeVertexNormals();return geometry;
}
export function RecognitionCrown(){
 const snapshot=useCeoSnapshot(),rank=crownPlace(snapshot),geometry=useMemo(crownGeometry,[]);
 return <mesh name="ceo-recognition-crown" visible={rank!==null} position={[0,1.3,0]} geometry={geometry} userData={{rank,playerId:snapshot?.playerId??null}}>
  <meshStandardMaterial name="RUNWAY trim crown" color={rank===2?'#d9e6ef':rank===3?'#d99054':'#ffd45c'} metalness={.78} roughness={.24}/>
 </mesh>;
}
