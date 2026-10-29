import {useSyncExternalStore} from 'react';
import {api,profile} from './session';
export type CeoSnapshot={playerId:string;rank:number|null;score:number;serverNow:number};
export function readCeoSnapshot(data:unknown,playerId:string):CeoSnapshot{
 const b=data as {own?:{id:string;rank:number;score:number}|null;serverNow:number};
 if(!b||!Number.isFinite(b.serverNow)||!('own' in b)||b.own!==null&&(!b.own||b.own.id!==playerId||!Number.isSafeInteger(b.own.rank)||b.own.rank<1||!Number.isFinite(b.own.score)||b.own.score<0))throw new Error('Invalid CEO position');
 return {playerId,rank:b.own?.rank??null,score:b.own?.score??0,serverNow:b.serverNow};
}
export function crownPlace(s:CeoSnapshot|null):1|2|3|null{return s&&s.score>0&&s.rank!==null&&s.rank<=3?s.rank as 1|2|3:null;}
export function rankMovement(before:CeoSnapshot|null,after:CeoSnapshot){
 const known=before?.playerId===after.playerId,b=known?before!.rank:null,a=after.rank;
 return {delta:known&&b!==null&&a!==null?b-a:null,enteredTop3:known&&a!==null&&a<=3&&(b===null||b>3),enteredTop10:known&&a!==null&&a<=10&&(b===null||b>10)};
}
let current:CeoSnapshot|null=null,inflight:Promise<CeoSnapshot|null>|null=null;
const listeners=new Set<()=>void>();
const emit=(next:CeoSnapshot|null)=>{current=next;listeners.forEach(fn=>fn());};
export function acceptCeoSnapshot(data:unknown){const id=profile.identity?.id;if(!id)return;const next=readCeoSnapshot(data,id);if(!current||current.playerId!==id||next.serverNow>=current.serverNow)emit(next);}
export function useCeoSnapshot(){return useSyncExternalStore(fn=>{listeners.add(fn);return()=>listeners.delete(fn);},()=>current?.playerId===profile.identity?.id?current:null);}
/** Server-confirmed CEO only. Failed refresh removes recognition, never guesses a rank. */
export function refreshCeoRank(fresh=false):Promise<CeoSnapshot|null>{
 if(inflight)return fresh?inflight.then(()=>refreshCeoRank()):inflight;
 const id=profile.identity?.id;if(!id){emit(null);return Promise.resolve(null);}
 inflight=api<unknown>('leaderboard?kind=ceo').then(data=>{if(profile.identity?.id!==id)return null;const next=readCeoSnapshot(data,id);emit(next);return next;}).catch(()=>{emit(null);return null;}).finally(()=>{inflight=null;});return inflight;
}
export function clearCeoRank(){emit(null);}
