import dayjs from 'dayjs';
import { SEED_USERS, SEED_BRANCHES } from './seed';

// Sample data for the claim-configuration, fraud, reports and system
// screens. Copied into localStorage on first load like everything else
// (src/store/AdminStore.jsx).

const at = (daysAgo, h = 10, m = 42) => dayjs().subtract(daysAgo, 'day').hour(h).minute(m).second(0).toISOString();
const pick = (arr, i) => arr[i % arr.length];

// ---------- Claims (Claim Report, User Report, Allocation, Triggers) ----------
export const REGIONS = ['North', 'East', 'West', 'South', 'Central'];
export const CLAIM_TYPES = ['Motor Vehicle', 'Two Wheeler', 'Commercial Vehicle', 'Fire', 'Other'];
export const CLAIM_STAGES = ['Intimation', 'Survey', 'AI ILA', 'ILA', 'FLA', 'Settled', 'Rejected'];
const CUSTOMERS = ['Rohit Sharma', 'Anil Kapoor', 'Sunita Rao', 'Manish Gupta', 'Kiran Patel', 'Deepa Nair', 'Arjun Reddy', 'Pallavi Joshi', 'Vivek Oberoi', 'Rekha Menon', 'Sanjay Mishra', 'Nisha Verma'];
const HANDLERS = SEED_USERS.filter((u) => u.roleKey === 'claim-handler');
const BRANCH_REGION = { Maharashtra: 'West', Gujarat: 'West', Delhi: 'North', 'Uttar Pradesh': 'North', Rajasthan: 'North', Karnataka: 'South', 'Tamil Nadu': 'South', Telangana: 'South', Kerala: 'South', 'West Bengal': 'East', 'Madhya Pradesh': 'Central', Chhattisgarh: 'Central' };

export const SEED_CLAIMS = Array.from({ length: 48 }, (_, i) => {
    const branch = pick(SEED_BRANCHES, i * 5);
    const stage = pick(['AI ILA', 'Survey', 'ILA', 'AI ILA', 'Survey', 'FLA', 'Settled', 'Intimation', 'Settled', 'Rejected', 'Settled', 'ILA'], i);
    return {
        id: `CLM-${25648 - i}`,
        customer: pick(CUSTOMERS, i),
        type: pick(CLAIM_TYPES, i % 7 === 0 ? 3 : i % 4),
        handlerId: pick(HANDLERS, i).id,
        handler: pick(HANDLERS, i).name,
        amount: 25000 + ((i * 13417) % 160000),
        slaDays: 1 + (i % 5),
        stage,
        branchId: branch.id,
        branch: branch.name,
        region: BRANCH_REGION[branch.state] ?? 'West',
        intimatedAt: at(i % 34, 9 + (i % 8), (i * 7) % 60),
        vehicleNo: `MH ${10 + (i % 40)} AB ${1000 + i * 37}`,
    };
});

// ---------- Fraud trigger rules ----------
export const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];
export const FRAUD_STAGES = ['Intimation', 'Claim Details', 'AI ILA', 'Handler ILA', 'FLA', 'Recommendation', 'Payment Approval'];

export const SEED_FRAUD_RULES = [
    { id: 'FR-1', rule: 'Multiple Claims Same Vehicle', stage: 'Intimation', severity: 'High', score: 35, condition: 'Three claims in 90 days', action: 'Root to audit', active: true, key: 'priorClaims', threshold: 3 },
    { id: 'FR-2', rule: 'Damage Mismatch', stage: 'AI ILA', severity: 'High', score: 30, condition: 'AI Damage differs from declared loss', action: 'Angular review', active: true, key: 'mismatch' },
    { id: 'FR-3', rule: 'High Amount Expectation', stage: 'Recommendation', severity: 'Medium', score: 20, condition: 'Recommmendation exist threshold', action: 'Senior approval', active: true, key: 'amount', threshold: 50000 },
    { id: 'FR-4', rule: 'Duplicate Document', stage: 'Claim Details', severity: 'Critical', score: 50, condition: 'Same document  Hash used in another claim', action: 'Hold claim', active: true, key: 'duplicate' },
];

export const RULE_DESIGN = [
    'Use objective evidence and configurable thresholds.',
    'Separate trigger score from final claim decision.',
    'Critical triggers can block auto approval.',
    'Every trigger and override is auditable.',
];

// ---------- Trigger history ----------
export const TRIGGER_STATUSES = ['Open', 'Under review', 'Escalated', 'Cleared'];
const TRIGGER_ROWS = [
    ['CLM-10284', 'Duplicate document', 50, 'Audit', 'Sr TCT', 'Open'],
    ['CLM-10283', 'Damage mismatch', 30, 'Handler review', 'Amit das', 'Under review'],
    ['CLM-10282', 'Multiple claims', 35, 'Audit', 'Audit queue', 'Escalated'],
    ['CLM-10281', 'High amount', 20, 'Senior approval', 'RCM West', 'Cleared'],
    ['CLM-10172', 'Damage mismatch', 30, 'Handler review', 'Neha rao', 'Under review'],
    ['CLM-10091', 'Multiple claims', 35, 'Audit', 'Audit queue', 'Open'],
    ['CLM-10077', 'High amount', 20, 'Senior approval', 'RCM North', 'Cleared'],
    ['CLM-10063', 'Duplicate document', 50, 'Audit', 'Sr TCT', 'Escalated'],
    ['CLM-10040', 'High amount', 20, 'Senior approval', 'RCM South', 'Cleared'],
    ['CLM-10012', 'Damage mismatch', 30, 'Handler review', 'Rakesh shah', 'Cleared'],
];
export const SEED_TRIGGERS = TRIGGER_ROWS.map(([claim, trigger, score, route, reviewer, status], i) => ({
    id: `TRG-${String(i + 1).padStart(4, '0')}`, at: at(i * 2, 17, 48), claim, trigger, score, route, reviewer, status,
}));

// ---------- Fraud routing ----------
export const SEED_ROUTING = {
    matrix: [
        { id: 'RT-1', severity: 'Critical', score: '50', action: 'Hold Claim', recipient: 'Audit + Sr.TCT', hold: 'Yes', active: true },
        { id: 'RT-2', severity: 'High', score: '30-49', action: 'Route Review', recipient: 'NM/Audit', hold: 'No', active: true },
        { id: 'RT-3', severity: 'Medium', score: '15-20', action: 'Handler Review', recipient: 'Handler', hold: 'No', active: true },
        { id: 'RT-4', severity: 'Low', score: '1-14', action: 'Log & Monitor', recipient: 'System', hold: 'No', active: true },
    ],
    safeguards: [
        { id: 'SG-1', label: 'Critical Trigger Blocks Auto Approval', on: true },
        { id: 'SG-2', label: 'High trigger requires review action', on: true },
        { id: 'SG-3', label: 'Every routing action is logged', on: true },
        { id: 'SG-4', label: 'Override requires reason', on: true },
    ],
    stats: { autoRouted: 386, autoCleared: 18 },
};

// ---------- Recommendation engine ----------
export const PAYEE_TYPES = ['Workshop', 'Ensured', 'Financer', 'Assignee', 'Nominee'];
const PAY_CHECKS = ['Bank Detail Validation', 'Duplicate Pay Check', 'Financer Interest Check', 'Partial Payment Allowed', 'PAN/KYC Validation'];
export const SEED_RECOMMENDATION = {
    rules: [
        { id: 'RR-1', rule: 'Below authority limit', condition: 'Amount 50K', stage: 'ILA', result: 'Auto recommended', status: 'Active' },
        { id: 'RR-2', rule: 'Estimate', condition: 'Approved limit', stage: 'FLA', result: 'Auto recommended', status: 'Active' },
        { id: 'RR-3', rule: 'High amount', condition: 'Above authority', stage: 'Payment Recomendation', result: 'TCT review', status: 'Active' },
        { id: 'RR-4', rule: 'Critical fraud', condition: 'Critical trigger', stage: 'Fraud trigger', result: 'Hold', status: 'Active' },
    ],
    payValidation: Object.fromEntries(PAYEE_TYPES.map((p, pi) => [p, PAY_CHECKS.map((c, ci) => ({ id: `${p}-${ci}`, label: c, on: !(pi === 3 && ci === 2) && !(pi === 4 && ci === 3) }))])),
    stats: { pending: 64, auto: 41, manual: 18, exception: 5, avgTatMin: 138 },
};

// ---------- Approval logic ----------
export const SEED_AUTHORITY = [
    { id: 'AU-1', role: 'Claim Handler', motorOD: '25K', fire: '--', other: '10K' },
    { id: 'AU-2', role: 'TCT', motorOD: '75K', fire: '2L', other: '50K' },
    { id: 'AU-3', role: 'Sr. TCT', motorOD: '2L', fire: '10L', other: '2L' },
    { id: 'AU-4', role: 'National Manager', motorOD: 'Above Threshold', fire: 'Above Threshold', other: 'Above Threshold' },
];
export const SEED_APPROVAL_HISTORY = [
    { id: 'AH-1', date: at(9), rule: 'ILA Amount Threshold', changedBy: 'Shree Maruti', status: 'Published' },
    { id: 'AH-2', date: at(10), rule: 'Fraud Trigger Hold', changedBy: 'Anita Sharma', status: 'Published' },
];

// ---------- Claim flow: stage TAT + operating model ----------
export const SEED_STAGE_CONFIG = {
    stages: [
        { id: 'ST-1', stage: 'Intimation', owner: 'Call Center', tat: '30 Min', active: true, rule: 'Mandatory: policy, vehicle & loss details' },
        { id: 'ST-2', stage: 'Handler Allocation', owner: 'NM/RCM', tat: '15 Min', active: true, rule: 'Auto-allocate by branch & handler capacity' },
        { id: 'ST-3', stage: 'Surey Assignment', owner: 'Surveyor Manager', tat: '02 Hrs', active: true, rule: 'Assign nearest empanelled surveyor' },
        { id: 'ST-4', stage: 'Claim Details', owner: 'Claim Handler', tat: '04 Hrs', active: true, rule: 'All mandatory documents uploaded' },
        { id: 'ST-5', stage: 'AI ILA', owner: 'AI+Handler', tat: '02 Hrs', active: true, rule: 'AI assessment on uploaded photos' },
        { id: 'ST-6', stage: 'Handler ILA', owner: 'Claim Handler', tat: '04 Hrs', active: true, rule: 'Handler verifies AI assessment' },
        { id: 'ST-7', stage: 'FLA', owner: 'FLA/Surveyor', tat: '02 Hrs', active: true, rule: 'Final loss assessment after repair' },
        { id: 'ST-8', stage: 'Recomendation', owner: 'TCT/Sr TCT', tat: '04 Hrs', active: true, rule: 'Within authority matrix' },
        { id: 'ST-9', stage: 'Approval', owner: 'Authority', tat: '02 Hrs', active: true, rule: 'Approval logic rules must pass' },
        { id: 'ST-10', stage: 'Payment', owner: 'Finance/LOS', tat: '04 Hrs', active: true, rule: 'Pay validation checks pass' },
    ],
    operatingModel: {
        saas: {
            banner: 'SaaS Can Expose Recommendation & Approval Based On Insurer Configuration',
            rows: [['Surveyor Assignment', 'Configurable'], ['Recommendation', 'Available'], ['Payment Approval', 'Available'], ['Fee Bill', 'Vendor Flow Dependent']],
        },
        provider: {
            banner: 'As Service Provider, IBima Assist Runs Survey, Assessment & Fee Bill For The Insurer',
            rows: [['Surveyor Assignment', 'Managed By IBima'], ['Recommendation', 'Available'], ['Payment Approval', 'Insurer Only'], ['Fee Bill', 'Applicable']],
        },
    },
};

// ---------- System settings ----------
export const SEED_INTEGRATIONS = [
    { id: 'INT-1', name: 'Policy/LOS API', desc: 'Policy - Customer & Claim Data', detail: 'RESET API - Production', type: 'Reset API', env: 'Production', endpoint: 'https://los.abginsurance.com/api/v2', syncAt: at(15, 10, 12), status: 'Connected', responseSec: 0.8 },
    { id: 'INT-2', name: 'Vehicle/RC Verification', desc: 'Vehicle & Registration Verification', detail: 'Last sync', type: 'API', env: 'Production', endpoint: 'https://rc.vahan-gateway.in/v1', syncAt: at(0, 10, 45), status: 'Connected', responseSec: 1.1 },
    { id: 'INT-3', name: 'Communication Gateway', desc: 'SMS/Email/Whatsapp', detail: 'Response Time', type: 'Gateway', env: 'Production', endpoint: 'https://gw.ibimaassist.com/notify', syncAt: at(15, 10, 12), status: 'Warning', responseSec: 2.4 },
];

export const SEED_SYSTEM_UPDATE = {
    product: 'IBima Assist Enterprise',
    current: '2.4.1',
    environment: 'Production Environment',
    latest: '2.4.2',
    latestReleasedAt: '2026-09-19',
    maintenanceApproval: false,
    autoSecurityPatches: false,
    maintenanceMode: false,
    deployments: [
        { id: 'DP-3', version: '2.4.1', at: '2026-09-18T02:15:00', by: 'System', notes: 'Approval logic engine + claim journey modes' },
        { id: 'DP-2', version: '2.4.0', at: '2026-08-30T01:40:00', by: 'System', notes: 'Communication matrix & templates' },
        { id: 'DP-1', version: '2.3.6', at: '2026-08-02T02:05:00', by: 'System', notes: 'Security patch' },
    ],
};

export const SEED_COMPLIANCE = { auditLogin: false, retention: '7 Years', inputLogging: false, configApproval: false };
export const RETENTION_OPTIONS = ['1 Year', '3 Years', '5 Years', '7 Years', '10 Years'];

export const SEED_COMPLIANCE_LOG = [
    { id: 'CL-1', at: '2026-09-20T10:24:00', user: 'Super Admin', activity: 'Updated API Configuration', module: 'API Integration', status: 'Success' },
    { id: 'CL-2', at: '2026-09-20T10:24:00', user: 'System', activity: 'Security Patch', module: 'System Update', status: 'Success' },
    { id: 'CL-3', at: '2026-09-20T10:24:00', user: 'Super Admin', activity: 'Change Retention policy', module: 'Compilance', status: 'Approval Log' },
];

// ---------- Audit logs ----------
export const AUDIT_MODULES = ['Claims', 'Users', 'Reports', 'System', 'Data', 'Claim Configuration', 'Fraud & Controls', 'Branches / Offices', 'Security'];
export const AUDIT_ACTIONS = ['Updated', 'Created', 'Downloaded', 'Login', 'Exported', 'Failed Login', 'Password Reset', 'Permission Denied'];
const AUDIT_ROWS = [
    ['Raj Kumar', 'National Manager', 'Updated ILA', 'Updated', 'Claims', 'Success'],
    ['Raj Kumar', 'National Manager', 'Allocation Load', 'Created', 'Users', 'Success'],
    ['Raj Kumar', 'National Manager', 'User Managment', 'Downloaded', 'Reports', 'Success'],
    ['Raj Kumar', 'National Manager', 'Updated ILA', 'Login', 'System', 'Success'],
    ['Raj Kumar', 'National Manager', 'Allocation Load', 'Exported', 'Data', 'Success'],
    ['Raj Kumar', 'National Manager', 'User Managment', 'Updated', 'Claims', 'Failed'],
    ['Sneha Singh', 'Regional Manager', 'Approval Logic', 'Updated', 'Claim Configuration', 'Success'],
    ['Arun Mehta', 'Regional Manager', 'Fraud Routing', 'Updated', 'Fraud & Controls', 'Success'],
    ['Pooja Joshi', 'State Manager', 'Branch Pune', 'Updated', 'Branches / Offices', 'Success'],
    ['Unknown', '—', 'Login attempt', 'Failed Login', 'Security', 'Failed'],
    ['Karan Malhotra', 'Call Center', 'Password', 'Password Reset', 'Security', 'Success'],
    ['Ritu Sharma', 'Claim Handler', 'Reports access', 'Permission Denied', 'Security', 'Failed'],
    ['Rakesh Kumar', 'Claim Handler', 'Claim CLM-25640', 'Updated', 'Claims', 'Success'],
    ['Neha Verma', 'National Manager', 'Users export', 'Exported', 'Data', 'Success'],
    ['Vikram Desai', 'State Manager', 'Login', 'Login', 'System', 'Success'],
    ['Unknown', '—', 'Login attempt', 'Failed Login', 'Security', 'Failed'],
];
const DEVICES = ['192.168.1.45 / Windows', '10.0.4.12 / macOS', '192.168.1.80 / Android', '10.0.2.33 / Windows'];
export const SEED_AUDIT_EVENTS = AUDIT_ROWS.map(([user, role, update, reference, module, status], i) => ({
    id: `AUD-${String(i + 1).padStart(4, '0')}`, at: at(Math.floor(i / 3), 10, 42 - i), user, role, update, reference, device: pick(DEVICES, i), module, status,
}));

export const SECURITY_BASE = { successfulLogins: 1182, failedLogins: 24, passwordResets: 18, permissionDenied: 11 };

// ---------- Data download ----------
export const DATA_TYPES = ['Claims', 'Users', 'Survey', 'Payments', 'Audit Logs'];
export const FORMATS = ['CSV', 'Excel', 'JSON'];
export const SEED_DOWNLOADS = [
    ['Claims_Sep_01_to_04.csv', 'Claims', 'Ready'],
    ['Users_Aug_2026.xlsx', 'Users', 'Ready'],
    ['Audit_Log_Aug_2026.zip', 'Audit Logs', 'Expired'],
    ['Claims_Aug_15_to_31.csv', 'Claims', 'Ready'],
    ['Payments_Aug_2026.xlsx', 'Payments', 'Ready'],
    ['Data Audit_Log_Jul_2026.zip', 'Audit Logs', 'Expired'],
    ['Survey_Jul_2026.csv', 'Survey', 'Expired'],
].map(([fileName, dataType, status], i) => ({
    id: `DL-${i + 1}`, fileName, dataType, by: 'Manish Singh', at: at(30 + i * 3, 10, 30), sizeKb: 4300 - i * 310, status,
}));

// ---------- Communication logs ----------
export const SEED_COMM_LOGS = [
    ['CLM-240815', 'Documents Pending', 'Rahul Sharma', 'Whats App', 'Delivered'],
    ['CLM-240815', 'Documents Pending', 'Rahul Sharma', 'SMS', 'Failed'],
    ['CLM-240811', 'Claim Registration Confirmation', 'Anil Kapoor', 'Email', 'Delivered'],
    ['CLM-240809', 'Surveyor Assignment Notification', 'Sunita Rao', 'Whats App', 'Delivered'],
    ['CLM-240806', 'Payment Approval Alert', 'RCM West', 'In App', 'Delivered'],
    ['CLM-240802', 'Survey link self inspection', 'Kiran Patel', 'SMS', 'Failed'],
].map(([claim, communication, recipient, channel, status], i) => ({
    id: `LOG-${i + 1}`, at: at(i + 2, 10, 35), claim, communication, recipient, channel, status,
    message: `Dear ${recipient}, update on claim ${claim}: ${communication}.`,
}));

// ---------- SaaS usage (platform analytics, read-only) ----------
export const SAAS_USAGE = {
    cards: [
        { key: 'orgs', label: 'Active Organizations', value: '156', trend: '6.8%' },
        { key: 'users', label: 'Active Users', value: '3,248', trend: '10.2%' },
        { key: 'sessions', label: 'Sessons', value: '18,420', trend: '12.5%' },
        { key: 'api', label: 'API Usage', value: '84,652', trend: '9.4%' },
        { key: 'storage', label: 'Storage Used', value: '248 GB', trend: '14.2%' },
        { key: 'adoption', label: 'Feature Adoption', value: '76.3%', trend: '8.6%' },
    ],
    dauMau: [
        { day: 'Aug 26', dau: 820, mau: 2900 }, { day: 'Aug 27', dau: 2300, mau: 3100 }, { day: 'Aug 28', dau: 2350, mau: 3300 },
        { day: 'Aug 29', dau: 3350, mau: 3600 }, { day: 'Aug 30', dau: 3800, mau: 3900 }, { day: 'Aug 30 ', dau: 4200, mau: 4300 },
        { day: 'Aug 31', dau: 4550, mau: 4600 }, { day: 'Sep 01', dau: 4450, mau: 4700 }, { day: 'Sep 02', dau: 4100, mau: 4750 },
    ],
    byModule: [['Claims Management', 620], ['Survey Module', 540], ['AI ILA', 430], ['Reports', 380], ['Audit Logs', 260], ['Data Download', 200]],
    moduleTable: [
        ['Claims Management', 2642, 10420, 92, 'up-neutral'], ['Survey Module', 2710, 12420, 84, 'up'], ['AI ILA', 1842, 8920, 77, 'up'],
        ['Reports', 1584, 7620, 64, 'flat'], ['Audit Logs', 1129, 5520, 48, 'flat'], ['Data Download', 842, 3420, 30, 'down'],
        ['Communication', 760, 3110, 27, 'up'], ['Branches / Offices', 412, 1870, 18, 'flat'], ['Fraud & Controls', 388, 1640, 16, 'up'],
    ].map(([module, users, sessions, usage, trend], i) => ({ id: `MU-${i}`, module, users, sessions, usage, trend })),
};

// Weekly activity for the User Report heat map: 6 days x 12 two-hour slots (0-4 intensity).
export const HEATMAP = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, d) => ({
    day,
    slots: Array.from({ length: 12 }, (_, s) => (s < 4 ? (d + s) % 2 : s < 9 ? 2 + ((d * 3 + s) % 3) : (s + d) % 3)),
}));
