import {objectRadius,type Kind,type ObjectDef} from '../core/simulation';
// These rare silhouettes used to be smaller than a coin string and faded before
// they were readable. Presentation only: the swept contact envelopes are unchanged.
export const featuredPickup=(kind:Kind)=>kind==='term'||kind==='community'||kind==='magnet';
export function itemVisualSize(o:ObjectDef){return ['star','gate','risk','delivery','gas','rug','hacked'].includes(o.kind)?o.r:objectRadius(o.kind)*(featuredPickup(o.kind)?1.65:1);}
