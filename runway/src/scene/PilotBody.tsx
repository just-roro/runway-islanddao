import {publicUrl} from '../urls';
import type {ConversationMotion} from '../services/dialogue';
import {launchPose,deploymentPose,diveStrength,ease} from '../services/choreography';
import {useEffect, useMemo, useRef,type ReactNode} from 'react';
import {useFrame, useLoader} from '@react-three/fiber';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {TIMING, START_Z} from '../core/simulation';
import {activeImpact,buildingReaction,type Presentation} from '../services/presentation';
import type {Runtime} from '../services/runtime';

export const PILOT_MODEL_URL = publicUrl('/assets/models/runway-pilot.glb?v=art-33');

/** Only the suit: the existing Pilot owns the LED head, world banking and canopy. */
export function PilotBody({run, color, crew = false, reduced = false,presentation,head,previewGlide=false,conversation}: {conversation?:ConversationMotion;previewGlide?:boolean;
  run?: Runtime | null; color: string; crew?: boolean; reduced?: boolean;presentation:Presentation;head?:ReactNode;
}) {
  const source = useLoader(GLTFLoader, PILOT_MODEL_URL);
  const accent = useMemo(() => ({value: new THREE.Color(color)}), []);
  const targetAccent = useMemo(() => new THREE.Color(color), [color]);
  const model = useMemo(() => {
    const scene = clone(source.scene);
    scene.name = crew ? 'crew-skeletal-suit' : 'pilot-skeletal-suit';
    // Skeletons and materials belong to each actor; geometry stays shared and cached.
    const materials = new Map<THREE.Material, THREE.Material>();
    scene.traverse(object => {
      if (!(object instanceof THREE.SkinnedMesh)) return;
      object.castShadow = object.receiveShadow = true;
      object.frustumCulled = false;
      const recolor = (original: THREE.Material) => {
        let material = materials.get(original);
        if (!material) {
          // Keep the exported textile base, add a coated shell lobe only to its panels.
          // StandardMaterial.copy preserves vertex colours/skinning; Physical defaults
          // remain valid (Physical.copy from a Standard material would erase them).
          if(original instanceof THREE.MeshStandardMaterial&&original.name.includes('Woven')){
            const shell=new THREE.MeshPhysicalMaterial();
            THREE.MeshStandardMaterial.prototype.copy.call(shell,original);
            shell.defines={STANDARD:'',PHYSICAL:''};
            shell.clearcoat=.48;shell.clearcoatRoughness=.22;
            material=shell;
          }else material = original.clone();
          if(material instanceof THREE.MeshStandardMaterial){
            // Nylon picks up broad cabin/sky highlights; hardware stays sharper than cloth.
            if(crew)material.transparent=true;
            material.roughness=original.name.includes('Woven')?.64:original.name.includes('Satin')?.3:.86;
            material.metalness=original.name.includes('Satin')?.65:original.name.includes('Woven')?.025:.015;
            material.envMapIntensity=original.name.includes('Satin')?1.05:.7;
          }
          material.onBeforeCompile = shader => {
            shader.uniforms.suitTone = accent;
            shader.vertexShader = 'uniform vec3 suitTone;\n' + shader.vertexShader;
            shader.vertexShader = shader.vertexShader.replace('#include <color_vertex>', `#include <color_vertex>
#ifdef USE_COLOR
if (vColor.r > .5 && vColor.g < .25 && vColor.b < .1) vColor.rgb = suitTone;
#endif`);
          };
          material.customProgramCacheKey = () => 'runway-skinned-nft-suit-v2-'+material!.type;
          materials.set(original, material);
        }
        return material;
      };
      object.material = Array.isArray(object.material) ? object.material.map(recolor) : recolor(object.material);
    });
    const mixer = new THREE.AnimationMixer(scene);
    const actions = Object.fromEntries(source.animations.map(clip => {
      const action = mixer.clipAction(clip);
      action.play().setEffectiveWeight(0);
      return [clip.name, action];
    }));
    actions.idle?.setEffectiveWeight(1);
    const bones = new Map<string, THREE.Bone>();
    scene.traverse(object => { if (object instanceof THREE.Bone) bones.set(object.name, object); });
    const rest = new Map([...bones].map(([name, bone]) => [name, bone.quaternion.clone()]));
    scene.updateMatrixWorld(true);
    for (const [side, suffix] of [[-1, 'L'], [1, 'R']] as const) {
      const hand = bones.get('hand' + suffix);
      if (!hand) continue;
      const grip = new THREE.Object3D();
      grip.name = 'pilot-grip-' + suffix;
      grip.position.copy(hand.worldToLocal(new THREE.Vector3(side * .435, -.675, .04)));
      hand.add(grip);const foot=bones.get('foot'+suffix)!;const sole=new THREE.Object3D();sole.name='pilot-sole-'+suffix;sole.position.copy(foot.worldToLocal(new THREE.Vector3(side*.18,-1.58,.1)));foot.add(sole);
    }
    const anchor=new THREE.Object3D();anchor.name='pilot-head-anchor';const chest=bones.get('chest')!;anchor.position.copy(chest.worldToLocal(new THREE.Vector3()));anchor.quaternion.copy(chest.getWorldQuaternion(new THREE.Quaternion()).invert());chest.add(anchor);
    const basePosition=new Map([...bones].map(([name,bone])=>[name,bone.position.clone()]));
    const basePose = new Map([...bones].map(([name, bone]) => [name, bone.quaternion.clone()]));
    return {scene, mixer, actions, bones, rest, basePose, basePosition, materials,anchor};
  }, [source, crew]);
  const headGroup=useRef<THREE.Group>(null),headMatrix=useMemo(()=>new THREE.Matrix4(),[]);
  const motion = useRef({x: 0, y: 0}),previousRun=useRef(run);
  const rotation = useMemo(() => new THREE.Quaternion(), []);
  const axis = useMemo(() => new THREE.Vector3(), []);
  useEffect(() => {
    // React's development effect replay must reactivate the retained mixer.
    Object.values(model.actions).forEach(action => action.play());
    return () => {
      model.mixer.stopAllAction();
      model.materials.forEach(material => material.dispose());
      // Each carousel actor owns its cloned skeletons and their GPU bone textures.
      // Shared model geometry remains cached; disposing a material does not free these.
      const skeletons = new Set<THREE.Skeleton>();
      model.scene.traverse(object => { if (object instanceof THREE.SkinnedMesh) skeletons.add(object.skeleton); });
      skeletons.forEach(skeleton => skeleton.dispose());
    };
  }, [model]);

  useFrame(() => {
    const dt = Math.min(presentation.dt,.05), s = run?.state, t = presentation.route;
    const reset=!!previousRun.current&&previousRun.current!==run;previousRun.current=run;
    const paused = dt===0&&!reset;
    if(reset)motion.current={x:0,y:0};
    if(crew){model.materials.forEach(material=>{material.opacity=conversation?.presence??0;});if(!conversation?.presence)return;}
    accent.value.lerp(targetAccent, 1 - Math.exp(-dt * 12));
    let clip = previewGlide?'glide':'idle', clipTime = reduced ? .4 : presentation.time;
    if(crew&&conversation&&conversation.presence<.97){clip='run';clipTime=conversation.presence*.65;}
    const landed = s?.outcome;
    if (s && !paused) {
      if(presentation.fall){clip='freefall';clipTime=presentation.time;}else if (landed) {
        const age = presentation.landingAge;
        const celebrationEnd=.65+(model.actions.celebrate?.getClip().duration??2);
        clip = age < .65 ? 'land' : landed === 'landed' && age < celebrationEnd ? 'celebrate' : 'idle';
        clipTime = age < .65 ? age : clip==='celebrate' ? age-.65 : Math.max(0,age-celebrationEnd);
      } else if(t<1.15){clip='prepare';clipTime=t;
      } else if (t < 2.46) {
        clip = 'run';
        // A complete left/right stride travels 2.7 world units.
        clipTime = Math.max(0, START_Z + 5 - s.y) / 2.7 * .72;
      } else if (t < 4.8) {
        clip = 'exit'; clipTime = Math.min(1.1, (t - 2.46) / 2.34 * 1.1);
      } else if (t < TIMING.cloud) {
        clip = 'freefall'; clipTime = t - 4.8;
      } else if (t < TIMING.glide) {
        clip = 'deploy'; clipTime = (t - TIMING.cloud) / (TIMING.glide - TIMING.cloud);
      } else {
        clip = 'glide'; clipTime = t - TIMING.glide;
      }
    }
    if (!paused) {
      for (const [name, action] of Object.entries(model.actions)) {
        action.setEffectiveWeight(reset?(name===clip?1:0):THREE.MathUtils.damp(action.getEffectiveWeight(), name === clip ? 1 : 0, 16, dt));
        const duration = action.getClip().duration;
        const oneShot = ['prepare','exit', 'deploy', 'land','celebrate'].includes(name);
        const time = name === clip ? clipTime : action.time + dt;
        action.time = oneShot ? THREE.MathUtils.clamp(time, 0, duration - .0001) : time % duration;
      }
      // PropertyMixer skips writes for unchanged samples. Restore the previous authored
      // pose before evaluating, otherwise overlays accumulate at render rates > 60 Hz.
      model.bones.forEach((bone, name) => {bone.quaternion.copy(model.basePose.get(name)!);bone.position.copy(model.basePosition.get(name)!);});
      model.mixer.update(0);
      model.bones.forEach((bone, name) => {model.basePose.get(name)!.copy(bone.quaternion);model.basePosition.get(name)!.copy(bone.position);});
      const moving = s && !s.outcome && t > 4.8;
      const acceleration=moving?presentation.ax/35:0,braking=moving?presentation.ay/35:0,hit=activeImpact(presentation),hitAge=hit?presentation.time-hit.at:9,recoil=hitAge<.48&&!reduced?Math.sin(hitAge/.48*Math.PI)*Math.exp(-hitAge*3):0;
      motion.current.x = THREE.MathUtils.damp(motion.current.x, moving ? THREE.MathUtils.clamp(s.vx / 18, -1, 1) : 0, 9, dt);
      motion.current.y = THREE.MathUtils.damp(motion.current.y, moving ? THREE.MathUtils.clamp((s.vy + (s.phase === 'land' ? 10.4 : 0)) / 18, -1, 1) : 0, 9, dt);
      const bend = (name: string, amount: number, direction: 'x' | 'z') => {
        const bone = model.bones.get(name), rest = model.rest.get(name);
        if (!bone || !rest) return;
        axis.set(direction === 'x' ? 1 : 0, 0, direction === 'z' ? 1 : 0).applyQuaternion(rest.clone().invert());
        rotation.setFromAxisAngle(axis, amount);
        bone.quaternion.multiply(rotation);
      };
      // Presentation-only articulation; input, collider and root motion remain authoritative.
      for (const [side, suffix] of [[-1, 'L'], [1, 'R']] as const) {
        bend('thigh' + suffix, motion.current.x * .18-side*acceleration*.12, 'z');
        bend('shin' + suffix, Math.abs(motion.current.x) * .25 + Math.abs(motion.current.y) * .18+Math.max(0,side*acceleration)*.2+recoil*.35, 'x');
        bend('arm' + suffix, motion.current.x * .15 + side * Math.abs(motion.current.y) * .08+side*acceleration*.14, 'z');
        bend('forearm' + suffix, -Math.abs(motion.current.x) * .14-recoil*.4, 'x');
      }
      bend('spine',-motion.current.x*.08+acceleration*.045,'z');bend('chest',braking*.055+recoil*.16,'x');
      const jump=launchPose(t),deploy=deploymentPose(t),boost=s&&!s.outcome?diveStrength(s):0;
      const failure=presentation.fall?ease(0,.22,presentation.landingAge):0,loose=Math.max(failure,buildingReaction(presentation)),flailTime=presentation.landingAge>=0?presentation.landingAge:presentation.time;
      for(const [side,suffix] of [[-1,'L'],[1,'R']] as const){
        // Load the rear leg, drive off, then extend into the air rather than stepping off.
        bend('thigh'+suffix,jump.load*-.28+jump.flight*(-.24+side*.1)-boost*.12,'x');
        bend('shin'+suffix,jump.load*.48-jump.flight*.24-boost*.42+deploy.pull*.36+deploy.rebound*.12,'x');
        bend('arm'+suffix,-jump.load*.22-jump.flight*.35+boost*.2,'x');
        bend('arm'+suffix,-side*boost*.32,'z');
        bend('chest',-deploy.pull*.12+deploy.rebound*.07,'x');
        if(loose){const wave=reduced?0:Math.sin(flailTime*7+side*1.7)*Math.exp(-Math.max(0,flailTime-1)*.4);bend('thigh'+suffix,loose*(side*.32+wave*.28),'x');bend('shin'+suffix,loose*(.48+wave*.3),'x');bend('arm'+suffix,loose*(-.55+wave*.55),'x');bend('arm'+suffix,side*loose*.35,'z');bend('forearm'+suffix,-loose*(.6+wave*.2),'x');}
      }
      if(crew&&conversation){const still=reduced||matchMedia('(prefers-reduced-motion: reduce)').matches;const age=conversation.time-conversation.gestureAt,gesture=still?0:Math.sin(Math.min(1,age/1.2)*Math.PI)*.32,voice=conversation.frame.talking&&!still?Math.sin(conversation.frame.letters*1.3)*.025:0;
        bend('chest',voice+((conversation.projectedExpression??conversation.frame.expression)==='warning'?.08:0),'x');bend('spine',gesture*.14,'z');bend('armR',conversation.frame.tutorial?0:-gesture*.6,'z');bend('forearmR',-gesture*1.7,'x');bend('forearmL',conversation.frame.expression==='curious'?-gesture:0,'x');
        // Hold an open palm for the projector; all transforms remain on the authored rig.
        const project=conversation.frame.tutorial?conversation.focus:0;
        bend('armR',1.5*project,'z');bend('armR',-.2*project,'x');bend('forearmR',-.85*project,'x');bend('handR',.4*project,'x');
        if(project){const step=conversation.frame.step;bend('forearmL',-gesture*(step===3?2:step===0?1:.45),'x');bend('armL',-gesture*(step===3?.7:.2),'z');}
      }
      bend('spine',jump.load*.12-jump.flight*.12+loose*.22,'x');
      model.bones.get('pelvis')!.position.y-=jump.load*.06+deploy.pull*.045;
      // Keep React ownership in the actor tree; derive the head transform from the
      // chest socket instead of mounting a separate reconciler portal into a bone.
      model.scene.updateWorldMatrix(true,true);
      if(headGroup.current&&model.scene.parent){headMatrix.copy(model.scene.parent.matrixWorld).invert().multiply(model.anchor.matrixWorld);headMatrix.decompose(headGroup.current.position,headGroup.current.quaternion,headGroup.current.scale);}
      if (import.meta.env.DEV && new URLSearchParams(location.search).get('qa') === '1' && !crew) {
        model.scene.updateWorldMatrix(true,true);
        Object.assign(window, {__RUNWAY_SKELETON_QA__: {clip,time:presentation.time,landingAge:presentation.landingAge,pelvis:model.bones.get('pelvis')?.position.toArray(), bones: model.bones.size,
          knee: model.bones.get('shinL')?.quaternion.toArray(), elbow: model.bones.get('forearmL')?.quaternion.toArray(),
          feet:['L','R'].map(side=>model.scene.getObjectByName('pilot-sole-'+side)?.getWorldPosition(new THREE.Vector3()).toArray()),head:model.anchor.getWorldPosition(new THREE.Vector3()).toArray(),color: accent.value.getHexString(), materials: model.materials.size}});
      }
    }
  },-1.5);
  return <><primitive object={model.scene} dispose={null}/><group ref={headGroup}>{head}</group></>;
}
