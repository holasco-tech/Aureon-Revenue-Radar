import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { normalizeIncomingLead, leadIdentity, webhookTimestampValid, verifyWebhookSignature } from '../integration/lead-webhook.mjs';
globalThis.crypto ??= webcrypto;

test('normalizes a lead with stable identity', () => {
  const lead = normalizeIncomingLead({externalId:'lead_123', businessId:'client_7', name:'  Example Person ', value:'1250', source:'website'});
  assert.equal(lead.name, 'Example Person');
  assert.equal(lead.value, 1250);
  assert.equal(leadIdentity(lead), 'client_7:lead_123');
});
test('rejects invalid or missing identifiers and values', () => {
  for (const bad of [
    {businessId:'b',name:'Example'},
    {externalId:'x',businessId:'../bad',name:'Example'},
    {externalId:'x',businessId:'b',name:'Example',value:-2},
    {externalId:'x',businessId:'b',name:'Example',value:'not a number'},
    {externalId:'x',businessId:'b',name:''}
  ]) assert.throws(() => normalizeIncomingLead(bad));
});
test('timestamp freshness accepts only the configured window', () => {
  assert.equal(webhookTimestampValid('1792890000',1792890000000),true);
  assert.equal(webhookTimestampValid('1792889000',1792890000000),false);
  assert.equal(webhookTimestampValid('abc',1792890000000),false);
});
test('signature verifier accepts valid HMAC and rejects tampering', async () => {
  const secret='test-secret-that-is-at-least-32-characters';
  const ts='1792890000', body='{"externalId":"lead_123"}';
  const encoder=new TextEncoder();
  const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const sig=new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(ts+'.'+body)));
  const hex=Array.from(sig,b=>b.toString(16).padStart(2,'0')).join('');
  assert.equal(await verifyWebhookSignature(secret,ts,body,hex),true);
  assert.equal(await verifyWebhookSignature(secret,ts,body+'!',hex),false);
  assert.equal(await verifyWebhookSignature(secret,ts,body,'bad'),false);
});
