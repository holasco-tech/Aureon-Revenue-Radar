#!/usr/bin/env node
// Run with AUREON_STAGING_URL and AUREON_INGEST_TOKEN in the environment.
// This sends only synthetic leads to the configured endpoint.
const base = process.env.AUREON_STAGING_URL;
const token = process.env.AUREON_INGEST_TOKEN;
if (!base || !token) {
  console.error('Set AUREON_STAGING_URL and AUREON_INGEST_TOKEN; never commit credentials.');
  process.exit(2);
}
const endpoint = new URL('/api/integrations/leads', base);
if (endpoint.protocol !== 'https:') throw Error('HTTPS is required');
const id = 'smoke-' + Date.now() + '-' + Math.random().toString(36).slice(2);
const payload = {
  event_id: id,
  source: 'smoketest',
  lead: {
    name: 'Aureon Synthetic Smoke Test',
    service: 'Integration verification',
    contact: id + '@example.invalid',
    value: 1
  }
};
async function send(body, authorization) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization },
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}
function expect(actual, wanted, label) {
  if (actual.status !== wanted) throw Error(label + ': expected HTTP ' + wanted + ', got ' + actual.status + ' ' + JSON.stringify(actual.data));
  console.log('PASS', label, 'HTTP', actual.status);
}
expect(await send(payload, 'Bearer intentionally-wrong'), 401, 'wrong token');
const accepted = await send(payload, 'Bearer ' + token);
expect(accepted, 202, 'new lead');
if (!accepted.data.accepted) throw Error('new lead response missing accepted=true');
const replay = await send(payload, 'Bearer ' + token);
expect(replay, 200, 'duplicate replay');
if (!replay.data.duplicate) throw Error('replay response missing duplicate=true');
console.log('Smoke checks passed. Confirm the synthetic lead and one integration event in staging D1.');
