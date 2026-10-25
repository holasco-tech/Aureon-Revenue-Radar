# n8n → Aureon Revenue Radar integration plan

Status: design contract only; not deployed or connected.

## Goal
Receive customer enquiries from authorized channels, normalize them into leads, and route them to Aureon Revenue Radar without exposing owner credentials or permitting unaudited outbound messaging.

## Workflow
1. Receive events from a channel-specific n8n trigger (Gmail, website form, or authorized messaging provider).
2. Validate source signature/authorization, reject duplicates using provider event IDs, and filter spam.
3. Normalize the lead into the schema below. Store only necessary customer data.
4. Route to a **new dedicated ingestion API**, not the owner login or CSV import endpoint.
5. Persist and score the lead in D1. Log event ID, source, timestamp, and processing status.
6. Create an internal follow-up task or a reply draft; require business approval before sending external replies.

## Proposed event shape (not yet implemented)
```json
{
  "event_id": "provider-unique-event-id",
  "source": "website",
  "business_id": "configured-business-id",
  "received_at": "2026-10-25T06:00:00Z",
  "lead": {
    "name": "Example Customer",
    "contact": "customer@example.com",
    "service": "Consultation",
    "message": "Please send details"
  }
}
```

## Security requirements
- Do not place customer data, credentials, provider tokens, or production identifiers in this public repository.
- Use a dedicated per-business ingestion credential, stored as a secret, never the owner password or session cookie.
- Verify signatures or bearer credentials, enforce payload size limits and rate limits, and validate each field.
- Enforce business isolation server-side; never trust a client-supplied business_id without mapping it to the authenticated integration.
- Enforce event-id uniqueness for idempotency and audit all rejected/accepted requests.
- Keep provider-specific tokens in n8n credentials, not workflow exports.
- No automatic external messaging or paid API usage until explicitly configured and approved.

## Implementation checklist
- [ ] Inspect current Worker routes, D1 schema and deployment configuration.
- [ ] Add D1 tables for ingestion credentials, source events and audit records.
- [ ] Add authenticated POST /api/integrations/leads endpoint with schema validation and idempotency.
- [ ] Add integration tests for replay, bad credentials, cross-business injection, and malformed payloads.
- [ ] Export an importable n8n workflow with a test webhook and configurable endpoint.
- [ ] Test locally with synthetic lead data, then stage and deploy only after review.
- [ ] Configure individual provider channels with authorized credentials and consent.
