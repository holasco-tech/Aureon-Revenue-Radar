-- Test-only. Enforce one review event per lead and reject stale decisions atomically.
CREATE UNIQUE INDEX IF NOT EXISTS uq_integration_review_one_decision
ON integration_lead_review_events(business_id,external_id);
CREATE TRIGGER IF NOT EXISTS trg_integration_review_pending_only
BEFORE INSERT ON integration_lead_review_events
BEGIN
 SELECT CASE WHEN NOT EXISTS (
  SELECT 1 FROM integration_lead_assessments
  WHERE business_id=NEW.business_id AND external_id=NEW.external_id
    AND review_state='pending_human_approval'
 ) THEN RAISE(ABORT,'lead is not pending human approval') END;
END;
