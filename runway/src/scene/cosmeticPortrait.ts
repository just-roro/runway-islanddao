import {useEffect,useMemo,useState} from 'react';
import * as T from 'three';
/** Two persistent GPU slots per actor; changing an accessory only replaces image data. */
export function useCosmeticPortrait(url:string|undefined,fallback:T.Texture){
 const [revision,setRevision]=useState(0);
 const slots=useMemo(()=>[0,1].map(()=>{const t=new T.Texture(fallback.image);t.magFilter=t.minFilter=T.NearestFilter;t.generateMipmaps=false;t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;return t;}),[]);
 useEffect(()=>{
  let cancelled=false;
  const install=(image:HTMLImageElement)=>{if(cancelled)return;slots[1].image=slots[0].image;slots[1].needsUpdate=true;slots[0].image=image;slots[0].needsUpdate=true;setRevision(v=>v+1);};
  if(url)new T.ImageLoader().load(url,install,undefined,()=>install(fallback.image as HTMLImageElement));else install(fallback.image as HTMLImageElement);
  return()=>{cancelled=true;};
 },[url,fallback,slots]);
 useEffect(()=>()=>{slots.forEach(t=>t.dispose());},[slots]);
 return {texture:slots[0],previous:slots[1],revision};
}
