import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const output='node_modules/.cache/discovery-runtime-test.mjs';
await mkdir('node_modules/.cache',{recursive:true});
await build({entryPoints:['src/components/DiscoveryHub.runtime.test.tsx'],outfile:output,bundle:true,platform:'node',format:'esm',packages:'external',define:{'import.meta.env':JSON.stringify({VITE_DESIGN_PREVIEW:'true'})},logLevel:'silent'});
const result=spawnSync(process.execPath,['--test',resolve(output)],{stdio:'inherit'});
process.exitCode=result.status??1;
