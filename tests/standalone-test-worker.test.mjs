import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../integration/test-worker-with-assessments.js';
test('standalone test Worker retains health endpoint',async()=>{
 const response=await worker.fetch(new Request('https://example.test/health'),{AUREON_DB:{},AUREON_WEBHOOK_SECRET:'configured'});
 assert.equal(response.status,200);
 const body=await response.json();
 assert.equal(body.ok,true);
 assert.equal(body.database,true);
 assert.equal(body.webhookConfigured,true);
});
test('standalone test Worker rejects unsigned webhook',async()=>{
 const response=await worker.fetch(new Request('https://example.test/api/integrations/leads',{method:'POST',body:'{}'}),{AUREON_DB:{},AUREON_WEBHOOK_SECRET:'configured',AUREON_WEBHOOK_BUSINESS_ID:'demo_business'});
 assert.notEqual(response.status,200);
});
