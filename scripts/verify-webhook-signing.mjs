// Offline verification of the exact HMAC signature format used by worker.js.
// Usage: node scripts/verify-webhook-signing.mjs
// No network requests, environment secrets, or real customer data.
import { webcrypto } from 'node:crypto';
import assert from 'node:assert/strict';
import { verifyWebhookSignature, webhookTimestampValid, normalizeIncomingLead } from '../integration/lead-webhook.mjs';
if (!globalThis.crypto) globalThis.crypto = webcrypto;
const secret = 'fictional-test-secret-with-at-least-32-chars';
const timestamp = String(Math.floor(Date.now()/1000));
const requestId = 'demo_request_00000001';
const rawBody = JSON.stringify({externalId:'demo_10001',businessId:'demo_business',name:'Demo Solar Customer',service:'Solar installation',source:'website-demo',status:'new',value:2500});
const input = new TextEncoder().encode(timestamp+'.'+requestId+'.'+rawBody);
const key = await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
const hex = Buffer.from(await crypto.subtle.sign('HMAC',key,input)).toString('hex');
assert.equal(await verifyWebhookSignature(secret,timestamp+'.'+requestId,rawBody,hex),true);
assert.equal(await verifyWebhookSignature(secret,timestamp+'.'+requestId,rawBody.replace('2500','2501'),hex),false);
assert.equal(await verifyWebhookSignature(secret,timestamp+'.'+'demo_request_00000002',rawBody,hex),false);
assert.equal(webhookTimestampValid(timestamp),true);
assert.equal(normalizeIncomingLead(JSON.parse(rawBody)).businessId,'demo_business');
console.log('PASS: signed fictional lead matches Worker verification; tampering rejected. No HTTP requests sent.');
