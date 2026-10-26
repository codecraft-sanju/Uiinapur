import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
mkdirSync('work/city-test',{recursive:true});
const compile=spawnSync(process.execPath,['node_modules/typescript/bin/tsc','lib/uiinapur/city.ts','lib/uiinapur/cityGeometry.ts','--outDir','work/city-test','--module','commonjs','--target','es2020','--esModuleInterop','--skipLibCheck'],{stdio:'inherit'});
if(compile.status!==0)process.exit(compile.status||1);
writeFileSync('work/city-test/package.json','{"type":"commonjs"}');
const test=spawnSync(process.execPath,['tests/city.cjs'],{stdio:'inherit'});
process.exit(test.status??1);
