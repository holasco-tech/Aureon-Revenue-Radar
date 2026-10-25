# Revenue Radar isolated integration test environment

## Cloudflare D1
- Database name: `aureon-revenue-radar-integration-test`
- Database ID: `f5f1e049-5f15-46c6-8800-646c12649888`
- This is a separate database from the existing Revenue Radar production database.
- Applied: `migrations/0001_integration_leads.sql` and `migrations/0002_webhook_replay_protection.sql`.
- Verified both `integration_leads` and `integration_webhook_nonces` exist.

## Verified against real D1 (2026-10-25)
- Insert a synthetic lead: succeeded.
- Update the same `business_id + external_id`: succeeded without a second lead.
- Reuse a `business_id + request_id` pair: rejected with SQLite UNIQUE constraint.
- Synthetic records removed; both test tables confirmed empty.

## Not yet verified
- GitHub Actions tests: no workflow run returned.
- End-to-end Worker HTTP request using HMAC and a D1 binding.
- Test Worker deployment.
- n8n workflow delivery and dashboard presentation.

## Safety requirements before test deployment
1. Use a new Worker name and bind only this test D1 database.
2. Set a new random `AUREON_WEBHOOK_SECRET` (32+ characters) and `AUREON_WEBHOOK_BUSINESS_ID=demo_business`; do not reuse production secrets.
3. Set distinct test owner login/session secrets; do not connect real customer data.
4. Deploy both ES modules (`worker.js` and `integration/lead-webhook.mjs`) as a module Worker.
5. Test valid, invalid, expired, replayed and cross-business signed requests.
6. Do not promote to production until tests pass and an operator approves.
