import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const config=JSON.parse(readFileSync('wrangler.isolated-review.jsonc','utf8'));
assert.equal(config.name,'aureon-radar-integration-test');
assert.equal(config.main,'dist/aureon-radar-integration-test.mjs');
assert.equal(config.keep_vars,true);
assert.equal(config.compatibility_date,'2026-10-25');
assert.equal(config.d1_databases.length,1);
assert.deepEqual(config.d1_databases[0],{
 binding:'AUREON_DB',
 database_name:'aureon-revenue-radar-integration-test',
 database_id:'f5f1e049-5f15-46c6-8800-646c12649888'
});
assert.equal(config.vars.AUREON_WEBHOOK_BUSINESS_ID,'demo_business');
assert.equal(config.triggers,undefined);
assert.equal(config.routes,undefined);
assert.equal(config.route,undefined);
assert.equal(config.workers_dev,undefined);
console.log('Isolated deployment configuration validated; production resources not referenced.');
