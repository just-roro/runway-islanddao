import {describe,it,expect} from 'vitest';
import {initialState} from '../src/core/simulation';
import {createPresentation,updatePresentation,captureCues,activeImpact} from '../src/services/presentation';
describe('client choreography contract',()=>{
 it('advances its closing clock after rules stop, and zero dt freezes every transition',()=>{const s=initialState(42),p=createPresentation();s.outcome='landed';updatePresentation(p,s,.1);updatePresentation(p,s,.2);const before=structuredClone(p);updatePresentation(p,s,0);expect(p).toEqual({...before,dt:0});updatePresentation(p,s,.1);expect(p.landingAge).toBeCloseTo(.3);expect(s.tick).toBe(0);});
 it('captures all contacts once, retaining position and effective loss even as the world moves',()=>{const s=initialState(42),p=createPresentation();s.tick=60;s.x=2;s.altitude=40;s.y=12;s.events.push({tick:60,kind:'gas',delta:-5000,balance:0},{tick:60,kind:'sol',delta:15000,balance:15000});captureCues(p,s,0,'flight',-30);s.x=99;s.altitude=1;expect(p.cues).toHaveLength(2);expect(p.cues[0].position).toEqual([2,40,12]);expect(p.cues[0].delta).toBe(-5000);expect(p.cues[0].velocity).toBe(-30);expect(new Set(p.cues.map(c=>c.id)).size).toBe(2);p.time=1.1;expect(activeImpact(p)?.kind).toBe('gas');p.time=1.5;expect(activeImpact(p)).toBeUndefined();});
});
