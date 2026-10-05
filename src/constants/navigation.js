import {
    AppstoreOutlined,
    TeamOutlined,
    UserOutlined,
    SafetyOutlined,
    LockOutlined,
    UserAddOutlined,
    EnvironmentOutlined,
    FileTextOutlined,
    MessageOutlined,
    ApartmentOutlined,
    CheckCircleOutlined,
    StarOutlined,
    ControlOutlined,
    SafetyCertificateOutlined,
    ThunderboltOutlined,
    HistoryOutlined,
    FileDoneOutlined,
    IdcardOutlined,
    FileSearchOutlined,
    DownloadOutlined,
    AuditOutlined,
    SettingOutlined,
} from '@ant-design/icons';
import { ROUTES } from './routes';

// Sidebar, grouped exactly as the reference design's section headings
// (labels keep the design's own spelling). `ready: false` = screen not
// designed yet -- the route shows a "coming soon" placeholder.
export const SIDEBAR_GROUPS = [
    {
        title: 'MAIN',
        items: [
            { key: 'dashboard', label: 'Dashboard', icon: AppstoreOutlined, path: ROUTES.DASHBOARD, ready: true },
            { key: 'active-users', label: 'Active Users', icon: TeamOutlined, path: ROUTES.ACTIVE_USERS, ready: true },
        ],
    },
    {
        title: 'USER MANAGEMENT',
        items: [
            { key: 'create-users', label: 'Create Users', icon: UserOutlined, path: ROUTES.CREATE_USERS, ready: true },
            { key: 'roles', label: 'Roles & Permissions', icon: SafetyOutlined, path: ROUTES.ROLES, ready: true },
            { key: 'password-reset', label: 'Password Reset', icon: LockOutlined, path: ROUTES.PASSWORD_RESET, ready: true },
            { key: 'user-activation', label: 'User Activation', icon: UserAddOutlined, path: ROUTES.USER_ACTIVATION, ready: true },
        ],
    },
    {
        title: 'SERVICE CONFIGURATION',
        items: [
            { key: 'branches', label: 'Branches/Offices', icon: EnvironmentOutlined, path: ROUTES.BRANCHES, ready: true },
            { key: 'document-templates', label: 'Document Templates', icon: FileTextOutlined, path: ROUTES.DOCUMENT_TEMPLATES, ready: true },
            { key: 'communication', label: 'Communication Seup', icon: MessageOutlined, path: ROUTES.COMMUNICATION, ready: true },
        ],
    },
    {
        title: 'CLAIM CONFIGURATION',
        items: [
            { key: 'claim-flow', label: 'Claim Flow', icon: ApartmentOutlined, path: ROUTES.CLAIM_FLOW },
            { key: 'approval-logic', label: 'Approval Logic', icon: CheckCircleOutlined, path: ROUTES.APPROVAL_LOGIC },
            { key: 'recommendation-engine', label: 'Recommendation Engine', icon: StarOutlined, path: ROUTES.RECOMMENDATION_ENGINE },
            { key: 'allocation-load', label: 'Allocation Load', icon: ControlOutlined, path: ROUTES.ALLOCATION_LOAD },
        ],
    },
    {
        title: 'FRAUD & CONTROLS',
        items: [
            { key: 'fraud-routing', label: 'Fraud Routing', icon: SafetyCertificateOutlined, path: ROUTES.FRAUD_ROUTING },
            { key: 'fraud-trigger-rules', label: 'Fraud Triggers Rules', icon: ThunderboltOutlined, path: ROUTES.FRAUD_TRIGGER_RULES },
            { key: 'trigger-history', label: 'Trigger History', icon: HistoryOutlined, path: ROUTES.TRIGGER_HISTORY },
        ],
    },
    {
        title: 'REPORTS & ANALYTICS',
        items: [
            { key: 'claim-report', label: 'Claim Report', icon: FileDoneOutlined, path: ROUTES.CLAIM_REPORT },
            { key: 'user-report', label: 'User Report', icon: IdcardOutlined, path: ROUTES.USER_REPORT },
            { key: 'saas-usage', label: 'SaaS  Usage Report', icon: FileSearchOutlined, path: ROUTES.SAAS_USAGE },
            { key: 'data-download', label: 'Data Download', icon: DownloadOutlined, path: ROUTES.DATA_DOWNLOAD },
        ],
    },
    {
        title: 'SYSTEM',
        items: [
            { key: 'audit-logs', label: 'Audit Logs', icon: AuditOutlined, path: ROUTES.AUDIT_LOGS },
            { key: 'system-settings', label: 'System Setings', icon: SettingOutlined, path: ROUTES.SYSTEM_SETTINGS },
        ],
    },
];

export const ALL_NAV_ITEMS = SIDEBAR_GROUPS.flatMap((g) => g.items);

// Clean names for the browser tab / topbar (the sidebar keeps the design's spelling).
const LABEL_FIXES = {
    'Communication Seup': 'Communication Setup',
    'SaaS  Usage Report': 'SaaS Usage Report',
    'System Setings': 'System Settings',
    'Fraud Triggers Rules': 'Fraud Trigger Rules',
};
export const cleanLabel = (label) => LABEL_FIXES[label] ?? label;

export function isNavItemActive(item, pathname) {
    return pathname === item.path || pathname.startsWith(`${item.path}/`);
}

export function navItemFor(pathname) {
    return ALL_NAV_ITEMS.find((i) => isNavItemActive(i, pathname)) ?? null;
}
