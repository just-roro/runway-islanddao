import{it,expect}from'vitest';import{createRuntime,advance}from'../src/services/runtime';import{controls}from'../src/services/controls';
it('a render stall does not cancel an actively held pointer',()=>{const r=createRuntime(1,undefined,()=>{});controls.down(9,100,100);controls.move(9,140,100);advance(r,1);expect(controls.pointer).toBe(9);expect(controls.input.x).toBeGreaterThan(0);controls.release();expect(controls.input.x).toBe(0);});

it('30 and 60 FPS render schedules produce identical fixed-step results',()=>{
 const simulate=(fps:number)=>{controls.release();controls.keys.add('arrowright');const r=createRuntime(456,undefined,()=>{});let n=0;while(!r.reported&&n++<fps*181)advance(r,1/fps);controls.release();return r;};
 const slow=simulate(30),fast=simulate(60);expect(slow.reported).toBe(true);expect(fast.reported).toBe(true);expect(slow.frames).toEqual(fast.frames);expect(slow.state.result).toEqual(fast.state.result);expect(slow.state.events).toEqual(fast.state.events);
});

it('a GPU stall retains the ticket and pauses simulation rather than granting unplayed progress',()=>{const r=createRuntime(1,{id:'stall-test',seed:1,rules:'test',content:'test',expires:Date.now()+60000},()=>{});advance(r,1);expect(r.competitive).toBe(true);expect(r.state.tick).toBe(0);expect(r.frames).toHaveLength(0);});
