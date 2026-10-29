import {it,expect} from 'vitest';
import {initialState,step,ECONOMY,contactRadii,PILOT_RADIUS} from '../src/core/simulation';
it('Delivery grants a small reward once without consuming protection or registering damage',()=>{
 for(const penaltyScale of [.02,.2,1]){
 const s=initialState(17);s.objects=[];for(let i=0;i<270;i++)step(s,{x:0,y:0});s.shield=1;s.immuneUntil=s.tick+100;
 const before={cash:s.cash,income:s.income,immune:s.immuneUntil};const o={id:'positive-delivery',kind:'delivery' as const,x:s.x,y:s.y,t:s.routeTime,alt:s.altitude-.2,r:1.15,motion:0,fallSpeed:0,penaltyScale};s.objects=[o];
 expect(contactRadii(o).x).toBe(1.15+PILOT_RADIUS);
 for(let i=0;i<60;i++)step(s,{x:0,y:0});
 expect(s.cash).toBe(before.cash+5000);expect(s.income).toBe(before.income+5000);expect(s.loss).toBe(0);expect(s.shield).toBe(1);expect(s.immuneUntil).toBe(before.immune);expect(s.hazardHits).toBe(0);expect(s.events.filter(e=>e.sourceId===o.id)).toHaveLength(1);expect(ECONOMY.delivery).toBeLessThan(ECONOMY.sol);
 }
});
