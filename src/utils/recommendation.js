// Recommendation Engine: which rule decides a claim's recommendation.
// Rules are checked top to bottom (active only); the first match wins.
//   check 'critical-fraud'  -> claim is on hold or has an open trigger in the Critical routing band
//   check 'amount-at-most'  -> claim amount <= threshold
//   check 'amount-above'    -> claim amount >  threshold
// A rule's stage limits it to claims in that stage ("Payment Recomendation"
// and "Fraud trigger" apply to every claim waiting for a recommendation).

export const RECOMMENDATION_STAGES = ['AI ILA', 'ILA', 'FLA'];
export const OPEN_TRIGGER = ['Open', 'Under review', 'Escalated'];
export const CHECKS = [
    { value: 'amount-at-most', label: 'Amount up to (₹)' },
    { value: 'amount-above', label: 'Amount above (₹)' },
    { value: 'critical-fraud', label: 'Critical fraud trigger open' },
];

const STAGE_CLAIMS = { ILA: ['AI ILA', 'ILA'], FLA: ['FLA'] };

/** Lowest score of the active Critical routing row ("50" or "50-100"). */
export const criticalScore = (matrix = []) => {
    const row = matrix.find((r) => r.active && r.severity === 'Critical');
    return row ? Number(String(row.score).split('-')[0]) || 50 : 50;
};

/** -> { rule, result } or null when no rule matches (manual review). */
export function recommend(claim, rules, { triggers = [], critical = 50 } = {}) {
    for (const r of rules) {
        if (r.status !== 'Active' || !r.check) continue;
        const stages = STAGE_CLAIMS[r.stage];
        if (stages && !stages.includes(claim.stage)) continue;
        const amount = Number(claim.amount) || 0;
        const hit = r.check === 'critical-fraud'
            ? claim.onHold || triggers.some((t) => t.claim === claim.id && OPEN_TRIGGER.includes(t.status) && Number(t.score) >= critical)
            : r.check === 'amount-at-most' ? amount <= r.threshold
                : r.check === 'amount-above' ? amount > r.threshold : false;
        if (hit) return { rule: r, result: r.result };
    }
    return null;
}
