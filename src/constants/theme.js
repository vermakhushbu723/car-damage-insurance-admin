// Single source of truth for the brand palette + antd ConfigProvider theme.
// Sizes are intentionally a notch smaller than the Figma frames (those are
// drawn at presentation scale) so the admin panel reads clean and dense.

export const COLORS = {
    // Brand blues
    primary: '#0B4CD0',
    primaryDark: '#0839A3',
    primarySoft: '#C3D4F5',
    sidebarBg: '#0B4CD0',
    sidebarItemActiveBg: '#3F72E0',
    topbarBg: '#83A4E6',

    // Text
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    headingBlue: '#0B4CD0',
    white: '#FFFFFF',

    // Surfaces
    bgApp: '#FFFFFF',
    bgCard: '#FFFFFF',
    bgField: '#F3F4F6',
    bgSoftBlue: '#E6EEFB',
    bgBanner: '#C3D4F5',
    tableHead: '#F8F9FB',
    border: '#E2E8F0',

    success: '#16A34A',
    danger: '#DC2626',
    warning: '#F59E0B',
};

// Status badge palette -- every table's Status/Stage chip resolves through
// here (see components/ui/StatusTag.jsx) so a new status is a one-line add.
export const STATUS_STYLES = {
    Active: { bg: '#D1EEDD', color: '#1E8E4E' },
    Success: { bg: '#D1EEDD', color: '#1E8E4E' },
    Connected: { bg: '#D1EEDD', color: '#1E8E4E' },
    Ready: { bg: '#D1EEDD', color: '#1E8E4E' },
    'Up to Date': { bg: '#D1EEDD', color: '#1E8E4E' },
    ILA: { bg: '#D1EEDD', color: '#1E8E4E' },
    Pending: { bg: '#FDEBC8', color: '#E89A0C' },
    Warning: { bg: '#FDEBC8', color: '#E89A0C' },
    'Approval Log': { bg: '#FDEBC8', color: '#E89A0C' },
    Inactive: { bg: '#E2E8F0', color: '#64748B' },
    Suspended: { bg: '#F6CDCD', color: '#C81E1E' },
    Expired: { bg: '#F6CDCD', color: '#C81E1E' },
    Failed: { bg: '#F6CDCD', color: '#C81E1E' },
    Rejected: { bg: '#F6CDCD', color: '#C81E1E' },
    'License Expired': { bg: '#F6CDCD', color: '#C81E1E' },
    Survey: { bg: '#DCE4F5', color: '#5B7BC7' },
    'AI ILA': { bg: '#E6E3FA', color: '#8B82DA' },
    FLA: { bg: '#E0F2FE', color: '#0284C7' },
    Settled: { bg: '#D1EEDD', color: '#1E8E4E' },
    Available: { bg: '#E6EEFB', color: '#0B4CD0' },
    'On Leave': { bg: '#E0E4F7', color: '#3730A3' },
    Resigned: { bg: '#E2E8F0', color: '#64748B' },
    'High Load': { bg: '#FDEBD3', color: '#F59E0B' },
    Normal: { bg: '#D1EEDD', color: '#1E8E4E' },
    Critical: { bg: '#F6CDCD', color: '#C81E1E' },
    Open: { bg: '#C9D8F8', color: '#0B4CD0' },
    Closed: { bg: '#E2E8F0', color: '#64748B' },
    High: { bg: '#F6CDCD', color: '#C81E1E' },
    Medium: { bg: '#FDEBC8', color: '#E89A0C' },
    Low: { bg: '#E2E8F0', color: '#64748B' },
    'Under review': { bg: '#FDEBC8', color: '#E89A0C' },
    Escalated: { bg: '#F6CDCD', color: '#C81E1E' },
    Cleared: { bg: '#D1EEDD', color: '#1E8E4E' },
    Delivered: { bg: '#D1EEDD', color: '#1E8E4E' },
    Published: { bg: '#D1EEDD', color: '#1E8E4E' },
    Draft: { bg: '#FDEBC8', color: '#E89A0C' },
    Intimation: { bg: '#E0F2FE', color: '#0284C7' },
    Audit: { bg: '#F6CDCD', color: '#C81E1E' },
    'Handler review': { bg: '#F6CDCD', color: '#C81E1E' },
};

// Severity chips (fraud rules / approval logic cards).
export const SEVERITY_STYLES = {
    Low: { bg: '#E2E8F0', color: '#64748B' },
    Medium: { bg: '#FDEBC8', color: '#E89A0C' },
    High: { bg: '#FBE0C3', color: '#F59E0B' },
    Critical: { bg: '#FBE0C3', color: '#F59E0B' },
};

// Communication channel pills (Stage-wise Communication Matrix).
export const CHANNEL_STYLES = {
    SMS: { bg: '#FDE3CC', color: '#F59E0B' },
    Email: { bg: '#FDE3CC', color: '#F59E0B' },
    'Whats App': { bg: '#CFEBDA', color: '#1E8E4E' },
    'In App': { bg: '#CFEBDA', color: '#1E8E4E' },
};

// Stat card icon tones (icon square bg + label color).
export const TONES = {
    blue: { bg: '#DCE6FA', color: '#0B4CD0' },
    green: { bg: '#D1EEDD', color: '#1E8E4E' },
    orange: { bg: '#FDEBD3', color: '#F59E0B' },
    red: { bg: '#F9D7D7', color: '#C81E1E' },
    purple: { bg: '#EAE4FB', color: '#7C3AED' },
    teal: { bg: '#D4EEF5', color: '#0E8AA8' },
    slate: { bg: '#E2E8F0', color: '#64748B' },
    indigo: { bg: '#E0E4F7', color: '#3730A3' },
};

// Passed to antd's <ConfigProvider theme={...}> in main.jsx.
export const antdTheme = {
    token: {
        colorPrimary: COLORS.primary,
        colorLink: COLORS.primary,
        borderRadius: 5,
        fontSize: 12,
        controlHeight: 30,
        controlHeightSM: 24,
        fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
    },
    components: {
        Button: { controlHeight: 30, fontWeight: 500, paddingInline: 12 },
        Table: {
            headerBg: COLORS.tableHead,
            headerColor: COLORS.textPrimary,
            cellPaddingBlock: 6,
            cellPaddingInline: 10,
            cellPaddingBlockMD: 6,
            cellPaddingInlineMD: 10,
            cellPaddingBlockSM: 6,
            cellPaddingInlineSM: 10,
            cellFontSize: 12,
        },
        Input: { colorBgContainer: COLORS.bgField },
        InputNumber: { colorBgContainer: COLORS.bgField },
        Select: { colorBgContainer: COLORS.bgField },
        DatePicker: { colorBgContainer: COLORS.bgField },
        Tabs: { titleFontSize: 13, horizontalItemGutter: 22 },
        Form: { itemMarginBottom: 10, verticalLabelPadding: '0 0 2px', labelFontSize: 12 },
        Modal: { titleFontSize: 15 },
        Descriptions: { itemPaddingBottom: 6 },
    },
};
