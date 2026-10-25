// Dependency-free validation and idempotency helpers for the proposed n8n lead webhook.
// This module does not enable an endpoint or change the deployed Worker.
export function normalizeIncomingLead(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('Lead must be an object');
  const str = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
  const externalId = str(input.externalId, 128);
  const businessId = str(input.businessId, 128);
  const name = str(input.name, 100);
  const service = str(input.service, 100);
  const source = str(input.source, 60);
  const status = str(input.status, 80);
  const rawValue = input.value === undefined || input.value === null || input.value === '' ? 0 : Number(input.value);
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(externalId)) throw new TypeError('Invalid externalId');
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(businessId)) throw new TypeError('Invalid businessId');
  if (!name) throw new TypeError('Lead name is required');
  if (!Number.isFinite(rawValue) || rawValue < 0 || rawValue > 1e12) throw new TypeError('Invalid lead value');
  return { externalId, businessId, name, service, source, status, value: rawValue };
}

export function leadIdentity(lead) {
  return lead.businessId + ':' + lead.externalId;
}

export function webhookTimestampValid(timestamp, nowMs = Date.now(), toleranceSeconds = 300) {
  if (typeof timestamp !== 'string' || !/^\d{10,13}$/.test(timestamp)) return false;
  const n = Number(timestamp);
  const ms = timestamp.length === 10 ? n * 1000 : n;
  return Number.isSafeInteger(ms) && Math.abs(nowMs - ms) <= toleranceSeconds * 1000;
}

export async function verifyWebhookSignature(secret, timestamp, rawBody, providedHex) {
  if (typeof secret !== 'string' || secret.length < 32 || typeof rawBody !== 'string') return false;
  if (typeof providedHex !== 'string' || !/^[0-9a-f]{64}$/i.test(providedHex)) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signed = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(timestamp + '.' + rawBody)));
  let mismatch = 0;
  for (let i = 0; i < signed.length; i++) mismatch |= signed[i] ^ Number.parseInt(providedHex.slice(i * 2, i * 2 + 2), 16);
  return mismatch === 0;
}
