import {it,expect,vi,afterEach} from 'vitest';
import {Controls} from '../src/services/controls';
import {profile} from '../src/services/session';
afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers();});
const setup=()=>{vi.useFakeTimers();vi.setSystemTime(0);vi.stubGlobal('screen',{orientation:{angle:0}});vi.stubGlobal('window',{isSecureContext:true});vi.stubGlobal('DeviceOrientationEvent',{});profile.control='tilt';return new Controls();};
const orient=(c:Controls,beta=20,gamma=0)=>c.orientation({beta,gamma} as DeviceOrientationEvent);
it('defaults to tilt; immediate touch takeover and release returns tilt without changing preference',async()=>{
 const c=setup();await c.prepare();orient(c);c.calibrating=false;expect(c.mode).toBe('tilt');c.down(1,100,100);c.move(1,156,100);expect(c.mode).toBe('touch');expect(c.read().x).toBe(1);expect(Math.abs(c.read().y)).toBe(0);expect(profile.control).toBe('tilt');c.release();expect(c.mode).toBe('tilt');
 c.touch();orient(c);c.down(2,0,0);c.release();expect(c.mode).toBe('touch');await c.prepare();expect(c.mode).toBe('touch');await c.tilt();expect(c.mode).toBe('tilt');
});
it('permission is requested in the gesture, refusal/unavailable falls back and retry can recover',async()=>{
 const c=setup(),requestPermission=vi.fn().mockResolvedValue('denied');vi.stubGlobal('DeviceOrientationEvent',{requestPermission});const p=c.prepare();expect(requestPermission).toHaveBeenCalledTimes(1);await p;orient(c);expect(c.mode).toBe('touch');c.down(1,0,0);c.move(1,56,0);expect(c.read().x).toBe(1);c.release();
 requestPermission.mockResolvedValue('granted');await c.tilt();orient(c);expect(c.mode).toBe('tilt');vi.advanceTimersByTime(800);expect(c.mode).toBe('touch');orient(c,40,12);expect(c.mode).toBe('tilt');expect(c.read().x).toBe(0);
 vi.stubGlobal('DeviceOrientationEvent',undefined);await c.prepare(true);expect(c.mode).toBe('touch');
});
it('calibration, dead zone, orientation and filtering are bounded and responsive',async()=>{
 const c=setup();await c.prepare();orient(c);c.calibrating=false;vi.advanceTimersByTime(16);orient(c,21,1);expect(c.read()).toEqual({x:0,y:0});
 for(let i=0;i<4;i++){vi.advanceTimersByTime(16);orient(c,20,18);c.read();}expect(c.input.x).toBeGreaterThan(.75);expect(c.input.x).toBeLessThanOrEqual(1);c.recenter();vi.advanceTimersByTime(16);expect(c.read().x).toBe(0);
 vi.stubGlobal('screen',{orientation:{angle:90}});c.rotate();orient(c,20,0);c.calibrating=false;vi.advanceTimersByTime(32);orient(c,38,0);expect(c.read().x).toBeGreaterThan(.5);
});
it('a late permission promise never overrides a manual TOUCH selection',async()=>{const c=setup();let allow!:(s:string)=>void;vi.stubGlobal('DeviceOrientationEvent',{requestPermission:()=>new Promise<string>(r=>allow=r)});const pending=c.prepare();c.touch();allow('granted');await pending;orient(c);expect(c.mode).toBe('touch');});
