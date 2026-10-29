import perks from './perks';
import accessories from './assets/accessories.json';
import {rng,type State} from './core/simulation';
import {publicUrl} from './urls';
export type Tier='basic'|'intermediate'|'premium';
export type Category='pilot'|'accessory'|'canopy'|'trail'|'helmet';
export type DropAttempt={seed:number;item:string|null;status:'active'|'abandoned'|'settled'};
export type ShopAccount={version:2;balance:number;earned:number;owned:string[];receipts:string[];canopy:string;trail:string;helmet:string;accessories:Record<string,string>;attempts:Record<string,DropAttempt>};
export type LegacyShop=Omit<ShopAccount,'version'|'helmet'|'accessories'|'attempts'>&{version:1};
export type ShopItem={id:string;name:string;category:Category;price:number;pilot?:number;color?:string;secondary?:string;tier?:Tier;pattern?:string;image?:string;goal?:string};
export const PRICES={basic:1000000,intermediate:5000000,premium:15000000};
export const DROP_WEIGHTS={basic:4,intermediate:2,premium:1};
const variants=(category:Category,rows:[string,string,string,string,string,Tier][]):ShopItem[]=>rows.map(([id,name,color,secondary,pattern,tier])=>({id:`${category}:${id}`,name,category,color,secondary,pattern,tier,price:PRICES[tier]}));
export const shopItems:ShopItem[]=[
 ...perks.map((p,i)=>({id:`pilot:${i}`,name:p.name,category:'pilot' as const,pilot:i,image:p.image,price:[0,2000000,2500000,3000000,4000000,5000000,6000000,8000000,10000000,0,0,0][i],goal:i===9?'Land at Jurerê':i===10?'Land without taking a hit':i===11?'Complete two ring sequences in one successful flight':undefined})),
 ...[['sunrise','Sunrise','#ffdb14',0],['lagoon','Lagoon','#42e9cd',750000],['orchid','Orchid','#d28cff',1500000],['coral','Coral','#ff795f',2500000]].map(([id,name,color,price])=>({id:`canopy:${id}`,name:String(name),category:'canopy' as const,color:String(color),price:Number(price)})),
 ...[['air','Air','#e3f9ff',0],['mint','Mint','#50ffb5',750000],['violet','Violet','#bc83ff',1500000],['gold','Gold','#ffdc62',2500000]].map(([id,name,color,price])=>({id:`trail:${id}`,name:String(name),category:'trail' as const,color:String(color),price:Number(price)})),
 ...accessories.map(a=>({...a,category:'accessory' as const,tier:a.tier as Tier,color:perks[a.pilot].accent,image:publicUrl(a.image)})),
 ...variants('canopy',[
 ['azure','Azure','#319dff','#f1faff','solid','basic'],['pearl','Pearl','#fff6e1','#c9e9f5','solid','basic'],
 ['tropical','Tropical Split','#20c99b','#ffcf43','split','intermediate'],['sunset','Sunset Duo','#ff775c','#7735ab','split','intermediate'],
 ['racing','Racing Checker','#f9fbdf','#082b42','checker','intermediate'],['ocean','Ocean Waves','#16b8e5','#073d8b','waves','intermediate'],
 ['constellation','Constellation','#25245d','#ffe8a4','stars','premium'],['aurora','Aurora','#17e2b4','#9d54e8','aurora','premium']]),
 ...variants('trail',[
 ['sky','Sky','#50bfff','#ffffff','glare','basic'],['coral','Coral','#ff8275','#ffffff','glare','basic'],
 ['stars','Golden Stars','#ffd45b','#fff5b7','stars','intermediate'],['bubbles','Bubbles','#74e8ff','#e0fcff','bubbles','intermediate'],
 ['mist','Cloud Mist','#c4e2f2','#eefaff','smoke','premium'],['comet','Comet','#b18aff','#5cf2e8','comet','premium']]),
 {id:'helmet:original',name:'Original',category:'helmet',price:0,color:'#42e9cd',pattern:'original'},
 ...variants('helmet',[
 ['lagoon','Lagoon','#42e9cd','#42e9cd','solid','basic'],['solar','Solar','#ffc83e','#ffc83e','solid','basic'],['violet','Violet','#c078ff','#c078ff','solid','basic'],
 ['sunset','Sunset','#ff8b54','#be49ef','gradient','intermediate'],['duo','Duo Tone','#43e9ff','#ff669a','duo','intermediate'],['pixels','Pixel Chase','#6effaf','#2d7dff','chase','intermediate'],
 ['aurora','Aurora','#50f2c9','#c47aff','aurora','premium'],['circuit','Gold Circuit','#ffd34b','#fff2ba','circuit','premium']])
];
export const shopItem=(id:string)=>shopItems.find(i=>i.id===id);
export const shopColor=(id:string)=>shopItem(id)?.color??'#ffffff';
export function portraitUrl(pilot:number,accessory?:string){const item=accessory?shopItem(accessory):undefined;return item?.category==='accessory'&&item.pilot===pilot?item.image!:publicUrl(`/assets/cosmetics/${perks[pilot].id}-none.png`);}
export function newShop():ShopAccount{return {version:2,balance:0,earned:0,owned:['pilot:0','canopy:sunrise','trail:air','helmet:original'],receipts:[],canopy:'canopy:sunrise',trail:'trail:air',helmet:'helmet:original',accessories:{},attempts:{}};}
export function migrateShop(previous:{community:number;pilot:number;rares:number[]},existing?:ShopAccount|LegacyShop):ShopAccount{
 if(existing?.version===2)return existing;
 if(existing)return {...existing,version:2,owned:[...new Set([...existing.owned,'helmet:original'])],helmet:'helmet:original',accessories:{},attempts:{}};
 const legacyCount=Math.min(12,3+[1,3,6,10,15,21,28,36,45].filter(n=>previous.community>=n).length);
 return {...newShop(),owned:[...new Set([...Array.from({length:legacyCount},(_,i)=>`pilot:${i}`),`pilot:${previous.pilot}`,'canopy:sunrise','trail:air','helmet:original',...(previous.rares.includes(1)?['canopy:orchid']:[])])],canopy:previous.rares.includes(1)?'canopy:orchid':'canopy:sunrise'};
}
export function selectDrop(account:ShopAccount,seed:number):string|null{
 const pool=shopItems.filter(i=>i.category==='accessory'&&account.owned.includes(`pilot:${i.pilot}`)&&!account.owned.includes(i.id));
 if(!pool.length)return null;
 let ticket=rng(seed^0x4e465442)()*pool.reduce((sum,i)=>sum+DROP_WEIGHTS[i.tier!],0);
 return (pool.find(i=>(ticket-=DROP_WEIGHTS[i.tier!])<0)??pool.at(-1))!.id;
}
export function settleShop(account:ShopAccount,id:string,s:State){
 if(!s.result||account.receipts.includes(id))return {account,credited:0,unlocks:[] as string[]};
 const landed=s.result.outcome==='landed',credit=landed?Math.max(0,Math.floor(s.result.cashFinal)):0,attempt=account.attempts[id];
 const drop=landed&&s.rareCollected&&attempt?.status==='active'&&attempt.seed===s.seed&&attempt.item&&shopItem(attempt.item)?.category==='accessory'?attempt.item:null;
 const goals=landed?[...(s.destination==='jurere'?['pilot:9']:[]),...(s.hazardHits===0?['pilot:10']:[]),...(s.events.filter(e=>e.kind==='sequence-complete').length>=2?['pilot:11']:[]),...(drop?[drop]:[])]:[];
 const unlocks=goals.filter(item=>!account.owned.includes(item));
 return {account:{...account,balance:account.balance+credit,earned:account.earned+credit,owned:[...account.owned,...unlocks],receipts:[...account.receipts,id],attempts:{...account.attempts,...(attempt?{[id]:{...attempt,status:'settled' as const}}:{})}},credited:credit,unlocks};
}
export function purchase(account:ShopAccount,id:string):ShopAccount{
 const item=shopItem(id);if(!item)throw new Error('Item unavailable.');
 if(item.category==='accessory'&&!account.owned.includes(`pilot:${item.pilot}`))throw new Error(`Own ${perks[item.pilot!].name} first.`);
 if(account.owned.includes(id))return account;
 if(item.goal)throw new Error(item.goal);
 if(account.balance<item.price)throw new Error('Not enough SOL. Land another flight to earn more.');
 return {...account,balance:account.balance-item.price,owned:[...account.owned,id]};
}
