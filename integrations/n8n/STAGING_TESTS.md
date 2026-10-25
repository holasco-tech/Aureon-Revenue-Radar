# Staging validation checklist

Do not run against production before reviewing the draft PR.

## Preparation
1. Install dependencies for Cloudflare Wrangler in a local checkout.
2. Apply `schema.sql` and then `integrations/n8n/ingestion-schema.sql` to a **staging** D1 database.
3. Configure `AUREON_INGEST_TOKEN` and `AUREON_INGEST_BUSINESS` as staging Worker secrets. Never commit these values.
4. Deploy to staging or run Wrangler locally, then configure the workflow HTTP Request node with the staging URL and an n8n credential.

## Required test cases
| Test | Expected |
| --- | --- |
| Missing bearer token | HTTP 401 |
| Wrong bearer token | HTTP 401 |
| Invalid JSON | HTTP 400 |
| Missing event_id, name or service | HTTP 400 |
| Invalid or negative value | HTTP 400 |
| First valid event | HTTP 202 and one lead |
| Replay of identical event_id | HTTP 200, duplicate true, no additional lead |
| Two distinct events for same contact | Both events recorded, one lead |
| Customer-supplied business_id differs from configured business | Record stays under configured business |
| Concurrent identical requests | One accepted event and one duplicate acknowledgement |
| Worker missing migration | HTTP 503; no partial lead saved |
| Existing owner login and CSV import | Remain functional |

## Important limitations
- The current implementation is a **single configured business integration**, not a multi-tenant SaaS.
- The demo workflow is not activated and must not be used with real customer data before validation.
- The contact is used for deterministic deduplication but is not stored in the current leads table.
- Customer reply automation is intentionally out of scope.
- Rate limiting, provider-specific webhook signature checks, and production observability still need implementation before internet-facing production use.
