# Isolated Worker version upload

This configuration targets **only** `aureon-radar-integration-test` and its separate D1 database. Do not run it with production account overrides.

1. Confirm the latest GitHub Actions run passed and download its `aureon-radar-isolated-worker` artifact.
2. Extract the bundled `dist/aureon-radar-integration-test.mjs` file into the matching path.
3. From an authenticated Wrangler environment, run:
   `npx wrangler versions upload --config wrangler.isolated-review.jsonc --keep-vars`
4. Verify the uploaded version's bindings and preview behavior. **Do not promote the version until owner login, signed webhook, and audit review have been checked.**
5. To deploy only after verification, use Cloudflare's version deployment workflow. Keep active baseline version `532d3cd6-fe62-4f34-be08-98f73627d933` available for rollback.

The upload command creates an inactive version; it is **not** an instruction to deploy automatically. Existing secrets must be preserved. If Cloudflare reports a binding or secret mismatch, stop.
