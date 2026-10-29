// macOS authoring step: derive runtime AAC from supplied masters, never edit originals.
import {readdirSync,copyFileSync,mkdirSync,rmSync,statSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
const source=resolve('../wav'),dest=resolve('public/assets/sfx');mkdirSync(dest,{recursive:true});
let bytes=0,count=0;
for(const name of readdirSync(source).filter(n=>n.endsWith('.wav'))){
 if(/^(first_customer|kyc_scan|seeker_on|sleep_8h)_/.test(name))continue;
 const short=/^(ui_press|npc_blip|results_count_tick)_/.test(name),output=resolve(dest,short?name:name.replace('.wav','.m4a'));
 if(short)copyFileSync(resolve(source,name),output);
 else {const r=spawnSync('/usr/bin/afconvert',['-f','m4af','-d','aac ','-b','96000',resolve(source,name),output],{stdio:'inherit'});if(r.status!==0)throw Error('AAC conversion failed: '+name);rmSync(resolve(dest,name),{force:true});}
 bytes+=statSync(output).size;count++;
}
console.log({count,bytes});
