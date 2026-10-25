# Sales & Revenue Recovery integration audit (2026-10-25)

## Scope
Static inspection of `worker.js`, `schema.sql`, `wrangler.example.toml`, and the public CRM Assistant README. No live Cloudflare, D1, Gemini, Gmail or n8n execution was performed.

## Confirmed existing components
- Revenue Radar: Cloudflare Worker, owner login with signed cookie, D1 lead import/query, action status tracking, deterministic ranking, optional Gemini analysis.
- CRM Assistant: documented n8n + Gemini + Pinecone + Sheets + Gmail workflow, portfolio screenshots and demo. Runtime configuration and webhook behavior remain unverified.

## Issues to address before connecting real customer data
1. **Single-owner security model**: all authenticated users share the owner session; `businessName` is supplied by the client and can select records for any business in the same D1 database. Do not expose this as a multi-tenant SaaS. Add per-account identity, authorization and scoped queries before onboarding multiple businesses.
2. **No integration endpoint yet**: the existing `POST /api/leads/import` replaces the business's entire lead list. An n8n webhook should not call it for individual incoming leads. Add an authenticated idempotent single-lead upsert endpoint instead.
3. **Untrusted action identity**: `POST /api/action` accepts a client-provided `leadKey` and lead fields. For multi-user use, derive identity server-side and verify that the lead belongs to the authorized account.
4. **Import semantics**: the import deletes and reinserts the selected business's leads. Confirm what happens to linked action rows, old lead keys, duplicate names/services and concurrent updates. Protect data with tests and an explicit replacement confirmation.
5. **Authentication hardening**: the login endpoint has no visible rate limiting in the inspected Worker. Add edge rate limiting and audit logging before public production use.
6. **AI data handling**: `POST /api/ask` accepts lead records from the client and sends a facts packet to Gemini. Define data minimization, retention and customer consent before processing real personal information.
7. **CSV parsing**: browser `splitCSVLine` handles quotes within a single line, but the line-based parser cannot correctly process multiline quoted CSV cells. Add a standards-compliant parser and fixtures.
8. **Secrets and demo isolation**: keep credentials out of GitHub, use fictional records for demos, and keep any live n8n credentials private.

## Safe implementation order
1. Add automated tests for authentication, imports, lead scoring, action status and CSV edge cases.
2. Design a versioned lead payload with stable external ID, source, consent metadata and timestamps.
3. Add a signed service-to-service webhook with replay protection, input validation and idempotent upsert.
4. Connect a sandbox n8n workflow; assert one incoming inquiry creates exactly one CRM record and preserves existing leads.
5. Add account isolation before onboarding multiple clients; verify cross-account access is rejected.
6. Record a demo using synthetic leads; validate logs and errors; only then prepare a paid implementation offer.

## Acceptance criteria for the first demo
- Three synthetic inquiries create three distinct persisted leads; replaying one creates no duplicate.
- No existing leads are deleted by an incoming inquiry.
- Lead scoring and status updates survive reloads.
- Unauthorized and cross-account requests fail.
- No real customer data or credentials are present in the demo or public repository.

## Commercial positioning
Sell a scoped, customized implementation first. Do not claim this repository is a production-ready multi-tenant SaaS, that leads automatically generate revenue, or that n8n/Gmail integrations are tested until verified.
