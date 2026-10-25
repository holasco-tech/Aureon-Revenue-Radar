-- Additive test-only audit trail. Never execute against production without review.
CREATE TABLE IF NOT EXISTS integration_lead_review_events (
 id TEXT PRIMARY KEY,
 business_id TEXT NOT NULL,
 external_id TEXT NOT NULL,
 previous_state TEXT NOT NULL CHECK(previous_state IN ('pending_human_approval','approved','rejected')),
 new_state TEXT NOT NULL CHECK(new_state IN ('approved','rejected')),
 reviewer_id TEXT NOT NULL,
 reason TEXT NOT NULL,
 reviewed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (business_id,external_id) REFERENCES integration_lead_assessments(business_id,external_id)
);
CREATE INDEX IF NOT EXISTS idx_integration_review_events_lead
ON integration_lead_review_events(business_id,external_id,reviewed_at);
