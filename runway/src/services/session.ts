import {migrateShop,newShop,settleShop,purchase,shopItems,selectDrop,type ShopAccount} from '../shopCatalog';
import { CONTENT, RULES, type State } from '../core/simulation';
export type Profile={shop?:ShopAccount;shopIntroSeen?:boolean;tutorialSeen?:boolean;tutorialVersion?:string;sfxVolume:number;musicVolume:number;musicMuted:boolean;bestVersion?:string;onboarded?:boolean;nickname:string;pilot:number;suit:number;cosmetic:number;controlVersion?:string;control:'tilt'|'touch';muted:boolean;completed:number;community:number;best:number;achievements:string[];rares:number[];identity?:{id:string;token:string};startupName:string};
const defaults:Profile={nickname:'',pilot:0,suit:0,cosmetic:-1,control:'tilt',muted:false,sfxVolume:.8,musicVolume:.6,musicMuted:false,completed:0,community:0,best:0,achievements:[],rares:[],startupName:''};
export let storageAvailable=true;
export function read<T>(key:string,fallback:T):T {try{return JSON.parse(localStorage.getItem('runway.'+key)||'null')??fallback;}catch{storageAvailable=false;return fallback;}}
export function save(key:string,value:unknown){try{localStorage.setItem('runway.'+key,JSON.stringify(value));}catch{storageAvailable=false;}}
const stored=read<Partial<Profile>>('profile',{});
export const profile:Profile={...defaults,...stored};
profile.shop=Object.keys(stored).length?migrateShop(profile,stored.shop):newShop();
// Save the migration once; never infer a lifetime balance from PB or run count.
save('profile',profile);
// Earlier touch takeover persisted accidentally; offer the sensor once after upgrading.
if(profile.controlVersion!=='rush-19'){profile.control='tilt';profile.controlVersion='rush-19';}
if(profile.bestVersion!==RULES){profile.best=0;profile.bestVersion=RULES;}
export function persist(){const latest=read<Partial<Profile>>('profile',{});if(latest.shop)profile.shop=latest.shop;save('profile',profile);}
export function unlockedPilots(){return profile.shop!.owned.filter(id=>id.startsWith('pilot:')).length;}
export async function complete(s:State,competitive:boolean,runId:string){
 const apply=()=>{
  const latest={...profile,...read<Partial<Profile>>('profile',{})};latest.shop=migrateShop(latest,latest.shop);
  if(!s.result||latest.shop.receipts.includes(runId))return [];
  const settled=settleShop(latest.shop,runId,s),oldAchievements=[...latest.achievements];latest.shop=settled.account;
  latest.achievements=[...latest.achievements];latest.rares=[...latest.rares];latest.completed++;latest.community+=s.community;
  if(competitive)latest.best=Math.max(latest.best,s.result.cashFinal);
  const add=(a:string)=>{if(!latest.achievements.includes(a))latest.achievements.push(a);};
  if(s.landed){add('First landing');if(s.hazardHits===0)add('Untouchable');if(s.landingQuality>=475)add('Perfect landing');}
  if(s.result.status==='funded')add('Funded'); // Rare Cargo is settled with capital above, only after landing.
  try{localStorage.setItem('runway.profile',JSON.stringify(latest));}catch{return ['Browser storage unavailable · shop credit could not be saved'];}
  Object.assign(profile,latest);
  return [...settled.unlocks.map(id=>`${shopItems.find(i=>i.id===id)?.name} unlocked`),...latest.achievements.filter(a=>!oldAchievements.includes(a))];
 };
 return navigator.locks?navigator.locks.request('runway-shop',apply):apply();
}
// Read-modify-write under a browser lock also serializes purchases in other tabs.
export async function transactShop(id:string,buy:boolean,accessoryPilot=profile.pilot){
 const apply=()=>{
  const latest=read<Partial<Profile>>('profile',profile),current=migrateShop({...profile,...latest},latest.shop),item=shopItems.find(i=>i.id===id);
  if(id==='accessory:none'){if(!current.owned.includes(`pilot:${accessoryPilot}`))throw new Error('Own this pilot first.');const updated={...profile,...latest,shop:{...current,accessories:{...current.accessories,[accessoryPilot]:''}}};try{localStorage.setItem('runway.profile',JSON.stringify(updated));}catch{throw new Error('Storage is unavailable. Equipment was not saved.');}Object.assign(profile,updated);return;}
  if(!item)throw new Error('Item unavailable.');
  if(item.category==='accessory'&&!current.owned.includes(`pilot:${item.pilot}`))throw new Error('Own this pilot first.');
  const next=buy?purchase(current,id):current;
  if(!next.owned.includes(id))throw new Error('Unlock this item first.');
  const updated={...profile,...latest,shop:{...next}};
  if(item.category==='pilot')updated.pilot=item.pilot!;
  else if(item.category==='canopy'){updated.shop.canopy=id;updated.cosmetic=updated.cosmetic===1?-1:updated.cosmetic;}
  else if(item.category==='accessory')updated.shop.accessories={...next.accessories,[item.pilot!]:id};
  else if(item.category==='helmet')updated.shop.helmet=id;
  else updated.shop.trail=id;
  // Do not debit/equip in memory if the browser cannot persist the transaction.
  try{localStorage.setItem('runway.profile',JSON.stringify(updated));}catch{throw new Error('Storage is unavailable. Your SOL has not been spent.');}
  Object.assign(profile,updated);
 };
 if(navigator.locks)await navigator.locks.request('runway-shop',apply);else apply();
}
const API=import.meta.env.VITE_API_URL||(import.meta.env.DEV?'/api':'https://runway-api.agenciahumanfriendly.chatgpt.site/api');
export class APIError extends Error{constructor(message:string,public status:number){super(message);}}
export async function api<T>(path:string,body?:unknown):Promise<T>{const c=new AbortController(),timer=setTimeout(()=>c.abort(),6000);try{const identity=profile.identity;const response=await fetch(`${API}/${path}`,{method:body===undefined?'GET':'POST',headers:{...(body===undefined?{}:{'content-type':'application/json'}),...(identity?{authorization:`Bearer ${identity.id}.${identity.token}`}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:c.signal});const data=await response.json();if(!response.ok)throw new APIError(data.error||'Service unavailable',response.status);return data;}finally{clearTimeout(timer);}}
let identifying:Promise<void>|null=null;
export function identify(){if(identifying)return identifying;identifying=(async()=>{if(!profile.identity){const guest=await api<{id:string;token:string}>('guest',{nickname:profile.nickname});profile.identity={id:guest.id,token:guest.token};persist();}else await api('guest',{nickname:profile.nickname});})().finally(()=>{identifying=null;});return identifying;}
export type Ticket={id:string;seed:number;rules:string;content:string;expires:number};
export async function getTicket(){await identify();const ticket=await api<Ticket>('tickets',{});if(ticket.rules!==RULES||ticket.content!==CONTENT)throw new Error('Game update required');return ticket;}
export type Queued={ticket:string;frames:number[][];identity:string;created:number;status?:string};
let queue:Queued[]=read('queue',[]),flushing:Promise<void>|null=null;
export function pendingCount(){return queue.filter(q=>!q.status).length;}
export function enqueue(ticket:Ticket,frames:number[][]){queue.push({ticket:ticket.id,frames,identity:profile.identity?.id||'',created:Date.now()});queue=queue.slice(-20);save('queue',queue);}
export function flushQueue():Promise<void>{if(flushing)return flushing;flushing=(async()=>{for(const item of [...queue]){if(item.identity!==profile.identity?.id||item.status)continue;try{await api('runs',{ticket:item.ticket,frames:item.frames});queue=queue.filter(q=>q.ticket!==item.ticket);}catch(e){if(e instanceof APIError&&[400,403,409,410,413].includes(e.status)){item.status=e.message;}else break;}save('queue',queue);}})().finally(()=>{flushing=null;});return flushing;}
export function runSubmission(ticket?:Ticket){if(!ticket)return '';const item=queue.find(q=>q.ticket===ticket.id);return item?.status?`Local result · ${item.status}`:item?'Ranking pending · will retry online':'Run verified · ranking updated';}

export function submissionState(ticket?:Ticket){if(!ticket)return 'practice';const item=queue.find(q=>q.ticket===ticket.id);return item?.status?'rejected':item?'pending':'verified';}

// One persisted selection per attempt. This is a cosmetic receipt, not another wallet.
export async function prepareDrop(id:string,seed:number,hasCargo:boolean):Promise<string|null>{
 const apply=()=>{const latest={...profile,...read<Partial<Profile>>('profile',{})},account=migrateShop(latest,latest.shop);
  if(account.receipts.includes(id))return null;
  const old=account.attempts[id];if(old)return old.status==='active'?old.item:null;
  const item=hasCargo?selectDrop(account,seed):null;
  // Persist an empty outcome too: buying another pilot in a second tab must not
  // make an already-started attempt eligible for another selection.
  latest.shop={...account,attempts:{...account.attempts,[id]:{seed,item,status:'active'}}};
  try{localStorage.setItem('runway.profile',JSON.stringify(latest));}catch{storageAvailable=false;return null;}
  Object.assign(profile,latest);return item;
 };
 return navigator.locks?navigator.locks.request('runway-shop',apply):apply();
}
export async function abandonDrop(id:string){
 const apply=()=>{const latest={...profile,...read<Partial<Profile>>('profile',{})},account=migrateShop(latest,latest.shop),attempt=account.attempts[id];if(!attempt||attempt.status!=='active')return;
  latest.shop={...account,attempts:{...account.attempts,[id]:{...attempt,status:'abandoned'}}};
  try{localStorage.setItem('runway.profile',JSON.stringify(latest));Object.assign(profile,latest);}catch{storageAvailable=false;}
 };if(navigator.locks)await navigator.locks.request('runway-shop',apply);else apply();
}
