// Every URL in the admin portal. Pages, the sidebar and in-page links all
// read from here so a path is only ever changed in one place.
export const ROUTES = {
    LOGIN: '/login',
    HOME: '/',
    DASHBOARD: '/dashboard',
    ACTIVE_USERS: '/active-users',

    CREATE_USERS: '/users/create',
    ROLES: '/roles-permissions',
    PASSWORD_RESET: '/password-reset',
    USER_ACTIVATION: '/user-activation',

    BRANCHES: '/branches',
    DOCUMENT_TEMPLATES: '/document-templates',
    COMMUNICATION: '/communication-setup',

    CLAIM_FLOW: '/claim-flow',
    APPROVAL_LOGIC: '/approval-logic',
    RECOMMENDATION_ENGINE: '/recommendation-engine',
    ALLOCATION_LOAD: '/allocation-load',

    FRAUD_ROUTING: '/fraud-routing',
    FRAUD_TRIGGER_RULES: '/fraud-trigger-rules',
    TRIGGER_HISTORY: '/trigger-history',

    CLAIM_REPORT: '/reports/claims',
    USER_REPORT: '/reports/users',
    SAAS_USAGE: '/reports/saas-usage',
    DATA_DOWNLOAD: '/reports/data-download',

    AUDIT_LOGS: '/audit-logs',
    SYSTEM_SETTINGS: '/system-settings',
};
