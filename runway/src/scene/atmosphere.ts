import {CLOUD_DECK,TIMING} from '../core/simulation';
import {smooth} from '../services/presentation';

// The underside clears 0.2 s before the existing one-second canopy deployment.
// Fog, sky, sunlight, glare and scenery all sample this route clock (pause-safe).
export const CLOUD_REVEAL={start:TIMING.cloud-2.2,end:CLOUD_DECK.exit};
export function atmosphere(route:number,reduced=false){
 const clearing=smooth(CLOUD_REVEAL.start,CLOUD_REVEAL.end,route);
 const immersion=smooth(CLOUD_DECK.enter-3,CLOUD_DECK.enter+1.4,route)*(1-clearing);
 const exit=smooth(CLOUD_REVEAL.start+.5,TIMING.cloud+.05,route)*(1-smooth(TIMING.cloud+.05,TIMING.glide+1.6,route));
 return {immersion,clearing,exit,veil:exit*(reduced?.035:.13),exposure:1-immersion*.10+exit*(reduced?.035:.18),bloom:exit*(reduced?.06:.32)};
}
