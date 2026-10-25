# Aureon Revenue Radar — hybrid launch plan

## What is being sold
A hosted lead intake, prioritization, and human-review web application. Initial offer is a **customized setup and onboarding service**, followed by a **monthly hosted support subscription**. Do not advertise autonomous follow-up or revenue recovery as existing capabilities until verified.

## Proposed pilot packages (not market-validated)
- **Starter:** $199 setup + $29/month — one intake source, configured lead scoring, review dashboard, basic support.
- **Growth:** $499 setup + $59/month — up to three supported intake sources, custom rules, onboarding, monthly review.
- **Custom:** quoted after discovery — complex CRM integrations and bespoke workflows.

Prices exclude third-party CRM, messaging, paid API usage, taxes, and unusual data migration. Confirm actual infrastructure cost and payment processing before quoting. Do not promise unlimited usage.

## Sales funnel
1. Publish a clearly labeled fictional-data demonstration and short screen recording.
2. Use portfolio, Fiverr, Upwork and permission-based direct outreach to offer a discovery call.
3. Ask prospective clients about lead volume, intake sources, missed opportunities, privacy needs, and desired outcome.
4. Offer a fixed-scope pilot with written deliverables, acceptance tests, support boundaries and clear subscription cancellation terms.
5. Collect only the minimum authorized business data after a signed agreement; do not use real client data in public demos.

## Launch gates
- Full isolated Worker deployed and tested (owner login, webhook HMAC, D1 persistence, tenant isolation, manual approvals, audit history).
- Accessible mobile UI with error and empty states; secure account setup and credential rotation.
- Backups, retention/deletion policy, privacy disclosures, operational monitoring, incident response, and support process.
- Billing/subscription terms and failed-payment handling; never claim billing is implemented before it is.
- Pilot results with consent, then public sales launch.

## Demo
`demo/index.html` is an offline-capable static illustration using fictional leads and in-memory review decisions. It does **not** access D1, authenticate users, persist approvals, send messages, or bill clients. It can be hosted on a static site only after verifying the published content and URL.

## Current status
Automated unit and bundled Worker security smoke tests pass. Isolated Cloudflare environment still serves the prior webhook test Worker. The complete authenticated app is **not yet deployed or client-ready**.
