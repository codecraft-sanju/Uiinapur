import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
mkdirSync('work/social-test',{recursive:true});
const compile=spawnSync(process.execPath,['node_modules/typescript/bin/tsc','lib/uiinapur/walkInput.ts','lib/uiinapur/social.ts','lib/uiinapur/cityGeometry.ts','--outDir','work/social-test','--module','commonjs','--target','es2020','--esModuleInterop','--skipLibCheck'],{stdio:'inherit'});
if(compile.status!==0)process.exit(compile.status||1);
writeFileSync('work/social-test/package.json','{"type":"commonjs"}');
const result=spawnSync(process.execPath,['tests/social.cjs'],{stdio:'inherit'});
process.exit(result.status??1);
