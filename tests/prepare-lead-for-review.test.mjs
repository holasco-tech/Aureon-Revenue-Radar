import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareLeadForReview} from '../integration/prepare-lead-for-review.mjs';

test('normalizes and prioritizes a fictional website lead for human review',()=>{
 const r=prepareLeadForReview({externalId:'demo_001',businessId:'demo_business',name:' Example Customer ',service:'Consultation',source:'website',status:'new inquiry',value:1500});
 assert.equal(r.identity,'demo_business:demo_001');
 assert.equal(r.lead.name,'Example Customer');
 assert.equal(r.assessment.priority,'medium');
 assert.equal(r.assessment.score,50);
 assert.equal(r.review.state,'pending_human_approval');
 assert.equal(r.review.automaticContactAllowed,false);
});
test('high-priority lead still cannot trigger automatic contact',()=>{
 const r=prepareLeadForReview({externalId:'demo_002',businessId:'demo_business',name:'Fictional Buyer',source:'referral',status:'urgent quote',value:6000});
 assert.equal(r.assessment.priority,'high');
 assert.equal(r.review.automaticContactAllowed,false);
});
test('invalid leads never reach scoring',()=>{
 assert.throws(()=>prepareLeadForReview({businessId:'demo_business',name:'No ID'}),/Invalid externalId/);
 assert.throws(()=>prepareLeadForReview({externalId:'demo_003',businessId:'demo_business',name:'Test',value:-10}),/Invalid lead value/);
});
