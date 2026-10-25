// Pure review decisions; no outbound contact or automatic execution.
export const REVIEW_DECISIONS=Object.freeze(['approved','rejected']);
export function validateReview(input){
 if(!input||typeof input!=='object')throw new Error('Review input required');
 const {businessId,externalId,decision,reviewerId,reason}=input;
 for(const [key,value] of Object.entries({businessId,externalId,reviewerId,reason})){
  if(typeof value!=='string'||!value.trim()||value.length>500)throw new Error('Invalid '+key);
 }
 if(!REVIEW_DECISIONS.includes(decision))throw new Error('Invalid review decision');
 return {businessId:businessId.trim(),externalId:externalId.trim(),decision,reviewerId:reviewerId.trim(),reason:reason.trim()};
}
export function reviewStatements(db,input,eventId){
 const r=validateReview(input);
 if(typeof eventId!=='string'||!/^review_[a-zA-Z0-9_-]{8,100}$/.test(eventId))throw new Error('Invalid review event id');
 return [
  // Insert first: UNIQUE index + pending-state trigger serialize competing reviewers.
  // If the second statement fails, D1's transactional batch rolls back the audit insert.
  db.prepare("INSERT INTO integration_lead_review_events (id,business_id,external_id,previous_state,new_state,reviewer_id,reason) VALUES (?1,?2,?3,'pending_human_approval',?4,?5,?6)").bind(eventId,r.businessId,r.externalId,r.decision,r.reviewerId,r.reason),
  db.prepare("UPDATE integration_lead_assessments SET review_state=?1,updated_at=CURRENT_TIMESTAMP WHERE business_id=?2 AND external_id=?3 AND review_state='pending_human_approval'").bind(r.decision,r.businessId,r.externalId)
 ];
}
export async function applyReview(db,input,eventId){
 const r=validateReview(input);
 // Preflight gives clear errors; the database UNIQUE index and trigger are the
 // authoritative concurrency guard. Requires migrations 0004 and 0005.
 const row=await db.prepare("SELECT review_state FROM integration_lead_assessments WHERE business_id=?1 AND external_id=?2").bind(r.businessId,r.externalId).first();
 if(!row) return {ok:false,error:'not_found'};
 if(row.review_state!=='pending_human_approval')return {ok:false,error:'already_reviewed'};
 const statements=reviewStatements(db,r,eventId);
 try { await db.batch(statements); }
 catch (error) {
  if(/UNIQUE constraint failed|lead is not pending human approval/i.test(String(error))) return {ok:false,error:'already_reviewed'};
  throw error;
 }
 return {ok:true,state:r.decision};
}
