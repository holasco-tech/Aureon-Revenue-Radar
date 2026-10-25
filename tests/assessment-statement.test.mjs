import test from 'node:test';
import assert from 'node:assert/strict';
import {assessmentStatement} from '../integration/assessment-statement.mjs';

const lead={externalId:'synthetic_001',businessId:'demo_business',name:'Example',value:6000,status:'urgent quote',source:'referral'};
test('creates a bound assessment upsert with review pending',()=>{
 let sql='',args=[];
 const db={prepare(query){sql=query;return {bind(...values){args=values;return {sql,args};}}}};
 const {statement,prepared}=assessmentStatement(db,lead);
 assert.match(sql,/ON CONFLICT\(business_id,external_id\) DO UPDATE/);
 assert.deepEqual(args.slice(0,4),['demo_business','synthetic_001',95,'high']);
 assert.equal(args[6],'pending_human_approval');
 assert.equal(prepared.review.automaticContactAllowed,false);
 assert.equal(statement.args,args);
});
test('refuses invalid database or lead',()=>{
 assert.throws(()=>assessmentStatement(null,lead),/D1 database is required/);
 assert.throws(()=>assessmentStatement({prepare(){throw Error('should not reach')}},{...lead,value:-1}),/Invalid lead value/);
});
