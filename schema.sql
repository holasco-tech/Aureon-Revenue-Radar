CREATE TABLE IF NOT EXISTS leads (
  lead_key TEXT PRIMARY KEY,
  business_name TEXT NOT NULL,
  lead_name TEXT NOT NULL,
  service TEXT,
  lead_value REAL NOT NULL DEFAULT 0,
  lead_status TEXT,
  days INTEGER,
  last_activity TEXT,
  priority TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leads_business_name
  ON leads (business_name);

CREATE TABLE IF NOT EXISTS lead_actions (
  lead_key TEXT PRIMARY KEY,
  business_name TEXT NOT NULL,
  lead_name TEXT NOT NULL,
  service TEXT,
  lead_value REAL NOT NULL DEFAULT 0,
  action_status TEXT NOT NULL DEFAULT 'Not contacted',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lead_actions_business_name
  ON lead_actions (business_name);

