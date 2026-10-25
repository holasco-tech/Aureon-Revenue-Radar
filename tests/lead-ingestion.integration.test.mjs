import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import worker from '../worker.js';

globalThis.crypto ??= webcrypto;
const secret='this-is-a-synthetic-webhook-secret-123456789';
const now=()=>String(Math.floor(Date.now()/1000));
async function sign(timestamp,body) {
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const bytes=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(timestamp+'.'+body)));
  return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
}
function mockD1() {
  const rows=new Map();
  const existingLeads=new Map([['original','untouched']]);
  const nonces=new Set();
  const assessments=new Map();
  const db={
    prepare(sql) {
      if (!sql.includes('INSERT INTO integration_leads') && !sql.includes('INSERT INTO integration_webhook_nonces') && !sql.includes('INSERT INTO integration_lead_assessments')) throw Error('Unexpected SQL operation: '+sql);
      return {bind(...args) {return {args,async run() {
        if(sql.includes('integration_webhook_nonces'))return {success:true};
        if(sql.includes('integration_lead_assessments')){const [businessId,externalId,score,priority,suggestedAction,modelVersion,reviewState]=args;assessments.set(businessId+':'+externalId,{score,priority,suggestedAction,modelVersion,reviewState});return {success:true};}
        const [businessId,externalId,name,service,source,status,value]=args;
        rows.set(businessId+':'+externalId,{businessId,externalId,name,service,source,status,value});
        return {success:true};
      }};}};
    }
  };
  db.batch=async statements=>{
    const [nonce,lead,assessment]=statements;
    const nonceKey=nonce.args.join(':');
    if(nonces.has(nonceKey))throw Error('UNIQUE constraint failed: integration_webhook_nonces.business_id, integration_webhook_nonces.request_id');
    nonces.add(nonceKey);
    await lead.run();
    if(assessment)await assessment.run();
    return [{success:true},{success:true}];
  };
  return {db,rows,existingLeads,nonces,assessments};
}
async function send(env,payload,{timestamp=now(),signature,body,requestId=crypto.randomUUID()}={}) {
  const raw=body??JSON.stringify(payload);
  const sig=signature??await sign(timestamp+'.'+requestId,raw);
  const req=new Request('https://demo.example/api/integrations/leads',{
    method:'POST',
    headers:{'content-type':'application/json','x-aureon-timestamp':timestamp,'x-aureon-signature':sig,'x-aureon-request-id':requestId},
    body:raw
  });
  return worker.fetch(req,env);
}
function setup() {
  const storage=mockD1();
  return {...storage,env:{AUREON_DB:storage.db,AUREON_WEBHOOK_SECRET:secret,AUREON_WEBHOOK_BUSINESS_ID:'demo_business'}};
}
const sample={externalId:'sample_1',businessId:'demo_business',name:'Fictional Lead',service:'Consultation',source:'test',status:'new',value:1500};

test('authenticated webhook creates one lead and upserts on retry without touching legacy data',async()=>{
  const {env,rows,existingLeads}=setup();
  assert.equal((await send(env,sample)).status,200);
  assert.equal((await send(env,{...sample,value:1750})).status,200);
  assert.equal(rows.size,1);
  assert.equal(rows.get('demo_business:sample_1').value,1750);
  assert.equal(existingLeads.get('original'),'untouched');
});
test('rejects tampered signatures and expired timestamps',async()=>{
  const {env,rows}=setup();
  assert.equal((await send(env,sample,{signature:'0'.repeat(64)})).status,401);
  assert.equal((await send(env,sample,{timestamp:String(Math.floor(Date.now()/1000)-601)})).status,401);
  assert.equal(rows.size,0);
});
test('rejects cross-business leads and invalid input',async()=>{
  const {env,rows}=setup();
  assert.equal((await send(env,{...sample,businessId:'other_business'})).status,403);
  assert.equal((await send(env,{...sample,value:-1})).status,400);
  assert.equal(rows.size,0);
});
test('refuses unconfigured endpoint',async()=>{
  assert.equal((await send({},sample)).status,503);
});

test('duplicate signed request ID is not processed twice',async()=>{const {env,rows}=setup();const id='synthetic_request_0001';assert.equal((await send(env,sample,{requestId:id})).status,200);assert.equal((await send(env,{...sample,value:9000},{requestId:id})).status,409);assert.equal(rows.get('demo_business:sample_1').value,1500);});

test('rejects missing request ID before writing',async()=>{
 const {env,rows}=setup();
 const response=await send(env,sample,{requestId:''});
 assert.equal(response.status,400);
 assert.equal(rows.size,0);
});
test('signature cannot be reused with a different request ID',async()=>{
 const {env,rows}=setup();
 const body=JSON.stringify(sample);
 const originalId='synthetic_request_original';
 const signature=await sign(now()+'.'+originalId,body);
 const response=await send(env,sample,{body,requestId:'synthetic_request_changed',signature});
 assert.equal(response.status,401);
 assert.equal(rows.size,0);
});
test('same lead ID may be updated by a fresh signed request',async()=>{
 const {env,rows}=setup();
 assert.equal((await send(env,sample,{requestId:'synthetic_request_first'})).status,200);
 assert.equal((await send(env,{...sample,value:2500},{requestId:'synthetic_request_second'})).status,200);
 assert.equal(rows.size,1);
 assert.equal(rows.get('demo_business:sample_1').value,2500);
});

test('signed webhook stores and refreshes a pending assessment atomically',async()=>{
 const {env,rows,assessments}=setup();
 assert.equal((await send(env,sample,{requestId:'assessment_request_one'})).status,200);
 assert.equal(assessments.get('demo_business:sample_1').priority,'medium');
 assert.equal(assessments.get('demo_business:sample_1').reviewState,'pending_human_approval');
 assert.equal((await send(env,{...sample,value:6000,status:'urgent quote',source:'referral'},{requestId:'assessment_request_two'})).status,200);
 assert.equal(rows.size,1);
 assert.equal(assessments.size,1);
 assert.equal(assessments.get('demo_business:sample_1').priority,'high');
 assert.equal(assessments.get('demo_business:sample_1').reviewState,'pending_human_approval');
});

test('replayed signed delivery does not change existing assessment',async()=>{
 const {env,assessments}=setup();
 const requestId='assessment_replay_0001';
 assert.equal((await send(env,sample,{requestId})).status,200);
 const before=assessments.get('demo_business:sample_1');
 assert.equal((await send(env,{...sample,value:6000,status:'urgent quote',source:'referral'},{requestId})).status,409);
 assert.deepEqual(assessments.get('demo_business:sample_1'),before);
});
