import {useEffect,useRef} from 'react';
import {controls} from './services/controls';
/** The thumb tracks the pointer every paint, independently of the 20 Hz HUD. */
export function Joystick(){
 const root=useRef<HTMLDivElement>(null),knob=useRef<HTMLElement>(null);
 useEffect(()=>{let raf=0;const draw=()=>{if(root.current&&knob.current){const active=controls.pointer!==null;root.current.style.opacity=active?'1':'0';root.current.style.left=controls.origin.x+'px';root.current.style.top=controls.origin.y+'px';knob.current.style.transition=active?'none':'transform 140ms ease-out';knob.current.style.transform=`translate(${controls.knob.x}px,${controls.knob.y}px)`;}raf=requestAnimationFrame(draw);};draw();return()=>cancelAnimationFrame(raf);},[]);
 return <div ref={root} className="joystick" aria-hidden="true" style={{opacity:0}}><i ref={knob}/></div>;
}
