import {copyFileSync,existsSync} from 'node:fs';
const source=new URL('../../../runway/src/core/simulation.ts',import.meta.url);
if(existsSync(source))copyFileSync(source,new URL('../lib/simulation.ts',import.meta.url));
