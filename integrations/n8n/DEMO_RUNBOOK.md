# Aureon Revenue Radar — local sales demo runbook

## Purpose
Show an international client a working lead-intake and follow-up dashboard without buying cloud n8n hosting. **Staging only**. The demo runs while the Windows laptop and local n8n process are running.

## Confirmed in staging (25 October 2026)
- An authenticated POST from local n8n returned `{"ok":true,"accepted":true}`.
- Repeating the same `event_id` returned `{"ok":true,"duplicate":true}`.
- Staging D1 independently showed one integration event and one linked lead for `test-1792915500346`.
- The staging Worker is `aureon-radar-integration-test`. Production Worker and D1 are separate.

## Demo preparation (no paid services)
1. Start the locally hosted n8n process on Windows and open `http://localhost:5678`.
2. Open the existing **Aureon Revenue Radar — Test Lead Intake** workflow.
3. Keep the HTTP Request node aimed at `https://aureon-radar-integration-test.hello-aureonai.workers.dev/api/integrations/leads`. Use n8n **Bearer Auth credentials**, never a token inside workflow JSON or screenshots.
4. Keep customer messaging disabled. The system records enquiries; it does not automatically reply.
5. Open the staging Aureon dashboard in a second browser tab. Do not use real customer personal data for the demo.
6. Prepare a synthetic website enquiry using the Test Lead Webhook, and a synthetic email sent to a dedicated demo inbox.
7. Capture the dashboard before the test, submit one event, refresh, then replay the **identical** `event_id`. Show one event and one linked lead in the dashboard/database.

## Gmail trigger safeguards
- Use a dedicated test mailbox or a Gmail search filter/label containing only demo enquiries. Do not connect an unrestricted personal inbox for client demonstrations.
- Filter out automated responses, newsletters, receipts, and spam before the HTTP Request node.
- Only submit a Gmail event if it has a real stable Gmail message ID, an identifiable sender, and relevant service/enquiry content. **Do not generate a fresh timestamp fallback for missing message IDs**, as that defeats idempotency.
- Review the Gmail Trigger node's configured label/search and polling schedule before enabling the workflow.
- Gmail messages should remain unread/read according to the chosen workflow; avoid deleting or moving them without client approval.
- If the existing **If** node filters Gmail enquiries, connect its **true** branch to the HTTP Request node. The website webhook path can connect separately through its normalizer.
- Do not publish the workflow until a Gmail test message has passed the filter and a non-enquiry message has been rejected.

## 90-second demo script
0–15s: Introduce the problem: businesses lose sales enquiries scattered across inboxes and forms.
15–35s: Send a synthetic website lead into the local n8n webhook and show the execution graph.
35–55s: Refresh the staging dashboard to show the new enquiry, source, service and status.
55–70s: Replay the same event; show `duplicate:true` and explain duplicate protection.
70–90s: Show the follow-up status controls (Not contacted, Contacted, Won, Lost). Explain that a paying client can connect their approved Gmail/website/WhatsApp Business sources and choose hosting.

## Deployment and sales boundaries
- Local n8n stops when the laptop/process stops; do not promise 24/7 automation in this configuration.
- Gmail trigger requires appropriate OAuth credentials and a running n8n instance.
- Other channels (WhatsApp, Instagram, Facebook) require approved platform APIs, permissions, and separate integration work; they are **not** connected by this demo.
- Production deployment, tenant isolation, data retention, opt-in, client-specific workflows, monitoring and cloud hosting are paid-client implementation stages.
- No real client data, passwords, access tokens, or OAuth refresh tokens in public videos or screenshots.
- Keep the integration pull request draft until production migration, rollback and security review are complete.
