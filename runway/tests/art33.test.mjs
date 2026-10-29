import {readFileSync} from 'node:fs';
import {it,expect} from 'vitest';
import {doorOpening,doorDazzle} from '../src/scene/environments';
it('gates exterior ingress on the aperture and recovers before flight',()=>{
 expect(doorOpening(0)).toBe(0);expect(doorDazzle(0)).toBe(0);
 expect(doorOpening(1.15)).toBe(1);expect(doorDazzle(.85)).toBeGreaterThan(.7);
 expect(doorDazzle(3.2)).toBe(0);expect(doorDazzle(60)).toBe(0);
});
it('keeps the shared rig and authored clips, with finite blended shoulder geometry',()=>{
 const bytes=readFileSync('public/assets/models/runway-pilot.glb'),length=bytes.readUInt32LE(12),g=JSON.parse(bytes.subarray(20,20+length).toString()),binary=20+length+8;
 expect(g.skins[0].joints).toHaveLength(15);expect(g.materials).toHaveLength(3);
 expect(g.animations.map(a=>a.name).sort()).toEqual(['idle','prepare','run','exit','freefall','deploy','glide','land','celebrate'].sort());
 const rubber=g.meshes.flatMap(m=>m.primitives).find(p=>g.materials[p.material].name==='Rubber and harness');
 const values=index=>{const a=g.accessors[index],v=g.bufferViews[a.bufferView];return new Float32Array(bytes.buffer,bytes.byteOffset+binary+(v.byteOffset??0)+(a.byteOffset??0),a.count*(a.type==='VEC3'?3:4));};
 const positions=values(rubber.attributes.POSITION),weights=values(rubber.attributes.WEIGHTS_0);let shoulderVertices=0;
 for(let i=0;i<positions.length/3;i++){const x=Math.abs(positions[i*3]),y=positions[i*3+1];expect(Number.isFinite(positions[i*3+2])).toBe(true);if(x>.3&&x<.4&&y>-.23&&y<.09&&weights[i*4]>0&&weights[i*4+1]>0)shoulderVertices++;}
 expect(shoulderVertices).toBeGreaterThan(20);
});
