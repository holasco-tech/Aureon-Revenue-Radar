# n8n → Revenue Radar integration contract (development only)

## Deployment boundaries
- **n8n development:** local laptop at `http://localhost:5678`; it is unreachable from the public Internet and stops when the laptop is off.
- **Revenue Radar integration test:** isolated Cloudflare Worker and D1, never the production database.
- **Public demo:** fictional data only, with no outbound requests or persistence.
- Do not turn on live customer messaging, CRM writes, or paid subscriptions until a pilot is approved.

## First real flow (after full Worker deployment)
```text
Form/CRM trigger → Validate fields → Normalize lead → Sign exact JSON bytes → HTTPS POST
  → Check response / retry safely → Revenue Radar isolated D1 → Owner review queue
```

## Request
`POST https://aureon-radar-integration-test.hello-aureonai.workers.dev/api/integrations/leads`

Body example (fictional):
```json
{"externalId":"demo_10001","businessId":"demo_business","name":"Demo Solar Customer","service":"Solar installation","source":"n8n-demo","status":"new","value":2500}
```

Headers:
- `content-type: application/json`
- `x-aureon-timestamp: <current Unix timestamp in seconds>`
- `x-aureon-request-id: <unique random alphanumeric/underscore/hyphen ID, 16–128 characters>`
- `x-aureon-signature: <lowercase hex HMAC-SHA256>`

Signature calculation:
```text
HMAC_SHA256_HEX(
  AUREON_WEBHOOK_SECRET,
  timestamp + "." + requestId + "." + exactRawJsonBody
)
```

**Critical:** Signature input is the exact serialized JSON string transmitted over HTTP, not a reserialized object. The secret must be stored in n8n credentials or other protected secret storage, never in workflow exports or GitHub. Request timestamps have a 5-minute tolerance. The request ID is replay-protected and must be unique per attempt; retry handling must distinguish transport failures from successful prior ingestion.

## Implementation caveat
The existing inactive n8n JSON is a **payload preparation demo**, not an authenticated integration. A production workflow must implement HMAC signing with a verified n8n-supported method (for example an appropriately configured Crypto node or an approved signing service). Do not assume Node.js `crypto` is enabled in self-hosted n8n Code nodes: its availability depends on deployment configuration.

## Verification checklist
- [ ] Confirm full isolated Worker is deployed, not just /health test stub
- [ ] Check signature against exact body with an authorized synthetic lead
- [ ] Confirm wrong signature, expired timestamp, replayed request ID and wrong business ID are rejected
- [ ] Confirm one synthetic lead appears in isolated D1 and owner review queue
- [ ] Approve and reject distinct synthetic leads, verify audit trail
- [ ] Check idempotency and retry behavior
- [ ] Verify local n8n execution stops when laptop is off
- [ ] Choose always-on hosting and secret management before offering 24/7 support

## Commercial boundary
The $199/$499 setup and $29/$59 monthly packages are hypotheses, not launched billing plans. The n8n runtime cost and hosting/support boundaries must be priced and documented per client before taking orders.
