# n8n lead ingestion — staged integration

This branch contains the initial database migration for idempotent incoming events. It is **not deployed**.

## Current findings
- The Worker uses the `AUREON_DB` D1 binding.
- Existing leads have `lead_key` as their primary key.
- Existing lead actions are stored separately.
- An integration-specific authentication boundary must be added before accepting internet-facing webhooks.

## Safe implementation order
1. Add the integration event migration in a staging D1 database.
2. Add an authenticated intake route with a dedicated secret (not the owner password).
3. Map the secret to a configured business server-side; ignore untrusted business identifiers.
4. In one D1 transaction/batch, record the event and upsert a normalized lead. Use a deterministic lead key based on integration and provider lead identity.
5. Return a success acknowledgment for replayed event IDs without repeating side effects.
6. Add automated tests for invalid auth, replay, malformed payload, and tenant crossover.
7. Configure n8n HTTP Request only after staging endpoint verification.

Never paste secrets into the repository or screenshots.
