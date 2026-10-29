// Presentation-only fixed pools; no reward or collision writes.
export const TRAIL_CAPACITY=192,RING_SEGMENTS=24,RING_LIFE=.72;
export const trailRate=(speed:number)=>Math.min(156,Math.max(48,48+Math.abs(speed)*2.8));
export function ringFragment(age:number,index:number,radius:number){const u=Math.max(0,Math.min(1,age/RING_LIFE)),angle=index*Math.PI*2/RING_SEGMENTS;return{angle,radius:radius*(1+u*.45),normal:Math.sin(index*2.399)*age*2,spin:age*(index%2?1:-1)*3.5,alpha:(1-u)**1.5};}
