// Deterministic, explainable lead prioritization for development testing.
// No AI calls, external requests, or customer messages are sent.
export function prioritizeLead(lead) {
  if (!lead || typeof lead !== 'object' || Array.isArray(lead)) throw new TypeError('Lead must be an object');
  const value = Number(lead.value ?? 0);
  if (!Number.isFinite(value) || value < 0) throw new TypeError('Invalid lead value');
  const status = String(lead.status ?? '').trim().toLowerCase();
  const source = String(lead.source ?? '').trim().toLowerCase();
  const score = Math.min(100,
    (value >= 5000 ? 40 : value >= 1000 ? 25 : value > 0 ? 10 : 0) +
    (/(ready|urgent|quote|book|purchase)/.test(status) ? 35 : /(inquiry|interested|new)/.test(status) ? 15 : 0) +
    (/(referral|returning)/.test(source) ? 20 : /(website|whatsapp)/.test(source) ? 10 : 0));
  return {
    score,
    priority: score >= 70 ? 'high' : score >= 35 ? 'medium' : 'low',
    suggestedAction: score >= 70 ? 'Review promptly for personal follow-up' : score >= 35 ? 'Review and schedule follow-up' : 'Review when capacity allows',
    requiresHumanApproval: true,
    model: 'deterministic-v1'
  };
}
