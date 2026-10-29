import {RankingProgress} from './RankingProgress';
import type {CeoSnapshot} from './services/recognition';
import {profile} from './services/session';
import {shopItem} from './shopCatalog';
import {publicUrl} from './urls';
import {sound} from './services/audio';
import {CapitalChart} from './CapitalChart';
import {Button,Panel,NeonFrame,Icon} from './UI';
import{useEffect,useState,useLayoutEffect,useRef}from'react';
import{START_CASH,DESTINATIONS,type State}from'./core/simulation';
import{economicFrame,eventNames}from'./economy';
import{type Ticket}from'./services/session';
import type {Presentation} from './services/presentation';
import{Money}from'./Money';
const cash=(n:number)=><Money value={n}/>;

export function Results({s,rankingBefore,network,unlocks,busy,retry,home,ticket,presentation,drop,openDrop}:{rankingBefore?:CeoSnapshot|null;drop?:string|null;openDrop?:()=>void;presentation:Presentation;s:State;network:string;unlocks:string[];busy:boolean;retry:()=>void;home:()=>void;ticket?:Ticket}){
 const root=useRef<HTMLElement>(null),lastCount=useRef(-1);
 useLayoutEffect(()=>{const el=root.current;if(!el)return;const measure=()=>{const header=el.querySelector('.closing-header')!.getBoundingClientRect(),panel=el.querySelector('.financial-panel')!.getBoundingClientRect(),w=innerWidth,h=innerHeight,side=w>h&&h<=600,top=header.bottom+10,bottom=side?h-16:panel.top-10;presentation.resultFraming={x:side?(panel.left-16)/w/2:.5,y:(top+bottom)/2/h,height:Math.max(.12,Math.min(.34,(bottom-top)/h*.9))};};const observer=new ResizeObserver(measure);observer.observe(el);observer.observe(el.querySelector('.financial-panel')!);observer.observe(el.querySelector('.closing-header')!);measure();el.addEventListener('animationend',measure);return()=>{el.removeEventListener('animationend',measure);observer.disconnect();delete presentation.resultFraming;};},[presentation]);
 const[progress,setProgress]=useState(0),result=s.result!,won=result.outcome==='landed';
 useEffect(()=>{let frame=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;const update=()=>{const u=reduced?1:Math.min(1,Math.max(0,presentation.resultAge-.45)/2);setProgress(u);if(u<1)frame=requestAnimationFrame(update);};frame=requestAnimationFrame(update);return()=>cancelAnimationFrame(frame);},[s,presentation]);
 const frame=economicFrame(s,progress),complete=progress===1,max=Math.max(START_CASH,...s.events.map(e=>e.balance)),lastTick=Math.max(1,s.tick);
 let previous=START_CASH;const points:[number,number][]=[[0,START_CASH]];for(const e of frame.events){points.push([e.tick,previous],[e.tick,e.balance]);previous=e.balance;}points.push([frame.tick,frame.cash]);
 useEffect(()=>{const base=`results:${s.seed}:${s.tick}`;if(progress>0)sound('countStart',{id:base+':start'});if(progress>0&&progress<1&&frame.events.length!==lastCount.current){lastCount.current=frame.events.length;sound('countTick');}if(complete)sound(won?'final':'back',{id:base+':final'});},[progress,complete,frame.events.length,s,won]);
 const totals=[['INITIAL',START_CASH],['GAINS',s.income],['LOSSES',-s.loss],['BONUS',s.bonus]] as const;
 return <section ref={root} className={`results closing-bell cinematic-result ${won?'profit':'failed'} ${complete?'is-settled':'is-replaying'}`} aria-label="Flight results">
 <div className="closing-header"><>{!won&&<NeonFrame/>}<h2>{won?<img className="landed-banner" src={publicUrl('/assets/brand/landed.png')} alt="Welcome to Floripa. Landed."/>:'RUN LOST'}</h2></><p>{s.destination?DESTINATIONS.find(d=>d.id===s.destination)?.name:won?'':'A new venture starts in the plane.'}</p></div>
 <div className="result-bottom"><Panel className="financial-panel">
 <div className="closing-total"><span>FINAL MONEY</span><strong className={(frame.events.at(-1)?.delta||0)<0?'negative':''}>{cash(frame.cash)}</strong></div>
 <div className="closing-chart"><CapitalChart points={points} start={0} end={lastTick} low={0} high={max*1.12} label={`Capital from 5000 to ${result.cashFinal} capital`}/></div>
 <div className="settlement-detail"><div aria-hidden={complete} className={`replay-feed ${!complete?'is-replaying':''}`} aria-label="Financial replay">{frame.events.slice(-3).map((e,i)=><div key={`${e.tick}-${e.sourceId}-${i}`}><span>{eventNames[e.kind]||e.kind}</span><b className={e.delta<0?'negative':'positive'}>{e.delta?<Money value={e.delta} plus/>:<Icon name="check"/>}</b></div>)}</div>
 <div aria-hidden={!complete} className="settlement-log">{totals.map(([label,value])=><div className="settled" key={label}><span>{label}</span><b className={value<0?'negative':'positive'}>{cash(value)}</b></div>)}</div></div>
 </Panel><div className="result-actions">
 <Button className="primary" aria-label="BACK TO PLANE" onClick={home}><Icon name="plane"/> BACK TO PLANE</Button>
 <div className="closing-links"><Button aria-label="ONE MORE RUN" disabled={busy} onClick={retry}>ONE MORE RUN <Icon name="retry"/></Button></div>
 <div className="settlement-receipt">{!complete?<small className="unlock-note">Your flight, event by event…</small>:unlocks.length>0&&<small className="unlock-note">{unlocks[0]}</small>}
 {complete&&won&&drop&&s.rareCollected&&profile.shop!.owned.includes(drop)&&<Button className="drop-result" onClick={openDrop}>VIEW {shopItem(drop)?.name}<Icon name="next"/></Button>}
 <RankingProgress ticket={ticket} before={rankingBefore}/>{network.includes('Local result')&&<small>{network}</small>}
 </div></div></div></section>;
}
