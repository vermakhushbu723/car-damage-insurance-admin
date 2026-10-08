// Fixed option lists of the claim-configuration, fraud, reports and system
// screens. The data itself comes from admin-service.

// ---------- Claims ----------
export const REGIONS = ['North', 'East', 'West', 'South', 'Central'];
export const CLAIM_TYPES = ['Motor Vehicle', 'Two Wheeler', 'Commercial Vehicle', 'Fire', 'Other'];
export const CLAIM_STAGES = ['Intimation', 'Survey', 'AI ILA', 'ILA', 'FLA', 'Settled', 'Rejected'];

// ---------- Fraud ----------
export const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];
export const FRAUD_STAGES = ['Intimation', 'Claim Details', 'AI ILA', 'Handler ILA', 'FLA', 'Recommendation', 'Payment Approval'];
export const RULE_DESIGN = [
    'Use objective evidence and configurable thresholds.',
    'Separate trigger score from final claim decision.',
    'Critical triggers can block auto approval.',
    'Every trigger and override is auditable.',
];
export const TRIGGER_STATUSES = ['Open', 'Under review', 'Escalated', 'Cleared'];

// ---------- Recommendation engine ----------
export const PAYEE_TYPES = ['Workshop', 'Ensured', 'Financer', 'Assignee', 'Nominee'];

// ---------- System settings ----------
export const RETENTION_OPTIONS = ['1 Year', '3 Years', '5 Years', '7 Years', '10 Years'];

// ---------- Audit logs ----------
export const AUDIT_MODULES = ['Claims', 'Users', 'Reports', 'System', 'Data', 'Claim Configuration', 'Fraud & Controls', 'Branches / Offices', 'Security'];
export const AUDIT_ACTIONS = ['Updated', 'Created', 'Downloaded', 'Login', 'Logout', 'Exported', 'Failed Login', 'Password Reset', 'Permission Denied'];

// ---------- Data download ----------
export const DATA_TYPES = ['Claims', 'Users', 'Survey', 'Payments', 'Audit Logs'];
export const FORMATS = ['CSV', 'Excel', 'JSON'];
