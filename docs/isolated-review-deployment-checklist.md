# Isolated review deployment gate

Scope: **test resources only**. Never deploy this branch to the production Worker or production D1 without separate explicit approval.

## Current state
- GitHub development branch: `audit/sales-recovery-integration`
- Isolated Worker: `aureon-radar-integration-test`
- Isolated D1: `aureon-revenue-radar-integration-test`
- Production D1: `aureon-revenue-radar-db` — **do not modify**
- Migrations 0001–0005 exist in isolated D1; review decisions are protected by a pending-state trigger and unique decision index.
- Existing isolated Worker supports signed webhook and synthetic scheduled handler; no Cron Triggers should be configured.
- The development `worker.js` contains the complete dashboard, signed webhook, owner login, review page, queue, and decision API. It has **not** been deployed to the isolated Worker.

## Predeployment checks
1. Confirm GitHub Actions passes on the exact commit being deployed; run `node --check worker.js` and `node --test tests/*.test.mjs`.
2. Save the active test Worker version ID and full script content or a reproducible previous deployment; do not rely on a version ID alone for recovery.
3. Verify isolated D1 binding `AUREON_DB`, owner login secrets, `AUREON_WEBHOOK_SECRET`, and `AUREON_WEBHOOK_BUSINESS_ID` remain present. Never print secret values.
4. Confirm test D1 tables and migrations 0001–0005. Verify no Cron Triggers.
5. Confirm the Worker deployment mechanism can deploy all module imports (`integration/*.mjs`) together. **Do not paste `worker.js` alone**: it imports modules that must be bundled.
6. Confirm deployed Worker hostname, owner login and signed-session cookie flow. Keep the environment separate from production.
7. Only then deploy to isolated Worker; do not use production routes or secrets.

## Postdeployment smoke tests
1. `GET /health` (if supported by the deployed script) and owner login still function.
2. Anonymous `GET /review` redirects; anonymous `GET /api/integrations/review-queue` returns 401.
3. Authenticated `GET /review` renders the review page; authenticated queue shows only pending test-business leads.
4. A signed webhook creates one synthetic pending assessment; an unsigned webhook is rejected; replay of same signed request is rejected.
5. Owner approves one synthetic lead with a reason: state changes to approved and **exactly one** audit event is recorded.
6. A second attempt to reject the same lead returns conflict; state and audit remain unchanged.
7. Cross-business review is rejected. Expired/invalid owner session is rejected. Wrong Origin on POST is rejected.
8. Confirm no messages, emails, WhatsApp calls, or other customer outreach were made.
9. Delete only synthetic records and confirm no Cron Triggers remain.

## Rollback
If any smoke test fails, restore the previously saved isolated Worker deployment and verify `/health` and webhook functionality. Leave test D1 migrations intact unless there is a verified schema issue. Do not roll back production because it must never be touched.

## Release gate
Production rollout is **blocked** until isolated end-to-end tests pass, deployment is reproducible, and the user separately approves production changes.
