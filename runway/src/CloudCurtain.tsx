import {publicUrl} from './urls';
export function CloudPanels(){return <><img className="cloud-panel cloud-left" src={publicUrl('/assets/brand/cloud-left.png')} alt=""/><img className="cloud-panel cloud-right" src={publicUrl('/assets/brand/cloud-right.png')} alt=""/><div className="cloud-brand"><img src={publicUrl('/assets/brand/runway-official.png')} alt="RUNWAY"/><span>PREPARING YOUR FLIGHT</span></div></>;}
export const prepareCurtain=Promise.all(['cloud-left.png','cloud-right.png','landed.png'].map(file=>{const image=new Image();image.src=publicUrl('/assets/brand/')+file;return image.decode().catch(()=>{});}));
export const nextPaint=()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
export async function moveClouds(el:HTMLElement,closed:boolean){
 await prepareCurtain;
 if(!closed){await Promise.all([...el.querySelectorAll('.cloud-panel')].flatMap(panel=>panel.getAnimations().map(animation=>animation.finished.catch(()=>{}))));el.style.background='transparent';}
 el.style.visibility='visible';el.style.pointerEvents='all';
 const duration=matchMedia('(prefers-reduced-motion: reduce)').matches?1:850;
 const animations=[...el.querySelectorAll<HTMLElement>('.cloud-panel')].map((panel,i)=>{
  const outside=`translateX(${i===0?'-':''}105%)`;
  return panel.animate([{transform:closed?outside:'translateX(0)'},{transform:closed?'translateX(0)':outside}],{duration,easing:'cubic-bezier(.42,0,.58,1)',fill:'forwards'});
 });
 const brand=el.querySelector<HTMLElement>('.cloud-brand')!;
 animations.push(brand.animate([{opacity:closed?0:1},{opacity:closed?1:0}],{duration:duration*.6,fill:'forwards'}));
 await Promise.all(animations.map(a=>a.finished));
 if(closed)el.style.background='#d9effb';
 if(!closed){el.style.visibility='hidden';el.style.pointerEvents='none';}
}

// Wait for the current UI, including fonts and portrait images, before exposing it.
export async function prepareVisibleContent(){
 await nextPaint();await document.fonts.ready;
 await Promise.all([...document.querySelectorAll<HTMLImageElement>('#root img')].map(image=>image.decode().catch(()=>{})));
 await nextPaint();
}
