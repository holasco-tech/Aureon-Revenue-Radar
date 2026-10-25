import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../dist/aureon-radar-integration-test.mjs';

const origin='https://aureon-radar-integration-test.hello-aureonai.workers.dev';
test('bundled review screen rejects anonymous access',async()=>{
 const response=await worker.fetch(new Request(origin+'/review'),{});
 assert.equal(response.status,302);
 assert.equal(new URL(response.headers.get('location')).pathname,'/');
});
test('bundled review queue rejects anonymous access',async()=>{
 const response=await worker.fetch(new Request(origin+'/api/integrations/review-queue'),{});
 assert.equal(response.status,401);
});
test('bundled review decisions reject anonymous access',async()=>{
 const response=await worker.fetch(new Request(origin+'/api/integrations/reviews',{method:'POST',headers:{origin,'content-type':'application/json'},body:'{}'}),{});
 assert.notEqual(response.status,200);
 assert.ok([401,403].includes(response.status));
});
