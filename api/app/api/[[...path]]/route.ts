import {offensiveName,NAME_POLICY_MESSAGE} from '../../../lib/namePolicy';
import {baseline,reconcile,leaderboard,rankingDetail,memberStatement} from '../../../lib/rankings';
import { env } from 'cloudflare:workers';
import { RULES, CONTENT } from '../../../lib/simulation';
import { allowedOrigins, simulations, simulationFor, ticketSimulation } from '../../../lib/competitive';
const hash=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),b=>b.toString(16).padStart(2,'0')).join('');
const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
const name=(v:unknown,max=20)=>{if(typeof v!=='string')throw Error('Name required');const s=v.normalize('NFKC').trim().replace(/\s+/g,' ');if([...s].length<2||[...s].length>max||/[\x00-\x1f\x7f]/.test(s))throw Error(`Use 2–${max} visible characters`);if(offensiveName(s))throw Error(NAME_POLICY_MESSAGE);return s;};
class HTTPError extends Error {constructor(public status:number,message:string){super(message);}}
async function serve(request:Request){
 const origin=request.headers.get('origin');const headers:Record<string,string>={'content-type':'application/json','cache-control':'no-store','vary':'Origin'};
 if(origin&&allowedOrigins.has(origin)){headers['access-control-allow-origin']=origin;headers['access-control-allow-methods']='GET,POST,OPTIONS';headers['access-control-allow-headers']='Content-Type,Authorization';}
 const send=(data:unknown,status=200)=>Response.json(data,{status,headers});
 if(origin&&!allowedOrigins.has(origin))return send({error:'Origin unavailable'},403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 try {
 const db=env.DB;if(!db)throw new HTTPError(503,'Database unavailable');const url=new URL(request.url),path=url.pathname.replace(/^\/api\/?/,'');const now=Date.now();
 if(path==='health'){await db.prepare('SELECT 1').first();return send({ok:true,rules:RULES,content:CONTENT,supportedContent:simulations.map(s=>s.CONTENT)});}
 let body:Record<string,unknown>={};
 if(request.method==='POST'){const payloadLimit=path==='runs'?98304:65536;if(Number(request.headers.get('content-length')||0)>payloadLimit)throw new HTTPError(413,'Payload too large');const raw=await request.text();if(new TextEncoder().encode(raw).length>payloadLimit)throw new HTTPError(413,'Payload too large');body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw new HTTPError(400,'Invalid body');}
 if(path==='guest'&&request.method==='POST'&&!request.headers.has('authorization')){const id=crypto.randomUUID(),secret=token();await db.prepare('INSERT INTO players(id,token_hash,nickname,created) VALUES(?,?,?,?)').bind(id,await hash(secret),name(body.nickname),now).run();return send({id,token:secret,nickname:name(body.nickname)},201);}
 const auth=request.headers.get('authorization')?.replace(/^Bearer /,'')||'';const [id,secret]=auth.split('.');
 if(!id||!secret)throw new HTTPError(401,'Identity required');
 const player=await db.prepare('SELECT id,nickname FROM players WHERE id=? AND token_hash=?').bind(id,await hash(secret)).first<{id:string;nickname:string}>();if(!player)throw new HTTPError(401,'Identity expired');
 if(path==='guest'&&request.method==='POST'){const nickname=name(body.nickname);await db.prepare('UPDATE players SET nickname=? WHERE id=?').bind(nickname,id).run();return send({id,nickname});}
 if(path==='tickets'&&request.method==='POST'){
 const simulation=ticketSimulation(body,origin);if(!simulation)throw new HTTPError(409,'Game update required');
 const ticket=crypto.randomUUID(),seed=crypto.getRandomValues(new Uint32Array(1))[0];
 const result=await db.prepare('INSERT INTO tickets(id,player_id,seed,rules,content,created,expires) SELECT ?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM tickets WHERE player_id=? AND created>?)<10').bind(ticket,id,seed,simulation.RULES,simulation.CONTENT,now,now+86400000,id,now-60000).run();
 if(!result.meta.changes)throw new HTTPError(429,'Try again in a minute');return send({id:ticket,seed,rules:simulation.RULES,content:simulation.CONTENT,expires:now+86400000});}
 if(path==='runs'&&request.method==='POST'){
 if(typeof body.ticket!=='string'||!Array.isArray(body.frames))throw new HTTPError(400,'Invalid run');
 const ticket=await db.prepare('SELECT * FROM tickets WHERE id=? AND player_id=?').bind(body.ticket,id).first<{id:string;seed:number;expires:number;rules:string;content:string;created:number}>();if(!ticket)throw new HTTPError(403,'Ticket unavailable');
 const existing=await db.prepare('SELECT result FROM runs WHERE ticket_id=?').bind(ticket.id).first<{result:string}>();if(existing)return send({accepted:true,result:JSON.parse(existing.result),duplicate:true});
 if(ticket.expires<now)throw new HTTPError(410,'Ticket expired');const simulation=simulationFor(ticket.content);if(!simulation||ticket.rules!==simulation.RULES)throw new HTTPError(409,'Rules changed; saved locally');
 const state=simulation.replay(ticket.seed,body.frames as number[][]);if(now-ticket.created<state.tick/60*1000-2000)throw new HTTPError(400,'Run submitted too early');
 const result=state.result!;
 const before=baseline(db,now),writes=await db.batch([
 ...before,
 db.prepare('INSERT OR IGNORE INTO runs(ticket_id,player_id,score,cash,result,version,created) VALUES(?,?,?,?,?,?,?)').bind(ticket.id,id,result.score,result.cashFinal,JSON.stringify(result),ticket.rules,now),
 db.prepare('UPDATE memberships SET locked=1 WHERE player_id=?').bind(id),
 ...reconcile(db,now)
 ]);return send({accepted:true,result,duplicate:!writes[before.length].meta.changes});}
 if(path==='startups'&&request.method==='POST'){
 const startupId=crypto.randomUUID(),code=token().slice(0,10).toUpperCase(),startupName=name(body.name,24);
 const member=await db.prepare('SELECT locked FROM memberships WHERE player_id=?').bind(id).first<{locked:number}>();if(member?.locked)throw new HTTPError(409,'Your startup is locked after a ranked run');
 await db.batch([
 ...baseline(db,now),
 db.prepare('INSERT INTO startups(id,name,code,created) VALUES(?,?,?,?)').bind(startupId,startupName,code,now),
 db.prepare('INSERT INTO memberships(player_id,startup_id,slot,locked) VALUES(?,?,1,(SELECT CASE WHEN EXISTS(SELECT 1 FROM runs WHERE player_id=?) THEN 1 ELSE 0 END)) ON CONFLICT(player_id) DO UPDATE SET startup_id=excluded.startup_id,slot=1 WHERE memberships.locked=0').bind(id,startupId,id),
 ...reconcile(db,now)
 ]);return send({id:startupId,name:startupName,code});}
 if(path==='startups/join'&&request.method==='POST'){
 if(typeof body.code!=='string'||!/^[A-F0-9]{10}$/i.test(body.code))throw new HTTPError(400,'Invalid invitation code');
 const startup=await db.prepare('SELECT id,name,code FROM startups WHERE code=?').bind(body.code.toUpperCase()).first<{id:string;name:string;code:string}>();if(!startup)throw new HTTPError(404,'Invitation code not found. Check the code with your co-founder.');
 const current=await db.prepare('SELECT startup_id,locked FROM memberships WHERE player_id=?').bind(id).first<{startup_id:string;locked:number}>();
 if(current?.startup_id===startup.id)return send({...startup,alreadyMember:true});
 if(current?.locked)throw new HTTPError(409,'Your membership is locked after a verified run. You cannot change startup.');
 // One SQL statement selects a free slot and moves an unlocked member atomically.
 const mutation=db.prepare(`INSERT INTO memberships(player_id,startup_id,slot,locked)
 SELECT ?,?,slots.slot,CASE WHEN EXISTS(SELECT 1 FROM runs WHERE player_id=?) THEN 1 ELSE 0 END FROM (SELECT 1 AS slot UNION ALL SELECT 2 UNION ALL SELECT 3) AS slots
 WHERE NOT EXISTS(SELECT 1 FROM memberships WHERE startup_id=? AND memberships.slot=slots.slot) AND NOT EXISTS(SELECT 1 FROM memberships WHERE player_id=? AND locked=1) LIMIT 1
 ON CONFLICT(player_id) DO UPDATE SET startup_id=excluded.startup_id,slot=excluded.slot,locked=excluded.locked WHERE memberships.locked=0`).bind(id,startup.id,id,startup.id,id);
 const before=baseline(db,now),batch=await db.batch([...before,mutation,...reconcile(db,now)]),joined=batch[before.length];
 if(!joined.meta.changes){const member=await db.prepare('SELECT startup_id,locked FROM memberships WHERE player_id=?').bind(id).first<{startup_id:string;locked:number}>();if(member?.startup_id===startup.id)return send({...startup,alreadyMember:true});throw new HTTPError(409,member?.locked?'Your membership is locked after a verified run. You cannot change startup.':'This startup is full. Ask for a code from a crew with an open seat.');}return send(startup);}
 if(path==='startups'&&request.method==='GET'){
 const startup=await db.prepare('SELECT s.*,m.locked FROM startups s JOIN memberships m ON m.startup_id=s.id WHERE m.player_id=?').bind(id).first();
 const members=startup?(await memberStatement(db,String(startup.id)).all()).results:[];return send({startup,members});}
 if(path==='leaderboard/detail'&&request.method==='GET'){
 const detailId=url.searchParams.get('id');if(!detailId||detailId.length>64)throw new HTTPError(400,'Invalid ranking entry');
 const detail=await rankingDetail(db,url.searchParams.get('kind')==='startup'?'startup':'ceo',detailId);
 if(!detail)throw new HTTPError(404,'Ranking entry unavailable');return send(detail);}
 if(path==='leaderboard'&&request.method==='GET'){
 const offset=Number(url.searchParams.get('offset')||0);if(!Number.isSafeInteger(offset)||offset<0)throw new HTTPError(400,'Invalid offset');
 return send(await leaderboard(db,url.searchParams.get('kind')==='startup'?'startup':'ceo',id,offset,now));}
 throw new HTTPError(404,'Not found');
 }catch(e){const error=e as Error;return send({error:error instanceof HTTPError?error.message: error instanceof SyntaxError?'Invalid JSON':/^(Invalid|Incomplete|Run too long|Use |Name required)/.test(error.message)?error.message:'Service unavailable'},error instanceof HTTPError?error.status:error instanceof SyntaxError||/^(Invalid|Incomplete|Run too long|Use |Name required)/.test(error.message)?400:503);}
}
export const GET=serve;export const POST=serve;export const OPTIONS=serve;
