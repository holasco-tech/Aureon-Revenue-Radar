-- One-time request IDs prevent signed requests from being replayed within the freshness window.
CREATE TABLE IF NOT EXISTS integration_webhook_nonces (
  business_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (business_id, request_id)
);
CREATE INDEX IF NOT EXISTS idx_integration_webhook_nonces_received
ON integration_webhook_nonces (received_at);
