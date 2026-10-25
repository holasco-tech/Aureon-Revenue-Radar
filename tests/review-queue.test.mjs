import test from 'node:test';
import assert from 'node:assert/strict';
import {handleReviewQueue} from '../integration/review-queue.mjs';
const url='https://example.test/api/integrations/review-queue';
const session={authenticated:true,canReviewLeads:true,businessId:'demo_business'};
test('queue requires owner authorization and D1',async()=>{
 assert.equal((await handleReviewQueue(new Request(url),{},null)).status,401);
 assert.equal((await handleReviewQueue(new Request(url),{},session)).status,503);
});
test('queue limits and cursor are validated',async()=>{
 const env={AUREON_DB:{}};
 assert.equal((await handleReviewQueue(new Request(url+'?limit=101'),env,session)).status,400);
 assert.equal((await handleReviewQueue(new Request(url+'?before=bad'),env,session)).status,400);
});
test('queue is tenant scoped and pending only',async()=>{
 let sql,params;
 const env={AUREON_DB:{prepare(s){sql=s;return {bind(...p){params=p;return {all:async()=>({results:[{external_id:'lead1',review_state:'pending_human_approval'}]})}}}}}};
 const response=await handleReviewQueue(new Request(url+'?limit=10'),env,session);
 assert.equal(response.status,200);
 assert.equal((await response.json()).count,1);
 assert.deepEqual(params,['demo_business',10]);
 assert.match(sql,/a.business_id=\?1 AND a.review_state='pending_human_approval'/);
});
