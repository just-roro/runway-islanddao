import {describe,it,expect,vi,beforeEach} from 'vitest';
const mocks=vi.hoisted(()=>({api:vi.fn(),profile:{identity:{id:'me',token:'test'}}}));
vi.mock('../src/services/session',()=>mocks);
import {crownGeometry} from '../src/scene/RecognitionCrown';
import {readCeoSnapshot,crownPlace,rankMovement,refreshCeoRank,clearCeoRank} from '../src/services/recognition';
const snapshot=(rank:number|null,score=100000)=>({playerId:'me',rank,score,serverNow:123});
describe('confirmed individual CEO recognition',()=>{
 beforeEach(()=>{mocks.api.mockReset();clearCeoRank();});
 it('crown is a closed 256-triangle mesh with its lip touching above the LED panel',()=>{const g=crownGeometry();expect(g.attributes.position.count/3).toBe(256);expect(Math.hypot(.41,1.3-.61)).toBeGreaterThan(.8);expect(Math.hypot(.41,1.3-.61)).toBeLessThan(.805);g.dispose();});
 it('trusts only the authenticated own entry, including tied ranks',()=>{
  for(const rank of [1,2,3,4,51])expect(readCeoSnapshot({own:{id:'me',rank,score:150000},serverNow:123},'me').rank).toBe(rank);
  expect(readCeoSnapshot({own:null,serverNow:123},'me').rank).toBeNull();
  for(const own of [{id:'startup',rank:1,score:99999},{id:'me',rank:0,score:1},{id:'me',rank:1.5,score:1},{id:'me',rank:1,score:NaN},undefined])expect(()=>readCeoSnapshot({own,serverNow:123},'me')).toThrow();
  expect([null,snapshot(null),snapshot(1,0),snapshot(4),snapshot(1),snapshot(2),snapshot(3)].map(crownPlace)).toEqual([null,null,null,null,1,2,3]);
 });
 it('compares real positions, losses, ties, first entry and missing baseline distinctly',()=>{
  expect(rankMovement(snapshot(12),snapshot(2))).toEqual({delta:10,enteredTop3:true,enteredTop10:true});
  expect(rankMovement(snapshot(2),snapshot(7))).toEqual({delta:-5,enteredTop3:false,enteredTop10:false});
  expect(rankMovement(snapshot(2),snapshot(2)).delta).toBe(0);
  expect(rankMovement(snapshot(null),snapshot(3))).toEqual({delta:null,enteredTop3:true,enteredTop10:true});
  expect(rankMovement(null,snapshot(2))).toEqual({delta:null,enteredTop3:false,enteredTop10:false});
  expect(rankMovement({...snapshot(12),playerId:'other'},snapshot(2)).delta).toBeNull();
 });
 it('a post-upload refresh waits out an old query then makes a fresh query',async()=>{
  let resolve!:(value:unknown)=>void;mocks.api.mockImplementationOnce(()=>new Promise(r=>resolve=r)).mockResolvedValueOnce({own:{id:'me',rank:2,score:900000},serverNow:200});
  const prior=refreshCeoRank(),after=refreshCeoRank(true);expect(mocks.api).toHaveBeenCalledTimes(1);
  resolve({own:{id:'me',rank:12,score:5000},serverNow:100});expect((await prior)?.rank).toBe(12);expect((await after)?.rank).toBe(2);expect(mocks.api).toHaveBeenCalledTimes(2);
  expect(mocks.api.mock.calls.every(c=>c[0]==='leaderboard?kind=ceo')).toBe(true);
 });
 it('network or invalid data cannot award a crown',async()=>{mocks.api.mockRejectedValueOnce(new Error('offline'));expect(await refreshCeoRank()).toBeNull();mocks.api.mockResolvedValueOnce({own:{id:'someone-else',rank:1,score:999},serverNow:1});expect(await refreshCeoRank()).toBeNull();});
});
