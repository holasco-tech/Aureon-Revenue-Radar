// Build a single-file, test-only Cloudflare Worker. Never deploy automatically.
import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
const result=await build({
 entryPoints:['worker.js'],
 outfile:'dist/aureon-radar-integration-test.mjs',
 bundle:true,
 format:'esm',
 platform:'browser',
 target:'es2022',
 minify:false,
 sourcemap:false,
 metafile:true,
 logLevel:'info'
});
console.log('Bundled modules:',Object.keys(result.metafile.inputs).join(', '));
console.log('Output: dist/aureon-radar-integration-test.mjs');
