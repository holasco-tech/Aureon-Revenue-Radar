# Aureon Revenue Radar — Gmail-to-Dashboard Lead Intake Demo

## Overview
Aureon Revenue Radar helps businesses capture inbound enquiries, organize revenue opportunities, and track follow-up activity. This demo shows a working **Gmail → n8n → Aureon Revenue Radar** lead-intake pipeline using a staging environment.

## The problem
Businesses may receive customer enquiries in email and need to transfer them into a consistent lead-management workflow without manual re-entry.

## Demonstrated workflow
1. A test customer enquiry arrives in Gmail with subject **Need AI Customer Support Automation**.
2. A Gmail Trigger in a locally hosted n8n instance retrieves the message.
3. JavaScript normalizes the email into a structured lead event.
4. An IF node validates the source, service, and contact details.
5. An authenticated HTTP request posts the event to the staging Aureon integration endpoint.
6. The staging dashboard displays the lead as a **New inquiry**, with an Aureon score of **10** and follow-up status **Not contacted**.

## Verified results
- A Gmail-triggered n8n execution completed successfully.
- The HTTP integration response included `ok: true` and `accepted: true`.
- The corresponding test enquiry appeared in the staging Revenue Opportunities dashboard.
- A separate test-webhook route also completed successfully.

## Implementation
- n8n workflow for message intake and transformation
- Authenticated Cloudflare Worker ingestion API
- Cloudflare D1 storage for persisted lead and event records
- Aureon Revenue Radar web dashboard for opportunity visibility

## Scope and limitations
This is a verified **staging demonstration**, not a claim of production-ready unattended operation. Continuous 24/7 execution, automatic customer replies, all social-media channel integrations, and multi-tenant commercial deployment have **not** been validated in this demo. The n8n instance used for the demonstration runs locally. No real customer revenue or conversion uplift is claimed.

## Suitable client use cases
- Lead intake from email into a centralized dashboard
- CRM and enquiry workflow automation
- Lead prioritization and follow-up tracking
- Custom API integrations between existing business tools

## Demo publishing checklist
- Confirm any demo video conceals email addresses and authentication secrets
- Use fictional/sample metrics only when labeled illustrative
- Confirm subtitle timing and narration accuracy
- Host the final MP4 and link or embed it in the portfolio
- Obtain approval before publishing customer data or merging the integration branch
