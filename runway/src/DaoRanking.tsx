import {acceptCeoSnapshot} from './services/recognition';
import {createPortal} from 'react-dom';
import {useEffect,useRef,useState} from 'react';
import {Button,Icon,Panel} from './UI';
import {Money} from './Money';
import {api,identify,flushQueue,profile} from './services/session';
import {DESTINATIONS} from './core/simulation';
export type RankingKind='ceo'|'startup';
export type RankEntry={id:string;name:string;score:number;rank:number};
type Leader=RankEntry&{leadingSince:number|null;observedSince:number|null;tied:number};
export type Member={player_id:string;nickname:string;score:number;runs:number};
type Board={rows:RankEntry[];own:RankEntry|null;total:number;nextOffset:number|null;leaders:Record<RankingKind,Leader|null>;serverNow:number};
type Detail={kind:RankingKind;entry:RankEntry;members?:Member[];summary?:{runs:number;landings:number};best?:{recordedAt:number;outcome:string;destination:string|null;breakdown:Record<string,number>};startup?:{name:string}|null};
const validEntry=(v:RankEntry)=>v&&typeof v.id==='string'&&typeof v.name==='string'&&Number.isFinite(v.score)&&Number.isFinite(v.rank);
export const validMembers=(v:Member[])=>Array.isArray(v)&&v.every(m=>typeof m.player_id==='string'&&typeof m.nickname==='string'&&Number.isFinite(m.score)&&Number.isFinite(m.runs));
export function DataNotice({error,retry,children}:{error?:boolean;retry?:()=>void;children:React.ReactNode}){return <div className={`dao-notice ${error?'is-error':''}`} role={error?'alert':'status'}><p>{children}</p>{retry&&<Button onClick={retry}><Icon name="retry"/>RETRY</Button>}</div>;}
export function MemberList({members}:{members:Member[]}){return <ul className="dao-members">{members.map(m=><li key={m.player_id}><div><strong>{m.nickname}{m.player_id===profile.identity?.id&&<small>YOU</small>}</strong><span>{m.runs} verified {m.runs===1?'flight':'flights'}</span></div><b><Money value={m.score}/></b></li>)}</ul>;}
export function elapsedLabel(ms:number){const s=Math.max(0,Math.floor(ms/1000)),d=Math.floor(s/86400),h=Math.floor(s/3600)%24,m=Math.floor(s/60)%60;return `${d?`${d}d `:''}${h||d?`${h}h `:''}${m}m ${String(s%60).padStart(2,'0')}s`;}
function LeaderClock({leader,now}:{leader:Leader;now:number}){const since=leader.leadingSince??leader.observedSince;return <div className="leader-clock"><span>{leader.leadingSince!==null?'LEADING FOR':'OBSERVED IN FIRST FOR'}</span><time dateTime={since?new Date(since).toISOString():undefined}>{since?elapsedLabel(now-since):'Not recorded'}</time>{leader.leadingSince===null&&<small>Earlier lead date not recorded</small>}</div>;}
export function DaoRanking({kind,onKind,onBack,onPlay}:{kind:RankingKind;onKind:(kind:RankingKind)=>void;onBack:()=>void;onPlay:()=>void}){
 const [board,setBoard]=useState<Board|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[offset,setOffset]=useState(0),[reload,setReload]=useState(0),[now,setNow]=useState(Date.now());
 const [leaders,setLeaders]=useState<Board['leaders']|null>(null);
 const clock=useRef({server:Date.now(),local:performance.now()});
 const [selected,setSelected]=useState<{kind:RankingKind;id:string}|null>(null),[detail,setDetail]=useState<Detail|null>(null),[detailError,setDetailError]=useState(''),[detailReload,setDetailReload]=useState(0);
 useEffect(()=>{const timer=setInterval(()=>setNow(clock.current.server+performance.now()-clock.current.local),1000);return()=>clearInterval(timer);},[]);
 useEffect(()=>{
  let disposed=false,inflight=false;setLoading(true);setError('');setBoard(null);
  async function load(first=false){if(inflight||(!first&&document.hidden))return;inflight=true;try{if(first){await identify();await flushQueue();}const data=await api<Board>(`leaderboard?kind=${kind}&offset=${offset}`);if(!data||!Array.isArray(data.rows)||!data.rows.every(validEntry)||!data.leaders||!Number.isFinite(data.serverNow)||!Number.isFinite(data.total)||(['ceo','startup'] as const).some(k=>{const l=data.leaders[k];return l!==null&&(!validEntry(l)||!(l.leadingSince===null||Number.isFinite(l.leadingSince))||!(l.observedSince===null||Number.isFinite(l.observedSince)));}))throw new Error('Invalid ranking data');if(!disposed){if(kind==='ceo')acceptCeoSnapshot(data);setBoard(data);setLeaders(previous=>JSON.stringify(previous)===JSON.stringify(data.leaders)?previous:data.leaders);clock.current={server:data.serverNow,local:performance.now()};setNow(data.serverNow);setError('');}}catch{if(!disposed)setError('Ranking connection unavailable. Retry to see verified positions.');}finally{inflight=false;if(!disposed)setLoading(false);}}
  void load(true);const timer=setInterval(()=>void load(),20000);return()=>{disposed=true;clearInterval(timer);};
 },[kind,offset,reload]);
 useEffect(()=>{let disposed=false;setDetail(null);setDetailError('');if(selected)void api<Detail>(`leaderboard/detail?kind=${selected.kind}&id=${encodeURIComponent(selected.id)}`).then(d=>{if(!d||!validEntry(d.entry)||(d.kind==='startup'&&!validMembers(d.members!)))throw new Error('Invalid record');if(!disposed)setDetail(d);}).catch(()=>{if(!disposed)setDetailError('This record could not be loaded.');});return()=>{disposed=true;};},[selected,detailReload]);
 return <Panel className="sheet dao-screen" onBack={onBack}>
  <header className="dao-heading"><span className="eyebrow">ISLANDDAO / VERIFIED CAPITAL</span><h2>DAO RANKING</h2></header>
  {leaders&&<div className="dao-leaders" aria-label="Current leaders">{(['ceo','startup'] as const).map(k=>{const leader=leaders[k];return <button key={k} className="leader-card" disabled={!leader} onClick={()=>leader&&setSelected({kind:k,id:leader.id})} aria-label={leader?`View #1 ${k.toUpperCase()}: ${leader.name}`:`No ${k.toUpperCase()} leader yet`}>
     <div className="leader-label"><Icon name="trophy"/><span>#1 {k.toUpperCase()}</span></div>
     {leader?<><h3>{leader.name}</h3><strong className="leader-money"><Money value={leader.score}/></strong><LeaderClock leader={leader} now={now}/><footer>{leader.tied>1?`${leader.tied} share first place`:'View record'}<Icon name="next"/></footer></>:<><h3>First place awaits</h3><p>A positive verified score starts the board.</p></>}
    </button>;})}</div>}
  <div className="dao-toggle" role="group" aria-label="Ranking category">{(['ceo','startup'] as const).map(k=><Button key={k} aria-pressed={kind===k} className={kind===k?'selected':''} onClick={()=>{onKind(k);setOffset(0);}}><Icon name={k==='ceo'?'pilot':'team'}/>{k.toUpperCase()}</Button>)}</div>
  {loading?<DataNotice>Loading the DAO ranking…</DataNotice>:<>
   {error&&<DataNotice error retry={()=>setReload(n=>n+1)}>{board?'Connection lost. Showing the last verified snapshot.':error}</DataNotice>}
   {board&&<>
    <section className="dao-table-section" aria-label={`${kind.toUpperCase()} rankings`}><header><h3>{kind==='ceo'?'CEO':'STARTUP'} STANDINGS</h3><span>{board.total} {kind==='ceo'?'founders':'startups'}</span></header>
     <p className="hint">{kind==='ceo'?'Best verified closing capital per founder.':'Sum of each member’s best verified closing capital.'} Ties share a place.</p>
     {board.own&&<div className="dao-own"><span>{kind==='ceo'?'YOUR POSITION':'YOUR STARTUP'}</span><b>#{board.own.rank}</b><Money value={board.own.score}/></div>}
     {board.rows.length?<ol className="dao-ranking-list">{board.rows.map(r=><li key={r.id}><button className={r.id===board.own?.id?'is-own':''} onClick={()=>setSelected({kind,id:r.id})}><b>#{r.rank}</b><span>{r.name}</span><strong><Money value={r.score}/></strong><Icon name="next"/></button></li>)}</ol>:<DataNotice>{offset?'This page is empty. Return to the first page.':'No entries yet. Complete a verified flight to join the ranking.'}</DataNotice>}
     {(offset>0||board.nextOffset!==null)&&<nav className="dao-pagination" aria-label="Ranking pages"><Button disabled={offset===0} onClick={()=>setOffset(Math.max(0,offset-50))}>PREVIOUS</Button><span>{offset+1}–{offset+board.rows.length} / {board.total}</span><Button disabled={board.nextOffset===null} onClick={()=>setOffset(board.nextOffset??offset)}>NEXT</Button></nav>}
    </section>
   </>}
  </>}
  <Button className="primary dao-fly" onClick={onPlay}>PLAY <Icon name="play"/></Button>
  {selected&&createPortal(<div className="modal-backdrop dao-detail-backdrop"><Panel className="dao-detail" role="dialog" aria-modal="true" aria-label="Ranking record" onBack={()=>setSelected(null)} backLabel="CLOSE RECORD" onKeyDown={e=>{if(e.key==='Escape')setSelected(null);}}>
   {detailError?<DataNotice error retry={()=>setDetailReload(n=>n+1)}>{detailError}</DataNotice>:!detail?<DataNotice>Loading verified record…</DataNotice>:<>
    <span className="eyebrow">{detail.kind.toUpperCase()} / VERIFIED RECORD</span><h2>{detail.entry.name}</h2><div className="dao-detail-capital"><b>#{detail.entry.rank}</b><Money value={detail.entry.score}/></div>
    {detail.kind==='startup'?<><h3>MEMBER CONTRIBUTIONS</h3><p className="hint">Each founder contributes their best closing capital.</p><MemberList members={detail.members??[]}/></>:<>
     {detail.startup&&<p className="dao-affiliation">STARTUP <strong>{detail.startup.name}</strong></p>}
     <dl className="dao-stat-grid"><div><dt>VERIFIED FLIGHTS</dt><dd>{detail.summary?.runs??0}</dd></div><div><dt>LANDINGS</dt><dd>{detail.summary?.landings??0}</dd></div></dl>
     {detail.best&&<><h3>PERSONAL BEST BREAKDOWN</h3><dl className="dao-breakdown">{(['initial','earned','lost','bonus'] as const).map(key=><div key={key}><dt>{({initial:'Initial',earned:'Gains',lost:'Losses',bonus:'Landing bonus'})[key]}</dt><dd><Money value={detail.best!.breakdown[key]??0}/></dd></div>)}</dl><p className="hint">{detail.best.outcome==='landed'?`Landed · ${DESTINATIONS.find(d=>d.id===detail.best!.destination)?.name??'Island'}`:detail.best.outcome==='water'?'Lost at sea':'Out of runway'}<br/>Recorded {new Date(detail.best.recordedAt).toLocaleString()}</p></>}
    </>}
   </>}
  </Panel></div>,document.body)}
 </Panel>;
}
