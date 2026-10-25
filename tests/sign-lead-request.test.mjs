import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {signLeadRequest} from '../integration/sign-lead-request.mjs';
const secret='synthetic-secret-longer-than-32-characters';
test('signed request matches Worker signature protocol',()=>{
 const result=signLeadRequest(secret,{externalId:'sample_1',businessId:'demo_business',name:'Example'});
 const {body,headers}=result;
 const expected=createHmac('sha256',secret).update(headers['x-aureon-timestamp']+'.'+headers['x-aureon-request-id']+'.'+body).digest('hex');
 assert.equal(headers['x-aureon-signature'],expected);
 assert.match(headers['x-aureon-request-id'],/^[a-z0-9-]{36}$/);
});
test('new deliveries use new IDs',()=>{const a=signLeadRequest(secret,{}),b=signLeadRequest(secret,{});assert.notEqual(a.headers['x-aureon-request-id'],b.headers['x-aureon-request-id']);});
test('weak secrets rejected',()=>assert.throws(()=>signLeadRequest('short',{})));
