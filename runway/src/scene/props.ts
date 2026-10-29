import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import{mergeGeometries}from'three/addons/utils/BufferGeometryUtils.js';
import {referenceGeometry,surface} from './itemArt';
import type {Kind} from '../core/simulation';
const paint=(g:T.BufferGeometry,color:string)=>surface(g,color);
export function propGeometry(kind:Kind){const reference=referenceGeometry(kind);if(reference)return reference;const parts:T.BufferGeometry[]=[];const box=(w:number,h:number,d:number,x:number,y:number,z:number,color:string)=>{parts.push(paint(new RoundedBoxGeometry(w,h,d,1,Math.min(w,h,d)*.16).translate(x,y,z),color));};
 if(kind==='sol'){
  // Faceted teal edge, inset gold face, bevel rim and three dark Solana parallelograms.
  parts.push(paint(new T.CylinderGeometry(1,1,.28,12).rotateX(Math.PI/2),'#123f4c'));
  for(const side of[-1,1]){
   parts.push(paint(new T.CylinderGeometry(.94,.94,.035,12).rotateX(Math.PI/2).translate(0,0,side*.153),'#ffcb16'));
   parts.push(paint(new T.TorusGeometry(.88,.075,3,12).translate(0,0,side*.18),'#ffe566'));
   for(let i=0;i<3;i++){
    const shape=new T.Shape(),y=.34-i*.34,skew=i===1?-.15:.15;
    shape.moveTo(-.52+skew,y+.1);shape.lineTo(.52+skew,y+.1);shape.lineTo(.52-skew,y-.1);shape.lineTo(-.52-skew,y-.1);shape.closePath();
    parts.push(paint(new T.ExtrudeGeometry(shape,{depth:.018,bevelEnabled:false}).translate(0,0,side>0?.18:-.198),'#103744'));
   }
  }
 }
 else if(kind==='star'){
  const star=new T.Shape(),hole=new T.Path();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?.62:1,x=Math.cos(a)*r,y=Math.sin(a)*r;if(i===0)star.moveTo(x,y);else star.lineTo(x,y);}star.closePath();
  for(let i=9;i>=0;i--){const a=Math.PI/2+i*Math.PI/5,r=i%2?.53:.9,x=Math.cos(a)*r,y=Math.sin(a)*r;if(i===9)hole.moveTo(x,y);else hole.lineTo(x,y);}hole.closePath();star.holes.push(hole);
  parts.push(paint(new T.ExtrudeGeometry(star,{depth:.09,bevelEnabled:true,bevelThickness:.015,bevelSize:.012,bevelSegments:1}).translate(0,0,-.045),'#fff16c'));
 }
 else if(kind==='gate'){
  parts.push(paint(new T.TorusGeometry(1,.075,6,32),'#fff4e3'));
  for(const x of[-.25,.25]){box(.1,.12,.1,x,1.12,0,'#143e4d');parts.push(paint(new T.SphereGeometry(.065,8,5).translate(x,1.22,0),'#ff3426'));}
 }
 else if(kind==='rare'){parts.push(paint(new T.OctahedronGeometry(1.05),'#ffe2ac'));parts.push(paint(new T.TorusGeometry(1.2,.07,5,16).rotateX(.5),'#a997ff'));}
 else parts.push(paint(new T.TorusGeometry(1,.055,6,24),kind==='risk'?'#ff9a60':'#ffcf57'));
 if(kind==='sol')for(const g of parts){const s=g.attributes.surface;for(let i=0;i<s.count;i++)s.setXYZW(i,.3,.45,0,0);}
 const normalized=parts.map(g=>g.index?g.toNonIndexed():g);const geometry=mergeGeometries(normalized);normalized.forEach(p=>p.dispose());parts.forEach(p=>p.dispose());if(!geometry)throw Error('Incompatible prop geometry: '+kind);if(kind!=='gate'&&kind!=='risk'&&kind!=='star'){geometry.center();geometry.computeBoundingSphere();const radius=geometry.boundingSphere!.radius;geometry.scale(1/radius,1/radius,1/radius);}return geometry;
}
