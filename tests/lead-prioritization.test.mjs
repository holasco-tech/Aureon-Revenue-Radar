import test from 'node:test';
import assert from 'node:assert/strict';
import {prioritizeLead} from '../integration/lead-prioritization.mjs';

test('high-intent referral is high priority but requires approval', () => {
  const result=prioritizeLead({value:6000,status:'urgent quote',source:'referral'});
  assert.equal(result.score,95);
  assert.equal(result.priority,'high');
  assert.equal(result.requiresHumanApproval,true);
});
test('ordinary website inquiry is medium priority', () => {
  const result=prioritizeLead({value:1500,status:'new inquiry',source:'website'});
  assert.equal(result.score,50);
  assert.equal(result.priority,'medium');
});
test('empty lead is low priority', () => {
  assert.equal(prioritizeLead({}).priority,'low');
});
test('rejects invalid value', () => {
  assert.throws(()=>prioritizeLead({value:-1}),/Invalid lead value/);
  assert.throws(()=>prioritizeLead(null),/Lead must be an object/);
});
