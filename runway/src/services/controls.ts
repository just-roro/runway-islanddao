import type { Input } from '../core/simulation';
import { clamp } from '../core/simulation';
import {profile,persist} from './session';
export class Controls {
 input:Input={x:0,y:0};keys=new Set<string>();neutral:{x:number;y:number}|null=null;latest:{x:number;y:number}|null=null;calibrating=false;pointer:number|null=null;origin={x:0,y:0};knob={x:0,y:0};received=-Infinity;
 filteredAt=0;private denied=false;private attempt=0;
 // Preference is persistent; holding a pointer is only a temporary override.
 get mode():'tilt'|'touch'{return this.pointer===null&&profile.control==='tilt'&&!this.denied&&performance.now()-this.received<700?'tilt':'touch';}
 orientation=(e:DeviceOrientationEvent)=>{
  if(e.beta===null||e.gamma===null||!Number.isFinite(e.beta+e.gamma)||this.denied)return;
  const a=(screen.orientation?.angle||0)*Math.PI/180,now=performance.now(),recovering=now-this.received>=700;
  this.latest={x:e.gamma*Math.cos(a)+e.beta*Math.sin(a),y:e.beta*Math.cos(a)-e.gamma*Math.sin(a)};this.received=now;
  if(this.calibrating||!this.neutral||recovering)this.neutral={...this.latest};
 };
 keydown=(e:KeyboardEvent)=>{if((e.target as HTMLElement)?.matches('input,textarea'))return;this.keys.add(e.key.toLowerCase());};keyup=(e:KeyboardEvent)=>{this.keys.delete(e.key.toLowerCase());};
 rotate=()=>{this.neutral=null;this.release();};
 attach(){window.addEventListener('orientationchange',this.rotate);window.addEventListener('deviceorientation',this.orientation);window.addEventListener('keydown',this.keydown);window.addEventListener('keyup',this.keyup);window.addEventListener('blur',this.release);return()=>{window.removeEventListener('orientationchange',this.rotate);window.removeEventListener('deviceorientation',this.orientation);window.removeEventListener('keydown',this.keydown);window.removeEventListener('keyup',this.keyup);window.removeEventListener('blur',this.release);};}
 async prepare(force=false){
  const attempt=++this.attempt;this.release();this.neutral=null;this.calibrating=true;
  if(profile.control!=='tilt'||this.denied&&!force)return;
  try{
   if(typeof DeviceOrientationEvent==='undefined'||!window.isSecureContext){this.received=-Infinity;return;}
   const D=DeviceOrientationEvent as typeof DeviceOrientationEvent&{requestPermission?:()=>Promise<string>};
   // Called synchronously from PLAY / PAUSE → TILT, inside the user gesture.
   const granted=!D.requestPermission||await D.requestPermission()==='granted';
   if(attempt!==this.attempt)return;this.denied=!granted;if(!granted)this.received=-Infinity;
   this.filteredAt=performance.now();
  }catch{if(attempt===this.attempt){this.denied=true;this.received=-Infinity;}}
 }
 recenter(){this.neutral=this.latest?{...this.latest}:null;this.release();}
 touch(){++this.attempt;profile.control='touch';this.release();persist();}
 async tilt(){profile.control='tilt';persist();await this.prepare(true);this.calibrating=false;this.neutral=this.latest?{...this.latest}:null;}
 read(){
  const now=performance.now(),dt=Math.min(.1,Math.max(0,(now-this.filteredAt)/1000));this.filteredAt=now;
  if(this.mode==='tilt'&&this.latest&&this.neutral){const axis=(n:number)=>Math.sign(n)*clamp((Math.abs(n)-2)/16,0,1),a=1-Math.exp(-dt*25);this.input.x+=(axis(this.latest.x-this.neutral.x)-this.input.x)*a;this.input.y+=(-axis(this.latest.y-this.neutral.y)-this.input.y)*a;}
  else if(this.pointer===null)this.input={x:0,y:0};
  if(this.keys.size)return{x:Number(this.keys.has('arrowright')||this.keys.has('d'))-Number(this.keys.has('arrowleft')||this.keys.has('a')),y:Number(this.keys.has('arrowup')||this.keys.has('w'))-Number(this.keys.has('arrowdown')||this.keys.has('s'))};
  return this.input;
 }
 down(id:number,x:number,y:number){if(this.pointer!==null)return false;this.pointer=id;this.origin={x,y};this.knob={x:0,y:0};this.input={x:0,y:0};return true;}
 move(id:number,x:number,y:number){if(id!==this.pointer)return;const dx=x-this.origin.x,dy=y-this.origin.y,l=Math.max(56,Math.hypot(dx,dy));this.input={x:dx/l,y:-dy/l};this.knob={x:dx/l*44,y:dy/l*44};}
 release=()=>{this.pointer=null;this.input={x:0,y:0};this.knob={x:0,y:0};this.filteredAt=performance.now();this.keys.clear();};
}
export const controls=new Controls();
if(import.meta.env.DEV&&typeof window!=='undefined'&&new URLSearchParams(location.search).get('qa')==='1')Object.assign(window,{__RUNWAY_CONTROLS_QA__:controls});
