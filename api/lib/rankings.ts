import { RULES } from './simulation';

// Owner-requested ranking exclusion; account, tickets, runs and membership are retained.
const excludedPlayer='430772c1-2f7a-4606-b796-2648815011a5';

export type RankingKind = 'ceo' | 'startup';
export const kinds: RankingKind[] = ['ceo', 'startup'];
// One definition for the table, personal place, featured leaders and details.
export function scores(kind: RankingKind) {
 return kind === 'ceo'
  ? `SELECT p.id,p.nickname AS name,MAX(r.score) AS score FROM players p JOIN runs r ON p.id=r.player_id WHERE r.version=? AND p.id<>'${excludedPlayer}' GROUP BY p.id`
  : `SELECT s.id,s.name,COALESCE(SUM(b.score),0) AS score FROM startups s JOIN memberships m ON m.startup_id=s.id LEFT JOIN (SELECT player_id,MAX(score) AS score FROM runs WHERE version=? AND player_id<>'${excludedPlayer}' GROUP BY player_id) b ON b.player_id=m.player_id GROUP BY s.id`;
}
export const ranked = (kind: RankingKind) => `WITH scores AS (${scores(kind)}), ranked AS (SELECT *,RANK() OVER (ORDER BY score DESC) AS rank FROM scores)`;
const leaders = (kind: RankingKind) => `WITH scores AS (${scores(kind)}) SELECT id FROM scores WHERE score>0 AND score=(SELECT MAX(score) FROM scores)`;

/** Baseline before the first observed mutation. Existing leaders have no invented accession date.
 * These statements and the ranking-changing mutation MUST be in the same D1 batch. */
export function baseline(db: D1Database, now: number) {
 return kinds.flatMap(kind => [
  db.prepare(`INSERT OR IGNORE INTO ranking_leaders(version,kind,entity_id,since,observed_at) SELECT ?,?,id,NULL,? FROM (${leaders(kind)}) WHERE NOT EXISTS(SELECT 1 FROM ranking_tracking WHERE version=? AND kind=?)`).bind(RULES,kind,now,RULES,RULES,kind),
  db.prepare('INSERT OR IGNORE INTO ranking_tracking(version,kind,started_at) VALUES(?,?,?)').bind(RULES,kind,now),
 ]);
}
/** Preserve each tied leader's continuous tenure; losing first place ends it. */
export function reconcile(db: D1Database, now: number) {
 return kinds.flatMap(kind => [
  db.prepare(`DELETE FROM ranking_leaders WHERE version=? AND kind=? AND entity_id NOT IN (${leaders(kind)})`).bind(RULES,kind,RULES),
  db.prepare(`INSERT OR IGNORE INTO ranking_leaders(version,kind,entity_id,since,observed_at) SELECT ?,?,id,?,? FROM (${leaders(kind)})`).bind(RULES,kind,now,now,RULES),
 ]);
}
export function memberStatement(db: D1Database, startupId: string) {
 return db.prepare(`SELECT CASE WHEN p.id='${excludedPlayer}' THEN 'Moderated player' ELSE p.nickname END AS nickname,m.player_id,COALESCE(MAX(r.score),0) AS score,COUNT(r.ticket_id) AS runs FROM memberships m JOIN players p ON p.id=m.player_id LEFT JOIN runs r ON r.player_id=p.id AND r.version=? AND p.id<>'${excludedPlayer}' WHERE m.startup_id=? GROUP BY p.id ORDER BY score DESC,p.nickname,p.id`).bind(RULES,startupId);
}
export async function leaderboard(db: D1Database, kind: RankingKind, playerId: string, offset: number, now: number) {
 const ownId=kind==='ceo'?playerId:(await db.prepare('SELECT startup_id FROM memberships WHERE player_id=?').bind(playerId).first<{startup_id:string}>())?.startup_id;
 const queries=[
  db.prepare(`${ranked(kind)} SELECT * FROM ranked ORDER BY score DESC,name,id LIMIT 51 OFFSET ?`).bind(RULES,offset),
  db.prepare(`${ranked(kind)} SELECT * FROM ranked WHERE id=?`).bind(RULES,ownId??''),
  db.prepare(`SELECT COUNT(*) AS total FROM (${scores(kind)})`).bind(RULES),
  ...kinds.map(k=>db.prepare(`${ranked(k)} SELECT r.*,l.since AS leadingSince,l.observed_at AS observedSince,(SELECT COUNT(*) FROM ranked WHERE rank=1 AND score>0) AS tied FROM ranked r LEFT JOIN ranking_leaders l ON l.entity_id=r.id AND l.version=? AND l.kind=? WHERE r.rank=1 AND r.score>0 ORDER BY r.name,r.id LIMIT 1`).bind(RULES,RULES,k))
 ];
 const init=[...baseline(db,now),...reconcile(db,now)],results=await db.batch<Record<string,unknown>>([...init,...queries]);
 const [rows,own,count,ceo,startup]=results.slice(init.length);
 return {rows:rows.results.slice(0,50),own:own.results[0]??null,total:count.results[0].total,nextOffset:rows.results.length>50?offset+50:null,leaders:{ceo:ceo.results[0]??null,startup:startup.results[0]??null},serverNow:now};
}
export async function rankingDetail(db:D1Database,kind:RankingKind,id:string){
 const entry=await db.prepare(`${ranked(kind)} SELECT * FROM ranked WHERE id=?`).bind(RULES,id).first();
 if(!entry)return null;
 if(kind==='startup')return {kind,entry,members:(await memberStatement(db,id).all()).results};
 const [summary,best,team]=await db.batch<Record<string,unknown>>([
  db.prepare(`SELECT COUNT(*) AS runs,SUM(CASE WHEN json_extract(result,'$.outcome')='landed' THEN 1 ELSE 0 END) AS landings FROM runs WHERE player_id=? AND version=?`).bind(id,RULES),
  db.prepare('SELECT result,created FROM runs WHERE player_id=? AND version=? ORDER BY score DESC,created,ticket_id LIMIT 1').bind(id,RULES),
  db.prepare('SELECT s.id,s.name FROM startups s JOIN memberships m ON m.startup_id=s.id WHERE m.player_id=?').bind(id),
 ]);
 const result=best.results[0];
 return {kind,entry,summary:summary.results[0],best:result?{...JSON.parse(result.result as string),recordedAt:result.created}:null,startup:team.results[0]??null};
}
