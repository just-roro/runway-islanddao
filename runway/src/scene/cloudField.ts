import {START_Z,CLOUD_DECK,TIMING,altitudeAt} from '../core/simulation';

export type CloudLobe={x:number;y:number;z:number;sx:number;sy:number;sz:number;rotation:number;shade?:string;storm?:number};
export type CloudCard={x:number;y:number;z:number;width:number;height:number;tile:number};
// Fixed world coordinates: neither streaming at the player nor recycling at a visible boundary.
// Geometry ceiling without culling: 5,120 fair-weather + 8,448 storm + 10,240 middle + 240 distant triangles.
export function cloudField(seed=38){
 let state=seed>>>0;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const near:CloudLobe[]=[],middle:CloudLobe[]=[],far:CloudCard[]=[];
 const cluster=(out:CloudLobe[],x:number,y:number,z:number,size:number,lobes:number)=>{
  const angle=random()*Math.PI*2,stretch=.8+random()*.8;
  for(let l=0;l<lobes;l++){
   const offset=(l-(lobes-1)/2)*size*.8,bulge=.6+random()*.65;
   out.push({x:x+Math.cos(angle)*offset,y:y+(l%2)*size*.22,z:z+Math.sin(angle)*offset,
    sx:size*bulge*stretch,sy:size*(.4+random()*.28),sz:size*(.65+random()*.4),rotation:angle+random()*.8});
  }
 };
 // Sculpted banks beside every part of the descent, with a readable central lane.
 for(let i=0;i<16;i++){
  const y=215+i*49,angle=i*2.399,side=i%2?1:-1;
  cluster(near,side*(48+random()*38),y,START_Z+Math.sin(angle)*(36+random()*40),13+random()*9,4);
 }
 // A broad, staggered deck below the plane; its underside ends at canopy deployment.
 const top=altitudeAt(CLOUD_DECK.enter)+32;
 for(let i=0;i<32;i++){
  const ring=i<12?0:i<24?1:2,n=ring===2?8:12,j=ring===0?i:ring===1?i-12:i-24;
  const a=(j+.24+random()*.35)/n*Math.PI*2,radius=[220,500,860][ring]+random()*65;
  cluster(middle,Math.sin(a)*radius,top-(i%3)*135+random()*35,START_Z+Math.cos(a)*radius,58+random()*33,4);
 }
 // Horizon silhouettes on all azimuths, above AND below the bank. Their 8 atlas
 // variants have different profiles; differing proportions avoid a ring of clones.
 for(let i=0;i<120;i++){
  const layer=Math.floor(i/30),a=(i%30+random()*.7)/30*Math.PI*2;
  const radius=layer===3?680+random()*850:1100+random()*950;
  const width=170+random()*240,height=width*(.60+random()*.22);
  far.push({x:Math.sin(a)*radius,z:START_Z+Math.cos(a)*radius,y:layer===3?100+height*.45:top+(layer-1)*170+random()*100,width,height,tile:i%8});
 }
 // Close, dark storm banks: fixed world geometry down to the actual cloud exit.
 // The central aperture remains navigable; depth fog fills it without hiding near pickups.
 const bottom=altitudeAt(TIMING.cloud-.2)+12,topStorm=altitudeAt(CLOUD_DECK.enter)+10;
 for(let row=0;row<8;row++)for(let j=0;j<6;j++){
  const a=(j+row*.37)/6*Math.PI*2,r=51+random()*18;
  near.push({x:Math.cos(a)*r,y:bottom+(topStorm-bottom)*row/7,z:START_Z+Math.sin(a)*r,
   sx:39+random()*13,sy:29+random()*15,sz:29+random()*12,rotation:-a+Math.PI/2+(j%2?.12:-.12),storm:(row+j)%2,
   shade:row%3===0?'#a8b2c0':row%3===1?'#8c98ac':'#bac0c8'});
 }
 for(const c of [...near,...middle]){
  const radius=Math.hypot(c.x,c.z-START_Z),clear=Math.max(c.sx,c.sz)+(near.includes(c)?26:58);
  if(radius<clear){c.x*=clear/radius;c.z=START_Z+(c.z-START_Z)*clear/radius;}
 }
 return {near,middle,far};
}
