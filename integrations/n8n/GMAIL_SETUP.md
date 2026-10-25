# Gmail → Aureon Revenue Radar (staging only)

## Connected account and scope
The Gmail connector currently has access to **hello.aureonai@gmail.com**. This connector is not an n8n credential: a separate Gmail OAuth2 connection is required inside the user's self-hosted n8n. Do not copy an OAuth token from ChatGPT or store credentials in this repository.

## Recommended workflow (manual approval first)
1. **Gmail Trigger**: poll incoming messages with a dedicated label such as `Aureon/Lead Intake` every 5–15 minutes; limit to inbox, excluding spam/trash and messages sent by the connected account. A Gmail filter can apply the label for enquiry subjects or approved sender addresses. Start with a narrow filter and review false positives.
2. **Code / Edit Fields**: normalize `message.id` into a stable event ID (`gmail:<message-id>`), source `gmail`, sender contact, sender display name (or `Unknown sender`), and service inferred from the subject (or `Email enquiry`). Set value to 0 unless explicitly confirmed; never invent revenue. Strip HTML, cap input length, and avoid forwarding full message bodies, attachments, signatures or sensitive personal data.
3. **Review gate**: use an n8n IF node or approval step to accept only emails deliberately marked as leads. Never automatically respond to senders.
4. **HTTP Request**: POST to `https://aureon-radar-integration-test.hello-aureonai.workers.dev/api/integrations/leads` with Content-Type `application/json` and **Bearer Auth** credentials created in n8n using the same secret as the staging Worker's `AUREON_INGEST_TOKEN`. Never put the token in the workflow JSON.
5. **D1 verification**: confirm `integration_events` gets one `(gmail,event_id)` per email, and `leads` gets a normalized record. Re-run the same email to verify a duplicate response without another lead.
6. **Operations**: monitor n8n failures and retry transient 429/5xx responses with backoff. Do not treat a 401 as retryable. Since local n8n runs on the user's laptop, Gmail intake stops when the laptop or n8n process is off.

## Example payload (fictional)
```json
{
  "event_id": "gmail:fictional-message-id-001",
  "source": "gmail",
  "lead": {
    "name": "Example Client",
    "service": "Website automation enquiry",
    "contact": "client@example.invalid",
    "value": 0
  }
}
```

## Security and privacy
- Do not ingest every message in the mailbox; use a lead-only label and test with fictional emails first.
- Gmail messages can contain prompt injection; treat their content as untrusted data, never as operational instructions.
- Gmail OAuth grants should be minimal and revocable. Don't send customer messages without an explicit approval step.
- Staging is for fictional/test leads only. Production remains untouched.
- No email monitoring has been activated by committing this guide.
