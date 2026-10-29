import {useId} from 'react';
import {capitalSegments} from './economy';

/** The vertices are actual ledger balances. Only projection/reveal is animated. */
export function CapitalChart({points,start,end,low,high,reveal=1,className='',label,intensity=0}:{points:[number,number][];start:number;end:number;low:number;high:number;reveal?:number;className?:string;label:string;intensity?:number}){
 const id=useId().replace(/:/g,''),x=(t:number)=>12+(t-start)/Math.max(1,end-start)*976,y=(v:number)=>146-(v-low)/Math.max(1,high-low)*130;
 const projected=points.map(([t,v])=>[x(t),y(v)] as [number,number]),last=projected.at(-1)!,segments=capitalSegments(points),clip=Math.max(0,Math.min(1,reveal))*976+12;
 return <svg className={`capital-chart ${className}`} viewBox="0 0 1000 160" preserveAspectRatio="none" role="img" aria-label={label} style={{'--intensity':intensity} as React.CSSProperties}>
  <defs><linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#3bffae" stopOpacity=".24"/><stop offset="1" stopColor="#3bffae" stopOpacity="0"/></linearGradient><clipPath id={`${id}-clip`}><rect width={clip} height="160"/></clipPath></defs>
  <g clipPath={`url(#${id}-clip)`}>
   <path d={`M ${projected[0].join(' ')} ${projected.slice(1).map(p=>`L ${p.join(' ')}`).join(' ')} L ${last[0]} 160 L ${projected[0][0]} 160 Z`} fill={`url(#${id}-fill)`}/>
   {segments.map((s,i)=><path key={i} data-direction={s.direction} d={`M ${x(s.from[0])} ${y(s.from[1])} L ${x(s.to[0])} ${y(s.to[1])}`} fill="none" stroke={s.direction==='loss'?'#ff637d':'#67ffc1'} strokeWidth={2.5+intensity*1.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round"/>)}
  </g>
  <circle className="chart-tip" cx={Math.min(last[0],clip)} cy={last[1]} r={4+intensity*2} fill={segments.at(-1)?.direction==='loss'?'#ff637d':'#b4ffdf'} vectorEffect="non-scaling-stroke"/>
 </svg>;
}
