import {normalizeIncomingLead,leadIdentity} from './lead-webhook.mjs';
import {prioritizeLead} from './lead-prioritization.mjs';

// Pure transformation; does not send messages, write databases, or call an AI API.
export function prepareLeadForReview(input) {
  const lead=normalizeIncomingLead(input);
  const assessment=prioritizeLead(lead);
  return {
    identity:leadIdentity(lead),
    lead,
    assessment,
    review:{
      state:'pending_human_approval',
      automaticContactAllowed:false,
      suggestedAction:assessment.suggestedAction
    }
  };
}
