import {objectAngle,objectPose,type ObjectDef} from '../core/simulation';
import type {VisualCue} from '../services/presentation';

// A spent star stays at the contact position, full size. No pickup suction path.
export function starEffect(o:ObjectDef,route:number,time:number,cue?:VisualCue,reduced=false){
 const p=objectPose(o,route),age=cue?Math.max(0,time-cue.at):0,u=Math.min(1,age/1.2);
 const turn=u*u*u*(10+u*(-15+6*u)); // zero angular speed/acceleration at both ends
 return {position:cue?cue.position:[p.x,p.y,p.z],angle:objectAngle(o,cue?.route??route)+(cue&&!reduced?Math.PI*6*turn:0),flash:cue?Math.sin(Math.PI*u)**.6:0};
}
