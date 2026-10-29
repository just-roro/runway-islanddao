import {useEffect,useState} from 'react';
import {Button,Icon} from './UI';
import {flushQueue,submissionState,type Ticket} from './services/session';
import {refreshCeoRank,rankMovement,type CeoSnapshot} from './services/recognition';
type Status='updating'|'ready'|'offline'|'practice'|'rejected';
export function RankingProgress({ticket,before}:{ticket?:Ticket;before?:CeoSnapshot|null}){
 const [status,setStatus]=useState<Status>('updating'),[after,setAfter]=useState<CeoSnapshot|null>(null),[attempt,setAttempt]=useState(0);
 useEffect(()=>{let alive=true,timer:ReturnType<typeof setTimeout>;
  setAfter(null);setStatus('updating');
  async function sync(){
   await flushQueue();if(!alive)return;
   const state=submissionState(ticket);
   if(state==='practice'||state==='rejected'){setStatus(state);return;}
   if(state==='pending'){setStatus(navigator.onLine?'updating':'offline');timer=setTimeout(()=>void sync(),4000);return;}
   // The upload acknowledgement precedes this query, including concurrent queue flushes.
   const snapshot=await refreshCeoRank(true);if(!alive)return;
   if(snapshot){setAfter(snapshot);setStatus('ready');}else setStatus('offline');
   timer=setTimeout(()=>void sync(),20000);
  }
  void sync();const online=()=>setAttempt(n=>n+1);window.addEventListener('online',online);
  return()=>{alive=false;clearTimeout(timer);window.removeEventListener('online',online);};
 },[ticket,before,attempt]);
 const movement=after?rankMovement(before??null,after):null;
 const label=(s:CeoSnapshot|null|undefined)=>s?s.rank===null?'UNRANKED':`#${s.rank}`:'UNAVAILABLE';
 return <div className={`rank-progress ${status}`} role="status" aria-label="CEO ranking progress">
  {status==='ready'&&after?<><span className="rank-progress-title"><Icon name="trophy"/> CEO RANKING</span><div className="rank-places"><span><small>BEFORE FLIGHT</small><b>{label(before)}</b></span><Icon name="next"/><span><small>NOW</small><b key={`${after.playerId}:${after.rank}`} className="rank-new">{label(after)}</b></span><strong className={movement!.delta!==null&&movement!.delta<0?'negative':'positive'}>{movement!.delta===null?!before?'NO COMPARISON':before.rank===null&&after.rank!==null?'FIRST ENTRY':'NO RANKED POSITION':movement!.delta===0?'HELD POSITION':`${Math.abs(movement!.delta)} ${movement!.delta>0?'GAINED':'LOST'}`}</strong></div>{(movement!.enteredTop3||movement!.enteredTop10)&&<small className="rank-milestone">{movement!.enteredTop3?'WELCOME TO THE TOP 3':'WELCOME TO THE TOP 10'}</small>}</>:status==='practice'?<span>Practice flight · outside the CEO ranking</span>:status==='rejected'?<span>Flight not verified · no ranking update</span>:status==='offline'?<><span>Ranking unavailable · waiting for connection</span><Button onClick={()=>setAttempt(n=>n+1)}><Icon name="retry"/> RETRY</Button></>:<span>Updating CEO ranking…</span>}
 </div>;
}
