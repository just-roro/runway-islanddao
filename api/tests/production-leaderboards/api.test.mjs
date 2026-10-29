import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import ts from 'typescript';
const moduleOf=source=>import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
const current=await moduleOf(readFileSync('lib/simulation.ts','utf8')),pages=await moduleOf(readFileSync('lib/legacy/island-routes-10.ts','utf8')),glide=await moduleOf(readFileSync('lib/legacy/island-glide-13.ts','utf8'));
const boost=await moduleOf(readFileSync('lib/legacy/island-boost-14.ts','utf8'));
globalThis.__rankProduction={current,pages,glide,boost,env:{DB:null}};
const compatibility=await moduleOf('const {current,pages,glide,boost}=globalThis.__rankProduction;\n'+readFileSync('lib/competitive.ts','utf8').replace(/^import .*;\n/gm,''));
const ranks=await moduleOf(readFileSync('lib/rankings.ts','utf8').replace("import { RULES } from './simulation';",'const {RULES}=globalThis.__rankProduction.current;'));
const policy=await moduleOf(readFileSync('lib/namePolicy.ts','utf8'));
Object.assign(globalThis.__rankProduction,compatibility,ranks,policy);
const route=await moduleOf('const {offensiveName,NAME_POLICY_MESSAGE,env,allowedOrigins,simulations,simulationFor,ticketSimulation,baseline,reconcile,leaderboard,rankingDetail,memberStatement}=globalThis.__rankProduction; const {RULES,CONTENT}=globalThis.__rankProduction.current;\n'+readFileSync('app/api/[[...path]]/route.ts','utf8').replace(/^import .*;\n/gm,''));
const origin='https://humanfriendly.global';
function fixture(){
 const dir=mkdtempSync(tmpdir()+'/runway-production-rankings-'),file=dir+'/state.sqlite';let sql=new DatabaseSync(file);
 for(const f of ['0000_loud_black_widow.sql','0001_normal_edwin_jarvis.sql'])sql.exec(readFileSync('drizzle/'+f,'utf8'));
 const prepare=(query,args=[])=>({bind:(...values)=>prepare(query,values),all:()=>({results:sql.prepare(query).all(...args)}),first:()=>sql.prepare(query).get(...args)??null,run:()=>({meta:sql.prepare(query).run(...args)}),execute:()=>({results:sql.prepare(query).all(...args),meta:{changes:sql.prepare('SELECT changes() n').get().n}})});
 globalThis.__rankProduction.env.DB={prepare,batch:async statements=>{sql.exec('BEGIN');try{const result=statements.map(s=>s.execute());sql.exec('COMMIT');return result;}catch(e){sql.exec('ROLLBACK');throw e;}}};
 const call=async(path,body,guest,from=origin,method=body===undefined?'GET':'POST')=>{
  const response=await route[method](new Request('https://api.test/api/'+path,{method,headers:{...(from?{origin:from}:{}),'content-type':'application/json',...(guest?{authorization:`Bearer ${guest.id}.${guest.token}`}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{})}));
  return{status:response.status,headers:response.headers,data:response.status===204?null:await response.json()};
 };
 return{call,get sql(){return sql;},reopen(){sql.close();sql=new DatabaseSync(file);},close(){sql.close();rmSync(dir,{recursive:true,force:true});}};
}
function flight(sim,seed,mode='land'){
 const s=sim.initialState(seed),frames=[];
 while(!s.result){let input={x:0,y:0};if(s.tick>=240&&mode==='land'){
  if(s.routeTime>=sim.TIMING.glide){const d=sim.DESTINATIONS[2],x=sim.clamp(((s.lift<23.99?-22:d.x)-s.x)*.2-s.vx*.04,-.65,.65);input={x,y:s.y>d.z+8?Math.sqrt(1-x*x):sim.clamp((s.y-d.z)*.18-.6,-1,1)};}
  else{const island=s.objects.find(o=>o.kind==='island'&&!s.collected.includes(o.id)&&s.routeTime>o.t-2&&s.routeTime<o.t+4);const target=island??s.objects.find(o=>['sol','term','community','gate'].includes(o.kind)&&o.t>s.routeTime+.12&&o.t<s.routeTime+.9&&!o.vertical&&!s.collected.includes(o.id));input={x:sim.clamp(((target?.x??Math.sin(s.routeTime*.3)*4)-s.x)*1.2,-1,1),y:sim.clamp((s.y-(target?.y??sim.START_Z+2))*1.2,-1,1)};}
 }const q=sim.quantize(input);frames.push(q);sim.step(s,sim.decoded(q));sim.step(s,sim.decoded(q));}
 return{frames,result:s.result};
}
test('exact CORS allowlist covers production, Pages and Sites; rejects lookalikes and other previews',async()=>{
 const f=fixture();try{for(const from of compatibility.allowedOrigins){const r=await f.call('health',undefined,null,from,'OPTIONS');assert.equal(r.status,204);assert.equal(r.headers.get('access-control-allow-origin'),from);assert.equal(r.headers.get('access-control-allow-headers'),'Content-Type,Authorization');}
 for(const from of ['null','https://humanfriendly.global.evil.test','https://other.pages.dev','https://humanfriendly.global:444']){const r=await f.call('health',undefined,null,from,'OPTIONS');assert.equal(r.status,403);assert.equal(r.headers.get('access-control-allow-origin'),null);}
 }finally{f.close();}
});
test('ticket negotiation preserves Pages, supports current client and rejects unsupported versions before writing',async()=>{
 const f=fixture();try{const g=(await f.call('guest',{nickname:'Version Test'})).data;
 for(const from of compatibility.publishedOrigins)assert.equal((await f.call('tickets',{},g,from)).data.content,pages.CONTENT);
 assert.equal((await f.call('tickets',{},g,'https://runway-islanddao.agenciahumanfriendly.chatgpt.site')).data.content,glide.CONTENT);
 assert.equal((await f.call('tickets',{content:current.CONTENT,rules:current.RULES},g)).data.content,current.CONTENT);
 const n=f.sql.prepare('SELECT COUNT(*) n FROM tickets').get().n;
 for(const body of [{content:'made-up'},{content:current.CONTENT,rules:'wrong'},{content:null}])assert.equal((await f.call('tickets',body,g)).status,409);
 assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM tickets').get().n,n);
 }finally{f.close();}
});
test('both actual replays persist, duplicate submissions do not inflate CEO or startup, another identity/reload sees records',async()=>{
 const f=fixture();try{
 const a=(await f.call('guest',{nickname:'Ada'})).data,b=(await f.call('guest',{nickname:'Beto'})).data,viewer=(await f.call('guest',{nickname:'Cora'})).data;
 const team=(await f.call('startups',{name:'Persistent Crew'},a)).data;assert.equal((await f.call('startups/join',{code:team.code},b)).status,200);
 const scores=[];
 // Published glide client remains verifiable after introducing the boost content.
 const g13=(await f.call('guest',{nickname:'Glide 13'})).data,t13=(await f.call('tickets',{content:glide.CONTENT,rules:glide.RULES},g13)).data;
 f.sql.prepare('UPDATE tickets SET seed=42,created=? WHERE id=?').run(Date.now()-70000,t13.id);const oldRun=flight(glide,42,'loss');assert.deepEqual((await f.call('runs',{ticket:t13.id,frames:oldRun.frames},g13)).data.result,oldRun.result);
 for(const [i,sim] of [pages,current].entries()){
  const g=i?b:a,t=(await f.call('tickets',{content:sim.CONTENT,rules:sim.RULES},g)).data;
  // Seed/time setup exists only in the isolated test DB; HTTP replay is unmodified.
  f.sql.prepare('UPDATE tickets SET seed=42,created=? WHERE id=?').run(Date.now()-70000,t.id);
  const run=flight(sim,42);assert.equal(run.result.outcome,'landed');scores.push(run.result.score);
  if(sim===current){const state=sim.replay(42,run.frames);assert.equal(state.islandCollected,1);const pickup=state.events.find(e=>e.kind==='island');assert.ok(state.events.some(e=>e.kind==='sol'&&e.tick>pickup.tick&&e.tick<pickup.tick+600&&e.delta===30000));}
  assert.equal((await f.call('runs',{ticket:t.id,frames:run.frames},viewer)).status,403);
  const body={ticket:t.id,frames:run.frames,score:999999999};
  const responses=await Promise.all([f.call('runs',body,g),f.call('runs',body,g)]);
  responses.forEach(r=>{assert.equal(r.status,200);assert.deepEqual(r.data.result,run.result);});
  assert.equal(responses.filter(r=>!r.data.duplicate).length,1);
  assert.equal((await f.call('runs',body,g)).data.duplicate,true);
 }
 const before=f.sql.prepare('SELECT * FROM runs ORDER BY ticket_id').all();assert.equal(before.length,3);
 assert.equal((await f.call('startups',{name:'Cannot move'},a)).status,409);
 f.reopen();
 const ceo=await f.call('leaderboard?kind=ceo',undefined,viewer);assert.equal(ceo.status,200);assert.equal(ceo.data.rows.length,3);assert.ok(ceo.data.rows[0].score>=ceo.data.rows[1].score);assert.deepEqual(ceo.data.rows.map(r=>r.name).sort(),['Ada','Beto','Glide 13']);
 const teamRank=await f.call('leaderboard?kind=startup',undefined,viewer);assert.equal(teamRank.data.rows[0].score,scores.reduce((a,b)=>a+b));
 const members=await f.call('startups',undefined,b);assert.equal(members.data.members.length,2);assert.equal(members.data.startup.id,team.id);
 assert.deepEqual(f.sql.prepare('SELECT * FROM runs ORDER BY ticket_id').all(),before);
 const detail=await f.call('leaderboard/detail?kind=startup&id='+team.id,undefined,viewer);assert.equal(detail.data.members.length,2);assert.ok(!JSON.stringify(detail.data).includes(team.code));
 }finally{f.close();}
});
test('invalid, incomplete, premature and expired submissions are not stored; loss is a real zero score',async()=>{
 const f=fixture();try{const g=(await f.call('guest',{nickname:'Validation'})).data,t=(await f.call('tickets',{},g)).data;
 for(const frames of [[[999,0]],[[0,0]]])assert.equal((await f.call('runs',{ticket:t.id,frames},g)).status,400);
 f.sql.prepare('UPDATE tickets SET seed=42 WHERE id=?').run(t.id);const run=flight(pages,42,'loss');assert.equal(run.result.score,0);
 assert.equal((await f.call('runs',{ticket:t.id,frames:run.frames},g)).status,400);
 f.sql.prepare('UPDATE tickets SET created=?,expires=? WHERE id=?').run(Date.now()-70000,Date.now()-100,t.id);
 assert.equal((await f.call('runs',{ticket:t.id,frames:run.frames},g)).status,410);assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM runs').get().n,0);
 f.sql.prepare('UPDATE tickets SET expires=? WHERE id=?').run(Date.now()+100000,t.id);
 assert.equal((await f.call('runs',{ticket:t.id,frames:run.frames},g)).status,200);
 assert.equal((await f.call('leaderboard?kind=ceo',undefined,g)).data.own.score,0);
 assert.equal((await f.call('leaderboard?kind=ceo',undefined,g)).data.leaders.ceo,null);
 }finally{f.close();}
});
test('published boost14 replay stays immutable and verifiable alongside glide rewards15',async()=>{
 const f=fixture();try{
 const g=(await f.call('guest',{nickname:'Legacy Boost'})).data;
 const ticket=await f.call('tickets',{content:boost.CONTENT,rules:boost.RULES},g);assert.equal(ticket.status,200);assert.equal(ticket.data.content,'island-boost-14');
 f.sql.prepare('UPDATE tickets SET seed=42,created=? WHERE id=?').run(Date.now()-70000,ticket.data.id);
 const run=flight(boost,42);const body={ticket:ticket.data.id,frames:run.frames};
 assert.deepEqual((await f.call('runs',body,g)).data.result,run.result);assert.equal((await f.call('runs',body,g)).data.duplicate,true);
 const health=await f.call('health');assert.ok(health.data.supportedContent.includes('island-boost-14'));assert.ok(health.data.supportedContent.includes('glide-rewards-15'));
 }finally{f.close();}
});

 test('offensive names cannot create players, rename identities or create startups',async()=>{const f=fixture();try{for(const nickname of ['NIGGAMAN','ＮＩＧＧＡＭＡＮ','n1ggaman','n.i.g.g.a.man','ni\u200bggaman','FUCK','mierda']){const r=await f.call('guest',{nickname});assert.equal(r.status,400,nickname);assert.match(r.data.error,/respectful/);}assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM players').get().n,0);const guest=(await f.call('guest',{nickname:'Scunthorpe'})).data;assert.equal((await f.call('guest',{nickname:'NIGGAMAN'},guest)).status,400);assert.equal((await f.call('startups',{name:'NIGGAMAN'},guest)).status,400);assert.equal(f.sql.prepare('SELECT nickname FROM players').get().nickname,'Scunthorpe');assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM startups').get().n,0);for(const good of ['Nicolas','Fagan','Kike','José','Class Act','IslandDAO'])assert.equal(policy.offensiveName(good),false,good);}finally{f.close();}});


 test('ranking exclusion retains all records and removes only the moderated score',async()=>{const f=fixture();try{const id='430772c1-2f7a-4606-b796-2648815011a5';for(const [pid,nickname] of [[id,'NIGGAMAN'],['safe','Safe founder']])f.sql.prepare('INSERT INTO players VALUES(?,?,?,?)').run(pid,'hash',nickname,1);f.sql.prepare('INSERT INTO startups VALUES(?,?,?,?)').run('team','Team','ABCDEF1234',1);for(const [pid,slot,score] of [[id,1,500],['safe',2,100]]){f.sql.prepare('INSERT INTO memberships VALUES(?,?,?,?)').run(pid,'team',slot,1);f.sql.prepare('INSERT INTO tickets VALUES(?,?,?,?,?,?,?)').run('t-'+pid,pid,1,current.RULES,current.CONTENT,1,999);f.sql.prepare('INSERT INTO runs VALUES(?,?,?,?,?,?,?)').run('t-'+pid,pid,score,score,'{}',current.RULES,1);}const db=globalThis.__rankProduction.env.DB;const ceo=await ranks.leaderboard(db,'ceo',id,0,1000);assert.equal(ceo.rows.length,1);assert.equal(ceo.rows[0].id,'safe');assert.equal(ceo.own,null);assert.equal(await ranks.rankingDetail(db,'ceo',id),null);const team=await ranks.leaderboard(db,'startup','safe',0,1000);assert.equal(team.rows[0].score,100);const members=(await ranks.memberStatement(db,'team').all()).results;assert.equal(members.find(m=>m.player_id===id).nickname,'Moderated player');assert.equal(members.find(m=>m.player_id===id).score,0);for(const table of ['players','runs','tickets','memberships'])assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM '+table).get().n,2,table);}finally{f.close();}});
