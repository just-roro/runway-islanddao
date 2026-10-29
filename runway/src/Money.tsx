import {Icon} from './ui/Icon';
import {publicUrl} from './urls';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {eventNames,financialWindow,feedEntries} from './economy';
import {activeImpact,type Presentation} from './services/presentation';
import {CapitalChart} from './CapitalChart';
import type {CashEvent} from './core/simulation';
export const formatCapital=(n:number)=>Math.round(Math.abs(n)).toLocaleString('en-US');
const coin=new Image();coin.src=publicUrl('/assets/brand/sol-coin.webp');
const brand=new Image();brand.src=publicUrl('/assets/brand/runway-official.png');
export const prepareMoney=Promise.all([coin.decode().catch(()=>{}),brand.decode().catch(()=>{})]);
export function Money({value,plus=false}:{value:number;plus?:boolean}){const [ready,setReady]=useState(false),icon=useRef<HTMLImageElement>(null);useLayoutEffect(()=>{const img=icon.current;if(img?.complete&&img.naturalWidth)setReady(true);},[]);return <span className={`money-value ${ready?'money-ready':'money-loading'}`} aria-label={`${value<0?'minus ':plus&&value>0?'plus ':''}${formatCapital(value)} capital`}>{value<0?'−':plus&&value>0?'+':''}<img ref={icon} src={publicUrl('/assets/brand/sol-coin.webp')} alt="" onLoad={()=>setReady(true)}/>{formatCapital(value)}</span>;}
export function CashNumber({value,presentation}:{value:number;presentation:Presentation}){
 const events=presentation.cues,index=events.length,lastIndex=useRef(0),moneyEvent=[...events].reverse().find(e=>e.delta!==0),event=activeImpact(presentation)??moneyEvent,recent=event&&presentation.time-event.at<1.1?event:undefined;
 const root=useRef<HTMLElement>(null),content=useRef<HTMLSpanElement>(null),spring=useRef({x:1,v:0,combo:0,last:-1000,lossUntil:-1,strength:0}),text=formatCapital(value);
 useEffect(()=>{const node=root.current;if(!node)return;const ctx=document.createElement('canvas').getContext('2d')!;const fit=()=>{ctx.font='700 100px Rajdhani';node.style.fontSize=Math.min(80,(node.clientWidth-12)*100/(ctx.measureText(text).width+92)/1.15)+'px';};const observer=new ResizeObserver(fit);observer.observe(node);void document.fonts.ready.then(fit);fit();return()=>observer.disconnect();},[text.length]);
 useEffect(()=>{const pending=events.slice(lastIndex.current);lastIndex.current=events.length;for(const event of pending){if(!event.delta)continue;const s=spring.current,positive=event.delta>0,impact=Math.min(1,Math.log1p(Math.abs(event.delta)/15000)/Math.log(11));s.combo=positive&&event.at-s.last<.8?Math.min(5,s.combo+1):positive?1:0;s.last=event.at;
 if(!positive){s.strength=0;s.lossUntil=event.at+.48;s.x=Math.min(1,s.x);s.v=-2-impact*2;}else if(event.at>s.lossUntil){s.strength=Math.min(.11,.018+s.combo*.014+impact*.032);s.v=Math.min(2,s.v+.35+impact*.5);}
 }},[index,events]);
 useEffect(()=>{let frame=0,last=presentation.time;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;const update=()=>{const dt=Math.min(.05,Math.max(0,presentation.time-last));last=presentation.time;const s=spring.current;for(let left=dt;left>0;){const h=Math.min(left,1/120);const age=presentation.time-s.last,target=presentation.time<s.lossUntil?.96:1+s.strength*Math.max(0,1-Math.max(0,age-.3)/1.2);s.v+=((target-s.x)*240-s.v*20)*h;s.x+=s.v*h;if(s.x<.94){s.x=.94;s.v=Math.max(0,s.v);}if(s.x>1.15){s.x=1.15;s.v=Math.min(0,s.v);}left-=h;}if(content.current)content.current.style.transform=`scale(${reduced?1:s.x})`;frame=requestAnimationFrame(update);};frame=requestAnimationFrame(update);return()=>cancelAnimationFrame(frame);},[presentation]);
 return <strong ref={root} className={`cash-number ${recent?.delta?(recent.delta<0?'cash-loss':'cash-gain'):''}`}><span ref={content} className="cash-content"><Money value={value}/></span></strong>;
}
export function FinancialSparkline({events,tick,presentation}:{events:CashEvent[];tick:number;presentation:Presentation}){
 const data=financialWindow(events,tick),domain=useRef({low:data.low,high:data.high,time:presentation.time}),last=[...presentation.cues].reverse().find(e=>e.delta!==0),event=activeImpact(presentation)??last,age=event?presentation.time-event.at:9;
 const dt=Math.max(0,presentation.time-domain.current.time),mix=1-Math.exp(-dt*9);domain.current.low+=(data.low-domain.current.low)*mix;domain.current.high+=(data.high-domain.current.high)*mix;domain.current.time=presentation.time;
 const lo=Math.min(domain.current.low,data.low),hi=Math.max(domain.current.high,data.high),chain=presentation.cues.filter(e=>e.delta>0&&presentation.time-e.at<.8).length,intensity=age<.8?Math.min(1,Math.abs(event!.delta)/150000+chain*.12)*(1-age/.8):0;
 return <CapitalChart className={`financial-sparkline ${age<1.1?(event!.delta<0?'loss':'gain'):''}`} points={data.points} start={data.start} end={data.end} low={lo} high={hi} label={`Capital history, last ten seconds: ${data.balance}`} intensity={intensity}/>;
}
export function EconomicFeed({events,tick}:{events:CashEvent[];tick:number}){const visible=feedEntries(events).filter(e=>tick-e.tick<240).slice(-3);return <div className="economic-feed" aria-label="Recent flight events">{visible.map((e,i)=>{const age=(tick-e.tick)/60,rank=visible.length-1-i,opacity=rank>1?0:Math.min(1,age/.18,(4-age)/.65);return <div key={e.index} aria-hidden={rank>1} className={e.delta<0?'loss':e.delta>0?'gain':'utility'} style={{'--impact':Math.min(1,Math.abs(e.delta)/150000),opacity:Math.max(0,opacity),transform:`translateY(${rank*35}px)`} as React.CSSProperties}><b>{e.delta?<Money value={e.delta} plus/>:<Icon name="gem"/>}</b><span>{eventNames[e.kind]||e.kind}{e.count>1?` ×${e.count}`:''}</span></div>;})}</div>;}
