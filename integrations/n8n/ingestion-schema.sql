-- Apply after the existing schema.sql.
-- event_id is scoped to an integration so provider retries cannot create duplicate leads.
CREATE TABLE IF NOT EXISTS integration_events (
  integration_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  business_name TEXT NOT NULL,
  source TEXT NOT NULL,
  lead_key TEXT NOT NULL,
  received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (integration_id, event_id)
);
CREATE INDEX IF NOT EXISTS idx_integration_events_business ON integration_events (business_name, received_at);
