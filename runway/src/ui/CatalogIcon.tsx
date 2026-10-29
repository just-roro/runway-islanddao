import {useId} from 'react';
import {portraitUrl,type ShopItem} from '../shopCatalog';

// Catalog illustrations use the same colors/pattern keys as the live finishes.
// Original NFT portraits remain original pixels; no gameplay screenshots.
export function CatalogIcon({item}:{item:ShopItem}){
 const id=useId().replaceAll(':',''),c=item.color??'#67e9ff',s=item.secondary??(item.category==='canopy'?'#09394f':'#effcff'),p=item.pattern;
 if(item.category==='pilot'||item.category==='accessory')return <img className="catalog-portrait" src={portraitUrl(item.pilot??0,item.category==='accessory'?item.id:undefined)} alt="" loading="lazy" decoding="async" width="256" height="256"/>;
 const star='0,-14 4,-4 14,0 4,4 0,14 -4,4 -14,0 -4,-4';
 return <svg className="catalog-art" viewBox="0 0 256 256" aria-hidden="true" data-pattern={p??'classic'}>
  <defs>
   <linearGradient id={`${id}g`} x2="1" y2="1"><stop stopColor={c}/><stop offset=".5" stopColor={p==='original'?'#b787ff':s}/><stop offset="1" stopColor={c}/></linearGradient>
   <radialGradient id={`${id}orb`} cx=".32" cy=".22"><stop stopColor="#345777"/><stop offset=".5" stopColor="#102239"/><stop offset="1" stopColor="#020c1b"/></radialGradient>
   <pattern id={`${id}pattern`} width="32" height="32" patternUnits="userSpaceOnUse">
    <rect width="32" height="32" fill={c}/>
    {p==='checker'?<path d="M0 0h16v16H0zM16 16h16v16H16z" fill={s}/>:p==='waves'?<path d="M-8 18Q0 0 16 16T40 14" fill="none" stroke={s} strokeWidth="10"/>:p==='stars'?<polygon points={star} transform="translate(16 16) scale(.55)" fill={s}/>:<path d="M0 0h8v32H0z" fill={s} opacity=".65"/>}
   </pattern>
   <clipPath id={`${id}wing`}><path d="M23 106Q33 37 128 38Q224 37 233 106L216 144Q175 99 128 99Q79 99 40 144Z"/></clipPath>
  </defs>
  {item.category==='canopy'?<>
   <g stroke="#bde9ff" strokeWidth="1.7" opacity=".65">{[40,64,96,160,192,216].map((x,i)=><path key={x} d={`M${x} 113L${i<3?112:144} 211`}/>)}</g>
   <g clipPath={`url(#${id}wing)`}>
    <rect x="20" y="30" width="216" height="120" fill={p==='solid'?c:p==='aurora'?`url(#${id}g)`:p==='split'?c:`url(#${id}pattern)`}/>
    {p==='split'&&<rect x="128" y="25" width="110" height="125" fill={s}/>}
    {[42,69,98,128,158,187,214].map(x=><path key={x} d={`M${x} 30Q${128+(x-128)*1.15} 70 ${x} 144`} stroke="#052138" opacity=".35" fill="none" strokeWidth="3"/>)}
    <path d="M25 81Q125 6 231 81" fill="none" stroke="white" strokeWidth="17" opacity=".22"/>
   </g>
   <path d="M23 106Q33 37 128 38Q224 37 233 106L216 144Q175 99 128 99Q79 99 40 144Z" stroke="#072236" strokeWidth="5" fill="none"/>
   <path d="M108 209h40v10h-40z" fill="#b7d6df"/><path d="M115 213h26" stroke={c} strokeWidth="5"/>
  </>:item.category==='helmet'?<>
   <circle cx="128" cy="130" r="91" fill={`url(#${id}orb)`} stroke="#6a8ca6" strokeWidth="3"/>
   <path d="M59 75Q128 39 197 75M58 186Q128 219 198 186" fill="none" stroke={c} strokeWidth="18" opacity=".2"/>
   <path d="M59 75Q128 39 197 75" fill="none" stroke={p==='solid'||p==='duo'?c:`url(#${id}g)`} strokeWidth="8" strokeDasharray={p==='chase'?'7 7':p==='circuit'?'22 5 4 5':undefined}/>
   <path d="M58 186Q128 219 198 186" fill="none" stroke={p==='duo'?s:p==='solid'?c:`url(#${id}g)`} strokeWidth="8" strokeDasharray={p==='chase'?'7 7':p==='circuit'?'22 5 4 5':undefined}/>
   <g fill="#a4c9db" opacity=".6">{[92,156].map(x=><rect key={x} x={x-6} y="115" width="12" height="19" rx="2"/>)}<path d="M104 157h48v5h-48z"/></g>
   <path d="M61 100Q67 86 81 82" fill="none" stroke="white" opacity=".5" strokeWidth="5" strokeLinecap="round"/>
  </>:<>
   <path d="M25 217Q35 126 122 127T218 39" stroke={c} strokeWidth={p==='smoke'?32:12} opacity=".14" fill="none"/>
   {Array.from({length:15},(_,i)=>{const x=32+i*13,y=211-i*11+Math.sin(i*.65)*19,size=.35+i*.065;return <g key={i} transform={`translate(${x+(i%2?9:-9)} ${y}) scale(${size})`}>
    {p==='bubbles'?<><circle r="13" fill={c} fillOpacity=".12" stroke={c} strokeWidth="2"/><path d="M-8 0Q-8 -8 0 -8" stroke={s} strokeWidth="2" fill="none"/></>:p==='smoke'?<><circle r="18" fill={c} opacity=".4"/><circle cx="-7" cy="-6" r="11" fill={s} opacity=".4"/></>:p==='comet'?<><path d="M-28 32L0 -10 8 0Z" fill={c} opacity=".7"/><polygon points={star} fill={s}/></>:<polygon points={p==='stars'?'0,-16 5,-5 17,-5 8,3 11,16 0,9 -11,16 -8,3 -17,-5 -5,-5':star} fill={i%3===0?s:c} transform={`rotate(${i*17})`}/>}</g>;})}
  </>}
 </svg>;
}
