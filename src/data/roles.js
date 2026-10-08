// Permission modules and the role-specific fields of the Create Users form.
// The roles themselves (and their permission matrices) come from
// admin-service (GET /roles); new ones added with "Add Role" show up everywhere.

export const PERMISSION_MODULES = [
    'Dashboard', 'Claim Intimation', 'Handler Allocation', 'Surveyor Assignment', 'Claim Details', 'AI ILA',
    'Handler ILA', 'FLA', 'Payment Recommendation', 'Approval', 'Survey Fee Bill', 'Document/DMS',
    'Requirement Letters', 'Communication History', 'Fraud Triggers', 'TAT & SLA', 'Workshop Empanelment',
    'Vendor Empanelment', 'Reports & Analytics', 'Data Download', 'Users & Roles', 'System Configuration', 'Audit Logs',
];

export const PERMISSION_ACTIONS = [
    { key: 'view', label: 'View' },
    { key: 'edit', label: 'Edit' },
    { key: 'create', label: 'Create' },
    { key: 'approve', label: 'Approve/Action' },
    { key: 'download', label: 'Download' },
];

/** "Call Center Agent" for the form, "Call Center" for tabs. */
export const roleFormName = (role) => role?.formName ?? role?.name ?? '';

/** Section heading over the Create Users form, as in the designs. */
export const roleFormTitle = (role) => {
    if (!role || role.level <= 3) return 'Insurer';
    return `Employee details — ${roleFormName(role)}`;
};

export const ROLE_LEVEL_HINT = 'Eg. L1=National · L2=Regional · L3=State · L4=CSM · L5=Call Center';

// ---------- Dropdown options ----------
export const ACCOUNT_TYPES = ['Internal', 'External'];
export const DEPARTMENTS = ['Claims', 'Motor Claims', 'Customer Service', 'Survey & Inspection', 'Operations', 'Finance', 'Fraud Control', 'Audit & Compliance'];
export const ACCOUNT_STATUSES = ['Active', 'Inactive', 'On Leave', 'Suspended', 'Resigned'];
export const ZONES = ['North', 'South', 'East', 'West', 'Central', 'Pan India'];
export const COUNTRIES = ['India'];
export const PLATFORMS = [
    { key: 'mobile', label: 'Mobile' },
    { key: 'web', label: 'Web' },
    { key: 'both', label: 'Both' },
];

export const STATES = [
    'Andhra Pradesh', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Karnataka', 'Kerala',
    'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

// Zone -> states, used to narrow the geography State/Region dropdowns.
export const ZONE_STATES = {
    North: ['Delhi', 'Haryana', 'Punjab', 'Rajasthan', 'Uttar Pradesh', 'Uttarakhand'],
    South: ['Andhra Pradesh', 'Karnataka', 'Kerala', 'Tamil Nadu', 'Telangana'],
    East: ['Bihar', 'Odisha', 'West Bengal'],
    West: ['Goa', 'Gujarat', 'Maharashtra'],
    Central: ['Chhattisgarh', 'Madhya Pradesh'],
};

// Role-specific extra field options
export const SHIFTS = ['Morning (06:00 - 14:00)', 'General (09:00 - 18:00)', 'Evening (14:00 - 22:00)', 'Night (22:00 - 06:00)'];
export const LANGUAGES = ['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Gujarati'];
export const SKILL_TAGS = ['FNOL Intake', 'Claim Status', 'Pre-inspection Query', 'General', 'Escalation'];
export const HANDLER_DESIGNATIONS = ['Claim Handler', 'Senior Claim Handler', 'Claim Service Manager (CSM)', 'Team Lead - Claims'];
