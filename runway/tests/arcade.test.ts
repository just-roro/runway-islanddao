import {it,expect} from 'vitest';
import {FALL_SPEED,PREVIOUS_FALL_SPEED,GLIDE_SPEED,TIMING,CLOUD_DECK,altitudeAt,generate,objectPose} from '../src/core/simulation';
it('reduces freefall exactly eight percent without moving the deployment height or changing canopy speed',()=>{
 expect(FALL_SPEED/PREVIOUS_FALL_SPEED).toBeCloseTo(.92,14);expect(GLIDE_SPEED).toBe(10.4);
 for(const t of [3,4,TIMING.cloud,TIMING.glide])expect(Math.abs(altitudeAt(t-.00001)-altitudeAt(t+.00001))).toBeLessThan(.001);
 expect(altitudeAt(TIMING.glide)).toBeCloseTo(156,10);
 expect(altitudeAt(CLOUD_DECK.enter)).toBeCloseTo(1113-15*PREVIOUS_FALL_SPEED,10);
 for(const o of generate(3).filter(o=>!o.vertical))expect(objectPose(o,o.t).y).toBeCloseTo(altitudeAt(o.t),6);
});
