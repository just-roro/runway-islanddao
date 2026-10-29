import fs from 'node:fs';
import ts from 'typescript';
const source=ts.transpileModule(fs.readFileSync('src/core/simulation.ts','utf8'),{compilerOptions:{module:99,target:99}}).outputText;
const {CONTENT_CATALOG,RULES,CONTENT}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const review={
 sol:'Keep the three-bar relief legible when spinning; green aura must not flatten the gold face.',
 term:'Paper silhouette is clear; strengthen signature/seal recognition in the future asset pass.',
 community:'Three people read as community at close range; improve distance silhouette in future reference pass.',
 star:'Preserve the five-point opening and its exact shared collision polygon.',
 gate:'Preserve red/white striping, beacons and visible opening; LED sequence label is added in gameplay.',
 magnet:'Keep horseshoe silhouette and two differently colored tips.',
 water:'Bottle silhouette is visible; future artwork should communicate one-hit protection more directly.',
 rare:'Distinct orbiting crystal; must remain cosmetic and never resemble cash.',
 delivery:'Package silhouette is readable; red aura distinguishes it from rewards.',
 gas:'Pump silhouette with hose; keep dark display readable against red aura.',
 rug:'Thin silhouette is weak edge-on; future redesign should retain broad visible carpet plane.',
 hacked:'Server block reads as technology, but a clearer security warning is a future art opportunity.',
 tower:'Rendered building envelopes must stay within shared collision bounds; roof/landing separation tested.',
 ocean:'Coast depth texture derives from the authoritative polygon; decoration must not imply safe ground.',
};
const rows=CONTENT_CATALOG.map(c=>({...c,status:'active',model:c.id==='tower'?'runway-city.glb + LANDMARK_BLOCKERS':c.id==='ocean'?'Island.tsx coast-derived water shader':`props.ts / propGeometry('${c.id}')`,visualReview:review[c.id],capture:c.id==='tower'||c.id==='ocean'?'evidence/canopy-after.png':'content-contact-sheet.png'}));
rows.push({id:'risk',name:'Risk route',group:'Inactive',effect:'Declared type, not generated',phase:'None',collider:'None active',status:'inactive',model:'Legacy definition only',visualReview:'Do not include in player guide or commission a new asset.',capture:''});
for(const id of ['funding','strategy','customer','grant','seeker','insurance'])rows.push({id,name:id,group:'Retired',effect:'Removed from generation, simulation and player UI',phase:'None',collider:'None',status:'retired',model:'None active',visualReview:'Preserve historical results only. Do not redesign or reintroduce.',capture:''});
const columns=['id','name','status','group','effect','phase','model','collider','visualReview','capture'];
const cell=v=>'"'+String(v??'').replaceAll('"','""')+'"';
fs.writeFileSync('reports/content-inventory.csv',[columns.join(','),...rows.map(r=>columns.map(c=>cell(r[c])).join(','))].join('\n')+'\n');
const md=['# RUNWAY — Content inventory',`\nRules: ${RULES} / ${CONTENT}. Generated from the same catalog as the player guide.`, '\nThe contact sheet contains actual gameplay geometry; it is not concept art. Green/red halos and motion are applied by the live scene. The listed visual concerns are future redesign priorities, not claims of completed new pickup artwork.', '\n| ID | Status | Name / effect | Phase | Model / collider | Visual review | Capture |','|---|---|---|---|---|---|---|',...rows.map(r=>`| ${r.id} | ${r.status} | ${r.name}: ${r.effect} | ${r.phase} | ${r.model}; ${r.collider} | ${r.visualReview} | ${r.capture?`[view](${r.capture})`:'—'} |`),'\nObstacle amounts are full penalties. First two sections use 2%, next two 20%, then 100%. Immunity lasts 800 ms. Water halves one hit. Loss never exceeds available capital.','\nLanding targets: South Beach 0%, Island Terrace 15%, Jurerê 50%; safe ground outside targets keeps capital without bonus. Sea landing sets capital to zero.','\nRebuild with `node scripts/content-inventory.mjs`. Capture gallery: `tests/content-gallery.html` through Vite.'];
fs.writeFileSync('reports/content-inventory.md',md.join('\n')+'\n');
console.log(`Wrote ${rows.length} entries (${CONTENT_CATALOG.length} active).`);
