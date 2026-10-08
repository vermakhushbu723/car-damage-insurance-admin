import dayjs from 'dayjs';

// Fixed option lists of the service-configuration screens. All data itself
// (branches, users, templates, rules, ...) comes from admin-service.

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

// Example values that fill the placeholders in the template preview.
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

// ---------- Communication setup ----------
export const COMM_STAGES = ['Intimation', 'Surveyor Assignment', 'Claim Details', 'AI ILA', 'Handler ILA', 'FLA', 'Payment Recommendation', 'Survey Fee Bill'];
export const COMM_CHANNELS = ['SMS', 'Email', 'Whats App', 'In App'];
export const COMM_RECIPIENTS = ['Insured', 'Claim Handler', 'Surveyor', 'Workshop', 'RM', 'Approver RM'];
export const SEND_TIMINGS = ['Immediately', 'After 1h', 'After 4h', 'After 24h'];
export const REMINDER_OPTIONS = ['--', '4h/8h', '24h', '24h/48h', '48h'];

// ---------- Claim journey ----------
export const JOURNEY_STAGES = {
    saas: ['Intimation', 'Handler Allocation', 'Surveyor Allocation', 'Claim Details', 'AI ILA', 'Handler ILA', 'FLA', 'Recommendation', 'Approval', 'Settlement', 'DMS'],
    full: ['Intimation', 'Handler Allocation', 'Surveyor Allocation', 'Claim Details', 'AI ILA', 'Handler ILA', 'FLA', 'Recommendation', 'Approval', 'Survey Fee Bill', 'Settlement', 'DMS'],
};
