# Security

Do not report credentials or private customer data through a public issue.

The application expects `AUREON_OWNER_PASSWORD`, `AUREON_SESSION_SECRET`, and `GEMINI_API_KEY` to be configured as Cloudflare Worker secrets. Production D1 identifiers belong only in the untracked `wrangler.toml` file.

Public examples must use synthetic lead data. Never commit customer exports, authentication values, cookies, private URLs, or live database identifiers.

