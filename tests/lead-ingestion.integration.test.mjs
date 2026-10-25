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
  const db={
    prepare(sql) {
      if (!sql.includes('INSERT INTO integration_leads')) throw Error('Unexpected SQL operation: '+sql);
      return {bind(...args) {return {async run() {
        const [businessId,externalId,name,service,source,status,value]=args;
        rows.set(businessId+':'+externalId,{businessId,externalId,name,service,source,status,value});
        return {success:true};
      }};}};
    }
  };
  return {db,rows,existingLeads};
}
async function send(env,payload,{timestamp=now(),signature,body}={}) {
  const raw=body??JSON.stringify(payload);
  const sig=signature??await sign(timestamp,raw);
  const req=new Request('https://demo.example/api/integrations/leads',{
    method:'POST',
    headers:{'content-type':'application/json','x-aureon-timestamp':timestamp,'x-aureon-signature':sig},
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
