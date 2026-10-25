# Channel integration roadmap — Revenue Radar

## Principle
Every inbound channel uses a separate authorized adapter, then a shared normalization and scoring pipeline. Do not promise universal social inbox access or autonomous replies.

## Shared normalized lead
```json
{"externalId":"unique_source_event_id","businessId":"demo_business","name":"Example Lead","service":"Solar installation","source":"website","status":"new","value":2500}
```
Source event IDs must be stable across retries; do not use a new timestamp as the identity of an already-known customer enquiry. Preserve source provenance and never treat message contents as instructions to automation tools.

## Channel priorities
| Phase | Source | Integration method | Constraints |
| --- | --- | --- | --- |
| 1 | Website forms | n8n Webhook → validation → signed Radar intake | Add spam prevention, authentication, rate limits, privacy notice, and consent before public use |
| 1 | Gmail | Authorized Gmail OAuth / n8n Gmail trigger or supported polling | Filter relevant sales enquiries, avoid extracting all mailbox messages, apply least-privilege permissions |
| 2 | WhatsApp | Official WhatsApp Business Platform / approved provider | Business account, approved access, messaging rules and possible fees |
| 3 | Instagram and Facebook | Meta APIs for eligible professional/business accounts | App review, permissions and messaging policy restrictions |
| 3 | CRM | Official APIs / approved n8n connectors | Per-client credentials, field mapping, duplicate detection, bidirectional update approval |

## Processing sequence
1. Verify authorized channel event and deduplicate using source-specific IDs.
2. Filter spam and non-sales messages; preserve minimal evidence.
3. Extract structured lead fields and flag missing or ambiguous information for review.
4. Normalize and validate, including explicit tenant mapping.
5. Sign exact outbound JSON bytes with HMAC and deliver to the isolated Radar endpoint.
6. Score lead and display in owner review queue.
7. Only after explicit authorization, perform permitted follow-up actions through the originating channel.
8. Log outcomes and errors without storing raw secrets or unnecessary personal data.

## Minimum demo acceptance criteria
- Fictional website lead is normalized locally.
- Local n8n demo accepts a synthetic POST and shows preparedLead.
- Isolated Cloudflare Worker deploys full app with secure intake and review queue.
- One synthetic lead persists in isolated D1, appears in review queue, and is approved by owner.
- Wrong signatures, replayed requests, and tenant mismatch are rejected.
- No customer messages sent in demo.

## Launch safety
A local n8n installation cannot power an always-on client service while the laptop is off. Select an approved hosted n8n runtime, price hosting, configure secure credentials, monitoring, retention, backup and billing before live clients. Never store client OAuth tokens in GitHub.
