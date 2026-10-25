import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../integration/test-worker-scheduled-smoke.js';

test('scheduled test signs with local secret, stores assessment and rejects replay',async()=>{
 const batches=[];const nonces=new Set();
 const db={prepare(sql){return {bind(...args){return {sql,args}}}},async batch(statements){
  const nonce=statements[0].args[1];
  if(nonces.has(nonce))throw new Error('UNIQUE constraint failed');
  nonces.add(nonce);batches.push(statements);return statements.map(()=>({success:true}));
 }};
 const env={AUREON_DB:db,AUREON_WEBHOOK_SECRET:'local-only-scheduled-test-secret',AUREON_WEBHOOK_BUSINESS_ID:'demo_business'};
 await worker.scheduled({},env,{});
 assert.equal(batches.length,1);
 assert.equal(batches[0].length,3);
 assert.match(batches[0][2].sql,/integration_lead_assessments/);
 assert.equal(batches[0][2].args[3],'high');
 assert.equal(batches[0][2].args[6],'pending_human_approval');
 assert.equal(batches[0][1].args[1],'synthetic_live_webhook_smoke_20261025');
});
