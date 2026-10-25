import {prepareLeadForReview} from './prepare-lead-for-review.mjs';

// Call only after signature verification and business authorization.
// Returns a statement to include in the same D1 batch as nonce and lead writes.
// A new delivery resets assessment to pending review; it never approves contact.
export function assessmentStatement(db, input) {
  if (!db || typeof db.prepare !== 'function') throw new TypeError('D1 database is required');
  const prepared=prepareLeadForReview(input);
  const {lead,assessment}=prepared;
  const statement=db.prepare(
    'INSERT INTO integration_lead_assessments (business_id,external_id,score,priority,suggested_action,model_version,review_state) VALUES (?1,?2,?3,?4,?5,?6,?7) ' +
    'ON CONFLICT(business_id,external_id) DO UPDATE SET score=excluded.score,priority=excluded.priority,suggested_action=excluded.suggested_action,model_version=excluded.model_version,review_state=excluded.review_state,updated_at=CURRENT_TIMESTAMP'
  ).bind(lead.businessId,lead.externalId,assessment.score,assessment.priority,assessment.suggestedAction,assessment.model,'pending_human_approval');
  return {statement,prepared};
}
