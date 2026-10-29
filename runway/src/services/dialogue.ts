import {useEffect,useRef,useState} from 'react';
import type {Kind} from '../core/simulation';
import {dialogueSound,stopDialogueSound} from './audio';

export type Expression='welcome'|'curious'|'warning'|'confident'|'celebrate';
export const expressionIndex:Record<Expression,number>={welcome:19,curious:20,warning:21,confident:22,celebrate:23};
export type HologramKind=Kind|'canopy';
export type DialogueFrame={tutorial?:boolean;step:number;letters:number;text:string;expression:Expression;models:HologramKind[];focus:boolean;talking:boolean};
export const emptyDialogue:DialogueFrame={step:0,letters:0,text:'',expression:'welcome',models:[],focus:true,talking:false};
export type ConversationMotion={presence:number;focus:number;frame:DialogueFrame;gestureAt:number;stepAt:number;projectedExpression?:Expression;time:number};
export const createConversation=():ConversationMotion=>({presence:0,focus:0,frame:emptyDialogue,gestureAt:-10,stepAt:0,time:0});
export function advanceConversation(c:ConversationMotion,frame:DialogueFrame|null,dt:number){
 c.time+=dt;
 if(frame){if(frame.text!==c.frame.text){c.stepAt=c.time;c.projectedExpression=undefined;}if(frame.expression!==c.frame.expression||frame.text!==c.frame.text||frame.talking&&!c.frame.talking)c.gestureAt=c.time;c.frame=frame;}
 const blend=1-Math.exp(-dt*(c.frame.tutorial?3:4.5));c.presence+=(Number(!!frame)-c.presence)*blend;c.focus+=(Number(!!frame?.focus)-c.focus)*blend;
 if(c.presence<.001&&!frame)c.presence=0;if(c.focus<.001&&!frame?.focus)c.focus=0;
}
export type Projection={kind:HologramKind|null;alpha:number};
export function advanceProjection(p:Projection,wanted:HologramKind|null,dt:number){
 const same=p.kind===wanted;p.alpha=Math.max(0,Math.min(1,p.alpha+(same&&wanted?1:-1)*dt*4));
 if(p.alpha===0)p.kind=wanted;return p;
}

/** One writer drives text, LED gestures and sound; skip never queues missed syllables. */
export function useDialogue(text:string,expression:Expression,step:number,models:HologramKind[],focus:boolean,onFrame:(f:DialogueFrame)=>void,delay=0,charactersPerSecond=35){
 const [state,setState]=useState({text,letters:0}),finished=useRef(false),lastExpression=useRef<Expression|null>(null),latest=useRef(onFrame);latest.current=onFrame;
 const letters=state.text===text?state.letters:0,modelsKey=models.join(',');
 useEffect(()=>{finished.current=false;setState({text,letters:0});if(!text){stopDialogueSound();return;}let raf=0,elapsed=-delay,last=performance.now(),count=0,voiced=-1,announced=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const draw=(now:number)=>{const dt=Math.min(.05,(now-last)/1000);last=now;
   if(!document.hidden){elapsed+=dt;if(elapsed>=0){if(!announced){if(lastExpression.current!==expression){dialogueSound(expression);lastExpression.current=expression;}announced=true;}const n=finished.current||reduced?text.length:Math.min(text.length,Math.floor(elapsed*charactersPerSecond));if(n!==count){const jump=n-count;count=n;setState({text,letters:n});const group=Math.floor(n/4);if(group>voiced&&jump<=4&&n<text.length&&/\S/.test(text.slice(Math.max(0,n-4),n))){dialogueSound('type',group);voiced=group;}}}}
   raf=requestAnimationFrame(draw);
  };raf=requestAnimationFrame(draw);return()=>{cancelAnimationFrame(raf);stopDialogueSound();};
 },[text,expression,delay,charactersPerSecond]);
 useEffect(()=>{latest.current({step,letters,text,expression,models:modelsKey?modelsKey.split(',') as HologramKind[]:[],focus,talking:letters>0&&letters<text.length});},[step,letters,text,expression,modelsKey,focus]);
 return {letters,complete:()=>{finished.current=true;setState({text,letters:text.length});stopDialogueSound();}};
}
