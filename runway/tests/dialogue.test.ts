import {describe,it,expect,vi} from 'vitest';
vi.mock('../src/UI',()=>({Button:null,Panel:null,Icon:null}));
vi.mock('../src/services/audio',()=>({dialogueSound:vi.fn(),stopDialogueSound:vi.fn()}));
import {advanceConversation,advanceProjection,createConversation,emptyDialogue,expressionIndex,type DialogueFrame} from '../src/services/dialogue';
const frame:DialogueFrame={...emptyDialogue,text:'Welcome',letters:3,talking:true};
describe('conversation continuity',()=>{
 it('enters progressively and returns without dropping the outgoing expression',()=>{const c=createConversation();advanceConversation(c,frame,.05);expect(c.presence).toBeGreaterThan(0);expect(c.presence).toBeLessThan(.3);for(let i=0;i<120;i++)advanceConversation(c,frame,1/60);expect(c.focus).toBeGreaterThan(.999);advanceConversation(c,null,.05);expect(c.presence).toBeGreaterThan(.7);expect(c.frame.text).toBe('Welcome');for(let i=0;i<120;i++)advanceConversation(c,null,1/60);expect(c.presence).toBe(0);expect(c.focus).toBe(0);});
 it('retains the actor while shop camera returns to browsing',()=>{const c=createConversation();for(let i=0;i<120;i++)advanceConversation(c,frame,1/60);for(let i=0;i<120;i++)advanceConversation(c,{...frame,focus:false},1/60);expect(c.presence).toBeGreaterThan(.999);expect(c.focus).toBe(0);});
 it('freezes the same presentation on zero dt and gives equivalent 30/60 Hz motion',()=>{const a=createConversation(),b=createConversation();for(let i=0;i<30;i++)advanceConversation(a,frame,1/30);for(let i=0;i<60;i++)advanceConversation(b,frame,1/60);expect(a.presence).toBeCloseTo(b.presence,10);const saved=structuredClone(a);advanceConversation(a,frame,0);expect(a).toEqual(saved);});
 it('new expressions restart gestures but every written character does not',()=>{const c=createConversation();advanceConversation(c,frame,.1);const at=c.gestureAt;advanceConversation(c,{...frame,letters:4},.1);expect(c.gestureAt).toBe(at);advanceConversation(c,{...frame,expression:'warning'},.1);expect(c.gestureAt).toBeGreaterThan(at);expect(new Set(Object.values(expressionIndex)).size).toBe(5);});
});
describe('exclusive hologram projection',()=>{
 it('switches real models only after the previous projection fully disappears',()=>{const p={kind:'sol' as const,alpha:1} as Parameters<typeof advanceProjection>[0];advanceProjection(p,'rug',.1);expect(p).toEqual({kind:'sol',alpha:.6});advanceProjection(p,'rug',.15);expect(p).toEqual({kind:'rug',alpha:0});advanceProjection(p,'rug',.1);expect(p).toEqual({kind:'rug',alpha:.4});});
 it('handles rapid retargeting, closure and frozen presentation',()=>{const p={kind:'sol' as const,alpha:.5} as Parameters<typeof advanceProjection>[0];advanceProjection(p,'term',.1);advanceProjection(p,'magnet',.1);expect(p).toEqual({kind:'magnet',alpha:0});advanceProjection(p,'magnet',.1);const frozen={...p};advanceProjection(p,'magnet',0);expect(p).toEqual(frozen);advanceProjection(p,null,.2);expect(p).toEqual({kind:null,alpha:0});});
});

import {lessons} from '../src/NarrativeTutorial';
describe('four-scene briefing',()=>{
 it('has a short truthful script with real models and 20–30 second authored pacing',()=>{expect(lessons.map(l=>l.title)).toEqual(['THE LEAP','SURVIVE','FLY & LAND','BUILD']);expect(lessons[3].text).not.toMatch(/invest/i);expect(lessons[1].models).toEqual(['delivery','gas']);const seconds=lessons.reduce((n,l)=>n+l.text.length/18,0)+.8+.2*3+.32*3;expect(seconds).toBeGreaterThanOrEqual(19.5);expect(seconds).toBeLessThanOrEqual(30);});
 it('keeps the model clock stable while typing and expression gestures change',()=>{const c=createConversation();advanceConversation(c,frame,.1);const start=c.stepAt;advanceConversation(c,{...frame,talking:false,letters:8},1);advanceConversation(c,{...frame,expression:'warning'},1);expect(c.stepAt).toBe(start);advanceConversation(c,{...frame,text:'Next scene'},.1);expect(c.stepAt).toBeGreaterThan(start);});
});
