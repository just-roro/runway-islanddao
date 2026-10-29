import ts from 'typescript';import fs from 'node:fs';
const compile=s=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(s,{compilerOptions:{module:99,target:99}}).outputText).toString('base64');
const core=compile(fs.readFileSync('src/core/simulation.ts','utf8')),sim=await import(core);
const pilot=await import(compile(fs.readFileSync('tests/test-pilot.ts','utf8').replace('../src/core/simulation',core)));
const result=[];
for(const destination of sim.DESTINATIONS)for(const precision of ['precise','delayed']){
 const runs=[];for(let seed=0;seed<100;seed++){
  const s=sim.initialState(seed),frames=[];let input={x:0,y:0};
  while(!s.result){if(s.tick%(precision==='precise'?2:8)===0)input=pilot.flyRoute(s,destination.id);const q=sim.quantize(input);frames.push(q);sim.step(s,sim.decoded(q));sim.step(s,sim.decoded(q));}
  const r=sim.replay(seed,frames);if(JSON.stringify(r)!==JSON.stringify(s))throw Error('Replay drift');
  runs.push({seed,cash:s.cash,outcome:s.outcome,destination:s.destination,seconds:s.tick/60,lift:s.lift,pickups:s.collected.length,hits:s.hazardHits,sequences:s.events.filter(e=>e.kind==='sequence-complete').length});
 }
 const landed=runs.filter(r=>r.outcome==='landed'),values=landed.map(r=>r.cash).sort((a,b)=>a-b),mean=key=>landed.reduce((n,r)=>n+r[key],0)/landed.length;
 result.push({route:destination.id,precision,attempts:runs.length,landed:landed.length,onTarget:runs.filter(r=>r.destination===destination.id).length,mean:Math.round(mean('cash')),median:values[Math.floor(values.length*.5)],p10:values[Math.floor(values.length*.1)],p90:values[Math.floor(values.length*.9)],withinTarget:landed.filter(r=>r.cash>=500000&&r.cash<=2000000).length/landed.length,meanSeconds:mean('seconds'),meanDamage:mean('hits'),meanSequences:mean('sequences'),runs});
}
fs.writeFileSync('reports/balance-routes.json',JSON.stringify({rules:sim.RULES,method:'Deterministic input controllers; not human playtests',results:result},null,2));console.log(result.map(({runs,...r})=>r));
