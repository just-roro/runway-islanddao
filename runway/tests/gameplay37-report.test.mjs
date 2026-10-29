import {it,expect} from 'vitest';
import {writeFileSync,mkdirSync,readFileSync} from 'node:fs';
import {generate,initialState,step,quantize,decoded,CONTENT_CATALOG,COURSE_CONFIG,sequenceActive,clamp,TIMING} from '../src/core/simulation';
import {replay as serverReplay} from '../../services/runway-api/lib/simulation';
import {flyRoute} from './test-pilot';
it('writes reproducible inventory, distribution, and frontend/server replay evidence',()=>{
 const counts={},runs=[];let rareRuns=0,maxHacked=0;
 for(let seed=0;seed<1000;seed++){const o=generate(seed);for(const item of o)counts[item.kind]=(counts[item.kind]??0)+1;rareRuns+=Number(o.some(o=>o.kind==='rare'));maxHacked=Math.max(maxHacked,o.filter(o=>o.kind==='hacked').length);}
 for(let seed=0;seed<100;seed++){const s=initialState(seed),frames=[],route=['beach','terrace','jurere'][seed%3];while(!s.result){const q=quantize(flyRoute(s,route));frames.push(q);step(s,decoded(q));step(s,decoded(q));}const server=serverReplay(seed,frames);expect(server).toEqual(s);runs.push({seed,route,outcome:s.outcome,destination:s.destination,cash:s.cash,seconds:s.tick/60,collected:s.collected.length,damage:s.hazardHits,sequences:s.events.filter(e=>e.kind==='sequence-complete').length,replayExact:true});}
 const dir='reports/gameplay37';mkdirSync(dir,{recursive:true});writeFileSync(dir+'/metrics.json',JSON.stringify({seeds:1000,counts,rareRuns,maxHacked,meanHacked:counts.hacked/1000,weights:COURSE_CONFIG.weights,replays:runs},null,2));
 const model=id=>['sol','star','gate','rare','risk'].includes(id)?'src/scene/props.ts':'src/scene/itemArt.ts';
 const entries=CONTENT_CATALOG.filter(o=>!['tower','ocean'].includes(o.id)).map(o=>({...o,model:model(o.id),observed:counts[o.id],status:'ENABLED / OBSERVED'}));entries.push({id:'risk',name:'Legacy risk ring',group:'Inactive',model:model('risk'),effect:'Not enabled',phase:'None',observed:0,status:'INACTIVE / NOT GENERATED'});
 writeFileSync(dir+'/item-inventory.csv','id,name,group,model,effect,phase,observed_1000_seeds,status\n'+entries.map(o=>[o.id,o.name,o.group,o.model,o.effect,o.phase,o.observed,o.status].map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\n')+'\n');
 expect(readFileSync('src/core/simulation.ts','utf8')).toBe(readFileSync('../services/runway-api/lib/simulation.ts','utf8'));
},120000);
it('both optional glide chains are reachable through their currently active rings',()=>{
 for(const name of ['landing-1','landing-2']){const s=initialState(3);s.objects=s.objects.filter(o=>o.sequence===name);const o=s.objects[0];s.tick=Math.ceil(TIMING.glide*60);s.routeTime=s.tick/60;s.phase='land';s.x=o.x;s.y=o.y+23;s.altitude=o.alt+8.63;s.vy=-27.73;
 for(let i=0;i<240&&!s.result;i++){const target=s.objects.find(o=>sequenceActive(s,o));const x=target?clamp((target.x-s.x)*.6-s.vx*.05,-.5,.5):0;step(s,{x,y:Math.sqrt(1-x*x)});}
 expect(s.sequences[name],name).toMatchObject({status:'completed',next:3});expect(s.events.filter(e=>e.kind==='sequence-complete')).toHaveLength(1);}
});
