import test from 'node:test';
import assert from 'node:assert/strict';
import {handleReviewRequest} from '../integration/review-api.mjs';
const endpoint='https://example.test/api/integrations/reviews';
const payload={businessId:'demo_business',externalId:'lead1',decision:'approved',reason:'Reviewed and verified'};
const req=(body=payload,headers={})=>new Request(endpoint,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body)});
const session={authenticated:true,canReviewLeads:true,reviewerId:'owner1',businessId:'demo_business'};
test('unauthenticated and unauthorized users cannot review',async()=>{
 assert.equal((await handleReviewRequest(req(),{},null)).status,401);
 assert.equal((await handleReviewRequest(req(),{},{...session,canReviewLeads:false})).status,403);
});
test('cross-business and reviewer spoofing blocked',async()=>{
 assert.equal((await handleReviewRequest(req({...payload,businessId:'other'}),{},session)).status,403);
 assert.equal((await handleReviewRequest(req({...payload,reviewerId:'other'}),{},session)).status,403);
});
test('valid authenticated review is audited and changes state',async()=>{
 let batch;
 const db={prepare(sql){return {bind(...args){return {sql,args,first:async()=>({review_state:'pending_human_approval'})}}}},async batch(statements){batch=statements;}};
 const response=await handleReviewRequest(req(),{AUREON_DB:db},session);
 assert.equal(response.status,200);
 assert.equal((await response.json()).state,'approved');
 assert.equal(batch.length,2);
 assert.equal(batch[0].args[4],'owner1');
 assert.equal(batch[1].args[0],'approved');
});
test('invalid JSON and invalid decision are rejected',async()=>{
 const malformed=new Request(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:'{'});
 assert.equal((await handleReviewRequest(malformed,{},session)).status,400);
 const db={prepare(){return {bind(){return {first:async()=>null}}}}};
 assert.equal((await handleReviewRequest(req({...payload,decision:'send_message'}),{AUREON_DB:db},session)).status,400);
});

test('database outage returns service unavailable',async()=>{
 assert.equal((await handleReviewRequest(req(),{},session)).status,503);
});
