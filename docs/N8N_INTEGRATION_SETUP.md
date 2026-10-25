# n8n → Revenue Radar integration (development only)

This branch adds a signed `POST /api/integrations/leads` endpoint backed by a separate `integration_leads` D1 table. It is **not enabled in production** and is not yet wired into the Revenue Radar dashboard.

## Prerequisites
1. Use a separate Cloudflare Worker and test D1 database; do not point the test Worker at live customer data.
2. Apply `migrations/0001_integration_leads.sql` to the test D1 database.
3. Configure Worker secrets `AUREON_WEBHOOK_SECRET` (random, at least 32 characters) and `AUREON_WEBHOOK_BUSINESS_ID` (a stable business ID such as `demo_business`). Keep both out of GitHub.
4. Send `Content-Type: application/json`, `x-aureon-timestamp` (Unix seconds or milliseconds) and `x-aureon-signature` (lowercase hex HMAC-SHA256 of `timestamp + '.' + rawRequestBody` keyed with the webhook secret).

## Example JSON body (fictional data)
```json
{
  "externalId": "demo_001",
  "businessId": "demo_business",
  "name": "Example Customer",
  "service": "Consultation",
  "source": "website",
  "status": "new inquiry",
  "value": 1500
}
```

## Security notes
- Sign the **exact raw bytes** of the JSON body that will be sent, not a separately reserialized object.
- Timestamp freshness is 5 minutes. Identical `externalId` values update the existing row rather than adding duplicates. This is **upsert idempotency**, not full replay protection: a replay inside the time window can repeat the same update. Before real client use, add nonce storage and rejection of reused signed requests.
- A secret is scoped to one configured `businessId`. Do not reuse one Worker and one secret for unrelated customers.
- Endpoint currently stores records in `integration_leads`; it does **not** yet synchronize them to the dashboard's existing `leads` table.
- The existing `/api/leads/import` remains unchanged. Never use that endpoint for single-event n8n ingestion.
- This implementation needs runtime tests, rate limiting, monitoring, operational backup policy, and data privacy review before real customer information is processed.

## Developer tests
Run `node --test tests/lead-webhook.test.mjs` with Node 22+. GitHub Actions is configured to run these tests on the development branch. Passing helper tests does not imply that Cloudflare D1 integration has been tested.

## Next milestones
1. Run local Worker+D1 integration tests with synthetic leads and verify repeat upserts.
2. Add integration lead listing to a separate authenticated test dashboard or map to the existing schema after resolving account isolation.
3. Add nonce-based replay prevention and webhook rate limiting.
4. Test n8n against the test Worker and verify no duplicates or data loss.
