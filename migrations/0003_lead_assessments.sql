-- Development-only additive migration. Apply only to the isolated integration-test D1.
-- Assessments are separate from the incoming lead record and never authorize contact.
CREATE TABLE IF NOT EXISTS integration_lead_assessments (
  business_id TEXT NOT NULL,
  external_id TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  priority TEXT NOT NULL CHECK (priority IN ('low','medium','high')),
  suggested_action TEXT NOT NULL,
  model_version TEXT NOT NULL,
  review_state TEXT NOT NULL DEFAULT 'pending_human_approval'
    CHECK (review_state IN ('pending_human_approval','approved','rejected')),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (business_id, external_id),
  FOREIGN KEY (business_id, external_id)
    REFERENCES integration_leads(business_id, external_id)
);
CREATE INDEX IF NOT EXISTS idx_integration_assessments_priority
ON integration_lead_assessments (business_id, priority, updated_at);
