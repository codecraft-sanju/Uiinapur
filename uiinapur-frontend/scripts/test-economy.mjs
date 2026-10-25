import {mkdirSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
mkdirSync('work/test-build',{recursive:true});
const compile=spawnSync(process.execPath,['node_modules/typescript/bin/tsc','lib/uiinapur/store.ts','lib/uiinapur/data.ts','lib/uiinapur/id.ts','--outDir','work/test-build','--module','commonjs','--target','es2020','--esModuleInterop','--skipLibCheck'],{stdio:'inherit'});
if(compile.status!==0)process.exit(compile.status||1);
writeFileSync('work/test-build/package.json','{"type":"commonjs"}');
const test=spawnSync(process.execPath,['tests/economy.cjs'],{stdio:'inherit'});
process.exit(test.status||0);
