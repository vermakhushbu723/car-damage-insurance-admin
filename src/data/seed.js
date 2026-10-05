import dayjs from 'dayjs';

// Sample data the portal starts with. Everything here is copied into
// localStorage on first load (src/store/AdminStore.jsx) and edited there --
// "Reset sample data" in the sidebar profile menu brings it back.

export const INSURER_NAME = 'ABG Insurance';
export const ORGANIZATIONS = ['ABG Insurance', 'XYZ Surveyors', 'Global Insurance', 'Tayl Assistants'];

const ago = (days, hour = 10, minute = 29) => dayjs().subtract(days, 'day').hour(hour).minute(minute).second(0).toISOString();

// ---------- Branches / Offices ----------
const BRANCH_ROWS = [
    ['Mumbai HO', 'ABG Insurance', 'Mumbai', 'Maharashtra', 'Active', 'T20'],
    ['Delhi Branch', 'ABG Insurance', 'New Delhi', 'Delhi', 'Pending', 'A1'],
    ['Banglore Branch', 'XYZ Surveyors', 'Banglore', 'Karnataka', 'Suspended', 'B2'],
    ['Pune Branch', 'Global Insurance', 'Pune', 'Maharashtra', 'Active', 'J6'],
    ['Kolkata Branch', 'Tayl Assistants', 'Kolkata', 'West Bengal', 'Pending', 'J8'],
    ['Chennai Branch', 'ABG Insurance', 'Chennai', 'Tamil Nadu', 'Active', 'T20'],
    ['Hyderabad Branch', 'Global Insurance', 'Hyderabad', 'Telangana', 'Active', 'A1'],
    ['Ahmedabad Branch', 'ABG Insurance', 'Ahmedabad', 'Gujarat', 'Active', 'B2'],
    ['Jaipur Branch', 'XYZ Surveyors', 'Jaipur', 'Rajasthan', 'Pending', 'J6'],
    ['Lucknow Branch', 'ABG Insurance', 'Lucknow', 'Uttar Pradesh', 'Active', 'J8'],
    ['Nagpur Branch', 'Tayl Assistants', 'Nagpur', 'Maharashtra', 'Suspended', 'B2'],
    ['Indore Branch', 'Global Insurance', 'Indore', 'Madhya Pradesh', 'Active', 'A1'],
    ['Raipur Branch', 'ABG Insurance', 'Raipur', 'Chhattisgarh', 'Active', 'T20'],
    ['Kochi Branch', 'XYZ Surveyors', 'Kochi', 'Kerala', 'Pending', 'J6'],
];

export const SEED_BRANCHES = BRANCH_ROWS.map(([name, organization, city, state, status, cls], i) => ({
    id: `BR-${String(i + 1).padStart(3, '0')}`,
    name,
    organization,
    city,
    state,
    status,
    class: cls,
    address: `${10 + i}, Main Road, ${city}`,
    contact: `+91 98${String(10000000 + i * 734521).slice(0, 8)}`,
    createdAt: ago(60 - i * 3),
}));

// ---------- Users ----------
// [name, roleKey, organization, status, city, state, zone]
const USER_ROWS = [
    ['Neha Verma', 'national-manager', 'ABG Insurance', 'Active', 'Mumbai', 'Maharashtra', 'Pan India'],
    ['Rajesh Khanna', 'national-manager', 'ABG Insurance', 'Active', 'New Delhi', 'Delhi', 'Pan India'],
    ['Sneha Singh', 'regional-manager', 'ABG Insurance', 'Active', 'Mumbai', 'Maharashtra', 'West'],
    ['Arun Mehta', 'regional-manager', 'Global Insurance', 'Active', 'New Delhi', 'Delhi', 'North'],
    ['Kavita Rao', 'regional-manager', 'ABG Insurance', 'Pending', 'Chennai', 'Tamil Nadu', 'South'],
    ['Pooja Joshi', 'state-manager', 'ABG Insurance', 'Active', 'Pune', 'Maharashtra', 'West'],
    ['Vikram Desai', 'state-manager', 'Global Insurance', 'Active', 'Ahmedabad', 'Gujarat', 'West'],
    ['Imran Sheikh', 'state-manager', 'ABG Insurance', 'Suspended', 'Lucknow', 'Uttar Pradesh', 'North'],
    ['Rakesh Kumar', 'claim-handler', 'ABG Insurance', 'Active', 'Mumbai', 'Maharashtra', 'West'],
    ['Anjali Gupta', 'claim-handler', 'ABG Insurance', 'Active', 'Pune', 'Maharashtra', 'West'],
    ['Suresh Patil', 'claim-handler', 'Global Insurance', 'Active', 'Hyderabad', 'Telangana', 'South'],
    ['Meena Iyer', 'claim-handler', 'ABG Insurance', 'Active', 'Chennai', 'Tamil Nadu', 'South'],
    ['Deepak Yadav', 'claim-handler', 'ABG Insurance', 'Active', 'Lucknow', 'Uttar Pradesh', 'North'],
    ['Farhan Ali', 'claim-handler', 'Tayl Assistants', 'Pending', 'Kolkata', 'West Bengal', 'East'],
    ['Ritu Sharma', 'claim-handler', 'ABG Insurance', 'Inactive', 'Jaipur', 'Rajasthan', 'North'],
    ['Karan Malhotra', 'call-center', 'ABG Insurance', 'Active', 'Mumbai', 'Maharashtra', 'West'],
    ['Priya Nair', 'call-center', 'Tayl Assistants', 'Active', 'Kochi', 'Kerala', 'South'],
    ['Sunil Shetty', 'call-center', 'Tayl Assistants', 'Pending', 'Kolkata', 'West Bengal', 'East'],
    ['Aisha Khan', 'call-center', 'ABG Insurance', 'Suspended', 'New Delhi', 'Delhi', 'North'],
    ['Manoj Tiwari', 'internal-surveyor', 'ABG Insurance', 'Active', 'Indore', 'Madhya Pradesh', 'Central'],
    ['Gaurav Bansal', 'internal-surveyor', 'ABG Insurance', 'Active', 'Raipur', 'Chhattisgarh', 'Central'],
    ['Nikhil Jain', 'external-surveyor', 'XYZ Surveyors', 'Active', 'Banglore', 'Karnataka', 'South'],
    ['Harish Reddy', 'external-surveyor', 'XYZ Surveyors', 'Pending', 'Hyderabad', 'Telangana', 'South'],
    ['Sanjay Dutt', 'external-surveyor', 'XYZ Surveyors', 'Suspended', 'Jaipur', 'Rajasthan', 'North'],
    ['Lata Menon', 'investigator', 'Global Insurance', 'Active', 'Kochi', 'Kerala', 'South'],
    ['Rohit Saxena', 'investigator', 'ABG Insurance', 'Inactive', 'Lucknow', 'Uttar Pradesh', 'North'],
    ['Divya Kapoor', 'tct', 'ABG Insurance', 'Active', 'Mumbai', 'Maharashtra', 'West'],
    ['Ajay Sharma', 'tct', 'Global Insurance', 'Pending', 'Pune', 'Maharashtra', 'West'],
    ['Varun Chopra', 'sr-tct', 'ABG Insurance', 'Active', 'New Delhi', 'Delhi', 'North'],
    ['Shalini Das', 'audit', 'ABG Insurance', 'Active', 'Kolkata', 'West Bengal', 'East'],
    ['Tarun Bhatia', 'audit', 'Tayl Assistants', 'Inactive', 'Nagpur', 'Maharashtra', 'West'],
    ['Neha Verma', 'claim-handler', 'XYZ Surveyors', 'Pending', 'Banglore', 'Karnataka', 'South'],
];

// Claim load per handler (Handler Allocation & Load Summary): [total, inProgress, completed, capacity]
const HANDLER_LOAD = [[124, 22, 86, 150], [98, 38, 22, 100], [64, 18, 48, 145], [82, 56, 98, 110], [73, 72, 73, 128], [56, 48, 38, 138], [22, 54, 77, 118], [40, 12, 28, 100]];

const slug = (name) => name.toLowerCase().replace(/[^a-z]+/g, '.');
const REPORTS_TO = { 'regional-manager': 'national-manager', 'state-manager': 'regional-manager', 'claim-handler': 'state-manager', 'call-center': 'state-manager', 'internal-surveyor': 'state-manager', 'external-surveyor': 'state-manager', investigator: 'regional-manager', tct: 'state-manager', 'sr-tct': 'regional-manager', audit: 'national-manager' };

export const SEED_USERS = (() => {
    let handlerIndex = 0;
    const users = USER_ROWS.map(([name, roleKey, organization, status, city, state, zone], i) => {
        const n = i + 1;
        const user = {
            id: `USR-${String(n).padStart(4, '0')}`,
            userId: `${slug(name).split('.')[0]}.${String(100 + n)}`,
            name,
            roleKey,
            accountType: organization === 'ABG Insurance' ? 'Internal' : 'External',
            organization,
            employeeId: `EMP${String(1234567800 + n)}`,
            email: `${slug(name)}${n}@${organization.split(' ')[0].toLowerCase()}.com`,
            contact: `+91 9${String(812345600 + n * 13).slice(0, 9)}`,
            altContact: `+91 8${String(712345600 + n * 17).slice(0, 9)}`,
            department: roleKey === 'call-center' ? 'Customer Service' : roleKey.includes('surveyor') ? 'Survey & Inspection' : roleKey === 'audit' ? 'Audit & Compliance' : 'Claims',
            dateOfJoining: dayjs().subtract(200 + n * 23, 'day').format('YYYY-MM-DD'),
            city,
            state,
            region: zone === 'Pan India' ? 'All Regions' : `${zone} Region`,
            country: 'India',
            pinCode: String(400001 + n * 37),
            zones: zone === 'Pan India' ? ['North', 'South', 'East', 'West', 'Central', 'Pan India'] : [zone],
            geoRegion: state,
            geoCity: city,
            geoState: state,
            platform: roleKey.includes('surveyor') ? 'mobile' : 'web',
            effectiveFrom: dayjs().subtract(150 + n * 9, 'day').format('YYYY-MM-DD'),
            status,
            reportingManagerId: null,
            extra: {},
            profileImage: null,
            tempPassword: null,
            createdAt: ago(40 - i, 10, 29),
        };
        if (roleKey === 'claim-handler') {
            const [totalClaims, inProgress, completed, capacityLimit] = HANDLER_LOAD[handlerIndex % HANDLER_LOAD.length];
            handlerIndex += 1;
            user.handlerStats = { totalClaims, inProgress, completed, capacityLimit };
            user.extra = { city, state, branchId: SEED_BRANCHES.find((b) => b.city === city)?.id ?? SEED_BRANCHES[0].id, designation: 'Claim Handler' };
        }
        if (roleKey === 'call-center') user.extra = { shift: 'General (09:00 - 18:00)', agentCode: `CC-${1000 + n}`, languages: ['English', 'Hindi'], skills: ['FNOL Intake', 'Claim Status'] };
        if (roleKey === 'state-manager') user.extra = { designation: `State Manager — ${state}`, stateAssigned: state, surveyorAccess: true, workshopAccess: n % 2 === 0 };
        if (roleKey === 'regional-manager') user.extra = { designation: `Regional Claims Head — ${zone}`, regionName: zone, statesCovered: [state] };
        return user;
    });
    // Point each user at the first active manager one level up.
    return users.map((u) => {
        const parentRole = REPORTS_TO[u.roleKey];
        const manager = parentRole && users.find((m) => m.roleKey === parentRole && m.status === 'Active');
        return { ...u, reportingManagerId: manager ? manager.id : 'ADMIN' };
    });
})();

// ---------- Document templates ----------
export const TEMPLATE_CATEGORIES = ['Policy', 'Claims', 'Survey & Inspection', 'Renewal', 'Settlement', 'Customer Communication', 'Finance'];
export const CATEGORY_COLORS = {
    Policy: '#B9CBEF',
    Claims: '#EDBDBD',
    'Survey & Inspection': '#B5E3D3',
    Renewal: '#F8DDB0',
    Settlement: '#D6C6F5',
    'Customer Communication': '#BFE6F2',
    Finance: '#E9D3B8',
};

export const TEMPLATE_PLACEHOLDERS = ['{{insured_name}}', '{{policy_no}}', '{{claim_no}}', '{{vehicle_no}}', '{{amount}}', '{{surveyor_name}}', '{{branch_name}}', '{{date}}'];

export const SAMPLE_VALUES = {
    insured_name: 'Ajay Sharma',
    policy_no: 'ABG/MOT/2026/004512',
    claim_no: 'CLM-2026-000981',
    vehicle_no: 'MH 12 AB 4521',
    amount: '₹ 48,750',
    surveyor_name: 'Nikhil Jain',
    branch_name: 'Mumbai HO',
    date: dayjs().format('DD MMM YYYY'),
};

const TEMPLATE_ROWS = [
    ['Motor Policy Schedule', 'Policy', 'Dear {{insured_name}},\n\nPlease find the schedule for your motor policy {{policy_no}} covering vehicle {{vehicle_no}}.\n\nPolicy period starts {{date}}. Keep this schedule with your vehicle documents.\n\nRegards,\n{{branch_name}}'],
    ['Motor Claim Intimation', 'Claims', 'Dear {{insured_name}},\n\nWe have registered your claim {{claim_no}} for vehicle {{vehicle_no}} under policy {{policy_no}} on {{date}}.\n\nOur claim handler will contact you shortly.\n\nRegards,\n{{branch_name}}'],
    ['Motor Claim Intimation', 'Survey & Inspection', 'Dear {{insured_name}},\n\nSurveyor {{surveyor_name}} has been assigned to inspect vehicle {{vehicle_no}} for claim {{claim_no}}.\n\nPlease keep the vehicle available at the workshop on {{date}}.\n\nRegards,\n{{branch_name}}'],
    ['Claim Settlement Latter', 'Settlement', 'Dear {{insured_name}},\n\nYour claim {{claim_no}} has been settled for {{amount}} on {{date}}.\n\nThe amount will reach your registered bank account within 3 working days.\n\nRegards,\n{{branch_name}}'],
    ['Policy Renewal Reminder', 'Renewal', 'Dear {{insured_name}},\n\nYour policy {{policy_no}} for vehicle {{vehicle_no}} is due for renewal on {{date}}.\n\nRenew on time to keep your No Claim Bonus.\n\nRegards,\n{{branch_name}}'],
    ['Requirement Letter', 'Customer Communication', 'Dear {{insured_name}},\n\nTo process claim {{claim_no}} we need the following documents: RC copy, driving licence, repair estimate.\n\nPlease upload them by {{date}}.\n\nRegards,\n{{branch_name}}'],
    ['Survey Fee Bill', 'Finance', 'Survey fee bill for claim {{claim_no}}\n\nSurveyor: {{surveyor_name}}\nVehicle: {{vehicle_no}}\nAmount: {{amount}}\nBill date: {{date}}'],
    ['Survey Report Format', 'Survey & Inspection', 'Survey report for claim {{claim_no}}\n\nVehicle: {{vehicle_no}}\nSurveyor: {{surveyor_name}}\nAssessed loss: {{amount}}\nInspection date: {{date}}'],
    ['Claim Rejection Letter', 'Claims', 'Dear {{insured_name}},\n\nAfter review, claim {{claim_no}} under policy {{policy_no}} could not be admitted.\n\nYou may write to {{branch_name}} within 30 days of {{date}} for a review.\n\nRegards,\n{{branch_name}}'],
    ['Payment Advice', 'Finance', 'Payment advice for claim {{claim_no}}\n\nPayee: {{insured_name}}\nAmount: {{amount}}\nValue date: {{date}}'],
];

export const SEED_DOCUMENT_TEMPLATES = TEMPLATE_ROWS.map(([name, category, body], i) => ({
    id: `TPL-${String(i + 1).padStart(3, '0')}`,
    name,
    category,
    body,
    version: '4.2',
    status: 'Active',
    branchIds: SEED_BRANCHES.filter((_, bi) => (bi + i) % 3 !== 0).map((b) => b.id),
    updatedAt: ago(i % 4 === 0 ? 1 : i + 1),
}));

// ---------- Communication setup ----------
export const COMM_STAGES = ['Intimation', 'Surveyor Assignment', 'Claim Details', 'AI ILA', 'Handler ILA', 'FLA', 'Payment Recommendation', 'Survey Fee Bill'];
export const COMM_CHANNELS = ['SMS', 'Email', 'Whats App', 'In App'];
export const COMM_RECIPIENTS = ['Insured', 'Claim Handler', 'Surveyor', 'Workshop', 'RM', 'Approver RM'];
export const SEND_TIMINGS = ['Immediately', 'After 1h', 'After 4h', 'After 24h'];
export const REMINDER_OPTIONS = ['--', '4h/8h', '24h', '24h/48h', '48h'];

const RULE_ROWS = [
    ['Intimation', 'Claim Registered', 'Claim Registration Confirmation', ['Insured', 'Claim Handler'], ['SMS', 'Whats App'], 'Immediately', '--'],
    ['Intimation', 'Vehicle not at workshop', 'Vehicle not at workshop- requirement letter', ['Insured', 'Claim Handler'], ['Email', 'Whats App'], 'Immediately', '24h/48h'],
    ['Intimation', 'Document Pending', 'Document Required Initial', ['Insured', 'Claim Handler'], ['Email', 'Whats App'], 'Immediately', '24h/48h'],
    ['Intimation', 'Survey Link Generator', 'Survey link self inspection', ['Insured'], ['SMS', 'Whats App'], 'Immediately', '24h'],
    ['Surveyor Assignment', 'Surveyor Assigned', 'Surveyor Assignment Notification', ['Insured', 'Surveyor', 'Claim Handler'], ['Email', 'Whats App'], 'Immediately', '--'],
    ['Claim Details', 'Additional Document Required', 'Additional Document Required', ['Insured', 'Workshop', 'Claim Handler'], ['Email', 'Whats App'], 'Immediately', '24h/48h'],
    ['AI ILA', 'AI ILA Completed', 'ILA Assesment Completed', ['Claim Handler', 'RM'], ['Email', 'In App'], 'Immediately', '--'],
    ['Handler ILA', 'ILA Verification Pending', 'Handler ILA Pending', ['Claim Handler'], ['Email', 'In App'], 'Immediately', '24h'],
    ['FLA', 'FLA Completed', 'FLA Completion Alert', ['Claim Handler', 'RM'], ['Email', 'In App'], 'Immediately', '--'],
    ['Payment Recommendation', 'Approval Required', 'Payment Approval Alert', ['Approver RM'], ['Email', 'In App'], 'Immediately', '4h/8h'],
    ['Survey Fee Bill', 'Bill Generated', 'Survey Bill Notification', ['Claim Handler', 'RM'], ['Email', 'In App'], 'Immediately', '48h'],
];

export const SEED_COMM_RULES = RULE_ROWS.map(([stage, trigger, template, recipients, channels, initialSend, reminder], i) => ({
    id: `CR-${String(i + 1).padStart(3, '0')}`,
    stage,
    trigger,
    template,
    recipients,
    channels,
    initialSend,
    reminder,
    status: 'Active',
}));

export const SEED_COMM_TEMPLATES = [...new Set(RULE_ROWS.map((r) => r[2]))].map((name, i) => ({
    id: `CT-${String(i + 1).padStart(3, '0')}`,
    name,
    channel: RULE_ROWS.find((r) => r[2] === name)[4].join(', '),
    body: `Dear {{insured_name}}, update on claim {{claim_no}}: ${name}.`,
    status: i === 10 ? 'Inactive' : 'Active',
    updatedAt: ago(i + 1),
}));

export const SEED_CHANNELS = [
    { id: 'CH-SMS', name: 'SMS', provider: 'MSG91', senderId: 'IBIMAS', enabled: true, sentToday: 312 },
    { id: 'CH-EMAIL', name: 'Email', provider: 'SMTP (Amazon SES)', senderId: 'claims@ibimaassist.com', enabled: true, sentToday: 418 },
    { id: 'CH-WA', name: 'Whats App', provider: 'Gupshup', senderId: '+91 98200 11223', enabled: true, sentToday: 366 },
    { id: 'CH-INAPP', name: 'In App', provider: 'IBima Push', senderId: 'IBima Assist', enabled: true, sentToday: 188 },
];

// ---------- Dashboard configuration ----------
export const JOURNEY_STAGES = {
    saas: ['Intimation', 'Handler Allocation', 'Surveyor Allocation', 'Claim Details', 'AI ILA', 'Handler ILA', 'FLA', 'Recommendation', 'Approval', 'Settlement', 'DMS'],
    full: ['Intimation', 'Handler Allocation', 'Surveyor Allocation', 'Claim Details', 'AI ILA', 'Handler ILA', 'FLA', 'Recommendation', 'Approval', 'Survey Fee Bill', 'Settlement', 'DMS'],
};

export const SEED_CONFIG = {
    claimFlow: { recommendationEngine: true, autoApproval: false },
    approval: { ila: true, fla: false },
    fraud: { autoApprove: false },
    journey: {
        mode: 'saas',
        enabled: {
            saas: Object.fromEntries(JOURNEY_STAGES.saas.map((s) => [s, true])),
            full: Object.fromEntries(JOURNEY_STAGES.full.map((s) => [s, true])),
        },
    },
    approvalRules: [
        { id: 'AR-1', name: 'ILA Approval Treshold', desc: 'Assessment amount ≤ configured threshold', enabled: false },
        { id: 'AR-2', name: 'FLA Exception Check', desc: 'Exception count = 0 AND survey complete', enabled: false },
        { id: 'AR-3', name: 'Payment Amount Rule', desc: 'Amount within authority matrix', enabled: false },
        { id: 'AR-4', name: 'Fraud Trigger Hold', desc: 'Critical fraud trigger = true', enabled: false },
    ],
    approvalMatrix: [
        { id: 'AM-1', approval: 'FLA Approval', logic: 'Amount Based + Rule Engine', enabled: true },
        { id: 'AM-2', approval: 'Payment Approval', logic: 'Threshold + Exception', enabled: true },
        { id: 'AM-3', approval: 'FLA Approval', logic: 'RCM/SCM + Auto Trigger', enabled: false },
        { id: 'AM-4', approval: 'ILA Approval', logic: 'Amount Based + Rule Engine', enabled: true },
        { id: 'AM-5', approval: 'FLA Approval', logic: 'Threshold + Exception', enabled: false },
    ],
    fraudSummary: { activeRules: 4, openTriggers: 17, critical: 3 },
};

// ---------- Recent configuration changes (audit trail) ----------
const CHANGE_ROWS = [
    ['Rakesh Kumar', 'Claim Flow', 'Auto-Approval', 'OFF', 'ON'],
    ['Sneha Singh', 'Approval Logic', 'Payment Approval', 'RCM Only', 'RCM + SCM'],
    ['Arun Mehta', 'Fraud Routing', 'Non-Fraud Routing', 'SCM', 'Auto-Approve'],
    ['Pooja Joshi', 'Allocation', 'Auto-Approval', '100', '120'],
    ['Vikram Desai', 'Claim Flow', 'Payment Approval', 'OFF', 'ON'],
    ['Rakesh Kumar', 'Approval Logic', 'Non-Fraud Routing', 'RCM Only', 'RCM + SCM'],
    ['Sneha Singh', 'Allocation', 'Handler Capacity Limit', 'SCM', 'Auto-Approve'],
];

export const SEED_CHANGES = CHANGE_ROWS.map(([changedBy, module, change, oldValue, newValue], i) => ({
    id: `CHG-${String(i + 1).padStart(4, '0')}`,
    changedBy,
    module,
    change,
    oldValue,
    newValue,
    changedOn: ago(i + 2, 10, 15),
}));
