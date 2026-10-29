import {terrainHeight} from '../core/simulation';
// Decorative westward crossing in the rotated map. This is inspired geography,
// not a survey of the real bridge. Local +Z points toward the mainland/haze.
export const BRIDGE={x:35,z:3,yaw:Math.atan2(.97,-.24),length:1400,width:7.2,deck:9.5,hazeNear:180,hazeFar:690};
export function bridgePoint(distance:number,side=0){return {x:BRIDGE.x+Math.sin(BRIDGE.yaw)*distance+Math.cos(BRIDGE.yaw)*side,z:BRIDGE.z+Math.cos(BRIDGE.yaw)*distance-Math.sin(BRIDGE.yaw)*side};}
export function bridgeHeight(distance:number,base=terrainHeight(BRIDGE.x,BRIDGE.z)){const t=Math.min(1,Math.max(0,distance/65));return base+.06+(BRIDGE.deck-base-.06)*(t*t*(3-2*t));}
export function bridgeClear(x:number,z:number,margin=0){const dx=x-BRIDGE.x,dz=z-BRIDGE.z,along=dx*Math.sin(BRIDGE.yaw)+dz*Math.cos(BRIDGE.yaw),side=dx*Math.cos(BRIDGE.yaw)-dz*Math.sin(BRIDGE.yaw);return along< -14-margin||along>BRIDGE.length+margin||Math.abs(side)>BRIDGE.width/2+margin;}
