import {sound} from './services/audio';
import {useRef,useState,useLayoutEffect,useEffect} from 'react';
import {Button,Icon} from './UI';
import {Money} from './Money';
import {useDialogue,type DialogueFrame,type Expression} from './services/dialogue';
import perks from './perks';
import {profile,transactShop,persist} from './services/session';
import {CatalogIcon} from './ui/CatalogIcon';
import {shopItems,portraitUrl,type ShopItem} from './shopCatalog';

export type ShopPreview={frame?:{x:number;y:number;height:number;width:number};pilot:number;category:ShopItem['category'];canopy:string;trail:string;helmet:string;accessory:string};
const introduction='Welcome to my corner of the cabin. Land flights, bank your SOL, and I’ll help you find your next look.';
export function Shop({preview,onPreview,onBack,onChange,onFrame}:{onFrame:(f:DialogueFrame)=>void;preview:ShopPreview;onPreview:(p:ShopPreview)=>void;onBack:()=>void;onChange:()=>void}){
 const previewViewport=useRef<HTMLDivElement>(null),latest=useRef({preview,onPreview});latest.current={preview,onPreview};
 useLayoutEffect(()=>{const node=previewViewport.current!;const measure=()=>{const b=node.getBoundingClientRect();latest.current.onPreview({...latest.current.preview,frame:{x:(b.x+b.width/2)/innerWidth,y:(b.y+b.height/2)/innerHeight,height:b.height/innerHeight,width:b.width/innerWidth}});};const observer=new ResizeObserver(measure);observer.observe(node);window.addEventListener('resize',measure);measure();return()=>{observer.disconnect();window.removeEventListener('resize',measure);};},[]);
 const [greeting,setGreeting]=useState(!profile.shopIntroSeen),[expression,setExpression]=useState<Expression>('welcome'),[notice,setNotice]=useState(profile.shopIntroSeen?'':introduction),[busy,setBusy]=useState(false);
 useEffect(()=>{if(!profile.shopIntroSeen){profile.shopIntroSeen=true;persist();}},[]);
 const account=profile.shop!,category=preview.category,items:ShopItem[]=category==='accessory'?[{id:'accessory:none',name:'No accessory',category:'accessory',pilot:preview.pilot,price:0,image:portraitUrl(preview.pilot)},...shopItems.filter(i=>i.category==='accessory'&&i.pilot===preview.pilot)]:shopItems.filter(i=>i.category===category);
 const id=category==='pilot'?`pilot:${preview.pilot}`:preview[category],item=items.find(i=>i.id===id)??items[0],none=item.id==='accessory:none',owned=none||account.owned.includes(item.id),equipped=category==='pilot'?profile.pilot===preview.pilot:category==='accessory'?(account.accessories[preview.pilot]||'accessory:none')===item.id:account[category]===item.id,lockedPilot=category==='accessory'&&!account.owned.includes(`pilot:${preview.pilot}`),shortfall=!owned&&!item.goal&&account.balance<item.price;
 const description=item.goal??(category==='pilot'?`${perks[preview.pilot].color} flight suit · ${item.name} LED portrait.`:category==='accessory'?`${perks[preview.pilot].name} LED portrait · ${none?'Original artwork':item.tier+' accessory'}.`:category==='canopy'?`${item.name} canopy · same handling, a new finish.`:category==='helmet'?`${item.name} luminous rims · your LED face stays unchanged.`:`${item.name} trail · ${item.pattern==='smoke'?'Soft drifting clouds':item.pattern==='bubbles'?'Floating iridescent bubbles':item.pattern==='stars'?'Spinning golden stars':item.pattern==='comet'?'Luminous comet streaks':'A bright signature in the sky'}.`);
 const {letters,complete}=useDialogue(notice,expression,0,[],greeting,onFrame,greeting?.8:.12);
 const say=(text:string,face:Expression='curious')=>{setExpression(face);setNotice(text);};
 const choose=(index:number)=>{if(busy)return;sound('select');const i=items[(index+items.length)%items.length];onPreview({...preview,...(category==='pilot'?{pilot:i.pilot!,accessory:account.accessories[i.pilot!]||'accessory:none'}:{[category]:i.id})});say('');};
 const action=async()=>{setBusy(true);try{await transactShop(item.id,!owned,preview.pilot);sound(owned?'equip':'buy');say(owned?`${item.name} equipped. Ready for takeoff.`:`${item.name} is yours. Equipped and saved.`, 'celebrate');onChange();}catch(e){sound('denied');say((e as Error).message,'warning');}finally{setBusy(false);}};
 const browse=()=>{if(letters<notice.length){complete();return;}profile.shopIntroSeen=true;persist();setGreeting(false);say('');};
 return <section className={`shop-screen ${greeting?'shop-conversation':''}`} aria-label="Pilot shop">
  <header className="shop-header"><Button className="back" onClick={onBack}><Icon name="back"/>BACK</Button><Button className="shop-help" disabled={greeting||busy} onClick={()=>{say(introduction,'welcome');setGreeting(true);}}>SHOP GUIDE</Button><div className="shop-balance"><small>YOUR SOL</small><Money value={account.balance}/></div></header>
  <div className="shop-workspace">
   <div ref={previewViewport} className="shop-preview" role="img" aria-label={`${item.name} live 3D preview`}><span>LIVE PREVIEW</span><small>{category==='canopy'?'CANOPY DETAIL':category==='trail'?'TRAIL · REAR VIEW':perks[preview.pilot].name.toUpperCase()}</small>{category==='helmet'&&profile.rares.includes(0)&&<Button className="shop-pattern" aria-pressed={profile.cosmetic===0} onClick={()=>{profile.cosmetic=profile.cosmetic===0?-1:0;persist();onChange();}}>LEGACY HELMET PATTERN {profile.cosmetic===0?'ON':'OFF'}</Button>}</div>
   <section className="shop-catalog" aria-label="Collection">
    <div className="shop-tabs" role="group" aria-label="Shop category">{(['pilot','accessory','canopy','trail','helmet'] as const).map(c=><Button key={c} disabled={busy} aria-pressed={category===c} onClick={()=>{onPreview({...preview,category:c});say('');}}><Icon name={c}/>{c==='pilot'?'PILOTS':c==='accessory'?'ACCESSORIES':c==='canopy'?'PARACHUTES':c==='helmet'?'HELMET':'TRAILS'}</Button>)}</div>
    <div className="shop-catalog-toolbar">{category==='accessory'?<div className="shop-pilot-filter" role="group" aria-label="Accessory pilot">{perks.map((p,i)=><Button key={p.id} data-silent disabled={busy} aria-label={`Accessories for ${p.name}`} aria-pressed={preview.pilot===i} onClick={()=>{sound('select');onPreview({...preview,pilot:i,accessory:account.accessories[i]||'accessory:none'});say('');}}><img src={portraitUrl(i)} alt="" width="40" height="40"/><span>{p.name}</span></Button>)}</div>:<><strong>CHOOSE YOUR {category==='pilot'?'PILOT':category==='canopy'?'CANOPY':category==='helmet'?'LIGHT':'SIGNATURE'}</strong><span>{items.length} designs</span></>}</div>
    <div key={`${category}-${category==='accessory'?preview.pilot:''}`} className="shop-grid" aria-label="Products">{items.map((i,n)=>{const has=i.id==='accessory:none'||account.owned.includes(i.id);return <Button key={i.id} data-silent disabled={busy} className="shop-product" aria-label={i.name} aria-pressed={item.id===i.id} onClick={()=>choose(n)}><div className="shop-product-art"><CatalogIcon item={i}/><span className="shop-tag">{has?'OWNED':i.goal?'CHALLENGE':i.tier??'CLASSIC'}</span></div><strong>{i.name}</strong><span className="shop-product-price">{has?'IN YOUR COLLECTION':i.goal?'FLIGHT REWARD':<Money value={i.price}/>}</span></Button>;})}</div>
   </section>
   <section className="shop-detail" aria-label="Selected product">
    <div className="shop-item-title"><h2>{item.name}</h2><p className="shop-description">{description}</p></div>
    <div className="shop-purchase-row"><div className="shop-price"><small>{owned?'COLLECTION':item.goal?'UNLOCK':'PRICE'}</small>{owned?<strong>OWNED</strong>:item.goal?<strong>FLIGHT GOAL</strong>:<Money value={item.price}/>}</div><Button data-silent className="primary shop-buy" disabled={busy||lockedPilot||equipped&&owned||!!(!owned&&item.goal)||shortfall} onClick={()=>void action()}>{busy?'SAVING…':lockedPilot?'OWN PILOT FIRST':owned?(equipped?'EQUIPPED':'EQUIP'):item.goal?'FLIGHT REWARD':shortfall?'INSUFFICIENT FUNDS':'BUY & EQUIP'}</Button></div>
    <div className="shop-action-detail" role="status">{!greeting&&notice?notice:lockedPilot?`Requires ${perks[preview.pilot].name}. Preview only.`:shortfall?`Earn ${(item.price-account.balance).toLocaleString('en-US')} more SOL.`:!owned&&item.goal?'Unlocks automatically after the required flight.':'Preview freely. Your equipped gear changes only when you confirm.'}</div>

   </section>
  </div>
  {greeting&&<div className="shop-npc" role="status" data-silent><small>FLIGHT CREW / OUTFITTER</small><p aria-label={notice}>{notice.slice(0,letters)}</p><Button className="primary" onClick={browse}>{letters<notice.length?'READ':'LET’S SEE THE GEAR'}<Icon name="next"/></Button></div>}
 </section>;
}
