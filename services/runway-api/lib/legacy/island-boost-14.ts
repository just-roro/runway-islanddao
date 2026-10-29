// Canonical, deterministic simulation: shared byte-for-byte with the server.
export const RULES='runway-3.2.0-chains',CONTENT='island-boost-14';
export const HZ=60,END_TICK=65*HZ,WORLD_SCALE=1,PILOT_SCALE=.9,PILOT_RADIUS=.48,START_CASH=5000;
export const GLIDE_SPEED=10.4,PREVIOUS_FALL_SPEED=(957-GLIDE_SPEED*.5)/29.5,FALL_SPEED=PREVIOUS_FALL_SPEED*.92;
const descentTime=(957-GLIDE_SPEED*.5)/FALL_SPEED+.5;
export const TIMING={exit:4,sky:4+4/.92,cloud:4+descentTime-1,glide:4+descentTime,celebrate:2,max:65};
// Authored encounters retain their world positions; the route clock may advance faster after a star.
export const flightTime=(authored:number)=>authored<=4?authored:authored<=92?4+(authored-4)*10.5/FALL_SPEED:authored<=98?4+924/FALL_SPEED+(authored-92)/6*(TIMING.glide-4-924/FALL_SPEED):TIMING.glide+(authored-98)/ (GLIDE_SPEED/3);
export const START_Z=350,GLIDE_HEIGHT=156;
export const CLOUD_DECK={enter:4+15/.92,center:4+22.5/.92,exit:TIMING.cloud-.2};
export const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
const smooth=(n:number)=>{const u=clamp(n,0,1);return u*u*(3-2*u);};
export const AIRCRAFT={floor:1120.8,rear:0,length:36,width:7,wingspan:44};
export function altitudeAt(t:number){if(t<=3)return 1122.2;if(t<4){const u=t-3;return 1122.2+(FALL_SPEED-27.6)*u*u+(18.4-FALL_SPEED)*u*u*u;}if(t<TIMING.cloud)return 1113-(t-4)*FALL_SPEED;if(t<TIMING.glide){const u=t-TIMING.cloud;return 1113-(TIMING.cloud-4)*FALL_SPEED-FALL_SPEED*u+(FALL_SPEED-GLIDE_SPEED)*u*u*.5;}return Math.max(1.2,156-(t-TIMING.glide)*GLIDE_SPEED);}
export const boostFactor=(s:{tick:number;boostStart:number;boostUntil:number})=>1+.25*Math.min(smooth((s.tick-s.boostStart)/7.2),smooth((s.boostUntil-s.tick)/7.2));
// Rotation about the aperture normal, shared by rendering and the five-point collision polygon.
export const objectAngle=(o:{t:number},t:number)=>t*.55+.18*Math.sin((t-o.t)*1.8);
export function inStarHole(x:number,y:number,r:number,angle:number,padding=0){
 const c=Math.cos(angle),s=Math.sin(angle),px=(x*c+y*s)/r,py=(-x*s+y*c)/r;let inside=false,edgeDistance=Infinity;
 for(let i=0,j=9;i<10;j=i++){
  const a=i*Math.PI/5+Math.PI/2,b=j*Math.PI/5+Math.PI/2,ra=i%2?.53:.9,rb=j%2?.53:.9,ax=Math.cos(a)*ra,ay=Math.sin(a)*ra,bx=Math.cos(b)*rb,by=Math.sin(b)*rb;
  if((ay>py)!==(by>py)&&px<(bx-ax)*(py-ay)/(by-ay)+ax)inside=!inside;
  const dx=bx-ax,dy=by-ay,u=clamp(((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy),0,1);
  edgeDistance=Math.min(edgeDistance,Math.hypot(px-ax-u*dx,py-ay-u*dy));
 }
 // The pilot has a body radius: an aperture overlap is not a point-in-polygon test.
 return inside||edgeDistance<=padding/r+1e-9;
}
export function exitOffset(t:number){return t<3?5-11.2*smooth((t-1.15)/1.85):-6.2-2.2*smooth(t-3);}
export const worldZ=(y:number,_t=0)=>y;
export const approachOffset=(_t:number)=>0;
export type Input={x:number;y:number};
export type Phase='drop'|'sky'|'build'|'cloud'|'land'|'finish';
export type Kind='sol'|'term'|'community'|'gate'|'star'|'risk'|'water'|'delivery'|'gas'|'rug'|'hacked'|'rare'|'magnet'|'island';
export type ObjectDef={id:string;kind:Kind;t:number;x:number;y:number;r:number;motion:number;penaltyScale?:number;fallSpeed?:number;family?:number;sequence?:string;order?:number;count?:number;alt?:number;vertical?:boolean;attracted?:{x:number;y:number;z:number}};
export type SequenceState={status:'active'|'failed'|'completed';next:number;activatedTick:number};
export type CashEvent={tick:number;kind:string;delta:number;balance:number;sourceId?:string};
export const ECONOMY={funded:500000,sol:15000,community:25000,term:150000,star:15000,sequence:100000,delivery:5000,gas:37500,rug:50000,hacked:75000,tower:37500} as const;
export const ISLAND={chance:.35,duration:10*HZ,multiplier:2} as const;
export const CONTENT_CATALOG=[
 {id:'island',name:'$ISLAND',group:'Utility',effect:'+1 local $ISLAND · positive SOL x2 for 10 s; refresh, never stack',phase:'Fall · 35% of runs; at most one',collider:'Swept sphere; no magnetic attraction'},
 {id:'sol',name:'SOL',group:'Reward',effect:'+15,000',phase:'Fall / glide',collider:'Swept sphere + magnetic attraction'},
 {id:'term',name:'Signed Term Sheet',group:'Reward',effect:'+150,000',phase:'Fall',collider:'Swept sphere + magnetic attraction'},
 {id:'community',name:'Community',group:'Reward',effect:'+25,000',phase:'Fall',collider:'Swept sphere + magnetic attraction'},
 {id:'star',name:'Hollow Star',group:'Challenge',effect:'+15,000 · speed +25% for 1.2 s',phase:'Fall / glide',collider:'Swept plane / five-point aperture'},
 {id:'gate',name:'Striped Ring Sequence',group:'Challenge',effect:'+100,000 only when every ring is crossed in order',phase:'Fall / glide',collider:'Swept circular aperture'},
 {id:'magnet',name:'Magnet',group:'Utility',effect:'Attract cash pickups for 8 s; refreshes, never stacks',phase:'Fall',collider:'Swept sphere'},
 {id:'water',name:'Water',group:'Utility',effect:'Halves the next hit; no expiry timer',phase:'Fall',collider:'Swept sphere'},
 {id:'rare',name:'Rare Cargo',group:'Cosmetic',effect:'Cosmetic unlock · no cash',phase:'Fall · 4% of eligible runs; land to keep',collider:'Swept sphere'},
 {id:'delivery',name:'Delivery',group:'Reward',effect:'+5,000',phase:'Fall',collider:'Swept sphere'},
 {id:'gas',name:'ETH GAS FEE',group:'Obstacle',effect:'−37,500',phase:'Fall / glide',collider:'Swept sphere'},
 {id:'rug',name:'Rug Pull',group:'Obstacle',effect:'−50,000',phase:'Fall / glide',collider:'Swept sphere'},
 {id:'hacked',name:'Hacked',group:'Obstacle',effect:'−75,000',phase:'Fall / glide',collider:'Swept sphere'},
 {id:'tower',name:'Buildings & structures',group:'Obstacle',effect:'−37,500 · blocks movement',phase:'Glide',collider:'Swept box'},
 {id:'ocean',name:'Ocean',group:'Hazard',effect:'Run lost · capital becomes 0',phase:'Landing',collider:'Authoritative coast polygon'},
] as const;
export const penaltyScale=(section:number)=>section<2?.02:section<4?.2:1;
export type Destination='beach'|'terrace'|'jurere';
// Geographic north is far from the southern flight entry; all map layers share this transform.
export const mapPoint=(x:number,z:number)=>({x:-x,z:-z});
export const DESTINATIONS=[
 {id:'beach' as Destination,name:'South Beach',x:30,z:50,height:4.6,color:'#72f3cb',radius:8, difficulty:'OPEN',bonus:0,style:'SAFE LANDING'},
 {id:'terrace' as Destination,name:'Island Terrace',x:0,z:-30,height:5.2,color:'#8ce1ff',radius:7,difficulty:'PRECISION',bonus:.15,style:'+15%'},
 {id:'jurere' as Destination,name:'Jurerê',x:0,z:-100,height:2,color:'#ffc55e',radius:6,difficulty:'CURRENTS REQUIRED',bonus:.5,style:'+50%'}];
// Simplified OSM relation 3360578; © OpenStreetMap contributors, ODbL 1.0.
const geographicCoast:[number,number][]=[[61.214,110.135],[55.055,119.487],[53.333,124.081],[54.045,127.227],[52.182,131.217],[48.385,131.517],[46.812,139.574],[48.909,145.793],[44.886,148.442],[43.179,146.301],[42.975,142.817],[39.595,142.512],[35.577,144.032],[33.017,139.882],[37.563,133.558],[38.203,126.682],[37.198,123.653],[33.21,120.122],[23.055,116.432],[10.23,116.443],[6.759,114.393],[5.044,109.172],[2.307,108.386],[-8.132,109.587],[-17.892,113.566],[-21.342,103.625],[-30.289,100.636],[-35.384,93.778],[-33.035,94.13],[-30.514,98.445],[-25.02,97.509],[-22.672,99.153],[-20.015,97.824],[-17.364,93.315],[-18.371,90.86],[-17.358,88.42],[-22.27,89.955],[-22.904,85.876],[-24.659,84.475],[-26.14,85.424],[-27.038,81.533],[-29.403,80.555],[-30.638,74.3],[-29.54,72.91],[-30.596,71.113],[-26.94,71.839],[-21.013,68.217],[-20.648,61.727],[-15.637,55.017],[-16.914,51.816],[-19.592,51.278],[-23.191,47.733],[-21.509,43.309],[-25.242,37.696],[-19.278,33.33],[-15.566,33.812],[-11.135,31.605],[-17.504,22.756],[-20.766,22.45],[-16.734,17.96],[-16.137,16.152],[-17.138,13.596],[-21.989,13.553],[-22.773,14.805],[-24.001,14.212],[-29.357,16.452],[-29.528,14.816],[-33.24,11.798],[-34.273,7.22],[-44.595,2.816],[-45.728,0.975],[-43.909,-1.765],[-44.044,-3.525],[-37.319,-8.192],[-36.442,-9.836],[-37.219,-11.26],[-36.363,-11.398],[-37.193,-13.507],[-35.264,-13.918],[-33.989,-16.307],[-29.988,-12.406],[-29.502,-13.861],[-25.222,-15.618],[-25.847,-16.372],[-24.288,-17.306],[-24.5,-20.801],[-23.07,-22.987],[-23.917,-25.147],[-22.246,-32.086],[-22.624,-36.581],[-20.791,-37.254],[-21.411,-39.589],[-28.345,-38.205],[-28.667,-36.979],[-30.77,-36.992],[-31.982,-35.539],[-38.212,-38.666],[-39.798,-38.115],[-46.381,-52.988],[-50.793,-55.69],[-47.734,-59.407],[-50.699,-64.625],[-47.648,-67.201],[-47.178,-70.407],[-45.429,-71.453],[-42.241,-70.475],[-39.235,-72.456],[-38.49,-74.738],[-43.289,-80.617],[-46.23,-87.139],[-44.678,-100.879],[-42.488,-103.994],[-43.647,-110.332],[-49.428,-115.649],[-56.635,-117.817],[-51.62,-121.527],[-52.516,-129.228],[-50.195,-131.852],[-49.844,-135.126],[-44.582,-136.423],[-43.29,-138.739],[-47.753,-145.087],[-47.14,-147.234],[-44.304,-149.002],[-42.875,-152.913],[-46.904,-157.429],[-47.041,-160.467],[-49.687,-165.835],[-49.729,-169.685],[-47.408,-167.908],[-45.219,-167.983],[-43.303,-169.107],[-43.052,-171.512],[-33.693,-165.298],[-31.727,-160.691],[-30.993,-154.365],[-27.959,-149.389],[-28.926,-146.917],[-27.071,-144.652],[-27.768,-142.034],[-21.737,-133.835],[-17.09,-131.355],[-11.998,-131.624],[-10.338,-132.769],[-11.216,-136.993],[-9.312,-139.444],[-6.396,-139.591],[-5.235,-140.722],[-2.368,-140.116],[-0.353,-137.681],[1.744,-137.182],[4.297,-133.122],[1.049,-128.657],[2.582,-125.414],[4.716,-123.057],[7.727,-124.401],[8.852,-123.493],[7.452,-117.785],[2.893,-116.334],[1.333,-113.055],[-3.673,-114.559],[-6.416,-110.124],[-4.986,-107.598],[-6.675,-109.541],[-9.647,-107.986],[-10.938,-103.639],[-10.694,-95.173],[-5.018,-79.746],[-1.162,-74.254],[5.091,-68.684],[8.558,-52.124],[13.986,-40.486],[24.614,-25.733],[26.062,-24.847],[26.86,-25.803],[28.038,-25.364],[28.225,-21.253],[31.76,-18.764],[31.632,-16.862],[36.249,-15.94],[35.839,-13.377],[34.842,-13.986],[33.807,-12.996],[33.883,-9.239],[37.002,-4.211],[38.467,-4.431],[37.841,-2.291],[39.49,0.13],[41.63,0.991],[43.76,0.325],[44.732,3.086],[43.594,6.978],[48.106,12.19],[48.258,14.041],[46.031,15.211],[42.866,13.325],[42.147,14.733],[40.704,13.623],[38.136,17.439],[37.533,25.457],[40.369,37.609],[47.044,52.11],[56.995,67.529],[64.397,75.978],[67.416,78.295],[69.334,77.612],[70.946,78.618],[70.429,80.424],[71.97,84.873],[69.916,89.255],[71.883,96.05],[73.854,100.027],[79.646,101.205],[80.188,102.438],[81.268,106.829],[77.222,112.179],[74.368,107.096],[74.378,104.779],[73.129,104.273],[66.826,105.831]];
export const COAST:[number,number][]=geographicCoast.map(([x,z])=>[-x,-z]);
export function isSafeLanding(x:number,z:number){let inside=false;for(let i=0,j=COAST.length-1;i<COAST.length;j=i++){const a=COAST[i],b=COAST[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
export function coastDistance(x:number,z:number){let nearest=Infinity;for(let i=0;i<COAST.length;i++){const a=COAST[i],b=COAST[(i+1)%COAST.length],dx=b[0]-a[0],dz=b[1]-a[1],u=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz),0,1);nearest=Math.min(nearest,Math.hypot(x-a[0]-u*dx,z-a[1]-u*dz));}return nearest;}
export function terrainHeight(x:number,z:number){if(!isSafeLanding(x,z))return 0;const shore=coastDistance(x,z);const hills=18*Math.exp(-((x+25)**2/400+(z+15)**2/1800))+24*Math.exp(-((x-18)**2/260+(z-95)**2/1200));let h=Math.min(shore*.65,1.4+hills);for(const d of DESTINATIONS){const distance=Math.hypot(x-d.x,z-d.z);if(distance<d.radius+2)h=h+(d.height-.12-h)*(1-smooth((distance-d.radius)/2));}return h;}
export const BUILDINGS=Array.from({length:24},(_,i)=>{const row=Math.floor(i/6),x=20-(i%6)*8,z=-85+row*12;return{id:`building-${i}`,x,z,w:4+i%3,d:5+i%2,h:5+(i*7%9),style:i%3};}).filter(b=>isSafeLanding(b.x,b.z)&&coastDistance(b.x,b.z)>7&&!DESTINATIONS.some(d=>Math.hypot(b.x-d.x,b.z-d.z)<d.radius+5));
export const LANDMARK_BLOCKERS=[{id:'jurere-left',x:-10,z:-96,w:3,d:3,h:9},{id:'jurere-right',x:10,z:-96,w:3,d:3,h:9}];
export const LAND_HAZARDS=BUILDINGS.map(b=>({x:b.x,z:b.z,r:b.w/2,h:b.h}));
// Visible, finite updraft corridors. Lift budget prevents orbiting indefinitely.
export const UPDRAFTS=[{x:-22,z:250,r:17,low:95,high:150},{x:22,z:210,r:17,low:75,high:140}];
export type Result={status:'funded'|'underfunded'|'out-of-runway';outcome:'landed'|'water'|'bankrupt';destination:Destination|null;cashFinal:number;score:number;breakdown:Record<string,number>;landing:number;emergency:boolean};
export type State={seed:number;tick:number;routeTime:number;boostStart:number;boostUntil:number;phase:Phase;x:number;y:number;vx:number;vy:number;altitude:number;verticalSpeed:number;lift:number;inUpdraft:boolean;landedTick:number;outcome:'landed'|'water'|'bankrupt'|null;cash:number;income:number;loss:number;bonus:number;burn:number;burnRemainder:number;events:CashEvent[];samples:{tick:number;cash:number}[];objects:ObjectDef[];collected:string[];terms:number;community:number;gates:number;sequences:Record<string,SequenceState>;precision:number;risk:number;shield:number;magnetUntil:number;islandBoostUntil:number;islandCollected:number;immuneUntil:number;rare:number|null;rareCollected:boolean;result:Result|null;landed:boolean;landingQuality:number;destination:Destination|null;emergency:boolean;hazardHits:number;lastHitTick:number};
export function rng(seed:number){let s=seed>>>0;return()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export function phaseAt(t:number):Phase{return t<TIMING.exit?'drop':t<TIMING.sky?'sky':t<TIMING.cloud?'build':t<TIMING.glide?'cloud':'land';}
export const TEMPLATES=[[-5,3,5,-3],[4,-4,-5,3],[-4,5,-3,4],[5,0,-5,0],[-5,-3,5,3],[4,4,-4,-4],[-6,2,6,-2],[6,-2,-6,2]];
export const TOTAL_SOL=128;
export const COURSE_CONFIG={weights:{delivery:4,gas:3,rug:2,hacked:.6},maxHacked:4,secondaryChance:.55,rareChance:.04,chainLengths:[3,4,6],chainSpacing:2.5} as const;
// The current ring is the only collidable/renderable member of its chain.
export function sequenceActive(s:State,o:ObjectDef){if(!o.sequence)return true;const chain=s.sequences[o.sequence];return !chain?o.order===0:chain.status==='active'&&chain.next===o.order;}
export function ringReveal(s:State,o:ObjectDef){const tick=o.sequence?s.sequences[o.sequence]?.activatedTick:undefined;return tick===undefined?0:smooth((s.tick-tick)/(HZ*.26));}
export function generate(seed:number,rareChance:number=COURSE_CONFIG.rareChance):ObjectDef[]{const rand=rng(seed),objects:ObjectDef[]=[];let last=-1,hacks=0;const recent:Kind[]=[];
 const choose=(hazardOnly=false):Kind=>{const options=Object.entries(COURSE_CONFIG.weights).filter(([kind])=>(!hazardOnly||kind!=='delivery')&&kind!==recent.at(-1)&&(kind!=='hacked'||hacks<COURSE_CONFIG.maxHacked&&!recent.slice(-3).includes('hacked')));let ticket=rand()*options.reduce((sum,[,weight])=>sum+weight,0);let selected=options.at(-1)![0] as Kind;for(const [kind,weight]of options){ticket-=weight;if(ticket<0){selected=kind as Kind;break;}}if(selected==='hacked')hacks++;recent.push(selected);return selected;};
 // Delivery placeholders are mixed slots; gas placeholders are hazard-only slots.
 // Resolve their weighted kinds in chronological order after spatial clearance.
 const add=(kind:Kind,t:number,x:number,y:number,r=.5,motion=0)=>objects.push({id:`${kind}-${objects.length}`,kind,t,x,y,r,motion});
 for(let section=0;section<12;section++){let family=Math.floor(rand()*4);if(family===last)family=(family+1)%4;last=family;const path=TEMPLATES[family*2+Math.floor(rand()*2)],mirror=rand()<.5?-1:1,begin=6+section*7;
  // Two vertical strings per section: readable lanes, reachable transfer, 0.55s spacing.
  for(let lane=0;lane<2;lane++)for(let j=0;j<4;j++){const t=begin+lane*3.2+j*.55,x=(path[lane*2]+j*.18*(lane?-1:1))*mirror,y=START_Z+Math.sin(section+lane)*3;add('sol',t,x,y);if(lane===1&&j===3)add('star',t+.55,x,y,.6);}
  const hx=section%2?3:-3;if(section!==7)add('delivery',begin+3.5,hx,START_Z,1.15,section%3===0?.7:0);
  if(section>1&&section!==7&&rand()<COURSE_CONFIG.secondaryChance)add('delivery',begin+5.7,-hx,START_Z+4,1.35);
  if(section>1)add('delivery',begin+1.7,-path[0]*mirror,START_Z-3,1.1,.4);
 }
 // Visible centre-line hazards leave both lateral escape routes open. No inactivity penalty.
 [18,29,41,53,68,80,88].forEach((time)=>add('gas',time,0,START_Z-8.4,1.45));
 // Precision slaloms are authored challenges, not a wrapper around every pickup.
 const lengths=[...COURSE_CONFIG.chainLengths];for(let i=lengths.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[lengths[i],lengths[j]]=[lengths[j],lengths[i]];}
 [20,45,76].forEach((start,index)=>{const count=lengths[index],direction=rand()<.5?-1:1;for(let i=0;i<count;i++)objects.push({id:`chain-${start}-${i}`,kind:'gate',t:start+i*COURSE_CONFIG.chainSpacing,x:(i-(count-1)/2)*1.3*direction,y:START_Z+2,r:1.9,motion:0,sequence:`sky-${start}`,order:i,count});});
 // Storm corridors remain open down the middle; dangers appear before the dense cloud bank.
 [74,78,82,86,89].forEach((t,i)=>add('delivery',t,i%2?-4:4,START_Z+3,1.3,.45));
 [19,74].forEach((t,i)=>add('term',t,i?4:-4,START_Z-3));[12,43,86].forEach((t,i)=>add('community',t,i%2?-4:4,START_Z+2));[22,39,63,83].forEach((t,i)=>add('star',t,i%2?7:-7,START_Z-4,.6));
 for(const t of [32,65])for(let j=0;j<4;j++)add('sol',t+j*.6,(j-1.5)*1.1,START_Z-2); add('water',88,3,START_Z);add('magnet',25,-3,START_Z);add('magnet',76,3,START_Z);
 // Three continuous approaches: wide coast, technical terrace, and a current-dependent far landing.
 for(let route=0;route<DESTINATIONS.length;route++){
  const start=START_Z-8.4;
  const trail=route===0?[[28,120,278],[30,110,250],[30,101,223],[30,111,195],[30,91,139],[30,70,84],[30,39,50],[30,18,50]]:route===1?[[0,131,297],[0,110,242],[0,89,186],[0,68,131],[0,58,103],[0,47,75],[0,37,48],[0,27,20]]:[[-22,131,300],[-22,120,272],[-22,127,244],[-17,124,219],[-6,113,195],[0,92,141],[0,61,58],[0,30,-25]];
  trail.forEach(([x,alt,z],j)=>objects.push({id:`land-sol-${route}-${j}`,kind:'sol',t:98,x,y:z,r:.55,motion:0,alt,vertical:true}));
  if(route>0)for(let j=0;j<3;j++){
   const z=(route===1?115:80)-j*23,alt=(route===1?62.5:69.4)-j*8.63;
   objects.push({id:`land-gate-${route}-${j}`,kind:'gate',sequence:`landing-${route}`,order:j,count:3,t:98,x:route===1?[2,-2,2][j]:[-2,2,-2][j],y:z,r:3.5,motion:0,alt,vertical:true});
  }
  for(let j=0;j<4;j++){
   const z=220-j*65,x=route===0?18+(j%2?5:-5):route===1?(j%2?8:-7):(j%2?-16:4),alt=156-(start-z)/27.73*GLIDE_SPEED+(route===2?20:0);
   objects.push({id:`land-hazard-${route}-${j}`,kind:'gas',t:98,x,y:z,r:1.7+route*.2,motion:0,alt,vertical:true,penaltyScale:1});
  }
 }
 const rareRoll=rand();if(rareRoll<clamp(rareChance,.02,.05))add('rare',55,0,START_Z,.7);
 const mapped=objects.map((o,i)=>({...o,penaltyScale:o.penaltyScale??penaltyScale(Math.max(0,Math.floor((o.t-6)/7))),t:flightTime(o.t),alt:o.alt??(1113-(o.t-4)*10.5),fallSpeed:o.vertical?0:({sol:2.2,star:.6,gate:.5,term:1.4,community:1.8} as Record<string,number>)[o.kind]??(3+(i*17%13)/10),r:o.kind==='star'?1.65:o.r})).sort((a,b)=>a.t-b.t||a.id.localeCompare(b.id));
 // Keep authored coin strings. Other solids cannot overlap each other or ring apertures.
 const placed:ObjectDef[]=[];for(const o of mapped){if(['delivery','gas','rug','hacked'].includes(o.kind)){
 const clash=(p:ObjectDef,gap:number)=>!!p.vertical===!!o.vertical&&Math.hypot(o.x-p.x,o.y-p.y,(o.alt??0)-(p.alt??0))<o.r+p.r+gap;
 if(placed.some(p=>['delivery','gas','rug','hacked'].includes(p.kind)&&clash(p,1))||mapped.some(p=>p.kind==='gate'&&clash(p,2)))continue;
 o.kind=choose(o.kind!=='delivery');// Retain existing encounter IDs when the expanded cosmetic-only pool adds a slot.
 o.id=`encounter-${placed.length-(rareRoll>=.02&&placed.some(p=>p.kind==='rare')?1:0)}`;}placed.push(o);}
 // Alternatives after the two lift columns; no RNG consumption or legacy encounter changes.
 for(const [i,x,z,h] of [[0,-22,230,128],[1,22,190,113]])placed.push({id:`glide-star-${i}`,kind:'star',t:TIMING.glide,x,y:z,alt:h,r:3.2,motion:0,fallSpeed:0,vertical:true});
 // Independent roll: existing SOL strings, hazards, IDs and routes stay identical.
 const special=rng(seed^0x49534c44);
 if(special()<ISLAND.chance){const side=special()<.5?-1:1,start=30+special()*28;
  for(let n=0;n<5;n++){const authored=start+n*1.1,alt=1113-(authored-4)*10.5,x=side*6.6,z=START_Z-4;
   if(placed.some(o=>!o.vertical&&Math.hypot(o.x-x,o.y-z,(o.alt??0)-alt)<o.r+3))continue;
   placed.push({id:`island-${seed>>>0}`,kind:'island',t:flightTime(authored),x,y:z,alt,r:.65,motion:0,fallSpeed:1});break;}
 }
 return placed;}

export function objectRadius(kind:string){return kind==='sol'?.42:kind==='term'?.6:kind==='community'?.52:kind==='water'||kind==='magnet'?.5:kind==='island'?.65:kind==='rare'?.55:kind==='star'?1.65:1.8;}
export function objectPosition(o:ObjectDef,t:number){return{x:o.x+Math.sin((t-o.t)*.6)*o.motion,y:o.y};}
export function objectAltitude(o:{t:number;alt?:number;vertical?:boolean;fallSpeed?:number},t:number){return (o.alt??altitudeAt(o.t))-(o.vertical?0:o.fallSpeed??2)*(t-o.t);}
export function objectPose(o:ObjectDef,t:number){if(o.attracted)return {...o.attracted};const p=objectPosition(o,t);return{x:p.x,y:objectAltitude(o,t),z:p.y};}
export function initialState(seed:number):State{return{seed:seed>>>0,tick:0,routeTime:0,boostStart:-100,boostUntil:-100,phase:'drop',x:0,y:START_Z+exitOffset(0),vx:0,vy:0,altitude:altitudeAt(0),verticalSpeed:0,lift:0,inUpdraft:false,landedTick:-1,outcome:null,cash:START_CASH,income:0,loss:0,bonus:0,burn:0,burnRemainder:0,events:[],samples:[{tick:0,cash:START_CASH}],objects:generate(seed),collected:[],terms:0,community:0,gates:0,sequences:{},precision:0,risk:0,shield:0,magnetUntil:0,islandBoostUntil:0,islandCollected:0,immuneUntil:0,rare:Math.floor(rng(seed^0xabc123)()*3),rareCollected:false,result:null,landed:false,landingQuality:0,destination:null,emergency:false,hazardHits:0,lastHitTick:-100};}
export function money(s:State,delta:number,kind:string,id?:string){if(s.result)return;const actual=Math.max(-s.cash,Math.round(delta*(delta>0&&s.tick<s.islandBoostUntil?ISLAND.multiplier:1)));s.cash+=actual;if(kind==='landing-bonus')s.bonus+=actual;else if(actual>0)s.income+=actual;else s.loss-=actual;s.events.push({tick:s.tick,kind,delta:actual,balance:s.cash,sourceId:id});if(!s.cash&&!s.outcome){s.outcome='bankrupt';s.landedTick=s.tick;finish(s);}}
export function damage(s:State,value:number,kind:string,id:string){if(s.tick<s.immuneUntil||s.outcome||s.result)return;s.immuneUntil=s.tick+48;s.lastHitTick=s.tick;s.hazardHits++;if(s.shield>0){value=Math.round(value*.5);s.shield--;}money(s,-value,kind,id);}
export function destinationBonus(s:State,id:Destination){return Math.round(s.cash*DESTINATIONS.find(d=>d.id===id)!.bonus);}
export function scoreBreakdown(s:State){return{initial:START_CASH,earned:s.income,lost:s.loss?-s.loss:0,bonus:s.bonus};}
export function finish(s:State){if(s.result)return;s.result={status:s.outcome!=='landed'?'out-of-runway':s.cash>=ECONOMY.funded?'funded':'underfunded',outcome:s.outcome||'bankrupt',destination:s.destination,cashFinal:s.cash,score:s.cash,breakdown:scoreBreakdown(s),landing:s.landingQuality,emergency:s.emergency};s.phase='finish';s.samples.push({tick:s.tick,cash:s.cash});}
// A failed chain is terminal. No catch-up, retry, or partial payout in the same run.
export function failSequence(s:State,o:ObjectDef){if(!o.sequence||!sequenceActive(s,o))return;s.sequences[o.sequence]={status:'failed',next:o.order??0,activatedTick:s.tick};s.events.push({tick:s.tick,kind:'sequence-missed',delta:0,balance:s.cash,sourceId:o.id});}
export function collectSequence(s:State,o:ObjectDef){
 if(!o.sequence||o.order===undefined||!o.count||s.result)return;
 const chain=s.sequences[o.sequence]??{status:'active',next:0,activatedTick:s.tick};
 if(chain.status!=='active'||o.order<chain.next)return; // Duplicate contacts are idempotent.
 if(o.order!==chain.next){failSequence(s,{...o,order:chain.next});return;}
 const next=chain.next+1,complete=next===o.count;
 s.sequences[o.sequence]={status:complete?'completed':'active',next,activatedTick:s.tick};s.gates++;
 if(complete){s.precision+=ECONOMY.sequence;money(s,ECONOMY.sequence,'sequence-complete',o.id);}
 else s.events.push({tick:s.tick,kind:'sequence-ring',delta:0,balance:s.cash,sourceId:o.id});
}
export function quantize(input:Input):[number,number]{let{x,y}=input;const l=Math.hypot(x,y);if(l>1){x/=l;y/=l;}return[Math.round(clamp(x,-1,1)*127),Math.round(clamp(y,-1,1)*127)];}
export function decoded(pair:[number,number]):Input{return{x:pair[0]/127,y:pair[1]/127};}
const approach=(v:number,target:number,by:number)=>v<target?Math.min(target,v+by):Math.max(target,v-by);
type Point={x:number;y:number;z:number};
// Swept sphere against an ellipsoid, in relative coordinates (object also moves).
function sweep(a:Point,b:Point,ra:Point,rb:Point,r:Point){const p=[(a.x-ra.x)/r.x,(a.y-ra.y)/r.y,(a.z-ra.z)/r.z],q=[(b.x-rb.x)/r.x,(b.y-rb.y)/r.y,(b.z-rb.z)/r.z],d=q.map((v,i)=>v-p[i]);const n=d.reduce((v,x)=>v+x*x,0),u=n?clamp(-p.reduce((v,x,i)=>v+x*d[i],0)/n,0,1):0;return p.reduce((v,x,i)=>v+(x+d[i]*u)**2,0)<=1;}
function sweepBox(a:Point,b:Point,c:Point,r:Point){let lo=0,hi=1;for(const key of ['x','y','z'] as const){const d=b[key]-a[key],p=a[key]-c[key];if(Math.abs(d)<1e-9){if(Math.abs(p)>r[key])return false;}else{const u=(-r[key]-p)/d,v=(r[key]-p)/d;lo=Math.max(lo,Math.min(u,v));hi=Math.min(hi,Math.max(u,v));if(lo>hi)return false;}}return true;}
export function contactDistance(o:ObjectDef,t:number,x:number,y:number,h=altitudeAt(t)){const p=objectPose(o,t);return Math.hypot(x-p.x,y-p.z,h-p.y);}
// A generous pickup envelope follows the visible arms/head; damage keeps its tighter body sphere.
export function contactRadii(o:ObjectDef){const authoredBounds=['delivery','gas','rug','hacked'].includes(o.kind),base=authoredBounds?o.r:objectRadius(o.kind);return authoredBounds?{x:base+PILOT_RADIUS,y:base+PILOT_RADIUS,z:base+PILOT_RADIUS}:{x:(base+.85),y:(base+.7),z:(base+1.05)};}
export function touchesObject(o:ObjectDef,t:number,x:number,y:number,_legacy=false,h=altitudeAt(t)){const p=objectPose(o,t);return sweep({x,y:h,z:y},{x,y:h,z:y},p,p,contactRadii(o));}
export function landingSurface(x:number,z:number){for(const d of DESTINATIONS)if(Math.hypot(x-d.x,z-d.z)<=d.radius)return d.height;return terrainHeight(x,z);}
function land(s:State){s.landedTick=s.tick;s.phase='finish';s.vx=s.vy=s.verticalSpeed=0;if(!isSafeLanding(s.x,s.y)){s.outcome='water';s.emergency=true;money(s,-s.cash,'splashdown');return;}
 s.outcome='landed';s.landed=true;for(const d of DESTINATIONS){const dist=Math.hypot(s.x-d.x,s.y-d.z);if(dist<=d.radius){s.destination=d.id;s.landingQuality=Math.round(500*(1-dist/d.radius));break;}}
 s.events.push({tick:s.tick,kind:s.destination||'safe-landing',delta:0,balance:s.cash});if(s.destination)money(s,destinationBonus(s,s.destination),'landing-bonus');}
export function step(s:State,input:Input){if(s.result)return;s.tick++;if(s.tick%60===0)s.samples.push({tick:s.tick,cash:s.cash});
 if(s.outcome){if(s.tick-s.landedTick>=TIMING.celebrate*HZ||s.tick>=END_TICK)finish(s);return;}
 if(s.tick>=END_TICK){s.outcome='water';s.emergency=true;money(s,-s.cash,'rescue-failed');finish(s);return;}
 const previousRoute=s.routeTime,boost=boostFactor(s),rate=previousRoute>=TIMING.glide?1:boost;s.routeTime+=rate/HZ;const route=s.routeTime;s.phase=phaseAt(route);const before:Point={x:s.x,y:s.altitude,z:s.y};
 if(route<=TIMING.exit){s.y=START_Z+exitOffset(route);s.altitude=altitudeAt(route);s.vy=(s.y-before.z)*HZ;s.verticalSpeed=(s.altitude-before.y)*HZ;return;}
 const magnitude=Math.max(1,Math.hypot(input.x,input.y)),ix=input.x/magnitude,iy=-input.y/magnitude,glide=s.phase==='land',pace=glide?GLIDE_SPEED/3*boost:FALL_SPEED/13.65;
 s.vx=approach(s.vx,ix*(glide?5:7)*pace,(Math.abs(ix)<.02?18:glide?8:24)*pace/HZ);
 s.vy=approach(s.vy,(iy*(glide?5:7)-(glide?3:0))*pace,(Math.abs(iy)<.02?18:glide?8:24)*pace/HZ);
 s.x+=s.vx/HZ;s.y+=s.vy/HZ;
 if(!glide){s.x=clamp(s.x,-9,9);s.y=clamp(s.y,START_Z-10,START_Z+10);s.altitude=altitudeAt(route);s.verticalSpeed=(s.altitude-before.y)*HZ;}
 else{const inDraft=UPDRAFTS.some(d=>Math.hypot(s.x-d.x,s.y-d.z)<d.r&&s.altitude>d.low&&s.altitude<d.high);s.inUpdraft=inDraft&&s.lift<24;const lift=s.inUpdraft?Math.min(2*GLIDE_SPEED/HZ,24-s.lift):0;s.lift+=lift;s.verticalSpeed=-GLIDE_SPEED*rate+lift*HZ;s.altitude+=s.verticalSpeed/HZ;
  const ground=terrainHeight(s.x,s.y);for(const b of [...BUILDINGS,...LANDMARK_BLOCKERS]){if(s.altitude-PILOT_RADIUS>b.h||s.altitude<ground)continue;const bottom='bottom' in b?Number(b.bottom):0,p={x:b.x,y:(b.h+bottom)/2,z:b.z},r={x:b.w/2+PILOT_RADIUS,y:(b.h-bottom)/2+PILOT_RADIUS,z:b.d/2+PILOT_RADIUS};if(sweepBox(before,{x:s.x,y:s.altitude,z:s.y},p,r)){damage(s,ECONOMY.tower,'tower',b.id);s.x=before.x;s.y=before.z;const dx=s.x-b.x,dz=s.y-b.z;if(Math.abs(dx)/r.x>Math.abs(dz)/r.z)s.x=b.x+Math.sign(dx||1)*(r.x+.1);else s.y=b.z+Math.sign(dz||1)*(r.z+.1);s.vx=s.vy=0;}}
  const floor=landingSurface(s.x,s.y)+1.2;if(s.altitude<=floor){s.altitude=floor;land(s);return;}
 }
 if(s.result)return;
 const now={x:s.x,y:s.altitude,z:s.y};
 for(const o of s.objects){if(s.outcome||s.result)break;if((!!o.vertical!==glide&&!o.attracted)||s.collected.includes(o.id)||!sequenceActive(s,o))continue;let p=objectPose(o,route);
  if(o.sequence){let chain=s.sequences[o.sequence];if(!chain){if(p.y-s.altitude>36||s.altitude-p.y>170)continue;chain=s.sequences[o.sequence]={status:'active',next:0,activatedTick:s.tick};}if(chain.activatedTick===s.tick)continue;
   // Expire even a large miss outside the broad-phase height filter.
   if(o.vertical?before.z<=p.z:before.y<=p.y){failSequence(s,o);continue;}}
  const old=objectPose(o,previousRoute);
  if(['sol','term','community'].includes(o.kind)){const radii=contactRadii(o),factor=Math.max(1.15,s.tick<s.magnetUntil?2.5:1),distance=Math.hypot((now.x-p.x)/radii.x,(now.y-p.y)/radii.y,(now.z-p.z)/radii.z);
   if(o.attracted||distance<=factor){// Finite intercept speed exceeds the pilot's motion, including star boost.
    // Exponential pursuit alone converged to a permanent offset behind the pilot.
    const length=Math.hypot(now.x-p.x,now.y-p.y,now.z-p.z),speed=Math.hypot(s.vx,s.verticalSpeed,s.vy)+20,a=Math.min(1,speed/HZ/Math.max(length,.0001));p=o.attracted={x:p.x+(now.x-p.x)*a,y:p.y+(now.y-p.y)*a,z:p.z+(now.z-p.z)*a};}
  }
  const ring=['star','gate','risk'].includes(o.kind);let distance=0;
  // Rings use the complete relative segment, never an endpoint-only height cull.
  if(!ring&&Math.abs(s.altitude-p.y)>5+(o.r||1)&&!o.vertical)continue;
  if(ring){const a=o.vertical?before.z-old.z:before.y-old.y,b=o.vertical?now.z-p.z:now.y-p.y;if(!(a>=0&&b<=0&&a>b))continue;const u=a/(a-b),cx=before.x+(now.x-before.x)*u,cy=before.y+(now.y-before.y)*u,cz=before.z+(now.z-before.z)*u;
   const ox=old.x+(p.x-old.x)*u,oy=old.y+(p.y-old.y)*u,oz=old.z+(p.z-old.z)*u;distance=Math.hypot(cx-ox,o.vertical?cy-oy:cz-oz);if(o.kind==='star'?!inStarHole(cx-ox,o.vertical?cy-oy:oz-cz,o.r,objectAngle(o,previousRoute+(route-previousRoute)*u),PILOT_RADIUS):distance>o.r-PILOT_RADIUS*.3){if(o.sequence)failSequence(s,o);continue;}
  }else{if(!sweep(before,now,old,p,contactRadii(o)))continue;}
  s.collected.push(o.id);
  if(['gas','rug','hacked'].includes(o.kind)){damage(s,ECONOMY[o.kind as 'gas'|'rug'|'hacked']*(o.penaltyScale??1),o.kind,o.id);continue;}
  if(o.kind==='island'){s.islandCollected++;s.islandBoostUntil=s.tick+ISLAND.duration;s.events.push({tick:s.tick,kind:'island',delta:0,balance:s.cash,sourceId:o.id});}
  if(o.kind==='delivery')money(s,ECONOMY.delivery,'delivery',o.id);
  if(o.kind==='sol')money(s,ECONOMY.sol,'sol',o.id);
  if(o.kind==='term'){s.terms++;money(s,ECONOMY.term,'term',o.id);}
  if(o.kind==='community'){s.community++;money(s,ECONOMY.community,'community',o.id);}
  if(o.kind==='magnet'){s.magnetUntil=s.tick+480;s.events.push({tick:s.tick,kind:'magnet',delta:0,balance:s.cash,sourceId:o.id});}
  if(o.kind==='water'){s.shield=Math.max(s.shield,1);s.events.push({tick:s.tick,kind:'water',delta:0,balance:s.cash,sourceId:o.id});}
  if(o.kind==='star'){s.precision+=ECONOMY.star;if(s.tick>=s.boostUntil)s.boostStart=s.tick;s.boostUntil=s.tick+72;money(s,ECONOMY.star,'star',o.id);}
  if(o.kind==='gate')collectSequence(s,o);
  if(o.kind==='risk'){s.risk++;money(s,250,'risk',o.id);}
  if(o.kind==='rare'){s.rareCollected=true;s.events.push({tick:s.tick,kind:'rare',delta:0,balance:s.cash,sourceId:o.id});}
 }
}
export function replay(seed:number,frames:number[][]){if(frames.length>END_TICK/2)throw Error('Run too long');const s=initialState(seed);for(const pair of frames){if(!Array.isArray(pair)||pair.length!==2||pair.some(n=>!Number.isInteger(n)||Math.abs(n)>127))throw Error('Invalid input');const input=decoded(pair as [number,number]);step(s,input);step(s,input);if(s.result)break;}if(!s.result)throw Error('Incomplete run');return s;}
export function validateCourse(objects:ObjectDef[]){return objects.filter(o=>o.kind==='sol').length===TOTAL_SOL&&objects.every(o=>Number.isFinite(o.x+o.y+o.t)&&o.t>=4&&o.t<=TIMING.glide&&(o.vertical||o.t<TIMING.cloud));}
