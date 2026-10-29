import fs from 'node:fs';
import * as S from '../../src/core/simulation.ts';
import * as T from 'three';
const counts={},present={},phaseCounts={},conditionalExpected={},samples=10000;
for(let seed=0;seed<samples;seed++){
 const list=S.generate(seed),seen=new Set();
 for(const o of list){counts[o.kind]=(counts[o.kind]??0)+1;seen.add(o.kind);const k=o.kind+':'+(o.vertical?'glide':'fall');phaseCounts[k]=(phaseCounts[k]??0)+1;}
 for(const kind of seen)present[kind]=(present[kind]??0)+1;
 const recent=[];let hacks=0;
 for(const o of list.filter(o=>o.id.startsWith('encounter-'))){
  const hazardOnly=!!o.vertical||(o.x===0&&o.y===S.START_Z-8.4);
  const options=Object.entries(S.COURSE_CONFIG.weights).filter(([kind])=>(!hazardOnly||kind!=='delivery')&&kind!==recent.at(-1)&&(kind!=='hacked'||hacks<S.COURSE_CONFIG.maxHacked&&!recent.slice(-3).includes('hacked')));
  const total=options.reduce((n,[,weight])=>n+weight,0);
  for(const [kind,weight]of options)conditionalExpected[kind]=(conditionalExpected[kind]??0)+weight/total;
  recent.push(o.kind);if(o.kind==='hacked')hacks++;
 }
}
const rows=Object.entries(counts).map(([kind,total])=>({kind,total,mean:total/samples,runs:present[kind],runPercent:present[kind]/samples*100,expectedMean:conditionalExpected[kind]?conditionalExpected[kind]/samples:kind==='rare'?.04:total/samples,fallMean:(phaseCounts[kind+':fall']??0)/samples,glideMean:(phaseCounts[kind+':glide']??0)/samples}));
const camera=new T.PerspectiveCamera(78,390/844,.1,3000),point=new T.Vector3();
const perspective=(s,o)=>{const p=S.objectPose(o,s.routeTime);camera.position.set(s.x+s.vx*.025,s.altitude+4.65,s.y+1.88);camera.lookAt(s.x+s.vx*.045,s.altitude-.25,s.y-.3);camera.updateMatrixWorld();point.set(p.x,p.y,p.z).applyMatrix4(camera.matrixWorldInverse);const depth=-point.z;const radius=['delivery','gas','rug','hacked','star','gate','risk'].includes(o.kind)?o.r:S.objectRadius(o.kind);const px=radius*844/(Math.tan(78*Math.PI/360)*depth);point.set(p.x,p.y,p.z).project(camera);const u=S.clamp((depth-30)/80,0,1),contrast=1-u*u*(3-2*u);return{inFrame:depth>0&&Math.abs(point.x)<1&&Math.abs(point.y)<1,px,contrast,depth};};
const visibility={};for(const profile of ['hold','gold']){
 const metrics={},ledger={},runs=100;
 for(let seed=0;seed<runs;seed++){
  const s=S.initialState(seed),local={};
  while(s.routeTime<S.TIMING.glide&&!s.result){
   let input={x:0,y:0};
   if(profile==='gold'&&s.tick>=240){const target=s.objects.find(o=>['sol','term','community','gate'].includes(o.kind)&&o.t>s.routeTime+.12&&o.t<s.routeTime+.9&&!o.vertical&&!s.collected.includes(o.id));const x=target?.x??Math.sin(s.routeTime*.3)*4,z=target?.y??S.START_Z+2;input={x:S.clamp((x-s.x)*1.2,-1,1),y:S.clamp((s.y-z)*1.2,-1,1)};}
   S.step(s,input);
   if(s.routeTime<5)continue;
   for(const o of s.objects){if(o.vertical||s.collected.includes(o.id)||!['community','term','magnet'].includes(o.kind))continue;const v=perspective(s,o),entry=local[o.id]??={kind:o.kind,readable:0,maxPixels:0};if(v.inFrame&&v.contrast>.5){entry.maxPixels=Math.max(entry.maxPixels,v.px);if(v.px>=20)entry.readable+=1/60;}}
  }
  for(const value of Object.values(local)){const m=metrics[value.kind]??={instances:0,with20pxWindow:0,seconds20px:0,maxPixels:0};m.instances++;m.with20pxWindow+=value.readable>0?1:0;m.seconds20px+=value.readable;m.maxPixels+=value.maxPixels;}
  for(const e of s.events)ledger[e.kind]=(ledger[e.kind]??0)+1;
 }
 for(const m of Object.values(metrics)){m.mean20pxSeconds=m.seconds20px/m.instances;m.meanMaxPixels=m.maxPixels/m.instances;}
 visibility[profile]={runs,metrics,events:ledger};
}
const special=S.generate(0).filter(o=>['community','term','magnet'].includes(o.kind)).map(o=>({id:o.id,kind:o.kind,seconds:o.t,x:o.x,z:o.y,radius:S.objectRadius(o.kind),storm:o.t>S.CLOUD_DECK.enter}));
const out={seeds:samples,rows,expected:{sol:128,term:2,community:3,magnet:2,water:1,star:18,gate:19,rare:.04,encounterWeights:S.COURSE_CONFIG.weights,maxHacked:S.COURSE_CONFIG.maxHacked},visibility,authoredSpecials:special,notes:['Seeded generation counts actual objects after clearance, not registry entries.','Visibility is an analytical steady-follow camera estimate at 390x844, not a browser render. Readable threshold is >=20px diameter and >50% object/fog contrast; no world occlusion counted.','Hold = no control. Gold uses existing QA lane-following policy unchanged; run death can truncate opportunities.','Risk has residual renderer/type but no generated content and no catalog entry; intentionally inactive.']};
fs.writeFileSync(new URL('./pickup-audit.json',import.meta.url),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out,null,2));
