import {it,expect} from 'vitest';
import {economicFrame} from '../src/economy';
import {initialState,money,finish} from '../src/core/simulation';
it('one timeline reproduces gains, losses and final liquidation in order',()=>{const s=initialState(1);s.tick=60;money(s,1500,'term');s.tick=120;money(s,-750,'gas');s.tick=180;s.outcome='landed';money(s,575,'landing-bonus');s.tick=240;finish(s);expect(economicFrame(s,0).cash).toBe(5000);expect(economicFrame(s,.25).cash).toBe(6500);expect(economicFrame(s,.5).cash).toBe(5750);expect(economicFrame(s,.75).cash).toBe(6325);expect(economicFrame(s,1).cash).toBe(s.result!.cashFinal);expect(economicFrame(s,1).events).toHaveLength(3);});
it('same-tick events keep their order and water clears the entire balance',()=>{const s=initialState(1);s.tick=60;money(s,100,'sol');money(s,250,'community');s.tick=120;s.outcome='water';money(s,-s.cash,'splashdown');finish(s);expect(economicFrame(s,.5).cash).toBe(5350);expect(economicFrame(s,1).cash).toBe(0);expect(economicFrame(s,1).events.at(-1)?.delta).toBe(-5350);});

import {financialWindow,feedEntries} from '../src/economy';
it('rolling history retains same-tick changes, the starting balance and zero',()=>{const events=[{tick:60,kind:'sol',delta:15000,balance:20000},{tick:660,kind:'sol',delta:15000,balance:35000},{tick:660,kind:'gas',delta:-10000,balance:25000},{tick:700,kind:'splashdown',delta:-25000,balance:0}];const h=financialWindow(events,720);expect(h.start).toBe(120);expect(h.points).toEqual([[120,20000],[660,20000],[660,35000],[660,35000],[660,25000],[700,25000],[700,0],[720,0]]);expect(h.high-h.low).toBe(93000);expect(financialWindow(events,1400).points).toEqual([[800,0],[1400,0]]);});
it('only adjacent SOL inside 100 ms aggregate; damage and utilities retain identities',()=>{const events=[{tick:60,kind:'sol',delta:15000,balance:20000},{tick:66,kind:'sol',delta:15000,balance:35000},{tick:66,kind:'gas',delta:-500,balance:34500},{tick:66,kind:'sol',delta:15000,balance:49500},{tick:73,kind:'sol',delta:15000,balance:64500},{tick:73,kind:'water',delta:0,balance:64500}];const groups=feedEntries(events);expect(groups.map(e=>[e.kind,e.delta,e.count])).toEqual([['sol',30000,2],['gas',-500,1],['sol',15000,1],['sol',15000,1],['water',0,1]]);expect(groups.reduce((a,b)=>a+b.delta,0)).toBe(events.reduce((a,b)=>a+b.delta,0));});

import {capitalSegments} from '../src/economy';
it('colors every real move separately, including same-tick losses and stable empty windows',()=>{
 const points:[number,number][]=[[0,5000],[60,5000],[60,155000],[60,117500],[120,117500],[120,0],[180,0]];
 expect(capitalSegments(points).map(s=>s.direction)).toEqual(['gain','gain','loss','loss','loss','loss']);
 expect(capitalSegments(points).filter(s=>s.from[1]!==s.to[1]).map(s=>s.to[1]-s.from[1])).toEqual([150000,-37500,-117500]);
 expect(capitalSegments(financialWindow([],900).points)).toEqual([{from:[300,5000],to:[900,5000],direction:'gain'}]);
});
