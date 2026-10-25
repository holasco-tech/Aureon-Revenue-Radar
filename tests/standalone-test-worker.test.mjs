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


test('signed webhook atomically writes nonce, lead and pending assessment; replay rejected',async()=>{
 const calls=[];const seen=new Set();
 const db={prepare(sql){return {bind(...args){return {sql,args}}}},async batch(statements){
  const nonce=statements[0].args[1];
  if(seen.has(nonce))throw new Error('UNIQUE constraint failed');
  seen.add(nonce);calls.push(statements);
  return statements.map(()=>({success:true}));
 }};
 const env={AUREON_DB:db,AUREON_WEBHOOK_SECRET:'local-test-secret-not-production',AUREON_WEBHOOK_BUSINESS_ID:'demo_business'};
 const body=JSON.stringify({businessId:'demo_business',externalId:'test_001',name:'Fictional Lead',service:'Automation',source:'referral',status:'urgent quote',value:7500});
 const timestamp=String(Math.floor(Date.now()/1000));
 const requestId='unit_test_request_000001';
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.AUREON_WEBHOOK_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const mac=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(timestamp+'.'+requestId+'.'+body)));
 const signature=Array.from(mac,x=>x.toString(16).padStart(2,'0')).join('');
 const makeRequest=()=>new Request('https://example.test/api/integrations/leads',{method:'POST',headers:{'x-aureon-timestamp':timestamp,'x-aureon-request-id':requestId,'x-aureon-signature':signature,'content-type':'application/json'},body});
 const response=await worker.fetch(makeRequest(),env);
 assert.equal(response.status,200,await response.text());
 assert.equal(calls.length,1);
 assert.equal(calls[0].length,3);
 assert.match(calls[0][2].sql,/integration_lead_assessments/);
 assert.equal(calls[0][2].args[3],'high');
 assert.equal(calls[0][2].args[6],'pending_human_approval');
 const replay=await worker.fetch(makeRequest(),env);
 assert.equal(replay.status,409);
 assert.equal(calls.length,1);
});
