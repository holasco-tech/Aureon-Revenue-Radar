-- Apply to a test D1 database before enabling the integration endpoint.
-- External identifiers are unique per configured business. No destructive import.
CREATE TABLE IF NOT EXISTS integration_leads (
  business_id TEXT NOT NULL,
  external_id TEXT NOT NULL,
  lead_name TEXT NOT NULL,
  service TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  lead_status TEXT NOT NULL DEFAULT '',
  lead_value REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (business_id, external_id)
);
CREATE INDEX IF NOT EXISTS idx_integration_leads_updated
ON integration_leads (business_id, updated_at);
