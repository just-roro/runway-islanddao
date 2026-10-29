import {Button,Panel,Icon,type IconName} from './UI';
import {useEffect,useState} from 'react';
import {useDialogue,type DialogueFrame,type Expression,type HologramKind} from './services/dialogue';
// Preserve the existing seen flag: HOW TO PLAY always offers the new briefing.
export const TUTORIAL_VERSION='npc-26';
export type TutorialFrame=DialogueFrame;
export const lessons:{title:string;icon:IconName;text:string;hint:string;expression:Expression;models:HologramKind[]}[]=[
 {title:'THE LEAP',icon:'plane',text:"Building a startup is a leap of faith. Lucky for you, we've got a parachute.",hint:'YOUR CHUTE OPENS AUTOMATICALLY',expression:'confident',models:['canopy']},
 {title:'SURVIVE',icon:'gem',text:'Grab green. Dodge red. Protect your runway and keep your startup alive.',hint:'GREEN = FUNDING · RED = CAPITAL LOST',expression:'celebrate',models:['delivery','gas']},
 {title:'FLY & LAND',icon:'ring',text:'Steer through the sky, chain rings for big bonuses, and land on the island.',hint:'TILT / DRAG TO STEER · STARS BOOST',expression:'confident',models:['gate','star']},
 {title:'BUILD',icon:'island',text:'Bank your SOL. Unlock new gear in the Shop. Your best flights grow your startup’s team capital.',hint:'SHOP GEAR · TEAM PERSONAL BESTS',expression:'celebrate',models:['canopy','community']},
];
export function NarrativeTutorial({onDone,onClose,onFrame}:{start:boolean;onDone:()=>void;onClose:()=>void;onFrame:(frame:TutorialFrame)=>void}){
 const [line,setLine]=useState(0),[leaving,setLeaving]=useState(false),lesson=lessons[line];
 const {letters,complete}=useDialogue(lesson.text,lesson.expression,line,leaving?[]:lesson.models,true,f=>onFrame({...f,tutorial:true}),line===0?.8:.2,18);
 // Dematerialize before changing the spoken scene. Hidden tabs cannot skip this beat.
 useEffect(()=>{if(!leaving)return;let raf=0,last=performance.now(),age=0;const tick=(now:number)=>{if(!document.hidden)age+=Math.min(.05,(now-last)/1000);last=now;if(age>=.32){setLine(n=>n+1);setLeaving(false);}else raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);},[leaving]);
 const next=()=>{if(leaving)return;if(letters<lesson.text.length)complete();else if(line<3)setLeaving(true);else onDone();};
 return <Panel className="crew-dialog cinematic-briefing" role="dialog" aria-modal="true" aria-label="How to play" onKeyDown={e=>{if(e.key==='Escape')onClose();}} data-silent>
 <header><span>FLIGHT CREW / {lesson.title}</span><span aria-label={`Step ${line+1} of 4`}>{line+1} / 4</span></header>
 <div className="briefing-progress" aria-hidden="true">{lessons.map((_,i)=><i key={i} className={i<=line?'complete':''}/>)}</div>
 <Button className="speech-bubble" autoFocus onClick={next} aria-label="Continue briefing"><span className="lesson-icon" aria-hidden="true"><Icon name={lesson.icon}/></span><p aria-label={lesson.text}><span aria-hidden="true">{lesson.text.slice(0,letters)}</span></p></Button>
 <p className="briefing-hint">{lesson.hint}</p>
 <div className="briefing-actions"><Button className="secondary" onClick={onDone}>SKIP</Button><Button className="primary" disabled={leaving} onClick={next}>{letters<lesson.text.length?'READ':line===3?'BACK TO PLANE':'NEXT'} <Icon name="next"/></Button></div>
 </Panel>;
}
