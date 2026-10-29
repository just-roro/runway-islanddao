import {mkdtemp, mkdir, readFile, writeFile, readdir, rm, copyFile, rename} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve, join, dirname, extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=resolve(root,'../entregas');
if(Number(process.versions.node.split('.')[0])!==24)throw Error('Use Node 24, as required by package.json.');
const temporary=await mkdtemp(join(tmpdir(),'runway-hosting-'));
const stage=join(temporary,'package'),build=join(temporary,'build');
const api='https://runway-api.agenciahumanfriendly.chatgpt.site/api';
function run(command,args,options={}){
 const result=spawnSync(command,args,{cwd:root,stdio:'inherit',...options});
 if(result.error)throw result.error;
 if(result.status!==0)throw Error(`${command} failed (${result.status})`);
}
// These files have no runtime consumers. The geography is already bundled from src/core.
const obsolete=new Set(['favicon.svg','assets/brand/human-friendly.png','assets/brand/runway-logo.svg','assets/geography/santa-catarina.json']);
const extensions=new Set(['.html','.js','.css','.txt','.png','.webp','.svg','.glb','.ttf','.mp3','.m4a','.wav']);
async function assemble(directory,prefix=''){
 for(const entry of await readdir(directory,{withFileTypes:true})){
  const relative=prefix+entry.name;
  if(obsolete.has(relative))continue;
  if(entry.isDirectory()){await assemble(join(directory,entry.name),relative+'/');continue;}
  if(!entry.isFile()||relative.split('/').some(p=>p.startsWith('.'))||!extensions.has(extname(relative)))throw Error(`Unexpected publication file: ${relative}`);
  if(!relative.startsWith('assets/')&&!['index.html','curtain.css','licenses.txt'].includes(relative))throw Error(`Unexpected public root file: ${relative}`);
  const destination=join(stage,'islanddao',relative);
  await mkdir(dirname(destination),{recursive:true});await copyFile(join(directory,entry.name),destination);
 }
}
try{
 run(process.execPath,['node_modules/typescript/bin/tsc','--noEmit']);
 run(process.execPath,['node_modules/vite/bin/vite.js','build','--base=/islanddao/','--outDir',build,'--emptyOutDir'],{env:{...process.env,VITE_API_URL:api,VITE_PUBLIC_URL:'https://humanfriendly.global/islanddao/'}});
 await assemble(build);
 await copyFile(join(root,'docs/INSTRUCCIONES-HOSTING.md'),join(stage,'INSTRUCCIONES-HOSTING.md'));
 const html=await readFile(join(stage,'islanddao/index.html'),'utf8');
 if(!html.includes('/islanddao/assets/')||/\b(?:href|src)=["']\/(?!islanddao\/)/.test(html))throw Error('Invalid HTML base paths');
 const archive=join(temporary,'RUNWAY-ISLANDDAO-PRODUCTION.zip');
 run('python3',['-c',`
import sys, pathlib, zipfile
stage=pathlib.Path(sys.argv[1])
with zipfile.ZipFile(sys.argv[2],'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for p in sorted(stage.rglob('*')):
  if p.is_file(): z.write(p,p.relative_to(stage).as_posix())
with zipfile.ZipFile(sys.argv[2]) as z:
 assert z.testzip() is None
 names=z.namelist()
 assert 'islanddao/index.html' in names and 'INSTRUCCIONES-HOSTING.md' in names
 assert all(n.startswith('islanddao/') or n=='INSTRUCCIONES-HOSTING.md' for n in names)
 assert not any(any(x in n.split('/') for x in ['src','node_modules','.git','.openai','.env','tests']) or n.endswith(('.map','.ts','.tsx','.blend')) for n in names)
 print('Archive audited:',len(names),'files')
`,stage,archive]);
 await mkdir(output,{recursive:true});
 const bytes=await readFile(archive),sha256=createHash('sha256').update(bytes).digest('hex');
 const destination=join(output,'RUNWAY-ISLANDDAO-PRODUCTION.zip');
 // Keep a previous delivery intact until the new archive has passed the checks.
 const pending=destination+'.tmp';await copyFile(archive,pending);await rename(pending,destination);
 const report={file:destination,bytes:bytes.length,MiB:Number((bytes.length/1048576).toFixed(2)),sha256,base:'/islanddao/',api,builtAt:new Date().toISOString(),checks:['TypeScript','Vite production build','archive integrity and exclusions','HTML base paths'],pending:['Browser QA of this archive (see separate validation report)','Production hosting and API CORS','Physical devices']};
 await writeFile(join(output,'PACKAGE-METADATA.json'),JSON.stringify(report,null,2)+'\n');
 await copyFile(join(root,'docs/INSTRUCCIONES-HOSTING.md'),join(output,'INSTRUCCIONES-HOSTING.md'));
 console.log(JSON.stringify(report,null,2));
}finally{await rm(temporary,{recursive:true,force:true});}
