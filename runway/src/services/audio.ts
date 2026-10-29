import {publicUrl} from '../urls';
import {profile} from './session';
import {SFX,AMBIENCE,AUDIO_FILES,eventSound} from './audioCatalog';
let ctx:AudioContext|undefined,sfxBus:GainNode|undefined,limiter:DynamicsCompressorNode|undefined,meter:AnalyserNode|undefined,mixMeter:AnalyserNode|undefined,capture:MediaStreamAudioDestinationNode|undefined;
const buffers=new Map<string,AudioBuffer>(),loading=new Map<string,Promise<void>>(),failed=new Set<string>();
const voices:{source:AudioScheduledSourceNode;gain:GainNode;priority:number;bus:string;kind:string}[]=[];
const last=new Map<string,number>(),variants=new Map<string,number>(),seen=new Set<string>();
const speechLog:{cue:string;at:number;group:number}[]=[];
const log:{kind:string;file:string;at:number;id?:string;voices:number;rate:number}[]=[];
let peakVoices=0,lastPickup=-10,combo=0,speechPriorityUntil=0,noise:AudioBuffer|undefined;
const MAX_VOICES=10;
function init(){if(ctx)return;ctx=new AudioContext({latencyHint:'interactive'});sfxBus=ctx.createGain();limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-12;limiter.knee.value=12;limiter.ratio.value=6;limiter.attack.value=.004;limiter.release.value=.15;sfxBus.connect(limiter);limiter.connect(ctx.destination);if(import.meta.env.DEV){meter=ctx.createAnalyser();meter.fftSize=256;limiter.connect(meter);capture=ctx.createMediaStreamDestination();limiter.connect(capture);mixMeter=ctx.createAnalyser();mixMeter.fftSize=256;ctx.createMediaStreamSource(capture.stream).connect(mixMeter);}ctx.onstatechange=()=>{musicSync();syncSfx();};}
async function load(file:string){if(buffers.has(file))return;if(loading.has(file))return loading.get(file);const job=fetch(publicUrl('/assets/sfx/')+file,{signal:AbortSignal.timeout(10000)}).then(r=>{if(!r.ok)throw Error('Audio unavailable');return r.arrayBuffer();}).then(b=>ctx!.decodeAudioData(b)).then(b=>{buffers.set(file,Object.values(AMBIENCE).includes(file)?loopBuffer(ctx!,b,0,b.duration):b);failed.delete(file);}).catch(()=>{failed.add(file);}).finally(()=>loading.delete(file));loading.set(file,job);return job;}
let preparing:Promise<void>|undefined;
export function prepareAudio(){if(!ctx)return Promise.resolve();if(!preparing){const files=[...AUDIO_FILES].sort((a,b)=>Number(!/^(ui_|npc_)/.test(a))-Number(!/^(ui_|npc_)/.test(b)));let index=0;preparing=Promise.all(Array.from({length:4},async()=>{while(index<files.length)await load(files[index++]);})).then(()=>{}).finally(()=>{preparing=undefined;});}return preparing;}
export function unlockAudio(){try{init();for(const deck of Object.values(decks))deck.failed=false;void prepareAudio();void loadMusic('victory');if(ctx!.state!=='running')void ctx!.resume().then(()=>{musicSync();syncSfx();}).catch(()=>{});else {musicSync();syncSfx();}}catch{/* Optional sound never blocks input. */}}
export function attachAudioUnlock(){const unlock=(event:Event)=>{if(event.isTrusted)unlockAudio();};for(const name of ['pointerup','click','keydown'])document.addEventListener(name,unlock,{capture:true});const visibility=()=>{musicSync();syncSfx();};document.addEventListener('visibilitychange',visibility);return()=>{for(const name of ['pointerup','click','keydown'])document.removeEventListener(name,unlock,{capture:true});document.removeEventListener('visibilitychange',visibility);};}
function halt(v:typeof voices[number]){try{v.source.stop();}catch{}v.source.disconnect();v.gain.disconnect();const i=voices.indexOf(v);if(i>=0)voices.splice(i,1);}
function quiet(bus?:string){for(const v of [...voices])if(!bus||v.bus===bus)halt(v);}
function blocked(bus:string){return !ctx||ctx.state!=='running'||profile.muted||document.hidden||(musicPaused&&bus==='game');}
export function beginAudioRun(){victoryRun=null;stopDeck(decks.victory);decks.victory.offset=0;decks.victory.ended=false;quiet('game');seen.clear();last.clear();combo=0;lastPickup=-10;windAudio(false);}
export function sound(kind:string,options:{id?:string;delta?:number;order?:number}={}){
 if(options.id){if(seen.has(options.id))return;seen.add(options.id);if(seen.size>2048)seen.delete(seen.values().next().value!);}
 const name=options.delta!==undefined?eventSound(kind,options.delta):kind,spec=name?SFX[name]:undefined;if(!name||!spec)return;
 const bus=spec.bus??'game';if(blocked(bus))return;const c=ctx!,now=c.currentTime;
 if(now-(last.get(name)??-10)<spec.gap)return;
 if(name==='type'&&now<speechPriorityUntil)return;
 if(bus==='voice'){if(name!=='type')speechPriorityUntil=now+(spec.duration??.17)+.035;quiet('voice');}
 // Impact masks minor pickups briefly; skipped voices are never queued for late playback.
 if(spec.priority<3&&bus==='game'&&now-(last.get('loss')??-10)<.14)return;
 if(voices.length>=MAX_VOICES){const victim=[...voices].sort((a,b)=>a.priority-b.priority)[0];if(victim.priority>spec.priority)return;halt(victim);}
 last.set(name,now);
 if(name==='sol'||name==='delivery'){combo=now-lastPickup<.8?Math.min(5,combo+1):0;lastPickup=now;}
 const n=options.order??variants.get(name)??0;variants.set(name,n+1);const file=spec.files?.[n%spec.files.length],buffer=file?buffers.get(file):undefined;
 let source:AudioScheduledSourceNode,filter:BiquadFilterNode|undefined;const gain=c.createGain();let duration=spec.duration??.1,rate=1;
 if(buffer){const player=c.createBufferSource();player.buffer=buffer;rate=name==='sol'||name==='delivery'?1+combo*.035:1;player.playbackRate.value=rate;source=player;duration=buffer.duration/rate;}
 else if(spec.synth==='noise'){
  if(!noise){noise=c.createBuffer(1,c.sampleRate*2,c.sampleRate);const data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;}
  const player=c.createBufferSource();player.buffer=noise;player.loop=true;source=player;filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.setValueAtTime(spec.hz??200,now);filter.frequency.exponentialRampToValueAtTime(spec.end??800,now+duration);
 }else {const o=c.createOscillator();o.type=bus==='voice'?'triangle':'sine';o.frequency.setValueAtTime(spec.hz??(name==='loss'?150:660),now);o.frequency.exponentialRampToValueAtTime(spec.end??(name==='loss'?60:880),now+duration);source=o;}
 const volume=buffer?spec.gain*(name==='sol'?1+combo*.07:1):spec.synth?spec.gain:bus==='voice'?.012:.025;
 gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(volume,now+.008);gain.gain.setValueAtTime(volume,now+Math.max(.009,duration-.035));gain.gain.linearRampToValueAtTime(0,now+duration);
 if(filter){source.connect(filter);filter.connect(gain);}else source.connect(gain);gain.connect(sfxBus!);
 const voice={source,gain,priority:spec.priority,bus,kind:name};voices.push(voice);peakVoices=Math.max(peakVoices,voices.length);source.onended=()=>{filter?.disconnect();halt(voice);};source.start(now);source.stop(now+duration+.01);
 if(name==='star')sound('boost',{id:options.id?options.id+':air':undefined});
 if(import.meta.env.DEV){if(bus==='voice'){speechLog.push({cue:name,at:now,group:options.order??0});if(speechLog.length>200)speechLog.shift();}log.push({kind:name,file:buffer?file!:'synthesis',at:now,id:options.id,voices:voices.length,rate});if(log.length>2000)log.shift();}
}
type Loop={source?:AudioBufferSourceNode;gain?:GainNode;offset:number;started:number};
const loops:Record<keyof typeof AMBIENCE,Loop>={fall:{offset:0,started:0},glide:{offset:0,started:0},updraft:{offset:0,started:0}};
let wind={active:false,intensity:1,updraft:false,turn:0};
function stopLoop(key:keyof typeof AMBIENCE){const l=loops[key];if(l.source){l.offset=(l.offset+ctx!.currentTime-l.started)%(l.source.buffer!.duration);l.source.stop();l.source.disconnect();l.gain?.disconnect();l.source=undefined;l.gain=undefined;}}
function syncLoops(){if(!ctx)return;for(const key of Object.keys(loops) as (keyof typeof AMBIENCE)[]){const l=loops[key],file=AMBIENCE[key],buffer=buffers.get(file);const desired=wind.active&&!blocked('game')?(key==='fall'?(wind.intensity>.5?.35:0):key==='glide'?(wind.intensity<=.5?.33+wind.turn*.1:0):wind.updraft?.32:0):0;
 if(!desired){if(l.gain){l.gain.gain.setTargetAtTime(0,ctx.currentTime,.08);if(l.gain.gain.value<.001||blocked('game')||!wind.active)stopLoop(key);}continue;}
 if(!buffer)continue;if(!l.source){l.source=ctx.createBufferSource();l.source.buffer=buffer;l.source.loop=true;l.gain=ctx.createGain();l.gain.gain.value=0;l.source.connect(l.gain);l.gain.connect(sfxBus!);l.started=ctx.currentTime;l.source.start(0,l.offset%buffer.duration);}l.gain!.gain.setTargetAtTime(desired,ctx.currentTime,.18);
 }}
export function windAudio(active:boolean,intensity=1,updraft=false,turn=0){wind={active,intensity,updraft,turn:Math.min(1,turn)};syncLoops();}
function syncSfx(){if(!ctx)return;const mute=profile.muted||document.hidden;if(mute)quiet();else if(musicPaused)quiet('game');sfxBus!.gain.setTargetAtTime(mute?0:Math.max(0,Math.min(1,profile.sfxVolume)),ctx.currentTime,.015);syncLoops();}
export function updateAudio(){syncSfx();musicSync();}
export function thunder(){sound('thunder');}
export const DIALOGUE_VOICE=Object.fromEntries(['type','welcome','curious','warning','confident','celebrate'].map(k=>[k,SFX[k]]));
export function stopDialogueSound(){quiet('voice');}
export function dialogueSound(cue:string,group=0){sound(cue,{order:group});}
// Supplied masters remain untouched. Loop windows exclude the measured recording silences.
// In-memory overlap creates a sample-accurate seam without another live player.
type MusicTrack='menu'|'game'|'victory';
type Deck={ended?:boolean;failed?:boolean;buffer?:AudioBuffer;loading?:Promise<void>;source?:AudioBufferSourceNode;gain?:GainNode;offset:number;started:number;timer?:ReturnType<typeof setTimeout>};
const decks:Record<MusicTrack,Deck>={menu:{offset:0,started:0},game:{offset:0,started:0},victory:{offset:0,started:0}};
const tracks:Record<MusicTrack,{url:string;start:number;end:number;oneShot?:boolean}>={victory:{url:publicUrl('/assets/music/mus_win_01.mp3'),start:0,end:0,oneShot:true},menu:{url:publicUrl('/assets/music/inicio_espera.mp3'),start:8,end:38.4},game:{url:publicUrl('/assets/music/jugando.mp3'),start:.4,end:28.5}};
let musicScene:'menu'|'game'|'results'='menu',musicPaused=false,victoryRun:string|null=null;
export function victoryMusic(runId:string){if(victoryRun===runId)return;victoryRun=runId;decks.victory.ended=false;decks.victory.offset=0;musicScene='results';musicSync();}
async function loadMusic(key:MusicTrack){if(!ctx)return;const d=decks[key],track=tracks[key],context=ctx;if(d.buffer||d.loading||d.failed)return d.loading;d.loading=fetch(track.url).then(r=>{if(!r.ok)throw Error('Music unavailable');return r.arrayBuffer();}).then(bytes=>context.decodeAudioData(bytes)).then(b=>{d.buffer=track.oneShot?b:loopBuffer(context,b,track.start,track.end);musicSync();}).catch(()=>{d.failed=true;musicSync();}).finally(()=>{d.loading=undefined;});return d.loading;}
function loopBuffer(c:AudioContext,b:AudioBuffer,from:number,to:number){const start=Math.round(from*b.sampleRate),end=Math.min(b.length,Math.round(to*b.sampleRate)),blend=Math.round(.3*b.sampleRate),length=end-start-blend,result=c.createBuffer(b.numberOfChannels,length,b.sampleRate);for(let channel=0;channel<b.numberOfChannels;channel++){const input=b.getChannelData(channel),out=result.getChannelData(channel);out.set(input.subarray(start+blend,end));for(let i=0;i<blend;i++){const u=i/(blend-1);out[length-blend+i]=input[end-blend+i]*(1-u)+input[start+i]*u;}}return result;}
function stopDeck(d:Deck){if(d.timer){clearTimeout(d.timer);d.timer=undefined;}if(d.source){d.offset=(d.offset+Math.max(0,(ctx?.currentTime??d.started)-d.started))%(d.buffer?.duration||1);d.source.onended=null;d.source.stop();d.source.disconnect();d.source=undefined;}d.gain?.disconnect();d.gain=undefined;}
function musicSync(){
 if(!ctx)return;
 const target:MusicTrack=musicScene==='menu'?'menu':victoryRun&&!decks.victory.ended&&!decks.victory.failed?'victory':'game',paused=musicPaused||document.hidden||profile.musicMuted;
 if(paused){for(const d of Object.values(decks))stopDeck(d);return;}if(ctx.state!=='running')return;
 const context=ctx,d=decks[target];
 if(!d.buffer){void loadMusic(target);return;}
 const now=context.currentTime;
 for(const [key,deck]of Object.entries(decks)){
  if(key===target){if(deck.timer){clearTimeout(deck.timer);deck.timer=undefined;}if(!deck.source){deck.source=context.createBufferSource();deck.source.buffer=deck.buffer!;deck.source.loop=!tracks[key as MusicTrack].oneShot;deck.gain=context.createGain();deck.gain.gain.value=0;deck.source.connect(deck.gain);deck.gain.connect(context.destination);if(capture)deck.gain.connect(capture);deck.started=now;deck.source.start(now,deck.offset%deck.buffer!.duration);if(key==='victory'){const source=deck.source;source.onended=()=>{if(deck.source!==source)return;source.disconnect();deck.gain?.disconnect();deck.source=undefined;deck.gain=undefined;deck.offset=0;deck.ended=true;musicSync();};if(import.meta.env.DEV)log.push({kind:deck.offset>0?'victory-resume':'victory-music',file:'mus_win_01.mp3',at:now,id:victoryRun??undefined,voices:voices.length,rate:1});}}const gain=deck.gain!.gain;gain.cancelAndHoldAtTime(now);gain.linearRampToValueAtTime(Math.max(0,Math.min(1,profile.musicVolume))*(key==='victory'?.8:musicScene==='results'?.4:.8),now+.8);}
  else if(deck.source&&!deck.timer){const gain=deck.gain!.gain;gain.cancelAndHoldAtTime(now);gain.linearRampToValueAtTime(0,now+.8);deck.timer=setTimeout(()=>stopDeck(deck),820);}
 }
}
export function setMusic(scene:typeof musicScene,paused=false){if(scene==='menu')victoryRun=null;musicScene=scene;musicPaused=paused;musicSync();syncSfx();}
export function updateMusic(){musicSync();}
export function musicStatus(){return{scene:musicScene,paused:musicPaused,muted:profile.musicMuted,volume:profile.musicVolume,playing:Object.entries(decks).filter(([,d])=>!!d.source).map(([name])=>name),offsets:Object.fromEntries(Object.entries(decks).map(([name,d])=>[name,d.source?(d.offset+(ctx!.currentTime-d.started))%d.buffer!.duration:d.offset])),loaded:Object.fromEntries(Object.entries(decks).map(([name,d])=>[name,d.buffer?.duration??0])),context:ctx?.state};}


if(import.meta.env.DEV&&typeof window!=='undefined'&&new URLSearchParams(location.search).get('qa')==='1')Object.assign(window,{__RUNWAY_AUDIO_QA__:{capture:()=>capture?.stream,musicStatus,setMusic,updateMusic,prepareAudio,sound,beginAudioRun,events:log,status:()=>({context:ctx?.state,voices:voices.length,peakVoices,mixLevel:(()=>{if(!mixMeter)return 0;const a=new Float32Array(256);mixMeter.getFloatTimeDomainData(a);return Math.max(...a.map(Math.abs));})(),level:(()=>{if(!meter)return 0;const a=new Float32Array(256);meter.getFloatTimeDomainData(a);return Math.max(...a.map(Math.abs));})(),loops:Object.keys(loops).filter(k=>loops[k as keyof typeof loops].source),loaded:buffers.size,expected:AUDIO_FILES.length,failed:[...failed],muted:profile.muted,volume:profile.sfxVolume}),interrupt:()=>ctx?.suspend()},__RUNWAY_DIALOGUE_AUDIO_QA__:{events:speechLog,status:()=>({active:voices.some(v=>v.bus==='voice'),muted:profile.muted,context:ctx?.state}),mute:(value:boolean)=>{profile.muted=value;updateAudio();}}});
