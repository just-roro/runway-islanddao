import {describe,it,expect,vi,afterEach} from 'vitest';
import clientCore from '../src/core/simulation.ts?raw';
import apiCore from '../../services/runway-api/lib/simulation.ts?raw';
const assets=import.meta.glob('../public/assets/cosmetics/*.png');
import {newShop,migrateShop,purchase,selectDrop,settleShop,shopItems,type ShopAccount,type LegacyShop} from '../src/shopCatalog';
import {generate,initialState,step,quantize,decoded,objectPose,type State} from '../src/core/simulation';
import {canopyGeometry} from '../src/scene/Parachute';
import baseline from './fixtures/cosmetics42-course-baseline.json';
import originals from '../src/assets/accessories.json';
import {flyRoute} from './test-pilot';
const accessory=shopItems.find(i=>i.id==='accessory:dragon-ninja')!;
function victory(){const s=initialState(17);while(!s.result){const input=decoded(quantize(flyRoute(s)));step(s,input);step(s,input);}return s;}
const won=victory();
function accountForDrop(item=accessory.id):ShopAccount{return{...newShop(),attempts:{one:{seed:17,item,status:'active'}}};}
describe('cosmetics catalog and compatible assets',()=>{
 it('contains every original, priced tiers and bounded product sets',()=>{
  expect(originals).toHaveLength(94);expect(new Set(shopItems.map(i=>i.id)).size).toBe(shopItems.length);
  expect(originals.filter(i=>i.tier==='basic')).toHaveLength(12);expect(originals.filter(i=>i.tier==='intermediate')).toHaveLength(58);expect(originals.filter(i=>i.tier==='premium')).toHaveLength(24);
  for(const a of originals){expect(assets['../public'+a.image]).toBeDefined();expect(a.source.size).toEqual([880,880]);expect(a.pilot).toBeGreaterThanOrEqual(0);expect(a.pilot).toBeLessThan(12);}
  for(const [category,count] of [['pilot',12],['canopy',12],['trail',10],['helmet',9]] as const)expect(shopItems.filter(i=>i.category===category)).toHaveLength(count);
 });
 it('preserves every v1 field and objective/legacy unlock without inferring money',()=>{const v1:LegacyShop={version:1,balance:123456,earned:456789,owned:['pilot:0','pilot:9','canopy:orchid','trail:gold'],receipts:['paid'],canopy:'canopy:orchid',trail:'trail:gold'};const a=migrateShop({community:0,pilot:9,rares:[0,1]},v1);for(const k of ['balance','earned','receipts','canopy','trail'] as const)expect(a[k]).toEqual(v1[k]);expect(a.owned).toEqual([...v1.owned,'helmet:original']);expect(a.accessories).toEqual({});expect(a.version).toBe(2);expect(migrateShop({community:0,pilot:9,rares:[]},a)).toBe(a);});
 it('refuses incompatible purchases and exact-balance purchases debit only once',()=>{const a={...newShop(),balance:1000000};expect(()=>purchase(a,'accessory:horse-sun-glasses')).toThrow('Own Horse');const b=purchase(a,accessory.id);expect(b.balance).toBe(0);expect(purchase(b,accessory.id)).toBe(b);expect(()=>purchase(b,'canopy:aurora')).toThrow('Not enough');});
 it('keeps canonical client/API simulation and original non-cosmetic generation',async()=>{expect(apiCore).toBe(clientCore);for(let seed=0;seed<baseline.hashes.length;seed++){const actual=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(generate(seed).filter(o=>o.kind!=='rare')))))).map(n=>n.toString(16).padStart(2,'0')).join('');expect(actual,`seed ${seed}`).toBe(baseline.hashes[seed]);}});
 it('adds UVs without changing canopy positions, rigging or triangle topology between finishes',()=>{const a=canopyGeometry(),b=canopyGeometry('#55aaff');expect(a.canopy.attributes.uv.count).toBe(a.canopy.attributes.position.count);expect(b.canopy.attributes.position.array).toEqual(a.canopy.attributes.position.array);expect(b.canopy.index!.array).toEqual(a.canopy.index!.array);expect(b.ropes).toEqual(a.ropes);a.canopy.dispose();b.canopy.dispose();});
});
describe('rare cargo settlement',()=>{
 it('selects deterministically, only unowned accessories of owned pilots',()=>{const a=newShop();for(let seed=0;seed<1000;seed++){const id=selectDrop(a,seed)!;expect(selectDrop(a,seed)).toBe(id);expect(shopItems.find(i=>i.id===id)?.pilot).toBe(0);expect(selectDrop({...a,owned:[...a.owned,id]},seed)).not.toBe(id);}expect(selectDrop({...a,owned:[...a.owned,...shopItems.filter(i=>i.pilot===0).map(i=>i.id)]},1)).toBeNull();});
 it('actual swept contact is zero-money and fires once',()=>{let s:State|undefined;for(let seed=0;seed<1000;seed++){const state=initialState(seed);if(state.objects.some(o=>o.kind==='rare')){s=state;break;}}expect(s).toBeDefined();const cargo=s!.objects.find(o=>o.kind==='rare')!;s!.objects=[cargo];while(!s!.rareCollected&&!s!.result){const p=objectPose(cargo,s!.routeTime);step(s!,{x:Math.max(-1,Math.min(1,(p.x-s!.x))),y:Math.max(-1,Math.min(1,s!.y-p.z))});}expect(s!.rareCollected).toBe(true);for(let i=0;i<60;i++)step(s!,{x:0,y:0});expect(s!.events.filter(e=>e.kind==='rare')).toHaveLength(1);expect(s!.cash).toBe(5000);});
 it('requires collection and landing; grants once, never equips, never adds drop money',()=>{const s={...won,rareCollected:true},a=accountForDrop(),settled=settleShop(a,'one',s);expect(settled.account.owned).toContain(accessory.id);expect(settled.account.accessories).toEqual({});expect(settled.credited).toBe(won.cash);expect(settled.account.attempts.one.status).toBe('settled');expect(settleShop(settled.account,'one',s).account).toBe(settled.account);expect(settleShop(a,'one',{...s,rareCollected:false}).unlocks).not.toContain(accessory.id);expect(settleShop(a,'one',{...s,result:{...s.result!,outcome:'bankrupt',cashFinal:0}}).unlocks).toEqual([]);});
 it('abandoned, seed-mismatched or already purchased drops cannot reroll or compensate',()=>{const a=accountForDrop(),s={...won,rareCollected:true};for(const attempts of [{one:{...a.attempts.one,status:'abandoned' as const}},{one:{...a.attempts.one,seed:999}}])expect(settleShop({...a,attempts},'one',s).unlocks).not.toContain(accessory.id);const b={...a,owned:[...a.owned,accessory.id]};const settled=settleShop(b,'one',s);expect(settled.unlocks).not.toContain(accessory.id);expect(settled.credited).toBe(won.cash);});
});
afterEach(()=>{vi.unstubAllGlobals();vi.resetModules();});
it('serializes purchases, remembers equipment per pilot, saves drops atomically and handles failed storage',async()=>{
 const data=new Map<string,string>();let fail=false;vi.stubGlobal('localStorage',{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{if(fail)throw Error('quota');data.set(k,v);}});let tail=Promise.resolve();vi.stubGlobal('navigator',{locks:{request:(_name:string,fn:()=>unknown)=>{const next=tail.then(fn);tail=next.then(()=>{},()=>{});return next;}}});
 data.set('runway.profile',JSON.stringify({shop:{...newShop(),balance:32000000,owned:[...newShop().owned,'pilot:1']}}));
 const session=await import('../src/services/session');await Promise.all([session.transactShop(accessory.id,true),session.transactShop(accessory.id,true)]);expect(session.profile.shop!.balance).toBe(31000000);expect(session.profile.shop!.accessories[0]).toBe(accessory.id);
 await session.transactShop('accessory:horse-sun-glasses',true);expect(session.profile.shop!.accessories[0]).toBe(accessory.id);expect(session.profile.shop!.accessories[1]).toBe('accessory:horse-sun-glasses');await session.transactShop('accessory:none',false,0);expect(session.profile.shop!.accessories[0]).toBe('');expect(session.profile.shop!.accessories[1]).toBeTruthy();
 const drop=await session.prepareDrop('one',17,true);expect(drop).toBeTruthy();expect(await session.prepareDrop('one',99,true)).toBe(drop);await Promise.all([session.complete({...won,rareCollected:true},false,'one'),session.complete({...won,rareCollected:true},false,'one')]);expect(session.profile.shop!.owned.filter(i=>i===drop)).toHaveLength(1);expect(session.profile.shop!.receipts.filter(i=>i==='one')).toHaveLength(1);expect(session.profile.shop!.balance).toBe(30000000+won.cash);
 const saved=data.get('runway.profile');fail=true;await expect(session.transactShop('canopy:aurora',true)).rejects.toThrow('Storage');expect(data.get('runway.profile')).toBe(saved);expect(session.profile.shop!.owned).not.toContain('canopy:aurora');fail=false;
 await session.prepareDrop('loss',17,true);await session.abandonDrop('loss');await session.complete({...won,rareCollected:true},false,'loss');expect(session.profile.shop!.attempts.loss.status).toBe('settled');
 expect(await session.prepareDrop('empty',17,false)).toBeNull();expect(await session.prepareDrop('empty',17,true)).toBeNull();
 await session.prepareDrop('quota',17,true);const beforeFailure=data.get('runway.profile'),balance=session.profile.shop!.balance;fail=true;
 expect(await session.complete({...won,rareCollected:true},false,'quota')).toEqual(['Browser storage unavailable · shop credit could not be saved']);expect(session.profile.shop!.balance).toBe(balance);expect(session.profile.shop!.receipts).not.toContain('quota');expect(data.get('runway.profile')).toBe(beforeFailure);fail=false;
 vi.resetModules();const reloaded=await import('../src/services/session');expect(reloaded.profile.shop).toEqual(JSON.parse(data.get('runway.profile')!).shop);
});
