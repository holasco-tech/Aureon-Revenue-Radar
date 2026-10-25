# Integration deployment verification (synthetic data only)

Use `wrangler.integration-test.toml`, never the production Wrangler configuration.

## 1. Local verification
```bash
node --check worker.js
node --test tests/*.test.mjs
```
Stop if either command fails.

## 2. Test Worker setup
```bash
npx wrangler secret put AUREON_WEBHOOK_SECRET --config wrangler.integration-test.toml
npx wrangler secret put AUREON_OWNER_PASSWORD --config wrangler.integration-test.toml
npx wrangler secret put AUREON_SESSION_SECRET --config wrangler.integration-test.toml
npx wrangler deploy --config wrangler.integration-test.toml
```
Use three new random secrets. The webhook secret must be at least 32 characters. This deploys to `aureon-radar-integration-test` only.

## 3. End-to-end checks
- Use `integration/sign-lead-request.mjs` to sign a synthetic lead body and POST to `/api/integrations/leads`.
- Expect 200 on valid delivery; repeat with a *new* request ID and same lead external ID to verify upsert.
- Repeat with the *same* request ID and expect 409; a tampered body/signature should return 401.
- A wrong business ID should return 403; expired timestamp should return 401.
- Verify the D1 rows and delete synthetic test data.

## Current verification boundary
As of 2026-10-25, D1 migrations, upsert, uniqueness and rollback have been verified through Cloudflare API. The full Worker deployment and HTTP checks are **not yet verified**. No production changes are authorized by this document.
