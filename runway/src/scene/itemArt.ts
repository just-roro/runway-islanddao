import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import type {Kind} from '../core/simulation';
export const referenceItems:Kind[]=['gas','delivery','water','magnet','term','hacked','rug','community'];
// Shared surface channels: roughness, metalness, emission, label coverage. One draw per family.
export function surface(g:T.BufferGeometry,c:string,rough=.6,metal=0,emit=0,label=0){const color=new T.Color(c),n=g.attributes.position.count,colors=new Float32Array(n*3),s=new Float32Array(n*4);for(let i=0;i<n;i++){color.toArray(colors,i*3);s.set([rough,metal,emit,label],i*4);}g.setAttribute('color',new T.BufferAttribute(colors,3));g.setAttribute('surface',new T.BufferAttribute(s,4));return g;}
const ink='#142535',cream='#fff0da',red='#f13339',gold='#ffc654',purple='#6235c8',cyan='#25dfff';
export function referenceGeometry(kind:Kind):T.BufferGeometry|null{
 if(!referenceItems.includes(kind))return null;
 const parts:T.BufferGeometry[]=[];
 const add=(g:T.BufferGeometry,c:string,r=.6,m=0,e=0)=>{parts.push(surface(g,c,r,m,e));return g;};
 const box=(w:number,h:number,d:number,x:number,y:number,z:number,c:string,bevel=false,r=.5,m=.1,e=0)=>add((bevel?new RoundedBoxGeometry(w,h,d,1,Math.min(w,h,d)*.12):new T.BoxGeometry(w,h,d)).translate(x,y,z),c,r,m,e);
 const disc=(r:number,d:number,x:number,y:number,z:number,c:string,m=.5)=>add(new T.CylinderGeometry(r,r,d,12).rotateX(Math.PI/2).translate(x,y,z),c,.3,m);
 const tube=(points:number[][],r:number,c:string,emission=0)=>add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),10,r,5,false),c,.5,.1,emission);
 const shape=(points:number[][],depth:number,z:number,c:string,m=0)=>{const s=new T.Shape(points.map(p=>new T.Vector2(...p)));return add(new T.ExtrudeGeometry(s,{depth,bevelEnabled:false}).translate(0,0,z),c,.4,m);};
 const label=(index:number,w:number,h:number,x:number,y:number,z:number)=>{const g=new T.PlaneGeometry(w,h).translate(x,y,z),uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,(uv.getX(i)+index%4)/4,(uv.getY(i)+1-Math.floor(index/4))/2);parts.push(surface(g,'#ffffff',.65,0,[0,2,3,5].includes(index)?.8:0,1));};
 if(kind==='gas'){
  box(1.1,1.7,.6,0,-.1,0,red,true);box(.75,1.55,.06,-.1,-.06,.33,cream,true);
  box(1.35,.22,.83,0,-1.02,0,ink,true,.36,.45);box(1.55,.48,.7,0,1,0,red,true);
  box(1.32,.33,.04,0,1,.38,ink);label(0,1.25,.29,0,1,.405);
  box(.67,.78,.07,-.08,.23,.39,ink,true);shape([[-.08,.52],[-.29,.19],[-.08,.06],[.13,.19]],.03,.44,'#b7ffef',.35);shape([[-.29,.13],[-.08,-.07],[.13,.13],[-.08,0]],.03,.44,cyan,.35);
  box(.28,.13,.06,-.28,-.39,.39,gold);box(.24,.16,.06,.12,-.4,.39,ink);
  tube([[.5,.56,0],[.87,.45,0],[1.02,-.65,0],[.74,-.95,.1],[.7,-.1,.2]],.065,ink);
  box(.25,.38,.21,.78,.02,.16,red,true);box(.12,.27,.12,.78,-.24,.16,ink);box(.22,.09,.13,.66,.23,.16,'#a7bcc5');
  for(const y of[-.65,.1])box(.07,.28,.32,-.57,y,0,'#ff7756',false,.35,.1,1.1);
  for(let i=0;i<4;i++)box(.58,.035,.02,0,-.4-i*.1,-.32,ink);
 }else if(kind==='delivery'){
  box(1.8,1.75,.39,0,0,0,'#a7603c',true,.87);box(1.88,1.81,.12,0,0,.22,cream,true,.85);
  label(1,1.65,1.59,0,0,.286);
  for(const side of[-1,1])for(let i=0;i<6;i++){box(.025,.25,.18,side*.91,-.71+i*.29,.02,i%2?cream:red);box(.28,.025,.18,-.73+i*.29,side*.88,.02,i%2?red:cream);}
  for(const x of[-.68,.68])for(const y of[-.72,.72])box(.14,.2,.018,x,y,.29,'#a0a3a0');
  box(.45,.2,.16,0,-.87,.2,red,true);box(.3,.045,.025,0,-.86,.29,'#50ff9d',false,.3,.2,1.8);
 }else if(kind==='water'){
  add(new T.CylinderGeometry(.48,.45,1.35,10),'#168fd4',.22,.32);add(new T.CylinderGeometry(.43,.44,.95,10).translate(0,-.12,.015),'#20ccf1',.18,.24);
  for(const y of[-.7,.66])add(new T.CylinderGeometry(.51,.51,.18,10).translate(0,y,0),ink,.45,.25);
  add(new T.CylinderGeometry(.38,.5,.28,10).translate(0,.88,0),cream,.35,.25);
  box(.25,.2,.25,0,1.08,0,ink);tube([[-.3,1.13,0],[-.3,1.43,0],[.3,1.43,0],[.3,1.13,0]],.075,ink);tube([[-.25,1.16,.02],[-.25,1.36,.02],[.25,1.36,.02]],.025,cyan,1);
  box(.42,.57,.1,0,.23,.47,ink,true);label(2,.34,.46,0,.24,.526);
  for(const x of[-.34,.34])box(.045,.91,.025,x,-.08,.34,'#94f8ff',false,.18,.2,.15);
  for(let i=0;i<5;i++){disc(.025+(i%2)*.015,.015,-.2+Math.sin(i*3)*.08,-.44+i*.13,.446,'#73f1ff',.1);box(.08,.025,.025,.26,-.4+i*.17,.405,'#a6ffff');}
 }else if(kind==='magnet'){
  const points:number[][]=[];for(let i=0;i<=12;i++){const a=i/12*Math.PI;points.push([Math.cos(a)*.8,.15+Math.sin(a)*.8]);}points.push([-.8,-.65],[-.42,-.65],[-.42,.15]);for(let i=12;i>=0;i--){const a=i/12*Math.PI;points.push([Math.cos(a)*.42,.15+Math.sin(a)*.42]);}points.push([.42,-.65],[.8,-.65]);shape(points,.42,-.21,red,.2);
  for(const side of[-1,1]){box(.4,.32,.46,side*.61,-.64,0,cream,true,.32,.45);box(.28,.055,.32,side*.61,-.82,0,cyan,false,.25,.3,1.1);box(.43,.2,.47,side*.62,.54,0,ink,true);box(.23,.06,.025,side*.62,.54,.25,cyan,false,.3,.2,1);}
  box(.53,.48,.14,0,.83,.28,ink,true);label(3,.39,.36,0,.83,.36);
 }else if(kind==='term'){
  box(1.5,1.95,.18,0,0,0,purple,true,.33,.35);box(1.32,1.8,.05,0,0,.12,ink);
  for(let i=0;i<3;i++)box(1.25,1.67,.025,-.018*i,-.015*i,.17+i*.035,i===2?cream:'#cfc3b4');label(4,1.2,1.59,-.036,-.03,.257);
  box(.27,.42,.12,-.42,.81,.29,'#8c9ba9',true,.25,.7);box(.095,.29,.025,-.42,.81,.36,cyan,false,.3,.3,1.4);
  disc(.21,.035,.38,-.58,.28,gold);disc(.15,.035,.38,-.58,.302,'#e8a12c');shape([[.38,-.44],[.3,-.64],[.44,-.56]],.015,.33,'#fff19b',.5);
  for(const side of[-1,1])box(.08,.47,.07,side*.75,-.04,.05,cyan,false,.25,.3,.8);
 }else if(kind==='hacked'){
  box(1.85,1.45,.5,0,.1,0,ink,true,.38,.4);box(1.6,1.19,.05,0,.1,.28,'#050d1c',true);label(5,1.45,1.03,0,.1,.313);
  for(const side of[-1,1]){box(.25,1.04,.56,side*.95,.1,-.02,'#253448',true,.45,.45);box(.06,.35,.04,side*.96,.29,.28,red,false,.3,.3,1.5);box(.09,.21,.04,side*.96,-.16,.28,cyan,false,.3,.3,.6);tube([[side*.58,-.59,0],[side*.61,-.95,0],[side*.25,-1.03,.04],[side*.19,-.62,0]],.055,ink);box(.07,.18,.06,side*.29,-.88,.07,red,false,.3,.1,1);box(.12,.31,.13,side*.62,.93,0,ink,true);}
  box(.32,.08,.12,.4,.91,.03,red,false,.3,.1,1.6);
  for(let i=0;i<5;i++)box(1.25,.04,.035,0,-.27+i*.16,-.27,'#070e16');
 }else if(kind==='rug'){
  const g=new T.PlaneGeometry(1.65,1.85,6,10),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);p.setZ(i,.18*Math.sin(y*3.5)+.06*x*x);}g.computeVertexNormals();add(g,'#d21752',.88);const back=g.clone().translate(0,0,-.025),ix=back.index!;for(let i=0;i<ix.count;i+=3){const b=ix.getX(i+1);ix.setX(i+1,ix.getX(i+2));ix.setX(i+2,b);}back.computeVertexNormals();add(back,'#8d193e',.92);
  for(const side of[-1,1]){const pts=Array.from({length:11},(_,i)=>{const y=-.925+i*.185;return[side*.78,y,.18*Math.sin(y*3.5)+.04];});tube(pts,.027,gold);for(let i=0;i<12;i++){const x=-.75+i*.136,y=side*.96,z=.18*Math.sin(side*.925*3.5);box(.065,.17,.035,x,y,z,gold);}for(const x of[-.8,.8]){disc(.105,.14,x,side*.82,.18*Math.sin(side*.82*3.5)+.08,gold);add(new T.CylinderGeometry(.13,.035,.3,5).rotateZ(side>0?0:Math.PI).translate(x,side*1.12,.18*Math.sin(side*.82*3.5)),gold,.7);}}
  // Embossed angular trickster face follows the central cloth; no box masquerading as fabric.
  shape([[-.52,.26],[-.1,.08],[-.28,-.02]],.018,.18,'#ffe39c');shape([[.52,.26],[.1,.08],[.28,-.02]],.018,.18,'#ffe39c');tube([[-.36,-.2,.04],[0,-.43,-.12],[.36,-.2,.04]],.035,gold);
 }else if(kind==='community'){
  disc(.96,.23,0,0,0,purple);disc(.78,.06,0,0,.14,gold);disc(.66,.03,0,0,.183,'#bb7b26');
  add(new T.TorusGeometry(.81,.055,4,20).translate(0,0,.2),'#ffe28b',.25,.65);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;const piece=box(.25,.12,.11,0,0,0,i%2?purple:gold,false,.3,.5);piece.rotateZ(a).translate(Math.sin(a)*.87,Math.cos(a)*.87,.14);if(i%2===0){const led=box(.16,.04,.025,0,0,0,cyan,false,.25,.2,1.4);led.rotateZ(a).translate(Math.sin(a)*.87,Math.cos(a)*.87,.21);}}
  add(new T.TorusGeometry(.28,.035,4,16).scale(1,.42,1).translate(0,-.4,.22),gold,.3,.5);shape([[-.055,-.37],[.065,-.37],[.02,.24]],.035,.22,gold,.5);
  for(const side of[-1,1])for(const [reach,height,droop]of [[.46,.14,.18],[.33,.37,.09],[.16,.47,.04]]){const leaf=new T.Shape();leaf.moveTo(0,.23);leaf.quadraticCurveTo(side*reach*.7,.23+height,side*reach,.23+height-droop-.15);leaf.quadraticCurveTo(side*reach*.45,.23+height*.4,0,.23);add(new T.ExtrudeGeometry(leaf,{depth:.03,bevelEnabled:false,curveSegments:4}).translate(0,0,.23),'#ffdc7d',.35,.5);}

  disc(.58,.025,0,0,-.14,purple);
 }
 const normalized=parts.map(g=>g.index?g.toNonIndexed():g),merged=mergeGeometries(normalized)!;normalized.forEach(g=>g.dispose());parts.forEach(g=>g.dispose());merged.center();merged.computeBoundingSphere();merged.scale(1/merged.boundingSphere!.radius,1/merged.boundingSphere!.radius,1/merged.boundingSphere!.radius);merged.computeBoundingSphere();return merged;
}
let atlas:T.CanvasTexture|undefined;
export function itemAtlas(){if(atlas)return atlas;const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;const c=canvas.getContext('2d')!;
 for(let i=0;i<8;i++){c.save();c.translate(i%4*256,Math.floor(i/4)*256);c.fillStyle=i===1||i===4?'#fff0da':i===0?'#b41425':'#0b1a2c';c.fillRect(0,0,256,256);c.textAlign='center';c.textBaseline='middle';c.font='900 39px sans-serif';c.fillStyle=i===0?'#fff3ae':'#31e8ff';
 if(i===0){c.translate(0,128);c.scale(1,3.6);c.fillText('GAS FEE',128,0);}
 if(i===1){for(let y=0;y<256;y+=32)for(const x of[0,224]){c.fillStyle=y%64?'#fff0da':'#ec3838';c.fillRect(x,y,32,32);}c.fillStyle='#ec3838';c.font='900 30px sans-serif';c.fillText('DELIVERY.',128,173);c.fillText('AGAIN.',128,208);c.strokeStyle='#6e3127';c.lineWidth=8;c.fillStyle='#ffce56';c.beginPath();c.moveTo(82,129);c.lineTo(101,37);c.quadraticCurveTo(155,43,181,78);c.closePath();c.fill();c.stroke();c.fillStyle='#e63727';for(const [x,y]of[[116,67],[144,83],[103,109]]){c.beginPath();c.arc(x,y,10,0,7);c.fill();}}
 if(i===2){c.beginPath();c.moveTo(128,42);c.bezierCurveTo(110,83,62,119,69,162);c.bezierCurveTo(78,230,197,226,190,157);c.bezierCurveTo(190,117,151,78,128,42);c.fill();c.fillStyle='#0b5073';c.beginPath();c.ellipse(129,162,28,36,0,0,7);c.fill();}
 if(i===3){c.font='900 175px sans-serif';c.fillText('U',128,141);}
 if(i===4){c.fillStyle='#242b5c';c.font='900 28px sans-serif';c.fillText('TERM SHEET',128,43);c.fillStyle='#ada3bb';for(let n=0;n<6;n++)c.fillRect(18,76+n*21,170-n%3*24,7);c.strokeStyle='#3733c9';c.lineWidth=4;c.beginPath();c.moveTo(18,220);c.bezierCurveTo(110,115,30,260,88,211);c.lineTo(155,213);c.stroke();}
 if(i===5){c.fillStyle='#ff2755';const rows=['001111100','011111110','111111111','110010011','110010011','011111110','001101100','001101100'];rows.forEach((row,y)=>[...row].forEach((v,x)=>{if(v==='1')c.fillRect(38+x*20,37+y*22,20,22);}));c.fillStyle='#ff5ba7';for(let j=0;j<8;j++)c.fillRect((j*71)%235,15+j*29,14+j%3*8,3);}
 c.restore();}
 atlas=new T.CanvasTexture(canvas);atlas.colorSpace=T.SRGBColorSpace;atlas.anisotropy=2;return atlas;
}
export function itemShader(shader:T.WebGLProgramParametersWithUniforms){shader.uniforms.itemAtlas={value:itemAtlas()};shader.vertexShader='attribute vec4 surface;varying vec4 itemSurface;varying vec2 itemUV;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nitemSurface=surface;itemUV=uv;');shader.fragmentShader='uniform sampler2D itemAtlas;varying vec4 itemSurface;varying vec2 itemUV;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nif(itemSurface.w>.5)diffuseColor.rgb=texture2D(itemAtlas,itemUV).rgb;');shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=itemSurface.x;').replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor=itemSurface.y;').replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=diffuseColor.rgb*itemSurface.z;');}
