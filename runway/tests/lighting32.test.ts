import {describe,it,expect} from 'vitest';
import {exteriorBlend} from '../src/scene/environments';
describe('aircraft lighting transition',()=>{
 it('is continuous, monotonic and holds exact indoor/outdoor endpoints',()=>{
  expect(exteriorBlend(0)).toBe(0);expect(exteriorBlend(2.2)).toBe(0);expect(exteriorBlend(4.8)).toBe(1);expect(exteriorBlend(60)).toBe(1);
  let previous=0;for(let tick=0;tick<=360;tick++){const current=exteriorBlend(tick/60);expect(current).toBeGreaterThanOrEqual(previous);expect(current-previous).toBeLessThan(.013);previous=current;}
  expect(exteriorBlend(4+1e-5)-exteriorBlend(4-1e-5)).toBeLessThan(.00002);
 });
});
