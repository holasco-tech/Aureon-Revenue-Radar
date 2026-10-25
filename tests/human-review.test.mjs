import test from 'node:test';
import assert from 'node:assert/strict';
import {validateReview,reviewStatements,applyReview} from '../integration/human-review.mjs';
const valid={businessId:'demo_business',externalId:'lead_1',decision:'approved',reviewerId:'owner',reason:'Verified customer request'};
test('requires explicit human reviewer and rationale',()=>{
 assert.equal(validateReview(valid).decision,'approved');
 for(const input of [{...valid,decision:'auto_send'},{...valid,reviewerId:''},{...valid,reason:''}])
  assert.throws(()=>validateReview(input));
});
test('review statements update only pending and append audit record',()=>{
 const db={prepare(sql){return {bind(...args){return {sql,args}}}}};
 const [audit,update]=reviewStatements(db,valid,'review_12345678');
 assert.match(update.sql,/review_state='pending_human_approval'/);
 assert.match(audit.sql,/integration_lead_review_events/);
 assert.equal(update.args[0],'approved');
 assert.match(audit.sql,/^INSERT INTO/);
});
test('already reviewed lead is not modified',async()=>{
 let writes=0;
 const db={prepare(){return {bind(){return {first:async()=>({review_state:'rejected'})}}}},batch:async()=>{writes++}};
 assert.deepEqual(await applyReview(db,valid,'review_12345678'),{ok:false,error:'already_reviewed'});
 assert.equal(writes,0);
});
test('approved decision records both statements',async()=>{
 let writes;
 const db={prepare(sql){return {bind(...args){return {sql,args,first:async()=>({review_state:'pending_human_approval'})}}}},batch:async x=>{writes=x}};
 assert.deepEqual(await applyReview(db,valid,'review_12345678'),{ok:true,state:'approved'});
 assert.equal(writes.length,2);
});

test('concurrent stale review fails safely without recording second decision',async()=>{
 const input={...valid,decision:'rejected'};
 const db={prepare(sql){return {bind(...args){return {sql,args,first:async()=>({review_state:'pending_human_approval'})}}}},async batch(){throw new Error('UNIQUE constraint failed: integration_lead_review_events.business_id')}};
 assert.deepEqual(await applyReview(db,input,'review_87654321'),{ok:false,error:'already_reviewed'});
});

test('missing assessment cannot be approved or audited',async()=>{
 let writes=0;
 const db={prepare(){return {bind(){return {first:async()=>null}}}},batch:async()=>{writes++}};
 assert.deepEqual(await applyReview(db,valid,'review_12345678'),{ok:false,error:'not_found'});
 assert.equal(writes,0);
});
test('database batch failure never returns successful approval',async()=>{
 const db={prepare(sql){return {bind(...args){return {sql,args,first:async()=>({review_state:'pending_human_approval'})}}}},batch:async()=>{throw new Error('database unavailable')}};
 await assert.rejects(applyReview(db,valid,'review_12345678'),/database unavailable/);
});
test('database trigger blocks stale approval even after preflight',async()=>{
 const db={prepare(sql){return {bind(...args){return {sql,args,first:async()=>({review_state:'pending_human_approval'})}}}},batch:async()=>{throw new Error('lead is not pending human approval: SQLITE_CONSTRAINT_TRIGGER')}};
 assert.deepEqual(await applyReview(db,valid,'review_12345678'),{ok:false,error:'already_reviewed'});
});
