import {Icon} from './ui/Icon';
export {Icon,type IconName} from './ui/Icon';
import {useEffect,useLayoutEffect,useRef,useState,type ReactNode,type ButtonHTMLAttributes,type HTMLAttributes} from 'react';
import {Money} from './Money';
export function NeonFrame(){return <svg className="neon-frame" viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true"><path d="M3 30 32 3H393L410 12H650L666 3H968L997 30V270L968 297H32L3 270Z" fill="#031e2bef" stroke="#00e9ed" strokeWidth="2" vectorEffect="non-scaling-stroke"/><path d="M12 48 46 16H375M687 16H954L986 48V249M955 284H45L16 255V70" fill="none" stroke="#00edeb" strokeWidth="3" vectorEffect="non-scaling-stroke"/><path d="M49 24H190M800 24H950M51 276H190" fill="none" stroke="#9fffe4" strokeWidth="2" vectorEffect="non-scaling-stroke"/></svg>;}
export function Button({className='',children,...props}:ButtonHTMLAttributes<HTMLButtonElement>){
 const ref=useRef<HTMLButtonElement>(null),[size,setSize]=useState([100,48]);
 useLayoutEffect(()=>{const node=ref.current!;const observer=new ResizeObserver(()=>setSize([node.offsetWidth,node.offsetHeight]));observer.observe(node);return()=>observer.disconnect();},[]);
 const [w,h]=size,c=className.includes('icon-button')?8:14;
 return <button {...props} ref={ref} className={`arcade-button ${className}`}><svg className="button-frame" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true"><path d={`M${c} 1H${w-c}L${w-1} ${c}V${h-c}L${w-c} ${h-1}H${c}L1 ${h-c}V${c}Z`} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke"/></svg>{children}</button>;
}
export function Panel({className='',children,onBack,backLabel='BACK',...props}:HTMLAttributes<HTMLElement>&{onBack?:()=>void;backLabel?:string}){
 const ref=useRef<HTMLElement>(null);
 useEffect(()=>{if(props.role!=='dialog')return;const before=document.activeElement as HTMLElement|null;ref.current?.querySelector<HTMLElement>('button,input,a')?.focus();return()=>before?.focus();},[props.role]);
 return <section {...props} ref={ref} className={`arcade-panel ${className} ${onBack?'panel-window':''}`} onKeyDown={e=>{props.onKeyDown?.(e);if(props.role!=='dialog'||e.key!=='Tab')return;const nodes=[...e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),input,a[href]')];const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}>{onBack?<><header className="panel-navigation"><Button className="back" onClick={onBack}><Icon name="back"/>{backLabel}</Button></header><div className="panel-content">{children}</div></>:children}</section>;
}
export function PilotCard({name,image,accent,selected,locked,onClick}:{name:string;image:string;accent:string;selected:boolean;locked?:number;onClick:()=>void}){return <Button className={`pilot-card ${selected?'selected':''}`} style={{'--pilot':accent} as React.CSSProperties} aria-label={locked?`${name} · ${locked} community required`:name} aria-pressed={selected} disabled={!!locked} onClick={onClick}><img src={image} alt=""/><span>{name}</span>{locked?<small><Icon name="gem"/> {locked} COMMUNITY</small>:<small>{selected?'SELECTED':'SELECT PILOT'}</small>}</Button>;}
export function RankingRow({rank,name,value}:{rank:number;name:string;value:number}){return <li className="rank-row"><b>#{rank}</b><span>{name}</span><strong><Money value={value}/></strong></li>;}

/** Retain only the departing UI for 180 ms; navigation and the 3D scene never wait. */
export function Presence({children}:{children:ReactNode}){
 const shown=!!children,last=useRef(children),[retained,setRetained]=useState(shown);
 if(shown)last.current=children;
 useEffect(()=>{if(shown){setRetained(true);return;}const timer=setTimeout(()=>setRetained(false),180);return()=>clearTimeout(timer);},[shown]);
 return shown||retained?<div className={`motion-presence ${shown?'':'is-leaving'}`} inert={!shown} aria-hidden={!shown}>{shown?children:last.current}</div>:null;
}
