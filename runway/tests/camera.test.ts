import{it,expect}from'vitest';
import{Vector3}from'three';
import{avoidScenery,cameraHasClearView}from'../src/scene/camera';
it('celebration orbit finds an unobstructed view beside the bridge pillars',()=>{const focus=new Vector3(-31.5,8.6,50);for(let i=0;i<25;i++){const a=i/24*Math.PI,position=new Vector3(focus.x+Math.sin(a)*7,12,focus.z+Math.cos(a)*7);avoidScenery(position,focus,true);expect(cameraHasClearView(position,focus)).toBe(true);}});
it('a clear camera pose is kept unchanged',()=>{const focus=new Vector3(0,100,220),position=new Vector3(0,118,234),copy=position.clone();avoidScenery(position,focus);expect(position.equals(copy)).toBe(true);});

it('the bridge deck cannot hide a landing just beside it',()=>{const focus=new Vector3(-31.5,4.8,46.5);for(let i=0;i<25;i++){const a=i/24*Math.PI,position=new Vector3(focus.x+Math.sin(a)*7,8.3,focus.z+Math.cos(a)*7);avoidScenery(position,focus,true);expect(cameraHasClearView(position,focus)).toBe(true);}});
