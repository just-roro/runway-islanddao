import {useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as T from 'three';
import type {Runtime} from '../services/runtime';
import type {Presentation} from '../services/presentation';
import {profile} from '../services/session';
import {shopItem} from '../shopCatalog';
import {TRAIL_CAPACITY,trailRate} from './particleMotion';

/** One instanced draw and a fixed pool, independent of simulation and reward state. */
export function PilotTrail({run,presentation,preview,color,itemId}:{run?:Runtime|null;presentation:Presentation;preview?:boolean;color?:string;itemId?:string}){
 const item=shopItem(itemId??profile.shop!.trail)!,mode=Math.max(0,['glare','stars','bubbles','smoke','comet'].indexOf(item.pattern??'glare')),capacity=mode===3?96:TRAIL_CAPACITY;
 const mesh=useRef<T.InstancedMesh>(null),memory=useRef({id:'',style:'',cursor:0,serial:0,carry:0,ready:false,previous:new T.Vector3()}),dummy=useMemo(()=>new T.Object3D(),[]),parentRotation=useMemo(()=>new T.Quaternion(),[]);
 const pool=useMemo(()=>new Float32Array(TRAIL_CAPACITY*8),[]),fade=useMemo(()=>new T.InstancedBufferAttribute(new Float32Array(TRAIL_CAPACITY),1),[]);
 const reduced=useMemo(()=>matchMedia('(prefers-reduced-motion: reduce)').matches,[]);
 const uniforms=useMemo(()=>({tint:{value:new T.Color()},accent:{value:new T.Color()},shapeMode:{value:0}}),[]);
 uniforms.tint.value.set(color??item.color??'#e3f9ff').multiplyScalar(mode===3?1:1.65);uniforms.accent.value.set(item.secondary??item.color??'#ffffff');uniforms.shapeMode.value=mode;
 useFrame(({camera})=>{if(!mesh.current)return;
 // Update the live material, whose uniforms R3F may have copied when attaching it.
 const live=(mesh.current.material as T.ShaderMaterial).uniforms;
 live.shapeMode.value=mode;live.tint.value.set(color??item.color??'#e3f9ff').multiplyScalar(mode===3?1:1.65);live.accent.value.set(item.secondary??item.color??'#ffffff');
 const dt=presentation.dt,s=run?.state,t=presentation.time,m=memory.current;let n=0;
 if(m.id!==(run?.id??'')||m.style!==item.id){pool.fill(0);m.id=run?.id??'';m.style=item.id;m.cursor=m.serial=m.carry=0;m.ready=false;mesh.current.count=0;}
 if(!dt)return;
 if(s&&!s.outcome&&s.routeTime>4){const [x,y,z]=presentation.position;if(!m.ready){m.previous.set(x,y,z);m.ready=true;}
  m.carry+=Math.min(mode===3?58:mode===2?90:156,trailRate(s.verticalSpeed))*(reduced?.5:1)*dt;const count=Math.floor(m.carry);m.carry-=count;
  for(let j=0;j<count;j++){const k=(m.cursor++%capacity)*8,serial=m.serial++,side=serial%2?1:-1,u=(j+1)/count,seed=(serial*.61803398875)%1;
   pool[k]=T.MathUtils.lerp(m.previous.x,x,u)+side*(.4+seed*.12);pool[k+1]=T.MathUtils.lerp(m.previous.y,y,u)+.15;pool[k+2]=T.MathUtils.lerp(m.previous.z,z,u);pool[k+3]=0;pool[k+4]=(mode===3?1.1:mode===2?.9:.55)+seed*.4;pool[k+5]=side*(.2+seed*.55);pool[k+6]=seed;pool[k+7]=(mode===3?.12:mode===2?.07:.05)+seed*(mode===3?.13:.09);
  }m.previous.set(x,y,z);
 }else m.ready=false;
 for(let i=0;i<capacity;i++){const k=i*8;if(pool[k+4]<=0)continue;pool[k+3]+=dt;const u=pool[k+3]/pool[k+4];if(u>=1){pool[k+4]=0;continue;}
  pool[k]+=pool[k+5]*dt*(mode===3?.45:1);pool[k+1]+=dt*(1+pool[k+6]*2);if(!reduced&&mode===2)pool[k+2]+=Math.sin(u*6+pool[k+6]*8)*dt*.3;
  dummy.position.set(pool[k],pool[k+1],pool[k+2]);dummy.quaternion.copy(camera.quaternion);dummy.rotateZ(pool[k+6]*6+(reduced?0:t*(pool[k+6]-.5)));
  const size=pool[k+7]*(mode===3?.8+u*2.6:.8+Math.sin(u*Math.PI)*.5);dummy.scale.set(size,size*(mode===4?3:mode===2||mode===1||mode===3?1:1+pool[k+6]),1);dummy.updateMatrix();mesh.current.setMatrixAt(n,dummy.matrix);fade.setX(n++,(1-u)**1.4*Math.min(1,u*12));
 }
 if(preview&&!s){mesh.current.parent?.getWorldQuaternion(parentRotation);parentRotation.invert().multiply(camera.quaternion);const count=Math.min(capacity,128);for(let i=0;i<count;i++){const u=(i/count+t*(reduced?.22:.65))%1,side=i%2?1:-1;dummy.position.set(side*(.4+u*.28)+Math.sin(i*2.4+u*5)*u*.1,-.65+u*2,-u*1.6);dummy.quaternion.copy(parentRotation);dummy.rotateZ((reduced?0:t)+i);const size=(mode===3?.12+u*.18:.05)+(i%4)*.015;dummy.scale.set(size,size*(mode===4?3:1),1);dummy.updateMatrix();mesh.current.setMatrixAt(n,dummy.matrix);fade.setX(n++,(1-u)**1.4);}}
 mesh.current.count=n;mesh.current.instanceMatrix.needsUpdate=true;fade.needsUpdate=true;
 });
 return <instancedMesh name="pilot-cosmetic-trail" ref={mesh} args={[undefined,undefined,TRAIL_CAPACITY]} frustumCulled={false}><planeGeometry args={[2,2]}><primitive attach="attributes-particleAlpha" object={fade}/></planeGeometry><shaderMaterial transparent depthWrite={false} blending={mode===3?T.NormalBlending:T.AdditiveBlending} toneMapped={false} uniforms={uniforms} vertexShader="attribute float particleAlpha;varying float alpha;varying vec2 p;void main(){alpha=particleAlpha;p=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}" fragmentShader={`uniform vec3 tint;uniform vec3 accent;uniform float shapeMode;varying float alpha;varying vec2 p;
 void main(){float r=length(p),aa=max(fwidth(r),.015);float core=exp(-r*r*15.);float rays=pow(max(0.,1.-abs(p.x)),28.)*pow(max(0.,1.-abs(p.y)),2.)+pow(max(0.,1.-abs(p.y)),28.)*pow(max(0.,1.-abs(p.x)),2.);float shape=(core*.6+rays*.5)*(1.-smoothstep(.65,1.,r));vec3 c=tint;
 if(shapeMode>.5&&shapeMode<1.5){float a=atan(p.y,p.x),edge=.42+.24*cos(a*5.);shape=1.-smoothstep(edge-aa,edge+aa,r);c=mix(tint,accent,core*.5);}
 if(shapeMode>1.5&&shapeMode<2.5){shape=(1.-smoothstep(.035,.11,abs(r-.72)))*.65+core*.08;shape+=exp(-dot(p-vec2(-.25,.4),p-vec2(-.25,.4))*110.)*.8;c=mix(tint,accent,.55);}
 if(shapeMode>2.5&&shapeMode<3.5){float lobes=1.+.12*sin(atan(p.y,p.x)*5.);shape=pow(max(0.,1.-r*lobes),2.)*.32;c=mix(tint,accent,.3+core*.4);}
 if(shapeMode>3.5){shape=exp(-p.x*p.x*60.)*pow(max(0.,1.-abs(p.y)),1.2)+core*.4;c=mix(tint,accent,smoothstep(-.5,.5,p.y));}
 gl_FragColor=vec4(c,shape*alpha*(1.-smoothstep(.9,1.,r)));}`}/></instancedMesh>;
}
