import {CLOUD_DECK,TIMING} from '../core/simulation';
// Same route clock as ramp, launchPose, deploymentPose and storm clearance.
export const AUDIO_MILESTONES=[['door',.05],['jump',2.46],['cloud',CLOUD_DECK.enter],['reveal',CLOUD_DECK.exit],['parachute',TIMING.cloud+.12]] as const;
export const crossedAudio=(before:number,after:number)=>AUDIO_MILESTONES.filter(([,at])=>before<at&&after>=at).map(([name])=>name);
